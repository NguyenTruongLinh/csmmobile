import React, {Component, Fragment} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  Dimensions,
  Platform,
  AppState,
  TouchableWithoutFeedback,
  FlatList,
  PermissionsAndroid,
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {CalendarList} from 'react-native-calendars';
// import Modal from 'react-native-modal';
import Orientation from 'react-native-orientation-locker';
import TimePicker from 'react-native-24h-timepicker';
import {DateTime} from 'luxon';

import {IconCustom} from '../../components/CMSStyleSheet';
import CMSRipple from '../../components/controls/CMSRipple';
import CMSImage from '../../components/containers/CMSImage';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import TimeRuler from '../../components/controls/BetterTimeRuler';
import BackButton from '../../components/controls/BackButton';
import TimeOnTimeRuler from '../../components/controls/TimeOnTimeRuler';
import Swipe from '../../components/controls/Swipe';
import NVRAuthenModal from '../../components/views/NVRAuthenModal';

import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import {StatusBar} from 'react-native';

import VideoDateModal from './videoDateModal';
import VideoTimeModal from './videoTimeModal';

import snackbarUtil from '../../util/snackbar';
import CameraRoll from '@react-native-community/cameraroll';

import {normalize, isNullOrUndef, getAutoRotateState} from '../../util/general';
import {
  CLOUD_TYPE,
  HOURS_ON_SCREEN,
  CONTROLLER_TIMEOUT,
  VIDEO_MESSAGE,
  VIDEO_INACTIVE_TIMEOUT,
} from '../../consts/video';
import {
  STREAM_STATUS,
  VIDEO,
  VIDEO as VIDEO_TXT,
} from '../../localization/texts';
import {
  NVRPlayerConfig,
  CALENDAR_DATE_FORMAT,
  OrientationType,
  DateFormat,
} from '../../consts/misc';
import ViewShot from 'react-native-view-shot';
import CMSColors from '../../styles/cmscolors';
import {NVR_Play_NoVideo_Image} from '../../consts/images';

import videoStyles from '../../styles/scenes/videoPlayer.style';
import ROUTERS from '../../consts/routes';

const NUM_CHANNELS_ON_SCREEN = 5;
const IconSize = normalize(28);
const IconViewSize = IconSize * 3;

class VideoPlayerView extends Component {
  static defaultProps = {
    enableSwitchChannel: true,
  };

  constructor(props) {
    super(props);
    const {width, height} = Dimensions.get('window');

    this.state = {
      showCalendar: false,
      showTimerPicker: false,
      showController: false,
      videoLoading: true,
      // pause: false,
      seekpos: {},
      sWidth: width,
      sHeight: height,
      selectedTime: {hour: 0, minute: 0, second: 0},
      timePickerDatetime: props.videoStore.getSafeSearchDate(),
    };

    this.timelineAutoScroll = true;
    this.timeOnTimeline = null;
    // this.isNoDataSearch = false;
    this.eventSubscribers = [];
    this.resumeFromInterupt = false;
    this.lastOrientation = OrientationType.LANDSCAPE;
    this.ruler = null;
    this.savedTimelinePosition = null;
    this.reactions = [];
    this.lastRulerPosition = 0;
  }

  componentDidMount() {
    __DEV__ && console.log('VideoPlayerView componentDidMount');
    const {videoStore} = this.props;
    this._isMounted = true;

    this.eventSubscribers = [
      Dimensions.addEventListener('change', this.onDimensionsChange),
      AppState.addEventListener('change', this.handleAppStateChange),
    ];
    __DEV__ &&
      console.log(
        'VideoPlayerView componentDidMount, evtSubs: ',
        this.eventSubscribers
      );
    this.updateHeader();
    Orientation.getDeviceOrientation(orientation => {
      if (orientation != OrientationType.PORTRAIT) {
        this.onOrientationChange(orientation);
      }
    });

    Orientation.addDeviceOrientationListener(this.onOrientationChange);
    Orientation.unlockAllOrientations();

    this.initReactions();

    this.authenRef && this.authenRef.forceUpdate();
  }

  updateHeader = () => {
    const {navigation, videoStore} = this.props;
    navigation.setOptions({
      headerShown: !videoStore.isFullscreen,
      headerTitle: videoStore.isLive ? 'Live' : 'Search',
    });
  };

  componentWillUnmount() {
    this._isMounted = false;
    Dimensions.removeEventListener('change', this.onDimensionsChange);
    // this.dimensionsChangeEvtSub && this.dimensionsChangeEvtSub.remove();
    AppState.removeEventListener('change', this.handleAppStateChange);
    const {videoStore, route} = this.props;

    // __DEV__ &&
    //   console.log(
    //     'VideoPlayerView componentWillUnmount, evtSubs: ',
    //     this.eventSubscribers
    //   );
    // this.eventSubscribers.forEach(evt => evt && evt.remove());

    // if (videoStore.isSingleMode) {
    //   videoStore.releaseStreams();
    // }
    videoStore.selectedStream &&
      videoStore.selectedStream.setStreamStatus({
        connectionStatus: STREAM_STATUS.DONE,
      });
    videoStore.setNoVideo(false);
    if (videoStore.isFullscreen) {
      this.onFullscreenPress(false);
    }

    if (!videoStore.isPreloadStream) {
      videoStore.onExitSinglePlayer(route.name);
    }

    // dongpt: TODO handle Orientation
    Orientation.removeDeviceOrientationListener(this.onOrientationChange);
    Orientation.lockToPortrait();
    // this.unsubSearchTimeReaction();
    StatusBar.setHidden(false);
    this.reactions.forEach(unsubsribe => unsubsribe());
  }

  componentDidUpdate(prevProps) {
    const {videoStore} = this.props;

    if (this.ruler && this.savedTimelinePosition) {
      // __DEV__ && console.log(
      //   'GOND on player setTimelinePosition 2: ',
      //   videoStore.beginSearchTimeOffset
      // );
      this.ruler.moveToPosition(this.savedTimelinePosition);
      videoStore.setDisplayDateTime(
        videoStore.beginSearchTime.toFormat(NVRPlayerConfig.FrameFormat)
      );
      this.savedTimelinePosition = null;
      // if (videoStore.timeline) {
      //   videoStore.setBeginSearchTime(null);
      // }
    }
  }

