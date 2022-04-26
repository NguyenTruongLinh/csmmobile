import {flow, types, getSnapshot, applySnapshot} from 'mobx-state-tree';
import {reaction} from 'mobx';
import {Platform} from 'react-native';

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {LocalZone, DateTime} from 'luxon';

import ChannelModel, {parseChannel} from './types/channel';
import RTCStreamModel from './types/webrtc';
import HLSStreamModel, {FORCE_SENT_DATA_USAGE} from './types/hls';

import apiService from '../services/api';

import snackbarUtil from '../util/snackbar';
import {VSC, DVR} from '../consts/apiRoutes';
import util from '../util/general';
import {numberValue} from '../util/types';
import {
  default24H,
  CLOUD_TYPE,
  DAY_INTERVAL,
  VSCCommand,
  VSCCommandString,
  LAYOUT_DATA,
  DEFAULT_REGION,
  HLS_DATA_REQUEST_TIMEOUT,
  HLS_MAX_RETRY,
  BEGIN_OF_DAY_STRING,
  END_OF_DAY_STRING,
  HLS_GET_DATA_DIRECTLY_TIMEOUT,
  DEFAULT_SEARCH_OFFSET_IN_SECONDS,
  REFRESH_TIMELINE_INTERVAL,
} from '../consts/video';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {NVRPlayerConfig, CALENDAR_DATE_FORMAT} from '../consts/misc';
import {TIMEZONE_MAP} from '../consts/timezonesmap';
import {VIDEO as VIDEO_TXT, STREAM_STATUS} from '../localization/texts';
import ROUTERS from '../consts/routes';

