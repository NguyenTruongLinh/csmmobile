import {flow, types, getSnapshot} from 'mobx-state-tree';
import {
  SignalingClientType,
  PeerConnectionType,
  DataChannelType,
} from './types/webrtc';

import {SignalingClient} from 'amazon-kinesis-video-streams-webrtc';
import {RTCPeerConnection} from 'react-native-webrtc';

import apiService from '../services/api';

import snackbarUtil from '../util/snackbar';
import {Route, VSC, DVR} from '../consts/apiRoutes';
import {CLOUD_TYPE, DAY_INTERVAL} from '../consts/video';

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
      // return {
      //   serverIP: self.serverIP,
      //   publicIP: self.publicIP,
      //   name: self.name,
      //   port: self.port,
      //   serverID: self.serverID,
      //   userName: self.userName,
      //   password: self.password,
      //   kDVR: self.kDVR,
      //   channels: self.channels,
      //   searchMode: self.searchMode,
      //   date: self.date,
      //   hd: self.hd,
      //   byChannel: true,
      //   interval: DAY_INTERVAL,
      // };
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

// const DirectConnectionModel = types.model({
//   kdvr: types.identifierNumber,
//   userName: types.string,
//   password: types.string,
//   serverInfoList: types.array(DirectServerModel),
// });

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
  .actions(self => ({
    // get data() {
    //   const res = getSnapshot(self);
    //   __DEV__ && console.log('GOND channel snapshot = ', res);
    //   return res;
    // },
  }));

const parseChannel = (_channel, activeList = null) => {
  // __DEV__ && console.log('GOND parseChannel ', _channel);
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

export const VideoModel = types
  .model({
    kDVR: types.maybeNull(types.number),

    allChannels: types.array(ChannelModel),
    // activeChannels: types.array(types.reference(ChannelModel)), // streaming only (hls, webrtc)
    maxReadyChannels: types.number,
    cloudType: types.number,

    rtcStreams: types.array(RTCStreamModel),
    hlsStreams: types.array(HLSStreamModel),
    // directStreams: types.array(DirectServerModel),
    directConnection: types.maybeNull(DirectServerModel),
    selectedStreamIndex: types.maybeNull(types.number),
    selectedStream: types.maybeNull(
      types.union(DirectServerModel, HLSStreamModel, RTCStreamModel)
    ),

    channelFilter: types.string,
    isLoading: types.boolean,
    error: types.string,
    nvrUser: types.maybeNull(types.string),
    nvrPassword: types.maybeNull(types.string),
  })
  .views(self => ({
    get isCloud() {
      return self.cloudType > CLOUD_TYPE.DIRECTION;
    },
    get videoInfoList() {
      switch (self.cloudType) {
        case CLOUD_TYPE.DIRECTION:
          return self.directStreams;
        case CLOUD_TYPE.HLS:
          return self.hlsStreams;
        case CLOUD_TYPE.RTC:
          return self.rtcStreams;
      }
      return [];
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
      // TODO:
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
    },
  }))
  .actions(self => ({
    setNVRLoginInfo({username, password}) {
      self.nvrUser = username;
      self.nvrPassword = password;
      // self.directStreams.map(s => {
      //   s.userName = username;
      //   s.password = password;
      // });
      self.directConnection.setLoginInfo(username, password);
    },
    setChannelFilter(value) {
      self.channelFilter = value;
    },
    resetNVRAuthentication() {
      if (self.nvrUser) self.setNVRLoginInfo('', '');
    },
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
    setLoading(value) {
      self.isLoading = value;
    },
    selectDVR(value) {
      self.kDVR = value.kDVR;
    },
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
          __DEV__ && console.log('GOND cannot get channels info: ', res.error);
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
          apiService.get(VSC.controller, '' + self.kDVR, VSC.getActiveChannels),
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
        self.allChannels = resAll.map(ch => parseChannel(ch, resActive));
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
    // getDirectInfos: flow(function* getDirectInfo(channel) {
    //   if (!self.allChannels || self.allChannels.length <= 0) {
    //     yield self.getDvrChannels();
    //   }
    //   // TODO: implement getAllConnection
    //   const reqList = self.allChannels.map(ch =>
    //     apiService.get(DVR.controller, self.kDVR, DVR.getConnection, {
    //       kdvr: self.kDVR,
    //       channelno: ch.channelNo,
    //     })
    //   );
    //   try {
    //     const resList = yield Promise.all(reqList);
    //     __DEV__ && console.log('GOND direct connect infos: ', resList);
    //     self.directStreams = resList.map(s => parseDirectServer(s));

    //     // get NVR user and password from first data:
    //     if (self.directStreams.length > 0) {
    //       self.nvrUser = self.directStreams[0].userName;
    //       self.nvrPassword = self.directStreams[0].password;
    //     }
    //   } catch (err) {
    //     console.log('GOND cannot get direct video info: ', err);
    //     snackbarUtil.handleGetDataFailed(err);
    //     return false;
    //   }
    //   return true;
    // }),
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
    getHLSInfos: flow(function* getHLSInfos() {
      // TODO
    }),
    getRTCInfos: flow(function* getRTCInfos() {
      // TODO
    }),
    getVideoInfos: flow(function* getVideoInfos() {
      console.log('GOND getVideoInfos');
      switch (self.cloudType) {
        case CLOUD_TYPE.DEFAULT:
        case CLOUD_TYPE.DIRECTION:
          console.log('GOND getVideoInfos 1');
          return yield self.getDirectInfos();
        case CLOUD_TYPE.HLS:
          return yield self.getHLSInfos();
        case CLOUD_TYPE.RTC:
          return yield self.getRTCInfos();
      }
      __DEV__ &&
        console.log(
          'GOND cannot get video info invalid cloud type: ',
          self.cloudType
        );
      return false;
    }),
  }));

const videoStore = VideoModel.create({
  kDVR: null,

  allChannels: [],
  // activeChannels: [],
  maxReadyChannels: 0,
  cloudType: CLOUD_TYPE.UNKNOWN,

  rtcStreams: [],
  hlsStreams: [],
  // directStreams: [],
  directConnection: null,
  singleStreamIndex: null,

  channelFilter: '',
  isLoading: false,
  error: '',
});

export default videoStore;
