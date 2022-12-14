import {
  flow,
  types,
  getSnapshot,
  applySnapshot,
  isAlive,
} from 'mobx-state-tree';

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import {KinesisVideo, APIName} from '@aws-sdk/client-kinesis-video';
import {
  FragmentSelectorType,
  HLSDiscontinuityMode,
  ContainerFormat,
  HLSPlaybackMode,
  KinesisVideoArchivedMedia,
} from '@aws-sdk/client-kinesis-video-archived-media';
import ChannelModel from './channel';

import apiService from '../../services/api';
import {SetDataUsageActivityLogs, VSC} from '../../consts/apiRoutes';

import util from '../../util/general';
import snackbarUtil from '../../util/snackbar';
import {
  DEFAULT_REGION,
  HLS_MAX_EXPIRE_TIME,
  STREAM_TIMEOUT,
  HLS_DATA_REQUEST_TIMEOUT,
  HLS_GET_DATA_DIRECTLY_TIMEOUT,
  HLS_MAX_RETRY,
  VSCCommandString,
  CLOUD_TYPE,
} from '../../consts/video';
import {STREAM_STATUS, COMMON} from '../../localization/texts';
import CMSColors from '../../styles/cmscolors';
import {DateTime} from 'luxon';
import {DateFormat, NVRPlayerConfig} from '../../consts/misc';
import {Platform} from 'react-native';

