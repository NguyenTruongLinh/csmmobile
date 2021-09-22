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

import {Video as VideoTxt, STREAM_STATUS} from '../../localization/texts';

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

    this.state = {
      // message: '',
      // videoLoading: true,
      streamUrl: props.streamData.streamUrl,
      // streamUrl: props.streamUrl.targetUrl
      //   ? props.streamData.targetUrl.url
      //   : null,
      urlParams: '',
      timeBeginPlaying: DateTime.now().setZone(props.timezone),
      // paused: false,
    };
    this._isMounted = false;
    this.frameTime = 0;
    this.tsIndex = -1;
    this.reactions = [];
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
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
  }

  initReactions = () => {
    const {streamData, videoStore} = this.props;
    this.reactions = [
      reaction(
        () => streamData.streamUrl,
        newUrl => {
          if (newUrl != this.state.streamUrl) {
            if (util.isValidHttpUrl(newUrl)) {
              __DEV__ &&
                console.log(
                  'HLSStreamingView newURL time: ',
                  videoStore.searchPlayTimeLuxon
                );
              this.setState({
                streamUrl: newUrl,
                timeBeginPlaying: videoStore.isLive
                  ? DateTime.now().setZone(videoStore.timezone)
                  : videoStore.searchPlayTimeLuxon,
              });
              // reset these value everytimes streamUrl changed
              this.frameTime = 0;
              this.tsIndex = -1;
              if (videoStore.paused) videoStore.pause(false);
            } else {
              // TODO: handle invalid url
            }
          }
        }
      ),
      reaction(
        () => videoStore.timezone,
        newTimezone => {
          const {timeBeginPlaying} = this.state;
          if (newTimezone != timeBeginPlaying.zone.name) {
            this.setState({
              timeBeginPlaying: this.state.timeBeginPlaying.setZone(
                videoStore.timezone
              ),
            });
          }
        }
      ),
    ];
  };

  /*
  static getDerivedStateFromProps(nextProps, prevState) {
    console.log('GOND HLS getDerivedStateFromProps...', nextProps);
    const {streamData, timezone, isLive, videoStore} = nextProps;
    const {searchPlayTimeLuxon} = videoStore;
    const {streamUrl} = streamData;
    let nextState = {};
    if (streamUrl != prevState.streamUrl) {
      nextState = {
        ...nextState,
        streamUrl: streamUrl,
        timeBeginPlaying: isLive
          ? DateTime.now().setZone(timezone)
          : searchPlayTimeLuxon,
      };
      if (videoStore.paused) videoStore.pause(false);
    }

    if (timezone && timezone != prevState.timeBeginPlaying.zone.name) {
      __DEV__ &&
        console.log(
          `GOND HLS getDerivedStateFromProps: timezone changed: ${timezone} <= `,
          prevState.timeBeginPlaying.zone
        );
      nextState = {
        ...nextState,
        timeBeginPlaying: prevState.timeBeginPlaying.setZone(timezone),
      };
    }
    return nextState;
  }
  */

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
    this.frameTime = 0;
    // TODO: new search time
    streamData.reconnect(isLive, hdMode);
  };

  onProgress = data => {
    const {isLive, videoStore, streamData, singlePlayer} = this.props;
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
      if (!isLive) {
        this.tsIndex = hlsTimestamps.findIndex(t => t >= this.frameTime);
        if (this.tsIndex < 0) {
          __DEV__ && console.log('GOND HLS::SEARCH WRONG TIMESTAMP: ');
        } else {
          this.frameTime = hlsTimestamps[this.tsIndex];
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
          if (
            this.frameTime <= hlsTimestamps[this.tsIndex + 1] &&
            this.frameTime > hlsTimestamps[this.tsIndex]
          )
            this.tsIndex++;
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

    __DEV__ &&
      console.log(
        'GOND HLS onProgress: channel: ',
        streamData.channelName,
        ', currentTime = ',
        data.currentTime,
        ', frameTime = ',
        this.frameTime,
        ', tz = ',
        videoStore.timezone,
        ', DT = ',
        DateTime.fromSeconds(this.frameTime).toFormat(
          NVRPlayerConfig.RequestTimeFormat
        )
      );
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

    videoStore.setPlayTimeForSearch(
      time.toFormat(NVRPlayerConfig.RequestTimeFormat)
    );
    videoStore.onHLSTimeChanged();
  };

  render() {
    const {width, height, streamData, streamStatus, videoStore} = this.props;
    const {isLoading, connectionStatus} = streamData; // streamStatus;
    const {channel} = streamData;
    const {streamUrl, urlParams, pause} = this.state;
    // __DEV__ &&
    //   console.log(
    //     'GOND HLS render: ',
    //     isLoading,
    //     ', status: ',
    //     connectionStatus
    //   );

    return (
      <View onLayout={this.onLayout}>
        <ImageBackground
          source={NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="stretch">
          {/* <View style={{width: width, height: height}}> */}
          <Text style={styles.channelInfo}>{channel.name ?? 'Unknown'}</Text>
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
              /*!isLoading &&*/ streamUrl && streamUrl.length > 0 ? (
                <Video
                  style={[{width: width, height: height}]}
                  hls={true}
                  resizeMode={'stretch'}
                  //source={{uri:this.state.url,type:'application/x-mpegURL'}}
                  source={{uri: streamUrl + urlParams, type: 'm3u8'}}
                  // paused={this.state.paused}
                  paused={videoStore.paused}
                  ref={ref => {
                    this.player = ref;
                  }}
                  progressUpdateInterval={1000} // 1 seconds per onProgress called
                  onBuffer={this.onBuffer}
                  onError={this.onError}
                  onProgress={this.onProgress}
                  onLoad={this.onLoad}
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
                  preferredForwardBufferDuration={2}
                  playInBackground={true}
                  playWhenInactive={true}
                />
              ) : null
            }
          </View>
          {/* </View> */}
        </ImageBackground>
      </View>
    );
  }
}

// const styles = StyleSheet.create({});

export default inject('videoStore')(observer(HLSStreamingView));
