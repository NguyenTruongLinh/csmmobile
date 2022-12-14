import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {isAlive} from 'mobx-state-tree';
import Video from 'react-native-video';
import {DateTime} from 'luxon';
import {
  PinchGestureHandler,
  GestureDetector,
  Gesture,
  Directions,
} from 'react-native-gesture-handler';

import CMSImage from '../../components/containers/CMSImage';

import util from '../../util/general';
import snackbar from '../../util/snackbar';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {
  BUFFER_TIMEOUT,
  RECONNECT_TIMEOUT,
  STREAM_TIMEOUT,
} from '../../consts/video';
import {CALENDAR_DATE_FORMAT, NVRPlayerConfig} from '../../consts/misc';

import {
  VIDEO as VIDEO_TXT,
  STREAM_STATUS,
  VIDEO,
} from '../../localization/texts';
import {FORCE_SENT_DATA_USAGE} from '../../stores/types/hls';
import ROUTERS from '../../consts/routes';

// import {V3_1_BITRATE_USAGE} from '../../stores/types/hls';

const Video_State = {STOP: 0, PLAY: 1, PAUSE: 2};
const MAX_RETRY = 5;
const MAX_REINIT = 5;
const MAX_ZOOM = 10;
// const Time_Ruler_Height = normalize(variables.isPhoneX ? 75 : 65);
// const content_padding = normalize(6);

// let isSwitchToLive = false;

class HLSStreamingView extends React.Component {
  static defaultProps = {
    enableSwitchChannel: true,
  };

  constructor(props) {
    super(props);
    const {videoStore, streamData} = props;

    this.state = {
      // message: '',
      // videoLoading: true,
      streamUrl:
        videoStore.isAuthenticated && streamData.streamUrl
          ? streamData.streamUrl
          : '',
      // streamUrl: props.streamUrl.targetUrl
      //   ? props.streamData.targetUrl.url
      //   : null,
      urlParams: '',
      refreshCount: 0,
      pausedUrl: '',
      timeBeginPlaying: props.isLive
        ? DateTime.now().setZone(videoStore.timezone)
        : videoStore.searchPlayTime
        ? videoStore.searchPlayTimeLuxon
        : videoStore.beginSearchTime ?? videoStore.getSafeSearchDate(),
      internalLoading: false,
      zoom: 1,
      translateX: 0,
      translateY: 0,
      isFilterShown: false,
      marginLeft: 0,
      marginTop: 0,
      originalHeight: 0,
      originalWidth: 0,
      visibleBcg: true,
    };
    // __DEV__ &&
    //   console.log('GOND HLS set beginTime 0: ', this.state.timeBeginPlaying);
    this._isMounted = false;
    this.frameTime = 0;
    this.tsIndex = -1;
    this.reactions = [];
    this.naturalSize = null;
    this.shouldResume = false;
    this.lastSearchTime = null;
    this.videoBufferTimeout = null;

    this.videoReconnectTimeout = null;
    this.reInitTimeout = null;
    // this.waitingForReconnect = false;
    this.checkTimelineInterval = null;

    this.lastVideoTime = 0;
    this.retryCount = 0;
    this.reInitCount = 0;
    this.firstBuffer = true;
    this.firstReady = true;
    // this.errorList = [];
    this.errorTimeout = null;
    this.forceResume = false;

    this.waitingForNewUrl = false;
    this.lastSeekableDuration = 0;
    this.skippedDuration = 0;
    this.player = null;

    const tapGesture = Gesture.Tap().onStart(_e => {
      props.onPress && props.onPress();
      // this.setState({isFilterShown: !this.state.isFilterShown});
    });

    const onPanUpdateOrEnd = e => {
      if (this.state.zoom > 1.1) {
        let translateX = this.curTranslationX + e.translationX;
        let translateY = this.curTranslationY + e.translationY;
        const thresholdX = (this.props.width * (this.state.zoom - 1)) / 2;
        const thresholdY = (this.props.height * (this.state.zoom - 1)) / 2;
        this.setState({
          translateX:
            translateX > thresholdX
              ? thresholdX
              : translateX < -thresholdX
              ? -thresholdX
              : translateX,
          translateY:
            translateY > thresholdY
              ? thresholdY
              : translateY < -thresholdY
              ? -thresholdY
              : translateY,
        });
      }
    };

    const panGesture = Gesture.Pan()
      .onStart(e => {
        if (this.state.zoom > 1.1) {
          this.curTranslationX = this.state.translateX;
          this.curTranslationY = this.state.translateY;
        } else {
          if (e.velocityX >= 300) props.onSwipeRight();
          if (e.velocityX <= -300) props.onSwipeLeft();
        }
      })
      .onUpdate(onPanUpdateOrEnd)
      .onEnd(onPanUpdateOrEnd);

    const rightFlingGesture = Gesture.Fling()
      .direction(Directions.RIGHT)
      .onStart(e => {
        __DEV__ &&
          console.log(` rightFlingGesture onStart e = `, JSON.stringify(e));
      })
      .onEnd(e => {
        __DEV__ &&
          console.log(` rightFlingGesture onEnd e = `, JSON.stringify(e));
        if (this.state.zoom > 1.01) {
        } else props.onSwipeRight();
      });

    const leftFlingGesture = Gesture.Fling()
      .direction(Directions.LEFT)
      .onEnd(e => {
        __DEV__ && console.log(` leftFlingGesture e = `, JSON.stringify(e));
        if (this.state.zoom > 1.01) {
        } else props.onSwipeLeft();
      });

    const pinchGesture = Gesture.Pinch()
      .onStart(e => {
        this.curZoom = this.state.zoom;
        this.originFocalX = this.computeOriginFocal(
          e.focalX,
          this.state.translateX,
          this.props.width
        );
        this.originFocalY = this.computeOriginFocal(
          e.focalY,
          this.state.translateY,
          this.props.height
        );
      })
      .onUpdate(e => {
        let newZoom = this.curZoom * e.scale;
        if (newZoom > 1 && newZoom < MAX_ZOOM) {
          this.setState({zoom: newZoom});
          let translateX = this.computeTranslatePos(
            newZoom,
            this.originFocalX,
            this.props.width
          );
          let translateY = this.computeTranslatePos(
            newZoom,
            this.originFocalY,
            this.props.height
          );
          this.setState({
            translateX,
            translateY,
          });
        }
      });

    this.composed = (
      Platform.OS == 'android' ? Gesture.Exclusive : Gesture.Race
    )(
      pinchGesture,
      panGesture,
      tapGesture
      // rightFlingGesture,
      // leftFlingGesture
    );
  }
  computeOriginFocal(zoomedFocal, translate, axisSize) {
    return (
      (zoomedFocal - translate - ((1 - this.state.zoom) * axisSize) / 2) /
      this.state.zoom
    );
  }
  computeTranslatePos(zoom, pos, axisSize) {
    return (1 - zoom) * (pos - axisSize / 2);
  }

