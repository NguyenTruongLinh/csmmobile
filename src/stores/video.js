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
import {NVRPlayerConfig, CALENDAR_DATE_FORMAT} from '../consts/misc';
import {TIMEZONE_MAP} from '../consts/timezonesmap';

const HLSStreamModel = types.model({
  sid: types.identifier,
  streamUrl: types.string,
});

const DirectServerModel = types
  .model({
    serverIP: types.identifier,
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
    userName:
      __DEV__ && server.ServerID == 'jackhome' ? 'i3admin' : server.UName,
    password: __DEV__ && server.ServerID == 'jackhome' ? 'i3admin' : server.PWD,
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
    channelNo: types.number,
    kDVR: types.number,
    kChannel: types.identifierNumber,
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

const DirectStreamModel = types
  .model({
    server: types.reference(DirectServerModel),
    channel: types.reference(ChannelModel),
    // playing: types.boolean,
  })
  .views(self => ({
    get playData() {
      if (!self.server || !self.channel) return {};
      const {channelNo, name, kChannel} = self.channel;

      return {
        ...self.server,
        channelNo,
        channels: '' + channelNo,
        channelName: name,
        kChannel,
        byChannel: true,
        interval: DAY_INTERVAL,
      };
    },
    get channelNo() {
      return self.channel.channelNo;
    },
    get channelName() {
      return self.channel.name;
    },
  }))
  .volatile(() => ({
    nativePlayer: null,
  }))
  .actions(self => ({
    setPlay(value) {
      self.playing = value;
    },
    setNativeComponent(value) {
      self.nativePlayer = value;
    },
    setSearchDate(value) {
      self.server.date = value;
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

DateTimeModel = types.model({
  year: types.number,
  month: types.number,
  day: types.number,
  hour: types.number,
  minute: types.number,
  timezoneOffset: types.number,
});

export const VideoModel = types
  .model({
    kDVR: types.maybeNull(types.number),

    allChannels: types.array(ChannelModel),
    maxReadyChannels: types.number,
    cloudType: types.number,

    rtcConnection: types.maybeNull(RTCStreamModel),
    hlsStreams: types.array(HLSStreamModel),
    directConnection: types.maybeNull(DirectServerModel),
    directStreams: types.array(DirectStreamModel),
    selectedChannel: types.maybeNull(types.number),

    openStreamLock: types.boolean,

    channelFilter: types.string,
    isLoading: types.boolean,
    error: types.string,
    // needResetConnection: types.boolean,
    message: types.string,
    nvrUser: types.maybeNull(types.string),
    nvrPassword: types.maybeNull(types.string),
    isLive: types.boolean,
    isFullscreen: types.boolean,
    hdMode: types.boolean,
    canSwitchMode: types.boolean,
    // paused: types.boolean,
    showAuthenModal: types.boolean,
    // isSingleMode: types.boolean,
    frameTime: types.number,
    searchDate: types.maybeNull(types.frozen()),
    displayDateTime: types.maybeNull(types.string),
    // timezone: types.maybeNull(TimezoneModel),
    dvrTimezone: types.maybeNull(TimezoneModel),
    timezoneOffset: types.maybeNull(types.number), // offset value
    timezoneName: types.maybeNull(types.string), // IANA string
    timeline: types.array(TimelineModel),
    // timelinePos: types.maybeNull(types.number),
    // TODO: timestamp should use BigNumber?
    searchBegin: types.maybeNull(types.number),
    searchEnd: types.maybeNull(types.number),
    staticHoursOfDay: types.maybeNull(types.number),
    forceDstHour: types.maybeNull(types.number),
  })
  .volatile(self => ({
    recordingDates: {},
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
        !self.isLive ||
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
          const server = self.directStreams.find(
            s => s.channel.channelNo == self.selectedChannel
          );
          return server || {};
        // return {
        //   ...server,
        //   hd: self.hdMode,
        //   searchMode: !self.isLive,
        //   date:
        //     self.searchDate ??
        //     DateTime.local()
        //       .setZone(self.timezone)
        //       .startOf('day')
        //       .toFormat(NVRPlayerConfig.RequestTimeFormat),
        // };
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
    get filteredChannels() {
      return self.allChannels.filter(ch =>
        ch.name.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get filteredActiveChannels() {
      return self.allChannels.filter(
        ch =>
          ch.isActive &&
          ch.name.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get timezone() {
      if (self.cloudType == CLOUD_TYPE.DEFAULT || CLOUD_TYPE.DIRECTION) {
        return util.isNullOrUndef(self.timezoneOffset)
          ? 'local'
          : `UTC${self.timezoneOffset == 0 ? '' : self.timezoneOffset}`;
      } else {
        return self.timezoneName ?? 'local';
      }
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
      if (!self.searchDate) {
        self.searchDate = DateTime.now().setZone(self.timezone).startOf('day');
      }
      if (zone) {
        return self.searchDate.setZone(zone, options).toSeconds();
      }
      return self.searchDate.toSeconds();
    },
    get searchDateString() {
      if (!self.searchDate) {
        self.searchDate = DateTime.now().setZone(self.timezone).startOf('day');
      }
      return self.searchDate.toFormat(NVRPlayerConfig.RequestTimeFormat);
    },
    get firstChannelNo() {
      return self.allChannels && self.allChannels.length > 0
        ? self.allChannels[0].channelNo
        : 0;
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
        self.directConnection &&
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
        // if (self.cloudType == CLOUD_TYPE.RTC) {
        //   if (self.selectedStream.needInit) {
        //     self.rtcConnection.createChannelConnection(self.selectedStream);
        //   }
        // } else
        // if (self.cloudType == CLOUD_TYPE.HLS) {
        //   // TODO:
        // }
      },
      setFrameTime(value, fromZone) {
        if (typeof value == 'string') {
          // TODO: convert
          self.frameTime = DateTime.fromFormat(
            value,
            NVRPlayerConfig.ResponseTimeFormat,
            {zone: 'utc'}
          ).toSeconds();
        } else if (typeof value == 'number') {
          if (fromZone) {
            const dt = DateTime.fromSeconds(value, fromZone);
            console.log(
              'GOND setFrameTime ',
              dt.setZone(self.timezone).toSeconds()
            );
            self.frameTime = dt.setZone(self.timezone).toSeconds();
          } else {
            self.frameTime = value;
          }
        }
      },
      setDisplayDateTime(value) {
        self.displayDateTime = value;
      },
      setSearchDate(value, format) {
        __DEV__ && console.log('GOND setSearchDate ', value);
        if (typeof value == 'string') {
          self.searchDate = DateTime.fromFormat(
            value,
            format ?? NVRPlayerConfig.RequestTimeFormat
          );
          if (self.timezoneName) {
            self.searchDate.setZone(self.timezoneName);
          } else if (self.timezoneOffset) {
            self.searchDate.setZone(`UTC${self.timezoneOffset}`);
          }
          // else : 'local'
        } else {
          // TODO: convert timezone
        }
      },
      calculateSearchParams(startTime) {
        DateTime.now().daysInMonth;
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
        __DEV__ &&
          console.log(
            '&&& GOND buildTimezoneData data = ',
            self.recordingDates
          );
        if (self.dvrTimezone && self.timezoneName) return;
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
            const tmp = DateTime.local().setZone(tzName);
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

        // if (!data.DaylightDate || !data.StandardDate || data.DaylightDate.wYear == 0 || data.StandardDate.wYear == 0) {
        // 	return {...data, unixDaylightDate: 0, unixStandardDate: 0, timezoneName: tzName}
        // }
        // const offset = (parseInt(data.Bias) - (new Date()).getTimezoneOffset()) * 60;
        // __DEV__ && console.log('&&& GOND buildTimezoneData timezoneOffset = ', offset, ', Bias = ', data.Bias)
        // __DEV__ && console.log('&&& GOND buildTimezoneData timezone name = ', tzName)

        // const formatedDaylight = `${data.DaylightDate.wYear}-${data.DaylightDate.wMonth}-${data.DaylightDate.wDay} ${data.DaylightDate.wHour}:${data.DaylightDate.wMinute}:${data.DaylightDate.wSecond}`;
        // const formatedStandard = `${data.StandardDate.wYear}-${data.StandardDate.wMonth}-${data.StandardDate.wDay} ${data.StandardDate.wHour}:${data.StandardDate.wMinute}:${data.StandardDate.wSecond}`;
        // // __DEV__ && console.log('&&& GOND buildTimezoneData formatedDaylight = ', formatedDaylight, ', formatedStandard = ', formatedStandard);
        // let unixDaylightDate = dayjs.tz(formatedDaylight, tzName).unix();
        // let unixStandardDate = dayjs.tz(formatedStandard, tzName).unix();
        // return {
        // 	...data,
        // 	unixDaylightDate: unixDaylightDate, // (daylightDate) / 1000 - parseInt(data.Bias), //dayjs(daylightDate).unix(),
        // 	unixStandardDate: unixStandardDate, // (standardDate) / 1000 - parseInt(data.Bias), // dayjs(standardDate).unix(),
        // 	timezoneName: tzName,
        // }
      },
      setTimezone(value) {
        if (util.isNullOrUndef(value)) {
          __DEV__ && console.log('GOND setTimezone, is null: ', value);
          return;
        }
        __DEV__ && console.log('GOND setTimezone ', value);
        if (typeof value === 'number') {
          self.timezoneOffset = value / (60 * 60 * 1000);
        }
        // TODO
      },
      setTimeline(value) {
        if (!value || !Array.isArray(value)) {
          __DEV__ && console.log('GOND setTimeline, not an array ', value);
          return;
        }
        __DEV__ && console.log('GOND setTimeline ', value);
        self.timeline = value.map(item => TimelineModel.create(item));
        // __DEV__ && console.log('GOND after settimeline ', self.timeline);
      },
      setHoursOfDay(value) {
        self.staticHoursOfDay = value;
      },
      setDSTHour(value) {
        self.forceDstHour = value;
      },
      displayAuthen(value) {
        self.showAuthenModal = value;
      },
      switchLiveSearch(value) {
        self.isLive = value === undefined ? !self.isLive : value;
        if (!self.isLive && !self.searchDate) {
          console.log(
            'GOND @@@ switchlivesearch ',
            self.timezone,
            DateTime.now().setZone(self.timezone)
          );
          self.searchDate = DateTime.now()
            .setZone(self.timezone)
            .startOf('day');
        }
      },
      // pauseAll(value) {
      //   self.paused = value;
      // },
      switchHD(value) {
        self.hdMode = util.isNullOrUndef(value) ? !self.hdMode : value;
      },
      switchFullscreen(value) {
        self.isFullscreen = util.isNullOrUndef(value)
          ? !self.isFullscreen
          : value;
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
      resetVideoChannel() {
        self.selectedChannel = null;
        self.searchBegin = null;
        self.searchEnd = null;
        self.frameTime = 0;
        self.searchDate = null;
        self.displayDateTime = '';
        self.isLoading = false;
        self.isLive = true;
        self.isFullscreen = false;
        self.hdMode = false;
        self.showAuthenModal = false;
        self.timeline = [];
        self.timezoneOffset = 0;
      },
      resetDVRInfo() {
        self.kDVR = null;
        self.allChannels = [];
        self.activeChannels = [];

        self.rtcConnection = null;
        self.hlsStreams = [];
        self.directConnection = null;
        self.directStreams = [];
        self.selectedChannel = null;
        searchDate = null;

        dvrTimezone = null;
        timezoneOffset = null;
        timezoneName = null;
        timeline = [];

        // searchBegin = null;
        // searchEnd = null;
      },

      // #endregion setters
      // #region Build data
      buildDirectData() {
        self.directStreams = self.allChannels
          .filter(ch =>
            ch.name.toLowerCase().includes(self.channelFilter.toLowerCase())
          )
          .map(ch =>
            DirectStreamModel.create({
              server: self.directConnection.serverIP,
              channel: ch.kChannel,
              // playing: false,
            })
          );

        __DEV__ && console.log('GOND build direct data: ', self.directStreams);
        return self.directStreams;
      },
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
          dc.channelName
            .toLowerCase()
            .includes(self.channelFilter.toLowerCase())
        );
      },
      buildVideoData() {
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            // return self.buildDirectData();
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
      saveActiveChannels: flow(function* saveActiveChannels(channels) {
        if (self.kDVR == null) return false;
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
          if (!result.error) {
            yield self.getActiveChannels();
          }
        } catch (err) {
          __DEV__ && console.log('GOND save active channels error: ', err);
          snackbarUtil.handleGetDataFailed(err);
          self.isLoading = false;
          return false;
        }
        self.isLoading = false;
        return result.error ? false : true;
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
          self.allChannels = res.map(ch => parseChannel(ch));
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
          // __DEV__ &&
          //   console.log(
          //     'GOND getRTCInfo allChannels: ',
          //     getSnapshot(self.allChannels)
          //   );
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
                  ? self.allChannels[0].channelNo + 1
                  : 1),
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
              // __DEV__ &&
              //   console.log(
              //     `GOND channels filter ${self.channelFilter}, active: `,
              //     self.activeChannels
              //   );
              yield self.rtcConnection.createStreams(
                {
                  accessKeyId: streamInfo.access_key,
                  secretAccessKey: streamInfo.secret_key,
                  rtcChannelName: streamInfo.rtc_channel,
                  sid: streamInfo.sid,
                },
                // self.allChannels
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
            self.rtcConnection && self.rtcConnection.release();
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
  // needResetConnection: false,
  isLive: true,
  isFullscreen: false,
  canSwitchMode: false,
  hdMode: false,
  // paused: false,
  showAuthenModal: false,
  // hdMode: false,
  isSingleMode: false,
  frameTime: 0,
  searchBegin: null,
  searchEnd: null,
  displayDateTime: '',
  // timezone: null,
  recordingDates: [],
  timeline: [],
});

export default videoStore;
