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
import {NATIVE_MESSAGE, STREAM_TIMEOUT} from '../../consts/video';
import {CALENDAR_DATE_FORMAT, NVRPlayerConfig} from '../../consts/misc';

import {VIDEO as VIDEO_TXT, STREAM_STATUS} from '../../localization/texts';

const Video_State = {STOP: 0, PLAY: 1, PAUSE: 2};
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
      streamUrl: streamData.streamUrl,
      // streamUrl: props.streamUrl.targetUrl
      //   ? props.streamData.targetUrl.url
      //   : null,
      urlParams: '',
      timeBeginPlaying: DateTime.now().setZone(videoStore.timezone),
      // paused: false,
    };
    this._isMounted = false;
    this.frameTime = 0;
    this.tsIndex = -1;
    this.reactions = [];
    this.shouldResume = false;
    this.lastSearchTime = null;
  }

  componentDidMount() {
    __DEV__ &&
      console.log('HLSStreamingView componentDidMount', this.props.streamData);
    this._isMounted = true;
    this.initReactions();
  }

  componentWillUnmount() {
    __DEV__ && console.log('HLSStreamingView componentWillUnmount');
    this._isMounted = false;
    if (this.checkStreamTO) {
      clearTimeout(this.checkStreamTO);
    }
    this.reactions.forEach(unsubsribe => unsubsribe());
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
          if (this.props.isLive != this.props.streamData.isLive) {
            __DEV__ &&
              console.log('HLSStreamingView streamUrl not set: ', this.props);
            return;
          }
          __DEV__ && console.log('HLSStreamingView newUrl: ', newUrl);
          if (!this.props.noVideo && newUrl != this.state.streamUrl) {
            if (util.isValidHttpUrl(newUrl)) {
              __DEV__ &&
                console.log(
                  'HLSStreamingView newURL time: ',
                  videoStore.searchPlayTimeLuxon,
                  ', isLive: ',
                  this.props.isLive
                );
              this.setState({
                streamUrl: newUrl,
                timeBeginPlaying: this.props.isLive
                  ? DateTime.now().setZone(videoStore.timezone)
                  : this.lastSearchTime ?? videoStore.searchPlayTimeLuxon,
              });
              // reset these value everytimes streamUrl changed
              this.frameTime = 0;
              this.tsIndex = -1;
              if (videoStore.paused) {
                videoStore.pause(false);
              }
              if (!this.props.isLive && singlePlayer) {
                __DEV__ && console.log('HLSStreamingView should resume');
                this.shouldResume = true;
              }
            } else {
              // TODO: handle invalid url
            }
          }
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
          newChannel => {
            __DEV__ &&
              console.log('HLSStreamingView channel changed: ', newChannel);
            this.lastSearchTime = null;
            // if (this.props.singlePlayer) {
            //   if (videoStore.paused) videoStore.pause(false);
            // }
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
        reaction(
          () => videoStore.hdMode,
          isHD => {
            // __DEV__ &&
            //   console.log('HLSStreamingView switch mode isHD: ', isHD);
            this.lastSearchTime = this.computeTime(this.frameTime);
          }
        ),
      ];
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

      setTimeout(() => {
        if (this._isMounted) {
          videoStore.pause(true);
          setTimeout(() => {
            if (this._isMounted) {
              videoStore.pause(false);
            }
          }, 1000);
        }
      }, 1000);
    }
  };

  onBuffer = event => {
    __DEV__ && console.log('GOND HLS onBuffer: ', event);
    const {streamData} = this.props;
    if (event.isBuffering) {
      streamData.setStreamStatus({
        connectionStatus: STREAM_STATUS.BUFFERING,
        isLoading: true,
      });
    } else {
      streamData.setStreamStatus({
        connectionStatus: STREAM_STATUS.DONE,
        isLoading: false,
      });
    }
  };

  onError = error => {
    __DEV__ && console.log('GOND HLS onError: ', error);
    const {streamData, isLive, hdMode} = this.props;
    // this.setState({
    //   message: 'Reconnecting',
    // });
    // this.frameTime = 0;
    // TODO: new search time
    if (!isLive && this.frameTime > 0)
      this.lastSearchTime = this.computeTime(this.frameTime);
    streamData.reconnect(isLive, hdMode);
  };

  onProgress = data => {
    const {isLive, videoStore, streamData, singlePlayer} = this.props;
    // __DEV__ && console.log('GOND HLS progress: ', streamData.channelName, data);
    if (!singlePlayer) return;

    const {hlsTimestamps} = videoStore;
    const {timeBeginPlaying} = this.state;

    if (
      streamData.isLoading ||
      streamData.connectionStatus != STREAM_STATUS.DONE
    ) {
      streamData.setStreamStatus({
        isLoading: false,
        connectionStatus: STREAM_STATUS.DONE,
      });
    }

    // __DEV__ && console.log('GOND HLS onProgress: ', data);
    if (this.frameTime == 0 || (!isLive && this.tsIndex < 0)) {
      this.frameTime = timeBeginPlaying.toSeconds();
      __DEV__ &&
        console.log(
          'GOND HLS onProgress: this.frameTime = ',
          this.frameTime,
          timeBeginPlaying
        );
      if (!isLive) {
        this.tsIndex = hlsTimestamps.findIndex(t => t >= this.frameTime);
        if (this.tsIndex < 0) {
          __DEV__ &&
            console.log(
              'GOND HLS::SEARCH WRONG TIMESTAMP: hlsTimestamps = ',
              hlsTimestamps
            );
        } else {
          this.frameTime = hlsTimestamps[this.tsIndex];
          // __DEV__ && console.log('GOND HLS onProgress 1:', this.frameTime);
        }
      }
    } else {
      if (isLive) {
        if (Platform.OS == 'ios') {
          this.frameTime = timeBeginPlaying.toSeconds() + data.currentTime;
        } else {
          this.frameTime += 1;
        }
      } else if (this.tsIndex < hlsTimestamps.length) {
        if (Platform.OS == 'ios') {
          this.frameTime = timeBeginPlaying.toSeconds() + data.currentTime;
          let idx = this.tsIndex;
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
          } /* else {
            __DEV__ &&
              console.log(
                'GOND HLS::SEARCH timestamp index mismatch ',
                hlsTimestamps[this.tsIndex],
                ', ',
                this.frameTime,
                ', ',
                hlsTimestamps[this.tsIndex + 1]
              );
          } */
          this.frameTime = hlsTimestamps[this.tsIndex];
        } else {
          this.tsIndex++;
          this.frameTime = hlsTimestamps[this.tsIndex];
        }
      }
    }

    if (
      !streamData.channel ||
      videoStore.selectedChannel != streamData.channelNo ||
      !this.frameTime
    )
      return;

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
    videoStore.setDisplayDateTime(
      DateTime.fromSeconds(this.frameTime, {
        zone: videoStore.timezone,
      }).toFormat(NVRPlayerConfig.FrameFormat)
    );
    videoStore.setFrameTime(this.frameTime);
  };

  onLoad = event => {
    __DEV__ && console.log('GOND HLS onLoad: ', event);
  };

  stop = () => {
    this.props.videoStore.stopHLSStream();
  };

  pause = willPause => {
    // this.setState({paused: willPause == undefined ? true : willPause});
  };

  playAt = value => {
    const {videoStore} = this.props;
    const time = videoStore.searchDate.plus({seconds: value});
    __DEV__ && console.log('GOND HLS playAt: ', value, ' - ', time);
    this.lastSearchTime = this.computeTime(time.toSeconds());

    // videoStore.setPlayTimeForSearch(
    //   time.toFormat(NVRPlayerConfig.RequestTimeFormat)
    // );
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
    const {streamUrl, urlParams} = this.state;
    __DEV__ &&
      console.log(
        'GOND HLS render: ',
        videoStore.paused
        // ', status: ',
        // connectionStatus
      );

    return (
      <View onLayout={this.onLayout}>
        <ImageBackground
          source={NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="stretch">
          <Text
            style={[
              styles.channelInfo,
              {left: videoStore.isFullscreen ? 10 : 0},
            ]}>
            {channel.name ?? 'Unknown'}
          </Text>
          <View style={styles.statusView}>
            <View style={styles.textContainer}>
              <Text style={styles.textMessage}>{connectionStatus}</Text>
            </View>
            {isLoading && (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="large"
                color="white"
              />
            )}
          </View>
          <View style={styles.playerView}>
            {
              /*!isLoading &&*/ streamUrl &&
              streamUrl.length > 0 &&
              !noVideo ? (
                <Video
                  style={[{width: width, height: height}]}
                  hls={true}
                  resizeMode={'stretch'}
                  //source={{uri:this.state.url,type:'application/x-mpegURL'}}
                  source={{uri: streamUrl + urlParams, type: 'm3u8'}}
                  // paused={this.state.paused}
                  paused={singlePlayer ? videoStore.paused : false}
                  ref={ref => {
                    this.player = ref;
                  }}
                  progressUpdateInterval={1000} // 1 seconds per onProgress called
                  onReadyForDisplay={this.onReady}
                  onBuffer={this.onBuffer}
                  onError={this.onError}
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
                  automaticallyWaitsToMinimizeStalling={false}
                  // preferredForwardBufferDuration={2}
                  playInBackground={true}
                  playWhenInactive={true}
                  useTextureView={false}
                  disableFocus={true}
                  onPlaybackStalled={() =>
                    __DEV__ && console.log('GOND HLS onPlaybackStalled')
                  }
                  onPlaybackResume={() =>
                    __DEV__ && console.log('GOND HLS onPlaybackResume')
                  }
                />
              ) : null
            }
          </View>
        </ImageBackground>
      </View>
    );
  }
}

// const styles = StyleSheet.create({});

export default inject('videoStore')(observer(HLSStreamingView));