// export const V3_1_BITRATE_USAGE = true;
const MAX_RETRY = 7;
const KEEP_ALIVE_TIMEOUT = 60000;
const REST_TIME = 2000;
export const FORCE_SENT_DATA_USAGE = -999;
export const DATA_USAGE_SENDING_INTERVAL = 15;
const HLSURLModel = types
  .model({
    url: types.maybeNull(types.string),
    sid: types.optional(types.string, () => util.getRandomId()),
    isFailed: types.optional(types.boolean, false),

    isLoading: types.optional(types.boolean, false),
    connectionStatus: types.optional(types.string, ''),
    error: types.maybeNull(types.string),
    needReset: types.optional(types.boolean, false),
    isReady: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    getUrlRetries: 0,
    checkStreamTimeout: null,
    accumulatedDataUsage: 0,
    dataUsageSentTimePoint: DateTime.now().toSeconds(),
    videoInfo: {},
    // dataUsageLogs: [],
    // recordNo: 0,
  }))
  .actions(self => ({
    beforeDestroy() {
      self.clearStreamTimeout();
    },
    set({url, sid, streamTimeout, failed, ready}) {
      url != undefined && (self.url = url);
      sid != undefined && (self.sid = sid);
      streamTimeout != undefined && (self.checkStreamTimeout = streamTimeout);
      failed != undefined && (self.isFailed = failed);
      ready != undefined && (self.isReady = ready);
    },
    reset() {
      self.url = null;
      self.sid = util.getRandomId();
      if (__DEV__) {
        console.log('GOND reset: ---');
        // console.trace();
      }
      self.getUrlRetries = 0;
      self.clearStreamTimeout();
      self.isFailed = false;
    },
    increaseRetry() {
      if (self.getUrlRetries >= HLS_MAX_RETRY) return false;
      self.getUrlRetries++;
      // console.log('GOND increaseRetry ', self.getUrlRetries);
      return true;
    },
    resetRetries() {
      if (__DEV__) {
        // console.trace('GOND reset GetUrlDirectly retries: ---');
        // console.trace();
      }
      self.getUrlRetries = 0;
    },
    clearStreamTimeout() {
      if (self.checkStreamTimeout) {
        clearTimeout(self.checkStreamTimeout);
        self.checkStreamTimeout = null;
      }
    },
    setStreamStatus({connectionStatus, error, isLoading, needReset}) {
      // if (__DEV__ && connectionStatus == STREAM_STATUS.NOVIDEO)
      //   console.trace('GOND hls setStatus: ', isLoading, connectionStatus);
      connectionStatus != undefined &&
        (self.connectionStatus = connectionStatus);
      isLoading != undefined && (self.isLoading = isLoading);
      needReset != undefined && (self.needReset = needReset);
      error != undefined && (self.error = error);
    },
    resetDataUsageInfo() {
      self.accumulatedDataUsage = 0;
      self.dataUsageSentTimePoint = DateTime.now().toSeconds();
      // self.dataUsageLogs = [];
      // self.recordNo = 0;
    },
    updateDataUsageByURL(segmentLoad, timezone, videoInfo, debug) {
      // __DEV__ &&
      //   console.log(
      //     `updateDataUsage segmentLoad = `,
      //     segmentLoad,
      //     ' videoInfo = ',
      //     videoInfo
      //   );
      if (segmentLoad !== FORCE_SENT_DATA_USAGE)
        self.videoInfo = {...videoInfo};
      let params =
        segmentLoad != FORCE_SENT_DATA_USAGE
          ? {...videoInfo}
          : {...self.videoInfo};
      let newLoadRecordTimePoint = DateTime.now().toSeconds();

      if (segmentLoad !== FORCE_SENT_DATA_USAGE)
        self.accumulatedDataUsage += segmentLoad;

      // self.dataUsageLogs.push({
      //   time:
      //     DateTime.fromSeconds(newLoadRecordTimePoint, {}).toFormat(
      //       DateFormat.VideoDataUsageDate
      //     ) +
      //     ':' +
      //     (DateTime.now().toMillis() % 1000),
      //   load: segmentLoad,
      // });

      // __DEV__ &&
      //   console.log(
      //     `updateDataUsage self.accumulatedDataUsage = `,
      //     self.accumulatedDataUsage,
      //     ' debug = ',
      //     debug
      //   );
      if (
        (segmentLoad == FORCE_SENT_DATA_USAGE ||
          newLoadRecordTimePoint - self.dataUsageSentTimePoint >=
            DATA_USAGE_SENDING_INTERVAL) &&
        self.accumulatedDataUsage > 0
      ) {
        params.StartTime = DateTime.fromSeconds(
          self.dataUsageSentTimePoint,
          {}
        ).toFormat(DateFormat.VideoDataUsageDate);
        params.EndTime = DateTime.fromSeconds(
          newLoadRecordTimePoint,
          {}
        ).toFormat(DateFormat.VideoDataUsageDate);
        params.BytesUsed = self.accumulatedDataUsage;
        apiService.post(
          VSC.controller,
          1,
          VSC.SetDataUsageActivityLogs,
          params
        );
        // __DEV__ &&
        //   console.log(
        //     `0507 updateDataUsage callAPI params `,
        //     JSON.stringify(params),
        //     segmentLoad == FORCE_SENT_DATA_USAGE
        //       ? 'STREAM STOPPED'
        //       : 'AFTER 15 SECS',
        //     ' ************************************** ',
        //     'debug: ',
        //     debug
        //   );
        // for (let i = 0; i < self.dataUsageLogs.length; i++) {
        //   __DEV__ &&
        //     console.log(
        //       `0507 updateDataUsage callAPI params dataUsageLogs = `,
        //       self.dataUsageLogs[i]
        //     );
        // }
        self.resetDataUsageInfo();
      }
    },
  }));

// const HLSURLModel = types
//   .model({
//     live: types.maybeNull(URLIDPairModel),
//     liveHD: types.maybeNull(URLIDPairModel),
//     search: types.maybeNull(URLIDPairModel),
//     searchHD: types.maybeNull(URLIDPairModel),
//   })
//   .views(self => ({
//     isAcquired(isLive, isHD) {
//       const target = isLive
//         ? isHD
//           ? self.liveHD
//           : self.live
//         : isHD
//         ? self.searchHD
//         : self.search;
//       return target && target.url && target.url.length >= 0 && target.url.startsWith('http');
//     },
//   }))
//   .actions(self => ({
//     set({live, liveHD, search, searchHD}) {
//       __DEV__ &&
//         console.log('GOND HLSURLModel.set: ', {live, liveHD, search, searchHD});
//       live != undefined && (self.live = live);
//       liveHD != undefined && (self.liveHD = liveHD);
//       search != undefined && (self.search = search);
//       searchHD != undefined && (self.searchHD = searchHD);
//     },
//   }));

