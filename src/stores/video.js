import {flow, types, getSnapshot, applySnapshot} from 'mobx-state-tree';

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
  VSCCommandString,
  LAYOUT_DATA,
  DEFAULT_REGION,
  HLS_MAX_EXPIRE_TIME,
  STREAM_TIMEOUT,
} from '../consts/video';
import {NVRPlayerConfig, CALENDAR_DATE_FORMAT} from '../consts/misc';
import {TIMEZONE_MAP} from '../consts/timezonesmap';
import {KinesisVideo} from '@aws-sdk/client-kinesis-video';
import {
  ContainerFormat,
  FragmentSelectorType,
  HLSDiscontinuityMode,
  HLSPlaybackMode,
  KinesisVideoArchivedMedia,
} from '@aws-sdk/client-kinesis-video-archived-media';

import {Video as VideoTxt, STREAM_STATUS} from '../localization/texts';

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

const HLSStreamModel = types
  .model({
    sid: types.identifier,
    streamUrl: types.optional(types.string, ''),
    channel: types.reference(ChannelModel),
    accessKey: types.optional(types.string, ''),
    secretKey: types.optional(types.string, ''),
    streamName: types.optional(types.string, ''),
    // sessionToken: types.maybeNull(types.string),
    isLoading: types.optional(types.boolean, false),
    connectionStatus: types.optional(types.string, ''),
    error: types.maybeNull(types.string),
    needReset: types.optional(types.boolean, false),
  })
  .views(self => ({
    get channelNo() {
      return self.channel.channelNo;
    },
    get channelName() {
      return self.channel.name;
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
    setURL(value) {
      self.streamUrl = value;
    },
    setAWSInfo(data) {
      self.streamName = data.hls_stream;
      self.accessKey = data.access_key;
      self.secretKey = data.secret_key;
      // self.sessionToken = data.session_token ?? null;
    },
    setStreamStatus({connectionStatus, error, isLoading, needReset}) {
      __DEV__ &&
        console.log('GOND HLS: Set stream status: ', {
          connectionStatus,
          error,
          isLoading,
          needReset,
        });
      connectionStatus != undefined &&
        (self.connectionStatus = connectionStatus);
      isLoading != undefined && (self.isLoading = isLoading);
      needReset != undefined && (self.needReset = needReset);
      error != undefined && (self.error = error);
    },
    getHLSStreamUrl: flow(function* (info, isLive = true) {
      if (info) self.setAWSInfo(info);

      // Step 1: Configure SDK Clients
      const configs = {
        region: DEFAULT_REGION,
        credentials: {
          accessKeyId: self.accessKey,
          secretAccessKey: self.secretKey,
        },
        endpoint: '',
        // sessionToken: self.sessionToken,
      };
      const kinesisVideo = new KinesisVideo(configs);

      __DEV__ && console.log('GOND HLS: Get stream ARN ... ');
      // let streamARN = '';
      // try {
      //   const response = yield kinesisVideo.describeStream({
      //     StreamName: self.streamName,
      //   });

      //   __DEV__ && console.log('GOND Get stream ARN: ', response);
      //   streamARN = response.StreamInfo.StreamARN;
      //   // new Endpoint(
      //   //   response.DataEndpoint
      //   // );
      // } catch (err) {
      //   __DEV__ && console.log('GOND HLS Get stream ARN failed: ', err);
      //   return false;
      // }

      // Step 2: Get a data endpoint for the stream
      __DEV__ && console.log('GOND HLS: Fetching data endpoint ... ');
      try {
        const response = yield kinesisVideo.getDataEndpoint({
          StreamName: self.streamName,
          // StreamARN: streamARN,
          APIName: 'GET_HLS_STREAMING_SESSION_URL',
        });

        __DEV__ && console.log('GOND Data endpoint: ', response);
        configs.endpoint = response.DataEndpoint;
      } catch (err) {
        __DEV__ && console.log('GOND HLS Fetching data endpoint failed: ', err);
        return false;
      }

      // Step 3: Get a Streaming Session URL
      const kinesisVideoArchivedContent = new KinesisVideoArchivedMedia(
        configs
      );
      try {
        const response =
          yield kinesisVideoArchivedContent.getHLSStreamingSessionURL({
            StreamName: self.streamName,
            PlaybackMode: HLSPlaybackMode.LIVE /*isLive
              ? HLSPlaybackMode.LIVE
              : HLSPlaybackMode.LIVE_REPLAY,*/,
            HLSFragmentSelector: {
              FragmentSelectorType: FragmentSelectorType.SERVER_TIMESTAMP,
              // TimestampRange: isLive
              //   ? undefined
              //   : {
              //       StartTimestamp: new Date($('#startTimestamp').val()),
              //       EndTimestamp: new Date($('#endTimestamp').val()),
              //     },
            },
            // ContainerFormat: ContainerFormat.FRAGMENTED_MP4,
            DiscontinuityMode: HLSDiscontinuityMode.ALWAYS,
            // DisplayFragmentTimestamp: $('#displayFragmentTimestamp').val(),
            // MaxMediaPlaylistFragmentResults: parseInt($('#maxResults').val()),
            Expires: HLS_MAX_EXPIRE_TIME,
          });

        __DEV__ && console.log('GOND Get Streaming Session URL: ', response);
        self.streamUrl = response.HLSStreamingSessionURL;
      } catch (err) {
        __DEV__ &&
          console.log('GOND HLS Get Streaming Session URL failed: ', err);
        self.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.ERROR,
          error: err.message,
        });
        return false;
      }
      return true;
    }),
    reconnect(isLive) {
      self.streamUrl = '';
      self.setStreamStatus({
        isLoading: true,
        connectionStatus: STREAM_STATUS.RECONNECTING,
      });
      self.getHLSStreamUrl(null, isLive);
    },
  }));

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
    get channelNo() {
      return self.channel.channelNo;
    },
    get channelName() {
      return self.channel.name;
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
      connectionStatus && (self.connectionStatus = connectionStatus);
      isLoading && (self.isLoading = isLoading);
      needReset && (self.needReset = needReset);
      error && (self.error = error);
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
    gridLayout: types.optional(types.number, 2),
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
    isSingleMode: types.boolean,
    frameTime: types.number,
    searchDate: types.maybeNull(types.frozen()),
    searchPlayTime: types.maybeNull(types.string),
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
    directTimeDiff: 0,
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
      return self.allChannels
        ? self.allChannels.findIndex(
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
            s => s.channel.channelNo == self.selectedChannel
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
        case CLOUD_TYPE.RTC:
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
    get searchPlayTimeBySeconds() {
      return (
        DateTime.fromFormat(
          self.searchPlayTime,
          NVRPlayerConfig.RequestTimeFormat,
          self.timezone ? {zone: self.timezone} : undefined
        ).toSeconds() - self.searchDate.toSeconds()
      );
    },
    get directData() {
      return self.directStreams.filter(s =>
        s.channelName.toLowerCase().includes(self.channelFilter.toLowerCase())
      );
    },
    get hlsData() {
      return self.hlsStreams.filter(s =>
        s.channel.name.toLowerCase().includes(self.channelFilter.toLowerCase())
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
          videoDataList = self.hlsStreams.filter(s =>
            s.channel.name
              .toLowerCase()
              .includes(self.channelFilter.toLowerCase())
          );
          break;
        case CLOUD_TYPE.RTC:
          videoDataList = self.rtcConnection
            ? self.rtcConnection.viewers.filter(v =>
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
              console.log('ChannelsView build video newRow.data: ', newRow);
          } else newRow.data.push({});
        }
        result.push(newRow);
      }

      __DEV__ && console.log('ChannelsView build video data: ', result);
      return result;
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
      setDirectTimeDiff(value) {
        self.directTimeDiff = value;
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

        if ((self.cloudType = CLOUD_TYPE.HLS)) {
          self.getHLSInfos();
          self.stopHLSStream();
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
      setPlayTimeForSearch(value) {
        self.searchPlayTime = value;
      },
      resetVideoChannel() {
        self.isSingleMode = false;
        self.selectedChannel = null;
        self.searchBegin = null;
        self.searchEnd = null;
        self.frameTime = 0;
        self.searchDate = null;
        self.searchPlayTime = null;
        self.displayDateTime = '';
        self.isLoading = false;
        self.isLive = true;
        self.isFullscreen = false;
        self.hdMode = false;
        self.showAuthenModal = false;
        self.timeline = [];
        self.timezoneOffset = 0;
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
          s.channel.name
            .toLowerCase()
            .includes(self.channelFilter.toLowerCase())
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
          if (!result.error) {
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
            __DEV__ &&
              console.log(
                'GOND - Compare channels: ',
                JSON.stringify(getSnapshot(arrayAllChannels[i])),
                ' >< ',
                JSON.stringify(getSnapshot(arrCompareChannels[i]))
              );
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
        self.allChannels = newList;
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
            __DEV__ &&
              console.log('GOND cannot get channels info: ', res.error);
            snackbarUtil.handleRequestFailed(res.error);
            self.error = res.error;
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
          if (resActive.error || resAll.error) {
            console.log(
              'GOND cannot get active channels info: ',
              resActive.error,
              ' && ',
              resAll.error
            );
            snackbarUtil.handleRequestFailed(resActive.error || resAll.error);
            self.error = resActive.error || resAll.error;
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
      getDirectInfos: flow(function* getDirectInfos(channelNo) {
        self.isLoading = true;
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
                snackbarUtil.onError(VideoTxt.channelError);
                return false;
              }
            }
            self.directStreams = [
              DirectStreamModel.create({
                server: self.directConnection.serverIP,
                channel: targetChannel,
                // playing: false,
              }),
            ];
          } else {
            self.directStreams = self.allChannels.map(ch =>
              DirectStreamModel.create({
                server: self.directConnection.serverIP,
                channel: ch.kChannel,
                // playing: false,
              })
            );
          }
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
      sendVSCCommand: flow(function* getStreamInfo(mode, channelNo) {
        if (mode < VSCCommand.LIVE || mode > VSCCommand.TIMEZONE) {
          __DEV__ && console.log('GOND mode is not valid: ', mode);
          return;
        }
        try {
          let res = yield apiService.post(
            VSC.controller,
            1,
            VSC.requestVSCURL,
            {
              ID: apiService.configToken.devId,
              KDVR: self.kDVR,
              ChannelNo: channelNo ?? self.firstChannelNo,

              RequestMode: mode,
              isMobile: true,
            }
          );
          __DEV__ && console.log(`GOND get DVR info mode ${mode}:`, res);
        } catch (ex) {
          console.log(`Could not get mode ${mode}: ${ex}`);
          return false;
        }
        return true;
      }),
      getDVRTimezone: flow(function* getDVRTimezone(channelNo) {
        return yield self.sendVSCCommand(VSCCommand.TIMEZONE, channelNo);
      }),
      getDaylist: flow(function* getDaylist(channelNo) {
        return yield self.sendVSCCommand(VSCCommand.DAYLIST, channelNo);
      }),
      getTimeline: flow(function* getTimeline(channelNo) {
        return yield self.sendVSCCommand(VSCCommand.TIMELINE, channelNo);
      }),
      stopHLSStream: flow(function* stopHLSStream(channelNo) {
        return yield self.sendVSCCommand(VSCCommand.STOP, channelNo);
      }),
      getHLSInfos: flow(function* getHLSInfos(channelNo) {
        self.isLoading = true;
        __DEV__ && console.log('GOND getHLSInfos 1');
        if (!self.activeChannels || self.activeChannels.length <= 0) {
          yield self.getActiveChannels();
          __DEV__ && console.log('GOND getHLSInfos 2');
        }

        let res = yield self.getDVRTimezone();
        if (!self.isLive) {
          res = res && (yield self.getDaylist());
          res = res && (yield self.getTimeline());
        }

        if (channelNo) {
          let targetStream = self.hlsStreams.find(
            s => s.channelNo == channelNo
          );
          if (!targetStream) {
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
                return false;
              }
            }
            targetStream = HLSStreamModel.create({
              sid: util.getRandomId(),
              channel: targetChannel,
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
            });

            self.hlsStreams.push(targetStream);
            try {
              let res = yield apiService.post(
                VSC.controller,
                1,
                VSC.getMultiURL,
                [
                  {
                    ID: apiService.configToken.devId,
                    sid: s.sid,
                    KDVR: self.kDVR,
                    ChannelNo: s.channel.channelNo,
                    RequestMode: self.isLive
                      ? self.hdMode
                        ? VSCCommand.LIVEHD
                        : VSCCommand.LIVE
                      : self.hdMode
                      ? VSCCommand.SEARCHHD
                      : VSCCommand.SEARCH,
                    isMobile: true,
                  },
                ]
              );
              __DEV__ && console.log(`GOND get multi HLS URL: `, res);
            } catch (error) {
              console.log(`Could not get mode HLS video info: ${ex}`);
              snackbarUtil.handleRequestFailed(error);
              return false;
            }
          }
        } else {
          if (self.activeChannels.length <= 0) {
            __DEV__ && console.log(`GOND get multi HLS URL: No active channel`);
            return false;
          }
          self.hlsStreams = self.activeChannels.map(ch => {
            const newConnection = HLSStreamModel.create({
              sid: util.getRandomId(),
              channel: ch,
            });
            newConnection.setStreamStatus({
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
            });

            return newConnection;
          });
          streamReadyCallback && streamReadyCallback();
          self.isLoading = false;
          // return true;

          try {
            let res = yield apiService.post(
              VSC.controller,
              1,
              VSC.getMultiURL,
              self.hlsStreams.map(s => ({
                ID: apiService.configToken.devId,
                sid: s.sid,
                KDVR: self.kDVR,
                ChannelNo: s.channel.channelNo,
                RequestMode: VSCCommand.LIVE, // should include SEARCH?
                isMobile: true,
              }))
            );
            __DEV__ && console.log(`GOND get multi HLS URL: `, res);
          } catch (error) {
            console.log(`Could not get mode HLS video info: ${ex}`);
            snackbarUtil.handleRequestFailed(error);
            return false;
          }
        }
        return true;
      }),
      onHLSInfoResponse(info, cmd) {
        __DEV__ && console.log(`GOND on HLS response ${cmd}: `, info);
        if (info.status == 'FAIL') {
          const target = self.hlsStreams.find(s => s.sid == info.sid);
          target.setStreamStatus({
            isLoading: false,
            connectionStatus: STREAM_STATUS.NOVIDEO,
            error: info.description,
          });
          return;
        }
        switch (cmd) {
          case VSCCommandString.LIVE:
          case VSCCommandString.SEARCH:
          case VSCCommandString.LIVEHD:
          case VSCCommandString.SEARCHHD:
            self.onReceiveHLSStream(info);
            break;
          case VSCCommandString.TIMELINE:
            self.buildTimelineData(info);
            break;
          case VSCCommandString.DAYLIST:
            self.buildDaylistData(info);
            break;
          case VSCCommandString.TIMEZONE:
            if (typeof info == 'object' && info.Bias && info.StandardName)
              self.buildTimezoneData(info);
            break;
          case VSCCommandString.STOP:
            break;
          default:
        }
      },
      onReceiveHLSStream: flow(function* onReceiveHLSStream(info) {
        if (info.hls_stream) {
          const target = self.hlsStreams.find(s => s.sid == info.sid);
          const result = yield target.getHLSStreamUrl(info, self.isLive);
          target.setStreamStatus({
            isLoading: false,
            connectionStatus: result ? STREAM_STATUS.DONE : STREAM_STATUS.ERROR,
          });
        }
        streamReadyCallback && streamReadyCallback();
      }),
      buildDaylistData(data) {
        if (
          data &&
          data[0] &&
          Array.isArray(data[0].ti) &&
          data[0].ti.length > 0
        ) {
          let recordingDates = data[0].ti.map(params => {
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
      },
      timeDataConverter(value) {
        // __DEV__ && console.log('GOND convert time: ', value);
        if (typeof value !== 'object' || Object.keys(value) == 0) {
          __DEV__ && console.log('GOND convert time value not valid: ', value);
          return null;
        }
        const timezoneName = self.timezone ?? 'local';
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
      // fillRange = (start, end) => {
      //   return Array(end - start + 1)
      //     .fill()
      //     .map((item, index) => start + index);
      // },
      generateFullTimeline(timestamp) {
        let result = [];
        for (let i = 0; i < timestamp.length; i++) {
          result = result.concat(
            // this.fillRange(timestamp[i].begin, timestamp[i].end)
            Array(timestamp[i].end - timestamp[i].begin + 1)
              .fill()
              .map((item, index) => timestamp[i].begin + index)
          );
        }
        return result;
      },
      buildTimelineData(jTimeStamp) {
        let jtimeData = jTimeStamp[0].di[self.selectedStream.channelNo];
        let timeInterval = [];

        try {
          timeInterval = jtimeData.ti.map(self.timeDataConverter);
          if (!timeInterval || timeInterval.length == 0 || noVideo) {
            __DEV__ &&
              console.log(
                '-- GOND timeInterval is empty, jtimeData =',
                jtimeData
              );
            // this.pause();
            self.selectedStream.setStreamStatus({
              error: 'No video',
            });
            return;
          }

          __DEV__ && console.log('-- GOND searchDate', self.searchDate);

          timeInterval.sort((a, b) => a.begin - b.begin);
          __DEV__ && console.log('-- GOND timeInterval', timeInterval);
          self.setTimeline(self.generateFullTimeline(timeInterval));
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
      },
      // #endregion HLS streaming
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
          singleChannelNo: channelNo ?? null,
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
          streamReadyCallback && streamReadyCallback();
          return true;
        } catch (ex) {
          console.log('GOND getRTCInfo failed: ', ex);
        }
      }),
      getVideoInfos: flow(function* getVideoInfos(channelNo) {
        console.log('GOND getVideoInfos');
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
                self.rtcConnection.singleChannelNo
                  ? self.selectedChannelData
                  : self.activeChannels
              );
              self.isLoading = false;
              streamReadyCallback && streamReadyCallback();
              break;
            }
        }
      }),
      onAlarmPlay: flow(function* onAlarmPlay(isLive, alarmData) {
        __DEV__ && console.log('GOND onAlarmPlay: ', alarmData);
        self.kDVR = alarmData.kDVR;
        self.isLive = isLive;
        self.isSingleMode = true;
        !isLive && (self.searchPlayTime = alarmData.timezone);
        self.searchDate = DateTime.fromISO(alarmData.timezone, {
          zone: 'utc',
        }).startOf('day');
        __DEV__ &&
          console.log(
            'GOND onAlarmPlay time input: ',
            alarmData.timezone,
            '\n searchDate: ',
            self.searchDate
          );

        yield self.getVideoInfos(alarmData.channelNo);
        self.selectedChannel = alarmData.channelNo;
        if (self.selectedChannelData == null) {
          __DEV__ &&
            console.log(
              'GOND onAlarmPlay channels has been removed or not existed!'
            );
          self.error = 'Channel is not existed or has been removed!';
          return;
        } else {
          // dongpt: only Direct need to be build?
          self.buildVideoData(alarmData.channelNo);
          streamReadyCallback && streamReadyCallback();
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
};

const videoStore = VideoModel.create(storeDefault);

export default videoStore;
