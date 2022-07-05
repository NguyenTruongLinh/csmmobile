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
import {VSC, DVR, Site as SiteRoute} from '../consts/apiRoutes';
import util from '../util/general';
import {numberValue} from '../util/types';
import {
  default24H,
  CLOUD_TYPE,
  DAY_INTERVAL,
  VSCCommand,
  VSCCommandString,
  DEFAULT_REGION,
  HLS_DATA_REQUEST_TIMEOUT,
  HLS_MAX_RETRY,
  BEGIN_OF_DAY_STRING,
  END_OF_DAY_STRING,
  HLS_GET_DATA_DIRECTLY_TIMEOUT,
  DEFAULT_SEARCH_OFFSET_IN_SECONDS,
  REFRESH_TIMELINE_INTERVAL,
  CHANNEL_CONTROL_STATUS,
  AUTHENTICATION_STATES,
} from '../consts/video';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {
  NVRPlayerConfig,
  CALENDAR_DATE_FORMAT,
  SITE_TREE_UNIT_TYPE,
} from '../consts/misc';
import {TIMEZONE_MAP} from '../consts/timezonesmap';
import {VIDEO as VIDEO_TXT, STREAM_STATUS} from '../localization/texts';

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

    // dongpt: connection status
    isLoading: types.optional(types.boolean, false),
    connectionStatus: types.optional(types.string, ''),
    error: types.maybeNull(types.string),
    needReset: types.optional(types.boolean, false),
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
      // __DEV__ && console.trace('GOND setChannels ', value);
      if (value && Array.isArray(value)) {
        // self.channels = value.join(',');
        self.channelList = [...value];
      } else {
        console.log('GOND DirectConnection set channels not valid: ', value);
      }
    },
    reset() {
      self.channelList = [];
    },
    setStreamStatus({connectionStatus, error, isLoading, needReset}) {
      // __DEV__ && console.trace('GOND DirectServerModel setStream: ', isLoading);
      connectionStatus != undefined &&
        (self.connectionStatus = connectionStatus);
      isLoading != undefined && (self.isLoading = isLoading);
      needReset != undefined && (self.needReset = needReset);
      error != undefined && (self.error = error);
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
    get canLive() {
      return self.channel ? self.channel.canLive : false;
    },
    get canSearch() {
      return self.channel ? self.channel.canSearch : false;
    },
    get streamStatus() {
      const {isLoading, connectionStatus, error} = self.server;
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
    get snapshot() {
      return self.channel ? self.channel.snapshot : null;
    },
    get isLoading() {
      return self.server ? self.server.isLoading : false;
    },
    get connectionStatus() {
      return self.server ? self.server.connectionStatus : '';
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
    setStreamStatus(statusObject) {
      // __DEV__ &&
      //   console.trace('GOND DirectStreamModel setStreamStatus: ', statusObject);
      self.server.setStreamStatus(statusObject);
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
  daylightDate: types.maybeNull(DSTDateModel),
  standardDate: types.maybeNull(DSTDateModel),
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

export const VideoModel = types
  .model({
    // selected kdvr
    kDVR: types.maybeNull(types.number),

    // list of all channels that current user has permission to view
    allChannels: types.array(ChannelModel),
    // maximum channels can be selected on Channels Setting screen
    maxReadyChannels: types.number,
    // streaming type of video
    cloudType: types.number,
    // authenData: types.array(AuthenModel),
    //
    rtcConnection: types.maybeNull(RTCStreamModel),
    // list of hls streams, each represent respective channel (HLS mode)
    hlsStreams: types.array(HLSStreamModel),
    // a single connection to selected dvr (Direct connection mode)
    directConnection: types.maybeNull(DirectServerModel),
    // list of direct video data, each represent respective channel (Direct connection mode)
    directStreams: types.array(DirectStreamModel),
    // selected channel in single video view
    selectedChannel: types.maybeNull(types.number),
    // number of video per row/columns in multiple live video view (Division Screen)
    gridLayout: types.optional(types.number, 2),
    // string filter of channels on Division Screen
    channelFilter: types.string,
    // is video loading
    isLoading: types.boolean,
    // unused yet?!?
    message: types.string,
    // user name for logging in to view video
    nvrUser: types.maybeNull(types.string),
    // password for logging in to view video
    nvrPassword: types.maybeNull(types.string),
    // check if user has been authenticated to view video, moved to computed value
    // isAuthenticated: types.optional(types.boolean, false),
    // current authentication state: a replacement for isAuthenticated
    //   to solve more complex authentication flows,
    //   values is defined in enum AUTHENTICATION_STATES
    authenticationState: types.optional(
      types.number,
      AUTHENTICATION_STATES.NOT_AUTHEN
    ),
    // live: true, search: false
    isLive: types.boolean,
    // is video full screen
    isFullscreen: types.boolean,
    // is hd mode on or off
    hdMode: types.boolean,
    // unused yet?!?
    canSwitchMode: types.boolean,
    // is video paused
    paused: types.optional(types.boolean, false),
    // if there is no video
    noVideo: types.optional(types.boolean, false),
    // enable/disable authentication popup
    showAuthenModal: types.boolean,
    // frameTime: types.number,
    // frameTimeString: types.string,
    // search date in DateTime (luxon)
    searchDate: types.maybeNull(types.frozen()), // luxon DateTime
    // time to start playing search (use in case of alert videos)
    searchPlayTime: types.maybeNull(types.string),
    // timezone of selected dvr
    dvrTimezone: types.maybeNull(TimezoneModel),
    // timezone offset of selected dvr
    timezoneOffset: types.maybeNull(types.number), // offset value
    // timezone name (IANA string) of selected dvr
    timezoneName: types.maybeNull(types.string),
    // unused yet?!?
    searchBegin: types.maybeNull(types.number),
    // unused yet?!?
    searchEnd: types.maybeNull(types.number),
    // unused value of DST
    staticHoursOfDay: types.maybeNull(types.number),
    forceDstHour: types.maybeNull(types.number),
    // is playing alert of Health Monitor
    isHealthPlay: types.optional(types.boolean, false),
    // is playing alert of Alarm
    isAlertPlay: types.optional(types.boolean, false),
    // is video stream loaded before enter video view
    //  => not release stream after exit video view (HLS, RTC)
    isPreloadStream: types.optional(types.boolean, false),
    // current page of video in Multiple live videos (Division Screen)
    currentGridPage: types.optional(types.number, 0),
    // is API support permission
    isAPIPermissionSupported: types.optional(types.boolean, true),
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
    isAuthenCanceled: false,
    onPostAuthentication: null, // (channelNo, isLive) => {}
  }))
  .views(self => ({
    get isCloud() {
      return self.cloudType > CLOUD_TYPE.DIRECTION;
    },
    get activeChannels() {
      if (self.cloudType == CLOUD_TYPE.DIRECTION) return self.allChannels;
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
      __DEV__ && console.log('GOND needAuthen: ', self.authenticationState); //self.nvrUser, self.nvrPassword);
      return (
        self.authenticationState < AUTHENTICATION_STATES.AUTHENTICATED &&
        self.authenticationState != AUTHENTICATION_STATES.ON_AUTHENTICATING
      );
      // return (
      //   //self.cloudType == CLOUD_TYPE.DIRECTION ||
      //   // self.cloudType == CLOUD_TYPE.DEFAULT) &&
      //   !self.isAuthenticated &&
      //   ((self.nvrUser && self.nvrUser.length == 0) ||
      //     (self.nvrPassword && self.nvrPassword.length == 0))
      // );
    },
    get canDisplayChannels() {
      return (
        (self.cloudType != CLOUD_TYPE.DIRECTION &&
          self.cloudType != CLOUD_TYPE.DEFAULT) ||
        // self.isAuthenticated
        self.authenticationState != AUTHENTICATION_STATES.AUTHENTICATED
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
          // __DEV__ &&
          //   console.log(
          //     'GOND direct selected: ',
          //     server ? getSnapshot(server) : 'none server'
          //   );
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
    get videoStreams() {
      if (self.allChannels.length == 0) return [];
      switch (self.cloudType) {
        case CLOUD_TYPE.DEFAULT:
        case CLOUD_TYPE.DIRECTION:
          return self.directStreams;
        case CLOUD_TYPE.HLS:
          return self.hlsStreams;
        // return self.selectedHLSStream;
        case CLOUD_TYPE.RTC:
          return self.rtcConnection.viewers;
      }
      __DEV__ &&
        console.log('GOND videoStreams: cloud type not valid', self.cloudType);
      return [];
    },
    get privilegedLiveChannels() {
      __DEV__ &&
        console.log('GOND HLS privilegedLiveChannels: ', self.activeChannels);
      return self.activeChannels.reduce((result, ch) => {
        if (ch.canLive) result.push(ch);
        return result;
      }, []);
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
    get channelsSnapshot() {
      return self.allChannels.map(ch => getSnapshot(ch));
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
        default:
          snackbarUtil.onError(VIDEO_TXT.WRONG_CLOUD_TYPE);
          return [];
      }
    },
    get currentDisplayVideoData() {
      let videoDataList =
        self.cloudType == CLOUD_TYPE.HLS
          ? self.videoData.filter(s => s.isActive)
          : self.videoData;
      // __DEV__ && console.log('GOND videoDataList 1', videoDataList);
      if (!videoDataList || videoDataList.length == 0) {
        __DEV__ && console.log('GOND videoDataList is empty <>');
        return [];
      }

      // __DEV__ &&
      //   console.log(
      //     'GOND videoDataList 2: ',
      //     self.gridItemsPerPage,
      //     self.currentGridPage,
      //     videoDataList
      //   );
      videoDataList = videoDataList.filter(
        (_, index) =>
          index < self.gridItemsPerPage * (self.currentGridPage + 1) &&
          index >= self.gridItemsPerPage * self.currentGridPage
      );

      // __DEV__ && console.log('GOND videoDataList 3: ', videoDataList);

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
      // __DEV__ && console.log('GOND $$$ hoursOfSearchDate: ', res);
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
    get isAuthenticated() {
      return self.authenticationState >= AUTHENTICATION_STATES.AUTHENTICATED;
    },
    // get notYetAuthen() {
    //   return self.authenticationState == AUTHENTICATION_STATES.NOT_AUTHEN;
    // },
    get isUserNotLinked() {
      return self.authenticationState == AUTHENTICATION_STATES.NOT_LINKED;
    },
    get canLoadStream() {
      return (
        !self.isAPIPermissionSupported ||
        self.authenticationState == AUTHENTICATION_STATES.PRIVILEGE_LOADED
      );
    },
    // #region permission's computed values
    canPlaySelectedChannel(isLive) {
      // const _isLive = isLive === undefined ? self.isLive : isLive;
      if (
        self.authenticationState == AUTHENTICATION_STATES.NO_PRIVILEGE ||
        !self.selectedChannelData
      )
        return false;
      if (self.isAPIPermissionSupported)
        return isLive == undefined
          ? self.selectedChannelData.canLive ||
              self.selectedChannelData.canSearch
          : isLive
          ? self.selectedChannelData.canLive
          : self.selectedChannelData.canSearch;
      return true;
    },
    canEnterChannel(channelNo, isLive) {
      // const _isLive = isLive === undefined ? self.isLive : isLive;
      if (self.authenticationState == AUTHENTICATION_STATES.NO_PRIVILEGE) {
        __DEV__ && console.log('GOND canEnterChannel no permission!');
        return false;
      }
      if (
        self.authenticationState == AUTHENTICATION_STATES.NOT_LINKED ||
        self.authenticationState == AUTHENTICATION_STATES.NOT_AUTHEN
      ) {
        return true;
      }
      const foundChannel = self.allChannels.find(
        ch => ch.channelNo == channelNo
      );
      if (!foundChannel) {
        __DEV__ && console.log('GOND canEnterChannel not found!');
        return false;
      }

      __DEV__ &&
        console.log('GOND canEnterChannel: ', getSnapshot(foundChannel));
      if (self.isAPIPermissionSupported)
        return isLive === undefined
          ? foundChannel.canLive || foundChannel.canSearch
          : isLive
          ? foundChannel.canLive
          : foundChannel.canSearch;
      return true;
    },
    get canLiveSelectedChannel() {
      if (self.authenticationState == AUTHENTICATION_STATES.NO_PRIVILEGE)
        return false;
      if (self.isAPIPermissionSupported)
        return self.selectedChannelData
          ? self.selectedChannelData.canLive
          : false;

      return true;
    },
    get canSearchSelectedChannel() {
      if (self.authenticationState == AUTHENTICATION_STATES.NO_PRIVILEGE)
        return false;
      if (self.isAPIPermissionSupported)
        return self.selectedChannelData
          ? self.selectedChannelData.canSearch
          : false;

      return true;
    },
    get hasNVRPermission() {
      return self.isAPIPermissionSupported
        ? self.authenticationState >= AUTHENTICATION_STATES.AUTHENTICATED &&
            self.authenticationState != AUTHENTICATION_STATES.NO_PRIVILEGE
        : true;
    },
    get isNoPermission() {
      return self.isAPIPermissionSupported
        ? self.authenticationState >= AUTHENTICATION_STATES.AUTHENTICATED &&
            self.authenticationState == AUTHENTICATION_STATES.NO_PRIVILEGE
        : false;
    },
    // #endregion permission's computed values
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
        // console.log(
        //   'GOND updateCurrentDirectChannel: ',
        //   self.directConnection ? getSnapshot(self.directConnection) : 'null',
        //   self.gridItemsPerPage,
        //   self.currentGridPage,
        //   self.directData ? self.directData.map(s => getSnapshot(s)) : 'null'
        // );
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
        let previousGridPage = self.currentGridPage;
        if (isNext && self.currentGridPage < totalPage - 1) {
          self.currentGridPage++;
          changed = true;
        } else if (isNext && self.currentGridPage == totalPage - 1) {
          self.currentGridPage = 0;
          changed = true;
        } else if (!isNext && self.currentGridPage > 0) {
          self.currentGridPage--;
          changed = true;
        } else if (!isNext && self.currentGridPage == 0) {
          self.currentGridPage = totalPage - 1;
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
      selectChannel(value, autoStart = true, fromMulti = false) {
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
          // snackbarUtil.onError('Selected channel not found!');
          if (self.showAuthenModal) self.displayAuthen(false);
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
            if (!fromMulti)
              self.selectedStream.updateDataUsage(
                FORCE_SENT_DATA_USAGE,
                'select from single player'
              );
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
              }
              if (!fromMulti && foundStream.targetUrl)
                foundStream.targetUrl.resetDataUsageInfo();
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

        if (fromMulti)
          for (let i = 0; i < self.hlsStreams.length; i++) {
            let s = self.hlsStreams[i];
            if (s.id != self.selectedStream.id) {
              s.updateDataUsage(
                FORCE_SENT_DATA_USAGE,
                'select from multi channel'
              );
            }
          }
        return true;
      },
      resetAllStreamsDataUsageInfo() {
        __DEV__ &&
          console.log(
            `resetAllStreamsDataUsageInfo self.hlsStreams.length = `,
            self.hlsStreams.length
          );
        for (let i = 0; i < self.hlsStreams.length; i++) {
          let s = self.hlsStreams[i];
          if (
            s.targetUrl &&
            (!self.selectedStream || s.id != self.selectedStream.id)
          ) {
            __DEV__ &&
              console.log(
                `resetAllStreamsDataUsageInfo s.targetUrl.resetDataUsageInfo = `
              );
            s.targetUrl.resetDataUsageInfo();
          }
        }
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
        const date = DateTime.now().setZone(tzName);
        // dongpt: temporarily handle get dvrTimezone name only
        self.dvrTimezone = TimezoneModel.create({
          bias: data.Bias ? parseInt(data.Bias) : 0,
          daylightBias: data.DaylightBias ? parseInt(data.DaylightBias) : 0,
          standardName: data.StandardName,
          daylightName: data.DaylightName,
          daylightDate: data.DaylightDate
            ? parseDSTDate(data.DaylightDate)
            : null,
          standardDate: data.StandardDate
            ? parseDSTDate(data.StandardDate)
            : null,
        });
        __DEV__ &&
          console.log(`GOND get timezone done: `, tzName, self.timezone);

        // correct search date after timezone acquired
        self.getSafeSearchDate();

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
      displayAuthen(value, force = false) {
        // __DEV__ && console.trace('GOND displaying Login form: ', value);
        if (value == true) {
          // __DEV__ && console.trace('GOND displaying Login form: ', value);
          if (!force && self.isAuthenCanceled == true) return;
        }
        self.showAuthenModal = value;
      },
      resetNVRAuthentication(forceReset = false) {
        // dongpt: do we need this?
        // __DEV__ &&
        //   console.trace(
        //     'GOND resetNVRAuthentication entered: ',
        //     self.authenticationState
        //   );
        if (!forceReset && self.isAuthenticated) return;

        __DEV__ && console.trace('GOND resetNVRAuthentication reset...');
        if (self.nvrUser && self.nvrUser.length > 0)
          self.setNVRLoginInfo('', '');
        if (self.isAuthenCanceled == true) self.isAuthenCanceled = false;
        self.authenticationState = AUTHENTICATION_STATES.HAS_RESET;
        self.displayAuthen(true);
      },
      saveLoginInfo: flow(function* () {
        if (!self.kDVR) return false;

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
        // if (self.cloudType != CLOUD_TYPE.DIRECTION) {
        if (
          res &&
          !util.isNullOrUndef(res.KUser) &&
          !util.isNullOrUndef(res.KDVR) &&
          res.NVRUser &&
          res.NVRUser.length > 0
        ) {
          // self.isAuthenticated = true;
          // self.authenticationState = AUTHENTICATION_STATES.AUTHENTICATED;
          yield self.getDVRPermission();
          return true;
        } else {
          __DEV__ && console.log('GOND linkNVRUser login failed: ', res);
          // self.isAuthenticated = false;
          self.authenticationState = AUTHENTICATION_STATES.AUTHEN_FAILED;
          self.displayAuthen(true);
          snackbarUtil.onError(STREAM_STATUS.LOGIN_FAILED);
          return false;
        }
        // }
      }),

      onLoginSuccess() {
        // dongpt: no need to save anymore, already save in onAuthenSubmit
        // if (!self.isAuthenticated) self.isAuthenticated = true;
        // dongpt: post login info to CMS
        // if (self.shouldLinkNVRUser) self.saveLoginInfo();
      },

      onAuthenSubmit({username, password}) {
        __DEV__ && console.log('GOND onAuthenSubmit ', {username, password});
        if (!username || !password) return;
        // __DEV__ && console.log('GOND onAuthenSubmit 2');
        self.setNVRLoginInfo(username, password);
        self.displayAuthen(false);
        // if (self.cloudType == CLOUD_TYPE.DIRECTION)
        // self.shouldLinkNVRUser = true;
        // else
        self.saveLoginInfo();
      },
      onAuthenCancel() {
        // __DEV__ && console.log('GOND onAuthenCancel');
        self.isAuthenCanceled = true;
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
        self.isAuthenCanceled = false;
        if (self.isAlertPlay == true || self.isHealthPlay == true) {
          self.resetNVRAuthentication();
        } else {
          self.displayAuthen(false);
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
        // self.isAuthenticated = false;
        self.authenticationState = AUTHENTICATION_STATES.NOT_AUTHEN;
        self.displayAuthen(false);

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
          res > CLOUD_TYPE.DEFAULT
        ) {
          self.cloudType = res;
        } else {
          __DEV__ &&
            console.log('GOND get cloud type return wrong value, res = ', res);
          //dongpt: temporarily set default values for wrong settings:
          self.cloudType =
            res >= CLOUD_TYPE.TOTAL ? CLOUD_TYPE.HLS : CLOUD_TYPE.DIRECTION;
          // result = false;
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
      /*
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
              JSON.stringify({...getSnapshot(arrayAllChannels[i]),
                canLive: undefined,
                canSearch: undefined,
              }) !=
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
      */
      refreshChannelsList(newList) {
        const oldList = self.allChannels;
        __DEV__ &&
          console.log(
            'GOND refreshChannelsList to new: ',
            newList.map(ch => getSnapshot(ch))
          );

        // dongpt: check selected stream
        if (
          self.selectedStream &&
          !newList.find(ch => ch.channelNo == self.selectedStream.channelNo)
        ) {
          self.selectedChannel = null;
        }

        // dongpt: check and update current streams
        // const updateFn = (result, currentItem) => {
        //   if (newList.find(ch => ch.channelNo == currentItem.channelNo)) {
        //     result.push(currentItem);
        //   }
        //   return result;
        // };
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            // self.directStreams = self.directStreams.reduce(updateFn, []);
            self.directStreams = self.directStreams.filter(currentItem =>
              newList.find(ch => ch.channelNo == currentItem.channelNo)
            );
            break;
          case CLOUD_TYPE.HLS:
            // self.hlsStreams = self.hlsStreams.reduce(updateFn, []);
            self.hlsStreams = self.hlsStreams.filter(currentItem =>
              newList.find(ch => ch.channelNo == currentItem.channelNo)
            );
            break;
          case CLOUD_TYPE.RTC:
            // self.rtcConnection.updateViews(
            //   self.rtcConnection.viewers.reduce(updateFn, [])
            // );
            self.rtcConnection.updateViews(
              self.rtcConnection.viewers.filter(currentItem =>
                newList.find(ch => ch.channelNo == currentItem.channelNo)
              )
            );
            break;
          default:
            break;
        }

        let isSelectedChannelExist = false;
        const newChannels = newList.map(chData => {
          const found = oldList.find(
            item => item.channelNo == chData.channelNo
          );
          if (chData.channelNo == self.selectedChannel) {
            isSelectedChannelExist = true;
          }
          if (found) {
            found.update(chData);
            return found;
          }
          return chData;
        });
        if (!isSelectedChannelExist) {
          self.selectedChannel = null;
        }
        __DEV__ &&
          console.log(
            'GOND refreshChannelsList: ',
            self.channelsSnapshot,
            newChannels.map(ch => getSnapshot(ch))
          );

        self.allChannels = newChannels;
        self.updateCurrentDirectChannel();
      },
      getDvrChannels: flow(function* (isGetAll = false) {
        if (!self.kDVR) {
          console.log('GOND Could not get channels info, no dvr selected');
          return false;
        }
        self.isLoading = true;

        try {
          let res = yield apiService.get(
            DVR.controller,
            '' + self.kDVR,
            isGetAll ? DVR.getAllChannels : DVR.getChannels
          );
          // __DEV__ &&
          //   console.log(`GOND get channels info (GetAll = ${isGetAll}): `, res);
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
      getActiveChannels: flow(function* () {
        if (!self.kDVR) {
          console.log('GOND Could not get channels info, no dvr selected');
          return false;
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
      getDisplayingChannels: flow(function* (shouldGetPermission = true) {
        let res = null;
        if (
          self.cloudType == CLOUD_TYPE.DIRECTION ||
          self.cloudType == CLOUD_TYPE.DEFAULT
        ) {
          res = yield self.getDvrChannels();
        } else {
          res = yield self.getActiveChannels();
        }
        if (res && shouldGetPermission) {
          // updating permission
          yield self.getDVRPermission();
        }
        return res;
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

          // if (util.isNullOrUndef(channelNo)) {
          //   self.currentGridPage = 0;
          //   // self.directConnection.setChannels(
          //   //   self.allChannels
          //   //     .filter(ch =>
          //   //       ch.name
          //   //         .toLowerCase()
          //   //         .includes(self.channelFilter.toLowerCase())
          //   //     )
          //   //     .map(ch => ch.channelNo)
          //   //     .filter((_, index) => index < self.gridItemsPerPage)
          //   // );
          //   self.updateCurrentDirectChannel();
          // }

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
          } else {
            self.resetNVRAuthentication(true);
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
          if (util.isNullOrUndef(channelNo)) {
            self.currentGridPage = 0;
            self.updateCurrentDirectChannel();
          }
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
      sendVSCCommand: flow(function* (mode, channelNo, params = {}) {
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
          __DEV__ && console.trace(`GOND get DVR info mode ${mode}:`, res);
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
          self.isAuthenticated &&
          snackbarUtil.onMessage(STREAM_STATUS.CONNECTING);
        const res = yield apiService.get(DVR.controller, 1, DVR.getTimezone, {
          kdvr: self.kDVR,
        });

        __DEV__ && console.log('GOND getDVRTimezone: ', res);
        if (res && typeof res == 'string') {
          self.waitForTimezone = false;
          self.buildTimezoneData({
            StandardName: res,
            DaylightName: res,
          });
          return true;
        }
        self.sendVSCCommand(VSCCommand.TIMEZONE, channelNo, {sid});
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
        __DEV__ && console.log('GOND getHLSInfos channel: ', channelNo);
        if (!self.activeChannels || self.activeChannels.length <= 0) {
          yield self.getActiveChannels();
        }

        if (timezone) yield self.getDVRTimezone();
        self.clearRefreshTimelineInterval();

        // listIdToCheck = [];
        let requestParams = [];

        if (!util.isNullOrUndef(channelNo)) {
          // dongpt: get stream on single mode
          __DEV__ &&
            console.log('GOND getHLSInfos single channel: ', channelNo);
          // check channel privilege
          const targetChannel = self.allChannels.find(
            ch => ch.channelNo == channelNo
          );
          __DEV__ &&
            console.log(
              'GOND getHLSInfos single channel, check permission: ',
              self.isAPIPermissionSupported,
              targetChannel.canPlayMode(self.isLive)
            );
          if (
            !targetChannel ||
            (self.isAPIPermissionSupported &&
              !targetChannel.canPlayMode(self.isLive))
          ) {
            __DEV__ &&
              console.log(
                'GOND getHLSInfos channel not found or no privilege: ',
                targetChannel
              );
            return;
          }

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
          // dongpt: get stream on multi division mode
          // dongpt: ONLY LIVE MODE =======
          // __DEV__ && console.log('GOND getHLSInfos channel multi division');
          if (self.activeChannels.length <= 0) {
            __DEV__ && console.log(`GOND get multi HLS URL: No active channel`);
            return false;
          }
          if (self.hlsStreams.length > 0) self.releaseHLSStreams();
          self.hlsStreams = self.activeChannels.map(ch => {
            // self.hlsStreams = self.privilegedLiveChannels.map(ch => {
            const newConnection = HLSStreamModel.create({
              // id: util.getRandomId(),
              channel: ch,
              isLoading: ch.canLive ? true : false,
              connectionStatus: ch.canLive
                ? STREAM_STATUS.CONNECTING
                : STREAM_STATUS.NO_PERMISSION,
              isHD: self.hdMode,
              isLive: self.isLive,
            });
            newConnection.setOnErrorCallback(self.onHLSError);
            // __DEV__ &&
            //   console.log('GOND getHLSInfos channel init calive: ', ch.canLive);
            ch.canLive &&
              newConnection.startWaitingForStream(newConnection.targetUrl.sid);

            return newConnection;
          });
          // __DEV__ &&
          //   console.log(
          //     'GOND getHLSInfos channel multi division 1 ',
          //     self.hlsStreams
          //   );
          self.isLoading = false;

          requestParams = self.hlsStreams.reduce((result, s) => {
            // __DEV__ &&
            //   console.log(
            //     'GOND getHLSInfos channel init param: ',
            //     s.canLive,
            //     s
            //   );
            if (s.canLive) {
              result.push({
                ID: apiService.configToken.devId,
                sid: s.targetUrl.sid,
                KDVR: self.kDVR,
                ChannelNo: s.channel.channelNo + 1,
                RequestMode: VSCCommand.LIVE, // should include SEARCH? HD?
                isMobile: true,
              });
            }
            return result;
          }, []);
        }
        // __DEV__ &&
        //   console.log(
        //     'GOND getHLSInfos channel multi division 2',
        //     requestParams
        //   );
        if (requestParams.length > 0) {
          try {
            let res = yield apiService.post(
              VSC.controller,
              1,
              VSC.getMultiURL,
              requestParams
            );
            __DEV__ && console.log(`GOND get multi HLS URL: `, res);
            __DEV__ &&
              console.log(
                'GOND == PROFILING == Sent VSC Request: ',
                new Date()
              );
          } catch (error) {
            console.log(`Could not get HLS video info: ${error}`);
            self.shouldShowSnackbar &&
              self.isInVideoView &&
              snackbarUtil.handleRequestFailed(error);
            return false;
          }
        }
        return true;
      }),
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

        // dongpt: check permission
        if (!self.hasNVRPermission) {
          __DEV__ &&
            console.log(
              'GOND getVideoInfos no permission! ',
              self.selectedStream
            );
          if (self.selectedStream) {
            self.selectedStream.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.NO_PERMISSION,
            });
          } else {
            self.videoStreams.forEach(s =>
              s.setStreamStatus({
                isLoading: false,
                connectionStatus: STREAM_STATUS.NO_PERMISSION,
              })
            );
          }
          return;
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
            // TODO: dongpt: get timezone before set searchDate
            self.searchDate = self.timezoneName
              ? DateTime.now().setZone(self.timezoneName).startOf('day')
              : DateTime.now().startOf('day');
          }
        }
        if (
          self.allChannels.length <= 0 ||
          self.kDVR != self.allChannels[0].kDVR
        ) {
          const res = yield self.getDisplayingChannels();
          if (res === false) {
            __DEV__ && console.log('GOND onAlertPlay get channels list failed');
            return false;
          }
        }

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
          // !self.isLive ||  // removed: prevent stream not created or was released
          !util.isValidHttpUrl(self.selectedStream.streamUrl)
        ) {
          yield self.getVideoInfos(alertData.channelNo);
        }
        // if (self.needAuthen)
        self.resetNVRAuthentication();
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
      // #region Permission
      // dongpt: get user linked status (CMS user to NVR user), must be call
      //   after 'getDisplayingChannels' function
      getDVRPermission: flow(function* (kDVR /*, siteKey*/, isSilent = true) {
        if (!util.isNullOrUndef(kDVR) && kDVR != self.kDVR) self.kDVR = kDVR;
        if (util.isNullOrUndef(self.kDVR)) {
          __DEV__ &&
            console.log(
              'GOND getDVRPermission - none site or nvr was selected: ',
              // siteKey,
              self.kDVR
            );
          return;
        }
        self.authenticationState = AUTHENTICATION_STATES.ON_AUTHENTICATING;
        try {
          const res = yield apiService.get(
            SiteRoute.controller,
            1,
            SiteRoute.getNVRPermission,
            {
              hasChannels: true,
              // siteId: siteKey,
              kdvr: self.kDVR,
            }
          );
          __DEV__ && console.log('GOND getDVRPermission: ', self.kDVR, res);
          if (!res || !res.Sites || !Array.isArray(res.Sites)) {
            __DEV__ &&
              console.log(
                'GOND getDVRPermission result is not valid: ',
                res ? res.Sites : res
              );
            // CMSAPI not support yet, let pass the authentication for now
            self.authenticationState = AUTHENTICATION_STATES.AUTHENTICATED;
            self.isAPIPermissionSupported = false;
            self.onAuthenticated();
            return;
          }
          self.isAPIPermissionSupported = true;
          let currentArray = res.Sites;
          let currentObject = res;
          let currentDvr = null;
          while (
            currentArray &&
            currentArray.length > 0 &&
            currentObject.Type != SITE_TREE_UNIT_TYPE.DVR
          ) {
            currentObject = currentArray[0];
            currentArray = currentArray.Sites;
          }
          __DEV__ &&
            console.log(
              'GOND getDVRPermission check linked0:  ',
              currentArray,
              self.isAuthenticated
            );
          currentDvr = currentObject;

          if (
            // !self.isAuthenticated &&
            currentObject.ChannelControlStatus ==
            CHANNEL_CONTROL_STATUS.NOT_LINK
          ) {
            self.authenticationState = AUTHENTICATION_STATES.NOT_LINK;
            self.displayAuthen(true);
            return;
          }

          if (
            currentObject.ChannelControlStatus ==
              CHANNEL_CONTROL_STATUS.NOT_PRIVILEGE ||
            !currentArray ||
            currentArray.length == 0
          ) {
            // dongpt: no permission or channel list is empty
            self.authenticationState = AUTHENTICATION_STATES.NO_PRIVILEGE;
            if (!isSilent) snackbarUtil.onWarning(VIDEO_TXT.NO_NVR_PERMISSION);

            return;
          }

          __DEV__ &&
            console.log('GOND getDVRPermission check linked ', currentArray);
          // self.isAuthenticated =
          self.authenticationState =
            currentObject.ChannelControlStatus ==
            CHANNEL_CONTROL_STATUS.HAVE_PRO_CONFIG
              ? AUTHENTICATION_STATES.AUTHENTICATED
              : AUTHENTICATION_STATES.NOT_LINKED;
          if (!self.isAuthenticated) {
            // if not authenticated yet, will be back to check live/search permission
            //   after logged in
            // show Authentication popup
            self.displayAuthen(true);
            return;
          }

          // while (
          //   currentArray &&
          //   currentArray.length > 0 &&
          //   currentArray[0].Type != SITE_TREE_UNIT_TYPE.CHANNEL
          // ) {
          //   currentObject = currentArray[0];
          //   currentArray = currentArray.Sites;
          // }
          if (self.allChannels.length == 0) {
            __DEV__ &&
              console.log(
                'GOND getDVRPermission should be call after getDisplayingChannels: '
                // self.allChannels
              );
            //
            const resChannels = yield self.getDisplayingChannels(false);
            // if (res === false) {
            //   console.log(
            //     'GOND getDVRPermission interupted because cannot get channels data'
            //   );
            //   return currentArray;
            // }
            // return currentArray;
          }
          if (
            currentArray &&
            currentArray.length > 0 &&
            self.allChannels.length > 0
          ) {
            __DEV__ &&
              console.log('GOND :: update perm before loop: ', currentArray);
            // self.allChannels.forEach(ch => {
            //   let currentChannel = currentArray.find(
            //     item => item.ChannelNo == ch.channelNo
            //   );
            //   __DEV__ &&
            //     console.log('GOND ::::: update perm ch: ', getSnapshot(ch));
            //   if (currentChannel) {
            //     __DEV__ &&
            //       console.log('GOND update perm found: ', currentChannel);
            //     ch.setLiveSearchPermission(
            //       currentChannel.CanLive,
            //       currentChannel.CanSearch
            //     );
            //   } else if (currentDvr) {
            //     console.log('GOND update perm not found: ', currentDvr);
            //     ch.setLiveSearchPermission(false, false);
            //   }
            // });
            // self.refreshChannelsList(
            self.allChannels = self.allChannels.reduce((result, ch) => {
              let currentChannel = currentArray.find(
                item => item.ChannelNo == ch.channelNo
              );
              __DEV__ &&
                console.log('GOND ::::: update perm ch: ', getSnapshot(ch));
              if (currentChannel) {
                __DEV__ &&
                  console.log('GOND update perm found: ', currentChannel);
                ch.setLiveSearchPermission(
                  currentChannel.CanLive,
                  currentChannel.CanSearch
                );
                result.push(ch);
              }
              return result;
            }, []);
            // );
            __DEV__ &&
              console.log(
                'GOND getDVRPermission final channels: ',
                self.allChannels.map(ch => getSnapshot(ch))
              );
            self.authenticationState = AUTHENTICATION_STATES.PRIVILEGE_LOADED;

            self.onAuthenticated();
          } else {
            __DEV__ &&
              console.log(
                'GOND getDVRPermission no permission or channel: ',
                currentArray,
                currentArray.length > 0,
                self.allChannels.length
              );

            self.authenticationState = AUTHENTICATION_STATES.NO_PRIVILEGE;
          }
        } catch (ex) {
          console.log('GOND getDVRPermission failed: ', ex);
          if (
            self.authenticationState == AUTHENTICATION_STATES.ON_AUTHENTICATING
          ) {
            self.authenticationState = AUTHENTICATION_STATES.AUTHEN_FAILED;
          }
          return;
        }
      }),
      onAuthenticated() {
        if (
          self.onPostAuthentication &&
          typeof self.onPostAuthentication == 'function'
        ) {
          __DEV__ && console.log('GOND postAuthenticationCheck call delayed!');
          self.onPostAuthentication();
          self.onPostAuthentication = null;
        }
      },
      postAuthenticationCheck(callback) {
        if (!callback || typeof callback != 'function') {
          __DEV__ &&
            console.log('GOND postAuthenticationCheck not a callable!');
          return;
        }
        if (
          self.authenticationState == AUTHENTICATION_STATES.ON_AUTHENTICATING
        ) {
          __DEV__ &&
            console.log(
              'GOND postAuthenticationCheck not ready will call later!',
              self.authenticationState
            );
          self.onPostAuthentication = callback;
          return;
        }
        __DEV__ && console.log('GOND postAuthenticationCheck call now!');
        callback();
      },
      // #endregion Permission
      releaseHLSStreams() {
        self.hlsStreams.forEach(s => {
          s.release();
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
        // self.isAuthenticated = false;
        self.authenticationState = AUTHENTICATION_STATES.NOT_AUTHEN;

        self.allChannels = [];

        self.timezoneName = null;
        self.searchDate = null;
      },
      // enter/leave video view
      enterVideoView(isEnter) {
        self.isInVideoView = isEnter;
        // dongpt: prevent authen popup blinking
        self.displayAuthen(false);
      },
      cleanUp() {
        applySnapshot(self, storeDefault);
      },
      testUpdateBitrate() {
        __DEV__ && console.log(` testUpdateBitrate `);
        apiService.post(VSC.controller, 1, VSC.SetDataUsageActivityLogs, {
          KChannel: 5523,
          ViewMode: 0,
          Source: 'MP4_CMSMobile_OAM',
          StartTime: '2022-04-28 13:52:48',
          EndTime: '2022-04-28 13:52:58',
          BytesUsed: 7715737,
        });
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
