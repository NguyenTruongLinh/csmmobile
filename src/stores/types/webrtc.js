import {flow, types, getSnapshot} from 'mobx-state-tree';

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {SignalingClient, Role} from 'amazon-kinesis-video-streams-webrtc';
import {
  KinesisVideo /*, ChannelRole as Role*/,
} from '@aws-sdk/client-kinesis-video';
import {
  KinesisVideoSignaling,
  // KinesisVideoSignalingClient as SignalingClient,
} from '@aws-sdk/client-kinesis-video-signaling';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';

import util from '../util/general';
import {
  VIDEO_MESSAGE,
  DEFAULT_REGION,
  STREAM_STATUS,
  IS_FORCE_TURN,
  USE_TRICKLE_ICE,
} from '../consts/video';

// RTC viewer
const ChannelConnectionModel = types
  .model({
    channelNo: types.number,
    channelName: types.string,
    isDataChannelOpened: types.boolean,
    // isIceCandidateOK: types.boolean,

    isLoading: types.boolean,
    error: types.string,
    connectionStatus: types.string,
  })
  .volatile(self => ({
    signalingClient: null,
    peerConnection: null,
    dataChannel: null,
    remoteStream: null,
  }))
  .actions(self => {
    let dataChannelEvents = null;

    return {
      setPeerConnection(conn) {
        self.peerConnection = conn;
      },
      setRemoteStream(stream) {
        self.remoteStream = stream;
      },
      setDataChannelStatus(isOpened) {
        self.isDataChannelOpened = isOpened;
      },
      setDataChannelEvents({onOpen, onMessage, onError, onCLose, onLowBuffer}) {
        if (!self.dataChannel) {
          console.log('GOND setting dc events............ ');
          dataChannelEvents = {
            onOpen,
            onMessage,
            onError,
            onCLose,
            onLowBuffer,
          };
          return;
        }
        self.dataChannel.onopen = onOpen;
        self.dataChannel.onmessage = onMessage;
        self.dataChannel.onerror = onError;
        // self.dataChannel.onclose = onCLose;
        // self.dataChannel.onbufferedamountlow = onLowBuffer;
      },
      setStreamStatus({isLoading, error, needReset, novideo}) {
        self.isLoading = isLoading ?? self.isLoading;
        self.error = error ?? self.error;
        self.needResetConnection = needReset ?? self.needResetConnection;
        self.novideo = novideo ?? self.novideo;
      },
      initStream: flow(function* initStream({
        region,
        accessKeyId,
        secretAccessKey,
        rtcChannelName,
        clientId,
        // endpoint,
      }) {
        const kinesisVideoClient = new KinesisVideo({
          region: region,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            // sessionToken: sessionToken,
          },
          // endpoint: endpoint,
          correctClockSkew: true,
        });
        // Get signaling channel ARN
        let describeSignalingChannelResponse = null;
        try {
          describeSignalingChannelResponse =
            yield kinesisVideoClient.describeSignalingChannel({
              ChannelName: rtcChannelName,
            });
        } catch (error) {
          console.log('[GOND] describeSignalingChannelResponse error: ', error);
          self.isLoading = false;
          self.error = VIDEO_MESSAGE.MSG_NETWORK_FAILED;
          self.openStreamLock = false;
          // self.needResetConnection = true;
          return false;
        }

        // __DEV__ &&
        //   console.log(
        //     '[GOND] - describeSignalingChannelResponse: ',
        //     describeSignalingChannelResponse
        //   );
        const channelARN =
          describeSignalingChannelResponse.ChannelInfo.ChannelARN;
        __DEV__ && console.log('[GOND] Channel ARN: ', channelARN);
        // Get signaling channel endpoints
        const getSignalingChannelEndpointResponse =
          yield kinesisVideoClient.getSignalingChannelEndpoint({
            ChannelARN: channelARN,
            SingleMasterChannelEndpointConfiguration: {
              Protocols: ['WSS', 'HTTPS'],
              Role: Role.VIEWER,
            },
          });

        // __DEV__ &&
        //   console.log(
        //     '[GOND] getSignalingChannelEndpointResponse: ',
        //     getSignalingChannelEndpointResponse
        //   );
        const endpointsByProtocol =
          getSignalingChannelEndpointResponse.ResourceEndpointList.reduce(
            (endpoints, endpoint) => {
              endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
              return endpoints;
            },
            {}
          );
        __DEV__ && console.log('[GOND] - Endpoints: ', endpointsByProtocol);

        //
        const kinesisVideoSignalingChannelsClient = new KinesisVideoSignaling({
          region: region,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
          },
          // TODO: *** check these values
          endpoint: endpointsByProtocol.HTTPS,
          correctClockSkew: true,
        });

        // Get ICE server configuration
        const iceServers = [];
        if (IS_FORCE_TURN) {
          iceServers.push({
            urls: `stun:stun.kinesisvideo.${region}.amazonaws.com:443`,
          });
        }

        const getIceServerConfigResponse =
          yield kinesisVideoSignalingChannelsClient.getIceServerConfig({
            ChannelARN: channelARN,
          });

        __DEV__ &&
          console.log(
            '[GOND] ICE getIceServerConfigResponse: ',
            getIceServerConfigResponse
          );
        getIceServerConfigResponse.IceServerList.forEach(iceServer =>
          iceServers.push({
            urls: iceServer.Uris,
            username: iceServer.Username,
            credential: iceServer.Password,
          })
        );
        // }
        __DEV__ && console.log('[GOND] - ICE servers: ', iceServers);

        // Create Signaling Client
        self.signalingClient = new SignalingClient({
          channelARN,
          channelEndpoint: endpointsByProtocol.WSS,
          clientId: clientId ?? util.getRandomClientId(),
          role: Role.VIEWER,
          region: region,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            // sessionToken: sessionToken,
          },
          systemClockOffset: kinesisVideoClient.config.systemClockOffset,
        });
        __DEV__ && console.log('[GOND] signalingClient', self.signalingClient);

        self.createPeerConnection({
          iceServers,
          iceTransportPolicy: 'relay',
        });

        // events
        self.signalingClient.on('open', () => {
          // Create an SDP offer to send to the master
          // Create data channel right before createOffer
          __DEV__ && console.log('[GOND] Start creating data channels');
          self.openDataChannel();

          self.sendOffer();
        });

        self.signalingClient.on('close', () => {
          __DEV__ && console.log('[GOND] Disconnected from signaling channel');
        });

        self.signalingClient.on('error', error => {
          console.error('[GOND] Signaling client error: ', error);
          self.setStreamStatus({
            isLoading: false,
            error: VIDEO_MESSAGE.MSG_NETWORK_FAILED,
            needResetConnection: true,
          });
        });

        self.signalingClient.on('iceCandidate', event => {
          // Add the ICE candidate received from the MASTER to the peer connection
          const iceCandidate = new RTCIceCandidate(event);
          // __DEV__ &&
          //   console.log(
          //     `[GOND] Received ICE candidate peerId = ${self.peerConnection._peerConnectionId}:`,
          //     event
          //   );
          if (iceCandidate && iceCandidate.candidate) {
            // CHANGE 0 to audio and 1 to video
            iceCandidate.sdpMid = iceCandidate.sdpMid.replace('0', 'video');
            iceCandidate.sdpMid = iceCandidate.sdpMid.replace('1', 'data');
            self.peerConnection
              .addIceCandidate(iceCandidate)
              .catch(err =>
                console.error(
                  'Error adding local iceCandidate:',
                  err,
                  ' \n >>> it failed:',
                  iceCandidate
                )
              );
          } else {
            __DEV__ &&
              console.log(
                '[GOND] ... Received ICE candidate none: ',
                iceCandidate
              );
          }
        });

        self.signalingClient.on('sdpAnswer', (answer, id) => {
          // __DEV__ &&
          //   console.log(`[GOND] sdpAnswer id ${id} `, answer);
          if (!self.peerConnection || self.peerConnection.remoteDescription)
            return;

          // CHANGE 0 to audio and 1 to video
          let desc = new RTCSessionDescription(answer);
          desc['sdp'] = desc['sdp'].replace(
            'a=group:BUNDLE 0 1',
            'a=group:BUNDLE video data'
          );
          desc['sdp'] = desc['sdp'].replace('a=mid:0', 'a=mid:video');
          desc['sdp'] = desc['sdp'].replace('a=mid:1', 'a=mid:data');

          self.peerConnection.setRemoteDescription(desc).catch(ex => {
            __DEV__ &&
              console.log('[GOND] Failed to set RemoteDescription ', ex);
          });
        });

        __DEV__ && console.log('[GOND] Starting connection');
        self.signalingClient.open();

        __DEV__ && console.log('[GOND] zzzzzzz before sleep ', new Date());
        yield util.sleep(5000);
        __DEV__ && console.log('[GOND] zzzzzzz after sleep ', new Date());
        return true;
      }),
      sendOffer: flow(function* sendOffer(reconnect) {
        if (!self.peerConnection) {
          console.log('GOND sendOffer failed, peer connection not available');
        }
        const sdpOffer = yield self.peerConnection.createOffer({
          //offerToReceiveAudio: true,
          offerToReceiveVideo: true,
          icerestart: reconnect ? true : undefined,
        });

        // __DEV__ && console.log('[GOND] Created SDP offer: ', sdpOffer['sdp']);
        yield self.peerConnection.setLocalDescription(sdpOffer);

        // When trickle ICE is enabled, send the offer now and then send ICE candidates as they are generated. Otherwise wait on the ICE candidates.
        if (USE_TRICKLE_ICE) {
          __DEV__ && console.log('[GOND] Sending SDP offer');
          self.signalingClient.sendSdpOffer(
            self.peerConnection.localDescription
          );
        }
      }),
      createPeerConnection(configs) {
        const peerConnection = new RTCPeerConnection(configs);

        peerConnection.addEventListener('icecandidate', event => {
          __DEV__ &&
            console.log('peerConnection: on icecandidate event: ', event);
          const {candidate} = event;
          if (candidate) {
            __DEV__ && console.log('[GOND] Generated ICE candidate');
            // When trickle ICE is enabled, send the ICE candidates as they are generated.
            if (USE_TRICKLE_ICE) {
              __DEV__ &&
                console.log(
                  `[GOND] Sending ICE candidate ${peerConnection._peerConnectionId} : `,
                  candidate
                );
              self.signalingClient.sendIceCandidate(candidate);
            }
          } else {
            __DEV__ &&
              console.log('[GOND] All ICE candidates have been generated');

            // When trickle ICE is disabled, send the offer now that all the ICE candidates have ben generated.
            if (!USE_TRICKLE_ICE) {
              self.signalingClient.sendSdpOffer(
                peerConnection.localDescription
              );
            }
          }
        });

        peerConnection.oniceconnectionstatechange = event => {
          if (!peerConnection) return;
          __DEV__ &&
            console.log(
              '[GOND] oniceconnectionstatechange : ',
              peerConnection.iceConnectionState,
              ', peerId = ',
              peerConnection._peerConnectionId
            );
          if (peerConnection.iceConnectionState == 'connected') {
            //
          } else if (
            peerConnection.iceConnectionState == 'disconnected' ||
            peerConnection.iceConnectionState == 'failed'
          ) {
            // self.onReconnect(peerConnection._peerConnectionId);
            __DEV__ &&
              console.log('[GOND] ICE connection failed : ', peerConnection);
            self.setStreamStatus({
              connectionStatus: STREAM_STATUS.DISCONNECTED,
              needResetConnection: true,
            });
          }
        };

        // As remote tracks are received, add them to the remote view
        peerConnection.addEventListener('track', event => {
          __DEV__ &&
            console.log('[GOND] Received remote track event = ', event);
        });

        peerConnection.onaddstream = event => {
          if (!peerConnection || !event.stream) {
            __DEV__ &&
              console.log('[GOND] rtcStream created failed: ', event.stream);
            return;
          }

          self.setRemoteStream(event.stream);

          __DEV__ &&
            console.log('[GOND] This is the stream URL', event.stream.toURL());
        };

        self.peerConnection = peerConnection;
      },
      openDataChannel(/*callbackFn*/) {
        const newId = `kvsDataChannel${
          self.channelNo
        }_${util.getRandomClientId()}`;
        __DEV__ && console.log('GOND creating datachannel: ', newId);

        self.dataChannel = self.peerConnection.createDataChannel(newId);

        if (dataChannelEvents) {
          __DEV__ && console.log('GOND dataChannelEvents now set: ', newId);
          self.dataChannel.onopen = dataChannelEvents.onOpen;
          self.dataChannel.onmessage = dataChannelEvents.onMessage;
          self.dataChannel.onerror = dataChannelEvents.onError;
        } else {
          __DEV__ && console.log('GOND dataChannelEvents not set: ', newId);
          self.dataChannel.onopen = msg => {
            __DEV__ &&
              console.log(
                '[GOND] RTC.dataChannel.onopen peerId: ',
                self.peerConnection._peerConnectionId,
                msg
              );
            self.setDataChannelStatus(true);
            self.setStreamStatus({
              isLoading: false,
              error: '',
              connectionStatus: STREAM_STATUS.CONNECTED,
              needResetConnection: false,
            });
            // if (callbackFn && typeof callbackFn == 'function') callbackFn();
          };

          self.dataChannel.onclose = () => {
            console.log('[GOND] RTC.dataChannel.onclosed!');
            self.isDatachannelOpened = false;
          };
        }
      },
      release() {
        self.dataChannel && self.dataChannel.close();
        self.peerConnection && self.peerConnection.close();
        self.signalingClient && self.signalingClient.close();
      },
    };
  });

