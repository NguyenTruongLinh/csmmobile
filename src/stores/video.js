import {flow, types} from 'mobx-state-tree';
import {
  SignalingClientType,
  PeerConnectionType,
  DataChannelType,
} from './types/webrtc';

import {SignalingClient} from 'amazon-kinesis-video-streams-webrtc';
import {RTCPeerConnection} from 'react-native-webrtc';

import apiService from '../services/api';

import {Route, VSC} from '../consts/apiRoutes';

import {STREAMING_TYPES} from '../consts/video';

const RTCStreamModel = types.model({
  sid: types.identifier,
  kdvr: types.number,
  channelNo: types.number,
  accessKeyId: types.string,
  secretAccessKey: types.string,
  rtcChannelName: types.string,

  // rtcViewer: types.map, // TODO
  signalingClient: types.maybeNull(types.frozen(SignalingClient)),
  peerConnection: types.maybeNull(types.frozen(RTCPeerConnection)),
  // dataChannel: types.maybeNull(types.frozen()),
  remoteStream: types.string,
});

const HLSStreamModel = types.model({
  sid: types.identifier,
  streamUrl: types.string,
});

const DirectConnectionModel = types.model({
  kdvr: types.identifierNumber,
  userName: types.string,
  password: types.string,
});

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
    dVRName: types.string,
    fps: types.string,
    resolution: types.maybeNull(types.string), // ?
    modelName: types.string,
    isActive: types.boolean,
    image: types.string,
  })
  .actions(self => ({
    parse(_channel) {
      self.channelNo = _channel.ChannelNo;
      self.kDVR = _channel.KDVR;
      self.kChannel = _channel.KChannel;
      self.videoSource = _channel.VideoSource;
      self.kAudioSource = _channel.KAudioSource;
      self.kPTZ = _channel.KPTZ;
      self.status = _channel.Status;
      self.name = _channel.Name;
      self.enable = _channel.Enable;
      self.dwellTime = _channel.DwellTime;
      self.ap = _channel.AP;
      self.cameraID = _channel.CameraID;
      self.videoCompressQual = _channel.VideoCompressQual;
      self.videoType = _channel.VideoType;
      self.kVideo = _channel.KVideo;
      self.enableiSearch = _channel.EnableiSearch;
      self.dVRName = _channel.DVRName;
      self.fps = _channel.FPS;
      self.resolution = _channel.Resolution;
      self.modelName = _channel.ModelName;
      self.isActive = _channel.isActive;
      self.image = _channel.Image;
    },
  }));

const ChannelSettingModel = types.model({
  allChannels: types.array(types.reference(ChannelModel)),
  error: types.string,
  maxReadyChannels: types.number,
  selectedChannels: types.array(types.reference(ChannelModel)),
});

export const VideoModel = types
  .model({
    channelSetting: types.maybeNull(ChannelSettingModel),
    rtcStreams: types.array(types.reference(RTCStreamModel)),
    hlsStreams: types.array(types.reference(HLSStreamModel)),
    directStreams: types.array(types.reference(DirectConnectionModel)),
    singleStreamIndex: types.maybeNull(types.number),
    cloudType: types.number,
    isLoading: types.boolean,
  })
  .views(self => ({
    get isCloud() {
      return self.cloudType > STREAMING_TYPES.DIRECTION;
    },
  }))
  .actions(self => ({
    getCloudSetting: flow(function* getCloudSetting() {
      let res = undefined;
      self.isLoading = true;
      try {
        res = yield apiService.get(
          VSC.controller,
          apiService.configToken.devId,
          VSC.Cloud
        );
      } catch (err) {
        __DEV__ && console.log('GOND get cloud type failed, error: ', err);
        self.isLoading = false;
        return false;
      }

      let result = true;
      if (typeof res === 'boolean') {
        self.cloudType =
          res === true ? STREAMING_TYPES.HLS : STREAMING_TYPES.DIRECTION;
      } else if (
        typeof res === 'number' &&
        res < STREAMING_TYPES.TOTAL &&
        res > STREAMING_TYPES.UNKNOWN
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
          value
        );
        self.getCloudSetting();
      } catch (err) {
        __DEV__ && console.log('GOND save setting error: ', err);
        return false;
      }
      return true;
    }),
    setLoading(value) {
      self.isLoading = value;
    },
  }));

const videoStore = VideoModel.create({
  channelSetting: null,
  rtcStreams: [],
  hlsStreams: [],
  directStreams: [],
  singleStreamIndex: null,
  cloudType: 1,
  isLoading: false,
});

export default videoStore;
