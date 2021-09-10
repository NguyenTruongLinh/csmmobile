import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import {inject, observer} from 'mobx-react';
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
      // streamUrl: props.streamUrl,
      urlParams: '',
      timeBeginPlaying: DateTime.now(),
    };
    this._isMounted = false;
    this.frameTime = 0;
  }

  componentDidMount() {
    __DEV__ &&
      console.log('HLSStreamingView componentDidMount', this.props.streamData);
    this._isMounted = true;

    // this.scheduleCheckStream();
  }

  componentWillUnmount() {
    __DEV__ && console.log('HLSStreamingView componentWillUnmount');
    this._isMounted = false;
    if (this.checkStreamTO) {
      clearTimeout(this.checkStreamTO);
    }
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // if (nextProps.streamUrl != prevState.streamUrl)
    //   return {streamUrl: nextProps.streamUrl};
    // return {};
    const {streamUrl} = nextProps.streamData;
    // __DEV__ && console.log('GOND HLS getDerivedStateFromProps: ', streamUrl);

    if (streamUrl && streamUrl.length > 0 && streamUrl != prevState.streamUrl) {
      return {
        // videoLoading: false,
        // message: '',
        streamUrl,
        timeBeginPlaying: DateTime.now(),
      };
    }
    return {};
  }

  componentDidUpdate(prevProps, prevState) {}

  // scheduleCheckStream = () => {
  //   if (this.checkStreamTO) {
  //     clearTimeout(this.checkStreamTO);
  //   }
  //   this.checkStreamTO = setTimeout(
  //     () => this.onCheckStreamAvailable(),
  //     STREAM_TIMEOUT
  //   );
  // };

  // onCheckStreamAvailable = () => {
  //   if (this._isMounted) {
  //     const {streamData} = this.props;
  //     const {streamUrl} = streamData;
  //     __DEV__ &&
  //       console.log(
  //         'GOND HLS onCheckStreamAvailable: ',
  //         streamUrl,
  //         ' - ',
  //         streamUrl.startsWith('https://')
  //       );
  //     if (
  //       !streamUrl ||
  //       streamUrl.length <= 0 ||
  //       !streamUrl.startsWith('https://')
  //     ) {
  //       this.props.streamData.setStreamStatus({
  //         isLoading: false,
  //         connectionStatus: STREAM_STATUS.TIMEOUT,
  //       });
  //     }
  //   }
  // };

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
  };

  onError = error => {
    __DEV__ && console.log('GOND HLS onError: ', error);
    const {streamData, isLive} = this.props;
    // this.setState({
    //   message: 'Reconnecting',
    // });
    this.frameTime = 0;
    streamData.reconnect(isLive);
  };

  onProgress = data => {
    const {videoStore, streamData} = this.props;
    const {timeBeginPlaying} = this.state;
    if (
      !streamData.channel ||
      videoStore.selectedChannel != streamData.channel.channelNo
    )
      return;
    __DEV__ && console.log('GOND HLS onProgress: ', data);
    if (this.frameTime == 0) {
      this.frameTime = timeBeginPlaying.toSeconds();
    } else {
      this.frameTime += 1;
    }
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

  stop = () => {};

  pause = () => {};

  render() {
    const {width, height, streamData, streamStatus} = this.props;
    const {isLoading, connectionStatus} = streamData; // streamStatus;
    const {channel, streamUrl} = streamData;
    const {urlParams} = this.state;
    __DEV__ &&
      console.log(
        'GOND HLS render: ',
        isLoading,
        ', status: ',
        connectionStatus
      );

    return (
      <View onLayout={this.onLayout}>
        <ImageBackground
          source={NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="stretch">
          {/* <View style={{width: width, height: height}}> */}
          <Text style={styles.channelInfo}>{channel.name ?? 'Unknown'}</Text>
          <View style={styles.statusView}>
            <Text style={styles.textMessge}>{connectionStatus}</Text>
            {isLoading && (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="large"
                color="white"
              />
            )}
          </View>
          <View style={styles.playerView}>
            {streamUrl && streamUrl.length > 0 ? (
              <Video
                style={[{width: width, height: height}]}
                hls={true}
                resizeMode={'stretch'}
                //source={{uri:this.state.url,type:'application/x-mpegURL'}}
                source={{uri: streamUrl + urlParams, type: 'm3u8'}}
                paused={this.state.paused}
                ref={ref => {
                  this.player = ref;
                }}
                progressUpdateInterval={1000}
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
            ) : null}
          </View>
          {/* </View> */}
        </ImageBackground>
      </View>
    );
  }
}

// const styles = StyleSheet.create({});

export default inject('videoStore')(observer(HLSStreamingView));
