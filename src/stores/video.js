import {flow, types, getSnapshot} from 'mobx-state-tree';

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {LocalZone, DateTime} from 'luxon';

import RTCStreamModel from './types/webrtc';

import apiService from '../services/api';

import snackbarUtil from '../util/snackbar';
import {VSC, DVR} from '../consts/apiRoutes';
import util from '../util/general';
import {
  CLOUD_TYPE,
  DAY_INTERVAL,
  VSCCommand,
  VIDEO_MESSAGE,
  DEFAULT_REGION,
  STREAM_STATUS,
} from '../consts/video';

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
    setHD(value) {
      self.hd = value;
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

    rtcConnection: types.maybeNull(RTCStreamModel),
    hlsStreams: types.array(HLSStreamModel),
    directConnection: types.maybeNull(DirectServerModel),
    selectedChannel: types.maybeNull(types.number),

    openStreamLock: types.boolean,

    channelFilter: types.string,
    isLoading: types.boolean,
    error: types.string,
    needResetConnection: types.boolean,
    message: types.string,
    nvrUser: types.maybeNull(types.string),
    nvrPassword: types.maybeNull(types.string),
    isLive: types.boolean,
    isFullscreen: types.boolean,
    isHD: types.boolean,
    showAuthenModal: types.boolean,
    // hdMode: types.boolean,
    isSingleMode: types.boolean,
    frameTime: types.string,
    searchDate: types.maybeNull(types.string),
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
    get displayChannels() {
      if (
        self.cloudType == CLOUD_TYPE.DIRECTION ||
        self.cloudType == CLOUD_TYPE.DEFAULT
      )
        return self.allChannels;
      return self.activeChannels;
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
          channelNo: ch.channelNo,
          channels: '' + ch.channelNo,
          channelName: ch.name,
          kChannel: ch.kChannel,
          byChannel: true,
          interval: DAY_INTERVAL,
        }));
    },
    get selectedChannelIndex() {
      return self.displayChannels
        ? self.displayChannels.findIndex(
            ch => ch.channelNo === self.selectedChannel
          )
        : -1;
    },
    get selectedStream() {
      if (util.isNullOrUndef(self.selectedChannel)) return {};
      switch (self.cloudType) {
        case CLOUD_TYPE.DEFAULT:
        case CLOUD_TYPE.DIRECTION:
          return self.directStreams.find(
            s => s.channelNo == self.selectedChannel
          );
        case CLOUD_TYPE.HLS:
          // TODO
          return null;
        case CLOUD_TYPE.RTC:
          return self.rtcConnection.viewers.find(
            v => v.channelNo == self.selectedChannel
          );
      }
      return null;
    },
    get firstChannelNo() {
      return self.allChannels && self.allChannels.length > 0
        ? self.allChannels[0].channelNo
        : 0;
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
      setNVRLoginInfo(username, password) {
        self.nvrUser = username;
        self.nvrPassword = password;
        self.directConnection.setLoginInfo(username, password);
      },
      setChannelFilter(value) {
        self.channelFilter = value;
      },
      resetNVRAuthentication() {
        if (self.nvrUser) self.setNVRLoginInfo('', '');
        self.showAuthenModal = true;
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
      selectChannel(value) {
        self.selectedChannel = value;
      },
      setFrameTime(value) {
        if (typeof value == 'string') {
          self.frameTime = value;
        } else if (typeof value == 'number') {
          // TODO: convert timezone
        }
      },
      setSearchDate(value) {
        if (typeof value == 'string') {
          self.searchDate = value;
        } else {
          // TODO: convert timezone
        }
      },
      displayAuthen(value) {
        self.showAuthenModal = value;
      },
      switchLiveSearch(value) {
        self.isLive = value === undefined ? !self.isLive : value;
      },
      switchHD(value) {
        self.isHD = !self.isHD;
      },
      switchFullscreen(value) {
        self.isFullscreen = !self.isFullscreen;
      },
      previousChannel() {
        if (self.selectedChannelIndex > 0) {
          self.selectedChannel =
            self.displayChannels[self.selectedChannelIndex - 1].channelNo;
        }
      },
      nextChannel() {
        if (
          self.selectedChannelIndex < self.displayChannels.length - 1 &&
          self.selectedChannelIndex >= 0
        )
          self.selectedChannel =
            self.displayChannels[self.selectedChannelIndex + 1].channelNo;
      },
      reset() {
        self.selectedChannel = null;
        self.searchBegin = null;
        self.searchEnd = null;
        self.frameTime = '';
        self.searchDate = null;
        self.isLoading = false;
        self.isLive = true;
        self.isFullscreen = false;
        self.isHD = false;
        self.showAuthenModal = false;
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
              ChannelNo: channelNo ?? self.firstChannelNo,
              RequestMode: VSCCommand.TIMEZONE,
              isMobile: true,
            }
          );
          __DEV__ && console.log('GOND get DVR timezone: ', res);
        } catch (ex) {
          console.log('Could not get DVR timezone: ', ex);
          return false;
        }
        return true;
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
      getVideoInfos: flow(function* getVideoInfos(channelNo) {
        console.log('GOND getVideoInfos');
        let getInfoPromise = null;
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            getInfoPromise = self.getDirectInfos(channelNo);
            break;
          case CLOUD_TYPE.HLS:
            getInfoPromise = self.getHLSInfos(channelNo);
            break;
          case CLOUD_TYPE.RTC:
            getInfoPromise = self.getRTCInfos(channelNo);
            break;
          default:
            getInfoPromise = Promise.resolve(false);
            __DEV__ &&
              console.log(
                'GOND cannot get video info invalid cloud type: ',
                self.cloudType
              );
            break;
        }
        // const [resInfo, resTimezone] = yield Promise.all([
        //   getInfoPromise,
        //   self.getDVRTimezone(channelNo),
        // ]);

        // return resInfo && resTimezone;
        return yield getInfoPromise;
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
  openStreamLock: false,

  channelFilter: '',
  isLoading: false,
  error: '',
  message: '',
  needResetConnection: false,
  isLive: true,
  isFullscreen: false,
  isHD: false,
  showAuthenModal: false,
  // hdMode: false,
  isSingleMode: false,
  frameTime: '',
  searchBegin: null,
  searchEnd: null,
});

export default videoStore;
