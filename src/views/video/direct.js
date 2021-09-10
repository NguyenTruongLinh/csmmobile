import React from 'react';
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
import {reaction} from 'mobx';
import {DateTime} from 'luxon';

import FFMpegFrameView from '../../components/native/videonative';
import FFMpegFrameViewIOS from '../../components/native/videoios';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {NATIVE_MESSAGE} from '../../consts/video';
import {CALENDAR_DATE_FORMAT, NVRPlayerConfig} from '../../consts/misc';

import {
  Video_State,
  Limit_Time_Allow_Change_Live_Search,
  NATURAL_RATIO,
} from '../../consts/video';

class DirectVideoView extends React.Component {
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
    // should set search time from alert/exception
    this.shouldSetTime = true;
  }

  componentDidMount() {
    this._isMounted = true;
    __DEV__ &&
      console.log(
        'DirectStreamingView componentDidMount , islive:',
        this.props.serverInfo
      );
    if (Platform.OS === 'ios') {
      const eventEmitter = new NativeEventEmitter(
        NativeModules.FFMpegFrameEventEmitter
      );
      this.nativeVideoEventListener = eventEmitter.addListener(
        'onFFMPegFrameChange',
        this.onNativeMessage
      );
    }
    const {serverInfo, isLive, hdMode, videoStore, searchPlayTime} = this.props;

    if (this.ffmpegPlayer && serverInfo) {
      if (
        serverInfo.server.serverIP &&
        serverInfo.server.port // &&
        // !serverInfo.playing
      ) {
        // if (!isLive && searchPlayTime) {
        //   const searchTime = DateTime.fromISO(videoStore.searchPlayTime, {
        //     zone: 'utc',
        //   }).toFormat(NVRPlayerConfig.RequestTimeFormat);
        //   this.setNativePlayback({date: searchTime});
        // } else
        this.setNativePlayback();
      } else {
        this.setState({
          message: 'Error: wrong server config',
          videoLoading: false,
        });
      }
    } else {
      __DEV__ &&
        console.log('GOND serverInfo not valid reference: ', {...serverInfo});
    }

    // reactions:
    // this.unsubscribeReaction = reaction(
    //   () => videoStore.searchDateString,
    //   (value, previousValue) => {
    //     __DEV__ &&
    //       console.log('GOND searchDate changed ', previousValue, ' -> ', value);
    //     if (value && !previousValue) {
    //       this.pause();
    //       setTimeout(() => this.setNativePlayback(), 1000);
    //     }
    //   }
    // );
  }

  componentWillUnmount() {
    __DEV__ && console.log('DirectStreamingView componentWillUnmount');
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    if (Platform.OS === 'ios') {
      this.nativeVideoEventListener.remove();
    }
    this.ffmpegPlayer && this.ffmpegPlayer.setNativeProps({stop: true});
    this._isMounted = false;
    // this.unsubscribeReaction();
  }

  componentDidUpdate(prevProps) {
    if (!this._isMounted) return;
    const prevServerInfo = prevProps.serverInfo;
    const {serverInfo, hdMode, isLive, searchDate, searchPlayTime, videoStore} =
      this.props;
    if (!serverInfo || Object.keys(serverInfo).length == 0) return;

    // __DEV__ &&
    //   console.log(
    //     'GOND DirectPlayer did update, prevServerInfo = ',
    //     prevServerInfo,
    //     '\n - serverInfo = ',
    //     serverInfo
    //   );

    try {
      if (this.ffmpegPlayer && serverInfo) {
        let willPlayback = false;
        if (
          // JSON.stringify({...prevServerInfo.playData}) !=
          // JSON.stringify({...serverInfo.playData})
          prevServerInfo.playData.userName != serverInfo.playData.userName ||
          prevServerInfo.playData.password != serverInfo.playData.password ||
          prevServerInfo.playData.channelNo != serverInfo.playData.channelNo ||
          prevServerInfo.playData.kChannel != serverInfo.playData.kChannel
        ) {
          this.setState({message: ''});
          __DEV__ &&
            console.log('GOND DirectPlayer login ... ', {
              ...serverInfo,
            });
          willPlayback = true;
        }
        // if (pause != prevProps.pause) {
        //   this.ffmpegPlayer.setNativeProps({pause: pause});
        // }
        if (hdMode != prevProps.hdMode) {
          this.ffmpegPlayer.setNativeProps({hd: true});
        }

        if (isLive != prevProps.isLive) {
          __DEV__ &&
            console.log(
              'GOND direct switch mode : ',
              isLive ? 'live' : 'search',
              videoStore.searchDateString
            );
          willPlayback = true;
        }
        if (searchDate != prevProps.searchDate) {
          __DEV__ &&
            console.log(
              'GOND searchDate changed ',
              prevProps.searchDate,
              ' -> ',
              searchDate
            );
          willPlayback = true;
        }

        // Finally:
        if (willPlayback) {
          this.pause();
          setTimeout(() => {
            this.setNativePlayback();
          }, 1000);
        }
      }
    } catch (err) {
      __DEV__ && console.log('GOND update playback failed: ', err);
    }
  }

  setNativePlayback(paramsObject) {
    if (!this._isMounted || !this.ffmpegPlayer) {
      __DEV__ &&
        console.log('GOND direct setNativePlayback failed ', this.ffmpegPlayer);
      return;
    }
    const {serverInfo, videoStore} = this.props;
    const playbackInfo = {
      ...serverInfo.playData,
      searchMode: !videoStore.isLive,
      date: videoStore.isLive ? undefined : videoStore.searchDateString,
      hd: videoStore.hdMode,
      ...paramsObject,
    };
    __DEV__ && console.log('GOND setNativePlayback, info = ', playbackInfo);
    this.ffmpegPlayer.setNativeProps({
      startplayback: playbackInfo,
      // fullscreen: 1,
    });
  }

  onNativeMessage = event => {
    let {msgid, value} = event; //.nativeEvent;
    // __DEV__ &&
    //   console.log('GOND onFFMpegFrameChange event = ', event.nativeEvent);
    if (util.isNullOrUndef(msgid) && util.isNullOrUndef(value)) {
      if (event.nativeEvent) {
        msgid = event.nativeEvent.msgid;
        value = event.nativeEvent.value;
      } else {
        console.log('GOND onReceiveNativeEvent parse failed, event = ', event);
        return;
      }
    }

    setTimeout(() => {
      this._isMounted && this.onVideoMessage(msgid, value);
    }, 100);
  };

  onVideoMessage = (msgid, value) => {
    const {videoStore, serverInfo, searchPlayTime} = this.props;
    // __DEV__ && console.log('GOND onDirectVideoMessage: ', msgid, ' - ', value);

    switch (msgid) {
      case NATIVE_MESSAGE.CONNECTING:
        this.setState({message: 'Connecting...'});
        break;
      case NATIVE_MESSAGE.CONNECTED:
        __DEV__ && console.log('GOND onDirectVideoMessage: Connected');
        this.setState({message: 'Connected'});
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE:
        this.setState({message: value});
        break;
      case NATIVE_MESSAGE.LOGIN_FAILED:
        this.setState({message: 'Login failed'});
        this.props.videoStore.resetNVRAuthentication();
        break;
      case NATIVE_MESSAGE.LOGIN_SUCCCESS:
        __DEV__ && console.log('GOND onDirectVideoMessage: login success');
        // this.props.videoStore.onLoginSuccess();
        // if (!videoStore.isLive && searchPlayTime) {
        //   setTimeout(() => {
        //     if (this._isMounted && this.ffmpegPlayer) {
        //       const searchTime = DateTime.fromISO(videoStore.searchPlayTime, {
        //         zone: 'utc',
        //       });
        //       const secondsValue =
        //         searchTime.toSeconds() - searchTime.startOf('day').toSeconds();
        //       __DEV__ &&
        //         console.log('GOND on play search at time: ', secondsValue);
        //       this.playAt(secondsValue);
        //     }
        //   }, 100);
        // }
        break;
      case NATIVE_MESSAGE.SVR_REJECT_ACCEPT:
        this.setState({
          message: 'Server reject accepted',
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
          try {
            const valueObj = JSON.parse(value);
            if (this.state.videoLoading)
              this.setState({
                videoLoading: false,
                message: '',
              });
            if (videoStore.selectedChannel != serverInfo.channelNo) return;

            if (Array.isArray(valueObj) && valueObj.length > 0) {
              this.onFrameTime(valueObj[0]);
            } else console.log('GOND direct frame time not valid: ', valueObj);
          } catch {
            console.log('GOND direct frame time not valid: ', valueObj);
          }
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
        if (!value || !Array.isArray(value)) {
          __DEV__ &&
            console.log('GOND recording dates value is not an array: ', value);
          return;
        }
        videoStore.setRecordingDates(value);
        break;
      case NATIVE_MESSAGE.TIME_DATA:
        let timeData = null;
        try {
          timeData = JSON.parse(value);
        } catch (err) {
          __DEV__ && console.log('GOND parse timeline data failed: ', value);
        }
        if (!timeData || !Array.isArray(timeData)) {
          __DEV__ && console.log('GOND timeline data is not an array: ', value);
          return;
        }
        this.timeInterval = timeData;
        console.log('GOND timeline: ', timeData);
        if (timeData && Array.isArray) {
          if (timeData[0] && timeData[0].begin) {
            const beginOfDay = DateTime.fromSeconds(timeData[0].begin)
              .toUTC()
              .startOf('day')
              .toFormat(NVRPlayerConfig.RequestTimeFormat);
            if (beginOfDay != videoStore.searchDateString) {
              videoStore.setSearchDate(beginOfDay);
            }
          }
          videoStore.setTimeline(timeData);
          if (timeData[0] && timeData[0].timezone) {
            videoStore.setTimezone(timeData[0].timezone);
          }

          // dongpt: set play time from alert/exception after receiving timeline
          if (!videoStore.isLive && this.shouldSetTime && searchPlayTime) {
            setTimeout(() => {
              if (this._isMounted && this.ffmpegPlayer) {
                const searchTime = DateTime.fromISO(searchPlayTime, {
                  zone: 'utc',
                });
                const secondsValue =
                  searchTime.toSeconds() -
                  searchTime.startOf('day').toSeconds();
                __DEV__ &&
                  console.log(
                    'GOND Direct on play search at time: ',
                    secondsValue
                  );
                this.playAt(secondsValue);
              }
            }, 100);
            this.shouldSetTime = false;
          }
        }
        break;
      case NATIVE_MESSAGE.HOUR_DATA:
        __DEV__ && console.log('GOND HOUR_DATA: ', value);
        const data = JSON.parse(value);
        if (data && Array.isArray(data)) {
          const {hoursofDay, hourSpecial} = data[0];
          videoStore.setHoursOfDay(hoursofDay);
          videoStore.setDSTHour(hourSpecial);
        } else {
          __DEV__ && console.log('GOND HOUR_DATA is not valid: ', value);
        }
        break;
      case NATIVE_MESSAGE.RULER_DST:
        __DEV__ && console.log('GOND RULER_DST: ', value);
        break;
      case NATIVE_MESSAGE.UNKNOWN:
        break;
      case NATIVE_MESSAGE.SERVER_MESSAGE:
        break;
      default:
        break;
    }
  };

  stop = () => {
    if (this.ffmpegPlayer) {
      this.ffmpegPlayer.setNativeProps({
        stop: true,
      });
    }
  };

  pause = value => {
    if (this.ffmpegPlayer) {
      if (value === true || value == undefined)
        this.ffmpegPlayer.setNativeProps({
          pause: true,
        });
      else {
        const {serverInfo, isLive, videoStore, hdMode} = this.props;
        this.ffmpegPlayer.setNativeProps({
          startplayback: {
            ...serverInfo.playData,
            searchMode: !isLive,
            date: isLive ? '' : videoStore.searchDateString,
            hd: hdMode,
          },
        });
      }
    }
  };

  /**
   *
   * @param {number} value : number of seconds from beginning of day
   */
  playAt = value => {
    // const localValue = value - this.props.videoStore.directTimeDiff;
    __DEV__ && console.log('GOND direct playAt: ', value);
    if (this.ffmpegPlayer) {
      this.ffmpegPlayer.setNativeProps({
        seekpos: {pos: value, hd: this.props.videoStore.hdMode},
      });
      // setTimeout(() => this.ffmpegPlayer && this.pause(false), 200);
    } else {
      __DEV__ && console.log('GOND direct playAt ffmpegPlayer not available!');
    }
  };

  onFrameTime = frameTime => {
    const {videoStore} = this.props;
    const {timestamp, value} = frameTime;
    if (value) {
      let [date, time] = value.split(' ');
      time = time ? time.split('.')[0] : '';

      // const formatedDate = date + ' 00:00:00';
      // console.log(
      //   'GOND timeframe date = ',
      //   formatedDate,
      //   ', search date = ',
      //   videoStore.searchDateString
      // );
      // if (formatedDate != videoStore.searchDateString) {
      //   videoStore.setSearchDate(formatedDate);
      // }
      __DEV__ && console.log('GOND direct frame time : ', frameTime);
      videoStore.setDisplayDateTime(date && time ? date + ' - ' + time : value);
      videoStore.setFrameTime(value, 'utc');
      // const timeDiff =
      //   timestamp -
      //   DateTime.fromFormat(value, NVRPlayerConfig.ResponseTimeFormat, {
      //     zone: 'utc',
      //   }).toSeconds();
      // __DEV__ && console.log('GOND direct time diff: ', timeDiff);
      // videoStore.setDirectTimeDiff(timeDiff);
    } else console.log('GOND direct frame time value not valid: ', frameTime);
  };

  onLayout = event => {
    if (event == null || event.nativeEvent == null) return;
    // __DEV__ &&
    //   console.log('GOND directplayer onlayout: ', event.nativeEvent.layout);
    let {width, height} = event.nativeEvent.layout;
    setTimeout(() => {
      if (!this._isMounted) return;

      if (width <= height) {
        const videoRatio = width / height;
        if (videoRatio !== NATURAL_RATIO) {
          // height = parseInt((width * 9) / 16);
          width = parseInt((height * 16) / 9);
          //console.log( _height);
        }
      }
      this.setState({
        // controller: false,
        // fullscreen: true,
        width: width,
        height: height,
        status: '',
      });
    }, 100);
  };

  render() {
    const {width, height, serverInfo} = this.props;
    const {message, videoLoading, noVideo} = this.state;
    // __DEV__ &&
    //   console.log('GOND direct render channel: ', serverInfo.channelName);

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
                width={this.state.width} // {this.state.width}
                height={this.state.height} // {this.state.height}
                ref={ref => {
                  this.ffmpegPlayer = ref;
                }}
                onFFMPegFrameChange={this.onNativeMessage}
              />
            ) : (
              <FFMpegFrameView
                iterationCount={1}
                width={width}
                height={height}
                ref={ref => {
                  this.ffmpegPlayer = ref;
                }}
                onFFMPegFrameChange={this.onNativeMessage}
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
