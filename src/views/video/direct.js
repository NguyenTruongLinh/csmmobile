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
import {isAlive} from 'mobx-state-tree';
import {reaction} from 'mobx';
import {DateTime} from 'luxon';

import {
  PinchGestureHandler,
  GestureDetector,
  Gesture,
  Directions,
} from 'react-native-gesture-handler';

import FFMpegFrameView from '../../components/native/videonative';
import FFMpegFrameViewIOS from '../../components/native/videoios';
import CMSImage from '../../components/containers/CMSImage';

import util from '../../util/general';
import {numberValue} from '../../util/types';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {NATIVE_MESSAGE} from '../../consts/video';
import {CALENDAR_DATE_FORMAT, NVRPlayerConfig} from '../../consts/misc';

import {Login as LoginTxt, VIDEO as VIDEO_TXT} from '../../localization/texts'; //'../../localization/texts';
import cmscolors from '../../styles/cmscolors';

import snackbarUtil from '../../util/snackbar';

import {
  Video_State,
  Limit_Time_Allow_Change_Live_Search,
  NATURAL_RATIO,
  DIRECT_MAX_OLD_FRAME_SKIP,
} from '../../consts/video';
import {STREAM_STATUS} from '../../localization/texts';
const MAX_ZOOM = 10;

class DirectVideoView extends React.Component {
  static defaultProps = {
    enableSwitchChannel: true,
    serverInfo: {},
  };

