import {flow, types, getSnapshot} from 'mobx-state-tree';
import {
  SignalingClientType,
  PeerConnectionType,
  DataChannelType,
} from './types/webrtc';

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

import apiService from '../services/api';

import snackbarUtil from '../util/snackbar';
import {Route, VSC, DVR} from '../consts/apiRoutes';
import util from '../util/general';
import {
  CLOUD_TYPE,
  DAY_INTERVAL,
  VSCCommand,
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

          // self.setStreamStatus({isLoading: false, needResetConnection: true});
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
          const {iceGatheringState, iceConnectionState, _peerConnectionId} =
            self.peerConnection;
          // if (__DEV__) {
          //   console.log(
          //     `[GOND] ${_peerConnectionId} Received iceCandidate iceGatheringState=${iceGatheringState}, iceConnectionState=${iceConnectionState}`
          //   );
          // }
          // if (
          //   !self.peerConnection ||
          //   ['completed', 'failed', 'disconnected', 'closed'].includes(
          //     self.peerConnection.iceConnectionState
          //   ) // ||
          //   // self.peerConnection.iceGatheringState == 'complete'
          // )
          //   return;

          // Add the ICE candidate received from the MASTER to the peer connection
          const iceCandidate = new RTCIceCandidate(event);
          __DEV__ &&
            console.log(
              `[GOND] Received ICE candidate peerId = ${self.peerConnection._peerConnectionId}:`,
              event
            );
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

          if (__DEV__) {
            console.log(
              `[GOND] ${_peerConnectionId} ADDED iceGatheringState=${iceGatheringState}, iceConnectionState=${iceConnectionState}`
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
      // const kinesisVideoClient = new KinesisVideo({
      //   region: self.region,
      //   credentials: {
      //     accessKeyId: accessKeyId,
      //     secretAccessKey: secretAccessKey,
      //     // sessionToken: sessionToken,
      //   },
      //   // endpoint: endpoint,
      //   correctClockSkew: true,
      // });
      // // Get signaling channel ARN
      // let describeSignalingChannelResponse = null;
      // try {
      //   describeSignalingChannelResponse =
      //     yield kinesisVideoClient.describeSignalingChannel({
      //       ChannelName: rtcChannelName,
      //     });
      // } catch (error) {
      //   console.log('[GOND] describeSignalingChannelResponse error: ', error);
      //   self.isLoading = false;
      //   self.error = VIDEO_MESSAGE.MSG_NETWORK_FAILED;
      //   self.openStreamLock = false;
      //   // self.needResetConnection = true;
      //   return false;
      // }

      // // __DEV__ &&
      // //   console.log(
      // //     '[GOND] - describeSignalingChannelResponse: ',
      // //     describeSignalingChannelResponse
      // //   );
      // const channelARN =
      //   describeSignalingChannelResponse.ChannelInfo.ChannelARN;
      // __DEV__ && console.log('[GOND] Channel ARN: ', channelARN);
      // // Get signaling channel endpoints
      // const getSignalingChannelEndpointResponse =
      //   yield kinesisVideoClient.getSignalingChannelEndpoint({
      //     ChannelARN: channelARN,
      //     SingleMasterChannelEndpointConfiguration: {
      //       Protocols: ['WSS', 'HTTPS'],
      //       Role: Role.VIEWER,
      //     },
      //   });

      // // __DEV__ &&
      // //   console.log(
      // //     '[GOND] getSignalingChannelEndpointResponse: ',
      // //     getSignalingChannelEndpointResponse
      // //   );
      // const endpointsByProtocol =
      //   getSignalingChannelEndpointResponse.ResourceEndpointList.reduce(
      //     (endpoints, endpoint) => {
      //       endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
      //       return endpoints;
      //     },
      //     {}
      //   );
      // __DEV__ && console.log('[GOND] - Endpoints: ', endpointsByProtocol);

      /*
      const kinesisVideoSignalingChannelsClient = new KinesisVideoSignaling({
        region: self.region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          // sessionToken: sessionToken,
        },
        endpoint: endpointsByProtocol.HTTPS,
        correctClockSkew: true,
      });

      // Get ICE server configuration
      const iceServers = [];
      if (IS_FORCE_TURN) {
        iceServers.push({
          urls: `stun:stun.kinesisvideo.${self.region}.amazonaws.com:443`,
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
      */

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
    // #endregion WebRTC streaming
  }));

const HLSStreamModel = types.model({
  sid: types.identifier,
  streamUrl: types.string,
});