  initReactions = () => {
    const {videoStore} = this.props;

    this.reactions = [
      // reaction(
      //   () => videoStore.searchDate,
      //   () => this.ruler && this.ruler.forceUpdate()
      // ),
      reaction(
        () => videoStore.beginSearchTime,
        searchTime => {
          __DEV__ &&
            console.log(
              'GOND on searchPlayTime changed: ',
              this.ruler,
              searchTime
            );
          if (!searchTime || videoStore.isLive) return;
          if (this.ruler) {
            // __DEV__ && console.log(
            //   'GOND on player setTimelinePosition 1: ',
            //   videoStore.beginSearchTimeOffset
            // );
            this.ruler.moveToPosition(videoStore.beginSearchTimeOffset);
            videoStore.setDisplayDateTime(
              searchTime.toFormat(NVRPlayerConfig.FrameFormat)
            );
            // if (videoStore.timeline) {
            //   videoStore.setBeginSearchTime(null);
            // }
          } else {
            this.savedTimelinePosition = videoStore.beginSearchTimeOffset;
          }
        }
      ),
    ];
  };

  //#region Event handlers
  clearAppStateTimeout = () => {
    // __DEV__ && console.trace('GOND: clearAppStateTimeout ');
    BackgroundTimer.stopBackgroundTimer();
    this.resumeFromInterupt = false;
  };

  handleAppStateChange = nextAppState => {
    __DEV__ &&
      console.log('GOND _handleAppStateChange nextAppState: ', nextAppState);
    const {videoStore, isLive} = this.props;
    if (nextAppState === 'active') {
      if (this.appState && this.appState.match(/inactive|background/)) {
        // todo: check is already paused to not resume video
        // this.playerRef.pause(false);
        if (this.resumeFromInterupt) {
          __DEV__ && console.log('GOND: Video resume from interupt');
          switch (videoStore.cloudType) {
            case CLOUD_TYPE.DEFAULT:
            case CLOUD_TYPE.DIRECTION:
            case CLOUD_TYPE.RS:
              this.playerRef.reconnect();
              break;
            case CLOUD_TYPE.HLS:
            case CLOUD_TYPE.RTC:
              if (videoStore.selectedChannel != null) {
                // self.getHLSInfos({
                //   channelNo: videoStore.selectedChannel,
                //   timeline: !videoStore.isLive,
                // });
                videoStore.resumeVideoStreamFromBackground(true);
              } else {
                __DEV__ &&
                  console.log(
                    'GOND _handleAppStateChange resume playing failed: HLS no selected channel: ',
                    videoStore.selectedChannel
                  );
              }
              break;
            // case CLOUD_TYPE.RTC:
            //   break;
            default:
              __DEV__ &&
                console.log(
                  'GOND _handleAppStateChange resume playing failed: cloudType is not valid: ',
                  videoStore.cloudType
                );
              break;
          }
          this.clearAppStateTimeout();
        }
      }
    } else {
      // this.playerRef.pause(true);
      __DEV__ && console.log('GOND: Video setting stop timeout from interupt');
      BackgroundTimer.runBackgroundTimer(() => {
        __DEV__ && console.log('GOND: Video check to stop ', this.appState);
        if (this.appState != 'active') {
          __DEV__ && console.log('GOND: Video stop from interupt');
          this.playerRef.stop();
          BackgroundTimer.stopBackgroundTimer();
          this.resumeFromInterupt = true;
        }
      }, VIDEO_INACTIVE_TIMEOUT);
    }
    this.appState = nextAppState;
  };

  onOrientationChange = async orientation => {
    const {videoStore} = this.props;

    // const locked = await getAutoRotateState();
    // __DEV__ && console.log('GOND onOrientationChange, canRotate = ', locked);
    let isFullscreen = false;
    switch (orientation) {
      case OrientationType.PORTRAIT:
        Orientation.lockToPortrait();
        break;
      case OrientationType.LANDSCAPE_LEFT:
        Orientation.lockToLandscapeLeft();
        isFullscreen = true;
        break;
      case OrientationType.LANDSCAPE_RIGHT:
        Orientation.lockToLandscapeRight();
        isFullscreen = true;
        break;
      case OrientationType.LANDSCAPE:
        Orientation.lockToLandscape();
        isFullscreen = true;
        break;
      case OrientationType.PORTRAIT_UPSIDE_DOWN:
        Orientation.lockToPortraitUpsideDown();
        break;
      default:
        return;
    }
    this.onFullscreenPress(isFullscreen);
    return;
  };

  checkDataOnSearchDate = selectedDate => {
    // dongpt: add no data (selected a day without data)
    const {videoStore} = this.props;
    const recordingDates = {...(videoStore.recordingDates ?? {})};
    // let datesList = [];
    let datesList = Object.keys(recordingDates);

    // let selectedDate = videoStore.searchDate.toFormat(CALENDAR_DATE_FORMAT);
    __DEV__ &&
      console.log(
        'GOND checkDataOnSearchDate selectedDate = ',
        selectedDate,
        '\n --- object = ',
        videoStore.searchDate,
        ', result = ',
        datesList.indexOf(selectedDate)
      );

    if (
      (!datesList && datesList.length <= 0) ||
      datesList.indexOf(selectedDate) < 0
    ) {
      __DEV__ && console.log('GOND: checkDataOnSearchDate NOVIDEO');
      // this.playerRef && this.playerRef.stop();
      // videoStore.selectedStream &&
      //   videoStore.selectedStream.setStreamStatus({
      //     isLoading: false,
      //     connectionStatus: STREAM_STATUS.NOVIDEO,
      //   });
      videoStore.setNoVideo(true);
      // snackbar.onMessage(VIDEO_MESSAGE.MSG_NO_VIDEO_DATA);

      __DEV__ && console.log('GOND PAUSE 2 false');
      // this.setState({
      //   videoLoading: false,
      //   canLiveSearch: true,
      //   displayInfo: '',
      //   paused: false,
      //   connectionStatus: STREAM_STATUS.NOVIDEO,
      // });
      return false;
    }

    // this.isNoDataSearch = false;
    this.forceUpdate();
    return true;
  };

