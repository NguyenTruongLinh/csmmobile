import {flow, types, getSnapshot, applySnapshot} from 'mobx-state-tree';

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {LocalZone, DateTime} from 'luxon';

import ChannelModel, {parseChannel} from './types/channel';
import RTCStreamModel from './types/webrtc';
import HLSStreamModel from './types/hls';

import apiService from '../services/api';

import snackbarUtil from '../util/snackbar';
import {VSC, DVR} from '../consts/apiRoutes';
import util from '../util/general';
import {numberValue} from '../util/types';
import {
  CLOUD_TYPE,
  DAY_INTERVAL,
  VSCCommand,
  VSCCommandString,
  LAYOUT_DATA,
  DEFAULT_REGION,
  HLS_MAX_EXPIRE_TIME,
  STREAM_TIMEOUT,
  BEGIN_OF_DAY_STRING,
  END_OF_DAY_STRING,
} from '../consts/video';
import {NVRPlayerConfig, CALENDAR_DATE_FORMAT} from '../consts/misc';
import {TIMEZONE_MAP} from '../consts/timezonesmap';
import {VIDEO as VIDEO_TXT, STREAM_STATUS} from '../localization/texts';
import ROUTERS from '../consts/routes';

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
      __DEV__ && console.log('GOND setLoginInfo for ', self.serverID);
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
    password: util.AES_decrypt(server.PWD, apiService.configToken.apiKey),
    kDVR: server.KDVR,
    channels: '',
    searchMode: false,
    // byChannel: true,
    date: '',
    hd: false,
    // interval: DAY_INTERVAL,
  });
};

