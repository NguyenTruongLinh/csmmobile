import {flow, types, getSnapshot, applySnapshot} from 'mobx-state-tree';

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
import {VSC} from '../../consts/apiRoutes';

import util from '../util/general';
import {
  DEFAULT_REGION,
  HLS_MAX_EXPIRE_TIME,
  STREAM_TIMEOUT,
  HLS_DATA_REQUEST_TIMEOUT,
  HLS_GET_DATA_DIRECTLY_TIMEOUT,
  HLS_MAX_RETRY,
  VSCCommandString,
} from '../../consts/video';
import {STREAM_STATUS} from '../../localization/texts';

const MAX_RETRY = 3;
const KEEP_ALIVE_TIMEOUT = 60000;

const HLSURLModel = types
  .model({
    url: types.maybeNull(types.string),
    sid: types.optional(types.string, () => util.getRandomId()),
    isFailed: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    getUrlRetries: 0,
    checkStreamTimeout: null,
  }))
  .actions(self => ({
    set({url, sid, streamTimeout, failed}) {
      url != undefined && (self.url = url);
      sid != undefined && (self.sid = sid);
      streamTimeout != undefined && (self.checkStreamTimeout = streamTimeout);
      failed != undefined && (self.isFailed = failed);
    },
    reset() {
      self.url = null;
      self.sid = util.getRandomId();
      self.getUrlRetries = 0;
      self.clearStreamTimeout();
      self.isFailed = false;
    },
    increaseRetry() {
      if (self.getUrlRetries >= HLS_MAX_RETRY) return false;
      self.getUrlRetries++;
      return true;
    },
    resetRetries() {
      self.getUrlRetries = 0;
    },
    clearStreamTimeout() {
      if (self.checkStreamTimeout) {
        clearTimeout(self.checkStreamTimeout);
        self.checkStreamTimeout = null;
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
    isLoading: types.optional(types.boolean, false),
    connectionStatus: types.optional(types.string, ''),
    error: types.maybeNull(types.string),
    needReset: types.optional(types.boolean, false),
    retryRemaining: types.optional(types.number, MAX_RETRY),

    // sync values from videoStore
    isLive: types.optional(types.boolean, false),
    isHD: types.optional(types.boolean, false),
    isDead: types.optional(types.boolean, false),
    // isWaitingReconnect: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    onStreamError: () =>
      console.log('GOND HLS onStreamError is not defined yet!'),
    // timeline: null,
    // timestamps: null,
    keepAliveInterval: null,
  }))
  .views(self => ({
    get channelNo() {
      return self.channel ? self.channel.channelNo : null;
    },
    get channelName() {
      return self.channel ? self.channel.name : '';
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
    },
    setLive(isLive) {
      self.isLive = isLive;
    },
    setHD(isHD) {
      self.isHD = isHD;
    },
    setChannel(value) {
      self.channel = value;
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
      return self.urlsList.find(item => item.sid == sid);
    },
    setUrls(object) {
      if (typeof object != 'object' && Object.keys(object).length == 0) return;
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
      self.streamName = data.hls_stream ?? data.StreamName;
      self.accessKey = data.access_key ?? data.AcccessKey;
      self.secretKey = data.secret_key ?? data.SecrectKey;
      // self.sessionToken = data.session_token ?? null;
    },
    setStreamStatus({connectionStatus, error, isLoading, needReset}) {
      if (__DEV__) {
        console.log('GOND HLS: Set stream status: ', {
          connectionStatus,
          error,
          isLoading,
          needReset,
        });
        // console.trace();
      }

      connectionStatus != undefined &&
        (self.connectionStatus = connectionStatus);
      isLoading != undefined && (self.isLoading = isLoading);
      needReset != undefined && (self.needReset = needReset);
      error != undefined && (self.error = error);
    },
    // setReconnectStatus(value) {
    //   self.isWaitingReconnect = value;
    // },
    // setTimelines(timeline, timestamp) {
    //   self.timeline = timeline;
    //   self.timestamps = timestamp;
    // },
    startWaitingForStream(sid) {
      const currentUrl = self.getUrlById(sid);
      if (!currentUrl) return;
      currentUrl.resetRetries();
      currentUrl.set({
        streamTimeout: setTimeout(
          () => self.getStreamDirectly(sid),
          HLS_DATA_REQUEST_TIMEOUT
        ),
      });
    },
    getStreamDirectly: flow(function* (sid) {
      const currentUrl = self.getUrlById(sid);
      if (!currentUrl) return;

      const res = yield apiService.get(VSC.controller, sid);
      __DEV__ && console.log(`GOND HLS getStreamDirectly: `, res);
      if (res && res.StreamName) {
        self.startConnection({...res, sid});
      } else {
        currentUrl.set({
          streamTimeout: setTimeout(() => {
            if (currentUrl.increaseRetry()) self.getStreamDirectly(sid);
            else {
              currentUrl.set({failed: true});
            }
          }, HLS_GET_DATA_DIRECTLY_TIMEOUT),
        });
      }
    }),
    startConnection: flow(function* (info, cmd) {
      self.retryRemaining = MAX_RETRY;
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
        return;
      }
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
        const response = yield kinesisVideoArchivedContent.getHLSStreamingSessionURL(
          {
            StreamName: self.streamName,
            PlaybackMode: HLSPlaybackMode.LIVE,
            HLSFragmentSelector: {
              FragmentSelectorType: FragmentSelectorType.PRODUCER_TIMESTAMP,
            },
            ContainerFormat: ContainerFormat.FRAGMENTED_MP4,
            DiscontinuityMode: HLSDiscontinuityMode.ON_DISCONTINUITY, // temp removed
            MaxMediaPlaylistFragmentResults: 1000,
            Expires: HLS_MAX_EXPIRE_TIME,
          }
        );

        __DEV__ &&
          console.log(
            'GOND Get Streaming Session URL successfully: ',
            response
          );
        // self.setUrl(response.HLSStreamingSessionURL, cmd);
        currentUrl.set({url: response.HLSStreamingSessionURL});

        self.retryRemaining = MAX_RETRY;
        // Is it needed?
        // self.clearStreamTimeout();
        __DEV__ &&
          console.log('GOND Get Streaming Session URL done: ', self.targetUrl);
      } catch (err) {
        __DEV__ &&
          console.log('GOND HLS Get Streaming Session URL failed: ', err);
        self.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.RECONNECTING,
          error: err.message,
        });
        // self.setReconnectStatus(false);
        // setTimeout(() => self.reconnect(), 200);
        // return false;
        if (!self.isDead) return self.reconnect(info);
      }

      self.setStreamStatus({
        isLoading: false,
        connectionStatus: STREAM_STATUS.CONNECTED,
        error: '',
      });
      return true;
    }),
    reconnect(info) {
      if (
        self.isDead ||
        // self.isWaitingReconnect ||
        self.connectionStatus == STREAM_STATUS.TIMEOUT ||
        self.connectionStatus == STREAM_STATUS.NOVIDEO
      ) {
        __DEV__ &&
          console.log(
            'GOND HLS::Not Reconnect: ',
            self.isDead,
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
        self.reInitStream();
        return false;
      }
    },
    reInitStream() {
      __DEV__ && console.log(`GOND reinit HLS stream: `, self.channelName);
      if (self.retryRemaining > 0) {
        self.targetUrl.reset();
        self.onStreamError(self.channelNo, self.isLive);
        self.retryRemaining--;
        self.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTING,
          isLoading: true,
        });
      } else {
        self.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTION_ERROR,
          isLoading: false,
        });
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
    //       self.reInitStream();
    //     }
    //   }, time ?? STREAM_TIMEOUT);
    // },
    // clearStreamTimeout() {
    //   self.streamTimeout && clearTimeout(self.streamTimeout);
    // },
    release() {
      self.isDead = true;
      // self.clearStreamTimeout();
      self.updateStreamsStatus(false);
    },
  }));