  onDimensionsChange = ({window}) => {
    const {width, height} = window;
    __DEV__ && console.log('GOND onDimensionsChange: ', window);
    this.setState({sWidth: width, sHeight: height});
  };

  onFullscreenPress = (isFullscreen, manually) => {
    const {videoStore} = this.props;
    videoStore.switchFullscreen(isFullscreen);
    this.updateHeader();
    if (manually) {
      if (videoStore.isFullscreen) {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }
      // setTimeout(
      //   () => this._isMounted && Orientation.unlockAllOrientations(),
      //   500
      // );
    }
    StatusBar.setHidden(videoStore.isFullscreen);
    this.playerRef && this.playerRef.resetZoom();
  };

  onSwitchLiveSearch = () => {
    const {videoStore} = this.props;
    // videoStore.setNoVideo(false);
    this.playerRef && this.playerRef.onSwitchLiveSearch(!videoStore.isLive);
    this.lastRulerPosition = 0;
    videoStore.switchLiveSearch(undefined, true);
    // __DEV__ && console.log(
    //   'GOND on player setTimelinePosition 3: ',
    //   videoStore.beginSearchTimeOffset
    // );
    // this.ruler && this.ruler.moveToPosition(videoStore.beginSearchTimeOffset);
    this.updateHeader();
    // this.playerRef && this.playerRef.pause(true);
    setTimeout(() => {
      this.channelsScrollView &&
        videoStore.selectedChannelIndex >= 0 &&
        this.channelsScrollView.scrollToIndex({
          animated: true,
          index: videoStore.selectedChannelIndex,
        });
    }, 200);
  };

  onHDMode = () => {
    this.playerRef && this.playerRef.onHDMode(!this.props.videoStore.hdMode);
    this.props.videoStore.switchHD();
  };

  onStretch = () => {
    this.playerRef && this.playerRef.onStretch(!this.props.videoStore.stretch);
    this.props.videoStore.switchStretch();
  };

  handleChannelsScroll = event => {};

  onSelectDate = dateString => {
    if (!dateString) return;
    const {videoStore} = this.props;
    // value = {year, month, day, timestamp, dateString}
    __DEV__ &&
      console.log(
        'GOND onSelectDate: ',
        dateString,
        ', recording dates: ',
        Object.keys(videoStore.recordingDates)
      );

    this.lastRulerPosition = 0;
    videoStore.setBeginSearchTime(null);
    this.playerRef && this.playerRef.onChangeSearchDate(dateString);
    videoStore.setDisplayDateTime(
      DateTime.fromFormat(dateString, CALENDAR_DATE_FORMAT).toFormat(
        NVRPlayerConfig.FrameFormat
      )
    );
    // __DEV__ && console.log('GOND on player setTimelinePosition 4: ');
    this.ruler && this.ruler.moveToPosition(0);
    if (this.checkDataOnSearchDate(dateString)) {
      // videoStore.setNoVideo(false);
      this.setState({showCalendar: false});
      videoStore.setSearchDate(dateString, CALENDAR_DATE_FORMAT);
    } else {
      this.setState({showCalendar: false});
    }
    this.setState({showCalendar: false});
  };

  onSetSearchTime = (hourIndex, hours, minutes, seconds) => {
    if (!this.playerRef) return;
    const {videoStore} = this.props;
    const secondsValue =
      parseInt(hourIndex) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    __DEV__ &&
      console.log(
        'GOND onSetSearchTime: ',
        hours,
        ' : ',
        minutes,
        ' : ',
        seconds,
        ' = ',
        secondsValue
      );
    // __DEV__ && console.log('GOND on player setTimelinePosition 5: ', secondsValue);
    this.ruler && this.ruler.moveToPosition(secondsValue);
    this.playerRef && this.playerRef.onBeginDraggingTimeline();

    if (videoStore.timeline.length > 0 && videoStore.noVideo == true) {
      videoStore.setNoVideo(false);
    }
    this.onTimelineScrollEnd({
      hour: parseInt(hours),
      minutes: parseInt(minutes),
      seconds: parseInt(seconds),
      timestamp: secondsValue,
    });
    if (Platform.OS == 'ios') this.timePickerRef && this.timePickerRef.close();
    else this.closeTimePickerAndroid();
  };

  onSwitchChannel = channelNo => {
    const {videoStore} = this.props;

    if (videoStore.selectedChannel && channelNo == videoStore.selectedChannel)
      return;

    if (videoStore.frameTimeString) {
      videoStore.setBeginSearchTime(
        DateTime.fromFormat(
          videoStore.frameTimeString,
          NVRPlayerConfig.FrameFormat
        ).toFormat(NVRPlayerConfig.RequestTimeFormat)
      );
    }
    // videoStore.setNoVideo(false);
    this.playerRef && this.playerRef.onChangeChannel(channelNo);
    videoStore.selectChannel(channelNo);
    this.playerRef && this.playerRef.resetZoom();
    // if (videoStore.paused && this.playerRef) this.playerRef.pause(false);
  };

  onChannelSnapshotLoaded = (channel, params, imageData) => {
    channel.saveSnapshot(imageData);
  };

  onTakeVideoSnapshot = () => {};

  onShowControlButtons = () => {
    // __DEV__ && console.log('GOND onShowControlButtons');
    // if (__DEV__ && this.props.videoStore.isFullscreen) {
    if (__DEV__) {
      this.setState({showController: !this.state.showController});
    } else {
      this.setState({showController: true}, () => {
        // __DEV__ && console.log('GOND onShowControlButtons already showed');
        if (this.controllerTimeout) clearTimeout(this.controllerTimeout);
        this.controllerTimeout = setTimeout(
          () => {
            // __DEV__ && console.log('GOND onShowControlButtons hidden');
            if (this._isMounted) this.setState({showController: false});
            this.controllerTimeout = null;
          },
          __DEV__ ? 5000 : CONTROLLER_TIMEOUT
        );
      });
    }
  };