const RTCStreamModel = types
  .model({
    sid: types.identifier,
    // kdvr: types.number,
    region: types.string,
    accessKeyId: types.string,
    secretAccessKey: types.string,
    rtcChannelName: types.string,

    viewers: types.array(ChannelConnectionModel),
  })
  .volatile(self => ({
    configs: {},
  }))
  .actions(self => ({
    initPeerConnections(conns) {
      __DEV__ && console.log('[GOND] initPeerConnections ', conns);
      self.viewers = conns ?? [];
    },
    // addConnection(conn) {
    //   self.viewers.push(conn);
    // },
    onReconnect: flow(function* onReconnect(peerId) {
      console.log('GOND RTC-ONRECONNECT: TODO');
    }),
    release() {
      self.viewers.forEach(viewer => {
        viewer.release();
      });
      self.viewers = [];
    },
    createStreams: flow(function* createStreams(streamInfos, channels) {
      if (self.openStreamLock) false;
      self.openStreamLock = true;

      self.viewers = [];
      self.message = VIDEO_MESSAGE.MSG_CONNECTING_STREAM;

      if (Array.isArray(channels)) {
        __DEV__ &&
          console.log('[GOND] - creating streams for channels: ', channels);
        // self.viewers = channels.map(ch => {

        for (let i = 0; i < channels.length; i++) {
          yield self.createConnection(channels[i], streamInfos);
        }
      } else {
        self.createConnection(channels, streamInfos);
      }
      self.openStreamLock = false;
    }),
    createConnection: flow(function* createConnection(ch, streamInfos) {
      const conn = ChannelConnectionModel.create({
        channelNo: ch.channelNo,
        channelName: ch.name,
        isDataChannelOpened: false,

        isLoading: true,
        error: '',
        connectionStatus: STREAM_STATUS.CONNECTING,
      });

      yield conn.initStream({...streamInfos, region: self.region});
      self.viewers.push(conn);
    }),
  }));

export default RTCStreamModel;
