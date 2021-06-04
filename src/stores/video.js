import {types} from 'mobx-state-tree';
import {
  SignalingClientType,
  PeerConnectionType,
  DataChannelType,
} from './types/webrtc';

import {SignalingClient} from 'amazon-kinesis-video-streams-webrtc';
import {RTCPeerConnection} from 'react-native-webrtc';

const RTCStreamModel = types.model({
  sid: types.identifier,
  kdvr: types.integer,
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
    kDVR: types.integer,
    kChannel: types.integer,
    videoSource: types.integer,
    kAudioSource: types.integer,
    kPTZ: types.integer,
    status: types.integer,
    name: types.string,
    enable: types.integer,
    dwellTime: types.integer,
    ap: types.integer,
    cameraID: types.integer,
    videoCompressQual: types.integer,
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
  maxReadyChannels: types.integer,
  selectedChannels: types.array(types.reference(ChannelModel)),
});

export const VideoModel = types.model({
  channelSetting: types.maybeNull(ChannelSettingModel),
  rtcStreams: types.array(types.reference(RTCStreamModel)),
  hlsStreams: types.array(types.reference(HLSStreamModel)),
  directStreams: types.array(types.reference(DirectConnectionModel)),
  singleStreamIndex: types.maybeNull(types.integer),
});

export const videoStore = VideoModel.create({
  channelSetting: null,
  rtcStreams: [],
  hlsStreams: [],
  directStreams: [],
  singleStreamIndex: null,
});

// export default videoStore;