  formatTimeValue = value => {
    return value < 10 ? '0' + value : '' + value;
  };

  onTimelineScrollBegin = () => {
    const {videoStore} = this.props;
    this.timelineAutoScroll = false;
    if (videoStore.timeline.length > 0 && videoStore.noVideo == true) {
      videoStore.setNoVideo(false);
    }
    videoStore.setTimelineDraggingStatus(true);
    if (this.controllerTimeout) {
      clearTimeout(this.controllerTimeout);
      this.controllerTimeout = null;
    }
  };

  onTimelineScrollEnd = value => {
    const {videoStore} = this.props;
    const {timeline, timezone} = videoStore;
    const searchDate = videoStore.getSafeSearchDate();
    // if (this.timelineScrollTimeout) {
    //   clearTimeout(this.timelineScrollTimeout);
    // }
    // this.timelineScrollTimeout = setTimeout(() => {
    // const destinationTime = searchDate
    //   ? searchDate.plus({seconds: value.timestamp}).toSeconds()
    //   : DateTime.now()
    //       .setZone(timezone)
    //       .startOf('day')
    //       .plus({seconds: value.timestamp})
    //       .toSeconds();
    __DEV__ &&
      console.log(`onTimelineScrollEnd value.timestamp = `, value.timestamp);
    const destinationTime = searchDate
      .plus({seconds: value.timestamp})
      .toSeconds();
    // __DEV__ &&
    //   console.log(
    //     'GOND onTimeline sliding end: ',
    //     value,
    //     searchDate,
    //     destinationTime,
    //     timeline[timeline.length - 1],
    //     destinationTime >= timeline[timeline.length - 1].end
    //   );

    const dateString = searchDate.toFormat(NVRPlayerConfig.FrameDateFormat);
    const timeString =
      this.formatTimeValue(value.hour) +
      ':' +
      this.formatTimeValue(value.minutes) +
      ':' +
      this.formatTimeValue(value.seconds);
    videoStore.setDisplayDateTime(dateString + ' - ' + timeString);
    videoStore.setTimelineDraggingStatus(false);
    videoStore.setFrameTime(searchDate.plus({seconds: value.timestamp}));

    if (videoStore.isFullscreen) {
      this.controllerTimeout = setTimeout(() => {
        __DEV__ && console.log('GOND onShowControlButtons hidden');
        if (this._isMounted) this.setState({showController: false});
        this.controllerTimeout = null;
      }, CONTROLLER_TIMEOUT);
    }

    if (
      // timeline.length > 0 &&
      !videoStore.checkTimeOnTimeline(destinationTime)
    ) {
      // this.playerRef && this.playerRef.stop();
      __DEV__ && console.log('GOND onTimeline sliding end: AAAAAAAA');

      // setTimeout(() => {
      videoStore.setNoVideo(true, false);
      // snackbar.onMessage(VIDEO_MESSAGE.MSG_NO_VIDEO_DATA);
      // }, 200);
      return;
    } // else if (videoStore.noVideo) {
    //   videoStore.setNoVideo(false, false);
    // }
    videoStore.setBeginSearchTime(destinationTime);
    if (this.playerRef) {
      this.playerRef.playAt(value.timestamp);
    } else {
      __DEV__ && console.log('GOND playAt failed playerRef not available!');
    }
    // this.timelineScrollTimeout = null;
    // }, 500);
  };

  onAuthenSubmit = (username, password) => {
    if (
      this.playerRef &&
      this.playerRef.onLoginInfoChanged &&
      typeof this.playerRef.onLoginInfoChanged == 'function'
    )
      this.playerRef.onLoginInfoChanged(username, password);
  };

  onNext = () => {
    this.props.videoStore.nextChannel();
    this.playerRef && this.playerRef.resetZoom();
  };

  onPrevious = () => {
    this.props.videoStore.previousChannel();
    this.playerRef && this.playerRef.resetZoom();
  };

  onDraggingTimeRuler = time => {
    const {videoStore} = this.props;

    this.timeOnTimeline && this.timeOnTimeline.setValue(time);
    const dateString =
      videoStore.frameTimeString && videoStore.frameTimeString.length > 0
        ? videoStore.frameTimeString.split(' - ')[0]
        : videoStore.searchDate.toFormat(NVRPlayerConfig.FrameDateFormat);
    __DEV__ &&
      console.log(
        'GOND === onDraggingTimeRuler',
        dateString,
        ' --- ',
        time,
        ', ',
        videoStore.frameTimeString
      );
    videoStore.setDisplayDateTime(dateString + ' - ' + time);
  };

  onOpenTimePicker = () => {
    const {displayDateTime, isLive} = this.props.videoStore;
    const [date, time] = displayDateTime.split(' - ');
    const [hour, minute, second] = time.split(':');

    if (!isLive) {
      this.setState(
        {
          showTimerPicker: true,
          selectedTime: {hour, minute, second},
          timePickerDatetime: this.props.videoStore.getSafeSearchDate(),
        },
        () => {
          if (Platform.OS == 'ios')
            this.timePickerRef && this.timePickerRef.open();
        }
      );
    }
  };

  //#endregion Event handlers

  /**
   * move Timeline to a specific time
   * @param {luxon || moment} time
   */
  /*
  moveTimeline = time => {
    if (!this.ruler) return;

    let hour = time.hour() + time.minutes() / 60 + time.seconds() / 3600;

    // TODO: handle DST
    // ---

    let dwidth = this.state.sWidth / HOURS_ON_SCREEN;

    this.ruler.scrollTo(hour * dwidth, 0);
  };
  */