const DirectServerModel = types
  .model({
    id: types.optional(types.identifier, () => util.getRandomId()),
    serverIP: types.string,
    publicIP: types.string,
    name: types.maybeNull(types.string),
    port: types.number,
    serverID: types.string,
    userName: types.string,
    password: types.string,
    kDVR: types.number,
    // channels: types.string,
    channelList: types.array(types.number),
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
    get server() {
      return getSnapshot(self);
    },
    get playData() {
      return {
        serverIP: self.serverIP,
        publicIP: self.publicIP,
        // name: self.name,
        port: self.port,
        serverID: self.serverID,
        userName: self.userName,
        password: self.password,
        kDVR: self.kDVR,
        searchMode: self.searchMode,
        date: self.searchMode ? self.date : undefined,
        hd: self.hd,
        channels: self.channels,
        channelList: undefined,
        byChannel: true,
        interval: DAY_INTERVAL,
      };
    },
    get channels() {
      return self.channelList.join(',');
    },
  }))
  .actions(self => ({
    setLoginInfo(userName, password) {
      __DEV__ && console.log('GOND setLoginInfo for ', self.serverID);
      self.userName = userName;
      self.password = password;
    },
    setHD(value) {
      self.hd = value;
    },
    setChannels(value) {
      __DEV__ && console.log('GOND setChannels ', value);
      if (value && Array.isArray(value)) {
        // self.channels = value.join(',');
        self.channelList = [...value];
      } else {
        console.log('GOND DirectConnection set channels not valid: ', value);
      }
    },
    setStreamStatus(statusObject) {},
    reset() {
      self.channelList = [];
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
    password: util.AES_decrypt(server.PWD, apiService.configToken.apiKey),
    kDVR: server.KDVR,
    channelList: [],
    searchMode: false,
    date: '',
    hd: false,
  });
};

const DirectStreamModel = types
  .model({
    server: types.reference(DirectServerModel),
    channel: types.reference(ChannelModel),
    isLoading: types.optional(types.boolean, false),
    connectionStatus: types.optional(types.string, ''),
    error: types.maybeNull(types.string),
    needReset: types.optional(types.boolean, false),
  })
  .views(self => ({
    get playData() {
      if (!self.server || !self.channel) return {};
      const {channelNo, name, kChannel} = self.channel;

      return {
        ...self.server.playData,
        channelNo,
        channels: '' + channelNo,
        channelName: name,
        kChannel,
        byChannel: true,
        interval: DAY_INTERVAL,
      };
    },
    get userName() {
      return self.server ? self.server.userName : '';
    },
    get password() {
      return self.server ? self.server.password : '';
    },
    get channelNo() {
      if (!self.channel) return null;
      return self.channel.channelNo;
    },
    get channelName() {
      if (!self.channel) return '';
      return self.channel.name;
    },
    get kChannel() {
      return self.channel ? self.channel.kChannel : -1;
    },
    get videoSource() {
      return self.channel ? self.channel.videoSource : -1;
    },
    get serverIP() {
      return self.server ? self.server.serverIP : null;
    },
    get port() {
      return self.server ? self.server.port : null;
    },
    get channels() {
      return self.channel ? String(self.channel.channelNo) : '';
    },
    get streamStatus() {
      const {isLoading, connectionStatus, error} = self;
      return {
        isLoading,
        connectionStatus,
        error,
      };
    },
    get videoImage() {
      return self.videoFrame && typeof self.videoFrame == 'string'
        ? {uri: 'data:image/jpeg;base64,' + self.videoFrame}
        : NVR_Play_NoVideo_Image;
    },
    get isReady() {
      return true;
    },
  }))
  .volatile(self => ({
    videoFrame: null,
  }))
  .actions(self => ({
    setPlay(value) {
      self.playing = value;
    },
    setSearchDate(value) {
      self.server.date = value;
    },
    setStreamStatus({connectionStatus, error, isLoading, needReset}) {
      connectionStatus != undefined &&
        (self.connectionStatus = connectionStatus);
      isLoading != undefined && (self.isLoading = isLoading);
      needReset != undefined && (self.needReset = needReset);
      error != undefined && (self.error = error);
    },
    updateFrame(value) {
      if (value && typeof value == 'string' && value.length > 0)
        self.videoFrame = value;
    },
    reset() {
      self.videoFrame = '';
    },
  }));

const DSTDateModel = types.model({
  wYear: types.number,
  wMonth: types.number,
  wDayOfWeek: types.number,
  wDay: types.number,
  wHour: types.number,
  wMinute: types.number,
  wSecond: types.number,
  // wMilliseconds: types.number,
});
const parseDSTDate = source => {
  return DSTDateModel.create({
    wYear: parseInt(source.wYear),
    wMonth: parseInt(source.wMonth),
    wDayOfWeek: parseInt(source.wDayOfWeek),
    wDay: parseInt(source.wDay),
    wHour: parseInt(source.wHour),
    wMinute: parseInt(source.wMinute),
    wSecond: parseInt(source.wSecond),
  });
};

const TimezoneModel = types.model({
  bias: types.number,
  standardName: types.string,
  daylightName: types.string,
  daylightBias: types.number,
  daylightDate: DSTDateModel,
  standardDate: DSTDateModel,
});

const TimelineModel = types.model({
  id: types.number,
  begin: types.number,
  end: types.number,
  // time: types.number,
  type: types.number,
});

const RecordingDateModel = types.model({
  textColor: types.string,
  dotColor: types.maybeNull(types.string),
  marked: types.maybeNull(types.boolean),
});

// DateTimeModel = types.model({
//   year: types.number,
//   month: types.number,
//   day: types.number,
//   hour: types.number,
//   minute: types.number,
//   timezoneOffset: types.number,
// });

// const AuthenModel = types
//   .model({
//     serverID: types.string,
//     userName: types.string,
//     password: types.string,
//   })
//   .actions({
//     save(userName, password) {
//       self.userName = userName;
//       self.password = password;
//     },
//   });

export const VideoModel = types
  .model({
    kDVR: types.maybeNull(types.number),

    allChannels: types.array(ChannelModel),
    maxReadyChannels: types.number,
    cloudType: types.number,
    // authenData: types.array(AuthenModel),

    rtcConnection: types.maybeNull(RTCStreamModel),
    hlsStreams: types.array(HLSStreamModel),
    directConnection: types.maybeNull(DirectServerModel),
    directStreams: types.array(DirectStreamModel),
    selectedChannel: types.maybeNull(types.number),

    gridLayout: types.optional(types.number, 2),
    channelFilter: types.string,
    isLoading: types.boolean,
    message: types.string,
    nvrUser: types.maybeNull(types.string),
    nvrPassword: types.maybeNull(types.string),
    isAuthenticated: types.optional(types.boolean, false),
    isLive: types.boolean,
    isFullscreen: types.boolean,
    hdMode: types.boolean,
    canSwitchMode: types.boolean,
    paused: types.optional(types.boolean, false),
    noVideo: types.optional(types.boolean, false),
    showAuthenModal: types.boolean,
    // frameTime: types.number,
    // frameTimeString: types.string,
    searchDate: types.maybeNull(types.frozen()), // luxon DateTime
    searchPlayTime: types.maybeNull(types.string),
    dvrTimezone: types.maybeNull(TimezoneModel),
    timezoneOffset: types.maybeNull(types.number), // offset value
    timezoneName: types.maybeNull(types.string), // IANA string
    // TODO: timestamp should use BigNumber?
    searchBegin: types.maybeNull(types.number),
    searchEnd: types.maybeNull(types.number),
    staticHoursOfDay: types.maybeNull(types.number),
    forceDstHour: types.maybeNull(types.number),
    isHealthPlay: types.optional(types.boolean, false),
    isAlertPlay: types.optional(types.boolean, false),
    isPreloadStream: types.optional(types.boolean, false),
    currentGridPage: types.optional(types.number, 0),
  })
  .volatile(self => ({
    reactions: [],
    frameTime: 0,
    frameTimeString: null, // NVRPlayerConfig.FrameFormat

    recordingDates: {},
    timeline: [],
    hlsTimestamps: [],
    // selectedHLSStream: null,
    waitForTimezone: false,
    checkTimezoneTimeout: null,
    timezoneRetries: 0,
    timelineRetries: 0,
    daylistRetries: 0,
    waitForTimeline: false,
    checkTimelineTimeout: null,
    checkDaylistTimeout: null,

    timelineRequestId: '',

    isInVideoView: false,
    isDraggingTimeline: false,
    shouldShowSnackbar: true,
    isDirectDSTAwareness: false,
    shouldUpdateSearchTimeOnGetTimeline: false,

    // refreshingTimeline: false,
    refreshTimelineInterval: null,
    beginSearchTime: null, // luxon DateTime
    shouldLinkNVRUser: false, // enable when input login form
  }))
  .views(self => ({
    get isCloud() {
      return self.cloudType > CLOUD_TYPE.DIRECTION;
    },
    get activeChannels() {
      const res = self.allChannels.filter(ch => ch.isActive);
      return res; // res.map(ch => ch.data);
    },
    get activeChannelNos() {
      return this.activeChannels.map(ch => ch.channelNo);
    },
    get displayChannels() {
      if (
        self.isAlertPlay ||
        !self.isLive ||
        self.cloudType == CLOUD_TYPE.DIRECTION ||
        self.cloudType == CLOUD_TYPE.DEFAULT
      )
        return self.allChannels;
      return self.activeChannels;
    },
    get gridItemsPerPage() {
      return self.gridLayout * self.gridLayout;
    },
    get needAuthen() {
      __DEV__ &&
        console.log('GOND needAuthen: ', self.nvrUser, self.nvrPassword);
      return (
        (self.cloudType == CLOUD_TYPE.DIRECTION ||
          self.cloudType == CLOUD_TYPE.DEFAULT) &&
        ((self.nvrUser && self.nvrUser.length == 0) ||
          (self.nvrPassword && self.nvrPassword.length == 0))
      );
    },
    get canDisplayChannels() {
      return (
        (self.cloudType != CLOUD_TYPE.DIRECTION &&
          self.cloudType != CLOUD_TYPE.DEFAULT) ||
        self.isAuthenticated
      );
    },
    // get directStreams() {
    //   return self.allChannels
    //     .filter(ch =>
    //       ch.name.toLowerCase().includes(self.channelFilter.toLowerCase())
    //     )
    //     .map(ch => ({
    //       ...self.directConnection,
    //       channelNo: ch.channelNo,
    //       channels: '' + ch.channelNo,
    //       channelName: ch.name,
    //       kChannel: ch.kChannel,
    //       byChannel: true,
    //       interval: DAY_INTERVAL,
    //       // seekpos: self.isLive || !self.timelinePos ? undefined : {
    //       //   pos: self.timelinePos,
    //       //   HD: self.hdMode,
    //       // }
    //     }));
    // },
    get selectedChannelIndex() {
      // return self.allChannels
      return self.displayChannels
        ? self.displayChannels.findIndex(
            ch => ch.channelNo === self.selectedChannel
          )
        : 0;
    },
    get selectedChannelData() {
      return self.allChannels
        ? self.allChannels.find(ch => ch.channelNo === self.selectedChannel)
        : null;
    },
    get selectedStream() {
      if (util.isNullOrUndef(self.selectedChannel)) return null;
      switch (self.cloudType) {
        case CLOUD_TYPE.DEFAULT:
        case CLOUD_TYPE.DIRECTION:
          const server = self.directStreams.find(
            s => s.channelNo == self.selectedChannel
          );
          return server ?? null;
        case CLOUD_TYPE.HLS:
          const s = self.hlsStreams.find(
            s => s.channel.channelNo == self.selectedChannel
          );
          __DEV__ && console.log('GOND HLS selected: ', s);
          return s;
        // return self.selectedHLSStream;
        case CLOUD_TYPE.RTC:
          if (!self.rtcConnection) return null;
          return self.rtcConnection.viewers.find(
            v => v.channelNo == self.selectedChannel
          );
      }
      return null;
    },
    get filteredChannels() {
      if (!self.channelFilter) return self.allChannels;
      return self.allChannels.filter(ch =>
        ch.name.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get filteredActiveChannels() {
      if (!self.channelFilter) return self.activeChannels;
      return self.allChannels.filter(
        ch =>
          ch.isActive &&
          ch.name.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get filteredDisplayChannels() {
      if (
        !self.isLive ||
        self.cloudType == CLOUD_TYPE.DIRECTION ||
        self.cloudType == CLOUD_TYPE.DEFAULT
      )
        return self.filteredChannels;
      return self.filteredActiveChannels;
    },
    get filteredDisplayChannelTexts() {
      if (
        !self.isLive ||
        self.cloudType == CLOUD_TYPE.DIRECTION ||
        self.cloudType == CLOUD_TYPE.DEFAULT
      )
        return (
          'self.filteredChannels self.isLive = ' +
          self.isLive +
          ' | self.cloudType = ' +
          self.cloudType
        );
      return (
        'self.filteredActiveChannels self.isLive = ' +
        self.isLive +
        ' | self.cloudType = ' +
        self.cloudType
      );
    },
    get timezone() {
      // if (self.cloudType == CLOUD_TYPE.DEFAULT || CLOUD_TYPE.DIRECTION) {
      //   return util.isNullOrUndef(self.timezoneOffset)
      //     ? DateTime.local().zone.name
      //     : `UTC${
      //         self.timezoneOffset > 0
      //           ? '+' + self.timezoneOffset
      //           : self.timezoneOffset < 0
      //           ? self.timezoneOffset
      //           : ''
      //       }`;
      // } else {
      return self.timezoneName ?? DateTime.local().zone.name;
      // }
    },
    get hoursOfDay() {
      if (
        self.cloudType == CLOUD_TYPE.DIRECTION ||
        (self.cloudType == CLOUD_TYPE.DEFAULT && self.staticHoursOfDay)
      )
        return self.staticHoursOfDay;

      if (!self.searchDate) return 24;
      let searchDateTomorrow = self.searchDate.plus({days: 1});
      return (
        (searchDateTomorrow.toSeconds() - self.searchDate.toSeconds()) / 3600
      );
    },
    get dstHour() {
      if (!self.dvrTimezone) return 0;
      return self.dvrTimezone.daylightDate.wHour;
    },
    get dstDuration() {
      return 24 - self.hoursOfDay;
    },
    searchDateInSeconds(zone, options) {
      // console.log('GOND searchDateInSeconds = ', self.searchDate);
      const searchDate =
        self.searchDate ?? DateTime.now().setZone(self.timezone).startOf('day');
      if (zone) {
        return searchDate.setZone(zone, options).toSeconds();
      }
      // if (
      //   self.cloudType == CLOUD_TYPE.DEFAULT ||
      //   self.cloudType == CLOUD_TYPE.DIRECTION
      // ) {
      //   return searchDate.setZone('utc', {keepLocalTime: true}).toSeconds();
      // } else {
      return searchDate.toSeconds();
      // }
    },
    get searchDateString() {
      const searchDate =
        self.searchDate ?? DateTime.now().setZone(self.timezone).startOf('day');
      return searchDate.toFormat(NVRPlayerConfig.RequestTimeFormat);
    },
    get firstChannelNo() {
      return self.allChannels && self.allChannels.length > 0
        ? self.allChannels[0].channelNo
        : 0;
    },
    get searchPlayTimeLuxon() {
      // __DEV__ &&
      //   console.log(
      //     'GOND searchPlayTimeLuxon 1: ',
      //     self.searchPlayTime,
      //     self.timezone
      //   );
      if (self.searchPlayTime) {
        const timezone = self.timezone; // self.isAlertPlay ? 'utc' : self.timezone;
        let result = DateTime.fromFormat(
          self.searchPlayTime,
          NVRPlayerConfig.RequestTimeFormat,
          {zone: timezone}
        );
        // __DEV__ && console.log('GOND searchPlayTimeLuxon 2: ', result);
        if (!result.isValid) {
          result = DateTime.fromISO(self.searchPlayTime, {
            zone: timezone,
          });
          // __DEV__ && console.log('GOND searchPlayTimeLuxon 3: ', result);

          if (!result.isValid) {
            __DEV__ &&
              console.log(
                'GOND searchPlayTimeLuxon: invalid time input format ',
                self.searchPlayTime
              );
            return self.searchDate ?? DateTime.now().startOf('day');
          }
        }

        // __DEV__ &&
        //   console.log(
        //     'GOND searchPlayTimeLuxon 4: ',
        //     result,
        //     result.toFormat(NVRPlayerConfig.FrameFormat)
        //   );
        return result;
      } else {
        // __DEV__ && console.log('GOND searchPlayTimeLuxon 5: ', self.searchDate);
        return (
          self.searchDate ??
          DateTime.now().setZone(self.timezone).startOf('day')
        );
      }
    },
    get searchPlayTimeBySeconds() {
      return self.searchPlayTime
        ? self.searchPlayTimeLuxon.toSeconds() - self.searchDate.toSeconds()
        : 0;
    },
    get beginSearchTimeOffset() {
      return self.beginSearchTime
        ? self.beginSearchTime.toSeconds() -
            self.beginSearchTime.startOf('day').toSeconds()
        : 0;
    },
    get directData() {
      return self.directStreams.filter(s =>
        s.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get hlsData() {
      return self.hlsStreams.filter(s =>
        s.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get rtcData() {
      if (!self.rtcConnection) return [];
      return self.rtcConnection.viewers.filter(v =>
        v.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get videoData() {
      switch (self.cloudType) {
        case CLOUD_TYPE.DEFAULT:
        case CLOUD_TYPE.DIRECTION:
          return self.directData;
        case CLOUD_TYPE.HLS:
          return self.hlsData;
        case CLOUD_TYPE.RTC:
          return self.rtcConnection
            ? self.rtcConnection.viewers.filter(
                v =>
                  v.channel.isActive &&
                  v.channelName
                    .toLowerCase()
                    .includes(self.channelFilter.toLowerCase())
              )
            : [];
      }
    },
    get currentDisplayVideoData() {
      let videoDataList =
        self.cloudType == CLOUD_TYPE.HLS
          ? self.videoData.filter(s => s.isActive)
          : self.videoData;
      __DEV__ && console.log('GOND videoDataList ', videoDataList);
      if (videoDataList.length == 0) {
        __DEV__ && console.log('GOND videoDataList is empty <>');
        return [];
      }

      __DEV__ &&
        console.log(
          'GOND videoDataList: ',
          self.gridItemsPerPage,
          self.currentGridPage,
          videoDataList
        );
      videoDataList = videoDataList.filter(
        (_, index) =>
          index < self.gridItemsPerPage * (self.currentGridPage + 1) &&
          index >= self.gridItemsPerPage * self.currentGridPage
      );

      __DEV__ && console.log('GOND videoDataList 2: ', videoDataList);

      while (videoDataList.length % self.gridLayout != 0)
        videoDataList.push({});

      return videoDataList ?? [];
    },
    get displayDateTime() {
      return self.frameTimeString && self.frameTimeString.length > 0
        ? self.frameTimeString
        : self.isLive
        ? DateTime.now().toFormat(NVRPlayerConfig.FrameFormat)
        : self.beginSearchTime
        ? self.beginSearchTime.toFormat(NVRPlayerConfig.FrameFormat)
        : self.searchPlayTimeLuxon.toFormat(NVRPlayerConfig.FrameFormat);
    },
    get hoursOfSearchDate() {
      if (!self.searchDate) return 0;
      const res = Math.round(
        (self.searchDate.endOf('day').toSeconds() -
          self.searchDate.startOf('day').toSeconds() +
          1) /
          3600
      );
      __DEV__ && console.log('GOND $$$ hoursOfSearchDate: ', res);
      return res;
    },
    get isDSTTransitionDate() {
      if (!self.searchDate) return false;
      return self.hoursOfSearchDate != default24H;
    },
    get isDSTStartDate() {
      if (!self.searchDate) return false;
      return self.hoursOfSearchDate < default24H;
    },
    get isDSTEndDate() {
      if (!self.searchDate) return false;
      return self.hoursOfSearchDate > default24H;
    },
  }))
  .actions(self => {
    // volatile state:
    // let streamReadyCallback = null;
    // let streamTimeout = null;
    // let listIdToCheck = [];
    // let streamInfoCallback = null;
    // let peerConnectionStatsInterval = null;
    return {
      // #region hooks
      afterCreate() {
        self.reactions = [
          reaction(
            () => self.timeline,
            (newTimeline, oldTimeline) => {
              if (
                self.cloudType == CLOUD_TYPE.HLS &&
                !self.isLive &&
                self.selectedStream &&
                self.selectedStream.isWaitingForStream
              ) {
                if (
                  !newTimeline ||
                  newTimeline.length == 0 ||
                  (self.beginSearchTime &&
                    self.beginSearchTime.toSeconds() >
                      newTimeline[newTimeline.length - 1].end)
                ) {
                  self.selectedStream.stopWaitingCauseNoVideo();
                }
              }
            }
          ),
        ];
      },
      beforeDestroy() {
        self.reactions && self.reactions.forEach(unsubscribe => unsubscribe());
      },
      // #region setters
      setNVRLoginInfo(username, password) {
        self.nvrUser = username;
        self.nvrPassword = password;
        self.directConnection &&
          self.directConnection.setLoginInfo(username, password);
      },
      setChannelFilter(value) {
        self.channelFilter = value;
        self.currentGridPage = 0;
        self.updateCurrentDirectChannel();
      },
      setLoading(value) {
        self.isLoading = value;
      },
      setShouldShowVideoMessage(value) {
        self.shouldShowSnackbar = value ? true : false;
      },
      setDirectDSTAwareness(value) {
        if (Platform.OS == 'ios') return; // TODO: temporarily fix for iOS
        self.isDirectDSTAwareness = value ? true : false;
      },
      selectDVR(value) {
        if (util.isNullOrUndef(value)) return;
        if (typeof value === 'object' && Object.keys(value).includes('kDVR'))
          self.kDVR = value.kDVR;
        else if (typeof value == 'number') self.kDVR = value;
      },
      setGridLayout(value) {
        self.gridLayout = value;
        self.currentGridPage = 0;
        // __DEV__ && console.log('GOND direct setChannel 1');
        self.directConnection &&
          self.directConnection.setChannels(
            self.directData
              .map(s => s.channelNo)
              .filter((_, index) => index < self.gridItemsPerPage)
          );
      },
      updateCurrentDirectChannel() {
        if (self.directConnection) {
          self.directConnection.setChannels(
            self.directData
              .map(s => s.channelNo)
              .filter(
                (_, index) =>
                  index < self.gridItemsPerPage * (self.currentGridPage + 1) &&
                  index >= self.gridItemsPerPage * self.currentGridPage
              )
          );
        }
      },
      changeGridPage(isNext) {
        const totalPage = Math.ceil(
          (1.0 * self.videoData.length) / self.gridItemsPerPage
        );
        __DEV__ &&
          console.log(
            'GOND changeGridPage totalPage',
            totalPage,
            self.videoData.length,
            self.gridItemsPerPage
          );
        let changed = false;
        if (isNext && self.currentGridPage < totalPage - 1) {
          self.currentGridPage++;
          changed = true;
        } else if (!isNext && self.currentGridPage > 0) {
          self.currentGridPage--;
          changed = true;
        }
        if (changed) {
          self.updateCurrentDirectChannel();
        }

        return changed;
      },
      /*
      setStreamReadyCallback(fn) {
        if (fn && typeof fn !== 'function') {
          console.log('GOND set streamReadyCallback is not a function!');
          return;
        }
        // __DEV__ && console.log('GOND streamReadyCallback ...');
        streamReadyCallback = fn;
      },
      */
      selectChannel(value, autoStart = true) {
        let key =
          typeof value == 'number'
            ? 'channelNo'
            : typeof value == 'string'
            ? 'name'
            : undefined;
        if (key == undefined) {
          __DEV__ &&
            console.log('GOND ERROR !!! Select channel failed: ', value);
          return;
        }

        const foundChannel = self.allChannels.find(ch => ch[key] == value);
        if (!foundChannel) {
          console.log('GOND selected Channel not found: ', value);
          snackbarUtil.onError('Selected channel not found!');
          return false;
        }
        __DEV__ &&
          console.log('GOND selected Channel: ', getSnapshot(foundChannel));

        self.setNoVideo(false);
        if (self.timeline && self.timeline.length > 0) {
          self.timeline = [];
        }
        if (self.hdMode) self.hdMode = false;

        if (self.cloudType == CLOUD_TYPE.HLS && !self.isAlertPlay) {
          // reset previous channel status: Grzzz
          if (self.selectedStream) {
            if (
              !self.selectedStream.isLive &&
              self.selectedStream.targetUrl &&
              util.isValidHttpUrl(self.selectedStream.targetUrl.url)
            ) {
              self.selectedStream.updateStream(
                self.selectedStream.targetUrl.sid,
                true
              );
              self.selectedStream.targetUrl.reset();
            }

            self.selectedStream.setLive(true);
            self.selectedStream.setHD(false);
            self.selectedStream.select(false);
          }
        }

        // __DEV__ &&
        //   console.log(
        //     `GOND selected Channel ${value} find stream data = : `,
        //     self.videoData
        //   );
        // const foundStream = self.videoData.find(row => {
        //   return row.data.find(s => s.channelNo == value);
        // });
        const foundStream = self.videoData.find(
          s => s.channelNo == foundChannel.channelNo
        );
        __DEV__ && console.log('GOND foundStream: ', foundStream);
        if (foundStream) {
          switch (self.cloudType) {
            case CLOUD_TYPE.DEFAULT:
            case CLOUD_TYPE.DIRECTION:
              break;
            case CLOUD_TYPE.HLS:
              // create stream first for showing in player
              foundStream.select(true);
              if (
                foundStream.isLive != self.isLive ||
                foundStream.isHD != self.hdMode
              ) {
                foundStream.setLive(self.isLive);
                foundStream.setHD(self.hdMode);
                if (autoStart)
                  self.getHLSInfos({channelNo: value, timeline: !self.isLive});
              } else {
                foundStream.targetUrl.resetBitrateInfo();
              }
              break;
            case CLOUD_TYPE.RTC:
              break;
          }
        } else {
          __DEV__ &&
            console.log(
              'GOND stream not found, add new one ... ',
              foundStream,
              DateTime.now().setZone('').isValid
            );
          switch (self.cloudType) {
            case CLOUD_TYPE.DEFAULT:
            case CLOUD_TYPE.DIRECTION:
              // console.log(
              //   '### GOND this is unbelievable, how can this case happen, no direct stream found while channel existed!!!'
              // );
              self.getDirectInfos(foundChannel.channelNo);
              break;
            case CLOUD_TYPE.HLS:
              // create stream first for showing in player
              const newStream = HLSStreamModel.create({
                // id: util.getRandomId(),
                channel: foundChannel,
                isLoading: true,

                connectionStatus: STREAM_STATUS.CONNECTING,
                isHD: self.hdMode,
                isLive: self.isLive,
                isSelected: true,
              });
              newStream.setOnErrorCallback(self.onHLSError);
              self.hlsStreams.push(newStream);
              if (
                self.timezoneName &&
                DateTime.now().setZone(self.timezoneName).isValid
              ) {
                self.getHLSInfos({channelNo: value, timeline: !self.isLive});
              } // else if (!self.waitForTimezone) {
              // self.getVideoInfos(value);
              // }
              newStream.setLive(self.isLive);
              newStream.setHD(self.hdMode);
              break;
            case CLOUD_TYPE.RTC:
              if (self.rtcConnection && self.rtcConnection.isValid) {
                self.rtcConnection.createStreams(
                  self.rtcConnection.connectionInfo,
                  foundChannel
                );
              }
              break;
          }
        }
        self.selectedChannel = foundChannel.channelNo;
        return true;
      },
      setFrameTime(value, fromZone) {
        // __DEV__ && console.log('GOND setFrameTime ', value);
        if (typeof value == 'string') {
          // TODO: convert
          self.frameTime = DateTime.fromFormat(
            value,
            NVRPlayerConfig.ResponseTimeFormat,
            {zone: fromZone ?? 'utc'}
          ).toSeconds();
        } else if (typeof value == 'number') {
          if (fromZone) {
            const dt = DateTime.fromSeconds(value, {zone: fromZone});
            __DEV__ &&
              console.log(
                'GOND setFrameTime ',
                dt.setZone(self.timezone).toSeconds()
              );
            self.frameTime = dt.setZone(self.timezone).toSeconds();
          } else {
            self.frameTime = value;
          }
        }
        // __DEV__ &&
        //   console.log(
        //     'GOND setFrameTime ',
        //     DateTime.fromSeconds(value, {zone: self.timezone}).toFormat(
        //       NVRPlayerConfig.FrameFormat
        //     )
        //   );
        self.checkForRefreshingTimeline();
      },
      clearRefreshTimelineInterval() {
        if (self.refreshTimelineInterval) {
          clearInterval(self.refreshTimelineInterval);
          self.refreshTimelineInterval = null;
        }
      },
      checkForRefreshingTimeline() {
        if (
          !self.isLive &&
          self.timeline &&
          self.timeline.length > 0 &&
          self.frameTime >= self.timeline[self.timeline.length - 1].begin &&
          !self.refreshTimelineInterval
          // !self.refreshingTimeline
        ) {
          __DEV__ && console.log('GOND start Refreshing timeline interval ');
          self.refreshTimelineInterval = setInterval(() => {
            // self.refreshingTimeline = true;
            if (self.isLive || !self.timeline || self.timeline.length == 0) {
              self.clearRefreshTimelineInterval();
              return;
            }
            if (self.frameTime < self.timeline[self.timeline.length - 1].begin)
              return;
            switch (self.cloudType) {
              case CLOUD_TYPE.DEFAULT:
              case CLOUD_TYPE.DIRECTION:
                break;
              case CLOUD_TYPE.HLS:
                if (self.selectedChannel && self.selectedStream)
                  self.getTimeline(
                    self.selectedChannel,
                    self.selectedStream.targetUrl.sid
                  );
                break;
              case CLOUD_TYPE.RTC:
                break;
            }
          }, REFRESH_TIMELINE_INTERVAL);
        }
      },
      setDisplayDateTime(value) {
        self.frameTimeString = value;
        // __DEV__ && console.trace('GOND setDisplayDateTime: ', value);
      },
      setSearchDate(value, format) {
        __DEV__ && console.log('GOND setSearchDate ', value, format);
        if (typeof value == 'string') {
          self.setNoVideo(false);
          if (self.timeline && self.timeline.length > 0) {
            self.timeline = [];
          }
          try {
            self.searchDate = DateTime.fromFormat(
              value,
              format ?? NVRPlayerConfig.RequestTimeFormat,
              {zone: self.timezone}
            );
          } catch (err) {
            __DEV__ && console.log('*** GOND setSearchDate failed: ', err);
            return;
          }
          // if (self.timezoneName) {
          //   self.searchDate = self.searchDate.setZone(self.timezoneName);
          // } else if (self.timezoneOffset) {
          //   self.searchDate.setZone(
          //     `UTC${
          //       self.timezoneOffset > 0
          //         ? '+' + self.timezoneOffset
          //         : self.timezoneOffset < 0
          //         ? self.timezoneOffset
          //         : ''
          //     }`
          //   );
          // }
          // else : 'local'
          self.setDisplayDateTime(
            self.searchDate.toFormat(NVRPlayerConfig.FrameFormat)
          );

          if (self.cloudType == CLOUD_TYPE.HLS && self.selectedStream) {
            // self.onHLSSingleStreamChanged(true);
            self.stopHLSStream(
              self.selectedChannel,
              self.selectedStream.targetUrl.sid
            ); // no need to yield/await

            self.selectedStream.resetUrls(false, true);
            self.getHLSInfos({channelNo: self.selectedChannel, timeline: true});
          }
        } else {
          // TODO: convert timezone
          __DEV__ &&
            console.log('*** GOND setSearchDate value is not a string');
        }
      },
      setRecordingDates(value) {
        __DEV__ && console.log('&&& GOND setRecordingDates data = ', value);
        const today = DateTime.now()
          .setZone(self.timezone)
          .toFormat(CALENDAR_DATE_FORMAT);
        self.recordingDates = value.reduce((result, day) => {
          if (day == today) {
            result[day] = {
              textColor: 'red',
              dotColor: 'red',
              marked: true,
            };
          } else
            result[day] = {
              textColor: 'red',
            };
          return result;
        }, {});
        __DEV__ &&
          console.log('&&& GOND recordingDates = ', self.recordingDates);
      },
      buildTimezoneData(data) {
        self.stopWaitTimezone();
        __DEV__ && console.log('GOND buildTimezoneData: ', data);

        if (self.dvrTimezone && self.timezoneName) {
          __DEV__ &&
            console.log(
              'GOND timezone already existed: ',
              self.timezoneName,
              ', incoming: ',
              data
            );
        }
        let tzName = '';

        if (Array.isArray(TIMEZONE_MAP[data.StandardName])) {
          let parseSuccess = true;
          let i = 0;
          do {
            tzName = '' + TIMEZONE_MAP[data.StandardName][i];
            try {
              const tmp = DateTime.local().setZone(tzName);
              __DEV__ &&
                console.log('&&& GOND buildTimezoneData parse success = ', tmp);
            } catch {
              i++;
              parseSuccess = false;
              // __DEV__ && console.log('&&& GOND buildTimezoneData parse failed = ', tzName)
            }
          } while (
            parseSuccess === false &&
            i < TIMEZONE_MAP[data.StandardName].length
          );
          parseSuccess === false && (tzName = DateTime.local().zoneName);
        } else {
          tzName = '' + TIMEZONE_MAP[data.StandardName];
          try {
            DateTime.local().setZone(tzName);
          } catch {
            tzName = DateTime.local().zoneName;
          }
        }
        self.timezoneName = tzName;
        self.dvrTimezone = TimezoneModel.create({
          bias: parseInt(data.Bias),
          daylightBias: parseInt(data.DaylightBias),
          standardName: data.StandardName,
          daylightName: data.DaylightName,
          daylightDate: parseDSTDate(data.DaylightDate),
          standardDate: parseDSTDate(data.StandardDate),
        });
        // __DEV__ &&
        //   console.log(`GOND HLS get timezone: `, tzName, self.timezone);

        // correct search date after timezone acquired
        self.getSafeSearchDate();
        // if (self.searchDate) {
        //   if (self.searchDate.zone.name != self.timezone)
        //     self.searchDate = self.searchDate
        //       .setZone(self.timezone, {keepLocalTime: true})
        //       .startOf('day');
        // } else {
        //   self.searchDate = DateTime.now()
        //     .setZone(self.timezone)
        //     .startOf('day');
        // }

        // Request data after timezone acquired
        // if (self.cloudType == CLOUD_TYPE.HLS) {
        //   __DEV__ && console.log(`GOND on HLS get HLS info after build TZ`);
        //   self.getHLSInfos({
        //     channelNo: self.selectedChannel ?? undefined,
        //     daylist: !self.isLive,
        //     timeline: !self.isLive,
        //   });
        // }
        self.onTimezoneAcquired();
      },
      onTimezoneAcquired() {
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            self.getDirectInfos(self.selectedChannel ?? undefined);
            break;
          case CLOUD_TYPE.HLS:
            __DEV__ && console.log(`GOND on HLS get HLS info after build TZ`);
            self.getHLSInfos({
              channelNo: self.selectedChannel ?? undefined,
              daylist: !self.isLive,
              timeline: !self.isLive,
            });
            break;
          // case CLOUD_TYPE.RTC:
          //   __DEV__ && console.log('GOND getRTCInfos');
          //   getInfoPromise = self.getRTCInfos(channelNo);
          //   break;
          default:
            Promise.resolve(false);
            __DEV__ &&
              console.log(
                'GOND onTimezoneAcquired default case: ',
                self.cloudType
              );
            break;
        }
      },
      setTimezoneOffset(value) {
        if (util.isNullOrUndef(value)) {
          __DEV__ && console.log('GOND setTimezone, is null: ', value);
          return;
        }
        __DEV__ && console.log('GOND setTimezone ', value);
        if (typeof value === 'number') {
          self.timezoneOffset = value / (60 * 60 * 1000);
          // TODO: update searchDate
        }
      },
      checkTimeOnTimeline(value) {
        __DEV__ &&
          console.log('GOND checkTimeOnTimeline ', value, self.timeline);
        // let timeToCheck = value;
        // if (
        //   self.cloudType == CLOUD_TYPE.DEFAULT ||
        //   self.cloudType == CLOUD_TYPE.DIRECTION
        // ) {
        //   timeToCheck = DateTime.fromSeconds(timeToCheck, {zone: self.timezone})
        //     .setZone('utc', {keepLocalTime: true})
        //     .toSeconds();
        //   __DEV__ &&
        //     console.log('GOND checkTimeOnTimeline direct', timeToCheck);
        // }

        // for (let i = 0; i < self.timeline.length; i++) {
        //   if (timeToCheck <= self.timeline[i].end) {
        //     __DEV__ &&
        //       console.log(
        //         'GOND checkTimeOnTimeline ',
        //         timeToCheck,
        //         self.timeline[i].end,
        //         timeToCheck - self.timeline[i].end
        //       );
        //     return true;
        //   }
        // }
        // return false;
        if (!self.timeline || self.timeline.length == 0) return false;
        const lastTime = self.timeline[self.timeline.length - 1].end;
        __DEV__ &&
          console.log(
            'GOND checkTimeOnTimeline 2 : ',
            DateTime.fromSeconds(value, {zone: self.timezone}),
            lastTime,
            value < lastTime
          );
        return value < lastTime;
      },
      buildDirectTimeline(data) {
        const processedData = self.isDirectDSTAwareness
          ? data
          : data.map(item => ({
              ...item,
              begin: DateTime.fromSeconds(numberValue(item.begin), {
                zone: 'utc',
              })
                .setZone(self.timezone, {keepLocalTime: true})
                .toSeconds(),
              end: DateTime.fromSeconds(numberValue(item.end), {
                zone: 'utc',
              })
                .setZone(self.timezone, {keepLocalTime: true})
                .toSeconds(),
            }));
        self.setTimeline(processedData);
      },
      setTimeline(value) {
        // if (TimelineModel.is(value)) {
        //   self.timeline = TimelineModel.create(getSnapshot(value));
        // }
        // self.refreshingTimeline && (self.refreshingTimeline = false);
        if (!value || !Array.isArray(value)) {
          __DEV__ && console.log('GOND setTimeline, not an array ', value);
          self.shouldUpdateSearchTimeOnGetTimeline = false;
          return;
        }
        __DEV__ && console.log('GOND setTimeline ', value);
        if (value.length == 0) {
          self.shouldUpdateSearchTimeOnGetTimeline = false;
          self.setNoVideo(true);
          return;
        }

        self.timeline = value
          .map(item =>
            // TimelineModel.create({
            ({
              id: numberValue(item.id),
              begin: numberValue(item.begin),
              end: numberValue(item.end),
              type: numberValue(item.type),
            })
          )
          .sort((x, y) => x.begin - y.begin);
        if (self.shouldUpdateSearchTimeOnGetTimeline) {
          __DEV__ && console.log('GOND shouldUpdateSearchTimeOnGetTimeline');
          self.onUpdateSearchTimePostTimeline();
        } else {
          if (
            self.beginSearchTime &&
            !self.checkTimeOnTimeline(self.beginSearchTime.toSeconds())
          ) {
            self.selectedStream.setNoVideo(true);
            self.selectedStream.stopWaitingForStream();
            // self.setNoVideo(true);
          }
        }
        // .sort((x, y) => x.begin - y.begin);
        // __DEV__ && console.log('GOND after settimeline ', self.timeline);
      },
      setTimelineDraggingStatus(value) {
        self.isDraggingTimeline = value;
      },
      setHoursOfDay(value) {
        self.staticHoursOfDay = value;
      },
      setDSTHour(value) {
        self.forceDstHour = value;
      },
      displayAuthen(value) {
        __DEV__ && console.trace('GOND displaying Login form: ', value);
        self.showAuthenModal = value;
      },
      resetNVRAuthentication() {
        if (self.isAuthenticated) return;
        if (self.nvrUser) self.setNVRLoginInfo('', '');
        self.showAuthenModal = true;
      },
      saveLoginInfo: flow(function* () {
        // if (!self.directConnection) return;
        //   const server = self.authenData.find(
        //     s => s.serverID == self.directConnection.serverID
        //   );
        //   if (server) {
        //     server.save(self.nvrUser, self.nvrPassword);
        //   } else {
        //     self.authenData.push(
        //       AuthenModel.create({
        //         serverID: self.directConnection.serverID,
        //         userName: self.nvrUser,
        //         password: self.nvrPassword,
        //       })
        //     );
        //   }
        if (!self.kDVR) return;

        const key = util.getRandomId();
        const res = yield apiService.post(
          VSC.controller,
          self.kDVR,
          VSC.linkNVRUser,
          {
            KDvr: self.kDVR,
            SID: key,
            UserName: util.AES_encrypt(self.nvrUser, key),
            Password: util.AES_encrypt(self.nvrPassword, key), // ('i3admin', key), //
          }
        );
        __DEV__ && console.log('GOND linkNVRUser: ', res);
      }),

      onLoginSuccess() {
        if (!self.isAuthenticated) self.isAuthenticated = true;

        // dongpt: post login info to CMS
        if (self.shouldLinkNVRUser) self.saveLoginInfo();
      },
      onAuthenSubmit({username, password}) {
        // __DEV__ && console.log('GOND onAuthenSubmit ', {username, password});
        if (!username || !password) return;
        // __DEV__ && console.log('GOND onAuthenSubmit 2');
        self.setNVRLoginInfo(username, password);
        self.displayAuthen(false);
        self.shouldLinkNVRUser = true;
      },
      onAuthenCancel() {
        self.displayAuthen(false);
      },
      setLiveMode(nextIsLive) {
        if (self.isLive != nextIsLive) self.isLive = nextIsLive;
      },
      switchLiveSearch(nextIsLive, startStream = false) {
        // console.trace();
        const lastValue = self.isLive;
        if (self.timeline && self.timeline.length > 0) {
          self.timeline = [];
        }

        self.setNoVideo(false);
        self.clearRefreshTimelineInterval();
        if (!nextIsLive) {
          // dongpt: handle different timezone when switching from Live to Search mode
          if (
            self.cloudType == CLOUD_TYPE.DIRECTION &&
            lastValue === true &&
            self.frameTimeString &&
            self.frameTimeString.length > 0
          ) {
            const currentSearchDate = self.searchDate ?? DateTime.now();
            const lastFrameDate = DateTime.fromFormat(
              self.frameTimeString,
              NVRPlayerConfig.FrameFormat
            );
            if (
              lastFrameDate.toFormat(
                NVRPlayerConfig.QueryStringUTCDateFormat
              ) !=
              currentSearchDate.toFormat(
                NVRPlayerConfig.QueryStringUTCDateFormat
              )
            ) {
              self.searchDate = lastFrameDate.startOf('day');
            }
          }
          // dongpt: end

          self.setDisplayDateTime(
            self.getSafeSearchDate().toFormat(NVRPlayerConfig.FrameFormat)
          );
          self.onDefaultSearchTime();
        }
        self.isLive = nextIsLive === undefined ? !self.isLive : nextIsLive;
        __DEV__ && console.log('1 self.isLive = ', self.isLive);
        if (
          self.cloudType == CLOUD_TYPE.HLS &&
          self.isLive != lastValue &&
          startStream
        ) {
          __DEV__ && console.log('GOND @@@ switchlivesearch HLS');
          if (self.selectedStream) {
            self.selectedStream.setLive(self.isLive);
          }
          // self.onHLSSingleStreamChanged(false);
          self.getHLSInfos({
            channelNo: self.selectedChannel,
            timeline: !self.isLive,
            daylist: !self.isLive,
          });
        }
      },
      onDefaultSearchTime() {
        if (self.isAlertPlay) return;
        let targetTime =
          DateTime.now().toSeconds() - DEFAULT_SEARCH_OFFSET_IN_SECONDS;
        self.setBeginSearchTime(targetTime);
        __DEV__ &&
          console.log(
            'GOND onDefaultSearchTime: ',
            DEFAULT_SEARCH_OFFSET_IN_SECONDS,
            DateTime.now(),
            targetTime
          );
        self.shouldUpdateSearchTimeOnGetTimeline = true;
      },
      // pauseAll(value) {
      //   self.paused = value;
      // },
      switchHD(value) {
        self.hdMode = util.isNullOrUndef(value) ? !self.hdMode : value;
        __DEV__ && console.log('GOND on switch HD: ', self.hdMode);

        self.setNoVideo(false);
        if (self.cloudType == CLOUD_TYPE.HLS) {
          if (self.selectedStream) {
            self.selectedStream.setHD(self.hdMode);
          }
          // self.onHLSSingleStreamChanged(false);
          // self.stopHLSStream();
          self.getHLSInfos({channelNo: self.selectedChannel});
        }
      },
      switchFullscreen(value) {
        self.isFullscreen = util.isNullOrUndef(value)
          ? !self.isFullscreen
          : value;
      },
      previousChannel() {
        if (self.selectedChannelIndex > 0) {
          self.selectChannel(
            self.displayChannels[self.selectedChannelIndex - 1].channelNo
          );
        }
      },
      nextChannel() {
        if (
          self.selectedChannelIndex < self.displayChannels.length - 1 &&
          self.selectedChannelIndex >= 0
        )
          self.selectChannel(
            self.displayChannels[self.selectedChannelIndex + 1].channelNo
          );
      },
      pause(willPause) {
        self.paused = willPause == undefined ? !self.paused : willPause;
      },
      setNoVideo(value, resetTimeline = true) {
        if (value === self.noVideo) return;
        if (__DEV__) {
          console.trace('GOND ======= Set Novideo = ', value);
        }
        self.noVideo = value;
        if (value === true) {
          self.shouldShowSnackbar &&
            snackbarUtil.onMessage(STREAM_STATUS.NOVIDEO);
          if (self.selectedStream) {
            self.selectedStream.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.NOVIDEO,
            });

            if (self.cloudType == CLOUD_TYPE.HLS) {
              self.selectedStream.stopWaitingForStream();
            }
          }
          if (resetTimeline) self.timeline = [];
          // self.displayDateTime = self.searchDate.toFormat(
          //   NVRPlayerConfig.FrameFormat
          // );
        }
        if (self.cloudType == CLOUD_TYPE.HLS) {
          self.selectedStream.setNoVideo(value);
        }
      },
      setPlayTimeForSearch(value) {
        if (DateTime.isDateTime(value)) {
          self.searchPlayTime = value.toFormat(
            NVRPlayerConfig.RequestTimeFormat
          );
        } else if (value == null || typeof value == 'string')
          self.searchPlayTime = value;
        else if (typeof value == 'number') {
          self.searchPlayTime = DateTime.fromSeconds(value, {
            zone: self.timezone,
          }).toFormat(NVRPlayerConfig.RequestTimeFormat);
        } else {
          console.log(
            'GOND - WARN! setPlayTimeForSearch VALUE IS NOT DATETIME NOR STRING'
          );
          return;
        }
        // self.shouldUpdateSearchTimeOnGetTimeline &&
        //   (self.shouldUpdateSearchTimeOnGetTimeline = false);
      },
      setBeginSearchTime(value) {
        if (self.isAlertPlay) return;
        if (value == null || DateTime.isDateTime(value)) {
          if (!value && __DEV__) console.trace('GOND setBginSearchTime null');
          self.beginSearchTime = value;
        } else if (typeof value == 'string')
          self.beginSearchTime = DateTime.fromFormat(
            value,
            NVRPlayerConfig.RequestTimeFormat,
            {zone: self.timezone}
          );
        else if (typeof value == 'number') {
          self.beginSearchTime = DateTime.fromSeconds(value, {
            zone: self.timezone,
          });
        } else {
          console.log(
            'GOND - WARN! setBeginSearchTime VALUE IS NOT DATETIME NOR STRING'
          );
          return;
        }
        console.log('GOND setBeginSearchTime ', self.beginSearchTime);
      },
      onExitSinglePlayer(currentRoute) {
        // self.isSingleMode = false;
        if (self.cloudType == CLOUD_TYPE.HLS) {
          if (self.selectedStream) {
            self.selectedStream.onExitSinglePlayer();
          }
        } else if (
          self.cloudType == CLOUD_TYPE.DIRECTION ||
          self.cloudType == CLOUD_TYPE.DEFAULT
        ) {
          self.directStreams.forEach(s => {
            if (s.isLoading || s.connectionStatus != STREAM_STATUS.DONE)
              s.setStreamStatus({
                isLoading: false,
                connectionStatus: STREAM_STATUS.DONE,
              });
          });
        }

        self.selectedChannel = null;
        self.searchBegin = null;
        self.searchEnd = null;
        self.frameTime = 0;
        self.searchDate = null;
        self.searchPlayTime = null;
        self.frameTimeString = '';
        self.isLoading = false;
        self.isFullscreen = false;
        self.hdMode = false;
        self.paused = false;
        self.showAuthenModal = false;
        self.recordingDates = {};
        self.timeline = [];
        self.timezoneOffset = 0;
        self.noVideo = false;
        if (self.checkTimelineTimeout) {
          clearTimeout(self.checkTimelineTimeout);
          self.checkTimelineTimeout = null;
        }
        if (self.checkTimezoneTimeout) {
          clearTimeout(self.checkTimezoneTimeout);
          self.checkTimezoneTimeout = null;
        }
        if (self.checkDaylistTimeout) {
          clearTimeout(self.checkDaylistTimeout);
          self.checkDaylistTimeout = null;
        }

        //
        // self.selectedHLSStream = null;
        self.isAlertPlay = false;
        self.updateCurrentDirectChannel();

        __DEV__ && console.log('GOND onExitSinglePlayer: ', currentRoute);
        if (!self.isHealthPlay) {
          //currentRoute != ROUTERS.HEALTH_VIDEO
          self.isLive = true;
          __DEV__ && console.log('2 self.isLive = ', self.isLive);
        }
        self.isHealthPlay = false;
        self.timelineRequestId = '';
        self.shouldUpdateSearchTimeOnGetTimeline = false;
        // self.refreshingTimeline = false;
        self.clearRefreshTimelineInterval();
        self.beginSearchTime = null;
      },
      onDisconnectNVR() {
        self.dvrTimezone = null;
        self.timezoneOffset = null;
        self.timezoneName = null;

        self.channelFilter = '';
        // self.gridLayout = 2;
        self.isLoading = false;
        self.allChannels = [];
        self.rtcConnection = null;
        self.hlsStreams = [];
        self.directConnection = null;
        self.directStreams = [];
        self.isAuthenticated = false;
        self.showAuthenModal = false;

        self.isPreloadStream = false;
        self.currentGridPage = 0;
      },
      updateDirectFrame(channel, frameData) {
        const target = self.directStreams.find(s => s.videoSource == channel);

        if (target) {
          // __DEV__ &&
          //   console.log('GOND update directFrame channel: ', target.channelNo);
          target.updateFrame(frameData);
        } else {
          __DEV__ &&
            console.log(
              'GOND update directFrame channel not found: ',
              channel,
              '\n list = ',
              self.directStreams.map(s => s.videoSource)
            );
        }
      },
      // #endregion setters
      // #region Build data
      buildDirectData() {
        __DEV__ && console.log('GOND build direct data: ', self.directStreams);
        return self.directStreams.filter(s =>
          s.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
        );
      },
      buildHLSData() {
        __DEV__ && console.log('GOND build hls data: ', self.hlsStreams);
        return self.hlsStreams.filter(s =>
          s.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
        );
      },
      buildRTCData() {
        __DEV__ &&
          console.log(
            'GOND build RTC datachannels: ',
            new Date(),
            getSnapshot(self.rtcConnection.viewers)
          );

        return self.rtcConnection.viewers.filter(v =>
          v.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
        );
      },
      buildVideoData() {
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            return self.buildDirectData();
          case CLOUD_TYPE.HLS:
            return self.buildHLSData();
          case CLOUD_TYPE.RTC:
            return self.buildRTCData();
        }
        return [];
      },
      // #endregion Build data
      // #region settings
      getCloudSetting: flow(function* (hasVSCPermission = true) {
        let res = undefined;
        if (!hasVSCPermission) {
          self.cloudType = CLOUD_TYPE.DIRECTION;
          return Promise.resolve(true);
        }
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
      saveActiveChannels: flow(function* saveActiveChannels(channels) {
        if (self.kDVR == null) return false;
        if (channels.length > self.maxReadyChannels) {
          snackbarUtil.onError(
            'Save error: only support ' + self.maxReadyChannels + ' channels'
          );
          return false;
        }
        self.isLoading = true;
        let result = false;
        try {
          result = yield apiService.post(
            VSC.controller,
            self.kDVR,
            VSC.updateActiveChannels,
            {
              Channels: channels,
              ServerID: self.kDVR,
            }
          );
          snackbarUtil.handleSaveResult(result);
          if (result && !result.error) {
            yield self.getActiveChannels();
          }
        } catch (err) {
          __DEV__ && console.log('GOND save active channels error: ', err);
          snackbarUtil.handleRequestFailed(err);
          self.isLoading = false;
          return false;
        }
        self.isLoading = false;
        return result.error ? false : true;
      }),
      // #endregion settings
      // #region get channels
      refreshChannelsList(newList) {
        if (self.allChannels.length == newList.length) {
          const fnSort = (a, b) => a.channelNo - b.channelNo;
          const arrayAllChannels = [...self.allChannels].sort(fnSort);
          const arrCompareChannels = [...newList].sort(fnSort);
          let isDiff = false;
          for (let i = 0; i < arrayAllChannels.length; i++) {
            // __DEV__ &&
            //   console.log(
            //     'GOND - Compare channels: ',
            //     JSON.stringify(getSnapshot(arrayAllChannels[i])),
            //     ' >< ',
            //     JSON.stringify(getSnapshot(arrCompareChannels[i]))
            //   );
            if (
              JSON.stringify(getSnapshot(arrayAllChannels[i])) !=
              JSON.stringify(getSnapshot(arrCompareChannels[i]))
            ) {
              isDiff = true;
              break;
            }
          }

          if (!isDiff) {
            __DEV__ &&
              console.log(
                'GOND - getDVRChannels: channels list not change keep it still!'
              );
            return;
          }
        }
        // __DEV__ &&
        //   console.log('GOND - getDVRChannels: channels list changed', newList);
        self.allChannels = newList; //.map(ch => ch);
      },
      getDvrChannels: flow(function* (isGetAll = false) {
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
          __DEV__ &&
            console.log(`GOND get channels info (GetAll = ${isGetAll}): `, res);
          if (res && res.error) {
            __DEV__ &&
              console.log('GOND cannot get channels info: ', res.error);
            snackbarUtil.handleRequestFailed(res.error);
            // self.error = res.error;
            self.isLoading = false;
            return false;
          }
          const newChannelsList = res.map(ch => parseChannel(ch));
          self.refreshChannelsList(newChannelsList);
        } catch (err) {
          console.log('GOND cannot get channels info: ', err);
          snackbarUtil.handleRequestFailed(err);
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
          if ((resActive && resActive.error) || (resAll && resAll.error)) {
            console.log(
              'GOND cannot get active channels info: ',
              resActive,
              ' && ',
              resAll
            );
            snackbarUtil.handleRequestFailed(resActive.error || resAll.error);
            // self.error = resActive.error || resAll.error;
            self.isLoading = false;
            return false;
          }
          self.maxReadyChannels = resActive.MaxReadyChannels ?? 0;

          const newChannelsList = resAll.map(ch =>
            parseChannel(ch, resActive.Channels)
          );
          self.refreshChannelsList(newChannelsList);
        } catch (err) {
          console.log('GOND cannot get active channels info: ', err);
          snackbarUtil.handleRequestFailed(err);
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
      getDirectInfos: flow(function* (channelNo) {
        self.isLoading = true;
        self.directStreams = [];
        // if (!self.allChannels || self.allChannels.length <= 0) {
        //   yield self.getDvrChannels();
        // }
        if (self.allChannels.length <= 0) {
          self.directConnection = null;
          self.isLoading = false;
          return true;
        }
        try {
          // Only get one connection info, then
          const res = yield apiService.get(
            DVR.controller,
            self.kDVR,
            DVR.getConnection,
            {
              kdvr: self.kDVR,
              channelno: channelNo ?? self.allChannels[0].channelNo,
            }
          );
          __DEV__ && console.log('GOND direct connect infos: ', res);
          self.directConnection = parseDirectServer(res);
          // __DEV__ && console.log('GOND direct setChannel 3');

          if (util.isNullOrUndef(channelNo)) {
            self.currentGridPage = 0;
            self.directConnection.setChannels(
              self.allChannels
                .filter(ch =>
                  ch.name
                    .toLowerCase()
                    .includes(self.channelFilter.toLowerCase())
                )
                .map(ch => ch.channelNo)
                .filter((_, index) => index < self.gridItemsPerPage)
            );
          }

          // get NVR user and password from first data:
          if (
            self.directConnection.userName &&
            self.directConnection.password
          ) {
            self.nvrUser = self.directConnection.userName;
            self.nvrPassword = self.directConnection.password;
          } else if (self.nvrUser && self.nvrPassword) {
            self.directConnection.userName = self.nvrUser;
            self.directConnection.password = self.nvrPassword;
          }
          if (channelNo) {
            // __DEV__ &&
            //   console.log(
            //     'GOND build direct data select channel: ',
            //     channelNo,
            //     getSnapshot(self.allChannels),
            //     ' selectedData = ',
            //     self.selectedChannelData
            //   );
            let targetChannel = self.allChannels.find(
              ch => ch.channelNo == channelNo
            );
            if (!targetChannel) {
              // Get channels list again to check is channel existed
              yield self.getDisplayingChannels();
              targetChannel = self.allChannels.find(
                ch => ch.channelNo == channelNo
              );
              if (!targetChannel) {
                __DEV__ &&
                  console.log(
                    'GOND HLS - requested channel not found: ',
                    channelNo
                  );
                self.shouldShowSnackbar &&
                  self.isInVideoView &&
                  snackbarUtil.onError(VIDEO_TXT.CHANNEL_ERROR);
                return false;
              }
            }
            // self.directStreams = [
            //   DirectStreamModel.create({
            //     server: self.directConnection.id,
            //     channel: targetChannel,
            //     // playing: false,
            //   }),
            // ];
          }
          // else {
          self.directStreams = self.allChannels.map(ch =>
            DirectStreamModel.create({
              server: self.directConnection.id,
              channel: ch,
              // playing: false,
            })
          );
          // }
        } catch (err) {
          console.log('GOND cannot get direct video info: ', err);
          self.isInVideoView && snackbarUtil.handleRequestFailed(err);
          self.isLoading = false;
          return false;
        }
        self.isLoading = false;

        return true;
      }),
      // #endregion direct connection
      // #region HLS streaming
      sendVSCCommand: flow(function* getStreamInfo(
        mode,
        channelNo,
        params = {}
      ) {
        if (mode < VSCCommand.LIVE || mode > VSCCommand.STOP) {
          __DEV__ && console.log('GOND mode is not valid: ', mode);
          return;
        }
        const {requestDate, begin, end, sid} = params;
        let requestChannel = channelNo ?? self.firstChannelNo;
        // if (requestChannel == 0) requestChannel = 1;
        try {
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.requestVSCURL,
            {
              ID: apiService.configToken.devId,
              KDVR: self.kDVR,
              ChannelNo: requestChannel + 1,
              RequestMode: mode,
              isMobile: true,
              RequestDate: requestDate,
              BeginTime: begin,
              EndTime: end,
              sid,
            }
          );
          __DEV__ && console.log(`GOND get DVR info mode ${mode}:`, res);
        } catch (ex) {
          console.log(`Could not get mode ${mode}: ${ex}`);
          return false;
        }
        return true;
      }),
      stopWaitTimezone() {
        self.waitForTimezone = false;
        if (self.checkTimezoneTimeout) {
          clearTimeout(self.checkTimezoneTimeout);
          self.checkTimezoneTimeout = null;
        }
      },
      getDVRTimezone: flow(function* (channelNo) {
        __DEV__ && console.log('GOND getDVRTimezone');
        self.waitForTimezone = true;
        let sid = util.getRandomId();
        self.timezoneRetries = 0;
        self.checkTimezoneTimeout = setTimeout(
          () => self.getDVRTimezoneDirectly(sid),
          // () => {
          //   snackbarUtil.onError(VIDEO_TXT.CANNOT_CONNECT);
          //   self.stopWaitTimezone();
          // },
          HLS_DATA_REQUEST_TIMEOUT //* 3
        ); // 30 secs wait time
        self.shouldShowSnackbar &&
          self.isInVideoView &&
          snackbarUtil.onMessage(STREAM_STATUS.CONNECTING);
        return yield self.sendVSCCommand(VSCCommand.TIMEZONE, channelNo, {sid});
      }),
      getDVRTimezoneDirectly: flow(function* (sid) {
        if (self.isInVideoView && self.waitForTimezone) {
          try {
            const res = yield apiService.get(
              VSC.controller,
              // sid,
              1,
              VSC.getHLSData,
              {
                id: sid,
                cmd: VSCCommandString.TIMEZONE,
                kdvr: self.kDVR,
              }
            );
            __DEV__ && console.log(`GOND get Timezone dirrectly:`, sid, res);
            if (res && res.Data && res.Data.includes('Bias')) {
              self.stopWaitTimezone();
              try {
                let tzData = JSON.parse(res.Data);
                self.buildTimezoneData(tzData);
              } catch (ex) {
                console.log('GOND Parse timezone failed: ', ex, res.Data);
              }
            } else if (self.timezoneRetries < HLS_MAX_RETRY) {
              self.timezoneRetries++;
              self.checkTimezoneTimeout = setTimeout(
                () => self.getDVRTimezoneDirectly(sid),
                HLS_DATA_REQUEST_TIMEOUT / 2
              );
            } else {
              self.shouldShowSnackbar &&
                snackbarUtil.onError(VIDEO_TXT.CANNOT_CONNECT);
              self.stopWaitTimezone();
            }
          } catch (err) {
            console.log('GOND get HLS data Timezone failed: ', err);
          }
        }
      }),
      getDaylist: flow(function* (channelNo, sid) {
        // __DEV__ &&
        //   console.log('GOND getTimeline searchDate after: ', self.searchDate);
        self.checkDaylistTimeout = setTimeout(
          () => self.getDaylistDirectly(channelNo, sid),
          HLS_DATA_REQUEST_TIMEOUT
        ); // 1 min wait time

        return yield self.sendVSCCommand(VSCCommand.DAYLIST, channelNo, {
          sid,
        });
      }),
      getDaylistDirectly: flow(function* (channelNo, sid) {
        if (
          self.isInVideoView &&
          self.selectedChannel == channelNo &&
          self.selectedStream.targetUrl.sid == sid
        ) {
          const isSuccess = yield self.buildDaylistData({BigData: 1});
          __DEV__ && console.log('GOND Get Daylist diredctly: ', isSuccess);
        }
      }),
      getSafeSearchDate() {
        if (self.searchDate) {
          if (self.searchDate.zone.name != self.timezone)
            self.searchDate = self.searchDate
              .setZone(self.timezone, {keepLocalTime: true})
              .startOf('day');
        } else {
          self.searchDate = DateTime.now()
            .setZone(self.timezone)
            .startOf('day');
        }

        return self.searchDate;
      },
      getTimeline: flow(function* (channelNo, sid) {
        // __DEV__ &&
        //   console.log(
        //     'GOND getTimeline searchDate before: ',
        //     self.searchDate,
        //     self.searchDate.setZone(self.timezone)
        //   );

        if (__DEV__) {
          console.log(
            'GOND --------- getTimeline searchDate after: ',
            self.getSafeSearchDate()
          );
          // console.trace();
        }
        self.waitForTimeline = true;
        if (self.checkTimelineTimeout) {
          // __DEV__ && console.trace('GOND clear TimelineTimeout 1 ');
          clearTimeout(self.checkTimelineTimeout);
          self.checkTimelineTimeout = null;
        }
        self.checkTimelineTimeout = setTimeout(
          () => self.getTimelineDirectly(channelNo, sid),
          HLS_DATA_REQUEST_TIMEOUT
        ); // 1 min wait time
        self.timelineRequestId = sid;
        return yield self.sendVSCCommand(VSCCommand.TIMELINE, channelNo, {
          requestDate: self
            .getSafeSearchDate()
            .toFormat(NVRPlayerConfig.HLSRequestDateFormat),
          begin: BEGIN_OF_DAY_STRING,
          end: END_OF_DAY_STRING,
          sid,
        });
      }),
      getTimelineDirectly: flow(function* (channelNo, sid) {
        if (
          self.isInVideoView &&
          self.selectedChannel == channelNo &&
          self.timelineRequestId == sid
        ) {
          // self.getTimeline(channelNo, sid);
          const isSuccess = yield self.buildTimelineData({BigData: 1}); // get timeline directly
          __DEV__ && console.log('GOND Get Timeline directly: ', isSuccess);
          if (isSuccess) {
            self.timelineRetries = 0;
            self.waitForTimeline = false;
            self.timelineRequestId = '';
            self.checkTimelineTimeout = null;
          } else if (self.timelineRetries < HLS_MAX_RETRY) {
            // self.timelineRetries++;
            if (self.checkTimelineTimeout) {
              // __DEV__ && console.trace('GOND clear TimelineTimeout 2 ');
              clearTimeout(self.checkTimelineTimeout);
              self.checkTimelineTimeout = null;
            }
            self.checkTimelineTimeout = setTimeout(
              () => self.getTimelineDirectly(channelNo, sid),
              HLS_GET_DATA_DIRECTLY_TIMEOUT
            );
          } else {
            self.timelineRetries = 0;
            self.waitForTimeline = false;
            self.checkTimelineTimeout = null;
            __DEV__ &&
              console.log('GOND Get Timeline failed , max retries reached!');
            // snackbarUtil.onError(VIDEO_TXT.CANNOT_CONNECT);
          }
        } else {
          __DEV__ &&
            console.log(
              'GOND Get Timeline id has changed, cancel: ',
              self.timelineRequestId,
              sid
            );
        }
      }),
      stopHLSStream: flow(function* (channelNo, sid, forceStop = false) {
        __DEV__ && console.log(` stopHLSStream `);
        // do not stop multi division live channels
        const targetStream = self.hlsStreams.find(
          s => s.channelNo == channelNo
        );
        targetStream.updateBitrate(FORCE_SENT_DATA_USAGE, 'stopHLSStream');
        if (
          !forceStop &&
          !self.isAlertPlay &&
          self.activeChannelNos.includes(channelNo) &&
          targetStream &&
          targetStream.liveUrl &&
          targetStream.liveUrl.sid == sid
        )
          return Promise.resolve();
        return yield self.sendVSCCommand(VSCCommand.STOP, channelNo, {sid});
      }),
      getHLSInfos: flow(function* (params) {
        const {channelNo, timezone, daylist, timeline, searchTime} =
          params ?? {};
        self.isLoading = true;
        self.setNoVideo(false);
        __DEV__ && console.trace('GOND getHLSInfos channel: ', channelNo);
        if (!self.activeChannels || self.activeChannels.length <= 0) {
          yield self.getActiveChannels();
        }

        if (timezone) yield self.getDVRTimezone();
        self.clearRefreshTimelineInterval();

        // listIdToCheck = [];
        let requestParams = [];

        if (!util.isNullOrUndef(channelNo)) {
          __DEV__ &&
            console.log('GOND getHLSInfos single channel: ', channelNo);
          let targetStream = self.hlsStreams.find(
            s => s.channelNo == channelNo
          );
          if (targetStream) {
            targetStream.setStreamStatus({
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
            });

            if (
              targetStream.targetUrl &&
              util.isValidHttpUrl(targetStream.targetUrl.url)
            ) {
              targetStream.updateStream(targetStream.targetUrl.sid, true);
              targetStream.targetUrl.reset();
            }
          } else {
            __DEV__ && console.log('GOND getHLSInfos single create new stream');
            let targetChannel = self.allChannels.find(
              ch => ch.channelNo == channelNo
            );
            if (!targetChannel) {
              // Get channels list again to check is channel existed
              __DEV__ &&
                console.log(
                  'GOND getHLSInfos single get all channels to find selected channel '
                );
              yield self.getDisplayingChannels();
              targetChannel = self.allChannels.find(
                ch => ch.channelNo == channelNo
              );
              if (!targetChannel) {
                __DEV__ &&
                  console.log(
                    'GOND HLS - requested channel not found: ',
                    channelNo
                  );
                return false;
              }
            }
            targetStream = HLSStreamModel.create({
              // id: util.getRandomId(),
              channel: targetChannel,
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
              isHD: self.hdMode,
              isLive: self.isLive,
            });
            targetStream.setOnErrorCallback(self.onHLSError);
            // if (self.isLive)
            // targetStream.targetUrl.set({sid: util.getRandomId()});

            __DEV__ &&
              console.log('GOND getHLSInfos single channel: ', channelNo);

            self.hlsStreams.push(targetStream);
          }
          targetStream.startWaitingForStream(targetStream.targetUrl.sid);
          let timeParams = {};
          if (!self.isLive) {
            __DEV__ &&
              console.log(
                'GOND getHLSInfos channel, get daylist and timeline...'
              );
            daylist &&
              (yield self.getDaylist(channelNo, targetStream.targetUrl.sid));
            timeline &&
              (yield self.getTimeline(channelNo, targetStream.targetUrl.sid));

            timeParams = {
              RequestDate: self
                .getSafeSearchDate()
                .toFormat(NVRPlayerConfig.HLSRequestDateFormat),
              BeginTime:
                searchTime ??
                (self.beginSearchTime
                  ? self.beginSearchTime.toFormat(
                      NVRPlayerConfig.HLSRequestTimeFormat
                    )
                  : self.searchPlayTime
                  ? self.searchPlayTimeLuxon.toFormat(
                      NVRPlayerConfig.HLSRequestTimeFormat
                    )
                  : BEGIN_OF_DAY_STRING),
              EndTime: END_OF_DAY_STRING,
            };
            __DEV__ &&
              console.log(
                `GOND getHLSInfos date = ${self
                  .getSafeSearchDate()
                  .toFormat(NVRPlayerConfig.HLSRequestDateFormat)}`,
                self.searchDate
              );
          }
          // listIdToCheck.push(targetStream.targetUrl.sid);
          // targetStream.scheduleCheckTimeout();

          requestParams = [
            {
              ID: apiService.configToken.devId,
              sid: targetStream.targetUrl.sid, //self.isLive || (timeline &&) ? targetStream.targetUrl.sid : undefined,
              KDVR: self.kDVR,
              ChannelNo: targetStream.channel.channelNo + 1,
              RequestMode: self.isLive
                ? self.hdMode
                  ? VSCCommand.LIVEHD
                  : VSCCommand.LIVE
                : self.hdMode
                ? VSCCommand.SEARCHHD
                : VSCCommand.SEARCH,
              isMobile: true,
              ...timeParams,
            },
          ];
        } else {
          // dongpt: ONLY LIVE MODE =======
          if (self.activeChannels.length <= 0) {
            __DEV__ && console.log(`GOND get multi HLS URL: No active channel`);
            return false;
          }
          if (self.hlsStreams.length > 0) self.releaseHLSStreams();
          self.hlsStreams = self.activeChannels.map(ch => {
            const newConnection = HLSStreamModel.create({
              // id: util.getRandomId(),
              channel: ch,
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
              isHD: self.hdMode,
              isLive: self.isLive,
            });
            newConnection.setOnErrorCallback(self.onHLSError);
            // newConnection.scheduleCheckTimeout();
            // if (self.isLive)
            // newConnection.targetUrl.set({sid: util.getRandomId()});
            newConnection.startWaitingForStream(newConnection.targetUrl.sid);

            return newConnection;
          });
          // streamReadyCallback && streamReadyCallback();
          self.isLoading = false;
          // listIdToCheck = self.hlsStreams.map(s => s.id);
          // return true;

          requestParams = self.hlsStreams.map(s => ({
            ID: apiService.configToken.devId,
            sid: s.targetUrl.sid,
            KDVR: self.kDVR,
            ChannelNo: s.channel.channelNo + 1,
            RequestMode: VSCCommand.LIVE, // should include SEARCH? HD?
            isMobile: true,
          }));
        }

        try {
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.getMultiURL,
            requestParams
          );
          __DEV__ && console.log(`GOND get multi HLS URL: `, res);
          __DEV__ &&
            console.log('GOND == PROFILING == Sent VSC Request: ', new Date());
        } catch (error) {
          console.log(`Could not get HLS video info: ${error}`);
          self.shouldShowSnackbar &&
            self.isInVideoView &&
            snackbarUtil.handleRequestFailed(error);
          return false;
        }
        // self.scheduleTimeoutChecking();
        return true;
      }),
      // scheduleTimeoutChecking() {
      //   __DEV__ &&
      //     console.log(
      //       `GOND scheduleTimeoutChecking: listIdToCheck = ${listIdToCheck}`
      //     );
      //   if (streamTimeout) clearTimeout(streamTimeout);
      //   streamTimeout = setTimeout(() => {
      //     __DEV__ && console.log(`GOND onstream timeout`);
      //     if (self.hlsStreams && self.hlsStreams.length > 0) {
      //       __DEV__ && console.log(`GOND onstream timeout checking`);
      //       self.hlsStreams.forEach(s => {
      //         __DEV__ &&
      //           console.log(
      //             `GOND onstream timeout s = ${s.targetUrl.sid}, ch = ${s.channelName}, loading = ${s.isLoading}, url: ${s.targetUrl.url}`
      //           );
      //         if (
      //           listIdToCheck.includes(s.id) &&
      //           s.isLoading &&
      //           // !s.targetUrl.isAcquired(self.isLive, self.isHD)
      //           !s.isURLAcquired
      //         ) {
      //           __DEV__ &&
      //             console.log(
      //               `GOND === it timeout s = ${s.targetUrl.sid}, ch = `,
      //               s.channelName
      //             );
      //           s.setStreamStatus({
      //             connectionStatus: STREAM_STATUS.TIMEOUT,
      //             isLoading: false,
      //           });
      //         }
      //       });
      //     }
      //   }, STREAM_TIMEOUT);
      // },
      resumeVideoStreamFromBackground(isSingleMode) {
        if (isSingleMode) {
          if (!self.isLive) {
            self.searchPlayTime = DateTime.fromFormat(
              self.displayDateTime,
              NVRPlayerConfig.FrameFormat
            ).toFormat(NVRPlayerConfig.RequestTimeFormat);
          }

          self.getVideoInfos(self.selectedChannel);
          self.selectedStream.setStreamStatus({
            isLoading: true,
            connectionStatus: STREAM_STATUS.CONNECTING,
          });
        } else {
          self.getVideoInfos();
        }
      },
      onHLSError(channelNo, isLive, resumeTime) {
        // self.resumeVideoStreamFromBackground(
        //   self.selectedChannel ? true : false
        // );
        // self.getHLSInfos({channelNo /*, daylist: !isLive, timeline: !isLive*/});
        const searchTime =
          !isLive && resumeTime && DateTime.isDateTime(resumeTime)
            ? resumeTime.toFormat(NVRPlayerConfig.HLSRequestTimeFormat)
            : undefined;

        self.getHLSInfos({
          channelNo,
          searchTime,
        });
      },
      /**
       *
       * @param time (DateTime)
       */
      onHLSTimeChanged: flow(function* (time) {
        if (self.cloudType != CLOUD_TYPE.HLS || self.isLive) {
          console.log(
            'GOND onHLSTimeChanged * Failed: not a valid mode or cloud type'
          );
          return;
        }
        if (!DateTime.isDateTime(time)) {
          console.log(
            'GOND onHLSTimeChanged * Failed: time is not a valid luxon DateTime'
          );
          return;
        }
        self.clearRefreshTimelineInterval();
        /*self.selectedStream.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTING,
          isLoading: true,
        });
        self.selectedStream.updateStream(
          self.selectedStream.targetUrl.sid,
          true
        );
        self.selectedStream.targetUrl.reset();
        self.selectedStream.startWaitingForStream(
          self.selectedStream.targetUrl.sid
        );*/
        if (!self.selectedStream.streamUrl) {
          self.getHLSInfos({
            channelNo: self.selectedChannel,
            searchTime: time.toFormat(NVRPlayerConfig.HLSRequestTimeFormat),
          });
          return;
        }

        let requestParams = {
          ID: apiService.configToken.devId,
          sid: self.selectedStream.targetUrl.sid,
          KDVR: self.kDVR,
          ChannelNo: self.selectedChannel + 1,
          RequestMode: self.hdMode ? VSCCommand.SEARCHHD : VSCCommand.SEARCH,
          isMobile: true,
          RequestDate: self
            .getSafeSearchDate()
            .toFormat(NVRPlayerConfig.HLSRequestDateTimeFormat),
          BeginTime: time.toFormat(NVRPlayerConfig.HLSRequestTimeFormat),
          EndTime: END_OF_DAY_STRING,
        };

        try {
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.requestVSCURL,
            requestParams
          );
          __DEV__ && console.log(`GOND onHLSTimeChanged: `, res);
          yield util.sleep(2000);
          return true;
        } catch (error) {
          console.log(`Could not get HLS video info: ${error}`);
          self.shouldShowSnackbar &&
            self.isInVideoView &&
            snackbarUtil.handleRequestFailed(error);
          return false;
        }
      }),
      // onHLSSingleStreamChanged: flow(function* (stopCurrent) {
      //   if (self.cloudType != CLOUD_TYPE.HLS) return;
      //   if (stopCurrent) {
      //     yield self.stopHLSStream(self.selectedChannel);
      //     self.selectedStream.setUrls({search: null, searchHD: null});
      //   }
      //   if (self.selectedStream.isURLAcquired) {
      //     __DEV__ &&
      //       console.log(
      //         'GOND URL already acquired, use it: ',
      //         getSnapshot(self.selectedStream.targetUrl),
      //         getSnapshot(self.selectedStream)
      //       );
      //     return;
      //   }
      //   // if (self.isLive) {
      //   //   self.selectedStream.targetUrl.set({sid: util.getRandomId()});
      //   // }
      //   self.selectedStream.setStreamStatus({
      //     connectionStatus: STREAM_STATUS.CONNECTING,
      //     isLoading: true,
      //   });
      //   self.getHLSInfos({channelNo: self.selectedChannel});
      // }),
      onHLSInfoResponse(info, cmd) {
        __DEV__ && console.log(`GOND on HLS response ${cmd}: `, info);
        if (info.status == 'FAIL') {
          if (cmd == VSCCommandString.TIMEZONE) {
            if (self.hlsStreams.length == 0) {
              self.shouldShowSnackbar &&
                snackbarUtil.onError(VIDEO_TXT.CANNOT_CONNECT);
              self.stopWaitTimezone();
            }
          } else {
            if (
              !self.hlsStreams ||
              self.hlsStreams.length == 0 ||
              self.noVideo
            ) {
              __DEV__ &&
                console.log(
                  `GOND onHLSInfoResponse handle error stream list empty`
                );
              return;
            }
            // if (self.selectedStream) {
            const target = self.hlsStreams.find(
              s => s.targetUrl.sid == info.sid
            );
            if (target) {
              if (
                !self.beginSearchTime ||
                self.checkTimeOnTimeline(self.beginSearchTime.toSeconds())
              ) {
                target.handleError(info);
              } else {
                target.setStreamStatus({
                  isLoading: false,
                  connectionStatus: STREAM_STATUS.NOVIDEO,
                  // error: info.description,
                });
              }
            } else {
              __DEV__ &&
                console.log(
                  `GOND onHLSInfoResponse handle error stream not found`
                );
            }

            return;
            // }
          }
        }

        switch (cmd) {
          case VSCCommandString.LIVE:
          case VSCCommandString.SEARCH:
          case VSCCommandString.LIVEHD:
          case VSCCommandString.SEARCHHD:
            self.onReceiveHLSStream(info, cmd);
            break;
          case VSCCommandString.TIMELINE:
            if (self.checkTimelineTimeout) {
              // __DEV__ && console.trace('GOND clear TimelineTimeout 3 ');
              clearTimeout(self.checkTimelineTimeout);
              self.checkTimelineTimeout = null;
            }
            self.buildTimelineData(info);
            // self.timelineRequestId = '';
            break;
          case VSCCommandString.DAYLIST:
            if (self.checkDaylistTimeout) {
              clearTimeout(self.checkDaylistTimeout);
              self.checkDaylistTimeout = null;
            }
            self.buildDaylistData(info);
            break;
          case VSCCommandString.TIMEZONE:
            // __DEV__ && console.log(`GOND on HLS response TZ 1`);
            if (typeof info == 'object' && info.Bias && info.StandardName) {
              // __DEV__ && console.log(`GOND on HLS response TZ 2`);
              self.buildTimezoneData(info);
            }
            break;
          case VSCCommandString.STOP:
            break;
          default:
            break;
        }
      },
      onReceiveHLSStream: flow(function* (info, cmd) {
        if (self.cloudType == CLOUD_TYPE.HLS && info.hls_stream) {
          let target = null;
          target = self.hlsStreams.find(s => {
            __DEV__ &&
              console.log(
                `GOND on HLS matching url, sid = ${info.sid}, s = `,
                s,
                `s.getUrl(cmd) = `,
                s.getUrl(cmd)
              );
            return s.getUrl(cmd).sid == info.sid;
          });
          if (!target || (!target.isLive && self.noVideo === true)) {
            __DEV__ &&
              console.log(
                `GOND on HLS response target stream not found or noVideo!`,
                self.noVideo,
                target
              );
            return;
            // }
          }
          const result = yield target.startConnection(info, cmd);
        }
      }),
      buildDaylistData: flow(function* (data) {
        let daysData = data;
        if (!daysData || daysData.length == 0 || daysData.BigData) {
          if (self.cloudType == CLOUD_TYPE.HLS) {
            try {
              const res = yield apiService.get(
                VSC.controller,
                1,
                VSC.getHLSData,
                {
                  id: self.selectedStream.targetUrl.sid,
                  cmd: VSCCommandString.DAYLIST,
                }
              );
              __DEV__ &&
                console.log('GOND get HLS data Daylist directly: ', res);
              if (!res) {
                const lastId = self.selectedStream.targetUrl.sid;
                setTimeout(() => {
                  if (
                    !self.isLive &&
                    self.isInVideoView &&
                    self.selectedStream.targetUrl.sid == lastId
                  ) {
                    self.buildDaylistData(data);
                  }
                }, 1000);
                return;
              }
              daysData =
                typeof res.Data === 'string' ? JSON.parse(res.Data) : res.Data;
            } catch (err) {
              console.log('GOND get HLS data Daylist failed: ', err);
            }
          }
        }
        if (
          daysData &&
          daysData[0] &&
          Array.isArray(daysData[0].ti) &&
          daysData[0].ti.length > 0
        ) {
          let recordingDates = daysData[0].ti.map(params => {
            // let daylightday = convertToLocalTime(params.begin_time, this.dvrTimezone) * 1000;
            // console.log('-- GOND daylightday', daylightday);
            // return dayjs(daylightday).format("YYYY-MM-DD");
            return DateTime.fromSeconds(params.begin_time)
              .setZone(self.timezone)
              .toFormat('yyyy-MM-dd');
          });

          __DEV__ && console.log('-- GOND recordingDates', recordingDates);
          self.setRecordingDates(recordingDates);
        }
      }),
      timeDataConverter(value) {
        // __DEV__ && console.log('GOND convert time: ', value);
        if (typeof value !== 'object' || Object.keys(value) == 0) {
          __DEV__ && console.log('GOND convert time value not valid: ', value);
          return null;
        }
        const timezoneName = self.timezone; // ?? DateTime.local().zone.name;
        return {
          id: 0,
          type: value.type,
          timezone:
            DateTime.fromSeconds(value.begin_time).setZone(timezoneName)
              .offset *
            60 *
            1000,
          begin: value.begin_time, // * 1000,
          end: value.end_time, // * 1000,
        };
      },
      generateHLSTimeline(timestamp) {
        __DEV__ &&
          console.log(
            `-- GOND generateHLSTimeline (${timestamp.length}): `,
            timestamp
          );
        let result = [];
        for (let i = 0; i < timestamp.length; i++) {
          result = result.concat(
            Array(timestamp[i].end - timestamp[i].begin + 1)
              .fill()
              .map((item, index) => timestamp[i].begin + index)
          );
        }
        return result;
      },
      onUpdateSearchTimePostTimeline() {
        let result = null;
        if (!self.beginSearchTime) {
          __DEV__ &&
            console.log(
              'GOND onUpdateSearchTimePostTimeline beginSearchTime not set!'
            );
          return;
        }

        self.shouldUpdateSearchTimeOnGetTimeline = false;
        __DEV__ &&
          console.log(
            'GOND onUpdateSearchTimePostTimeline: ',
            self.timeline.length
          );
        for (let i = self.timeline.length - 1; i >= 0; i--) {
          if (self.timeline[i].begin >= self.beginSearchTime.toSeconds()) {
            __DEV__ &&
              console.log(
                'GOND onUpdateSearchTimePostTimeline: ',
                self.beginSearchTime.toSeconds(),
                self.timeline[i].begin
              );
            result = self.timeline[i];
          } else {
            result = self.timeline[i];
            break;
          }
        }
        if (result != null) {
          __DEV__ &&
            console.log('GOND onUpdateSearchTimePostTimeline result: ', result);
          if (
            result.begin <= self.beginSearchTime.toSeconds() &&
            result.end >= self.beginSearchTime.toSeconds()
          ) {
            __DEV__ &&
              console.log(
                'GOND onUpdateSearchTimePostTimeline: search time have data no need to update'
              );
            return;
          } else {
            self.setBeginSearchTime(
              result.end - DEFAULT_SEARCH_OFFSET_IN_SECONDS
            );
          }
        } else {
          __DEV__ &&
            console.log(
              'GOND onUpdateSearchTimePostTimeline: something is wrong, it should be NOVIDEO',
              self.timeline
            );
        }
      },
      buildTimelineData: flow(function* (data) {
        self.waitForTimeline = false;
        if (!self.selectedStream || self.isLive) {
          __DEV__ &&
            console.log(
              'GOND HLS buildTimelineData no stream or currently in live mode',
              self.selectedStream
            );
          return false;
        }
        let jTimeStamp = data;
        if (jTimeStamp && jTimeStamp.BigData) {
          if (self.cloudType == CLOUD_TYPE.HLS) {
            try {
              const res = yield apiService.get(
                VSC.controller,
                1,
                VSC.getHLSData,
                {
                  id: self.selectedStream.targetUrl.sid,
                  cmd: VSCCommandString.TIMELINE,
                }
              );
              __DEV__ && console.log('GOND get HLS data Timeline: ', res);
              if (res && res.Data) {
                jTimeStamp =
                  typeof res.Data == 'string' ? JSON.parse(res.Data) : res.Data;
              } else {
                __DEV__ &&
                  console.log('GOND get HLS data Timeline no data', res.Data);
                return false;
              }
            } catch (err) {
              console.log('GOND get HLS data Timeline failed: ', err);
              return false;
            }
          }
        } else {
          __DEV__ && console.log('GOND HLS Timeline from notif: ', data);
        }

        if (!jTimeStamp || jTimeStamp.length == 0 || !jTimeStamp[0]) {
          __DEV__ &&
            console.log('GOND get HLS data Timeline no data: ', jTimeStamp);
          self.setNoVideo(true);
          self.selectedStream.stopWaitingForStream(
            self.selectedStream.targetUrl.sid
          );
          self.selectedStream.setStreamStatus({
            isLoading: false,
            connectionStatus: STREAM_STATUS.NOVIDEO,
          });
          self.shouldUpdateSearchTimeOnGetTimeline &&
            (self.shouldUpdateSearchTimeOnGetTimeline = false);
          return true;
        }

        if (jTimeStamp[0].channel_mask) {
          const targetChannelNo = Math.log2(jTimeStamp[0].channel_mask);
          __DEV__ &&
            console.log(
              'GOND HLS timeline channelNo: ',
              targetChannelNo,
              self.selectedChannel
            );
          if (
            Number.isInteger(targetChannelNo) &&
            targetChannelNo != self.selectedChannel
          ) {
            __DEV__ &&
              console.log('GOND HLS buildTimeline not current channel!');
            return true;
          }
        }

        let jtimeData = jTimeStamp[0].di[self.selectedStream.channelNo];
        let timeInterval = [];

        try {
          timeInterval = jtimeData.ti.map(self.timeDataConverter);
          if (!timeInterval || timeInterval.length == 0) {
            __DEV__ &&
              console.log(
                '-- GOND timeInterval is empty, jtimeData =',
                jtimeData
              );

            self.setNoVideo(true);
            self.selectedStream.stopWaitingForStream(
              self.selectedStream.targetUrl.sid
            );
            self.selectedStream.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.NOVIDEO,
            });
            self.shouldUpdateSearchTimeOnGetTimeline &&
              (self.shouldUpdateSearchTimeOnGetTimeline = false);
            return true;
          }
          if (
            !self.timeline ||
            (self.timeline.length <= 0 && self.noVideo == true)
          ) {
            self.setNoVideo(false);
          }

          __DEV__ && console.log('-- GOND searchDate', self.searchDate);

          timeInterval.sort((a, b) => a.begin - b.begin);
          self.setTimeline(timeInterval);
          __DEV__ && console.log('-- GOND generateHLSTimeline');
          if (self.cloudType == CLOUD_TYPE.HLS) {
            self.hlsTimestamps = self.generateHLSTimeline(timeInterval);
            // __DEV__ &&
            //   console.log('-- GOND hlsTimestamps = ', self.hlsTimestamps);
            // self.selectedStream.setTimelines(timeInterval, self.hlsTimestamps);
          }
          // return timeInterval;
        } catch (ex) {
          console.log('GOND buildTimelineData failed: ', ex);
          // snackbarUtil.showMessage(VIDEO_MESSAGE.MSG_STREAM_ERROR, CMSColors.Danger);
          self.selectedStream.setStreamStatus({
            connectionStatus: STREAM_STATUS.SOURCE_ERROR,
          });
          return false;
        }
        return true;
      }),
      // #endregion HLS streaming
      // #region WebRTC streaming
      getRTCInfos: flow(function* (channelNo) {
        self.isLoading = true;
        self.rtcConnection = RTCStreamModel.create({
          sid: util.getRandomId(),
          // kdvr: self.kDVR,
          region: DEFAULT_REGION,
          accessKeyId: '',
          secretAccessKey: '',
          rtcChannelName: '',
          singleChannelNo: channelNo ?? null,
          viewers: [],
        });
        try {
          // __DEV__ &&
          //   console.log(
          //     'GOND getRTCInfo rtcConnection: ',
          //     self.rtcConnection
          //     // , getSnapshot(self.allChannels)
          //   );
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.requestVSCURL,
            {
              sid: self.rtcConnection.sid,
              ID: apiService.configToken.devId,
              KDVR: self.kDVR,
              ChannelNo: channelNo
                ? channelNo + 1
                : self.allChannels && self.allChannels.length > 0
                ? self.allChannels[0].channelNo + 1
                : 1,
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
          // Generate channels views before connections established
          // streamReadyCallback && streamReadyCallback();
          return true;
        } catch (ex) {
          console.log('GOND getRTCInfo failed: ', ex);
        }
      }),
      onRTCInfoResponse: flow(function* (streamInfo) {
        __DEV__ &&
          console.log(
            'GOND compare sid: ',
            streamInfo.sid,
            '\n self sid: ',
            self.rtcConnection.sid
          );
        if (streamInfo.sid === self.rtcConnection.sid) {
          // __DEV__ &&
          //   console.log(
          //     `GOND channels filter ${self.channelFilter}, active: `,
          //     self.activeChannels
          //   );
          /*yield*/ self.rtcConnection.createStreams(
            {
              accessKeyId: streamInfo.access_key,
              secretAccessKey: streamInfo.secret_key,
              rtcChannelName: streamInfo.rtc_channel,
              sid: streamInfo.sid,
            },
            // self.allChannels
            self.rtcConnection.singleChannelNo
              ? self.selectedChannelData
              : self.activeChannels
          );
          self.isLoading = false;
          // streamReadyCallback && streamReadyCallback();
        }
      }),
      // #endregion WebRTC streaming
      // #region Get and receive videoinfos
      getVideoInfos: flow(function* (channelNo) {
        // __DEV__ &&
        //   console.trace(
        //     'GOND getVideoInfos ',
        //     channelNo != undefined ? channelNo : self.allChannels
        //   );
        let getInfoPromise = null;
        if (!self.allChannels || self.allChannels.length <= 0) {
          let res = yield self.getDisplayingChannels();
          if (!res) {
            __DEV__ &&
              console.log('GOND getVideoInfos get channels info failed');
            return Promise.resolve(false);
          }

          if (self.allChannels.length == 0) {
            __DEV__ && console.log('GOND getVideoInfos channels list empty!');
            switch (self.cloudType) {
              case CLOUD_TYPE.DEFAULT:
              case CLOUD_TYPE.DIRECTION:
                self.directStreams = [];
                break;
              case CLOUD_TYPE.HLS:
                self.hlsStreams = [];
                break;
              case CLOUD_TYPE.RTC:
                self.rtcConnection.viewers = [];
                break;
              default:
                break;
            }
            return Promise.resolve(true);
          }

          if (
            !util.isNullOrUndef(channelNo) &&
            self.allChannels.findIndex(ch => ch.channelNo == channelNo) < 0
          ) {
            __DEV__ &&
              console.log(
                `GOND getVideoInfos channel ${channelNo} not existed or has been removed!`
              );
            self.message = `Channel ${channelNo} not existed or has been removed!`;
            return Promise.resolve(false);
          }
        }

        if (
          util.isNullOrUndef(channelNo) &&
          self.activeChannels.length == 0 &&
          (self.cloudType == CLOUD_TYPE.HLS || self.cloudType == CLOUD_TYPE.RTC)
        ) {
          __DEV__ &&
            console.log(
              'GOND getVideoInfos no channel select nor active channels!',
              channelNo,
              self.activeChannels
            );
          switch (self.cloudType) {
            case CLOUD_TYPE.HLS:
              self.hlsStreams = [];
              break;
            case CLOUD_TYPE.RTC:
              self.rtcConnection.viewers = [];
              break;
            default:
              break;
          }
          return Promise.resolve(true);
        }

        __DEV__ && console.log('GOND getVideoInfos 2: ', self.nvrUser);
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
          // getInfoPromise = self.getDirectInfos(channelNo);
          // break;
          // if (self.needAuthen) {
          //   self.displayAuthen(true);
          // }
          case CLOUD_TYPE.HLS:
            // getInfoPromise = self.getHLSInfos({
            //   channelNo,
            //   timezone: true,
            //   daylist: !self.isLive,
            //   timeline: !self.isLive,
            // });
            getInfoPromise = self.getDVRTimezone(channelNo);
            break;
          case CLOUD_TYPE.RTC:
            __DEV__ && console.log('GOND getRTCInfos');
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

        return getInfoPromise;
      }),
      // onLoginSuccess() {
      //   streamReadyCallback && streamReadyCallback();
      // },
      onReceiveStreamInfo: flow(function* (streamInfo, cmd) {
        if (!streamInfo || !self.isInVideoView) return;

        __DEV__ && console.log('GOND onReceiveStreamInfo: ', streamInfo);
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            self.onHLSInfoResponse(streamInfo, cmd);
            console.log(
              'GOND Warning: direct connection not receive stream info through notification'
            );
            break;
          case CLOUD_TYPE.HLS:
            self.onHLSInfoResponse(streamInfo, cmd);
            break;
          case CLOUD_TYPE.RTC:
            self.onRTCInfoResponse(streamInfo);
            break;
        }
      }),
      // #endregion Get and receive videoinfos
      // #region Alert play
      onAlertPlay: flow(function* (isLive, alertData, isPreload = false) {
        __DEV__ && console.log('GOND onAlertPlay: ', alertData);
        self.isAlertPlay = true;
        self.isPreloadStream = isPreload;
        self.kDVR = alertData.kDVR;
        self.isLive = isLive;
        __DEV__ && console.log('3 self.isLive = ', self.isLive);
        if (!isLive) {
          let searchTime = alertData.searchTime ?? alertData.timezone;
          if (searchTime) {
            const dtObj = DateTime.fromISO(searchTime, {
              zone: 'utc',
              setZone: true,
            });
            // __DEV__ && console.log('GOND onAlertPlay searchTime: ', dtObj);
            if (dtObj.isValid)
              self.searchPlayTime = dtObj.toFormat(
                NVRPlayerConfig.RequestTimeFormat
              );
            else self.searchPlayTime = searchTime;
            // __DEV__ && console.log('GOND onAlertPlay 2: ', self.searchPlayTime);

            // }
            self.searchDate = DateTime.fromISO(searchTime, {
              zone: 'utc',
            })
              .setZone(self.timezone, {keepLocalTime: true})
              .startOf('day');
            // __DEV__ && console.log('GOND onAlertPlay 3: ', self.searchDate);
          } else {
            // __DEV__ && console.log('GOND onAlertPlay 4: ', self.timezoneName);
            self.searchDate = self.timezoneName
              ? DateTime.now().setZone(self.timezoneName).startOf('day')
              : DateTime.now().startOf('day');
          }
        }
        yield self.getDisplayingChannels();

        let channelId;
        if (alertData.channelNo) {
          channelId = alertData.channelNo;
        } else if (alertData.channelName) {
          channelId = channelName;
        } else if (alertData.camName) {
          channelId = parseInt(alertData.camName);
        } else {
          channelId = self.displayChannels[0].channelNo;
        }
        self.selectChannel(channelId, false);

        if (self.selectedChannelData == null) {
          __DEV__ &&
            console.log(
              'GOND onAlertPlay channels has been removed or not existed!'
            );
          // self.error = 'Channel is not existed or has been removed!';
          self.isInVideoView && snackbarUtil.onError(VIDEO_TXT.CHANNEL_ERROR);
          return false;
        }
        // Get timezone first
        if (
          self.cloudType != CLOUD_TYPE.HLS ||
          !self.isLive ||
          !util.isValidHttpUrl(self.selectedStream.streamUrl)
        ) {
          yield self.getVideoInfos(alertData.channelNo);
        }

        // else {
        //   // dongpt: only Direct need to be build?
        //   self.buildVideoData(alertData.channelNo);
        //   streamReadyCallback && streamReadyCallback();
        // }
        return true;
      }),
      onHealthPlay: flow(function* (isLive, data) {
        __DEV__ && console.log('GOND onHealthPlay: ', data);
        self.kDVR = data.kDVR;
        self.isLive = isLive;
        self.isHealthPlay = true;
        __DEV__ && console.log('4 self.isLive = ', self.isLive);
        // self.isSingleMode = true;
        if (self.timezoneName) {
          self.searchDate = DateTime.now()
            .setZone(self.timezone)
            .startOf('day');
        } else {
          self.searchDate = DateTime.now().startOf('day');
        }

        yield self.getDisplayingChannels();

        self.selectChannel(data.channelNo);
        if (self.selectedChannelData == null) {
          __DEV__ &&
            console.log(
              'GOND onAlertPlay channels has been removed or not existed!'
            );
          // self.error = 'Channel is not existed or has been removed!';
          snackbarUtil.onError(VIDEO_TXT.CHANNEL_ERROR);
          return false;
        }
        // Get timezone first
        yield self.getVideoInfos(data.channelNo);

        return true;
      }),
      // #endregion Alert play
      releaseHLSStreams() {
        self.hlsStreams.forEach(s => {
          s.release();
          // util.isValidHttpUrl(s.liveUrl.url) &&
          //   self.stopHLSStream(s.channelNo, s.liveUrl.sid, true);
          // util.isValidHttpUrl(s.liveHDUrl.url) &&
          //   self.stopHLSStream(s.channelNo, s.liveHDUrl.sid, true);
          // util.isValidHttpUrl(s.searchUrl.url) &&
          //   self.stopHLSStream(s.channelNo, s.searchUrl.sid, true);
          // util.isValidHttpUrl(s.searchHDUrl.url) &&
          //   self.stopHLSStream(s.channelNo, s.searchHDUrl.sid, true);
        });
        // __DEV__ && console.trace('GOND releaseHLSStreams!');
        self.hlsStreams = [];
      },
      releaseStreams() {
        __DEV__ &&
          console.log(
            'GOND release video streams, cloudType =',
            self.cloudType
          );
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            self.directStreams.forEach(s => s.reset());
            self.directStreams = [];
            self.directConnection && self.directConnection.reset();
            break;
          case CLOUD_TYPE.HLS:
            self.releaseHLSStreams();
            break;
          case CLOUD_TYPE.RTC:
            // self.openStreamLock = false;
            if (self.rtcConnection) {
              self.rtcConnection.release();
              self.rtcConnection = null;
            }
            break;
        }
        self.nvrUser = null;
        self.nvrPassword = null;
        self.isAuthenticated = false;
        self.allChannels = [];

        self.timezoneName = null;
        self.searchDate = null;
      },
      // enter/leave video view
      enterVideoView(isEnter) {
        self.isInVideoView = isEnter;
      },
      cleanUp() {
        applySnapshot(self, storeDefault);
      },
    };
  });

const storeDefault = {
  kDVR: null,

  allChannels: [],
  // activeChannels: [],
  maxReadyChannels: 0,
  cloudType: CLOUD_TYPE.UNKNOWN,
  // authenData: [],

  // rtcStreams: [],
  hlsStreams: [],
  // directStreams: [],
  directConnection: null,
  // openStreamLock: false,

  channelFilter: '',
  isLoading: false,
  error: '',
  message: '',
  // needResetConnection: false,
  isLive: true,
  isFullscreen: false,
  canSwitchMode: false,
  hdMode: false,
  // paused: false,
  showAuthenModal: false,
  // isSingleMode: false,
  // frameTime: 0,
  searchBegin: null,
  searchEnd: null,
  frameTime: 0,
  frameTimeString: '',
  // timezone: null,
  recordingDates: [],
  timeline: [],
  isAlertPlay: false,
  isPreloadStream: false,
  currentGridPage: 0,
};

const videoStore = VideoModel.create(storeDefault);

export default videoStore;