  resetZoom = () => {
    __DEV__ && console.log(` resetZoom `);
    this.setState({zoom: 1, translateX: 0, translateY: 0});
  };

  componentDidMount() {
    __DEV__ &&
      console.log('HLSStreamingView componentDidMount', this.props.streamData);
    this._isMounted = true;
    const {appStore, videoStore, isLive, singlePlayer} = this.props;

    this.initReactions();
    this.setStreamStatus({
      connectionStatus: STREAM_STATUS.CONNECTING,
      isLoading: true,
    });
    if (videoStore.paused && isLive) {
      this.pause(false);
    }
    // if (this.props.isLive || !videoStore.paused) {
    //   __DEV__ && console.log('HLSStreamingView should resume');
    //   this.shouldResume = true;
    // }

    this.trackingVideoSource =
      util.extractModuleNameFromScreenName(
        appStore.naviService.getPreviousRouteName()
        // ) + (Platform.OS == 'ios' ? (singlePlayer ? '_single' : '_multi') : '');
      ) + singlePlayer
        ? '_single'
        : '_multi';
  }

  componentWillUnmount() {
    const {appStore, videoStore, isLive} = this.props;
    __DEV__ && console.log('HLSStreamingView componentWillUnmount');
    this._isMounted = false;
    // if (this.checkStreamTO) {
    //   clearTimeout(this.checkStreamTO);
    // }
    this.reactions.forEach(unsubscribe => unsubscribe());
    this.clearBufferTimeout();
    this.clearReconnectTimeout();
    this.clearCheckTimelineInterval();
    const {streamData} = this.props;
    // if (
    //   this.props.singlePlayer &&
    //   isAlive(streamData) &&
    //   streamData.isLoading
    // ) {
    //   streamData.setStreamStatus({
    //     isLoading: false,
    //     connectionStatus: STREAM_STATUS.DONE,
    //   });
    // }
    snackbar.dismiss();
    // this.stop();
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
    streamData.updateDataUsage(
      FORCE_SENT_DATA_USAGE,
      'N/A',
      videoStore.timezone,
      'componentWillUnmount'
    );
    if (
      Platform.OS === 'ios' &&
      this.player &&
      this.player.stopDataUsageTimer
    ) {
      __DEV__ && console.log('stopDataUsageTimer');
      this.player.stopDataUsageTimer();
    }
  }

  computeTime = secs => {
    const {videoStore} = this.props;
    return DateTime.fromSeconds(secs).setZone(videoStore.timezone);
  };

  initReactions = () => {
    // streamData could be changed
    const {streamData, videoStore, singlePlayer} = this.props;
    this.reactions = [
      reaction(
        () => this.props.streamData.error,
        (newError, previousError) => {
          if (
            this.state.internalLoading &&
            newError &&
            newError != previousError &&
            newError.length > 0
          )
            this.setState({internalLoading: false});
        }
      ),
      reaction(
        () => videoStore.isAuthenticated,
        (isAuthen, previousValue) => {
          const {streamUrl} = this.props.streamData;
          if (
            isAuthen == true &&
            isAuthen != previousValue &&
            util.isValidHttpUrl(streamUrl)
          ) {
            this.setStreamUrl(
              streamUrl,
              singlePlayer ? videoStore.isLive : true
            );
          }
        }
      ),
      reaction(
        () => streamData.snapshot,
        ss => {
          if (ss && typeof ss === 'string' && ss.length > 0 && !this.player) {
            this.forceUpdate();
          }
        }
      ),
    ];

    if (singlePlayer) {
      this.reactions = [
        ...this.reactions,
        reaction(
          () => this.props.streamData.streamUrl,
          async newUrl => {
            if (
              this.props.isLive != this.props.streamData.isLive ||
              this.props.hdMode != this.props.streamData.isHD
            ) {
              __DEV__ &&
                console.log('HLSStreamingView streamUrl not set: ', this.props);
              return;
            }
            __DEV__ &&
              console.log(
                'HLSStreamingView newUrl: ',
                newUrl,
                videoStore.noVideo,
                this.props.noVideo
              );
            if (!videoStore.noVideo && newUrl != this.state.streamUrl) {
              if (
                videoStore.isAuthenticated &&
                (util.isValidHttpUrl(newUrl) || newUrl == null)
              ) {
                // __DEV__ &&
                //   console.log(
                //     'HLSStreamingView newURL time: ',
                //     videoStore.searchPlayTimeLuxon,
                //     ', isLive: ',
                //     this.props.isLive
                //   );
                this.setStreamUrl(newUrl, this.props.isLive);
                // // reset these value everytimes streamUrl changed
                // if (!this.props.isLive && this.lastSearchTime) {
                //   this.lastSearchTime = null;
                // }
                // this.frameTime = 0;
                // this.lastVideoTime = 0;
                // this.tsIndex = -1;
                // this.retryCount = 0;
                // this.reInitCount = 0;
                // this.firstBuffer = true;
                // this.waitingForNewUrl = false;
                // if (
                //   videoStore.paused &&
                //   (this.props.isLive || this.forceResume)
                // ) {
                //   this.pause(false);
                //   this.forceResume = false;
                // }
                // if (this.props.isLive || !videoStore.paused) {
                //   __DEV__ && console.log('HLSStreamingView should resume');
                //   this.shouldResume = true;
                // }
              } else {
                // TODO: handle invalid url
              }
            } else {
              __DEV__ &&
                console.log(
                  'HLSStreamingView not assign streamUrl: ',
                  this.props.noVideo
                );
            }
          }
        ),
        reaction(
          () => videoStore.timezone,
          newTimezone => {
            const {timeBeginPlaying} = this.state;
            if (newTimezone != timeBeginPlaying.zone.name) {
              __DEV__ &&
                console.log(
                  'HLSStreamingView new timezone: ',
                  videoStore.timezone
                );
              this.setState({
                timeBeginPlaying: this.state.timeBeginPlaying.setZone(
                  videoStore.timezone
                ),
              });
            }
          }
        ),
        reaction(
          () => videoStore.noVideo,
          isNoVideo => {
            if (isNoVideo == true) {
              this.stop();
              this.setStreamStatus({
                connectionStatus: STREAM_STATUS.NOVIDEO,
                isLoading: false,
              });
              if (this.state.internalLoading)
                this.setState({internalLoading: false});
            } else {
              this.setStreamStatus({
                connectionStatus: STREAM_STATUS.DONE,
                // isLoading: false,
              });
              if (util.isValidHttpUrl(this.props.streamData.streamUrl)) {
                this.setState({streamUrl: this.props.streamData.streamUrl});
              }
            }
          }
        ),
        // reaction(
        //   () => videoStore.beginSearchTime,
        //   newSearchTime => {
        //     this.frameTime = 0;
        //     this.tsIndex = -1;
        //     this.setState({
        //       timeBeginPlaying: newSearchTime,
        //     });
        //   }
        // ),
      ];
    } else {
      this.reactions = [
        ...this.reactions,
        reaction(
          () => this.props.streamData.liveUrl.url,
          newUrl => {
            // __DEV__ &&
            //   console.log(
            //     'HLSStreamingView newUrl: ',
            //     newUrl,
            //   );
            if (newUrl != this.state.streamUrl) {
              if (videoStore.isAuthenticated && util.isValidHttpUrl(newUrl)) {
                this.setStreamUrl(newUrl, true);
                // this.setState({
                //   streamUrl: newUrl,
                //   timeBeginPlaying: DateTime.now().setZone(videoStore.timezone),
                //   internalLoading: false,
                //   refreshCount: 0,
                // });
                // reset these value everytimes streamUrl changed
                // this.frameTime = 0;
                // this.lastVideoTime = 0;
                // this.tsIndex = -1;
                // this.retryCount = 0;
                // this.reInitCount = 0;
                // this.firstBuffer = true;
                // this.waitingForNewUrl = false;
                // if (videoStore.paused) {
                //   this.pause(false);
                // }
                // __DEV__ && console.log('HLSStreamingView should resume');
                // this.shouldResume = true;
              } else {
                // TODO: handle invalid url
              }
            } else {
              __DEV__ &&
                console.log(
                  'HLSStreamingView not assign streamUrl: ',
                  this.props.noVideo
                );
            }
          }
        ),
        // stop live streams when enter single video mode
        /*
        reaction(
          () => videoStore.selectedChannel,
          (newChannel, previousValue) => {
            __DEV__ &&
              console.log('HLSStreamingView channel changed: ', newChannel);
            const {channelNo, liveUrl} = this.props.streamData;
            if (
              previousValue == null &&
              newChannel != null &&
              newChannel != channelNo
            ) {
              this.setState({streamUrl: ''});
            } else if (
              previousValue != null &&
              newChannel == null &&
              previousValue != channelNo
            ) {
              this.firstBuffer = true;
              this.shouldResume = true;
              this.setState({streamUrl: liveUrl.url});
            }
          }
        ),
        */
      ];
    }
  };

