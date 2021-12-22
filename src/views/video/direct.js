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
import {numberValue} from '../../util/types';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {NATIVE_MESSAGE} from '../../consts/video';
import {CALENDAR_DATE_FORMAT, NVRPlayerConfig} from '../../consts/misc';

import {Login as LoginTxt} from '../../localization/texts'; //'../../localization/texts';
import cmscolors from '../../styles/cmscolors';

import Snackbar from 'react-native-snackbar';

import {
  Video_State,
  Limit_Time_Allow_Change_Live_Search,
  NATURAL_RATIO,
} from '../../consts/video';
import {STREAM_STATUS} from '../../localization/texts';

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
      //   videoLoading: true,
      //   message: '',
      //   noVideo: false,
      width: props.width,
      height: props.height,
      showLoginSuccessFlag: true,
    };
    // should set search time from alert/exception
    this.shouldSetTime = true;
    this.reactions = [];
    this.lastLogin = {userName: '', password: ''};
    this.pauseOnFilterCounter = 0;
    this.lastFrameTime = null;
    this.lastTimestamp = 0;
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
    const {serverInfo} = this.props;

    if (this.ffmpegPlayer && serverInfo) {
      if (
        serverInfo.server.serverIP &&
        serverInfo.server.port // &&
        // !serverInfo.playing
      ) {
        this.props.serverInfo.setStreamStatus({
          isLoading: true,
          connectionStatus: STREAM_STATUS.LOGING_IN,
        });
        this.setNativePlayback();
      } else {
        // this.setState({
        //   message: 'Error: wrong server config',
        //   videoLoading: false,
        // });
        __DEV__ &&
          console.log('GOND Direct connection wrong server config: ', {
            ...serverInfo,
          });
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.ERROR,
        });
      }
    } else {
      __DEV__ &&
        console.log('GOND serverInfo not valid reference: ', {...serverInfo});
    }

    // reactions:
    this.initReactions();
  }

  componentWillUnmount() {
    __DEV__ && console.log('DirectStreamingView componentWillUnmount');
    if (Platform.OS === 'ios') {
      this.nativeVideoEventListener.remove();
    }
    // this.stop();
    this.setNative({disconnect: true}, true);
    this._isMounted = false;
    this.reactions.forEach(unsubsribe => unsubsribe());
  }

  refreshVideo = () => {
    this.setNative({refresh: true}, true);

    this.props.serverInfo.setStreamStatus({
      isLoading: true,
      connectionStatus: STREAM_STATUS.CONNECTING,
    });
    setTimeout(() => this.setNativePlayback(), 500);
  };

  initReactions = () => {
    const {videoStore, singlePlayer} = this.props;

    // this.reactions = [];
    if (singlePlayer) {
      // -- SINGLE MODE
      // __DEV__ && console.log('GOND direct init singlePlayer reactions');
      this.reactions = [
        // ...this.reactions,
        reaction(
          () => videoStore.selectedChannel,
          (newChannelNo, previousValue) => {
            // this.stop();
            __DEV__ &&
              console.log(
                'GOND direct selectedChannel reaction 1: ',
                newChannelNo
              );
            if (/*newChannelNo == null ||*/ previousValue == null) return;
            // this.setNative({refresh: true}, true);

            // this.props.serverInfo.setStreamStatus({
            //   isLoading: true,
            //   connectionStatus: STREAM_STATUS.CONNECTING,
            // });
            // setTimeout(() => this.setNativePlayback(), 1000);
            this.refreshVideo();
          }
        ),
        reaction(
          () => videoStore.hdMode,
          hdMode => {
            // singlePlayer &&
            // this.ffmpegPlayer && this.ffmpegPlayer.setNativeProps({hd: hdMode});
            this.setNative({hd: hdMode});
          }
        ),
        reaction(
          // () => videoStore.isLive,
          () => this.props.isLive,
          (isLive, prevLive) => {
            /*__DEV__ &&
              console.log(
                'GOND Direct switch mode: isLive = ',
                videoStore.isLive,
                ', prop: ',
                this.props.isLive
              );*/
            this.props.serverInfo.setStreamStatus({
              isLoading: true,
              connectionStatus: STREAM_STATUS.CONNECTING,
            });
            this.setNativePlayback(true);
            // }
          }
        ),
        reaction(
          () => videoStore.searchDate,
          (searchDate, prevSearchDate) => {
            // if (singlePlayer) {
            // this.stop();
            if (
              searchDate &&
              prevSearchDate &&
              searchDate.toFormat(CALENDAR_DATE_FORMAT) !=
                prevSearchDate.toFormat(CALENDAR_DATE_FORMAT)
            ) {
              __DEV__ &&
                console.log('GOND direct searchDate changed: ', searchDate);
              this.props.serverInfo.setStreamStatus({
                isLoading: true,
                connectionStatus: STREAM_STATUS.CONNECTING,
              });
              this.setNativePlayback(true);
            }
            // }
          }
        ),
        reaction(
          () => videoStore.paused,
          (paused, prevPaused) => {
            // singlePlayer &&
            this.pause(paused);
          }
        ),
        reaction(
          () => videoStore.noVideo,
          noVideo => {
            const {serverInfo} = this.props;
            if (
              noVideo &&
              serverInfo.connectionStatus != STREAM_STATUS.NOVIDEO
            ) {
              serverInfo.setStreamStatus({
                isLoading: false,
                connectionStatus: STREAM_STATUS.NOVIDEO,
              });
            }
          }
        ),
      ];
    } else {
      // -- MULTIPLAYERS MODE
      this.reactions = [
        reaction(
          () => videoStore.selectedChannel,
          (value, previousValue) => {
            __DEV__ && console.log('GOND direct selectedChannel reaction 2');
            // __DEV__ &&
            //   console.log('GOND directPlayer selectedChannel changed ', previousValue, ' -> ', value);
            // const {serverInfo, singlePlayer} = this.props;
            // if (!singlePlayer) {
            if (value != null && previousValue == null) {
              // if (!singlePlayer) {
              //   this.pause(true);
              // }
              __DEV__ &&
                console.log(
                  'GOND on select Channel from multi: ',
                  value,
                  ' <= ',
                  previousValue
                );
              // this.stop();
              this.setNative({disconnect: true}, true);
            } else if (
              value == null &&
              previousValue != null // ||
              // value == serverInfo.channelNo
            ) {
              // this.pause(false);
              // this.setNativePlayback();
              this.refreshVideo();
            }
            // }
          }
        ),
        reaction(
          () => videoStore.gridLayout,
          () => {
            __DEV__ &&
              console.log(
                'GOND on gridLayout changed: ',
                this.props.serverInfo.channelName
              );
            this.setNative({disconnect: true}, true);
            setTimeout(() => this.setNativePlayback(), 1000);
          }
        ),
        reaction(
          () => videoStore.channelFilter,
          (newFilter, oldFilter) => {
            if (newFilter !== oldFilter) {
              if (this.pauseOnFilterCounter == 0) {
                this.pause(true);
              }
              this.pauseOnFilterCounter++;
              setTimeout(() => {
                this.pauseOnFilterCounter--;
                if (this.pauseOnFilterCounter <= 0) {
                  this.pause(false);
                  this.pauseOnFilterCounter = 0;
                }
              }, 500);
            }
          }
        ),
      ];
    }
  };

  onLoginInfoChanged = (userName, password) => {
    __DEV__ &&
      console.log(
        'DirectStreamingView onLoginInfoChanged: ',
        this.props.videoStore.nvrUser
      );
    this.props.serverInfo.setStreamStatus({
      isLoading: true,
      connectionStatus: STREAM_STATUS.CONNECTING,
    });
    this.setNativePlayback(
      false,
      userName && password ? {userName, password} : undefined
    );
  };

  reconnect = () => {
    this.props.serverInfo.setStreamStatus({
      isLoading: true,
      connectionStatus: STREAM_STATUS.RECONNECTING,
    });
    this.setNativePlayback();
  };

  setNativePlayback = (willPause = false, paramsObject = {}) => {
    const {serverInfo, videoStore, isLive, hdMode} = this.props;
    if (!this._isMounted || !this.ffmpegPlayer || !serverInfo.server) {
      __DEV__ &&
        console.log(
          'GOND direct setNativePlayback failed ',
          this.ffmpegPlayer,
          paramsObject
        );
      return;
    }

    const {searchDateString} = videoStore;
    const playbackInfo = {
      ...serverInfo.playData,
      searchMode: !isLive,
      date: isLive ? undefined : searchDateString,
      hd: hdMode,
      ...paramsObject,
    };

    this.lastLogin = {
      userName: playbackInfo.userName,
      password: playbackInfo.password,
    };
    __DEV__ &&
      console.log(
        'GOND setNativePlayback, info = ',
        playbackInfo,
        '=== sv: ',
        serverInfo
      );
    if (willPause) {
      this.pause();
      setTimeout(() => {
        if (this._isMounted /*&& this.ffmpegPlayer*/ && serverInfo.server) {
          // this.ffmpegPlayer.setNativeProps({
          //   startplayback: playbackInfo,
          // });
          this.setNative({startplayback: playbackInfo});
        }
      }, 500);
    } else {
      // this.ffmpegPlayer.setNativeProps({
      //   startplayback: playbackInfo,
      // });
      this.setNative({startplayback: playbackInfo});
    }
  };

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
    const {
      videoStore,
      serverInfo,
      // searchPlayTime,
      isLive,
      singlePlayer,
      index,
    } = this.props;
    // __DEV__ && console.log('GOND onDirectVideoMessage: ', msgid, ' - ', value);

    switch (msgid) {
      case NATIVE_MESSAGE.CONNECTING:
        // this.setState({message: 'Connecting...'});
        serverInfo.setStreamStatus({
          isLoading: true,
          connectionStatus: STREAM_STATUS.CONNECTING,
        });
        this.break;
      case NATIVE_MESSAGE.CONNECTED:
        __DEV__ && console.log('GOND onDirectVideoMessage: Connected');
        // this.setState({message: 'Connected'});
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.CONNECTED,
        });
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE:
        // this.setState({message: value});
        __DEV__ &&
          console.log('GOND onDirectVideoMessage - Login message: ', value);
        break;
      case NATIVE_MESSAGE.LOGIN_FAILED:
        // this.setState({message: 'Login failed'});
        if (
          serverInfo.userName != this.lastLogin.userName ||
          serverInfo.password != this.lastLogin.password
        ) {
          this.setNativePlayback();
        } else {
          serverInfo.setStreamStatus({
            isLoading: false,
            connectionStatus: STREAM_STATUS.LOGIN_FAILED,
          });
          this.props.videoStore.resetNVRAuthentication();
        }
        if (
          this.lastLogin.userName &&
          this.lastLogin.password &&
          (index == 0 || singlePlayer)
        )
          Snackbar.show({
            text: LoginTxt.errorLoginIncorrect,
            duration: Snackbar.LENGTH_LONG,
            backgroundColor: cmscolors.Danger,
          });
        break;
      case NATIVE_MESSAGE.LOGIN_SUCCCESS:
        __DEV__ && console.log('GOND onDirectVideoMessage: login success');
        videoStore.onLoginSuccess();
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
        if (this.state.showLoginSuccessFlag && (index == 0 || singlePlayer))
          setTimeout(() => {
            Snackbar.show({
              text: LoginTxt.loginSuccess,
              duration: Snackbar.LENGTH_LONG,
              backgroundColor: cmscolors.Success,
            });
            serverInfo.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.CONNECTED,
            });
          }, 500);
        this.setState({showLoginSuccessFlag: false});
        break;
      case NATIVE_MESSAGE.SVR_REJECT_ACCEPT:
        // this.setState({
        //   message: 'Server reject accepted',
        //   videoLoading: false,
        // });
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.SERVER_REJECT,
        });
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE_WRONG_SERVERID:
        // this.setState({message: 'Wrong server ID'});
        __DEV__ && console.log('GOND onDirectVideoMessage: Wrong server ID');
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.WRONG_SERVER,
        });
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE_VIDEO_PORT_ERROR:
        // this.setState({message: 'Video port error'});
        __DEV__ && console.log('GOND onDirectVideoMessage: Video port error');
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.PORT_ERROR,
        });
        break;
      case NATIVE_MESSAGE.CANNOT_CONNECT_SERVER:
        // this.setState({
        //   message: 'Cannot connect to server',
        //   videoLoading: false,
        // });
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.ERROR,
        });
        setTimeout(() => this.reconnect(), 1000);
        break;
      case NATIVE_MESSAGE.ORIENTATION_CHANGED:
        break;
      case NATIVE_MESSAGE.VIEW_CLICK:
        break;
      case NATIVE_MESSAGE.SEARCH_NO_DATA:
        // this.setState({message: 'No video data', noVideo: true});
        __DEV__ &&
          console.log('GOND NOVIDEO, channel: ', serverInfo.channelName);

        if (singlePlayer) {
          __DEV__ && console.log('GOND NOVIDEO, channel: ', serverInfo);
          this.stop();
          serverInfo.setStreamStatus({
            isLoading: false,
            connectionStatus: STREAM_STATUS.NOVIDEO,
          });
        }
        break;
      case NATIVE_MESSAGE.SEARCH_FRAME_TIME:
        if (value) {
          if (
            serverInfo.isLoading ||
            serverInfo.connectionStatus != STREAM_STATUS.DONE
          ) {
            serverInfo.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.DONE,
            });
          }
          if (singlePlayer == true) {
            try {
              const valueObj = JSON.parse(value);
              // if (this.state.videoLoading)
              //   this.setState({
              //     videoLoading: false,
              //     message: '',
              //   });
              __DEV__ &&
                console.log(
                  'GOND direct frame time: ',
                  serverInfo.channelName,
                  valueObj
                );

              if (videoStore.selectedChannel != serverInfo.channelNo) return;

              if (Array.isArray(valueObj) && valueObj.length > 0) {
                this.onFrameTime(valueObj[0]);
              } else
                console.log('GOND direct frame time not valid: ', valueObj);
            } catch {
              console.log('GOND direct frame time not valid: ', valueObj);
            }
          }
        }
        break;
      case NATIVE_MESSAGE.SERVER_CHANGED_CURRENT_USER:
      // break;
      case NATIVE_MESSAGE.SERVER_CHANGED_SERVER_INFO:
      // break;
      case NATIVE_MESSAGE.SERVER_CHANGED_PORTS:
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.CHANGED,
        });
        break;
      case NATIVE_MESSAGE.SERVER_RECORDING_ONLY:
        break;
      case NATIVE_MESSAGE.SERVER_CHANNEL_DISABLE:
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.DISABLED,
        });
        break;
      case NATIVE_MESSAGE.PERMISSION_CHANNEL_DISABLE:
        __DEV__ && console.log('GOND Direct video: PERMISSION_CHANNEL_DISABLE');
        serverInfo.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.NO_PERMISSION,
        });
        break;
      case NATIVE_MESSAGE.RECORDING_DATE:
        if (!singlePlayer || !value || !Array.isArray(value)) {
          __DEV__ &&
            !Array.isArray(value) &&
            console.log('GOND recording dates value is not an array: ', value);
          break;
        }
        videoStore.setRecordingDates(value);
        break;
      case NATIVE_MESSAGE.TIME_DATA:
        if (!singlePlayer) break;

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
            console.log('GOND timeline first time: ', timeData[0].begin);
            try {
              const timestamp = numberValue(timeData[0].begin);
              if (!timestamp) break;
              const beginOfDay = DateTime.fromSeconds(timestamp)
                .toUTC()
                .startOf('day')
                .toFormat(NVRPlayerConfig.RequestTimeFormat);
              if (beginOfDay != videoStore.searchDateString) {
                videoStore.setSearchDate(beginOfDay);
              }
            } catch (err) {
              __DEV__ &&
                console.log('GOND Parse timestamp failed: ', timeData[0]);
            }
          }
          videoStore.setTimeline(timeData);
          if (timeData[0] && timeData[0].timezone) {
            videoStore.setTimezoneOffset(timeData[0].timezone);
          }

          // dongpt: set play time from alert/exception after receiving timeline
          const {searchPlayTimeLuxon} = videoStore;
          this.lastFrameTime = searchPlayTimeLuxon;
          if (!isLive && this.shouldSetTime && searchPlayTimeLuxon) {
            setTimeout(() => {
              if (this._isMounted && this.ffmpegPlayer) {
                const secondsValue =
                  searchPlayTimeLuxon.toSeconds() -
                  searchPlayTimeLuxon.startOf('day').toSeconds();
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
        if (!singlePlayer) break;
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
        console.log('GOND ==^^^== DirectVideo ServerMessage ==^^^==', value);
        break;
      case NATIVE_MESSAGE.SHOULD_RECONNECT:
        __DEV__ && console.log('GOND Request reconnecting from native ...');
        this.reconnect();
        break;
      default:
        break;
    }
  };

  setNative = (params, immediate = false) => {
    const {index, singlePlayer, serverInfo} = this.props;

    // __DEV__ &&
    //   console.log(
    //     'GOND ~~~ direct setnative, idx = ',
    //     index,
    //     singlePlayer,
    //     serverInfo.channelName
    //   );
    if (index && !singlePlayer && !immediate) {
      setTimeout(() => {
        __DEV__ &&
          console.log(
            `GOND ~~~ setnative ${index}, time: ${DateTime.now().toFormat(
              'hh:mm:ss'
            )} `,
            serverInfo.channelName
          );
        this.ffmpegPlayer && this.ffmpegPlayer.setNativeProps(params);
      }, 500 * index);
    } else {
      __DEV__ &&
        console.log(
          `GOND ~~~ setnative in single player`,
          serverInfo.channelName,
          params
        );
      this.ffmpegPlayer && this.ffmpegPlayer.setNativeProps(params);
    }
  };

  stop = () => {
    // if (this.ffmpegPlayer) {
    //   __DEV__ &&
    //     console.log('GOND on direct stop: ', this.props.serverInfo.channelName);
    //   // __DEV__ && console.trace();
    //   this.ffmpegPlayer.setNativeProps({
    //     stop: true,
    //   });
    // }
    __DEV__ && console.log('GOND --- onDisconnect ---');
    this.setNative({stop: true}, true);
  };

  pause = value => {
    const {serverInfo, isLive, videoStore, hdMode} = this.props;

    if (this._isMounted /*&& this.ffmpegPlayer*/ && serverInfo.server) {
      if (value === true || value == undefined) {
        this.setNative({pause: true});
      } else {
        // this.setNative({
        //   startplayback: {
        //     ...serverInfo.playData,
        //     searchMode: !isLive,
        //     date: isLive
        //       ? undefined
        //       : this.lastFrameTime ?? videoStore.searchDateString,
        //     // : videoStore.searchDateString,
        //     hd: hdMode,
        //   },
        // });

        __DEV__ &&
          console.log('GOND unpause this.lastFrameTime = ', this.lastFrameTime);
        if (this.lastFrameTime) {
          this.playAt(
            this.lastFrameTime.toSeconds() -
              this.lastFrameTime.startOf('day').toSeconds()
          );
        } else {
          this.setNative({
            startplayback: {
              ...serverInfo.playData,
              searchMode: !isLive,
              hd: hdMode,
            },
          });
        }
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
      this.lastTimestamp = 0;
      // setTimeout(() => this.ffmpegPlayer && this.pause(false), 200);
    } else {
      __DEV__ && console.log('GOND direct playAt ffmpegPlayer not available!');
    }
  };

  onFrameTime = frameTime => {
    const {videoStore} = this.props;
    const {timestamp, value} = frameTime;
    // if (timestamp <= this.lastTimestamp) return;
    this.lastTimestamp = timestamp;

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
      // __DEV__ && console.log('GOND direct frame time : ', frameTime);
      videoStore.setDisplayDateTime(date && time ? date + ' - ' + time : value);

      const frameTime = DateTime.fromFormat(
        value,
        Platform.OS == 'android'
          ? NVRPlayerConfig.ResponseTimeFormat
          : NVRPlayerConfig.RequestTimeFormat,
        {zone: 'utc'}
      ).toSeconds();
      videoStore.setFrameTime(frameTime);
      this.lastFrameTime = DateTime.fromFormat(
        value,
        NVRPlayerConfig.ResponseTimeFormat,
        {zone: videoStore.timezone}
      );
      // this.lastFrameTime =
      // Platform.OS == 'android'
      //   ? DateTime.fromFormat(value, NVRPlayerConfig.ResponseTimeFormat).toFormat(NVRPlayerConfig.RequestTimeFormat)
      //   : value;
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
    const {width, height, serverInfo, noVideo, videoStore} = this.props;
    // const {message, videoLoading, noVideo} = this.state;
    const {connectionStatus, isLoading} = serverInfo;
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
          resizeMode="cover">
          {/* <View style={{width: width, height: height}}> */}
          <Text
            style={[
              styles.channelInfo,
              {
                top: videoStore.isFullscreen ? '10%' : 0,
              },
            ]}>
            {serverInfo.channelName ?? 'Unknown'}
          </Text>
          <View style={styles.statusView}>
            <View style={styles.textContainer}>
              <Text style={[styles.textMessage]}>{connectionStatus}</Text>
            </View>
            {isLoading && (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="large"
                color="white"
              />
            )}
          </View>
          {/* {noVideo ? null : ( */}
          <View
            style={[styles.playerView, {zIndexn: noVideo ? -1 : undefined}]}>
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
          {/* )} */}
          {/* </View> */}
        </ImageBackground>
      </View>
    );
  }
}

export default inject('videoStore')(observer(DirectVideoView));