const DirectServerModel = types
  .model({
    serverIP: types.string,
    publicIP: types.string,
    name: types.maybeNull(types.string),
    port: types.number,
    serverID: types.string,
    userName: types.string,
    password: types.string,
    kDVR: types.number,
    channels: types.string,
    searchMode: types.boolean,
    // byChannel: types.string,
    date: types.string,
    hd: types.boolean,
    // interval: types.number,
  })
  .views(self => ({
    get data() {
      return {...self, byChannel: true, interval: DAY_INTERVAL};
    },
  }))
  .actions(self => ({
    setLoginInfo(userName, password) {
      self.userName = userName;
      self.password = password;
    },
  }));
const parseDirectServer = (server /*, channelNo, isLive*/) => {
  return DirectServerModel.create({
    serverIP: server.ServerIP ?? '',
    publicIP: server.ServerIP ?? '',
    name: server.name ?? '',
    port: server.Port,
    serverID: server.ServerID,
    userName: server.UName,
    password: server.PWD,
    kDVR: server.KDVR,
    channels: '',
    searchMode: false,
    // byChannel: true,
    date: '',
    hd: false,
    // interval: DAY_INTERVAL,
  });
};

const ChannelModel = types
  .model({
    channelNo: types.identifierNumber,
    kDVR: types.number,
    kChannel: types.number,
    videoSource: types.number,
    kAudioSource: types.number,
    kPTZ: types.number,
    status: types.number,
    name: types.string,
    enable: types.number,
    dwellTime: types.number,
    ap: types.number,
    cameraID: types.number,
    videoCompressQual: types.number,
    videoType: types.maybeNull(types.string), // ?
    kVideo: types.maybeNull(types.string), // ?
    enableiSearch: types.boolean,
    dvrName: types.string,
    fps: types.string,
    resolution: types.maybeNull(types.string), // ?
    modelName: types.string,
    isActive: types.boolean,
    image: types.maybeNull(types.string),
  })
  .views(self => ({
    // get data() {
    //   const res = getSnapshot(self);
    //   __DEV__ && console.log('GOND channel snapshot = ', res);
    //   return res;
    // },
  }));

const parseChannel = (_channel, activeList = null) => {
  // __DEV__ && console.log('GOND parseChannel ', _channel, activeList);

  return ChannelModel.create({
    channelNo: _channel.ChannelNo,
    kDVR: _channel.KDVR,
    kChannel: _channel.KChannel,
    videoSource: _channel.VideoSource,
    kAudioSource: _channel.KAudioSource,
    kPTZ: _channel.KPTZ,
    status: _channel.Status,
    name: _channel.Name,
    enable: _channel.Enable,
    dwellTime: _channel.DwellTime,
    ap: _channel.AP,
    cameraID: _channel.CameraID,
    videoCompressQual: _channel.VideoCompressQual,
    videoType: _channel.VideoType,
    kVideo: _channel.KVideo,
    enableiSearch: _channel.EnableiSearch,
    dvrName: _channel.DVRName,
    fps: _channel.FPS,
    resolution: _channel.Resolution,
    modelName: _channel.ModelName,
    isActive:
      activeList && Array.isArray(activeList)
        ? activeList.includes(_channel.ChannelNo)
        : false,
    image: _channel.Image ?? null,
  });
};

const TimezoneModel = types.model({});

