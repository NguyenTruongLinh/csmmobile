import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  Dimensions,
  Platform,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  ActivityIndicator,
} from 'react-native';

import {inject, observer} from 'mobx-react';

import FFMpegFrameView from '../../components/native/videonative';
import FFMpegFrameViewIOS from '../../components/native/videoios';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {NATIVE_MESSAGE} from '../../consts/video';

import {
  Video_State,
  Limit_Time_Allow_Change_Live_Search,
  NATURAL_RATIO,
} from '../../consts/video';

class DirectVideoView extends Component {
  static defaultProps = {
    enableSwitchChannel: true,
    serverInfo: {},
  };

  constructor(props) {
    super(props);

    this.nativeVideoEventListener = null;
    this.ffmpegPlayer = null;

    this.state = {
      videoLoading: true,
      message: '',
      noVideo: false,
    };
  }

  componentDidMount() {
    __DEV__ && console.log('DirectStreamingView componentDidMount');
    if (Platform.OS === 'ios') {
      const eventEmitter = new NativeEventEmitter(
        NativeModules.FFMpegFrameEventEmitter
      );
      this.nativeVideoEventListener = eventEmitter.addListener(
        'onFFMPegFrameChange',
        this.onChange
      );
    }
    const {serverInfo} = this.props;

    if (this.ffmpegPlayer && serverInfo) {
      if (serverInfo.serverIP && serverInfo.port)
        this.ffmpegPlayer.setNativeProps({startplayback: serverInfo});
      else
        this.setState({
          message: 'Error: wrong server config',
          videoLoading: false,
        });
    }
  }

  componentWillUnmount() {
    __DEV__ && console.log('DirectStreamingView componentWillUnmount');
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    if (Platform.OS === 'ios') {
      this.nativeVideoEventListener.remove();
    }
  }

  componentDidUpdate(prevProps) {
    const prevServerInfo = prevProps.serverInfo;
    const {serverInfo} = this.props;

    // __DEV__ &&
    //   console.log(
    //     'GOND DirectPlayer did update, prevServerInfo = ',
    //     prevServerInfo,
    //     '\n - serverInfo = ',
    //     serverInfo
    //   );

    try {
      if (
        this.ffmpegPlayer &&
        JSON.stringify(prevServerInfo) != JSON.stringify(serverInfo)
      ) {
        __DEV__ &&
          console.log(
            'GOND DirectPlayer did update, startplayback = ',
            serverInfo
          );
        this.ffmpegPlayer.setNativeProps({startplayback: serverInfo});
      }
    } catch (err) {
      __DEV__ && console.log('GOND parseJSON error: ', err);
    }
  }

  onFrameChange = event => {
    let {msgid, value} = event; //.nativeEvent;
    console.log('GOND onFFMpegFrameChange event = ', event.nativeEvent);
    if (util.isNullOrUndef(msgid) && util.isNullOrUndef(value)) {
      if (event.nativeEvent) {
        msgid = event.nativeEvent.msgid;
        value = event.nativeEvent.value;
      } else {
        console.log('GOND onReceiveNativeEvent parse failed, event = ', event);
        return;
      }
    }
    // console.log('GOND onFFMpegFrameChange, id = ', msgid, ' , val = ', value)
    setTimeout(() => {
      this.onVideoMessage(msgid, value);
    }, 100);
  };