export default HLSStreamModel = types
  .model({
    id: types.optional(types.identifier, () => util.getRandomId()),
    // streamUrl: types.optional(HLSURLModel, () => HLSURLModel.create()),
    liveUrl: types.optional(HLSURLModel, () => HLSURLModel.create()),
    liveHDUrl: types.optional(HLSURLModel, () => HLSURLModel.create()),
    searchUrl: types.optional(HLSURLModel, () => HLSURLModel.create()),
    searchHDUrl: types.optional(HLSURLModel, () => HLSURLModel.create()),

    channel: types.reference(ChannelModel),
    accessKey: types.optional(types.string, ''),
    secretKey: types.optional(types.string, ''),
    streamName: types.optional(types.string, ''),
    // sessionToken: types.maybeNull(types.string),
    // isLoading: types.optional(types.boolean, false),
    // connectionStatus: types.optional(types.string, ''),
    // error: types.maybeNull(types.string),
    // needReset: types.optional(types.boolean, false),
    retryRemaining: types.optional(types.number, MAX_RETRY),
    reInitRemaining: types.optional(types.number, MAX_RETRY),

    // sync values from videoStore
    isLive: types.optional(types.boolean, false),
    isHD: types.optional(types.boolean, false),
    isSelected: types.optional(types.boolean, false),
    noVideo: types.optional(types.boolean, false),
    // isWaitingReconnect: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    onStreamError: () =>
      console.log('GOND HLS onStreamError is not defined yet!'),
    // timeline: null,
    // timestamps: null,
    keepAliveInterval: null,
    reInitTimeout: null,
    reconnectTimeout: null,
    noIncomingVideoCount: 0,
  }))
  .views(self => ({
    get channelNo() {
      return self.channel ? self.channel.channelNo : null;
    },
    get channelName() {
      return self.channel ? self.channel.name : '';
    },
    get kChannel() {
      return self.channel ? self.channel.kChannel : -1;
    },
    get isActive() {
      return self.channel ? self.channel.isActive : false;
    },
    get streamStatus() {
      const {isLoading, connectionStatus, error} = self;
      return {
        isLoading,
        connectionStatus,
        error,
      };
    },
    // get streamUrl() {
    //   return {
    //     live: self.liveUrl,
    //     liveHD: self.liveHDUrl,
    //     search: self.searchUrl,
    //     searchHD: self.searchHDUrl,
    //   };
    // },
    get isURLAcquired() {
      const target = self.isLive
        ? self.isHD
          ? self.liveHDUrl
          : self.liveUrl
        : self.isHD
        ? self.searchHDUrl
        : self.searchUrl;
      return target && util.isValidHttpUrl(target.url);
    },
    get targetUrl() {
      return self.isLive
        ? self.isHD
          ? self.liveHDUrl
          : self.liveUrl
        : self.isHD
        ? self.searchHDUrl
        : self.searchUrl;
    },
    get streamUrl() {
      return self.isLive
        ? self.isHD
          ? self.liveHDUrl.url
          : self.liveUrl.url
        : self.isHD
        ? self.searchHDUrl.url
        : self.searchUrl.url;
    },
    get urlsList() {
      return [self.liveUrl, self.liveHDUrl, self.searchUrl, self.searchHDUrl];
    },
    get isLoading() {
      return self.targetUrl.isLoading;
    },
    get connectionStatus() {
      return self.targetUrl.connectionStatus;
    },
    get error() {
      return self.targetUrl.error;
    },
    get needReset() {
      return self.targetUrl.needReset;
    },
    // dongpt: ready to enable feature buttons
    get isMenuReady() {
      return true;
    },
    get isReady() {
      return self.targetUrl.isReady;
    },
    get isWaitingForStream() {
      return (
        self.targetUrl.checkStreamTimeout != null && self.targetUrl.isLoading
      );
    },
    get snapshot() {
      return self.channel ? self.channel.snapshot : null;
    },
    get canLive() {
      return self.channel ? self.channel.canLive : false;
    },
    get canSearch() {
      return self.channel ? self.channel.canSearch : false;
    },
  }))
  .actions(self => ({
    afterCreate() {
      self.keepAliveInterval = setInterval(
        () => self.updateStreamsStatus(true),
        KEEP_ALIVE_TIMEOUT
      );
    },
    beforeDestroy() {
      // __DEV__ && console.log('GOND HLS: beforeDestroy ', self.channelName);
      if (self.keepAliveInterval) {
        // __DEV__ && console.log('GOND HLS: beforeDestroy ... stop interval');
        clearInterval(self.keepAliveInterval);
        self.keepAliveInterval = null;
      }
      self.clearStreamInitTimeout();
      self.clearStreamReconnectTimeout();
    },
    setNoVideo(value) {
      if (__DEV__ && value == true) {
        console.trace('GOND ======= Set HLS Novideo = ', value);
      }
      self.noVideo = value;
      self.noIncomingVideoCount = 0;
      self.setStreamStatus({
        connectionStatus: STREAM_STATUS.NOVIDEO,
        isLoading: false,
      });
    },
    resetRetries() {
      self.clearStreamReconnectTimeout();
      self.clearStreamInitTimeout();
      self.retryRemaining = MAX_RETRY;
      self.reInitRemaining = MAX_RETRY;
    },
    clearStreamInitTimeout() {
      if (self.reInitTimeout) {
        clearTimeout(self.reInitTimeout);
        self.reInitTimeout = null;
      }
    },
    clearStreamReconnectTimeout() {
      if (self.reconnectTimeout) {
        clearTimeout(self.reconnectTimeout);
        self.reconnectTimeout = null;
      }
    },
    setLive(isLive) {
      if (self.isLive != isLive) {
        // self.targetUrl.updateDataUsageByURL(
        //   FORCE_SENT_DATA_USAGE,
        //   'switch live-search'
        // );
        self.isLive = isLive;
        self.noIncomingVideoCount = 0;
      }
    },
    setHD(isHD) {
      if (self.isHD != isHD) {
        // self.targetUrl.updateDataUsageByURL(
        //   FORCE_SENT_DATA_USAGE,
        //   'switch HD-nonHD'
        // );
        self.isHD = isHD;
        self.noIncomingVideoCount = 0;
      }
    },
    select(isSelected) {
      self.isSelected = isSelected;
    },
    setChannel(value) {
      self.channel = value;
      self.noIncomingVideoCount = 0;
    },
    setOnErrorCallback(fn) {
      if (!fn || typeof fn != 'function') return;
      self.onStreamError = fn;
    },
    setUrl(url, mode) {
      // const {live, liveHD, search, searchHD} = value;
      __DEV__ &&
        console.log(
          `GOND setUrl: ${url}, live: ${self.isLive}, hd: ${self.isHD}`
        );
      if (!isAlive(self)) return;
      // const tartget = self.getTargetUrl(isLive, isHD);
      switch (mode) {
        case undefined:
          self.targetUrl.set({url});
          break;
        case VSCCommandString.LIVE:
          self.liveUrl.set({url});
          break;
        case VSCCommandString.LIVEHD:
          self.liveHDUrl.set({url});
          break;
        case VSCCommandString.SEARCH:
          self.searchUrl.set({url});
          break;
        case VSCCommandString.SEARCHHD:
          self.searchHDUrl.set({url});
          break;
      }
      // self.streamUrl.set(
      //   isLive
      //     ? isHD
      //       ? {liveHD: url}
      //       : {live: url}
      //     : isHD
      //     ? {searchHD: url}
      //     : {search: url}
      // );
      // self.streamUrl = value;
    },
    getUrl(mode) {
      if (!isAlive(self)) return;
      switch (mode) {
        case undefined:
          return self.targetUrl;
        case VSCCommandString.LIVE:
          return self.liveUrl;
        case VSCCommandString.LIVEHD:
          return self.liveHDUrl;
        case VSCCommandString.SEARCH:
          return self.searchUrl;
        case VSCCommandString.SEARCHHD:
          return self.searchHDUrl;
      }
    },
    getUrlById(sid) {
      return !isAlive(self)
        ? null
        : self.urlsList.find(item => item.sid == sid);
    },
    setUrls(object) {
      if (
        !isAlive(self) ||
        (typeof object != 'object' && Object.keys(object).length == 0)
      )
        return;
      const {live, liveHD, search, searchHD} = object;
      // self.streamUrl.set(object);
      // self.streamUrl = {...getSnapshot(self.streamUrl), ...object};

      live != undefined && self.liveUrl.set({url: live});
      liveHD != undefined && self.liveHDUrl.set({url: liveHD});
      search != undefined && self.search.set({url: search});
      searchHD != undefined && self.searchHD.set({url: searchHD});
    },
    resetUrls(live, search) {
      if (live) {
        self.liveUrl.reset();
        self.liveHDUrl.reset();
      }
      if (search) {
        self.searchUrl.reset();
        self.searchHDUrl.reset();
      }
    },
    setAWSInfo(data) {
      self.streamName = data.hls_stream ?? data.StreamName ?? '';
      self.accessKey = data.access_key ?? data.AcccessKey ?? '';
      self.secretKey = data.secret_key ?? data.SecrectKey ?? '';
      // self.sessionToken = data.session_token ?? null;
    },
    setLiveStatus(statusObject) {
      if (!isAlive(self)) return;
      self.liveUrl.setStreamStatus(statusObject);
    },
    // setStreamStatus({connectionStatus, error, isLoading, needReset}) {
    setStreamStatus(statusObject) {
      if (!isAlive(self)) return;
      // __DEV__ && console.trace('GOND HLS: Set stream status: ', statusObject);

      self.targetUrl.setStreamStatus(statusObject);
      // connectionStatus != undefined &&
      //   (self.connectionStatus = connectionStatus);
      // isLoading != undefined && (self.isLoading = isLoading);
      // needReset != undefined && (self.needReset = needReset);
      // error != undefined && (self.error = error);
    },
    setStreamReady(isReady) {
      if (__DEV__) {
        console.log('GOND HLS: Set stream ready: ', isReady);
        // console.trace();
      }
      isAlive(self) && self.targetUrl.set({ready: isReady});
      if (__DEV__) {
        // console.log('GOND --- set HLS Ready --- ', isReady);
        // console.trace();
      }
    },
    // setReconnectStatus(value) {
    //   self.isWaitingReconnect = value;
    // },
    // setTimelines(timeline, timestamp) {
    //   self.timeline = timeline;
    //   self.timestamps = timestamp;
    // },
    stopWaitingForStream(sid) {
      const currentUrl = sid ? self.getUrlById(sid) : self.targetUrl;
      if (!currentUrl || !isAlive(self)) return;
      currentUrl.clearStreamTimeout();
    },
    stopWaitingCauseNoVideo(sid) {
      self.stopWaitingForStream(sid);
      self.noIncomingVideoCount = 0;
      self.setStreamStatus({
        connectionStatus: STREAM_STATUS.NOVIDEO,
        isLoading: false,
      });
    },
    startWaitingForStream(sid) {
      const currentUrl = self.getUrlById(sid);
      if (!currentUrl || !isAlive(self)) return;
      currentUrl.clearStreamTimeout();
      currentUrl.resetRetries();
      currentUrl.set({
        streamTimeout: setTimeout(() => {
          if (isAlive(currentUrl)) {
            currentUrl.clearStreamTimeout();
            if (self.isLive || !self.noVideo) self.getStreamDirectly(sid);
          }
        }, HLS_DATA_REQUEST_TIMEOUT),
      });
    },
    getStreamDirectly: flow(function* (sid) {
      if (!isAlive(self)) return;
      const currentUrl = self.getUrlById(sid);
      if (!currentUrl) return;

      const res = yield apiService.get(VSC.controller, sid);
      __DEV__ &&
        console.log(
          `GOND HLS getStreamDirectly: `,
          currentUrl.getUrlRetries,
          res
        );
      if (!isAlive(self)) return;
      if (res && (res.StreamName || res.AcccessKey)) {
        self.startConnection({...res, sid});
      } else {
        currentUrl.set({
          streamTimeout: setTimeout(() => {
            if (currentUrl.increaseRetry()) self.getStreamDirectly(sid);
            else {
              __DEV__ && console.log(`GOND !!! HLShandleError 2`);
              self.handleError();
            }
          }, HLS_GET_DATA_DIRECTLY_TIMEOUT),
        });
      }
    }),
    startConnection: flow(function* (info, cmd) {
      if (!isAlive(self)) return;
      self.retryRemaining = MAX_RETRY;
      self.clearStreamReconnectTimeout();
      self.clearStreamInitTimeout();
      return self.getHLSStreamUrl(info, cmd);
    }),
    getHLSStreamUrl: flow(function* (info, cmd) {
      const currentUrl = self.getUrlById(info.sid);
      if (!currentUrl) {
        __DEV__ &&
          console.log(
            'GOND getHLSStreamUrl currentURL not found: ',
            info,
            self.urlsList
          );
        console.trace();
        // self.setStreamStatus({
        //   connectionStatus: STREAM_STATUS.CONNECTION_ERROR,
        //   isLoading: false,
        // });
        return false;
      }
      self.stopWaitingForStream(info.sid);
      if (
        util.isValidHttpUrl(currentUrl.url) &&
        (info.StreamName == self.streamName ||
          info.hls_stream == self.streamName)
      ) {
        __DEV__ && console.log('GOND getHLSStreamUrl URL already acquired');
        return true;
      }
      if (!info.StreamName && !info.hls_stream) {
        currentUrl.clearStreamTimeout();
        currentUrl.set({
          streamTimeout: setTimeout(() => {
            if (!isAlive(currentUrl) || currentUrl.sid != info.sid) return;
            if (currentUrl.increaseRetry()) self.getStreamDirectly(info.sid);
            else {
              // self.handleHLSError();
              self.giveUp();
            }
          }, HLS_GET_DATA_DIRECTLY_TIMEOUT),
        });

        return;
      }
      console.log('GOND == PROFILING == Got stream name: ', new Date());
      currentUrl.resetRetries();
      currentUrl.clearStreamTimeout();

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

      /*
      __DEV__ && console.log('GOND HLS: Get stream ARN ... ');
      let streamARN = '';
      try {
        const response = yield kinesisVideo.describeStream({
          StreamName: self.streamName,
        });

        __DEV__ && console.log('GOND Get stream ARN: ', response);
        streamARN = response.StreamInfo.StreamARN;
        // new Endpoint(
        //   response.DataEndpoint
        // );
      } catch (err) {
        __DEV__ && console.log('GOND HLS Get stream ARN failed: ', err);
        return false;
      }
      */

      // Step 2: Get a data endpoint for the stream
      __DEV__ && console.log('GOND HLS: Fetching data endpoint ... ');
      try {
        const response = yield kinesisVideo.getDataEndpoint({
          StreamName: self.streamName,
          // StreamARN: streamARN,
          APIName: APIName.GET_HLS_STREAMING_SESSION_URL,
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
            PlaybackMode: HLSPlaybackMode.LIVE,
            HLSFragmentSelector: {
              FragmentSelectorType: self.isLive
                ? FragmentSelectorType.PRODUCER_TIMESTAMP
                : FragmentSelectorType.SERVER_TIMESTAMP,
            },
            // DiscontinuityMode: self.isLive
            //   ? HLSDiscontinuityMode.ON_DISCONTINUITY
            //   : HLSDiscontinuityMode.ALWAYS,
            // HLSFragmentSelector: {
            //   FragmentSelectorType: FragmentSelectorType.PRODUCER_TIMESTAMP,
            // },
            DiscontinuityMode: HLSDiscontinuityMode.ALWAYS,
            ContainerFormat: ContainerFormat.FRAGMENTED_MP4,
            MaxMediaPlaylistFragmentResults: self.isLive ? 1000 : 15,
            Expires: HLS_MAX_EXPIRE_TIME,
          });

        __DEV__ &&
          console.log(
            'GOND Get Streaming Session URL successfully: ',
            response
          );
        // self.setUrl(response.HLSStreamingSessionURL, cmd);
        if (!isAlive(self) || !isAlive(currentUrl)) return;
        currentUrl.set({url: response.HLSStreamingSessionURL});
        console.log('GOND == PROFILING == Got stream URL: ', new Date());

        self.retryRemaining = MAX_RETRY;
        self.reInitRemaining = MAX_RETRY;
        // Is it needed?
        // self.clearStreamTimeout();
        __DEV__ &&
          console.log('GOND Get Streaming Session URL done: ', self.targetUrl);
      } catch (err) {
        __DEV__ &&
          console.log('GOND HLS Get Streaming Session URL failed: ', err);
        if (err.toString().includes('ResourceNotFoundException')) {
          self.retryRemaining++;
        }
        self.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.RECONNECTING,
          error: err.message,
        });
        // self.setReconnectStatus(false);
        // setTimeout(() => self.reconnect(), 200);
        // return false;
        self.reconnectTimeout = setTimeout(() => {
          if (isAlive(self)) {
            self.reconnect(info);
            self.clearStreamReconnectTimeout();
          }
        }, REST_TIME);
      }

      if (!self.isLive && self.connectionStatus == STREAM_STATUS.NOVIDEO) {
        self.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.CONNECTED,
          error: '',
        });
      }
      return true;
    }),
    reconnect(info) {
      if (
        !isAlive(self) ||
        // self.isWaitingReconnect ||
        self.connectionStatus == STREAM_STATUS.TIMEOUT ||
        self.connectionStatus == STREAM_STATUS.NOVIDEO
      ) {
        __DEV__ &&
          console.log(
            'GOND HLS::Not Reconnect: ',
            // self.isDead,
            // self.isWaitingReconnect,
            self.connectionStatus
          );
        return false;
      }

      if (
        info &&
        ((info.hls_stream && info.hls_stream != self.streamName) ||
          (info.access_key && info.access_key != self.accessKey) ||
          (info.secret_key && info.secret_key != self.secretKey))
      ) {
        __DEV__ &&
          console.log(
            'GOND HLS:: AWS connection changed, not reconnect: ',
            info,
            self.streamName,
            self.accessKey
          );
        return true;
      }
      // wait time before another reconnect:
      if (__DEV__) {
        console.log('GOND HLS::Reconnect ---------');
        // console.trace();
      }
      // self.setReconnectStatus(true);
      // setTimeout(() => {
      //   self.setReconnectStatus(false);
      //   if (
      //     self.connectionStatus == STREAM_STATUS.ERROR ||
      //     self.connectionStatus == STREAM_STATUS.RECONNECTING
      //   ) {
      //     self.reconnect();
      //   }
      // }, 7000);
      // end wait time

      self.setUrl(null);
      self.setStreamStatus({
        isLoading: true,
        connectionStatus: STREAM_STATUS.RECONNECTING,
      });
      // self.scheduleCheckTimeout();
      if (self.retryRemaining > 0) {
        self.retryRemaining--;
        self.getHLSStreamUrl(info);
        return true;
      } else {
        // self.setStreamStatus({
        //   connectionStatus: STREAM_STATUS.CONNECTION_ERROR,
        //   isLoading: false,
        // });
        // self.onStreamError(self.channelNo, self.isLive);
        // __DEV__ && console.log(`GOND !!! HLShandleError 4`);
        self.handleError();
        return false;
      }
    },
    reInitStream(resumeTime) {
      __DEV__ && console.trace(`GOND HLS reInitStream ---`);
      self.targetUrl.reset();
      self.onStreamError(self.channelNo, self.isLive, resumeTime);
      self.reInitRemaining--;
      self.reInitTimeout = null;
      self.setStreamStatus({
        connectionStatus: STREAM_STATUS.CONNECTING,
        isLoading: true,
      });
    },
    giveUp() {
      __DEV__ && console.log(`GOND CONNECTION_ERROR handleError max retry: `);
      // self.setStreamStatus({
      //   connectionStatus: STREAM_STATUS.CONNECTION_ERROR,
      //   isLoading: false,
      // });
      // if (self.isSelected) {
      //   snackbarUtil.onMessage(
      //     STREAM_STATUS.CONNECTION_ERROR,
      //     CMSColors.Danger,
      //     {
      //       text: COMMON.RETRY,
      //       textColor: CMSColors.White,
      //       onPress: () => {
      //         self.resetRetries();
      //         self.handleHLSError();
      //       },
      //     }
      //   );
      // }
      if (self.isSelected) {
        self.setStreamStatus({
          connectionStatus: STREAM_STATUS.RECONNECTING,
          isLoading: true,
        });
        const lastId = self.targetUrl.sid;
        setTimeout(() => {
          if (isAlive(self) && self.targetUrl.sid == lastId) {
            self.resetRetries();
            __DEV__ && console.log(`GOND !!! HLShandleError 1`);
            self.handleError();
          }
        }, HLS_GET_DATA_DIRECTLY_TIMEOUT);
      } else {
        self.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTION_ERROR,
          isLoading: false,
        });
      }
    },
    handleError(info, resumeTime) {
      __DEV__ &&
        console.log(`GOND reinit HLS stream: `, self.channelName, resumeTime);
      if (info && parseInt(info.error_code) == 3) {
        // description == 'No incoming video'
        if (self.noIncomingVideoCount < 5) {
          self.noIncomingVideoCount++;
        } else {
          self.setNoVideo(true);
          self.stopWaitingForStream();
          return;
        }
      }
      self.stopWaitingForStream();
      if (self.reInitRemaining > 0) {
        if (!self.reInitTimeout) {
          self.reInitTimeout = setTimeout(() => {
            if (isAlive(self)) {
              self.reInitStream(resumeTime);
              self.clearStreamInitTimeout();
            }
          }, REST_TIME);
        }
      } else {
        self.giveUp();
      }
    },
    updateStreamsStatus(isKeepAlive) {
      util.isValidHttpUrl(self.liveUrl.url) &&
        self.updateStream(self.liveUrl.sid, !isKeepAlive);
      util.isValidHttpUrl(self.liveHDUrl.url) &&
        self.updateStream(self.liveHDUrl.sid, !isKeepAlive);
      util.isValidHttpUrl(self.searchUrl.url) &&
        self.updateStream(self.searchUrl.sid, !isKeepAlive);
      util.isValidHttpUrl(self.searchHDUrl.url) &&
        self.updateStream(self.searchHDUrl.sid, !isKeepAlive);
    },
    updateStream(sid, isStopped) {
      __DEV__ && console.log(`GOND on updateStream stopped: `, isStopped, sid);
      apiService.post(VSC.controller, sid, VSC.updateStream, isStopped);
    },
    updateDataUsage(bitrate, source, timezone, debug) {
      self.targetUrl.updateDataUsageByURL(
        bitrate,
        timezone,
        {
          KChannel: self.kChannel,
          ViewMode: self.isLive ? 0 : 1,
          Source: 'MP4_CMSMobile_' + source, // + '_NEW_' + Platform.OS,
        },
        debug
      );
    },
    // scheduleCheckTimeout(time) {
    //   self.clearStreamTimeout();
    //   self.streamTimeout = setTimeout(() => {
    //     __DEV__ && console.log(`GOND onstream timeout: `, self.channelName);

    //     if (self.isLoading && !self.isURLAcquired && !self.isDead) {
    //       __DEV__ &&
    //         console.log(
    //           `GOND === it timeout:  ${self.targetUrl.sid}, ch = `,
    //           self.channelName
    //         );
    //       // self.setStreamStatus({
    //       //   connectionStatus: STREAM_STATUS.TIMEOUT,
    //       //   isLoading: false,
    //       // });
    //       self.handleHLSError();
    //     }
    //   }, time ?? STREAM_TIMEOUT);
    // },
    // clearStreamTimeout() {
    //   self.streamTimeout && clearTimeout(self.streamTimeout);
    // },
    onExitSinglePlayer() {
      self.targetUrl.getUrlRetries = 0;
      self.targetUrl.clearStreamTimeout();
      self.targetUrl.isFailed = false;
      self.targetUrl.resetRetries();
      self.resetRetries();

      self.setLive(true);
      self.setHD(false);
      self.select(false);
    },
    release() {
      // self.isDead = true;
      // self.clearStreamTimeout();
      self.updateStreamsStatus(false);
    },
  }));