export const VideoModel = types
  .model({
    kDVR: types.maybeNull(types.number),

    allChannels: types.array(ChannelModel),
    maxReadyChannels: types.number,
    cloudType: types.number,

    // rtcStreams: types.array(RTCStreamModel),
    rtcConnection: types.maybeNull(RTCStreamModel),
    hlsStreams: types.array(HLSStreamModel),
    // directStreams: types.array(DirectServerModel),
    directConnection: types.maybeNull(DirectServerModel),
    selectedStreamIndex: types.maybeNull(types.number),
    selectedStream: types.maybeNull(
      types.union(DirectServerModel, HLSStreamModel, RTCStreamModel)
    ),
    openStreamLock: types.boolean,

    channelFilter: types.string,
    isLoading: types.boolean,
    error: types.string,
    needResetConnection: types.boolean,
    message: types.string,
    nvrUser: types.maybeNull(types.string),
    nvrPassword: types.maybeNull(types.string),
    isLive: types.boolean,
    // hdMode: types.boolean,
    isSingleMode: types.boolean,
    // TODO: timestamp should use BigNumber?
    searchBegin: types.maybeNull(types.number),
    searchEnd: types.maybeNull(types.number),
  })
  .views(self => ({
    get isCloud() {
      return self.cloudType > CLOUD_TYPE.DIRECTION;
    },

    get activeChannels() {
      const res = self.allChannels.filter(ch => ch.isActive);
      return res; // res.map(ch => ch.data);
    },
    get needAuthen() {
      return (
        (self.cloudType == CLOUD_TYPE.DIRECTION ||
          self.cloudType == CLOUD_TYPE.DEFAULT) &&
        (!self.nvrUser || !self.nvrPassword)
      );
    },
    get directStreams() {
      return self.allChannels
        .filter(ch =>
          ch.name.toLowerCase().includes(self.channelFilter.toLowerCase())
        )
        .map(ch => ({
          ...self.directConnection,
          channels: '' + ch.channelNo,
          name: ch.name,
          byChannel: true,
          interval: DAY_INTERVAL,
        }));
    },
    // Build data for players
    // buildDirectData() {
    //   return self.directStreams;
    // },
    buildHLSData() {
      // TODO:
    },
    buildRTCData() {
      console.log(
        'GOND build RTC datachannels: ',
        new Date(),
        getSnapshot(self.rtcConnection.viewers)
      );

      return self.rtcConnection.viewers.filter(dc =>
        dc.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    buildVideoData() {
      switch (self.cloudType) {
        case CLOUD_TYPE.DEFAULT:
        case CLOUD_TYPE.DIRECTION:
          // return self.buildDirectData();
          return self.directStreams;
        case CLOUD_TYPE.HLS:
          return self.buildHLSData();
        case CLOUD_TYPE.RTC:
          return self.buildRTCData();
      }
      return [];
    },
  }))
  // .volatile(self => ({
  //   streamReadyCallback: null,
  // }))
  .actions(self => {
    // volatile state:
    let streamReadyCallback = null;
    // let streamInfoCallback = null;
    // let peerConnectionStatsInterval = null;
    // #region setters
    return {
      setNVRLoginInfo({username, password}) {
        self.nvrUser = username;
        self.nvrPassword = password;
        self.directConnection.setLoginInfo(username, password);
      },
      setChannelFilter(value) {
        self.channelFilter = value;
      },
      resetNVRAuthentication() {
        if (self.nvrUser) self.setNVRLoginInfo('', '');
      },
      setLoading(value) {
        self.isLoading = value;
      },
      selectDVR(value) {
        self.kDVR = value.kDVR;
      },
      setStreamReadyCallback(fn) {
        if (!fn || typeof fn !== 'function') {
          console.log('GOND set streamReadyCallback is not a function!');
          return;
        }
        __DEV__ && console.log('GOND streamReadyCallback ...');
        streamReadyCallback = fn;
      },
      // #endregion setters
      // #region settings
      getCloudSetting: flow(function* getCloudSetting() {
        let res = undefined;
        self.isLoading = true;
        try {
          res = yield apiService.get(
            VSC.controller,
            apiService.configToken.devId,
            VSC.cloud
          );
        } catch (err) {
          __DEV__ && console.log('GOND get cloud type failed, error: ', err);
          self.isLoading = false;
          return false;
        }

        let result = true;
        __DEV__ && console.log('GOND get cloud type res = ', res);
        if (typeof res === 'boolean') {
          self.cloudType = res === true ? CLOUD_TYPE.HLS : CLOUD_TYPE.DIRECTION;
        } else if (
          typeof res === 'number' &&
          res < CLOUD_TYPE.TOTAL &&
          res > CLOUD_TYPE.UNKNOWN
        ) {
          self.cloudType = res;
        } else {
          __DEV__ &&
            console.log('GOND get cloud type return wrong value, res = ', res);
          result = false;
        }
        self.isLoading = false;
        return result;
      }),
      updateCloudSetting: flow(function* updateCloudSetting(value) {
        try {
          yield apiService.post(
            VSC.controller,
            apiService.configToken.devId,
            VSC.setting,
            value
          );
          self.getCloudSetting();
        } catch (err) {
          __DEV__ && console.log('GOND save setting error: ', err);
          return false;
        }
        return true;
      }),
      // #endregion settings
      // #region get channels
      getDvrChannels: flow(function* getDvrChannels(isGetAll = false) {
        if (!self.kDVR) {
          console.log('GOND Could not get channels info, no dvr selected');
        }
        self.isLoading = true;

        try {
          let res = yield apiService.get(
            DVR.controller,
            '' + self.kDVR,
            isGetAll ? DVR.getAllChannels : DVR.getChannels
          );
          __DEV__ && console.log('GOND get channels info: ', res);
          if (res.error) {
            __DEV__ &&
              console.log('GOND cannot get channels info: ', res.error);
            snackbarUtil.handleGetDataFailed(res.error);
            self.error = res.error;
            self.isLoading = false;
            return false;
          }
          self.allChannels = [];
          res.forEach(ch => self.allChannels.push(parseChannel(ch)));
        } catch (err) {
          console.log('GOND cannot get channels info: ', err);
          snackbarUtil.handleGetDataFailed(err);
          self.isLoading = false;
          return false;
        }
        self.isLoading = false;
        return true;
      }),
      getActiveChannels: flow(function* getActiveChannels() {
        if (!self.kDVR) {
          console.log('GOND Could not get channels info, no dvr selected');
        }
        self.isLoading = true;

        try {
          let [resActive, resAll] = yield Promise.all([
            apiService.get(
              VSC.controller,
              '' + self.kDVR,
              VSC.getActiveChannels
            ),
            apiService.get(DVR.controller, '' + self.kDVR, DVR.getChannels),
          ]);
          __DEV__ &&
            console.log(
              'GOND get active channels info: ',
              resActive,
              '\n all channels: ',
              resAll
            );
          if (resActive.error || resAll.error) {
            console.log(
              'GOND cannot get active channels info: ',
              resActive.error,
              ' && ',
              resAll.error
            );
            snackbarUtil.handleGetDataFailed(resActive.error || resAll.error);
            self.error = resActive.error || resAll.error;
            self.isLoading = false;
            return false;
          }
          self.maxReadyChannels = resActive.MaxReadyChannels;
          self.allChannels = resAll.map(ch =>
            parseChannel(ch, resActive.Channels)
          );
        } catch (err) {
          console.log('GOND cannot get active channels info: ', err);
          snackbarUtil.handleGetDataFailed(err);
          self.isLoading = false;
          return false;
        }
        self.isLoading = false;
        return true;
      }),
      getDisplayingChannels: flow(function* getDisplayingChannels() {
        if (
          self.cloudType == CLOUD_TYPE.DIRECTION ||
          self.cloudType == CLOUD_TYPE.DEFAULT
        ) {
          return yield self.getDvrChannels();
        } else {
          return yield self.getActiveChannels();
        }
      }),
      // #endregion get channels
      // #region direct connection
      getDirectInfos: flow(function* getDirectInfo(channel) {
        self.isLoading = true;
        __DEV__ && console.log('GOND getDirectInfos 1');
        if (!self.allChannels || self.allChannels.length <= 0) {
          yield self.getDvrChannels();
          __DEV__ && console.log('GOND getDirectInfos 2');
        }
        if (self.allChannels.length <= 0) {
          self.directConnection = null;
          self.isLoading = false;
          return true;
        }
        try {
          // Only get one connection info, then
          __DEV__ && console.log('GOND getDirectInfos 3');
          const res = yield apiService.get(
            DVR.controller,
            self.kDVR,
            DVR.getConnection,
            {
              kdvr: self.kDVR,
              channelno: self.allChannels[0].channelNo,
            }
          );
          __DEV__ && console.log('GOND direct connect infos: ', res);
          self.directConnection = parseDirectServer(res);

          // get NVR user and password from first data:
          self.nvrUser = self.directConnection.userName;
          self.nvrPassword = self.directConnection.password;
        } catch (err) {
          console.log('GOND cannot get direct video info: ', err);
          snackbarUtil.handleGetDataFailed(err);
          self.isLoading = false;
          return false;
        }
        self.isLoading = false;
        return true;
      }),
      // #endregion direct connection
      getDVRTimezone: flow(function* getDVRTimezone(channelNo) {
        try {
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.requestVSCURL,
            {
              ID: apiService.configToken.devId,
              KDVR: self.kDVR,
              ChannelNo: channelNo ?? self.allChannels[0].channelNo,
              RequestMode: VSCCommand.LIVE,
              isMobile: true,
            }
          );
          __DEV__ && console.log('GOND get DVR timezone: ', res);
        } catch (ex) {
          console.log('Could not get DVR timezone: ', ex);
        }
      }),
      getDaylist: flow(function* getDaylist() {}),
      getHLSInfos: flow(function* getHLSInfos(channel) {
        self.isLoading = true;
        __DEV__ && console.log('GOND getDirectInfos 1');
        if (!self.activeChannels || self.activeChannels.length <= 0) {
          yield self.getActiveChannels();
          __DEV__ && console.log('GOND getDirectInfos 2');
        }
        yield self.getDVRTimezone();
        if (self.activeChannels.length <= 0) {
          self.directConnection = null;
          self.isLoading = false;
          return true;
        }
      }),
      // #region WebRTC streaming
      getRTCInfos: flow(function* getRTCInfos(channelNo) {
        self.isLoading = true;
        self.rtcConnection = RTCStreamModel.create({
          sid: util.getRandomId(),
          // kdvr: self.kDVR,
          region: '',
          accessKeyId: '',
          secretAccessKey: '',
          rtcChannelName: '',
          viewers: [],
        });
        try {
          __DEV__ &&
            console.log(
              'GOND getRTCInfo allChannels: ',
              getSnapshot(self.allChannels)
            );
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.requestVSCURL,
            {
              sid: self.rtcConnection.sid,
              ID: apiService.configToken.devId,
              KDVR: self.kDVR,
              ChannelNo:
                channelNo ??
                (self.allChannels && self.allChannels.length > 0
                  ? self.allChannels[0].channelNo
                  : 0),
              RequestMode: VSCCommand.RCTLIVE,
              isMobile: true,
            }
          );
          __DEV__ && console.log('GOND getRTCInfo res: ', res);
          if (res.error) {
            console.log('GOND getRTCInfo request failed: ', res.error);
            return false;
          }
          self.rtcConnection.region = res.Region ?? DEFAULT_REGION;
          return true;
        } catch (ex) {
          console.log('GOND getRTCInfo failed: ', ex);
        }
      }),
      getVideoInfos: flow(function* getVideoInfos(channel) {
        console.log('GOND getVideoInfos');
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            return yield self.getDirectInfos(channel);
          case CLOUD_TYPE.HLS:
            return yield self.getHLSInfos(channel);
          case CLOUD_TYPE.RTC:
            return yield self.getRTCInfos(channel);
        }
        __DEV__ &&
          console.log(
            'GOND cannot get video info invalid cloud type: ',
            self.cloudType
          );
        return false;
      }),
      onReceiveStreamInfo: flow(function* onReceiveStreamInfo(streamInfo) {
        __DEV__ && console.log('GOND onReceiveStreamInfo');
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            console.log(
              'GOND Warning: direct connection not receive stream info through notification'
            );
          case CLOUD_TYPE.HLS:
          // TODO:
          // return yield self.getHLSInfos(streamInfo);
          case CLOUD_TYPE.RTC:
            __DEV__ &&
              console.log(
                'GOND compare sid: ',
                streamInfo.sid,
                '\n self sid: ',
                self.rtcConnection.sid
              );
            if (streamInfo.sid === self.rtcConnection.sid) {
              __DEV__ &&
                console.log(
                  `GOND channels filter ${self.channelFilter}, active: `,
                  self.activeChannels
                );
              yield self.rtcConnection.createStreams(
                {
                  accessKeyId: streamInfo.access_key,
                  secretAccessKey: streamInfo.secret_key,
                  rtcChannelName: streamInfo.rtc_channel,
                },
                self.activeChannels
              );
              self.isLoading = false;
              streamReadyCallback();
            }
        }
      }),
      releaseStreams() {
        __DEV__ && console.log('GOND release video streams...');
        switch (self.cloudType) {
          case CLOUD_TYPE.DIRECTION:
            break;
          case CLOUD_TYPE.HLS:
            break;
          case CLOUD_TYPE.RTC:
            self.openStreamLock = false;
            self.rtcConnection.release();
            break;
        }
      },
    };
  });

const videoStore = VideoModel.create({
  kDVR: null,

  allChannels: [],
  // activeChannels: [],
  maxReadyChannels: 0,
  cloudType: CLOUD_TYPE.UNKNOWN,

  // rtcStreams: [],
  hlsStreams: [],
  // directStreams: [],
  directConnection: null,
  singleStreamIndex: null,
  openStreamLock: false,

  channelFilter: '',
  isLoading: false,
  error: '',
  message: '',
  needResetConnection: false,
  isLive: true,
  // hdMode: false,
  isSingleMode: false,
  searchBegin: null,
  searchEnd: null,
});

export default videoStore;
