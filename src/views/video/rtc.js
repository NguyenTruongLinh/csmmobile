import React, {Component} from 'react';
import {View, Text, ImageBackground, ActivityIndicator} from 'react-native';
import PropTypes from 'prop-types';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {RTCView} from 'react-native-webrtc';
import {DateTime} from 'luxon';

import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {RTC_COMMANDS, VIDEO_MESSAGE} from '../../consts/video';
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

    if (viewer.isDataChannelOpened) {
      __DEV__ && console.log('GOND dc opened send live cmd now ...');
      this.dataChannelOnOpen();
    }
  }

  componentWillUnmount() {
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    this._isMounted = false;

    this.reactions.forEach(unsubscribe => unsubscribe());
  }

  initReactions = () => {
    const {videoStore, viewer, singlePlayer} = this.props;

    this.reactions = [
      reaction(
        () => videoStore.isLive,
        isLive => {
          if (videoStore.dvrTimezone && this._isMounted && singlePlayer) {
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
        () => videoStore.searchDate,
        () => {
          if (!this.props.isLive && this._isMounted) {
            this.pause();
            setTimeout(
              () =>
                this._isMounted &&
                singlePlayer &&
                this.sendRtcCommand(RTC_COMMANDS.TIMELINE),
              500
            );
          }
        }
      ),
    ];
  };

  stop = () => {
    this.pause();
  };

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
    const searchDate = this.props.videoStore.getSafeSearchDate();
    if (this._isMounted && value) {
      __DEV__ &&
        console.log(
          'GOND RTC playAt: ',
          value,
          searchDate.plus({seconds: value})
        );
      this.setState(
        {
          startTs: searchDate.toSeconds() + value,
        },
        () => this.startPlayback()
      );
    }
  };

  timeDataConverter = value => {
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
    };
  };

  startPlayback = (showMessage = false) => {
    const {viewer} = this.props;
    __DEV__ && console.log('GOND RTC viewer start playback', viewer);
    if (!viewer || Object.keys(viewer).length == 0 || !this._isMounted) {
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
    this.sendRtcCommand(cmd);
  };

  sendRtcCommand = cmd => {
    const {videoStore, viewer} = this.props;
    let requestObj = {
      request_type: cmd,
      main_sub: this.props.hdMode ? 1 : 0,
      channel_id: viewer.channelNo,
    };
    const searchDate = videoStore.getSafeSearchDate();

    if (cmd == RTC_COMMANDS.SEARCH) {
      requestObj = {
        ...requestObj,
        begin_ts: this.state.startTs,
        end_ts: this.state.endTs,
      };
    } else if (cmd == RTC_COMMANDS.TIMELINE) {
      requestObj = {
        ...requestObj,
        begin_time: videoStore.searchDateString,
        end_time: searchDate
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
            viewer.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.NOVIDEO,
              error: 'No video',
            });
            return;
          }

          __DEV__ && console.log('-- GOND searchDate', videoStore.searchDate);

          timeInterval.sort((a, b) => a.begin - b.begin);
          __DEV__ && console.log('-- GOND timeInterval', timeInterval);
          viewer.setStreamStatus({
            connectionStatus: STREAM_STATUS.CONNECTING,
            // novideo: false,
          });
          videoStore.setTimeline(timeInterval);
        } catch (ex) {
          console.log(
            '%c [GOND] RTC.dataChannel.onerror: ',
            'color: red; font-style: italic',
            ex
          );
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
            return DateTime.fromSeconds(params.begin_time)
              .setZone(videoStore.timezone)
              .toFormat('yyyy-MM-dd');
          });

          __DEV__ && console.log('-- GOND recordingDates', recordingDates);
          videoStore.setRecordingDates(recordingDates);
        }
        break;
      case RTC_COMMANDS.TIMESTAMP: // 'Timestamp':
        this.props.viewer.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.DONE,
        });

        if (videoStore.selectedChannel != viewer.channelNo) break;
        let currentTime = null;
        let timestamps = data.time.split('_');
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

        this.onTimeFrame(currentTime);
        return;
      case RTC_COMMANDS.TEXTOVERLAY: // 'TO':
        // TextOverlay
        return;
      case RTC_COMMANDS.LIVE: // 'live':
        if (viewer.isLoading) {
          viewer.setStreamStatus({
            isLoading: false,
            connectionStatus:
              data.status == 'OK'
                ? STREAM_STATUS.CONNECTED
                : STREAM_STATUS.ERROR,
            error: data.status == 'OK' ? '' : data.description,
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
          if (viewer.isLoading)
            this.props.viewer.setStreamStatus({
              isLoading: false,
              connectionStatus: STREAM_STATUS.ERROR,
              error: data.description ?? 'Unknow error',
            });
          return;
        }
        __DEV__ && console.log('GOND PAUSE 3 false');
        this.props.viewer.setStreamStatus({
          isLoading: false,
          connectionStatus: STREAM_STATUS.CONNECTED,
          error: '',
        });

        if (
          !videoStore.isLive &&
          this.shouldSetTime &&
          videoStore.searchPlayTimeLuxon
        ) {
          setTimeout(() => {
            if (this._isMounted && viewer) {
              this.setState(
                {
                  startTs: searchPlayTimeLuxon.toSeconds(), // searchTime.toSeconds(),
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
  };

  onChangeSearchDate = () => {};

  onBeginDraggingTimeline = () => {};

  onSwitchLiveSearch = isLive => {};

  onChangeChannel = channelNo => {};

  onHDMode = isHD => {
    this.startPlayback();
  };

  render() {
    const {remoteStream, channelName, isLoading, connectionStatus, error} =
      this.props.viewer;
    const {width, height, videoStore} = this.props;
    const noVideo =
      connectionStatus === STREAM_STATUS.NOVIDEO || this.props.noVideo;
    __DEV__ &&
      console.log(
        'GOND RTCPlayer render: ',
        remoteStream && remoteStream.toURL(),
        ', noVideo = ',
        noVideo
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
            {channelName ?? 'Unknown'}
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
          <View style={[styles.playerView]}>
            {remoteStream && !noVideo ? (
              <RTCView
                streamURL={remoteStream.toURL()}
                objectFit={'cover'}
                style={{width: width, height: height}}
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