  //#region Render
  /*
  renderCalendar = () => {
    const {videoStore} = this.props;
    const {sWidth, sHeight} = this.state;

    return (
      // <Modal
      //   visible={this.state.showCalendar}
      //   onTouchOutside={() => this.setState({showCalendar: false})}
      //   width={videoStore.isFullscreen ? 0.4 : 0.7}
      //   height={videoStore.isFullscreen ? 0.8 : 0.5}
      //   modalAnimation={new SlideAnimation({slideFrom: 'top'})}>
      <Modal
        isVisible={this.state.showCalendar}
        onBackdropPress={() => this.setState({showCalendar: false})}
        onBackButtonPress={() => this.setState({showCalendar: false})}
        backdropOpacity={0.1}
        style={{
          marginVertical: videoStore.isFullscreen
            ? sHeight * (sHeight > 480 ? 0.1 : 0.05)
            : sHeight * 0.2,
          borderRadius: 7,
        }}>
        <View style={styles.calendarContainer}>
          <CalendarList
            style={styles.calendar}
            onDayPress={this.onSelectDate}
            onDayLongPress={__DEV__ ? this.onSelectDate : undefined} // debug only
            markedDates={videoStore.recordingDates}
            disableMonthChange={false}
            markingType={'period'}
          />
        </View>
      </Modal>
    );
  };
  */

  renderCalendar = () => {
    const {videoStore} = this.props;
    const {displayDateTime, isLive, isFullscreen} = videoStore;
    const [date, time] = displayDateTime.split(' - ');
    const displayDate = DateTime.fromFormat(date, DateFormat.POS_Filter_Date);

    return (
      <VideoDateModal
        isVisible={this.state.showCalendar}
        onBackdropPress={() => this.setState({showCalendar: false})}
        onBackButtonPress={() => this.setState({showCalendar: false})}
        markedDates={videoStore.recordingDates}
        isFullscreen={isFullscreen}
        date={displayDate}
        onSubmit={this.onSelectDate}
        onDismiss={() => this.setState({showCalendar: false})}
      />
    );
  };

  renderVideo = () => {
    // if (!this._isMounted) return;
    const {videoStore} = this.props;
    const {selectedStream, isAuthenticated, isAPIPermissionSupported} =
      videoStore;
    const {pause, sWidth, sHeight, showController} = this.state;
    const width = sWidth;
    const height = videoStore.isFullscreen ? sHeight : (sWidth * 9) / 16;
    __DEV__ &&
      console.log(
        'GOND renderVid player: ',
        selectedStream,
        isAPIPermissionSupported
      );
    if (
      !selectedStream ||
      !selectedStream.channel ||
      // !isAPIPermissionSupported ||
      !isAuthenticated
    ) {
      // if (selectedStream && !isAuthenticated && this.authenRef)
      //   this.authenRef.forceUpdate();
      return (
        <TouchableWithoutFeedback onPress={this.onShowControlButtons}>
          <Image
            style={{width: width, height: height}}
            source={NVR_Play_NoVideo_Image}
            resizeMode="cover"
          />
        </TouchableWithoutFeedback>
      );
    }

    const canPlay = videoStore.canPlaySelectedChannel(videoStore.isLive);
    __DEV__ && console.log('GOND render player canPlay: ', canPlay);
    if (!canPlay) {
      __DEV__ && console.log('GOND renderVid player NO PERMISSION');
      return (
        <ImageBackground
          source={selectedStream.snapshot ?? NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="cover">
          <TouchableWithoutFeedback onPress={this.onShowControlButtons}>
            <View style={{flex: 1}}>
              <Text style={videoStyles.channelInfo}>
                {selectedStream.channelName ?? 'Unknown'}
              </Text>
              <View style={videoStyles.statusView}>
                <View style={videoStyles.textContainer}>
                  <Text style={videoStyles.textMessage}>
                    {STREAM_STATUS.NO_PERMISSION}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ImageBackground>
      );
    }

    let playerProps = {
      width: width,
      height: height,
      hdMode: videoStore.hdMode,
      stretch: videoStore.stretch,
      isLive: videoStore.isLive,
      noVideo: videoStore.isLive ? false : videoStore.noVideo, // this.isNoDataSearch,
      // searchDate: videoStore.searchDate,
      searchDate: videoStore.getSafeSearchDate(),
      // searchPlayTime: videoStore.searchPlayTime,
      paused: videoStore.paused,
      singlePlayer: true,
      filterShown: showController && !videoStore.isLive,
    };
    let player = null;
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
      case CLOUD_TYPE.RS:
        player = (
          <DirectVideoView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            serverInfo={selectedStream}
            onSwipeLeft={this.onNext}
            onSwipeRight={this.onPrevious}
            onPress={this.onShowControlButtons}
          />
        );
        break;
      case CLOUD_TYPE.HLS:
        player = (
          <HLSStreamingView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            streamData={selectedStream}
            timezone={videoStore.timezone}
            onSwipeLeft={this.onNext}
            onSwipeRight={this.onPrevious}
            onPress={this.onShowControlButtons}
          />
        );
        break;
      case CLOUD_TYPE.RTC:
        player = (
          <RTCStreamingView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            viewer={selectedStream}
            onPress={this.onShowControlButtons}
          />
        );
        break;
    }

    return player;
  };

