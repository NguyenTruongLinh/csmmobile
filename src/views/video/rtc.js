import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {RTCView} from 'react-native-webrtc';
import {DateTime} from 'luxon';

import util, {normalize} from '../../util/general';
import snackbarUtil from '../../util/snackbar';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {RTC_COMMANDS, VIDEO_MESSAGE} from '../../consts/video';
import {TIMEZONE_MAP} from '../../consts/timezonesmap';
import {NVRPlayerConfig} from '../../consts/misc';

import {STREAM_STATUS} from '../../localization/texts';

class RTCStreamingView extends Component {
  static propTypes = {
    enableSwitchChannel: PropTypes.bool,
    searchTime: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    hdMode: PropTypes.bool,
    isLive: PropTypes.bool,
    noVideo: PropTypes.bool,
  };

  static defaultProps = {
    enableSwitchChannel: true,
    searchTime: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      // hdMode: false,
      // isLive: true,
      width: props.width,
      height: props.height,
      status: STREAM_STATUS.CONNECTING,
      error: '',
      canLiveSearch: false,
      novideo: false,
      startTs: 0,
      endTs: 0,
    };
    this.shouldSetTime = true;
    this.reactions = [];
  }

  componentDidMount() {
    __DEV__ &&
      console.log('RTCStreamingView componentDidMount, data = ', this.props);
    this._isMounted = true;
    const {viewer, videoStore} = this.props;

    this.initReactions();
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
      this.dataChannelOnOpen();
      // if (videoStore.isLive) {
      //   this.sendRtcCommand(RTC_COMMANDS.TIMEZONE);
      //   this.sendRtcCommand(RTC_COMMANDS.LIVE);
      // } else {
      //   // TODO: search in single player
      // }
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

    this.reactions.forEach(unsubscribe => unsubscribe());
  }

  initReactions = () => {
    const {videoStore, viewer} = this.props;

    this.reactions = [
      reaction(
        () => videoStore.isLive,
        isLive => {
          if (videoStore.dvrTimezone && this._isMounted) {
            this.pause();
            setTimeout(() => {
              if (isLive) {
                this.startPlayback(true);
              } else {
                this.sendRtcCommand(RTC_COMMANDS.DAYLIST);
                setTimeout(
                  () =>
                    this._isMounted &&
                    this.sendRtcCommand(RTC_COMMANDS.TIMELINE),
                  500
                );
              }
            }, 500);
          }
        }
      ),
      reaction(
        () => videoStore.hdMode,
        () => this._isMounted && this.startPlayback()
      ),
      reaction(
        () => videoStore.searchDate,
        () => {
          if (!isLive && this._isMounted) {
            this.pause();
            setTimeout(
              () =>
                this._isMounted && this.sendRtcCommand(RTC_COMMANDS.TIMELINE),
              500
            );
          }
        }
      ),
    ];
  };

  /*
  componentDidUpdate(prevProps, prevState) {
    if (!this._isMounted) return;
    const {hdMode, isLive, videoStore, viewer, searchDate} = this.props;

    if (isLive != prevProps.isLive) {
      if (videoStore.dvrTimezone) {
        this.pause();
        setTimeout(() => {
          if (isLive) {
            this.startPlayback(true);
          } else {
            this.sendRtcCommand(RTC_COMMANDS.DAYLIST);
            setTimeout(
              () =>
                this._isMounted && this.sendRtcCommand(RTC_COMMANDS.TIMELINE),
              500
            );
          }
        }, 500);
      }
    }

    if (hdMode != prevProps.hdMode) {
      this.startPlayback();
    }

    if (!isLive && searchDate != prevProps.searchDate) {
      this.pause();
      setTimeout(
        () => this._isMounted && this.sendRtcCommand(RTC_COMMANDS.TIMELINE),
        500
      );
    }
  }
  */

  stop = () => {};

  pause = value => {
    if (value === true || value === undefined)
      this.sendRtcCommand(RTC_COMMANDS.PAUSE);
    else {
      this.sendRtcCommand(
        this.props.videoStore.isLive ? RTC_COMMANDS.LIVE : RTC_COMMANDS.SEARCH
      );
    }
  };

  playAt = value => {
    if (this._isMounted && value) {
      __DEV__ &&
        console.log(
          'GOND RTC playAt: ',
          value,
          this.props.videoStore.searchDate.plus({seconds: value})
        );
      this.setState(
        {
          startTs: this.props.videoStore.searchDate.toSeconds() + value,
        },
        () => this.startPlayback()
      );
    }
  };

  timeDataConverter = value => {
    // __DEV__ && console.log('GOND convert time: ', value);
    const timezoneName = this.props.videoStore.timezone ?? 'local';
    return {
      id: 0,
      type: value.type,
      timezone:
        DateTime.fromSeconds(value.begin_time).setZone(timezoneName).offset *
        60 *
        1000,
      begin: value.begin_time, // * 1000,
      end: value.end_time, // * 1000,
      // string_begin: DateTime.fromSeconds(value.begin_time)
      //   .setZone(timezoneName)
      //   .toFormat('MM/DD/YYYY HH:mm:ss'),
      // string_end: DateTime.fromSeconds(value.end_time)
      //   .setZone(timezoneName)
      //   .toFormat('MM/DD/YYYY HH:mm:ss'),
    };
  };

  // fillRange = (start, end) => {
  //   return Array(end - start + 1)
  //     .fill()
  //     .map((item, index) => start + index);
  // };

  // generateFullTimeline = timestamp => {
  //   let result = [];
  //   for (let i = 0; i < timestamp.length; i++) {
  //     // if (USE_TIMESTAMP) {
  //     // 	result = result.concat(this.fillRange(timestamp[i].begin_sv,timestamp[i].end_sv))
  //     // } else {
  //     result = result.concat(
  //       this.fillRange(timestamp[i].begin, timestamp[i].end)
  //     );
  //     // }
  //   }
  //   return result;
  // };

  startPlayback = (showMessage = false) => {
    const {viewer} = this.props;
    __DEV__ && console.log('GOND RTC viewer start playback', viewer);
    if (!viewer || Object.keys(viewer).length == 0) {
      __DEV__ &&
        console.log('GOND RTC viewer not available, cannot start playback');
      return;
    }

    viewer.setStreamStatus({
      isLoading: false,
      error: '',
      connectionStatus: STREAM_STATUS.CONNECTED,
      needResetConnection: false,
    });
    let cmd = this.props.videoStore.isLive
      ? RTC_COMMANDS.LIVE
      : RTC_COMMANDS.SEARCH;
    __DEV__ &&
      console.log(
        '>>> [GOND] Everything is ready, start video now, cmd: ',
        cmd
      );
    // showMessage && showSnackbarMsg(VIDEO_MESSAGE.MSG_STREAM_CONNECTED);
    this.sendRtcCommand(cmd);
  };

  sendRtcCommand = cmd => {
    const {videoStore, viewer} = this.props;
    // if (this.needResetConnection) {
    // 	this.getVideoInfos({KDVR: this.state.DVR.KDVR, ChannelNo: this.state.channelNo})
    // 	return;
    // }
    let requestObj = {
      request_type: cmd,
      main_sub: this.props.hdMode ? 1 : 0,
      channel_id: viewer.channelNo,
    };

    if (cmd == RTC_COMMANDS.SEARCH) {
      // __DEV__ &&
      //   console.log(
      //     'GOND RTC_COMMANDS.SEARCH startTs = ',
      //     videoStore.searchBegin,
      //     '\n --- endTs = ',
      //     videoStore.searchEnd
      //   );
      requestObj = {
        ...requestObj,
        begin_ts: this.state.startTs,
        end_ts: this.state.endTs,
      };
    } else if (cmd == RTC_COMMANDS.TIMELINE) {
      requestObj = {
        ...requestObj,
        begin_time: videoStore.searchDateString,
        end_time: videoStore.searchDate
          .endOf('day')
          .toFormat(NVRPlayerConfig.RequestTimeFormat),
      };
    }

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
      isLoading: true,
      error: '',
      connectionStatus: STREAM_STATUS.CONNECTED,
      needResetConnection: false,
    });
    // if (videoStore.isLive) {
    //   this.sendRtcCommand(RTC_COMMANDS.LIVE);
    //   this.sendRtcCommand(RTC_COMMANDS.TIMEZONE);
    // } else {
    //   // TODO: search in single player
    //   this.sendRtcCommand(RTC_COMMANDS.TIMEZONE);
    //   this.sendRtcCommand(RTC_COMMANDS.TIMEZONE);
    // }
    this.sendRtcCommand(RTC_COMMANDS.TIMEZONE);
  };

  dataChannelOnMessage = msg => {
    __DEV__ && console.log('GOND dataChannel onMessage: ', msg);
    if (!this._isMounted) return;

    const msgObj =
      typeof msg.data == 'string' ? JSON.parse(msg.data) : msg.data;
    const {msg_type, data} = msgObj;
    const {videoStore, viewer, searchTime, searchPlayTime, noVideo} =
      this.props;

    if ((data.error_code && data.error_code != '0') || data.status == 'FAIL') {
      viewer.setStreamStatus({
        isLoading: false,
        error: data.description ?? 'unknow error',
        connectionStatus: STREAM_STATUS.ERROR,
        needResetConnection: false,
      });
      __DEV__ &&
        console.log('GOND {!!!} dataChannel receive error message: ', data);
      return;
    }

    switch (msg_type) {
      case RTC_COMMANDS.TIMEZONE: // 'timezone':
        __DEV__ && console.log('GOND RTCMessage timezone: ', data);
        videoStore.buildTimezoneData(data);
        if (videoStore.isLive) {
          this.startPlayback();
        } else {
          this.sendRtcCommand(RTC_COMMANDS.DAYLIST);
          setTimeout(
            () => this._isMounted && this.sendRtcCommand(RTC_COMMANDS.TIMELINE)
          );
        }
        break;
      case RTC_COMMANDS.TIMELINE: // 'timeline':
        __DEV__ && console.log('GOND RTCMessage timeline: ', data);
        let jTimeStamp = data;
        let jtimeData = jTimeStamp[0].di[viewer.channelNo];
        let timeInterval = [];

        try {
          timeInterval = jtimeData.ti.map(this.timeDataConverter);
          if (!timeInterval || timeInterval.length == 0 || noVideo) {
            __DEV__ &&
              console.log(
                '-- GOND timeInterval is empty, jtimeData =',
                jtimeData
              );
            // this.pause();
            viewer.setStreamStatus({
              isLoading: false,
              // novideo: true,
              connectionStatus: STREAM_STATUS.NOVIDEO,
              // displayInfo: '',
              error: 'No video',
            });
            // videoStore.setDisplayDateTime('')
            // snackbarUtil.showMessage(VIDEO_MESSAGE.MSG_NO_VIDEO_DATA);
            return;
          }

          // console.log('-- GOND timeInterval', timeInterval);
          __DEV__ && console.log('-- GOND searchDate', videoStore.searchDate);
          // __DEV__ &&
          //   console.log(
          //     '-- GOND currentDate',
          //     DateTime.fromSeconds(videoStore.searchDate)
          //   );

          timeInterval.sort((a, b) => a.begin - b.begin);
          __DEV__ && console.log('-- GOND timeInterval', timeInterval);
          viewer.setStreamStatus({
            connectionStatus: STREAM_STATUS.CONNECTING,
            // novideo: false,
          });
          videoStore.setTimeline(timeInterval);
          // this.fullTimeline = this.generateFullTimeline(timeInterval);
        } catch (ex) {
          console.log(
            '%c [GOND] RTC.dataChannel.onerror: ',
            'color: red; font-style: italic',
            ex
          );
          // snackbarUtil.showMessage(VIDEO_MESSAGE.MSG_STREAM_ERROR, CMSColors.Danger);
          viewer.setStreamStatus({
            isLoading: false,
            connectionStatus: STREAM_STATUS.ERROR,
          });
          return;
        }

        //
        let startTime = searchTime
          ? DateTime.fromFormat(searchTime, NVRPlayerConfig.RequestTimeFormat)
          : DateTime.fromSeconds(timeInterval[0].begin);
        startTime = startTime.setZone(videoStore.timezone);
        let endTime = startTime.endOf('day');

        // TODO: check auto skip to nearest data
        this.setState(
          {
            startTs: startTime.toSeconds(),
            endTs: endTime.toSeconds(),
          },
          () => {
            this.startPlayback();
          }
        );
        break;
      case RTC_COMMANDS.DAYLIST: // 'daylist':
        __DEV__ && console.log('GOND RTCMessage daylist: ', data);

        if (
          data &&
          data[0] &&
          Array.isArray(data[0].ti) &&
          data[0].ti.length > 0
        ) {
          let recordingDates = data[0].ti.map(params => {
            // let daylightday = convertToLocalTime(params.begin_time, this.dvrTimezone) * 1000;
            // console.log('-- GOND daylightday', daylightday);
            // return dayjs(daylightday).format("YYYY-MM-DD");
            return DateTime.fromSeconds(params.begin_time)
              .setZone(videoStore.timezone)
              .toFormat('yyyy-MM-dd');
          });

          __DEV__ && console.log('-- GOND recordingDates', recordingDates);
          videoStore.setRecordingDates(recordingDates);
        }
        break;
      case RTC_COMMANDS.TIMESTAMP: // 'Timestamp':
        if (videoStore.selectedChannel != viewer.channelNo) break;
        let currentTime = null;
        let timestamps = data.time.split('_');
        // __DEV__ &&
        //   console.log(
        //     'GOND timestamps = ',
        //     timestamps,
        //     '\n - time 0 = ',
        //     DateTime.fromSeconds(parseInt(timestamps[0])),
        //     '\n - time 1 = ',
        //     DateTime.fromSeconds(parseInt(timestamps[1]))
        //   );
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
        // __DEV__ &&
        //   console.log(
        //     'GOND on timestamp: ',
        //     currentTime,
        //     ', ',
        //     new Date(currentTime * 1000)
        //   );

        this.onTimeFrame(currentTime);
        return;
      case RTC_COMMANDS.TEXTOVERLAY: // 'TO':
        // TextOverlay
        return;
      case RTC_COMMANDS.LIVE: // 'live':
        if (viewer.isLoading) {
          viewer.setStreamStatus({
            isLoading: false,
            // canLiveSearch: true,
            connectionStatus:
              data.status == 'OK'
                ? STREAM_STATUS.CONNECTED
                : STREAM_STATUS.ERROR,
            error: data.status == 'OK' ? '' : data.description,
            // novideo: false,
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
          // snackbarUtil.showMessage(VIDEO_MESSAGE.MSG_STREAM_ERROR, CMSColors.Danger);
          if (viewer.isLoading)
            this.props.viewer.setStreamStatus({
              isLoading: false,
              // novideo: true,
              connectionStatus: STREAM_STATUS.ERROR,
              error: data.description ?? 'Unknow error',
              // displayInfo: '',
            });
          return;
        }
        // this.fixedpos = true;
        // Video frames are coming, stop videoLoading
        // if(this.isScrolling)
        // USE_TIMESTAMP
        // 	? this._handleScrollTo(this.state.startTs)
        // 	: this._handleScrollTo(this.state.startTime.unix());
        __DEV__ && console.log('GOND PAUSE 3 false');
        this.props.viewer.setStreamStatus({
          isLoading: false,
          // paused: false,
          // canLiveSearch: true,
          connectionStatus: STREAM_STATUS.CONNECTED,
          // novideo: false,
          error: '',
        });

        if (!videoStore.isLive && this.shouldSetTime && searchPlayTime) {
          setTimeout(() => {
            if (this._isMounted && viewer) {
              const searchTime = DateTime.fromISO(searchPlayTime, {
                zone: videoStore.timezone,
              });
              this.setState(
                {
                  startTs: searchTime.toSeconds(),
                },
                () => this.startPlayback()
              );
            }
          }, 100);
          this.shouldSetTime = false;
        }
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
    if (!this._isMounted) return;
    console.log('[GOND] RTC.dataChannel.onbufferedamountlow: ', msg);
    this.props.viewer.setStreamStatus({error: VIDEO_MESSAGE.MSG_LOW_BUFFER});
  };

  onTimeFrame = value => {
    const {videoStore, viewer} = this.props;
    if (videoStore.selectedChannel != viewer.channelNo) return;
    const dt = DateTime.fromSeconds(value).setZone(videoStore.timezone);
    videoStore.setDisplayDateTime(dt.toFormat(NVRPlayerConfig.FrameFormat));

    videoStore.setFrameTime(value);
  };

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
    const {remoteStream, channelName, isLoading, connectionStatus, error} =
      this.props.viewer;
    const {width, height} = this.props;
    // const {error} = this.state;
    const noVideo = connectionStatus === STREAM_STATUS.NOVIDEO;
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
            <View style={styles.textContainer}>
              <Text style={styles.textMessage}>{error}</Text>
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
            {remoteStream && !noVideo ? (
              <RTCView
                streamUrl={remoteStream.toURL()}
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