const DirectStreamModel = types
  .model({
    server: types.reference(DirectServerModel),
    channel: types.reference(ChannelModel),
    // playing: types.boolean,
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
        ...self.server,
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
    get streamStatus() {
      const {isLoading, connectionStatus, error} = self;
      return {
        isLoading,
        connectionStatus,
        error,
      };
    },
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

    // openStreamLock: types.boolean,
    gridLayout: types.optional(types.number, 2),
    channelFilter: types.string,
    isLoading: types.boolean,
    // error: types.string,
    // needResetConnection: types.boolean,
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
    // isSingleMode: types.boolean,
    // frameTime: types.number,
    searchDate: types.maybeNull(types.frozen()), // luxon DateTime
    searchPlayTime: types.maybeNull(types.string),
    // displayDateTime: types.maybeNull(types.string),
    // timezone: types.maybeNull(TimezoneModel),
    dvrTimezone: types.maybeNull(TimezoneModel),
    timezoneOffset: types.maybeNull(types.number), // offset value
    timezoneName: types.maybeNull(types.string), // IANA string
    // timeline: types.array(TimelineModel),
    // hlsTimestamps: types.array(types.number),
    // timelinePos: types.maybeNull(types.number),
    // TODO: timestamp should use BigNumber?
    searchBegin: types.maybeNull(types.number),
    searchEnd: types.maybeNull(types.number),
    staticHoursOfDay: types.maybeNull(types.number),
    forceDstHour: types.maybeNull(types.number),

    isAlertPlay: types.optional(types.boolean, false),
    isPreloadStream: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    frameTime: 0,
    frameTimeString: null,

    recordingDates: {},
    timeline: [],
    hlsTimestamps: [],
    // selectedHLSStream: null,
    directTimeDiff: 0,
    waitForTimezone: false,
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
    get timezone() {
      if (self.cloudType == CLOUD_TYPE.DEFAULT || CLOUD_TYPE.DIRECTION) {
        return util.isNullOrUndef(self.timezoneOffset)
          ? DateTime.local().zone.name
          : `UTC${self.timezoneOffset == 0 ? '' : self.timezoneOffset}`;
      } else {
        return self.timezoneName ?? DateTime.local().zone.name;
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
      const searchDate =
        self.searchDate ?? DateTime.now().setZone(self.timezone).startOf('day');
      if (zone) {
        return searchDate.setZone(zone, options).toSeconds();
      }
      if (
        self.cloudType == CLOUD_TYPE.DEFAULT ||
        self.cloudType == CLOUD_TYPE.DIRECTION
      ) {
        return searchDate.setZone('utc', {keepLocalTime: true}).toSeconds();
      } else {
        return searchDate.toSeconds();
      }
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
      //   console.log('GOND searchPlayTimeLuxon 1: ', self.searchPlayTime);
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
            return self.searchDate;
          }
        }

        // __DEV__ &&
        //   console.log(
        //     'GOND searchPlayTimeLuxon: ',
        //     result,
        //     result.toFormat(NVRPlayerConfig.FrameFormat)
        //   );
        return result;
      } else {
        // __DEV__ && console.log('GOND searchPlayTimeLuxon 4: ', result);
        return (
          self.searchDate ??
          DateTime.now().setZone(self.timezone).startOf('day')
        );
      }
    },
    get searchPlayTimeBySeconds() {
      return self.searchPlayTime
        ? searchPlayTimeLuxon.toSeconds() - self.searchDate.toSeconds()
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
      let videoDataList = [];
      switch (self.cloudType) {
        case CLOUD_TYPE.DEFAULT:
        case CLOUD_TYPE.DIRECTION:
          videoDataList = self.directStreams.filter(s =>
            s.channelName
              .toLowerCase()
              .includes(self.channelFilter.toLowerCase())
          );
          break;
        case CLOUD_TYPE.HLS:
          videoDataList = self.hlsStreams.filter(
            s =>
              s.channel.isActive &&
              s.channel.name
                .toLowerCase()
                .includes(self.channelFilter.toLowerCase())
          );
          break;
        case CLOUD_TYPE.RTC:
          videoDataList = self.rtcConnection
            ? self.rtcConnection.viewers.filter(
                v =>
                  v.channel.isActive &&
                  v.channelName
                    .toLowerCase()
                    .includes(self.channelFilter.toLowerCase())
              )
            : [];
          break;
      }

      if (
        !videoDataList ||
        !Array.isArray(videoDataList) ||
        videoDataList.length == 0
      )
        return [];

      let result = [];
      let totalRow = Math.ceil(videoDataList.length / self.gridLayout);

      for (let row = 0; row < totalRow; row++) {
        let newRow = {key: 'videoRow_' + row, data: []};
        for (let col = 0; col < self.gridLayout; col++) {
          let index = row * self.gridLayout + col;
          if (index < videoDataList.length) {
            newRow.data.push(videoDataList[index]);
            __DEV__ &&
              console.log('LiveChannelsView build video newRow.data: ', newRow);
          } else newRow.data.push({});
        }
        result.push(newRow);
      }

      __DEV__ && console.log('LiveChannelsView build video data: ', result);
      return result;
    },
    get displayDateTime() {
      return (
        self.frameTimeString ??
        self.searchPlayTimeLuxon.toFormat(NVRPlayerConfig.FrameFormat)
      );
    },
  }))
  .actions(self => {
    // volatile state:
    let streamReadyCallback = null;
    let streamTimeout = null;
    // let listIdToCheck = [];
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
      setLoading(value) {
        self.isLoading = value;
      },
      selectDVR(value) {
        if (util.isNullOrUndef(value)) return;
        if (typeof value === 'object' && Object.keys(value).includes('kDVR'))
          self.kDVR = value.kDVR;
        else if (typeof value == 'number') self.kDVR = value;
      },
      setGridLayout(value) {
        self.gridLayout = value;
      },
      setStreamReadyCallback(fn) {
        if (fn && typeof fn !== 'function') {
          console.log('GOND set streamReadyCallback is not a function!');
          return;
        }
        // __DEV__ && console.log('GOND streamReadyCallback ...');
        streamReadyCallback = fn;
      },
      selectChannel(value) {
        const foundChannel = self.allChannels.find(ch => ch.channelNo == value);
        if (!foundChannel) {
          console.log('GOND selected Channel not found: ', value);
          snackbarUtil.onError('Selected channel not found!');
          return false;
        }
        __DEV__ &&
          console.log('GOND selected Channel: ', getSnapshot(foundChannel));

        if (self.noVideo) {
          self.setNoVideo(false);
        }

        if (self.cloudType == CLOUD_TYPE.HLS && !self.isAlertPlay) {
          // reset previous channel status: Grzzz
          if (self.selectedStream) {
            self.selectedStream.setLive(true);
            self.selectedStream.setHD(false);
          }
        }

        // __DEV__ &&
        //   console.log(
        //     `GOND selected Channel ${value} find stream data = : `,
        //     self.videoData
        //   );
        const foundStream = self.videoData.find(row => {
          return row.data.find(s => s.channelNo == value);
        });
        __DEV__ && console.log('GOND foundStream: ', foundStream);
        if (!foundStream) {
          __DEV__ &&
            console.log('GOND stream not found, add new one ... ', foundStream);
          switch (self.cloudType) {
            case CLOUD_TYPE.DEFAULT:
            case CLOUD_TYPE.DIRECTION:
              // console.log(
              //   '### GOND this is unbelievable, how can this case happen, no direct stream found while channel existed!!!'
              // );
              self.getDirectInfos(value);
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
              });
              self.hlsStreams.push(newStream);
              self.getHLSInfos({channelNo: value, timeline: !self.isLive});
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
        self.selectedChannel = value;
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
            const dt = DateTime.fromSeconds(value, fromZone);
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
      },
      setDirectTimeDiff(value) {
        self.directTimeDiff = value;
      },
      setDisplayDateTime(value) {
        self.frameTimeString = value;
      },
      setSearchDate(value, format) {
        __DEV__ && console.log('GOND setSearchDate ', value);
        if (typeof value == 'string') {
          if (self.noVideo) {
            self.setNoVideo(false);
          }
          try {
            self.searchDate = DateTime.fromFormat(
              value,
              format ?? NVRPlayerConfig.RequestTimeFormat
            );
          } catch (err) {
            __DEV__ && console.log('*** GOND setSearchDate failed: ', err);
          }
          if (self.noVideo) {
            self.setNoVideo(false);
          }
          if (self.timezoneName) {
            self.searchDate.setZone(self.timezoneName);
          } else if (self.timezoneOffset) {
            self.searchDate.setZone(`UTC${self.timezoneOffset}`);
          }
          // else : 'local'
          self.setDisplayDateTime(
            self.searchDate.toFormat(NVRPlayerConfig.FrameFormat)
          );

          if (self.cloudType == CLOUD_TYPE.HLS) {
            // self.onHLSSingleStreamChanged(true);
            self.stopHLSStream(
              self.selectedChannel,
              self.selectedStream.targetUrl.sid
            ); // no need to yield/await
            self.selectedStream &&
              self.selectedStream.setUrls({search: null, searchHD: null});
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
        self.waitForTimezone = false;
        // __DEV__ && console.log('GOND buildTimezoneData');

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
        const startOfSearchDay = self.searchDate
          ? self.searchDate.setZone(self.timezoneName).startOf('day')
          : DateTime.now().setZone(self.timezoneName).startOf('day');
        if (self.searchDate != startOfSearchDay) {
          self.searchDate = startOfSearchDay;
        }

        // Request data after timezone acquired
        if (self.cloudType == CLOUD_TYPE.HLS) {
          __DEV__ && console.log(`GOND on HLS get HLS info after build TZ`);
          self.getHLSInfos({
            channelNo: self.selectedChannel ?? undefined,
            daylist: !self.isLive,
            timeline: !self.isLive,
          });
        }
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
        // if (TimelineModel.is(value)) {
        //   self.timeline = TimelineModel.create(getSnapshot(value));
        // }
        if (!value || !Array.isArray(value)) {
          __DEV__ && console.log('GOND setTimeline, not an array ', value);
          return;
        }
        __DEV__ && console.log('GOND setTimeline ', value);
        if (value.length == 0) {
          self.setNoVideo(true);
          return;
        }

        self.timeline = value.map(item =>
          // TimelineModel.create({
          ({
            id: numberValue(item.id),
            begin: numberValue(item.begin),
            end: numberValue(item.end),
            type: numberValue(item.type),
          })
        );
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
      resetNVRAuthentication() {
        if (self.isAuthenticated) return;
        if (self.nvrUser) self.setNVRLoginInfo('', '');
        self.showAuthenModal = true;
      },
      onLoginSuccess() {
        if (!self.isAuthenticated) self.isAuthenticated = true;
      },
      onAuthenSubmit({username, password}) {
        // __DEV__ && console.log('GOND onAuthenSubmit ', {username, password});
        if (!username || !password) return;
        // __DEV__ && console.log('GOND onAuthenSubmit 2');
        self.setNVRLoginInfo(username, password);
        self.displayAuthen(false);
      },
      onAuthenCancel() {
        self.displayAuthen(false);
      },
      switchLiveSearch(isLive) {
        // console.trace();
        const lastValue = self.isLive;
        self.isLive = isLive === undefined ? !self.isLive : isLive;

        if (self.noVideo) {
          self.setNoVideo(false);
        }
        if (!self.isLive && !self.searchDate) {
          self.searchDate = DateTime.now()
            .setZone(self.timezone)
            .startOf('day');
          __DEV__ &&
            console.log(
              'GOND @@@ switchlivesearch zone:',
              self.timezone,
              '\n - searchDate: ',
              self.searchDate.toFormat(NVRPlayerConfig.LiveFrameFormat)
            );
        }

        if (self.cloudType == CLOUD_TYPE.HLS && self.isLive != lastValue) {
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
      // pauseAll(value) {
      //   self.paused = value;
      // },
      switchHD(value) {
        self.hdMode = util.isNullOrUndef(value) ? !self.hdMode : value;
        __DEV__ && console.log('GOND on switch HD: ', self.hdMode);

        if (self.noVideo) {
          self.setNoVideo(false);
        }
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
      setNoVideo(value) {
        self.noVideo = value;
        // self.displayDateTime = self.searchDate.toFormat(
        //   NVRPlayerConfig.FrameFormat
        // );
      },
      setPlayTimeForSearch(value) {
        self.searchPlayTime = value;
      },
      onExitSinglePlayer(currentRoute) {
        // self.isSingleMode = false;
        self.selectedChannel = null;
        self.searchBegin = null;
        self.searchEnd = null;
        self.frameTime = 0;
        self.searchDate = null;
        self.searchPlayTime = null;
        self.frameTimeString = null;
        self.isLoading = false;
        self.isFullscreen = false;
        self.hdMode = false;
        self.paused = false;
        self.showAuthenModal = false;
        self.timeline = [];
        self.timezoneOffset = 0;
        self.noVideo = false;
        //
        // self.selectedHLSStream = null;
        self.isAlertPlay = false;

        __DEV__ && console.log('GOND onExitSinglePlayer: ', currentRoute);
        if (currentRoute != ROUTERS.HEALTH_VIDEO) {
          self.isLive = true;
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
      getCloudSetting: flow(function* () {
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
          const fnSort = (a, b) => a.channelNo < b.channelNo;
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
                snackbarUtil.onError(VIDEO_TXT.CHANNEL_ERROR);
                return false;
              }
            }
            // self.directStreams = [
            //   DirectStreamModel.create({
            //     server: self.directConnection.serverIP,
            //     channel: targetChannel,
            //     // playing: false,
            //   }),
            // ];
          }
          // else {
          self.directStreams = self.allChannels.map(ch =>
            DirectStreamModel.create({
              server: self.directConnection.serverIP,
              channel: ch,
              // playing: false,
            })
          );
          // }
        } catch (err) {
          console.log('GOND cannot get direct video info: ', err);
          snackbarUtil.handleRequestFailed(err);
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
      getDVRTimezone: flow(function* (channelNo) {
        self.waitForTimezone = true;
        setTimeout(() => {
          if (self.waitForTimezone) {
            self.getDVRTimezone(channelNo);
          }
        }, 60000); // 1 min wait time
        return yield self.sendVSCCommand(VSCCommand.TIMEZONE, channelNo);
      }),
      getDaylist: flow(function* (channelNo, sid) {
        return yield self.sendVSCCommand(VSCCommand.DAYLIST, channelNo, {
          sid,
        });
      }),
      getTimeline: flow(function* (channelNo, sid) {
        if (!self.searchDate) {
          self.searchDate = DateTime.now().setZone(self.timezone);
        }
        return yield self.sendVSCCommand(VSCCommand.TIMELINE, channelNo, {
          requestDate: self.searchDate.toFormat(
            NVRPlayerConfig.HLSRequestDateFormat
          ),
          begin: BEGIN_OF_DAY_STRING,
          end: END_OF_DAY_STRING,
          sid,
        });
      }),
      stopHLSStream: flow(function* (channelNo, sid) {
        return yield self.sendVSCCommand(VSCCommand.STOP, channelNo, {sid});
      }),
      getHLSInfos: flow(function* (params) {
        const {channelNo, timezone, daylist, timeline} = params ?? {};
        self.isLoading = true;
        __DEV__ && console.log('GOND getHLSInfos channel: ', channelNo);
        if (!self.activeChannels || self.activeChannels.length <= 0) {
          yield self.getActiveChannels();
        }

        if (timezone) yield self.getDVRTimezone();

        // listIdToCheck = [];
        let requestParams = [];

        if (!util.isNullOrUndef(channelNo)) {
          __DEV__ &&
            console.log('GOND getHLSInfos single channel: ', channelNo);
          let targetStream = self.hlsStreams.find(
            s => s.channelNo == channelNo
          );
          if (!targetStream) {
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
            // if (self.isLive)
            // targetStream.targetUrl.set({sid: util.getRandomId()});

            __DEV__ &&
              console.log('GOND getHLSInfos single channel: ', channelNo);

            self.hlsStreams.push(targetStream);
          } else {
            targetStream.setStreamStatus({
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
            });
          }
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
              RequestDate: self.searchDate.toFormat(
                NVRPlayerConfig.HLSRequestDateFormat
              ),
              BeginTime: self.searchPlayTime
                ? self.searchPlayTimeLuxon.toFormat(
                    NVRPlayerConfig.HLSRequestTimeFormat
                  )
                : BEGIN_OF_DAY_STRING,
              EndTime: END_OF_DAY_STRING,
            };
            __DEV__ &&
              console.log(
                `GOND getHLSInfos date = ${self.searchDate.toFormat(
                  NVRPlayerConfig.HLSRequestDateFormat
                )}`,
                self.searchDate
              );
          }
          // listIdToCheck.push(targetStream.targetUrl.sid);
          targetStream.scheduleCheckTimeout();

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
          self.hlsStreams = self.activeChannels.map(ch => {
            const newConnection = HLSStreamModel.create({
              // id: util.getRandomId(),
              channel: ch,
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
              isHD: self.hdMode,
              isLive: self.isLive,
            });
            newConnection.scheduleCheckTimeout();
            // if (self.isLive)
            // newConnection.targetUrl.set({sid: util.getRandomId()});

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
        } catch (error) {
          console.log(`Could not get HLS video info: ${error}`);
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
        self.selectedStream.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTING,
          isLoading: true,
        });

        let requestParams = [
          {
            ID: apiService.configToken.devId,
            sid: self.selectedStream.targetUrl.sid,
            KDVR: self.kDVR,
            ChannelNo: self.selectedChannel + 1,
            RequestMode: self.hdMode ? VSCCommand.SEARCHHD : VSCCommand.SEARCH,
            isMobile: true,
            RequestDate: self.searchDate.toFormat(
              NVRPlayerConfig.HLSRequestDateFormat
            ),
            BeginTime: time.toFormat(NVRPlayerConfig.HLSRequestTimeFormat),
            EndTime: END_OF_DAY_STRING,
          },
        ];

        try {
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.getMultiURL,
            requestParams
          );
          __DEV__ && console.log(`GOND get multi HLS URL: `, res);
        } catch (error) {
          console.log(`Could not get HLS video info: ${error}`);
          snackbarUtil.handleRequestFailed(error);
          return false;
        }

        // if (dateChanged) {
        //   // yield self.getTimeline(channelNo, self.selectedStream.targetUrl.sid);
        //   params = {...params, timeline: true};
        // }
        // self.getHLSInfos(params);

        // const timeParams = {
        //   RequestDate: self.searchDate.toFormat(
        //     NVRPlayerConfig.HLSRequestDateFormat
        //   ),
        //   BeginTime: self.searchPlayTime
        //     ? self.searchPlayTimeLuxon.toFormat(
        //         NVRPlayerConfig.HLSRequestTimeFormat
        //       )
        //     : BEGIN_OF_DAY_STRING,
        //   EndTime: END_OF_DAY_STRING,
        // };
        // __DEV__ &&
        //   console.log(
        //     `GOND onHLSTimeChanged date = ${self.searchDate.toFormat(
        //       NVRPlayerConfig.HLSRequestDateFormat
        //     )}`,
        //     self.searchDate
        //   );
        // // listIdToCheck.push(self.selectedStream.id);

        // try {
        //   let res = yield apiService.post(VSC.controller, 1, VSC.getMultiURL, [
        //     {
        //       ID: apiService.configToken.devId,
        //       sid: self.selectedStream.targetUrl.sid,
        //       KDVR: self.kDVR,
        //       ChannelNo: self.selectedStream.channel.channelNo + 1,
        //       RequestMode: self.hdMode
        //         ? VSCCommand.SEARCHHD
        //         : VSCCommand.SEARCH,
        //       isMobile: true,
        //       ...timeParams,
        //     },
        //   ]);
        //   __DEV__ && console.log(`GOND get multi HLS URL: `, res);
        // } catch (error) {
        //   console.log(`Could not get HLS video info: ${error}`);
        //   snackbarUtil.handleRequestFailed(error);
        //   return false;
        // }
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
        if (cmd != VSCCommandString.TIMEZONE) {
          if (!self.hlsStreams || self.hlsStreams.length == 0) return;
          if (info.status == 'FAIL') {
            if (self.selectedStream) {
              const target = self.hlsStreams.find(
                s => s.targetUrl.sid == info.sid
              );
              target &&
                target.setStreamStatus({
                  isLoading: false,
                  connectionStatus: STREAM_STATUS.NOVIDEO,
                  error: info.description,
                });
              return;
            }
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
            self.buildTimelineData(info);
            break;
          case VSCCommandString.DAYLIST:
            self.buildDaylistData(info);
            break;
          case VSCCommandString.TIMEZONE:
            __DEV__ && console.log(`GOND on HLS response TZ 1`);
            if (typeof info == 'object' && info.Bias && info.StandardName) {
              __DEV__ && console.log(`GOND on HLS response TZ 2`);
              self.buildTimezoneData(info);
            }
            break;
          case VSCCommandString.STOP:
            break;
          default:
        }
      },
      onReceiveHLSStream: flow(function* onReceiveHLSStream(info, cmd) {
        if (self.cloudType == CLOUD_TYPE.HLS && info.hls_stream) {
          let target = null;
          // if (cmd == VSCCommandString.LIVE || cmd == VSCCommandString.LIVEHD) {
          // if (
          //   self.selectedHLSStream &&
          //   self.selectedHLSStream.targetUrl.sid == info.sid
          // ) {
          //   target = self.selectedHLSStream;
          // } else {
          // target = self.hlsStreams.find(s => s.targetUrl.sid == info.sid);
          // }
          // } else {
          //   target = self.selectedStream;
          //   __DEV__ &&
          //     console.log(
          //       'GOND === onReceiveHLSStream SEARCH current sid = ',
          //       target.targetUrl.sid,
          //       ', incoming sid = ',
          //       info.sid
          //     );
          //   // dongpt: search mode get sid from i3mediaserver, SURPRISE?!?
          //   target.targetUrl.set({sid: info.sid});
          // }
          // let isTargetSelected = false;
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
          if (!target) {
            // if (
            //   self.selectedHLSStream &&
            //   self.selectedHLSStream.targetUrl.sid == info.sid
            // ) {
            //   target = self.selectedHLSStream;
            //   isTargetSelected = true;
            // } else {
            __DEV__ &&
              console.log(`GOND on HLS response target stream not found!`);
            return;
            // }
          }
          const result = yield target.getHLSStreamUrl(info, cmd);
          if (target.isLoading) {
            target.setStreamStatus({
              isLoading: false,
              connectionStatus: result
                ? STREAM_STATUS.DONE
                : STREAM_STATUS.ERROR,
            });
          }

          // if (
          //   self.selectedHLSStream &&
          //   self.selectedHLSStream.targetUrl.sid == info.sid &&
          //   !isTargetSelected
          // ) {
          //   // Clone requested
          //   self.selectedHLSStream = HLSStreamModel.create(target);
          // }
        }
        // streamReadyCallback && streamReadyCallback();
      }),
      buildDaylistData: flow(function* (data) {
        let daysData = data;
        if (!daysData || daysData.length == 0 || daysData.bigData == true) {
          if (self.cloudType == CLOUD_TYPE.HLS) {
            try {
              daysData = yield apiService.get(
                VSC.controller,
                1,
                VSC.getHLSData,
                {
                  id: self.selectedStream.targetUrl.sid,
                  cmd: VSCCommandString.DAYLIST,
                }
              );
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
      buildTimelineData: flow(function* (data) {
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
              }
            } catch (err) {
              console.log('GOND get HLS data Timeline failed: ', err);
            }
          } else {
            self.selectedStream.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.NOVIDEO,
            });
            return;
          }
        }

        if (!jTimeStamp || jTimeStamp.length == 0) {
          __DEV__ &&
            console.log('GOND get HLS data Timeline no data: ', jTimeStamp);
          self.selectedStream.setStreamStatus({
            isLoading: false,
            connectionStatus: STREAM_STATUS.NOVIDEO,
          });
          return;
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
            // this.pause();
            self.selectedStream.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.NOVIDEO,
            });
            return;
          }

          __DEV__ && console.log('-- GOND searchDate', self.searchDate);

          timeInterval.sort((a, b) => a.begin - b.begin);
          self.setTimeline(timeInterval);
          __DEV__ && console.log('-- GOND generateHLSTimeline');
          if (self.cloudType == CLOUD_TYPE.HLS) {
            self.hlsTimestamps = self.generateHLSTimeline(timeInterval);
            __DEV__ &&
              console.log('-- GOND hlsTimestamps = ', self.hlsTimestamps);
            // self.selectedStream.setTimelines(timeInterval, self.hlsTimestamps);
          }
          // return timeInterval;
        } catch (ex) {
          console.log(
            '%c [GOND] RTC.dataChannel.onerror: ',
            'color: red; font-style: italic',
            ex
          );
          // snackbarUtil.showMessage(VIDEO_MESSAGE.MSG_STREAM_ERROR, CMSColors.Danger);
          self.selectedStream.setStreamStatus({
            connectionStatus: STREAM_STATUS.ERROR,
          });
          // return;
        }
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
          streamReadyCallback && streamReadyCallback();
        }
      }),
      // #endregion WebRTC streaming
      // #region Get and receive videoinfos
      getVideoInfos: flow(function* (channelNo) {
        // __DEV__ && console.log('GOND getVideoInfos');
        let getInfoPromise = null;
        if (!self.allChannels || self.allChannels.length <= 0) {
          let res = yield self.getDisplayingChannels();
          if (!res || self.allChannels.length == 0) {
            __DEV__ &&
              console.log('GOND getVideoInfos get channels info failed');
            return false;
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
            return false;
          }
        }
        __DEV__ && console.log('GOND getVideoInfos 2');
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            getInfoPromise = self.getDirectInfos(channelNo);
            break;
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
        // const [resInfo, resTimezone] = yield Promise.all([
        //   getInfoPromise,
        //   self.getDVRTimezone(channelNo),
        // ]);

        // return resInfo && resTimezone;
        return yield getInfoPromise;
      }),
      // onLoginSuccess() {
      //   streamReadyCallback && streamReadyCallback();
      // },
      onReceiveStreamInfo: flow(function* onReceiveStreamInfo(streamInfo, cmd) {
        if (!streamInfo) return;
        __DEV__ && console.log('GOND onReceiveStreamInfo: ', streamInfo);
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
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
        // self.isSingleMode = true;
        if (alertData.searchTime) {
          const dtObj = DateTime.fromISO(alertData.searchTime, {
            zone: 'utc',
            setZone: true,
          });
          if (dtObj.isValid)
            self.searchPlayTime = dtObj.toFormat(
              NVRPlayerConfig.RequestTimeFormat
            );
          else self.searchPlayTime = alertData.searchTime;

          // }
          self.searchDate = DateTime.fromISO(alertData.searchTime, {
            zone: 'utc',
          }).startOf('day');
        } else {
          self.searchDate = self.timezoneName
            ? DateTime.now().setZone(self.searchTime).startOf('day')
            : DateTime.now();
        }
        yield self.getDisplayingChannels();

        if (alertData.channelNo) {
          self.selectChannel(alertData.channelNo);
        } else {
          self.selectChannel(self.displayChannels[0].channelNo);
        }
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
        yield self.getVideoInfos(alertData.channelNo);

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
        // self.isSingleMode = true;
        if (self.timezoneName) {
          self.searchDate = DateTime.now()
            .setZone(self.timezone)
            .startOf('day');
        } else {
          self.searchDate = DateTime.now();
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
      releaseStreams() {
        __DEV__ &&
          console.log(
            'GOND release video streams, cloudType =',
            self.cloudType
          );
        switch (self.cloudType) {
          case CLOUD_TYPE.DEFAULT:
          case CLOUD_TYPE.DIRECTION:
            self.directStreams = [];
            break;
          case CLOUD_TYPE.HLS:
            self.hlsStreams.forEach(s => {
              util.isValidHttpUrl(s.liveUrl.url) &&
                self.stopHLSStream(s.channelNo, s.liveUrl.sid);
              util.isValidHttpUrl(s.liveHDUrl.url) &&
                self.stopHLSStream(s.channelNo, s.liveHDUrl.sid);
              util.isValidHttpUrl(s.searchUrl.url) &&
                self.stopHLSStream(s.channelNo, s.searchUrl.sid);
              util.isValidHttpUrl(s.searchHDUrl.url) &&
                self.stopHLSStream(s.channelNo, s.searchHDUrl.sid);
            });
            self.hlsStreams = [];
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
  frameTimeString: null,
  // timezone: null,
  recordingDates: [],
  timeline: [],
};

const videoStore = VideoModel.create(storeDefault);

export default videoStore;