  constructor(props) {
    super(props);

    this.state = {
      width: props.width,
      height: props.height,
      showLoginSuccessFlag: true,
      zoom: 1,
      translateX: 0,
      translateY: 0,
      // isFilterShown: false,
    };

    this.nativeVideoEventListener = null;
    this.ffmpegPlayer = null;
    // should set search time from alert/exception
    this.shouldSetTime = true;
    this.reactions = [];
    this.lastLogin = {userName: '', password: ''};
    this.pauseOnFilterCounter = 0;
    this.lastFrameTime = null;
    this.lastTimestamp = 0;
    this.isPlaying = false;
    this.pendingCommand = null;
    // this.isViewable = false;
    this.noPermission = false;
    this.savedPos = null;
    this.didSubmitLogin = false;
    this.newSeekPos = 0;
    this.oldPos = 0;
    this.dateChanged = false;
    this.loginTimeout = null;
    this.oldFrameSkipped = 0;
    const tapGesture = Gesture.Tap().onStart(_e => {
      __DEV__ &&
        console.log(
          `Gesture.Tap() originFocalX = `,
          this.computeOriginFocal(_e.x, this.state.translateX)
        );
      props.onPress && props.onPress();
      // this.setState({isFilterShown: !this.state.isFilterShown});
    });

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
          this.state.translateX
        );
        this.originFocalY = this.computeOriginFocal(
          e.focalY,
          this.state.translateY
        );
      })
      .onUpdate(e => {
        let newZoom = this.curZoom * e.scale;
        if (newZoom > 1 && newZoom < MAX_ZOOM) {
          this.setState({zoom: newZoom});
          let translateX = this.computeTranslatePos(newZoom, this.originFocalX);
          let translateY = this.computeTranslatePos(newZoom, this.originFocalY);
          this.setState({
            translateX,
            translateY,
          });
        }
      });

    this.composed = Gesture.Race(
      pinchGesture,
      tapGesture,
      rightFlingGesture,
      leftFlingGesture
      // this.panGesture
    );
  }

  computeOriginFocal(zoomedFocal, translate) {
    return (zoomedFocal - translate) / this.state.zoom;
  }

  computeTranslatePos(zoom, pos) {
    return (1 - zoom) * pos;
  }

  resetZoom = () => {
    __DEV__ && console.log(` resetZoom `);
    this.setState({zoom: 1, translateX: 0, translateY: 0});
  };

  componentDidMount() {
    this._isMounted = true;
    __DEV__ && console.log('DirectStreamingView componentDidMount');
    if (Platform.OS === 'ios') {
      const eventEmitter = new NativeEventEmitter(
        NativeModules.FFMpegFrameEventEmitter
      );
      this.nativeVideoEventListener = eventEmitter.addListener(
        'onFFMPegFrameChange',
        this.onNativeMessage
      );
    }
    const {serverInfo, videoStore} = this.props;
    // __DEV__ && console.log('DirectStreamingView: ', videoStore.selectedChannel);

    if (videoStore.isAuthenticated) {
      if (serverInfo && serverInfo.serverIP && serverInfo.port) {
        this.props.serverInfo.setStreamStatus({
          isLoading: true,
          // connectionStatus: STREAM_STATUS.LOGING_IN,
        });
        snackbarUtil.showToast(STREAM_STATUS.LOGING_IN, cmscolors.Success);
        this.setNativePlayback();
      } else {
        __DEV__ &&
          console.log('GOND Direct connection wrong server config: ', {
            ...serverInfo,
          });
        serverInfo.setStreamStatus({
          isLoading: false,
          // connectionStatus: STREAM_STATUS.ERROR,
        });
        snackbarUtil.showToast(STREAM_STATUS.ERROR, cmscolors.Danger);
      }
    } else {
      __DEV__ &&
        console.log(
          'GOND serverInfo not valid reference, or not logged in yet: ',
          {...serverInfo}
        );
    }

    // reactions:
    this.initReactions();
  }

  componentWillUnmount() {
    // __DEV__ &&
    //   console.log(
    //     'DirectStreamingView componentWillUnmount: ',
    //     this.props.serverInfo.channelName
    //   );
    if (Platform.OS === 'ios') {
      this.nativeVideoEventListener.remove();
    }
    const {serverInfo, singlePlayer} = this.props;
    if (singlePlayer && isAlive(serverInfo)) {
      serverInfo.setStreamStatus({
        isLoading: false,
        connectionStatus: STREAM_STATUS.DONE,
      });
    }

    // this.setNative({disconnect: true}, true);
    this.stop(true);
    this._isMounted = false;
    this.reactions.forEach(unsubsribe => unsubsribe());
  }

  refreshVideo = () => {
    this.setNative({refresh: true}, true);

    // this.props.serverInfo.setStreamStatus({
    //   isLoading: true,
    //   connectionStatus: STREAM_STATUS.CONNECTING,
    // });
    // snackbarUtil.showToast(STREAM_STATUS.CONNECTING, cmscolors.Success);
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
            if (newChannelNo == null || previousValue == null) return;
            this.props.serverInfo.setStreamStatus({
              isLoading: true,
            });
            // snackbarUtil.showToast(STREAM_STATUS.LOGING_IN, cmscolors.Success);
            // this.setNativePlayback(false, {channels: '' + newChannelNo});
            setTimeout(
              () =>
                this.setNativePlayback(false, {channels: '' + newChannelNo}),
              500
            );
          }
        ),
        // reaction(
        //   () => videoStore.hdMode,
        //   hdMode => {
        //     // singlePlayer &&
        //     // this.ffmpegPlayer && this.ffmpegPlayer.setNativeProps({hd: hdMode});
        //     if (this.props.isLive) this.setNative({hd: hdMode});
        //     else {
        //       this.pause();
        //       setTimeout(
        //         () =>
        //           this.playAt(
        //             this.lastFrameTime
        //               ? this.lastFrameTime.toSeconds() -
        //                   this.lastFrameTime.startOf('day').toSeconds()
        //               : 0
        //           ),
        //         200
        //       );
        //     }
        //   }
        // ),
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
              // connectionStatus: STREAM_STATUS.CONNECTING,
            });
            snackbarUtil.showToast(STREAM_STATUS.CONNECTING, cmscolors.Success);
            if (this.noPermission) {
              this.noPermission = false;
              this.stop();
              // setTimeout(() => this.setNativePlayback(), 500);
            } else {
              // this.refreshVideo();
              this.setNative({pause: true});
              // setTimeout(() => this.setNativePlayback(), 500);
            }
            // this.setNativePlayback(true);
            setTimeout(() => this.setNativePlayback(), 500);
            // }
          }
        ),
        reaction(
          () => videoStore.searchDate,
          (searchDate, prevSearchDate) => {
            // if (singlePlayer) {
            // this.stop();
            if (
              searchDate && //!prevSearchDate ||
              prevSearchDate &&
              searchDate.toFormat(CALENDAR_DATE_FORMAT) !=
                prevSearchDate.toFormat(CALENDAR_DATE_FORMAT)
            ) {
              __DEV__ &&
                console.log('GOND direct searchDate changed: ', searchDate);
              this.props.serverInfo.setStreamStatus({
                isLoading: true,
                // connectionStatus: STREAM_STATUS.CONNECTING,
              });
              snackbarUtil.showToast(
                STREAM_STATUS.CONNECTING,
                cmscolors.Success
              );
              this.setNativePlayback(true);
            }
            // }
          }
        ),
        // reaction(
        //   () => videoStore.paused,
        //   (paused, prevPaused) => {
        //     // singlePlayer &&
        //     this.pause(paused);
        //   }
        // ),
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
              // Snackbar.show({
              //   text: STREAM_STATUS.NOVIDEO,
              //   duration: Snackbar.LENGTH_LONG,
              //   backgroundColor: cmscolors.Success,
              // });
            }
          }
        ),
        // reaction(
        //   () => videoStore.beginSearchTime,
        //   beginSearchTime => {
        //     if (beginSearchTime) {
        //       __DEV__ &&
        //         console.log('DirectStreamingView on searchPlayTime changed');
        //       this.playAt(
        //         beginSearchTime.toSeconds() -
        //           beginSearchTime.startOf('day').toSeconds()
        //       );
        //       // videoStore.setBeginSearchTime(null);
        //     }
        //   }
        // ),
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
            if (value != null && previousValue == null) {
              __DEV__ &&
                console.log(
                  'GOND on select Channel from multi: ',
                  value,
                  ' <= ',
                  previousValue
                );
              this.stop();
            } else if (
              value == null &&
              previousValue != null // ||
              // value == serverInfo.channelNo
            ) {
              // this.pause(false);
              this.refreshVideo();
            }
            // }
          }
        ),
        /*
        reaction(
          () => videoStore.gridLayout,
          () => {
            __DEV__ &&
              console.log(
                'GOND on gridLayout changed: ',
                this.props.serverInfo.channelName
              );
            // this.setNative({disconnect: true}, true);
            this.stop();
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
        */
        reaction(
          () => videoStore.directConnection.channels,
          (strChannels, previousValue) => {
            __DEV__ &&
              console.log(
                'DirectStreamingView on channel list changed: ',
                strChannels
              );
            if (strChannels.length > 0 && strChannels != previousValue) {
              __DEV__ &&
                console.log(
                  'DirectStreamingView on channel list changed startPlay'
                );
              // this.pause();
              setTimeout(() => this.setNativePlayback(), 500);
              // this.setNativePlayback(false, {channels: strChannels});
            }
          }
        ),
      ];
    }

    this.reactions = [
      ...this.reactions,
      reaction(
        () => videoStore.isAuthenticated,
        (isAuthenticated, previousValue) => {
          if (isAuthenticated == true && previousValue == false) {
            this.props.serverInfo.setStreamStatus({
              isLoading: true,
              connectionStatus: STREAM_STATUS.LOGING_IN,
            });
            snackbarUtil.showToast(STREAM_STATUS.LOGING_IN, cmscolors.Success);
            this.setNativePlayback();
          }
        }
      ),
    ];
  };

  onReceivePlayerRef = ref => {
    this.ffmpegPlayer = ref;
    if (this.ffmpegPlayer && this.pendingCommand) {
      this.setNative(this.pendingCommand);
      this.pendingCommand = null;
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
      // connectionStatus: STREAM_STATUS.CONNECTING,
    });
    snackbarUtil.showToast(STREAM_STATUS.CONNECTING, cmscolors.Success);
    this.didSubmitLogin = true;
    this.setNativePlayback(
      false,
      userName && password ? {userName, password} : undefined
    );
  };

  clearLoginTimeout = () => {
    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
      this.loginTimeout = null;
    }
  };

  reconnect = (shouldStop = true) => {
    // this.setNative({disconnect: true}, true);
    const {serverInfo, videoStore, isLive, hdMode} = this.props;
    if (shouldStop) this.stop();

    serverInfo.setStreamStatus({
      isLoading: true,
      // connectionStatus: STREAM_STATUS.RECONNECTING,
    });
    snackbarUtil.showToast(STREAM_STATUS.RECONNECTING, cmscolors.Success);
    if (!isLive) {
      this.shouldSetTime = true;
      videoStore.setBeginSearchTime(
        DateTime.fromFormat(
          videoStore.displayDateTime,
          NVRPlayerConfig.FrameFormat,
          {zone: videoStore.timezone}
        )
      );
    }
    this.setNativePlayback(shouldStop);
  };

  setNativePlayback = (delay = false, paramsObject = {}) => {
    const {
      serverInfo,
      videoStore,
      isLive,
      hdMode,
      singlePlayer,
      selectedChannel,
    } = this.props;
    // const serverInfo = videoStore.directConnection;
    __DEV__ &&
      console.trace(
        'GOND direct setNativePlayback: ',
        serverInfo,
        videoStore.selectedChannel
      );
    if (
      // !serverInfo /*.server*/ ||
      // serverInfo.channels.length <= 0
      !serverInfo ||
      serverInfo.channels.length <= 0
    ) {
      __DEV__ &&
        console.log(
          'GOND direct setNativePlayback failed ',
          serverInfo.channels
        );
      return;
    }

    const {
      searchDateString,
      searchDate,
      searchPlayTime,
      searchPlayTimeLuxon,
      beginSearchTime,
    } = videoStore;
    // __DEV__ &&
    //   console.log(
    //     'GOND direct searchDateString  ',
    //     searchDateString,
    //     searchDate,
    //     searchPlayTime
    //   );
    // const playTime = isLive
    //   ? null
    //   : beginSearchTime ?? (searchPlayTime ? searchPlayTimeLuxon : null);
    if (
      !serverInfo.playData.userName ||
      serverInfo.playData.userName.length == 0 ||
      !serverInfo.playData.password ||
      serverInfo.playData.password.length == 0
    ) {
      __DEV__ && console.log('GOND displayAuthen::setNativePlayback');
      videoStore.displayAuthen(true);
      return;
    }

    const playbackInfo = {
      ...serverInfo.playData,
      searchMode: !isLive,
      date: isLive ? undefined : searchDateString,
      hd: hdMode,
      ...paramsObject,
    };
    // if (singlePlayer && videoStore.selectedChannel)
    //   playbackInfo.channels = '' + videoStore.selectedChannel;

    this.lastLogin = {
      userName: playbackInfo.userName,
      password: playbackInfo.password,
    };
    // snackbarUtil.showToast(STREAM_STATUS.LOGING_IN, cmscolors.Success);
    __DEV__ &&
      console.log(
        'GOND setNativePlayback, info = ',
        playbackInfo
        // playTime
        // '=== sv: ',
        // serverInfo
      );
    // __DEV__ && console.trace();
    if (delay) {
      // this.pause();
      setTimeout(() => {
        if (
          this._isMounted /*&& this.ffmpegPlayer*/ &&
          serverInfo /*.server*/
        ) {
          // this.ffmpegPlayer.setNativeProps({
          //   startplayback: playbackInfo,
          // });
          if (videoStore.paused) {
            videoStore.pause(false);
          }
          this.setNative({startplayback: playbackInfo});
          // if (playTime) {
          //   this.playAt(
          //     Math.floor(playTime.toSeconds() - searchDate.toSeconds())
          //   );
          // }
        }
      }, 500);
    } else {
      // this.ffmpegPlayer.setNativeProps({
      //   startplayback: playbackInfo,
      // });
      if (videoStore.paused) {
        videoStore.pause(false);
      }
      this.setNative({startplayback: playbackInfo});
      // if (playTime) {
      //   this.playAt(Math.floor(playTime.toSeconds() - searchDate.toSeconds()));
      // }
    }
  };

  onNativeMessage = event => {
    let {msgid, value, channel} = event; //.nativeEvent;
    // __DEV__ &&
    // console.log('GOND onFFMpegFrameChange event = ', event.nativeEvent);
    if (util.isNullOrUndef(msgid) && util.isNullOrUndef(value)) {
      if (event.nativeEvent) {
        msgid = event.nativeEvent.msgid;
        value = event.nativeEvent.value;
        channel = event.nativeEvent.channel;
      } else {
        console.log('GOND onReceiveNativeEvent parse failed, event = ', event);
        return;
      }
    }

    setTimeout(() => {
      this._isMounted && this.onVideoMessage(msgid, value, channel);
    }, 100);
  };

  onVideoMessage = (msgid, value, channel) => {
    const {
      videoStore,
      serverInfo,
      // searchPlayTime,
      isLive,
      singlePlayer,
      // index,
    } = this.props;
    // __DEV__ &&
    //   msgid != NATIVE_MESSAGE.FRAME_DATA &&
    //   console.log(
    //     'GOND onDirectVideoMessage: ',
    //     msgid,
    //     ' - ',
    //     value,
    //     ', ch: ',
    //     channel
    //   );
    if (this.loginTimeout && msgid != NATIVE_MESSAGE.LOGIN_MESSAGE) {
      this.clearLoginTimeout();
    }

    switch (msgid) {
      case NATIVE_MESSAGE.FRAME_DATA:
        // const {channel, buffer} = JSON.parse(value);
        // __DEV__ &&
        //   console.log('GOND onDirectVideoMessage FRAME_DATA ch: ', channel);
        if (!util.isNullOrUndef(channel) && value.length > 0) {
          videoStore.updateDirectFrame(channel, value);
        }
        break;
      case NATIVE_MESSAGE.CONNECTING:
        // this.setState({message: 'Connecting...'});
        serverInfo.setStreamStatus({
          isLoading: true,
          // connectionStatus: STREAM_STATUS.CONNECTING,
        });
        snackbarUtil.showToast(STREAM_STATUS.CONNECTING, cmscolors.Success);
        break;
      case NATIVE_MESSAGE.CONNECTED:
        __DEV__ && console.log('GOND onDirectVideoMessage: Connected', value);
        // serverInfo.setStreamStatus({
        //   isLoading: false,
        //   // connectionStatus: STREAM_STATUS.CONNECTED,
        // });
        snackbarUtil.showToast(STREAM_STATUS.CONNECTED, cmscolors.Success);
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE:
        // this.setState({message: value});
        if (__DEV__)
          console.log('GOND onDirectVideoMessage - Login message: ', value);
        else {
          this.loginTimeout = setTimeout(() => {
            if (this._isMounted) {
              this.loginTimeout = null;
              this.reconnect();
            }
          }, 10000);
        }
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
            // connectionStatus: STREAM_STATUS.LOGIN_FAILED,
          });
          if (this.didSubmitLogin) {
            snackbarUtil.showToast(
              STREAM_STATUS.LOGIN_FAILED,
              cmscolors.Danger
            );
            this.didSubmitLogin = false;
          }
          this.props.videoStore.resetNVRAuthentication(true);
        }
        if (
          this.lastLogin.userName &&
          this.lastLogin.password // &&
          // (index == 0 || singlePlayer)
        )
          snackbarUtil.onError(LoginTxt.errorLoginIncorrect);
        break;
      case NATIVE_MESSAGE.LOGIN_SUCCCESS:
        __DEV__ && console.log('GOND onDirectVideoMessage: login success');
        if (this.didSubmitLogin) this.didSubmitLogin = false;
        videoStore.setDirectDSTAwareness(false);
        videoStore.onLoginSuccess();
        setTimeout(() => {
          if (this.state.showLoginSuccessFlag)
            // && (index == 0 || singlePlayer))
            snackbarUtil.showToast(LoginTxt.loginSuccess, cmscolors.Success);
          if (this._isMounted) {
            serverInfo.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.DONE,
            });
          }
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
          // connectionStatus: STREAM_STATUS.SERVER_REJECT,
        });
        snackbarUtil.showToast(STREAM_STATUS.SERVER_REJECT, cmscolors.Danger);
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE_WRONG_SERVERID:
        // this.setState({message: 'Wrong server ID'});
        __DEV__ && console.log('GOND onDirectVideoMessage: Wrong server ID');
        serverInfo.setStreamStatus({
          isLoading: false,
          // connectionStatus: STREAM_STATUS.WRONG_SERVER,
        });
        snackbarUtil.showToast(STREAM_STATUS.WRONG_SERVER, cmscolors.Danger);
        break;
      case NATIVE_MESSAGE.LOGIN_MESSAGE_VIDEO_PORT_ERROR:
        // this.setState({message: 'Video port error'});
        __DEV__ && console.log('GOND onDirectVideoMessage: Video port error');
        serverInfo.setStreamStatus({
          isLoading: false,
          // connectionStatus: STREAM_STATUS.PORT_ERROR,
        });
        snackbarUtil.showToast(STREAM_STATUS.PORT_ERROR, cmscolors.Danger);
        break;
      case NATIVE_MESSAGE.CANNOT_CONNECT_SERVER:
        // this.setState({
        //   message: 'Cannot connect to server',
        //   videoLoading: false,
        // });
        serverInfo.setStreamStatus({
          isLoading: false,
          // connectionStatus: STREAM_STATUS.ERROR,
        });
        snackbarUtil.showToast(STREAM_STATUS.ERROR, cmscolors.Danger);
        // setTimeout(() => this.reconnect(), 1000);
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
            // connectionStatus: STREAM_STATUS.NOVIDEO,
          });
          snackbarUtil.showToast(VIDEO_TXT.NO_VIDEO, cmscolors.Success);
          videoStore.setNoVideo(true);
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
              // __DEV__ &&
              //   console.log(
              //     'GOND direct frame time: ',
              //     serverInfo.channelName,
              //     valueObj
              //   );

              if (videoStore.selectedChannel != serverInfo.channelNo) return;

              if (Array.isArray(valueObj) && valueObj.length > 0) {
                // __DEV__ && console.log(` SEARCH_FRAME_TIME = `, valueObj[0]);
                this.onFrameTime(valueObj[0]);
              } else
                console.log('GOND direct frame time not valid: ', valueObj);
            } catch (err) {
              console.log('GOND direct frame time not valid: ', err, value);
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
          // connectionStatus: STREAM_STATUS.CHANGED,
        });
        break;
      case NATIVE_MESSAGE.SERVER_RECORDING_ONLY:
        break;
      case NATIVE_MESSAGE.SERVER_CHANNEL_DISABLE:
        serverInfo.setStreamStatus({
          isLoading: false,
          // connectionStatus: STREAM_STATUS.DISABLED,
        });
        snackbarUtil.showToast(STREAM_STATUS.DISABLED, cmscolors.Success);
        break;
      case NATIVE_MESSAGE.PERMISSION_CHANNEL_DISABLE:
        __DEV__ && console.log('GOND Direct video: PERMISSION_CHANNEL_DISABLE');
        serverInfo.setStreamStatus({
          isLoading: false,
          // connectionStatus: STREAM_STATUS.NO_PERMISSION,
        });
        snackbarUtil.showToast(STREAM_STATUS.NO_PERMISSION, cmscolors.Success);
        this.noPermission = true;
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
        if (
          serverInfo.isLoading ||
          serverInfo.connectionStatus != STREAM_STATUS.DONE
        ) {
          serverInfo.setStreamStatus({
            isLoading: false,
            connectionStatus: STREAM_STATUS.DONE,
          });
        }
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
        __DEV__ && console.log('GOND timeline: ', timeData);
        if (timeData[0] && timeData[0].begin) {
          __DEV__ &&
            console.log('GOND timeline first time: ', timeData[0].begin);
          try {
            const timestamp = numberValue(timeData[0].begin);
            if (!timestamp) break;
            // const beginOfDay = DateTime.fromSeconds(timestamp)
            //   .toUTC()
            //   .startOf('day')
            //   .toFormat(NVRPlayerConfig.RequestTimeFormat);
            // if (beginOfDay != videoStore.searchDateString) {
            //   videoStore.setSearchDate(beginOfDay);
            // }
          } catch (err) {
            console.log('GOND Parse timestamp failed: ', timeData[0]);
          }
        }
        // videoStore.buildDirectTimeline(timeData);
        videoStore.setTimeline(timeData);
        // if (timeData[0] && timeData[0].timezone) {
        //   videoStore.setTimezoneOffset(timeData[0].timezone);
        // }

        // dongpt: set play time from alert/exception after receiving timeline
        /*
        const {searchPlayTimeLuxon, searchPlayTimeBySeconds} = videoStore;
        this.lastFrameTime = searchPlayTimeLuxon;
        if (!isLive && this.shouldSetTime && searchPlayTimeLuxon) {
          setTimeout(() => {
            if (this._isMounted && this.ffmpegPlayer) {
              __DEV__ &&
                console.log(
                  'GOND Direct on play search at time: ',
                  searchPlayTimeBySeconds
                );
              // if (this.noPermission) {
              //   this.stop();
              //   setTimeout(() => this.setNativePlayback(), 200);
              //   this.noPermission = false;
              // } else
              this.playAt(searchPlayTimeBySeconds);
              this.newSeekPos = 0;
              this.oldPos = 0;
            }
          }, 100);
          this.shouldSetTime = false;
        }
        */
        setTimeout(() => {
          if (!this._isMounted) return;
          const playTime = isLive
            ? null
            : videoStore.beginSearchTime ??
              (videoStore.searchPlayTime
                ? videoStore.searchPlayTimeLuxon
                : null);
          if (playTime) {
            this.playAt(
              Math.floor(
                playTime.toSeconds() - videoStore.searchDate.toSeconds()
              )
            );
            videoStore.setBeginSearchTime(null);
          }
        }, 200);
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
        videoStore.setDirectDSTAwareness(true);
        break;
      case NATIVE_MESSAGE.UNKNOWN:
        break;
      case NATIVE_MESSAGE.SERVER_MESSAGE:
        console.log('GOND ==^^^== DirectVideo ServerMessage ==^^^==', value);
        break;
      case NATIVE_MESSAGE.SHOULD_RECONNECT:
        __DEV__ &&
          console.log(
            'GOND Request reconnecting from native ... msgid: ',
            msgid
          );
        setTimeout(() => this.reconnect(false), 1000);
        break;
      case NATIVE_MESSAGE.SERVER_DISCONNECTED:
      default:
        break;
    }
  };

  onChangeSearchDate = () => {
    this.newSeekPos = 0;
    this.oldPos = 0;
    if (!this.props.videoStore.paused) {
      this.setNative({pause: true});
    }
    this.dateChanged = true;
  };

  onBeginDraggingTimeline = () => {
    if (!this.props.videoStore.paused) {
      this.setNative({pause: true});
    }
  };

  onSwitchLiveSearch = isLive => {
    this.newSeekPos = 0;
    this.oldPos = 0;
    if (!this.props.videoStore.paused) {
      this.setNative({pause: true});
    }
  };

  onChangeChannel = channelNo => {
    const {videoStore} = this.props;
    this.newSeekPos = 0;
    this.oldPos = 0;
    if (!videoStore.paused) {
      // this.setNative({pause: true});
      // this.playAt(
      //   this.lastFrameTime.toSeconds() -
      //     this.lastFrameTime.startOf('day').toSeconds()
      // );
      // this.savedPos =
      //   this.lastFrameTime.toSeconds() -
      //   this.lastFrameTime.startOf('day').toSeconds();
      videoStore.setBeginSearchTime(this.lastFrameTime);
    }
  };

  onHDMode = isHD => {
    // this.setNative({hd: isHD});
    if (this.props.isLive) this.setNative({hdmode: isHD});
    else {
      this.pause();
      setTimeout(() => {
        // this.playAt(
        //   this.lastFrameTime
        //     ? this.lastFrameTime.toSeconds() -
        //         this.lastFrameTime.startOf('day').toSeconds()
        //     : 0
        // );
        // this.newSeekPos = 0;
        // this.oldPos = 0;
        this.pause(false);
      }, 200);
    }
  };

  setPlayStatus = params => {
    if (params.startplayback) {
      this.isPlaying = true;
    } else if (params.stop != undefined || params.disconnect != undefined) {
      this.isPlaying = false;
    }
    __DEV__ && console.log('GOND setPlayStatus: ', this.isPlaying);
  };

  setNative = params => {
    // const {index, singlePlayer, serverInfo} = this.props;

    if (!this._isMounted) return;
    if (!this.ffmpegPlayer) {
      __DEV__ &&
        console.log(
          'GOND ffmpegPlayer invalid, pending native command: ',
          params
        );
      this.pendingCommand = params;
      return;
    }

    // __DEV__ && console.trace('GOND setNative: ', params);
    this.ffmpegPlayer.setNativeProps(params);
    this.setPlayStatus(params);
  };

  // setViewable = isViewable => {
  //   this.isViewable = this.props.singlePlayer ? true : isViewable;
  // };

  play = () => {
    this.setNativePlayback();
  };

  stop = (endConnection = false) => {
    // if (this.ffmpegPlayer) {
    //   __DEV__ &&
    //     console.log('GOND on direct stop: ', this.props.serverInfo.channelName);
    //   // __DEV__ && console.trace();
    //   this.ffmpegPlayer.setNativeProps({
    //     stop: true,
    //   });
    // }
    __DEV__ && console.log('GOND --- onDisconnect ---');
    // this.setNative({disconnect: endConnection}, true);
    this.setNative(endConnection ? {disconnect: true} : {stop: true}, true);
  };

  pause = value => {
    const {serverInfo, isLive, videoStore, hdMode} = this.props;
    // if (__DEV__) {
    //   console.log('GOND Direct pause: ', value ?? true);
    //   console.trace();
    // }

    if (this._isMounted /*&& this.ffmpegPlayer*/ && serverInfo /*.server*/) {
      if (value === true || value == undefined) {
        this.setNative({pause: true});
        videoStore.pause(true);
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
          console.log('GOND unpause this.lastFrameTime: ', this.lastFrameTime);
        videoStore.pause(false);
        if (this.savedPos && !isLive) {
          this.playAt(this.savedPos);
          this.newSeekPos = 0;
          this.oldPos = 0;
          this.savedPos = null;
        } else if (this.lastFrameTime && !isLive) {
          this.playAt(
            this.lastFrameTime.toSeconds() -
              this.lastFrameTime.startOf('day').toSeconds()
          );
          this.newSeekPos = 0;
          this.oldPos = 0;
        } else {
          this.setNative({
            startplayback: {
              ...serverInfo.playData,
              searchMode: !isLive,
              hdmode: hdMode,
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
    const {isLive, videoStore} = this.props;
    if (isLive) return;
    __DEV__ && console.log('GOND direct playAt: ', value);
    if (videoStore.paused) {
      this.savedPos = value;
    } else {
      // if (this.ffmpegPlayer) {
      //   this.ffmpegPlayer.setNativeProps({
      //     seekpos: {pos: value, hd: videoStore.hdMode},
      //   });
      //   this.lastTimestamp = 0;
      //   // setTimeout(() => this.ffmpegPlayer && this.pause(false), 200);
      // } else {
      //   __DEV__ &&
      //     console.log('GOND direct playAt ffmpegPlayer not available!');
      // }
      this.setNative({
        seekpos: {pos: value, hd: videoStore.hdMode},
      });
      this.newSeekPos = value;
      this.lastTimestamp = 0;
    }
  };

  onFrameTime = frameTime => {
    const {videoStore, serverInfo} = this.props;
    const {value, channel} = frameTime;
    const timestamp = parseInt(frameTime.timestamp);
    if (channel && parseInt(channel) != serverInfo.channelNo) {
      __DEV__ &&
        console.log(
          'GOND onFrameTime wrong channel: ',
          channel,
          serverInfo.channelNo
        );
      return;
    }
    if (videoStore.isDraggingTimeline) {
      __DEV__ && console.log('GOND onFrameTime dragging timeline not update!');
      return;
    }

    this.lastTimestamp = timestamp;

    if (value) {
      const timeFormat =
        Platform.OS == 'android'
          ? NVRPlayerConfig.ResponseTimeFormat
          : NVRPlayerConfig.RequestTimeFormat;
      const timeObj = videoStore.isDSTEndDate
        ? DateTime.fromSeconds(timestamp, {zone: videoStore.timezone})
        : DateTime.fromFormat(value, timeFormat);
      if (this.dateChanged) {
        if (
          timeObj.toFormat(NVRPlayerConfig.QueryStringUTCDateFormat) !=
          videoStore.searchDate.toFormat(
            NVRPlayerConfig.QueryStringUTCDateFormat
          )
        ) {
          __DEV__ &&
            console.log(
              'GOND onFrameTime skip old frame from previous date!',
              timeObj,
              videoStore.searchDate
            );
          return;
        } else {
          this.dateChanged = false;
        }
      }
      const pos = timeObj.toSeconds() - timeObj.startOf('day').toSeconds();
      if (this.newSeekPos > 0 && this.oldPos > 0) {
        __DEV__ &&
          console.log(
            'GOND check to skip old frame: ',
            this.newSeekPos,
            pos,
            this.oldPos
          );
        if (
          this.oldFrameSkipped < DIRECT_MAX_OLD_FRAME_SKIP &&
          (pos < this.newSeekPos ||
            (pos > this.oldPos &&
              Math.abs(this.oldPos - this.newSeekPos) > 2 &&
              Math.abs(pos - this.newSeekPos) > Math.abs(pos - this.oldPos)))
        ) {
          __DEV__ && console.log('GOND skip this old frame');
          this.oldFrameSkipped++;
          return;
        } else {
          this.newSeekPos = 0;
          this.oldFrameSkipped = 0;
        }
      }
      this.oldPos = pos;
      const timeString = timeObj.toFormat(NVRPlayerConfig.FrameFormat);

      videoStore.setDisplayDateTime(timeString);

      let frameTime = DateTime.fromFormat(value, timeFormat, {
        zone: 'utc',
      }); //.toSeconds();
      // if (!videoStore.isDirectDSTAwareness) {
      frameTime = frameTime.setZone(videoStore.timezone, {
        keepLocalTime: true,
      });
      // }
      // __DEV__ && console.log('GOND onFrameTime frameTime: ', frameTime);

      if (videoStore.isDirectDSTAwareness) {
        __DEV__ && console.log('GOND onFrameTime set on DST date');
        videoStore.setFrameTime(timestamp);
        this.lastFrameTime = DateTime.fromSeconds(timestamp, {
          zone: videoStore.timezone,
        });
      } else {
        videoStore.setFrameTime(frameTime.toSeconds());
        this.lastFrameTime = DateTime.fromFormat(value, timeFormat, {
          zone: videoStore.timezone,
        });
      }
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
    const {
      width,
      height,
      serverInfo,
      noVideo,
      videoStore,
      singlePlayer,
      filterShown,
    } = this.props;
    // const {message, videoLoading, noVideo} = this.state;
    const {connectionStatus, isLoading} = serverInfo;
    // __DEV__ &&
    //   console.log('GOND direct render channel: ', serverInfo.channelName);

    return singlePlayer ? (
      <GestureDetector gesture={this.composed}>
        <View
          onLayout={this.onLayout}
          // {...this.props}
        >
          {/* <ImageBackground
            source={NVR_Play_NoVideo_Image}
            style={{width: width, height: height}}
            resizeMode="cover"> */}
          <CMSImage
            isBackground={true}
            dataSource={serverInfo.snapshot}
            defaultImage={NVR_Play_NoVideo_Image}
            resizeMode="cover"
            styleImage={{width: width, height: height}}
            dataCompleteHandler={(param, data) =>
              serverInfo.channel && serverInfo.channel.saveSnapshot(data)
            }
            domain={{
              controller: 'channel',
              action: 'image',
              id: serverInfo.kChannel,
            }}>
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
            {noVideo ? null : (
              <View
                style={[
                  styles.playerView,
                  {zIndexn: noVideo ? -1 : undefined},
                ]}>
                {Platform.select({
                  ios: (
                    <FFMpegFrameViewIOS
                      width={this.state.width} // {this.state.width}
                      height={this.state.height} // {this.state.height}
                      scaleXY={this.state.zoom}
                      translateX={this.state.translateX}
                      translateY={this.state.translateY}
                      ref={this.onReceivePlayerRef}
                      onFFMPegFrameChange={this.onNativeMessage}
                      singlePlayer={true}
                    />
                  ),
                  android: (
                    <FFMpegFrameView
                      iterationCount={1}
                      width={width}
                      height={height}
                      ref={this.onReceivePlayerRef}
                      onFFMPegFrameChange={this.onNativeMessage}
                      singlePlayer={true}
                      // scaleXY={0.5}
                      // translateX={50}
                      // translateY={50}
                      scaleXY={this.state.zoom}
                      translateX={this.state.translateX}
                      translateY={this.state.translateY}
                    />
                  ),
                })}
              </View>
            )}
          </CMSImage>
          {/* </ImageBackground> */}
          {
            /*this.state.isFilterShown*/ filterShown && (
              <View
                style={[
                  controlStyles.controlsContainer,
                  {
                    backgroundColor: cmscolors.VideoOpacityLayer,
                  },
                ]}
              />
            )
          }
        </View>
      </GestureDetector>
    ) : (
      <View style={{width: 0, height: 0}}>
        {/* {Platform.OS === 'ios' ? (
          <FFMpegFrameViewIOS
            width={width} // {this.state.width}
            height={height} // {this.state.height}
            ref={this.onReceivePlayerRef}
            onFFMPegFrameChange={this.onNativeMessage}
          />
        ) : (
          <FFMpegFrameView
            iterationCount={1}
            width={width}
            height={height}
            ref={this.onReceivePlayerRef}
            onFFMPegFrameChange={this.onNativeMessage}
          />
        )} */}
        {Platform.select({
          ios: (
            <FFMpegFrameViewIOS
              width={width} // {this.state.width}
              height={height} // {this.state.height}
              ref={this.onReceivePlayerRef}
              onFFMPegFrameChange={this.onNativeMessage}
            />
          ),
          android: (
            <FFMpegFrameView
              iterationCount={1}
              width={width}
              height={height}
              ref={this.onReceivePlayerRef}
              onFFMPegFrameChange={this.onNativeMessage}
            />
          ),
        })}
      </View>
    );
  }
}

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
export default inject('videoStore')(observer(DirectVideoView));