  renderFullscreenHeader = () => {
    const {videoStore, navigation} = this.props;
    const {sWidth, sHeight, showController} = this.state;

    return videoStore.isFullscreen && showController ? (
      <View style={styles.headerContainerFullscreen}>
        <BackButton
          icon="clear-button"
          navigator={navigation}
          color={CMSColors.White}
          style={styles.headerBack}
        />
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitleText}>
            {videoStore.isLive ? VIDEO_TXT.LIVE : VIDEO_TXT.SEARCH}
          </Text>
        </View>
        {this.renderDatetime()}
      </View>
    ) : null;
  };

  renderFullscreenFooter = () => {
    const {videoStore} = this.props;
    const {sHeight, showController} = this.state;

    return videoStore.isFullscreen ? (
      <View
        style={[
          styles.footerContainerFullscreen,
          showController
            ? {
                top: sHeight * 0.8,
              }
            : {
                top: -sHeight,
              },
        ]}>
        <View style={{flex: 70, alignContent: 'flex-start'}}>
          {this.renderTimeline()}
        </View>
        <View
          style={[
            styles.footerButtonsWrap,
            {
              paddingBottom: (sHeight * 0.2 - IconSize) / 4,
            },
          ]}>
          {this.renderFeatureButtons()}
        </View>
      </View>
    ) : null;
  };

  renderDatetime = () => {
    const {displayDateTime, isLive, isFullscreen} = this.props.videoStore;
    const {sHeight} = this.state;
    const [date, time] = displayDateTime.split(' - ');

    const textStyle = [
      styles.datetime,
      {fontSize: normalize(isFullscreen ? 22 : 28)},
    ];

    return (
      <View
        style={[
          isFullscreen
            ? styles.datetimeContainerFullscreen
            : styles.datetimeContainer,
          // {justifyContent: 'space-between', alignContent: 'center'},
        ]}>
        {isLive ? null : (
          <CMSRipple
            onPress={() => !isLive && this.setState({showCalendar: true})}>
            <Text style={textStyle}>{date}</Text>
          </CMSRipple>
        )}
        {isLive ? null : <Text style={textStyle}> - </Text>}
        <CMSRipple onPress={this.onOpenTimePicker}>
          <Text style={textStyle}>{time}</Text>
        </CMSRipple>
      </View>
    );
  };

  renderControlButtons = () => {
    // if (!this.state.showController) {
    //   return null;
    // }

    const {videoStore} = this.props;
    const {
      isLive,
      selectedChannelIndex,
      displayChannels,
      paused,
      noVideo,
      selectedStream,
      timeline,
      cloudType,
      isFullscreen,
    } = videoStore;
    const {sHeight, showController} = this.state;
    // const IconSize = normalize(28); // normalize(sHeight * 0.035);

    let showPlayPauseButton =
      !isLive &&
      !noVideo &&
      selectedStream &&
      !selectedStream.isLoading &&
      selectedStream.isReady;
    if (cloudType == CLOUD_TYPE.HLS) {
      showPlayPauseButton = showPlayPauseButton && selectedStream.streamUrl;
    }
    let verticalPos = {
      marginTop:
        -IconViewSize / 2 +
        (isFullscreen ? 0 : Platform.OS === 'android' ? 12 : 48),
    };

    return (
      <Fragment>
        {showController && selectedChannelIndex > 0 && (
          <View style={[styles.controlButtonContainer, verticalPos]}>
            <IconCustom
              name="keyboard-left-arrow-button"
              size={IconSize}
              onPress={this.onPrevious}
              style={[
                styles.controlButton,
                {
                  justifyContent: 'flex-start',
                },
              ]}
            />
          </View>
        )}
        {showPlayPauseButton && (showController || paused) && (
          <View
            style={[
              styles.controlButtonContainer,
              verticalPos,
              {left: '50%', marginLeft: -IconViewSize / 2},
            ]}>
            <IconCustom
              name={paused ? 'play' : 'pause'}
              size={IconSize + 4}
              style={styles.pauseButton}
              onPress={() => {
                // const willPause = paused;
                // this.setState({pause: willPause});
                this.playerRef && this.playerRef.pause(!paused);
              }}
            />
          </View>
        )}
        {showController && selectedChannelIndex < displayChannels.length - 1 && (
          <View
            style={[styles.controlButtonContainer, verticalPos, {right: 0}]}>
            <IconCustom
              name="keyboard-right-arrow-button"
              size={IconSize}
              onPress={this.onNext}
              style={[
                styles.controlButton,
                {
                  justifyContent: 'flex-end',
                },
              ]}
            />
          </View>
        )}
      </Fragment>
    );
  };

  hasAndroidPermission = async () => {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(permission);
    return status === 'granted';
  };

  takeSnapshot = () => {
    const {videoStore} = this.props;
    if (!this.playerRef) {
      console.log('takeSnapshot player not ready');
      return;
    }
    this.playerRef.resetZoom();
    setTimeout(() => {
      if (Platform.OS === 'ios' && videoStore.cloudType == CLOUD_TYPE.HLS) {
        this.playerRef.takeSnapshotNative();
      } else if (this.viewShot) {
        this.viewShot.capture().then(async fileSource => {
          // console.log('takeSnapshot fileSource = ', fileSource);
          if (
            Platform.OS === 'android' &&
            !(await this.hasAndroidPermission())
          ) {
            return;
          }
          CameraRoll.save(fileSource, {type: 'photo'})
            .then(() => {
              snackbarUtil.showToast(VIDEO.SNAPSHOT_TAKEN, CMSColors.Success);
              // console.log('takeSnapshot SUCC fileDest = ');
            })
            .catch(function (error) {
              console.log('takeSnapshot ERROR = ', error);
            });
        });
      }
    }, 100);
  };

  renderFeatureButtons = () => {
    const {videoStore, isLive, selectedStream} = this.props;
    // const {sWidth, sHeight} = this.state;
    const {showController} = this.state;
    // const IconSize = normalize(28); // normalize(sHeight * 0.035);
    const isMenuReady = videoStore.selectedStream
      ? videoStore.selectedStream.isMenuReady ?? true
      : false;
    // __DEV__ &&
    //   console.log('GOND renderFeatureButtons', isMenuReady, selectedStream);

    const isMenuReady = videoStore.selectedStream
      ? videoStore.selectedStream.isMenuReady ?? true
      : false;
    // __DEV__ &&
    //   console.log('GOND renderFeatureButtons', isMenuReady, selectedStream);
    return (
      <View
        style={
          videoStore.isFullscreen
            ? styles.buttonsContainersFullscreen
            : [
                styles.buttonsContainers,
                {
                  backgroundColor:
                    showController && !isLive
                      ? CMSColors.DarkElement
                      : CMSColors.Transparent,
                },
              ]
        }>
        {showController && (
          <View style={styles.buttonWrap}>
            <CMSTouchableIcon
              iconCustom={
                videoStore.isLive
                  ? 'searching-magnifying-glass'
                  : 'videocam-filled-tool'
              }
              color={CMSColors.White}
              size={IconSize}
              // style={styles.buttonStyle}
              onPress={this.onSwitchLiveSearch}
              // disabled={videoStore.isLoading || !this.playerRef}
              disabled={
                videoStore.isLive
                  ? !videoStore.canSearchSelectedChannel
                  : !videoStore.canLiveSelectedChannel
              }
            />
          </View>
        )}
        {showController && (
          <View style={styles.buttonWrap}>
            <CMSTouchableIcon
              iconCustom="stretch-01"
              color={
                videoStore.stretch == true
                  ? CMSColors.PrimaryActive
                  : CMSColors.White
              }
              size={IconSize}
              onPress={this.onStretch}
              disabled={!videoStore.enableStretch}
            />
          </View>
        )}
        {showController && (
          <View style={styles.buttonWrap}>
            <CMSTouchableIcon
              iconCustom={'camera'}
              color={CMSColors.White}
              size={IconSize}
              onPress={this.takeSnapshot}
              disabled={!this.viewShot || !isMenuReady}
            />
          </View>
        )}
        {showController && (
          <View style={styles.buttonWrap}>
            <CMSTouchableIcon
              iconCustom="hd"
              color={
                // CMSColors.PrimaryActive
                videoStore.hdMode == true
                  ? CMSColors.PrimaryActive
                  : CMSColors.White
              }
              size={IconSize}
              // style={styles.buttonStyle}
              onPress={this.onHDMode}
              disabled={
                !videoStore.selectedStream ||
                // videoStore.selectedStream.isLoading ||
                !this.playerRef ||
                !isMenuReady
              }
            />
          </View>
        )}
        {showController && (
          <View style={styles.buttonWrap}>
            <CMSTouchableIcon
              iconCustom={
                videoStore.isFullscreen
                  ? 'out-fullscreen'
                  : 'switch-to-full-screen-button'
              }
              size={IconSize}
              color={CMSColors.White}
              // style={styles.buttonStyle}
              onPress={() => this.onFullscreenPress(undefined, true)}
            />
          </View>
        )}
      </View>
    );
  };

  renderTimeline = () => {
    const {videoStore} = this.props;
    const {sWidth} = this.state;
    // console.log('GONND searchDate ', videoStore.getSafeSearchDate());

    return videoStore.isLive || !videoStore.isAuthenticated ? (
      <View style={{flex: 8}}></View>
    ) : (
      <View style={styles.timelineContainer}>
        <View style={styles.rulerContainer}>
          <TimeRuler
            ref={r => (this.ruler = r)}
            searchDate={videoStore.searchDateInSeconds()} // if direct ('UTC', {keepLocalTime: true})
            datetime={videoStore.getSafeSearchDate()}
            height="100%"
            markerPosition="absolute"
            timeData={videoStore.timeline}
            currentTime={videoStore.frameTime}
            onBeginScroll={this.onTimelineScrollBegin}
            onScrolling={this.onDraggingTimeRuler}
            onPauseVideoScrolling={() =>
              this.playerRef && this.playerRef.onBeginDraggingTimeline()
            }
            setShowHideTimeOnTimeRule={value => {
              this.timeOnTimeline && this.timeOnTimeline.setShowHide(value);
            }}
            onScrollEnd={this.onTimelineScrollEnd}
            onPositionChanged={secOffset => {
              // const hour = Math.floor(secOffset / 3600);
              // const minute = Math.floor((secOffset - hour * 3600) / 60);
              // const sec = secOffset - hour * 3600 - minute * 60;
              // __DEV__ &&
              //   console.log(
              //     'GOND Timeruler onReceiveRulerPosition: ',
              //     secOffset,
              //     hour,
              //     minute,
              //     sec
              //   );
              this.lastRulerPosition = secOffset;
            }}
            initialPosition={this.lastRulerPosition}
          />
        </View>
        <TimeOnTimeRuler
          // key="1"
          ref={r => (this.timeOnTimeline = r)}
          styles={[
            styles.timeOnRuler,
            {
              left: videoStore.isFullscreen
                ? (sWidth * 0.75) / 2 - 30
                : sWidth / 2 - 30,
            },
          ]}
          backgroundColor={CMSColors.White}
        />
      </View>
    );
  };

  renderChannelItem = ({item}) => {
    const isDummy = typeof item !== 'object' || Object.keys(item).length === 0;
    const {kChannel, channelNo, name} = item;
    const {sWidth} = this.state;
    const {videoStore} = this.props;
    const isSelected = videoStore.selectedChannel == channelNo;
    const imageW = (sWidth / NUM_CHANNELS_ON_SCREEN) * (isSelected ? 1.2 : 1);
    const borderStyle = isSelected
      ? {borderWidth: 2, borderColor: CMSColors.PrimaryActive}
      : {};
    // console.log('GOND renderChannelItem ', item);

    return isDummy ? (
      <View
        style={[
          styles.channelContainer,
          {
            width: imageW,
          },
        ]}
      />
    ) : (
      <CMSRipple
        style={[
          styles.channelContainer,
          {
            width: imageW,
          },
        ]}
        onPress={() => this.onSwitchChannel(channelNo)}>
        <CMSImage
          dataSource={item.snapshot}
          style={{height: imageW}}
          styleImage={[borderStyle, {width: imageW, height: imageW}]}
          showLoading={false}
          dataCompleteHandler={(params, imageData) =>
            this.onChannelSnapshotLoaded(item, params, imageData)
          }
          // zzz
          domain={{
            controller: 'channel',
            action: 'image',
            id: kChannel,
          }}
        />
        <Text
          style={
            isSelected ? styles.selectedChannelName : styles.normalChannelName
          }
          numberOfLines={1}>
          {name}
        </Text>
      </CMSRipple>
    );
  };

  renderChannelsList = () => {
    const {
      // allChannels,
      // activeChannels,
      displayChannels,
      selectedChannelIndex,
      selectedStream,
      selectedChannel,
      isFullscreen,
      isLive,
      isAuthenticated,
      canEnterChannel,
    } = this.props.videoStore;
    // console.log('GOND renderChannelsList: ', isFullscreen);
    const itemWidth = this.state.sWidth / NUM_CHANNELS_ON_SCREEN;
    // const channelsList = isLive ? activeChannels : allChannels;

    return isFullscreen ? null : (
      <View style={styles.channelsListContainer}>
        {isAuthenticated && canEnterChannel(selectedChannel) && (
          <FlatList
            ref={r => (this.channelsScrollView = r)}
            style={{flex: 1}}
            data={[{}, {}, ...displayChannels, {}, {}]}
            renderItem={this.renderChannelItem}
            keyExtractor={(item, index) => item.channelNo ?? 'dummy' + index}
            getItemLayout={(data, index) => ({
              length: itemWidth,
              offset: itemWidth * index,
              index,
            })}
            initialNumToRender={displayChannels.length + 4}
            initialScrollIndex={
              isNullOrUndef(selectedChannel) ? undefined : selectedChannelIndex
            }
            refreshing={!selectedStream}
            horizontal={true}
            onScroll={this.handleChannelsScroll}
          />
        )}
      </View>
    );
  };

  closeTimePickerAndroid = () => {
    this.setState({showTimerPicker: false});
  };

  renderTimePicker = () => {
    // __DEV__ &&
    //   console.log(
    //     ` renderTimePicker this.state.timePickerDatetime = `,
    //     this.state.timePickerDatetime
    //   );
    return Platform.OS == 'ios' ? (
      <TimePicker
        ref={ref => {
          this.timePickerRef = ref;
        }}
        onCancel={() => this.timePickerRef && this.timePickerRef.close()}
        selectedTime={this.state.selectedTime}
        onConfirm={this.onSetSearchTime}
        datetime={this.props.videoStore.getSafeSearchDate()}
        // datetime={this.state.timePickerDatetime}
      />
    ) : (
      <VideoTimeModal
        isVisible={this.state.showTimerPicker}
        onBackdropPress={this.closeTimePickerAndroid}
        onBackButtonPress={this.closeTimePickerAndroid}
        selectedTime={this.state.selectedTime}
        onSubmit={this.onSetSearchTime}
        onDismiss={this.closeTimePickerAndroid}
        datetime={this.state.timePickerDatetime}
        // datetime={this.props.videoStore.getSafeSearchDate()}
      />
    );
  };

  render() {
    const {videoStore} = this.props;
    const {isFullscreen} = videoStore;

    const fullscreenHeader = this.renderFullscreenHeader();
    const fullscreenFooter = this.renderFullscreenFooter();
    const datetimeBox = isFullscreen ? null : this.renderDatetime();
    const videoPlayer = this.renderVideo();
    const channelsList = this.renderChannelsList();
    const buttons = isFullscreen ? null : this.renderFeatureButtons();
    const timeline = isFullscreen ? null : this.renderTimeline();
    const controlButtons = this.renderControlButtons();
    const calendar = this.renderCalendar();
    const timePicker = this.renderTimePicker();

    // __DEV__ && console.log('GOND FUllscreen header = ', fullscreenHeader);

    return (
      <View style={styles.screenContainer}>
        {fullscreenHeader}
        {fullscreenFooter}
        {calendar}
        {datetimeBox}
        <NVRAuthenModal
          ref={r => (this.authenRef = r)}
          onSubmit={this.onAuthenSubmit}
        />
        <View style={styles.playerContainer}>
          <ViewShot
            ref={ref => {
              this.viewShot = ref;
            }}>
            {videoPlayer}
          </ViewShot>
          {controlButtons}
        </View>
        {buttons}
        {timeline}
        {channelsList}
        {timePicker}
      </View>
    );
  }
  //#endregion Render
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: CMSColors.DarkTheme,
  },
  datetimeContainer: {
    flex: 10,
    flexDirection: 'row',
    margin: 28,
    backgroundColor: CMSColors.DarkElement,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  datetimeContainerFullscreen: {
    // margin: 28,
    // backgroundColor: CMSColors.DarkElement,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 140,
  },
  datetime: {
    textAlign: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    color: CMSColors.White,
  },
  calendarContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calendar: {
    flex: 1,
    // width: '100%',
    // height: '100%',
  },
  playerContainer: {
    flex: 44,
    justifyContent: 'flex-end',
    // alignContent: 'center',
  },
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
  controlButtonContainer: {
    position: 'absolute',
    width: IconViewSize,
    height: IconViewSize,
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    // marginTop: -IconViewSize / 2 + 12,
    // marginTop: -IconViewSize / 2,
    // backgroundColor: '#00ff0088',
  },
  controlButton: {
    color: CMSColors.White,
    // backgroundColor: CMSColors.OpacityButton,
    padding: 7,
  },
  pauseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    color: CMSColors.White,
  },
  buttonsContainers: {
    flex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: CMSColors.DarkElement,
  },
  buttonsContainersFullscreen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonWrap: {
    paddingRight: 25,
  },
  buttonStyle: {
    // color: CMSColors.White,
  },
  timelineContainer: {
    flex: 8,
    backgroundColor: CMSColors.DarkElement,
  },
  rulerContainer: {
    flex: 1,
    // backgroundColor: CMSColors.PrimaryColor54,
    flexDirection: 'row',
    alignContent: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeOnRuler: {
    backgroundColor: CMSColors.Transparent,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
  },
  channelContainer: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    backgroundColor: CMSColors.DarkTheme,
  },
  selectedChannelName: {
    fontSize: 14,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.White,
    justifyContent: 'center',
  },
  normalChannelName: {
    fontSize: 12,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.SecondaryText,
    justifyContent: 'center',
  },
  channelsListContainer: {
    flex: 30,
    justifyContent: 'center',
  },
  headerContainerFullscreen: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    top: 0,
    left: 0,
    width: '100%',
    height: '15%',
    backgroundColor: CMSColors.PrimaryText,
    opacity: 0.8,
    zIndex: 1,
  },
  headerBack: {justifyContent: 'flex-start', paddingLeft: 20},
  headerTitleWrap: {justifyContent: 'center', alignContent: 'center'},
  headerTitleText: {
    fontSize: 24,
    color: CMSColors.White,
    paddingLeft: 20,
  },
  footerContainerFullscreen: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    width: '100%',
    height: '20%',
    backgroundColor: CMSColors.PrimaryText,
    opacity: 0.8,
    zIndex: 1,
  },
  footerButtonsWrap: {
    flex: 30,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  left: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    // marginTop: 2,
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    ...Platform.select({
      android: {
        marginTop: 10,
      },
    }),
  },
  contentIcon: {
    paddingTop: 2,
  },
  title: {
    marginLeft: 5,
  },
});

export default inject('videoStore', 'appStore')(observer(VideoPlayerView));
