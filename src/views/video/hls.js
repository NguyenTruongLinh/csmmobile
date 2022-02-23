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
import Video from 'react-native-video';
import {DateTime} from 'luxon';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {
  BUFFER_TIMEOUT,
  RECONNECT_TIMEOUT,
  STREAM_TIMEOUT,
} from '../../consts/video';
import {CALENDAR_DATE_FORMAT, NVRPlayerConfig} from '../../consts/misc';

import {VIDEO as VIDEO_TXT, STREAM_STATUS} from '../../localization/texts';

const Video_State = {STOP: 0, PLAY: 1, PAUSE: 2};
const MAX_RETRY = 5;
const MAX_REINIT = 5;
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
      streamUrl: streamData.streamUrl ?? '',
      // streamUrl: props.streamUrl.targetUrl
      //   ? props.streamData.targetUrl.url
      //   : null,
      urlParams: '',
      // videoKey: 0,
      pausedUrl: '',
      timeBeginPlaying: DateTime.now().setZone(videoStore.timezone),
      internalLoading: false,
    };
    this._isMounted = false;
    this.frameTime = 0;
    this.tsIndex = -1;
    this.reactions = [];
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
    this.refreshCount = 0;
    this.firstBuffer = true;
    this.lastError = '';
  }

  componentDidMount() {
    __DEV__ &&
      console.log('HLSStreamingView componentDidMount', this.props.streamData);
    this._isMounted = true;
    this.initReactions();
    this.setStreamStatus({
      connectionStatus: STREAM_STATUS.CONNECTING,
      isLoading: true,
    });
  }

  componentWillUnmount() {
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
    if (streamData.isLoading) {
      streamData.setStreamStatus({
        isLoading: false,
        connectionStatus: STREAM_STATUS.DONE,
      });
    }
    // this.stop();
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
  }

  computeTime = secs => {
    const {videoStore} = this.props;
    return DateTime.fromSeconds(secs).setZone(videoStore.timezone);
  };

  initReactions = () => {
    // streamData could be changed
    const {/*streamData,*/ videoStore, singlePlayer} = this.props;
    this.reactions = [
      reaction(
        () => this.props.streamData.streamUrl,
        newUrl => {
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
              singlePlayer,
              videoStore.noVideo,
              this.props.noVideo
            );
          if (!this.props.noVideo && newUrl != this.state.streamUrl) {
            if (util.isValidHttpUrl(newUrl)) {
              // __DEV__ &&
              //   console.log(
              //     'HLSStreamingView newURL time: ',
              //     videoStore.searchPlayTimeLuxon,
              //     ', isLive: ',
              //     this.props.isLive
              //   );
              this.setState(
                {
                  streamUrl: newUrl,
                  timeBeginPlaying: this.props.isLive
                    ? DateTime.now().setZone(videoStore.timezone)
                    : this.lastSearchTime ?? videoStore.searchPlayTimeLuxon,
                  internalLoading: false,
                } // ,
                // () => {
                //   if (this._isMounted && videoStore.paused) {
                //     this.pause(false);
                //     setTimeout(() => this._isMounted && this.pause(true), 100);
                //   }
                // }
              );
              // reset these value everytimes streamUrl changed
              this.frameTime = 0;
              this.lastVideoTime = 0;
              this.tsIndex = -1;
              this.retryCount = 0;
              this.refreshCount = 0;
              this.reInitCount = 0;
              this.firstBuffer = true;
              if (videoStore.paused && this.props.isLive) {
                this.pause(false);
              }
              if (!singlePlayer || this.props.isLive || !videoStore.paused) {
                __DEV__ && console.log('HLSStreamingView should resume');
                this.shouldResume = true;
              }
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
    ];

    if (singlePlayer) {
      this.reactions = [
        ...this.reactions,
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
          () => videoStore.selectedChannel,
          (newChannel, lastChannel) => {
            __DEV__ &&
              console.log('HLSStreamingView channel changed: ', newChannel);
            if ((lastChannel = null)) {
              this.pause(true);
              this.stop();
            }
            this.setState({internalLoading: true});
            this.lastSearchTime = null;
          }
        ),
        reaction(
          () => videoStore.isLive,
          isLive => {
            // __DEV__ &&
            //   console.log('HLSStreamingView switch mode isLive: ', isLive);
            this.lastSearchTime = null;
          }
        ),
        // reaction(
        //   () => videoStore.hdMode,
        //   isHD => {
        //     // __DEV__ &&
        //     //   console.log('HLSStreamingView switch mode isHD: ', isHD);
        //     this.lastSearchTime = this.computeTime(this.frameTime);
        //   }
        // ),
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
            }
          }
        ),
      ];
    }
  };

  setStreamStatus = statusObject => {
    const {streamData, singlePlayer} = this.props;
    if (!this._isMounted) return;

    if (singlePlayer) {
      streamData.setStreamStatus(statusObject);
    } else {
      streamData.setLiveStatus(statusObject);
    }
  };

  onLayout = event => {
    if (event == null || event.nativeEvent == null || !this._isMounted) return;
    __DEV__ && console.log('GOND HLS onlayout: ', event.nativeEvent.layout);
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
    this.clearBufferTimeout();
    this.refresh();
    this.pause(true);
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
  };

  onSwitchLiveSearch = isLive => {
    this.clearBufferTimeout();
    this.refresh();
    this.pause(true);
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
    this.refresh();
    this.pause(true);

    setTimeout(
      () =>
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.CONNECTING,
          isLoading: true,
        }),
      200
    );
  };

  onHDMode = isHD => {
    this.lastSearchTime = this.computeTime(this.frameTime);
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

  onReady = event => {
    const {streamData, videoStore, singlePlayer} = this.props;
    __DEV__ &&
      console.log(
        'GOND HLS onReady: ',
        streamData.channelName,
        ', shouldResume: ',
        this.shouldResume
      );

    if (singlePlayer && this.shouldResume) {
      this.shouldResume = false;

      // setTimeout(() => {
      //   if (this._isMounted) {
      //     videoStore.pause(true);
      //     setTimeout(() => {
      //       if (this._isMounted) {
      //         videoStore.pause(false);
      //       }
      //     }, 1000);
      //   }
      // }, 1000);
    }
  };

  onBuffer = event => {
    __DEV__ && console.log('GOND HLS onBuffer: ', event);
    const {streamData, isLive} = this.props;
    if (event.isBuffering) {
      if (this.firstBuffer) {
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.BUFFERING,
          isLoading: true,
        });
        this.firstBuffer = false;
      }
      // It could cause reconnecting forever
      if (!this.videoBufferTimeout) {
        this.videoBufferTimeout = setTimeout(
          this.onBufferTimeout,
          __DEV__ ? 20000 : BUFFER_TIMEOUT
        );
      }
    } else if (!isLive) {
      if (streamData.connectionStatus == STREAM_STATUS.BUFFERING)
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
    this.reconnect();
  };

  onError = ({error}) => {
    if (!this._isMounted) return;
    __DEV__ &&
      console.log(
        'GOND HLS onError ',
        this.props.streamData.channelName,
        error
      );
    const {streamData, isLive, hdMode} = this.props;
    if (this.state.internalLoading) this.setState({internalLoading: false});
    // this.setState({
    //   message: 'Reconnecting',
    // });
    // this.frameTime = 0;
    // TODO: new search time
    if (!isLive && this.frameTime > 0)
      this.lastSearchTime = this.computeTime(this.frameTime);

    if (error.domain == 'CoreMediaErrorDomain') {
      __DEV__ && console.log('GOND HLS CoreMediaErrorDomain');
      // return;
    }
    if (error.domain == 'NSURLErrorDomain') {
      this.tryReInitStream();
      return;
    }
    if (error.errorString == 'Unrecognized media format') {
      // this.setStreamStatus({
      //   connectionStatus: STREAM_STATUS.SOURCE_ERROR,
      // });
      __DEV__ && console.log('GOND HLS SOURCE_ERROR ');
      // this.tryReInitStream();
      // return;
    } // else {
    // streamData.reconnect(isLive, hdMode);
    // }

    this.reconnect();
  };

  clearCheckTimelineInterval = () => {
    if (this.checkTimelineInterval) {
      clearInterval(this.checkTimelineInterval);
      this.checkTimelineInterval = null;
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
    this.retryCount != 0 && (this.retryCount = 0);
    this.reInitCount != 0 && (this.reInitCount = 0);

    // __DEV__ && console.log('GOND HLS progress: ', streamData.channelName, data);
    if (!singlePlayer) {
      // __DEV__ && console.log('GOND HLS progress: AAAAAA 1');
      return;
    }
    __DEV__ && console.log('GOND HLS progress: ', streamData.channelName, data);

    const {hlsTimestamps} = videoStore;
    const {timeBeginPlaying} = this.state;

    // __DEV__ && console.log('GOND HLS onProgress: ', data);
    if (this.frameTime == 0 || (!isLive && this.tsIndex < 0)) {
      // __DEV__ && console.log('GOND HLS onProgress: 1');
      this.frameTime = timeBeginPlaying.toSeconds();
      this.lastVideoTime = 0;

      __DEV__ &&
        console.log(
          'GOND HLS onProgress: this.frameTime = ',
          this.frameTime,
          timeBeginPlaying
        );
      if (!isLive) {
        this.tsIndex = hlsTimestamps.findIndex(t => t >= this.frameTime);
        __DEV__ && console.log('GOND HLS onProgress: ', this.tsIndex);
        if (this.tsIndex < 0) {
          __DEV__ &&
            console.log(
              'GOND HLS::SEARCH WRONG TIMESTAMP: hlsTimestamps = ',
              hlsTimestamps.length > 0
                ? `${hlsTimestamps[0]} - ${
                    hlsTimestamps[hlsTimestamps.length - 1]
                  }`
                : []
            );
          // Check timeline exist
          // if (
          //   hlsTimestamps.length == 0 &&
          //   !this.checkTimelineInterval &&
          //   !videoStore.noVideo
          // ) {
          //   videoStore.getTimeline(
          //     streamData.channelNo,
          //     streamData.targetUrl.sid
          //   );
          //   this.checkTimelineInterval = setInterval(
          //     () =>
          //       this.onCheckTimelineInterval(
          //         streamData.channelNo,
          //         streamData.targetUrl.sid
          //       ),
          //     10000
          //   );
          // }
        } else {
          // __DEV__ && console.log('GOND HLS onProgress: 2');
          this.frameTime = hlsTimestamps[this.tsIndex];
          this.setState({
            timeBeginPlaying: DateTime.fromSeconds(this.frameTime, {
              zone: videoStore.timezone,
            }),
          });
          // __DEV__ && console.log('GOND HLS onProgress 1:', this.frameTime);
        }
      } else {
        this.setState({
          timeBeginPlaying: DateTime.now()
            .setZone(videoStore.timezone)
            .minus({seconds: data.currentTime}),
        });
        this.frameTime = timeBeginPlaying.toSeconds();
      }
    } else {
      if (isLive) {
        // if (Platform.OS == 'ios') {
        this.frameTime = timeBeginPlaying.toSeconds() + data.currentTime;
        // } else {
        //   this.frameTime += 1;
        // }
      } else if (this.tsIndex < hlsTimestamps.length) {
        // __DEV__ && console.log('GOND HLS onProgress: 3');
        /*
        if (Platform.OS == 'ios') {
          this.frameTime = timeBeginPlaying.toSeconds() + data.currentTime;
          let idx = this.tsIndex;
          // __DEV__ &&
          //   console.log(
          //     'GOND HLS onProgress: 4 ',
          //     this.frameTime,
          //     hlsTimestamps[idx],
          //     hlsTimestamps[idx + 1]
          //   );
          if (this.frameTime > hlsTimestamps[idx]) {
            while (idx < hlsTimestamps.length) {
              if (
                this.frameTime < hlsTimestamps[idx + 1] &&
                this.frameTime >= hlsTimestamps[idx]
              ) {
                this.tsIndex = idx;
                break;
              }
              idx++;
            }
            // __DEV__ && console.log('GOND HLS onProgress: 5 ', this.tsIndex);
          } else {
            while (idx > 0) {
              if (
                this.frameTime > hlsTimestamps[idx - 1] &&
                this.frameTime <= hlsTimestamps[idx]
              ) {
                this.tsIndex = idx;
                break;
              }
              idx--;
            }
            // __DEV__ && console.log('GOND HLS onProgress: 6 ', this.tsIndex);
          }
          this.frameTime = hlsTimestamps[this.tsIndex];
        } else {
          */
        // __DEV__ && console.log('GOND HLS onProgress 5');

        const timeDiff = Math.floor(data.currentTime - this.lastVideoTime);
        // __DEV__ &&
        //   console.log('GOND HLS onProgress 6:', timeDiff, this.lastVideoTime);
        if (timeDiff > 0) {
          if (timeDiff >= 3 && __DEV__) {
            console.log(
              'GOND HLS Warning, timeDiff too big: ',
              timeDiff,
              data,
              this.lastVideoTime
            );
          }
          this.tsIndex += timeDiff;
          this.lastVideoTime = Math.floor(data.currentTime);
          this.frameTime = hlsTimestamps[this.tsIndex];
        }
        // }
      }
    }

    if (
      !streamData.channel ||
      videoStore.selectedChannel != streamData.channelNo ||
      !this.frameTime
    ) {
      // __DEV__ && console.log('GOND HLS onProgress: 6');
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
    __DEV__ && console.log('GOND HLS onLoad: ', event);
  };

  clearReconnectTimeout = () => {
    if (this.videoReconnectTimeout) {
      clearTimeout(this.videoReconnectTimeout);
      this.videoReconnectTimeout = null;
    }
  };

  reconnect = () => {
    const {streamData, isLive, hdMode} = this.props;
    // if (__DEV__) {
    //   console.log('GOND ------- HLS reconnect: ');
    //   console.trace();
    // }
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
        this.refreshCount++;
        this.setState({
          urlParams: '&v=' + this.refreshCount,
        });
        this.setStreamStatus({
          connectionStatus: STREAM_STATUS.RECONNECTING,
          isLoading: true,
        });
      } else {
        this.tryReInitStream();
      }
    } else {
      this.tryReInitStream();
    }
  };

  tryReInitStream = () => {
    const {streamData} = this.props;

    if (this.reInitCount < MAX_REINIT) {
      if (!this.reInitTimeout) {
        this.reInitCount++;
        this.reInitTimeout = setTimeout(() => {
          this._isMounted && streamData.reInitStream();
          this.reInitTimeout = null;
        }, 1500);
      }
    } else {
      // this.stop();
      this.setStreamStatus({
        connectionStatus: STREAM_STATUS.CONNECTION_ERROR,
        isLoading: false,
      });
    }
  };

  stop = () => {
    const {streamData, videoStore} = this.props;
    if (__DEV__) console.log('GOND HLS onStop |');
    // __DEV__ && console.log('GOND HLS streamUrl 2');
    this.setState({streamUrl: ''});
    this.retryCount = 0;
    this.refreshCount = 0;
    this.reInitCount = 0;
    streamData &&
      streamData.targetUrl &&
      videoStore.stopHLSStream(streamData.channelNo, streamData.targetUrl.sid);
    this.clearBufferTimeout();
    this.clearReconnectTimeout();
  };

  refresh = () => {
    this.setState({streamUrl: ''});
  };

  pause = willPause => {
    this.props.videoStore.pause(willPause == undefined ? true : willPause);
  };

  playAt = value => {
    const {videoStore} = this.props;
    const time = videoStore.searchDate.plus({seconds: value});
    __DEV__ && console.log('GOND HLS playAt: ', value, ' - ', time);
    this.lastSearchTime = this.computeTime(time.toSeconds());

    // videoStore.setPlayTimeForSearch(
    //   time.toFormat(NVRPlayerConfig.RequestTimeFormat)
    // );
    this.refresh();
    this.pause(true);
    videoStore.onHLSTimeChanged(time);
  };

  render() {
    const {
      width,
      height,
      streamData,
      noVideo,
      videoStore,
      singlePlayer,
    } = this.props;
    const {isLoading, connectionStatus} = streamData; // streamStatus;
    const {channel} = streamData;
    const {streamUrl, urlParams, internalLoading} = this.state;
    const playbackUrl =
      streamUrl && streamUrl.length > 0 ? streamUrl + urlParams : null;
    __DEV__ &&
      console.log(
        'GOND HLS render: ',
        videoStore.paused,
        // ', status: ',
        playbackUrl
      );

    return (
      <View onLayout={this.onLayout}>
        <ImageBackground
          source={NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="cover">
          <Text
            style={[
              styles.channelInfo,
              {
                top: videoStore.isFullscreen ? '10%' : 0,
              },
            ]}>
            {channel.name ?? 'Unknown'}
          </Text>
          <View style={styles.statusView}>
            <View style={styles.textContainer}>
              <Text style={styles.textMessage}>{connectionStatus}</Text>
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
              /*!isLoading &&*/
              // playbackUrl ? (
              <Video
                key={streamData.channelName + urlParams}
                style={[{width: width, height: height}]}
                hls={true}
                resizeMode={'stretch'}
                source={{uri: playbackUrl ?? '', type: 'm3u8'}}
                paused={singlePlayer ? videoStore.paused : false}
                ref={ref => {
                  this.player = ref;
                }}
                progressUpdateInterval={1000} // 1 seconds per onProgress called
                onReadyForDisplay={this.onReady}
                onBuffer={this.onBuffer}
                onError={this.onError}
                onPlaybackStalled={this.onPlaybackStalled}
                onPlaybackResume={this.onPlaybackResume}
                onProgress={this.onProgress}
                onLoad={this.onLoad}
                onTimedMetadata={event => {
                  __DEV__ && console.log('GOND HLS onTimedMetadata', event);
                }}
                onPlaybackRateChange={data => {
                  // __DEV__ &&
                  //   console.log('GOND HLS onPlaybackRateChange: ', data);
                }}
                muted={true}
                volume={0}
                selectedAudioTrack={{type: 'disabled'}}
                selectedTextTrack={{type: 'disabled'}}
                rate={1.0}
                automaticallyWaitsToMinimizeStalling={true}
                preferredForwardBufferDuration={2}
                playInBackground={true}
                playWhenInactive={true}
                useTextureView={false}
                disableFocus={true}
                bufferConfig={{
                  minBufferMs: 3500,
                  maxBufferMs: 15000,
                  bufferForPlaybackMs: 2500,
                  bufferForPlaybackAfterRebufferMs: 2500,
                }}
                maxBitRate={singlePlayer ? 0 : 1048576} // 1048576 //524288
              />
              // ) : null
            }
          </View>
        </ImageBackground>
      </View>
    );
  }
}

// const styles = StyleSheet.create({});

export default inject('videoStore')(observer(HLSStreamingView));