  onVideoMessage = (msgid, value) => {
    console.log('GOND onDirectVideoMessage: ', msgid, ' - ', value);
    switch (msgid) {
      case NATIVE_MESSAGE.CONNECTING:
        this.setState({message: 'Connecting...'});
        break;
      case NATIVE_MESSAGE.CONNECTED:
        this.setState({videoLoading: false, message: ''});
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE:
        this.setState({message: value});
        break;
      case NATIVE_MESSAGE.LOGIN_FAILED:
        this.setState({message: 'Login failed'});
        this.props.videoStore.resetNVRAuthentication();
        break;
      case NATIVE_MESSAGE.LOGIN_SUCCCESS:
        console.log('GOND onDirectVideoMessage: ', msgid, ' - ', value);
        break;
      case NATIVE_MESSAGE.SVR_REJECT_ACCEPT:
        this.setState({
          message: 'Cannot connect to server',
          videoLoading: false,
        });
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE_WRONG_SERVERID:
        this.setState({message: 'Wrong server ID'});
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE_VIDEO_PORT_ERROR:
        this.setState({message: 'Video port error'});
        break;
      case NATIVE_MESSAGE.CANNOT_CONNECT_SERVER:
        this.setState({
          message: 'Cannot connect to server',
          videoLoading: false,
        });
        break;
      case NATIVE_MESSAGE.ORIENTATION_CHANGED:
        break;
      case NATIVE_MESSAGE.VIEW_CLICK:
        break;
      case NATIVE_MESSAGE.SEARCH_NO_DATA:
        this.setState({message: 'No video data', noVideo: true});
        break;
      case NATIVE_MESSAGE.SEARCH_FRAME_TIME:
        if (value) {
          const valueObj = JSON.parse(value);
          this.setState({
            videoLoading: false,
          });
          if (Array.isArray(valueObj) && valueObj.length > 0)
            this.onFrameTime(valueObj[0]);
          else console.log('GOND direct frame time not valid: ', valueObj);
        }
        break;
      case NATIVE_MESSAGE.SERVER_CHANGED_CURRENT_USER:
        break;
      case NATIVE_MESSAGE.SERVER_CHANGED_SERVER_INFO:
        break;
      case NATIVE_MESSAGE.SERVER_CHANGED_PORTS:
        break;
      case NATIVE_MESSAGE.SERVER_RECORDING_ONLY:
        break;
      case NATIVE_MESSAGE.SERVER_CHANNEL_DISABLE:
        break;
      case NATIVE_MESSAGE.PERMISSION_CHANNEL_DISABLE:
        break;
      case NATIVE_MESSAGE.RECORDING_DATE:
        break;
      case NATIVE_MESSAGE.TIME_DATA:
        break;
      case NATIVE_MESSAGE.HOUR_DATA:
        break;
      case NATIVE_MESSAGE.RULER_DST:
        break;
      case NATIVE_MESSAGE.UNKNOWN:
        break;
      case NATIVE_MESSAGE.SERVER_MESSAGE:
        break;
      default:
        break;
    }
  };

  onFrameTime = frameTime => {
    const {videoStore} = this.props;
    const {timestamp, value} = frameTime;
    if (value) {
      let formated = value.split(' ')[1];
      formated = formated ? formated.split('.')[0] : value;
      videoStore.setFrameTime(formated);
    } else console.log('GOND direct frame time value not valid: ', frameTime);
  };

  onLayout = event => {
    if (event == null || event.nativeEvent == null) return;
    // __DEV__ &&
    //   console.log('GOND directplayer onlayout: ', event.nativeEvent.layout);
    let {width, height} = event.nativeEvent.layout;
    setTimeout(() => {
      if (width <= height) {
        const videoRatio = width / height;
        if (videoRatio !== NATURAL_RATIO) {
          height = parseInt((width * 9) / 16);
          //console.log( _height);
        }
        this.setState({
          fullscreen: false,
          width: width,
          height: height,
          status: '',
        });
      } else {
        this.setState({
          // controller: false,
          fullscreen: true,
          width: width,
          height: height,
          status: '',
        });
      }
    }, 100);
  };

  render() {
    const {width, height, serverInfo} = this.props;
    const {message, videoLoading, noVideo} = this.state;

    return (
      <View
        onLayout={this.onLayout}
        // {...this.props}
      >
        <ImageBackground
          source={NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="stretch">
          {/* <View style={{width: width, height: height}}> */}
          <Text style={styles.channelInfo}>
            {serverInfo.channelName ?? 'Unknown'}
          </Text>
          <View style={styles.statusView}>
            <Text style={styles.textMessge}>{message}</Text>
            {videoLoading && (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="large"
                color="white"
              />
            )}
          </View>
          <View style={styles.playerView}>
            {Platform.OS === 'ios' ? (
              <FFMpegFrameViewIOS
                width={width}
                height={height}
                ref={ref => {
                  this.ffmpegPlayer = ref;
                }}
                onFFMPegFrameChange={this.onFrameChange}
              />
            ) : (
              <FFMpegFrameView
                iterationCount={1}
                width={width}
                height={height}
                ref={ref => (this.ffmpegPlayer = ref)}
                onFFMPegFrameChange={this.onFrameChange}
              />
            )}
          </View>
          {/* </View> */}
        </ImageBackground>
      </View>
    );
  }
}

export default inject('videoStore')(observer(DirectVideoView));