  setStreamUrl = (newUrl, isLive) => {
    const {videoStore} = this.props;

    this.setState(
      {
        streamUrl: newUrl,
        timeBeginPlaying: isLive
          ? DateTime.now().setZone(videoStore.timezone)
          : this.lastSearchTime ??
            (videoStore.searchPlayTime != null
              ? videoStore.searchPlayTimeLuxon
              : videoStore.beginSearchTime ?? videoStore.getSafeSearchDate()),
        internalLoading: false,
        refreshCount: 0,
      },
      () => {
        // if (this._isMounted && videoStore.paused) {
        //   this.pause(false);
        //   setTimeout(() => this._isMounted && this.pause(true), 100);
        // }
        // __DEV__ &&
        //   console.log(
        //     'GOND HLS set beginTime 1: ',
        //     this.state.timeBeginPlaying
        //   );
      }
    );

    // reset these value everytimes streamUrl changed
    if (!this.props.isLive && this.lastSearchTime) {
      this.lastSearchTime = null;
    }
    // if (!isLive) {
    this.frameTime = 0;
    this.lastVideoTime = 0;
    this.tsIndex = -1;
    // }
    this.retryCount = 0;
    this.reInitCount = 0;
    this.firstBuffer = true;
    this.waitingForNewUrl = false;
    if (videoStore.paused && (isLive || this.forceResume)) {
      this.pause(false);
      this.forceResume = false;
    }
    if (this.props.isLive || !videoStore.paused) {
      __DEV__ && console.log('HLSStreamingView should resume');
      this.shouldResume = true;
    }
  };

  setStreamStatus = statusObject => {
    const {streamData, singlePlayer, videoStore, isLive} = this.props;
    if (!this._isMounted) return;
    // __DEV__ && console.log(
    //   'GOND HLS setStreamStatus!',
    //   streamData.channel.canPlayMode(isLive),
    //   streamData.channel
    // );
    if (
      !videoStore.hasNVRPermission ||
      (streamData.channel && !streamData.channel.canPlayMode(isLive))
    ) {
      console.log('GOND HLS no permission: do not change status!');
      return;
    }
    if (singlePlayer) {
      streamData.setStreamStatus(statusObject);
    } else {
      streamData.setLiveStatus(statusObject);
    }
  };

  onLayout = event => {
    if (event == null || event.nativeEvent == null || !this._isMounted) return;
    __DEV__ && console.log('GOND HLS onlayout: ', event.nativeEvent.layout);
    this.onSetMargin();
    // let {width, height} = event.nativeEvent.layout;
    // setTimeout(() => {
    //   if (width <= height) {
    //     const videoRatio = width / height;
    //     if (videoRatio !== NATURAL_RATIO) {
    //       height = parseInt((width * 9) / 16);
    //     }
    //   }
    //   this.setState({
    //     width: width,
    //     height: height,
    //   });
    // }, 100);
  };

