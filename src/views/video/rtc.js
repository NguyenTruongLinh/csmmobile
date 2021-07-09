import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {RTCView} from 'react-native-webrtc';

import util, {normalize} from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {RTC_COMMANDS, STREAM_STATUS, VIDEO_MESSAGE} from '../../consts/video';

class RTCStreamingView extends Component {
  static defaultProps = {
    enableSwitchChannel: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      hdMode: false,
      // isLive: true,
      width: props.width,
      height: props.height,
      status: STREAM_STATUS.CONNECTING,
      error: '',
      videoLoading: true,
      canLiveSearch: false,
      novideo: false,
    };
  }

  componentDidMount() {
    __DEV__ &&
      console.log('RTCStreamingView componentDidMount, data = ', this.props);
    this._isMounted = true;
    const {viewer, videoStore} = this.props;

    viewer.setDataChannelEvents({
      onOpen: this.dataChannelOnOpen,
      onMessage: this.dataChannelOnMessage,
      onError: this.dataChannelOnError,
      onLowBuffer: this.dataChannelOnLowBuffer,
    });

    // if (!viewer.dataChannel) {
    //   console.log('RTCStreamingView dataChannel not created yet');
    //   return;
    // }

    if (viewer.isDataChannelOpened) {
      __DEV__ && console.log('GOND dc opened send live cmd now ...');
      if (videoStore.isLive) {
        this.sendRtcCommand(RTC_COMMANDS.TIMEZONE);
        this.sendRtcCommand(RTC_COMMANDS.LIVE);
      } else {
        // TODO: search in single player
      }
    }
  }

  componentWillUnmount() {
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
    this._isMounted = false;
  }

  sendRtcCommand = cmd => {
    const {videoStore, viewer} = this.props;
    // if (this.needResetConnection) {
    // 	this.getVideoInfos({KDVR: this.state.DVR.KDVR, ChannelNo: this.state.channelNo})
    // 	return;
    // }
    let requestObj = {
      request_type: cmd,
      main_sub: this.state.hdMode ? 1 : 0,
      channel_id: viewer.channelNo,
    };

    if (cmd == RTC_COMMANDS.SEARCH) {
      __DEV__ &&
        console.log(
          'GOND RTC_COMMANDS.SEARCH startTs = ',
          videoStore.searchBegin,
          '\n --- endTs = ',
          videoStore.searchEnd
        );
      requestObj = {
        ...requestObj,
        begin_ts: videoStore.searchBegin,
        end_ts: videoStore.searchEnd,
      };
    } // else if (cmd == RTC_COMMANDS.TIMELINE) {
    //   let _searchDate = dayjs.tz(
    //     this.searchDate * 1000,
    //     this.dvrTimezone.timezoneName
    //   );
    //   requestObj = {
    //     ...requestObj,
    //     begin_time: _searchDate.format(RequestTimeFormat),
    //     end_time: _searchDate.endOf('date').format(RequestTimeFormat),
    //   };
    // }

    __DEV__ && console.log('GOND sendRtcCommand reqObj = ', requestObj);
    this.dataChannelSendMessage(requestObj);
  };

  dataChannelSendMessage = message => {
    const {dataChannel} = this.props.viewer;
    if (!dataChannel) {
      __DEV__ && console.log('GOND no data channel available to send message');
      return;
    }

    let strMsg = typeof message == 'object' ? JSON.stringify(message) : message;
    __DEV__ &&
      console.log('GOND RTC sendMessage: ', message, '\n --- ', strMsg);
    if (dataChannel) {
      try {
        dataChannel.send(strMsg);
      } catch (e) {
        console.error(
          '%c [GOND] Send DataChannel error: ',
          'color: red; font-style: bold',
          e.toString()
        );
      }
    } else {
      console.log(
        '%c [GOND] *** Warning: cannot send viewer message, data channel not created yet!',
        'color: red; font-style: bold'
      );
    }
  };

  dataChannelOnOpen = msg => {
    __DEV__ && console.log('GOND {***} dataChannel onOpen: ', msg);
    if (!this._isMounted) return;
    const {videoStore} = this.props;

    this.props.viewer.setDataChannelStatus(true);
    this.props.viewer.setStreamStatus({
      isLoading: false,
      error: '',
      connectionStatus: STREAM_STATUS.CONNECTED,
      needResetConnection: false,
    });
    if (videoStore.isLive) {
      this.sendRtcCommand(RTC_COMMANDS.LIVE);
    } else {
      // TODO: search in single player
    }
  };

  dataChannelOnMessage = msg => {
    __DEV__ && console.log('GOND dataChannel onMessage: ', msg);
    if (!this._isMounted) return;

    const msgObj =
      typeof msg.data == 'string' ? JSON.parse(msg.data) : msg.data;
    const {msg_type, data} = msgObj;

    switch (msg_type) {
      case RTC_COMMANDS.TIMEZONE: // 'timezone':
        console.log('GOND RTCMessage timezone: ', data);
        break;
      case RTC_COMMANDS.TIMELINE: // 'timeline':
        break;
      case RTC_COMMANDS.DAYLIST: // 'daylist':
        break;
      case RTC_COMMANDS.TIMESTAMP: // 'Timestamp':
        let currentTime = null;
        let timestamps = data.time.split('_');
        // console.log('GOND timestamps = ', timestamps, '\n - time 0 = ', dayjs(timestamps[0]* 1000), '\n - time 1 = ', dayjs(timestamps[1]* 1000))
        try {
          currentTime =
            typeof data.time === 'string'
              ? parseInt(data.time.split('_')[timestamps.length - 1])
              : data.time; // get [1] or [last]?
        } catch (err) {
          console.log(
            '%c GOND ! Parse timestamp data error: ',
            'color: red',
            err,
            ' time = ',
            data.time
          );
          return;
        }
        __DEV__ &&
          console.log(
            'GOND on timestamp: ',
            currentTime,
            ', ',
            new Date(currentTime * 1000)
          );

        this.onTimeFrame(currentTime);
        return;
      case RTC_COMMANDS.TEXTOVERLAY: // 'TO':
        // TextOverlay
        return;
      case RTC_COMMANDS.LIVE: // 'live':
        if (this.state.videoLoading) {
          this.setState({
            videoLoading: false,
            canLiveSearch: true,
            StreamStatus:
              data.status == 'OK'
                ? STREAM_STATUS.CONNECTED
                : STREAM_STATUS.ERROR,
            error: data.status == 'OK' ? '' : data.description,
            novideo: false,
          });
        }
        return;
      case RTC_COMMANDS.SEARCH: // 'search':
        this.isScrolling = true;
        if (data.status != 'OK') {
          console.log(
            '%c [GOND] Search.onerror: ',
            'color: red; font-style: italic',
            data.description || 'Unknow error'
          );
          showSnackbarMsg(VIDEO_MESSAGE.MSG_STREAM_ERROR, CMSColors.Danger);
          if (this.state.videoLoading)
            this.setState({
              videoLoading: false,
              novideo: true,
              StreamStatus: STREAM_STATUS.ERROR,
              displayInfo: '',
            });
          return;
        }
        this.fixedpos = true;
        // Video frames are coming, stop videoLoading
        // if(this.isScrolling)
        // USE_TIMESTAMP
        // 	? this._handleScrollTo(this.state.startTs)
        // 	: this._handleScrollTo(this.state.startTime.unix());
        __DEV__ && console.log('GOND PAUSE 3 false');
        this.setState({
          videoLoading: false,
          paused: false,
          canLiveSearch: true,
          StreamStatus: STREAM_STATUS.CONNECTED,
          novideo: false,
        });
        return;
      default:
        console.log(
          '%c [GOND] handleDataChannelMessage, unknow message type: ',
          'color: red; font-style: bold',
          data
        );
        return;
    }
  };

  dataChannelOnError = msg => {
    __DEV__ && console.log('GOND dataChannel onError: ', msg);
    if (!this._isMounted) return;
  };

  dataChannelOnLowBuffer = msg => {
    console.log('[GOND] RTC.dataChannel.onbufferedamountlow: ', msg);
    this.setState({error: VIDEO_MESSAGE.MSG_LOW_BUFFER});
  };

  onTimeFrame = value => {};

  onLayout = event => {
    if (event == null || event.nativeEvent == null || !this._isMounted) return;
    __DEV__ &&
      console.log('GOND RTCPlayer onlayout: ', event.nativeEvent.layout);
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

  render() {
    const {remoteStream, channelName} = this.props.viewer;
    const {width, height} = this.props;
    const {error, videoLoading} = this.state;
    __DEV__ &&
      console.log(
        'GOND RTCPlayer render: ',
        remoteStream && remoteStream.toURL()
      );

    return (
      <View onLayout={this.onLayout}>
        <ImageBackground
          source={NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="stretch">
          {/* <View style={{width: width, height: height}}> */}
          <Text style={styles.channelInfo}>{channelName ?? 'Unknown'}</Text>
          <View style={styles.statusView}>
            <Text style={styles.textMessge}>{error}</Text>
            {videoLoading && (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="large"
                color="white"
              />
            )}
          </View>
          <View style={styles.playerView}>
            {remoteStream ? (
              <RTCView
                streamURL={remoteStream.toURL()}
                objectFit={'cover'}
                style={{width: width, height: height}}
                // width={width}
                // height={height}
                ref={ref => {
                  this.player = ref;
                }}
              />
            ) : null}
          </View>
        </ImageBackground>
      </View>
    );
  }
}

export default inject('videoStore')(observer(RTCStreamingView));