  onChangeSearchDate = () => {
    this.lastSearchTime = null;
    this.frameTime = 0;
    this.lastSeekableDuration = 0;
    this.skippedDuration = 0;
    this.clearBufferTimeout();
    this.refresh();
    this.pause(true);
    snackbar.dismiss();
    __DEV__ && console.log('GOND =HLS= onChangeSearchDate ready false');
    this.props.streamData.setStreamReady(false);
    setTimeout(
      () =>
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTING,
          isLoading: true,
        }),
      200
    );
  };

  onBeginDraggingTimeline = () => {
    this.pause(true);
    this.clearBufferTimeout();
    __DEV__ && console.log('GOND =HLS= onBeginDraggingTimeline ready false');
    this.props.streamData.setStreamReady(false);
  };

  onSwitchLiveSearch = isLive => {
    this.lastSearchTime = null;
    this.frameTime = 0;
    this.clearBufferTimeout();
    this.clearErrorTimeout();
    this.refresh();
    this.pause(true);
    snackbar.dismiss();
    __DEV__ && console.log('GOND =HLS= onSwitchLiveSearch ready false');
    this.props.streamData.setStreamReady(false);
    if (isLive) {
      this.lastSeekableDuration = 0;
      this.skippedDuration = 0;
    }
    setTimeout(
      () =>
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTING,
          isLoading: true,
        }),
      200
    );
  };

  onChangeChannel = channelNo => {
    this.clearBufferTimeout();
    this.clearErrorTimeout();
    this.refresh();
    this.pause(true);
    snackbar.dismiss();
    __DEV__ && console.log('GOND =HLS= onChangeChannel ready false');
    this.props.streamData.setStreamReady(false);
    this.lastSeekableDuration = 0;
    this.skippedDuration = 0;
    setTimeout(() => {
      this.setStreamStatus({
        connectionStatus: STREAM_STATUS.CONNECTING,
        isLoading: true,
      });
      this.setState({visibleBcg: true});
    }, 200);
    const videoStore = this.props.videoStore;
    videoStore.setStretch(true);
  };

  onHDMode = isHD => {
    // this.pause(true);
    this.lastSearchTime = this.computeTime(this.frameTime);
    this.lastSeekableDuration = 0;
    this.skippedDuration = 0;
    __DEV__ && console.log('GOND =HLS= onHDMode ready false');
    this.props.videoStore.setBeginSearchTime(this.lastSearchTime);
    this.props.streamData.setStreamReady(false);
    this.pause(true);
    this.forceResume = true;
    snackbar.dismiss();
  };

  onStretch = stretch => {
    this.onSetMargin();
  };

  onPlaybackStalled = event => {
    const {videoStore, singlePlayer} = this.props;
    __DEV__ && console.log('GOND onPlaybackStalled: ', event);

    // if (!videoStore.paused) {
    //   this.pause(true);
    //   setTimeout(() => {
    //     if (this._isMounted) {
    //       this.pause(false);
    //     }
    //   }, 500);
    // }
  };

  onPlaybackResume = event => {
    // const {videoStore, singlePlayer} = this.props;
    __DEV__ && console.log('GOND onPlaybackResume: ', event);
  };

  onBandwidthUpdate = data => {
    const {streamData, videoStore, singlePlayer} = this.props;
    // if (
    //   Platform.OS === 'ios' ||
    //   (streamData === videoStore.androidDataUsageStream &&
    //     ((videoStore.selectedStream && singlePlayer) ||
    //       !videoStore.selectedStream))
    // ) {
    streamData.updateDataUsage(
      data.bitrate,
      this.trackingVideoSource,
      videoStore.timezone,
      'onBandwidthUpdate'
    );
    // }
  };

  onReady = event => {
    const {streamData, videoStore, singlePlayer} = this.props;
    __DEV__ &&
      console.log(
        'GOND =HLS= onReady true: ',
        streamData.channelName
        // ', shouldResume: ',
        // this.shouldResume
      );

    // if (singlePlayer && this.shouldResume) {
    //   this.shouldResume = false;
    // }
    streamData.setStreamReady(true);
    // if (streamData.connectionStatus != STREAM_STATUS.DONE) {
    //   streamData.setStreamStatus({
    //     isLoading: false,
    //     connectionStatus: STREAM_STATUS.DONE,
    //   });
    // }
    // if (Platform.OS === 'android') {
    //   if (this.firstReady) {
    //     __DEV__ && console.log('0507 onReady streamData.id = ', streamData.id);
    //     if (
    //       videoStore.androidDataUsageStream &&
    //       videoStore.androidDataUsageStream.id != streamData.id
    //     ) {
    //       videoStore.androidDataUsageStream.updateDataUsage(
    //         FORCE_SENT_DATA_USAGE,
    //         'N/A',
    //         videoStore.timezone,
    //         'notifySwitchDataUsageStreamAndroid'
    //       );
    //     }
    //     videoStore.notifySwitchDataUsageStreamAndroid(streamData);
    //   }
    //   this.firstReady = false;
    // }
  };

  onBuffer = event => {
    // __DEV__ && console.log('GOND HLS onBuffer: ', event);
    const {streamData, isLive} = this.props;
    if (event.isBuffering) {
      if (this.firstBuffer) {
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.BUFFERING,
          isLoading: true,
        });
        this.videoBufferTimeout = setTimeout(
          this.onBufferTimeout,
          __DEV__ ? 15000 : BUFFER_TIMEOUT
        );
        this.firstBuffer = false;
      }

      // this.clearErrorTimeout(); // should be here?
      // // It could cause reconnecting forever
      // if (!this.videoBufferTimeout) {
      //   this.videoBufferTimeout = setTimeout(
      //     this.onBufferTimeout,
      //     __DEV__ ? 15000 : BUFFER_TIMEOUT
      //   );
      // }
    } else if (!isLive) {
      if (streamData.isLoading)
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.DONE,
          isLoading: false,
        });
      this.clearBufferTimeout();
    }
  };

  clearBufferTimeout = () => {
    if (this.videoBufferTimeout) {
      clearTimeout(this.videoBufferTimeout);
      this.videoBufferTimeout = null;
    }
  };

  onBufferTimeout = () => {
    this.clearBufferTimeout();
    if (this.state.streamUrl != null) this.reconnect();
  };

  onError = ({error}) => {
    if (!this._isMounted) return;
    __DEV__ &&
      console.log(
        'GOND HLS onError ',
        this.props.streamData.channelName,
        JSON.stringify(error),
        error.errorString,
        error.localizedFailureReason
      );
    const {streamData, isLive, hdMode} = this.props;
    if (this.state.internalLoading) this.setState({internalLoading: false});
    // this.setState({
    //   message: 'Reconnecting',
    // });
    // this.frameTime = 0;

    if (
      (error.errorString &&
        (error.errorString.includes('Unrecognized media format') || // android
          error.errorString.includes('Behind Live window'))) || // android
      error.domain == 'NSURLErrorDomain' || // iOS
      (error.localizedFailureReason &&
        error.localizedFailureReason.includes('Stream ended unexpectedly')) // iOS
    ) {
      // TODO: new search time
      if (!this.errorTimeout)
        this.errorTimeout = setTimeout(() => {
          this.handleStreamError();
          this.errorTimeout = null;
        }, 5000);
      return;
    }
    /*
    if (error.domain == 'CoreMediaErrorDomain') {
      __DEV__ && console.log('GOND HLS CoreMediaErrorDomain');
      // return;
    }
    if (error.errorString == 'Unrecognized media format') {
      // this.setStreamStatus({
      //   connectionStatus: STREAM_STATUS.SOURCE_ERROR,
      // });
      __DEV__ && console.log('GOND HLS SOURCE_ERROR ');
      // this.handleStreamError();
      // return;
    } // else {
    // streamData.reconnect(isLive, hdMode);
    // }
    */

    // this.errorList.push(error.errorString);
    // if (this.errorList.length >= 10) {
    //   this.errorList = [];
    //   this.clearErrorTimeout();
    //   // TODO: new search time

    //   this.reconnect();
    // } else {
    this.errorTimeout = setTimeout(() => {
      this.reconnect();
      this.errorTimeout = null;
    }, 5000);
    // }
  };

  clearCheckTimelineInterval = () => {
    if (this.checkTimelineInterval) {
      clearInterval(this.checkTimelineInterval);
      this.checkTimelineInterval = null;
    }
  };

  clearErrorTimeout = () => {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  };

  // onCheckTimelineInterval = (channelNo, sid) => {
  //   const {videoStore} = this.props;
  //   if (videoStore.hlsTimestamps.length == 0) {
  //     videoStore.getTimeline(channelNo, sid);
  //   } else {
  //     this.clearCheckTimelineInterval();
  //   }
  // };

  onProgress = data => {
    const {isLive, videoStore, streamData, singlePlayer} = this.props;
    const searchDate = videoStore.getSafeSearchDate();
    if (
      streamData.isLoading ||
      streamData.connectionStatus != STREAM_STATUS.DONE
    ) {
      this.setStreamStatus({
        isLoading: false,
        connectionStatus: STREAM_STATUS.DONE,
      });
    }
    this.clearBufferTimeout();
    this.clearReconnectTimeout();
    this.clearErrorTimeout();
    this.retryCount != 0 && (this.retryCount = 0);
    this.reInitCount != 0 && (this.reInitCount = 0);
    // this.errorList.length > 0 && (this.errorList = []);

    // __DEV__ && console.log('GOND HLS progress: ', streamData.channelName, data);
    if (!singlePlayer) {
      // __DEV__ && console.log('GOND HLS progress: AAAAAA 1');
      return;
    }
    __DEV__ &&
      console.log('GOND HLS progress 0: ', streamData.channelName, data);
    // dongpt: skip old frames after dragging timeline or setting search time
    if (this.skippedDuration > 0 && this.player) {
      // if (Platform.OS == 'ios') {
      this.player.seek(data.seekableDuration, 50);
      // } else this.player.seek(Math.ceil(this.skippedDuration), 50);
      this.skippedDuration = 0;
      return;
    }

    const {hlsTimestamps} = videoStore;
    const {timeBeginPlaying} = this.state;

    // dongpt: save seekableDuration for skipping old frame when drag timeline or set search time
    if (!isLive && data.seekableDuration > 0)
      this.lastSeekableDuration = data.seekableDuration;

    // __DEV__ && console.log('GOND HLS onProgress: ', data);
    if (this.frameTime == 0 || (!isLive && this.tsIndex < 0)) {
      // __DEV__ &&
      //   console.log(
      //     'GOND HLS onProgress: 1 timeBeginPlaying ',
      //     timeBeginPlaying.toFormat(NVRPlayerConfig.FrameFormat),
      //     this.frameTime
      //   );
      this.frameTime = timeBeginPlaying.toSeconds();
      this.lastVideoTime = 0;

      // __DEV__ &&
      //   console.log('GOND HLS onProgress: this.frameTime = ', this.frameTime);
      if (isLive) {
        this.setState({
          timeBeginPlaying: DateTime.now()
            .setZone(videoStore.timezone)
            .minus({seconds: data.currentTime}),
        });
        // this.frameTime = timeBeginPlaying.toSeconds();
      } else if (hlsTimestamps.length > 0) {
        this.tsIndex = hlsTimestamps.findIndex(t => t >= this.frameTime);
        // __DEV__ &&
        //   console.log(
        //     'GOND HLS onProgress: ',
        //     this.tsIndex,
        //     DateTime.fromSeconds(this.frameTime, {
        //       zone: videoStore.timezone,
        //     }).toFormat(NVRPlayerConfig.FrameFormat)
        //   );
        if (this.tsIndex < 0) {
          if (this.frameTime == 0) {
            __DEV__ &&
              console.log(
                'GOND HLS::SEARCH WRONG TIMESTAMP: hlsTimestamps = ',
                hlsTimestamps.length > 0
                  ? `${hlsTimestamps[0]} - ${
                      hlsTimestamps[hlsTimestamps.length - 1]
                    }`
                  : []
              );
            this.frameTime = 0;
            this.setState(
              {
                timeBeginPlaying: DateTime.fromSeconds(hlsTimestamps[0], {
                  zone: videoStore.timezone,
                }),
              } // ,
              // () =>
              //   __DEV__ &&
              //   console.log(
              //     'GOND HLS set beginTime 2a: ',
              //     this.state.timeBeginPlaying.toFormat(
              //       NVRPlayerConfig.FrameFormat
              //     )
              //   )
            );
            return;
          } else if (
            this.frameTime > hlsTimestamps[hlsTimestamps.length - 1] &&
            this.frameTime < searchDate.endOf('day').toSeconds()
          ) {
            // handle video play past the last point of timeline
            __DEV__ &&
              console.log('GOND HLS::SEARCH updating time outside of timeline');
            videoStore.setDisplayDateTime(
              DateTime.fromSeconds(this.frameTime, {
                zone: videoStore.timezone,
              }).toFormat(NVRPlayerConfig.FrameFormat)
            );
            videoStore.setFrameTime(this.frameTime);
          } else {
            __DEV__ &&
              console.log(
                'GOND HLS::SEARCH tsIndex not found 1',
                this.frameTime,
                hlsTimestamps[hlsTimestamps.length - 1],
                searchDate.endOf('day').toSeconds()
              );
            return;
          }
        } else {
          // __DEV__ &&
          //   console.log(
          //     'GOND HLS onProgress: 2 ',
          //     this.tsIndex,
          //     hlsTimestamps[this.tsIndex]
          //   );
          this.frameTime = hlsTimestamps[this.tsIndex];
          this.setState(
            {
              timeBeginPlaying: DateTime.fromSeconds(this.frameTime, {
                zone: videoStore.timezone,
              }),
            } // ,
            // () =>
            //   __DEV__ &&
            //   console.log(
            //     'GOND HLS set beginTime 2b: ',
            //     this.state.timeBeginPlaying.toFormat(
            //       NVRPlayerConfig.FrameFormat
            //     )
            //   )
          );
          // __DEV__ && console.log('GOND HLS onProgress 1:', this.frameTime);
        }
      }
    } else {
      if (isLive) {
        const timeDiff = data.currentTime - this.lastVideoTime;
        // this.frameTime =  timeBeginPlaying.toSeconds() + data.currentTime;
        if (timeDiff >= 2) {
          this.frameTime += 1;
        } else if (timeDiff < 0) {
          console.log(
            'GOND HLS onProgress LIVE: TIME BEHIND LAST CURRENTTIME!'
          );
        } else {
          this.frameTime += timeDiff;
        }
        this.lastVideoTime = data.currentTime;
      } else if (this.tsIndex < hlsTimestamps.length) {
        const timeDiff = Math.floor(data.currentTime - this.lastVideoTime);
        // __DEV__ &&
        //   console.log('GOND HLS onProgress 4:', timeDiff, this.lastVideoTime);
        if (timeDiff > 0) {
          if (timeDiff >= 3) {
            console.log(
              'GOND HLS onProgress Warning, timeDiff too big: ',
              timeDiff,
              data,
              this.lastVideoTime
            );
            // if (this.lastVideoTime == 0) {
            this.lastVideoTime = Math.floor(data.currentTime);
            this.frameTime = hlsTimestamps[this.tsIndex];
            // } else {
            //   this.lastVideoTime = Math.floor(data.currentTime);
            // }
          } else {
            const nextIndex = this.tsIndex + timeDiff;
            if (nextIndex < hlsTimestamps.length) {
              this.tsIndex = nextIndex;
              this.lastVideoTime = Math.floor(data.currentTime);
              this.frameTime = hlsTimestamps[this.tsIndex];
            } else {
              this.frameTime += data.currentTime - this.lastVideoTime;
              this.lastVideoTime = Math.floor(data.currentTime);
              __DEV__ &&
                console.log(
                  'GOND HLS::SEARCH updating out of timeline bound',
                  this.frameTime,
                  data.currentTime,
                  this.lastVideoTime
                );
            }
          }
        } else if (timeDiff < 0) {
          this.lastVideoTime = Math.floor(data.currentTime);
        }
        // }
      } else {
        __DEV__ &&
          console.log(
            'GOND HLS::SEARCH tsIndex not found 2',
            this.frameTime,
            this.tsIndex,
            hlsTimestamps.length
          );
      }
    }

    if (
      !streamData.channel ||
      videoStore.selectedChannel != streamData.channelNo ||
      !this.frameTime
    ) {
      __DEV__ && console.log('GOND HLS::SEARCH not update time');
      return;
    }

    // if (!isLive) {
    //   __DEV__ &&
    //     console.log(
    //       'GOND HLS check frameTime = ',
    //       this.frameTime,
    //       ', timestamps = ',
    //       hlsTimestamps
    //     );
    // }

    // __DEV__ &&
    //   console.log(
    //     'GOND HLS onProgress: channel: ',
    //     streamData.channelName,
    //     ', currentTime = ',
    //     data.currentTime,
    //     ', frameTime = ',
    //     this.frameTime,
    //     // ', tz = ',
    //     // videoStore.timezone,
    //     ', tsIndex: ',
    //     this.tsIndex,
    //     ', DT = ',
    //     DateTime.fromSeconds(this.frameTime).toFormat(
    //       NVRPlayerConfig.RequestTimeFormat
    //     )
    //   );

    if (!videoStore.paused) {
      videoStore.setDisplayDateTime(
        DateTime.fromSeconds(this.frameTime, {
          zone: videoStore.timezone,
        }).toFormat(NVRPlayerConfig.FrameFormat)
      );
      videoStore.setFrameTime(this.frameTime);
    }
  };

  onLoad = event => {
    const {videoStore} = this.props;
    // videoStore.setEnableStretch(true);
    this.naturalSize = event.naturalSize;
    __DEV__ && console.log('GOND HLS::onLoad: ', event);
    this.onSetMargin();
  };

  onSetMargin = () => {
    if (this.naturalSize == null || this.naturalSize.height == null) return;
    const originalHeight = this.naturalSize.height;
    const originalWidth = this.naturalSize.width;

    let containerWidth = this.props.width;
    let containerHeight = this.props.height;
    let hRatio = (containerHeight * 1.0) / originalHeight;
    let wRatio = (containerWidth * 1.0) / originalWidth;
    let marginLeft = 0;
    let marginTop = 0;
    if (hRatio > wRatio) {
      let height = wRatio * originalHeight;
      let top = (containerHeight - height) / 2;
      // this.setState({marginLeft: 0, marginTop: top > 0 ? top : undefined});
      marginTop = top > 0 ? top : 0;
    } else if (hRatio < wRatio) {
      let width = hRatio * originalWidth;
      let left = (containerWidth - width) / 2;
      // this.setState({marginTop: 0, marginLeft: left > 0 ? left : undefined});
      marginLeft = left > 0 ? left : 0;
    }

    this.setState({visibleBcg: false, marginLeft, marginTop});

    // __DEV__ &&
    //   console.log(
    //     'GOND HLS::onSetMargin: ',
    //     this.naturalSize,
    //     ', ratios: ',
    //     hRatio,
    //     wRatio,
    //     'container: ',
    //     containerHeight,
    //     containerWidth,
    //     'origin: ',
    //     originalHeight,
    //     originalWidth,
    //     'margin: ',
    //     marginTop,
    //     marginLeft
    //   );
  };

  clearReconnectTimeout = () => {
    if (this.videoReconnectTimeout) {
      clearTimeout(this.videoReconnectTimeout);
      this.videoReconnectTimeout = null;
    }
  };

  reconnect = () => {
    const {streamData, isLive, hdMode} = this.props;
    if (this.waitingForNewUrl) {
      return;
    }
    if (__DEV__) {
      console.trace('GOND ------- HLS reconnect: ', this.retryCount);
      // console.trace();
    }
    // if (!this.videoReconnectTimeout) {
    //   streamData.reconnect(isLive, hdMode);
    //   this.videoReconnectTimeout = setTimeout(
    //     () => (this.videoReconnectTimeout = null),
    //     RECONNECT_TIMEOUT
    //   );
    // }

    if (util.isValidHttpUrl(streamData.streamUrl)) {
      if (this.retryCount < MAX_RETRY) {
        this.retryCount++;
        this.setState({
          refreshCount: this.state.refreshCount + 1,
        });
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.RECONNECTING,
          isLoading: true,
        });
        this.videoBufferTimeout = setTimeout(
          () => this.reconnect(),
          BUFFER_TIMEOUT
        );
      } else {
        this.handleStreamError();
      }
    } else {
      this.handleStreamError();
    }
  };

  handleStreamError = () => {
    const {streamData, isLive, videoStore} = this.props;
    if (this.waitingForNewUrl) {
      return;
    }

    this.lastVideoTime = 0;
    this.waitingForNewUrl = true;
    // if (!videoStore.paused) {
    //   this.forceResume = true;
    //   this.pause(true);
    //   streamData.setStreamStatus({
    //     connectionStatus: STREAM_STATUS.CONNECTING,
    //     isLoading: true,
    //   });
    // }
    if (!isLive && this.frameTime > 0) {
      this.lastSearchTime = this.computeTime(this.frameTime);
      videoStore.setBeginSearchTime(this.lastSearchTime);
    }
    __DEV__ && console.log(`GOND !!! HLShandleError 5`);
    streamData.handleError();
    // if (this.reInitCount < MAX_REINIT) {
    //   if (!this.reInitTimeout) {
    //     this.reInitCount++;
    //     this.lastVideoTime = 0;
    //     this.reInitTimeout = setTimeout(() => {
    //       this._isMounted && streamData.handleError();
    //       this.reInitTimeout = null;
    //     }, 1500);
    //   }
    // } else {
    //   // this.stop();
    //   __DEV__ &&
    //     console.log(`GOND CONNECTION_ERROR view handleStreamError max retry: `);
    //   this.setStreamStatus({
    //     connectionStatus: STREAM_STATUS.CONNECTION_ERROR,
    //     isLoading: false,
    //   });
    // }
  };

  stop = () => {
    const {streamData, videoStore} = this.props;
    if (__DEV__) console.log('GOND HLS onStop |');
    // __DEV__ && console.log('GOND HLS streamUrl 2');
    this.setState({streamUrl: ''});
    this.retryCount = 0;
    this.setState({refreshCount: 0});
    this.reInitCount = 0;
    streamData &&
      streamData.targetUrl &&
      videoStore.stopHLSStream(streamData.channelNo, streamData.targetUrl.sid);
    this.clearBufferTimeout();
    this.clearReconnectTimeout();
  };

  refresh = isSaveUrl => {
    if (isSaveUrl) {
      const currentUrl = this.state.streamUrl;
      const {streamData} = this.props;
      __DEV__ && console.trace(`GOND HLS refresh ---`);
      streamData.setStreamStatus({
        connectionStatus: STREAM_STATUS.CONNECTING,
        isLoading: true,
      });
      this.setState({streamUrl: ''}, () => {
        setTimeout(() => {
          this._isMounted &&
            this.state.streamUrl.length == 0 &&
            this.setState({streamUrl: currentUrl});
          isAlive(streamData) &&
            streamData.setStreamStatus({
              connectionStatus: STREAM_STATUS.DONE,
              isLoading: false,
            });
        }, 2000);
      });
    } else this.setState({streamUrl: ''});
  };

  pause = willPause => {
    this.props.videoStore.pause(willPause == undefined ? true : willPause);
    // __DEV__ && console.trace('GOND HLS PAUSED ---');
  };

  playAt = async value => {
    const {videoStore, streamData} = this.props;
    const searchDate = videoStore.getSafeSearchDate();
    const time = searchDate.plus({seconds: value});
    __DEV__ && console.log('GOND HLS playAt: ', value, ' - ', time, searchDate);
    this.lastSearchTime = time;
    this.frameTime = 0;
    this.lastVideoTime = 0;
    this.tsIndex = -1;
    // videoStore.setPlayTimeForSearch(
    //   time.toFormat(NVRPlayerConfig.RequestTimeFormat)
    // );
    this.pause(true);
    streamData.setStreamReady(false);
    this.setState(
      {
        timeBeginPlaying: this.lastSearchTime,
      } // ,
      // () =>
      //   __DEV__ &&
      //   console.log(
      //     'GOND HLS set beginTime 3: ',
      //     this.state.timeBeginPlaying.toFormat(NVRPlayerConfig.FrameFormat)
      //   )
    );
    await videoStore.onHLSTimeChanged(time);
    __DEV__ && console.log('GOND =HLS= on refresh streamUrl begin');
    const {streamUrl} = this.state;
    this.setState(
      {
        // refreshCount: this.state.refreshCount > 0 ? 0 : 1,
        streamUrl: '',
      },
      () => {
        this.setState({streamUrl}, () => {
          streamData.setStreamReady(true);
          if (this.lastSeekableDuration > 0) {
            this.skippedDuration = this.lastSeekableDuration;
            this.lastSeekableDuration = 0;
          }
          __DEV__ && console.log('GOND =HLS= on refresh streamUrl end');
        });
      }
    );
  };

  onSnapshotSuccess = () => {
    snackbar.showToast(VIDEO.SNAPSHOT_TAKEN, CMSColors.Success);
  };

  takeSnapshotNative = () => {
    if (this.player && this.player.takeScreenShot) {
      console.log(
        '0523 takeSnapshotNative this.player.takeScreenShot = ',
        this.player.takeScreenShot
      );
      this.player.takeScreenShot();
    }
  };

  render() {
    const {
      width,
      height,
      streamData,
      noVideo,
      videoStore,
      singlePlayer,
      filterShown,
    } = this.props;
    const {isLoading, connectionStatus} = streamData; // streamStatus;
    const {channel} = streamData;
    const {
      streamUrl,
      urlParams,
      refreshCount,
      internalLoading,
      marginLeft,
      marginTop,
    } = this.state;
    const playbackUrl =
      streamUrl && streamUrl.length > 0 ? streamUrl /*+ urlParams*/ : null;
    const poster = streamData.snapshot
      ? typeof streamData.snapshot == 'object'
        ? streamData.snapshot.uri ?? ''
        : '' + streamData.snapshot
      : ''; // NVR_Play_NoVideo_Image;
    __DEV__ &&
      console.log(
        'GOND HLS render: ',
        streamData.channelName
        // streamData.snapshot,
        // videoStore.paused,
        // playbackUrl,
        // 'width: ',
        // width,
        // 'height: ',
        // height,
      );

    return (
      <GestureDetector gesture={this.composed}>
        <View onLayout={this.onLayout}>
          <ImageBackground
            source={NVR_Play_NoVideo_Image}
            style={{width: width, height: height}}
            resizeMode="cover">
            {/* <CMSImage
            isBackground={true}
            dataSource={streamData.snapshot}
            defaultImage={NVR_Play_NoVideo_Image}
            // visible={!videoStore.enableStretch}
            resizeMode={
              !videoStore.stretch && singlePlayer ? 'contain' : 'cover'
            }
            showLoading={false}
            styleImage={{width: width, height: height}}
            dataCompleteHandler={(param, data) =>
              streamData.channel && streamData.channel.saveSnapshot(data)
            }
            domain={{
              controller: 'channel',
              action: 'image',
              id: streamData.kChannel,
            }}> */}
            <Text
              style={[
                styles.channelInfo,
                {
                  top: singlePlayer ? '11%' : 0, // videoStore.isFullscreen ? '10%' : 0,
                  marginLeft:
                    !videoStore.stretch && singlePlayer ? marginLeft : 0,
                  marginTop:
                    !videoStore.stretch && singlePlayer ? marginTop : 0,
                },
              ]}>
              {channel.name ?? 'Unknown'}
            </Text>
            <View style={styles.statusView}>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.textMessage,
                    {
                      marginLeft:
                        !videoStore.stretch && singlePlayer ? marginLeft : 0,
                      marginTop:
                        !videoStore.stretch && singlePlayer ? marginTop : 0,
                    },
                  ]}>
                  {connectionStatus}
                </Text>
              </View>
              {(isLoading || internalLoading) && (
                <ActivityIndicator
                  style={styles.loadingIndicator}
                  size="large"
                  color="white"
                />
              )}
            </View>
            <View style={styles.playerView}>
              {
                playbackUrl && (
                  <Video
                    key={`${streamData.channelName}${
                      singlePlayer ? '_single' : ''
                    }_${refreshCount}`}
                    style={[
                      {
                        width: width,
                        height: height,
                        // transform: [{scaleX: 2}, {scaleY: 2}],
                      },
                    ]}
                    hls={true}
                    resizeMode={
                      videoStore.stretch || !singlePlayer
                        ? 'stretch'
                        : 'contain'
                    }
                    source={{uri: playbackUrl ?? '', type: 'm3u8'}}
                    paused={
                      singlePlayer && !videoStore.isLive
                        ? videoStore.paused
                        : false
                    }
                    ref={ref => {
                      this.player = ref;
                    }}
                    progressUpdateInterval={1000} // 1 seconds per onProgress called
                    onReadyForDisplay={this.onReady}
                    onBuffer={this.onBuffer}
                    onError={this.onError}
                    onPlaybackStalled={this.onPlaybackStalled}
                    onPlaybackResume={this.onPlaybackResume}
                    onBandwidthUpdate={this.onBandwidthUpdate}
                    onSnapshotSuccess={this.onSnapshotSuccess}
                    onProgress={this.onProgress}
                    onLoad={this.onLoad}
                    onSeek={event =>
                      __DEV__ && console.log('GOND HLS onSeek: ', event)
                    }
                    onTimedMetadata={event => {
                      __DEV__ && console.log('GOND HLS onTimedMetadata', event);
                    }}
                    onPlaybackRateChange={data => {
                      __DEV__ &&
                        console.log('GOND HLS onPlaybackRateChange: ', data);
                    }}
                    muted={true}
                    volume={0}
                    selectedAudioTrack={{type: 'disabled'}}
                    selectedTextTrack={{type: 'disabled'}}
                    rate={1.0}
                    automaticallyWaitsToMinimizeStalling={false}
                    preferredForwardBufferDuration={5}
                    playInBackground={true}
                    playWhenInactive={true}
                    useTextureView={singlePlayer}
                    disableFocus={true}
                    bufferConfig={{
                      minBufferMs: 3500,
                      maxBufferMs: 15000,
                      bufferForPlaybackMs: 2500,
                      bufferForPlaybackAfterRebufferMs: 2500,
                    }}
                    maxBitRate={singlePlayer ? 0 : 1048576} // 1048576 //524288
                    reportBandwidth={true}
                    transform={[
                      {translateX: this.state.translateX},
                      {translateY: this.state.translateY},
                      {scaleX: this.state.zoom},
                      {scaleY: this.state.zoom},
                    ]}
                    poster={poster}
                    posterResizeMode={videoStore.stretch ? 'cover' : 'contain'}
                    // posterResizeMode="cover"
                    // textTracks={[
                    //   {
                    //     title: channel.name ?? 'Unknown',
                    //   },
                    // ]}
                  />
                )
                // ) : null
              }
            </View>
            {/* </CMSImage> */}
          </ImageBackground>
          {
            /*this.state.isFilterShown*/ filterShown && (
              <View
                style={[
                  controlStyles.controlsContainer,
                  {
                    backgroundColor: CMSColors.VideoOpacityLayer,
                  },
                ]}
              />
            )
          }
        </View>
      </GestureDetector>
    );
  }
}

// const styles = StyleSheet.create({});

const controlStyles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});

export default inject('videoStore', 'appStore')(observer(HLSStreamingView));
