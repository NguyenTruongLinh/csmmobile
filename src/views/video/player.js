import React, {Component, Fragment} from 'react';
import {
  View,
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
import NVRAuthenModal from '../../components/views/NVRAuthenModal';

import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import {StatusBar} from 'react-native';

import VideoDateModal from './videoDateModal';
import VideoTimeModal from './videoTimeModal';

import snackbarUtil from '../../util/snackbar';
import CameraRoll from '@react-native-community/cameraroll';

import {normalize, isNullOrUndef} from '../../util/general';
import {
  CLOUD_TYPE,
  CONTROLLER_TIMEOUT,
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
import styles from './styles/playerStyles';

const NUM_CHANNELS_ON_SCREEN = 5;
const IconSize = normalize(28);

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
      seekpos: {},
      sWidth: width,
      sHeight: this.getVideoHeight(width, height),
      selectedTime: {hour: 0, minute: 0, second: 0},
      timePickerDatetime: props.videoStore.getSafeSearchDate(),
      buttonBoxHeight: 0,
    };

    this.timelineAutoScroll = true;
    this.timeOnTimeline = null;
    this.eventSubscribers = [];
    this.resumeFromInterupt = false;
    this.lastOrientation = OrientationType.LANDSCAPE;
    this.ruler = null;
    this.savedTimelinePosition = null;
    this.reactions = [];
    this.lastRulerPosition = 0;
    this.shouldRefreshChannelList = false;
  }

  componentDidMount() {
    __DEV__ && console.log('VideoPlayerView componentDidMount');
    const {videoStore} = this.props;
    this._isMounted = true;

    this.eventSubscribers = [
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
    AppState.removeEventListener('change', this.handleAppStateChange);
    const {videoStore, route} = this.props;

    videoStore.selectedStream &&
      videoStore.selectedStream.setStreamStatus({
        connectionStatus: STREAM_STATUS.DONE,
      });
    let finalStatusfullscreen = videoStore.isFullscreen;
    videoStore.setNoVideo(false);
    videoStore.setStretch(true);
    if (videoStore.isFullscreen) {
      this.onFullscreenPress(false);
    }

    if (!videoStore.isPreloadStream) {
      videoStore.onExitSinglePlayer(route.name);
    }

    // dongpt: TODO handle Orientation
    Orientation.removeDeviceOrientationListener(this.onOrientationChange);
    Orientation.lockToPortrait();
    this.reactions.forEach(unsubsribe => unsubsribe());
  }

  componentDidUpdate(prevProps) {
    const {videoStore} = this.props;

    if (this.ruler && this.savedTimelinePosition) {
      this.ruler.moveToPosition(this.savedTimelinePosition);
      videoStore.setDisplayDateTime(
        videoStore.beginSearchTime.toFormat(NVRPlayerConfig.FrameFormat)
      );
      this.savedTimelinePosition = null;
    }
  }

  initReactions = () => {
    const {videoStore} = this.props;

    this.reactions = [
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
            this.ruler.moveToPosition(videoStore.beginSearchTimeOffset);
            videoStore.setDisplayDateTime(
              searchTime.toFormat(NVRPlayerConfig.FrameFormat)
            );
          } else {
            this.savedTimelinePosition = videoStore.beginSearchTimeOffset;
          }
        }
      ),
    ];
  };

  getVideoHeight = (width, height) => {
    return this.props.videoStore.isFullscreen ? height : (width * 9) / 16;
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
                videoStore.resumeVideoStreamFromBackground(true);
              } else {
                __DEV__ &&
                  console.log(
                    'GOND _handleAppStateChange resume playing failed: HLS no selected channel: ',
                    videoStore.selectedChannel
                  );
              }
              break;
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
    let datesList = Object.keys(recordingDates);

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
      videoStore.setNoVideo(true);

      __DEV__ && console.log('GOND PAUSE 2 false');
      return false;
    }

    this.forceUpdate();
    return true;
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
    }
    __DEV__ && console.log('GOND onFullscreenPress: ', isFullscreen, manually);
    StatusBar.setHidden(videoStore.isFullscreen);
    this.playerRef && this.playerRef.resetZoom();
    if (!isFullscreen) {
      this.shouldRefreshChannelList = true;
    }
  };

  onSwitchLiveSearch = () => {
    const {videoStore} = this.props;
    this.playerRef && this.playerRef.onSwitchLiveSearch(!videoStore.isLive);
    this.lastRulerPosition = 0;
    videoStore.switchLiveSearch(undefined, true);
    this.updateHeader();
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
    __DEV__ &&
      console.log(
        'ImcVideoReceiverConnection onHDMode ====================================================================================='
      );
  };

  onStretch = () => {
    this.playerRef && this.playerRef.onStretch(!this.props.videoStore.stretch);
    this.props.videoStore.setStretch();
  };

  handleChannelsScroll = event => {};

  onSelectDate = dateString => {
    if (!dateString) return;
    const {videoStore} = this.props;
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

    this.ruler && this.ruler.moveToPosition(0);
    if (this.checkDataOnSearchDate(dateString)) {
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
    this.ruler && this.ruler.moveToPosition(secondsValue);
    this.playerRef && this.playerRef.onBeginDraggingTimeline();

    if (
      videoStore.timeline &&
      videoStore.timeline.length > 0 &&
      videoStore.noVideo == true
    ) {
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
    videoStore.setStretch(true);
    this.playerRef && this.playerRef.onStretch(true);
    videoStore.selectChannel(channelNo);
    this.playerRef && this.playerRef.resetZoom();
    // if (videoStore.paused && this.playerRef) this.playerRef.pause(false);
  };

  onChannelSnapshotLoaded = (channel, params, imageData) => {
    channel.saveSnapshot(imageData);
  };

  onTakeVideoSnapshot = () => {};

  onShowControlButtons = () => {
    if (__DEV__) {
      this.setState({showController: !this.state.showController});
    } else {
      this.setState({showController: true}, () => {
        if (this.controllerTimeout) clearTimeout(this.controllerTimeout);
        this.controllerTimeout = setTimeout(
          () => {
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
    __DEV__ && console.log(`GOND onTimelineScrollBegin `);

    this.timelineAutoScroll = false;
    if (
      videoStore.timeline &&
      videoStore.timeline.length > 0 &&
      videoStore.noVideo == true
    ) {
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
    const searchDate = videoStore.getSafeSearchDate();
    __DEV__ &&
      console.log(`onTimelineScrollEnd value.timestamp = `, value.timestamp);
    const destinationTime = searchDate
      .plus({seconds: value.timestamp})
      .toSeconds();

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

    if (!videoStore.checkTimeOnTimeline(destinationTime)) {
      __DEV__ && console.log('GOND onTimeline sliding end: AAAAAAAA');

      videoStore.setNoVideo(true, false);
      return;
    }
    videoStore.setBeginSearchTime(destinationTime);
    if (this.playerRef) {
      this.playerRef.playAt(value.timestamp);
    } else {
      __DEV__ && console.log('GOND playAt failed playerRef not available!');
    }
  };

  onAuthenSubmit = (username, password) => {
    if (
      this.playerRef &&
      this.playerRef.onLoginInfoChanged &&
      typeof this.playerRef.onLoginInfoChanged == 'function'
    )
      this.playerRef.onLoginInfoChanged(username, password);
  };

  adjustChannelListPosition = () => {
    const {videoStore} = this.props;
    __DEV__ &&
      console.log(
        'GOND adjustChannelListPosition: ',
        videoStore.selectedChannelIndex
      );
    this.channelsScrollView &&
      this.channelsScrollView.scrollToIndex({
        index: videoStore.isChannelListAtTheEnd
          ? videoStore.selectedChannelIndex
          : videoStore.selectedChannelIndex + 2,
        viewPosition: 0.5,
      });
  };

  onNext = () => {
    this.onSwitchChannel(this.props.videoStore.nextChannel);
    this.adjustChannelListPosition();
  };

  onPrevious = () => {
    this.onSwitchChannel(this.props.videoStore.previousChannel);
    this.adjustChannelListPosition();
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

  onScreenLayout = evt => {
    if (!evt.nativeEvent || !evt.nativeEvent.layout) return;

    const {width, height} = evt.nativeEvent.layout;
    const sHeight = this.getVideoHeight(width, height);

    if (width != this.state.sWidth || sHeight != this.state.sHeight) {
      this.setState({sWidth: width, sHeight});
    }

    if (this.shouldRefreshChannelList) {
      this.shouldRefreshChannelList = false;
      this.adjustChannelListPosition();
    }
  };

  onControlButtonLayout = evt => {
    if (this.state.buttonBoxHeight != evt.nativeEvent.layout.height)
      this.setState({buttonBoxHeight: evt.nativeEvent.layout.height});
  };

  //#endregion Event handlers

  renderCalendar = () => {
    const {videoStore} = this.props;
    const {displayDateTime, isFullscreen} = videoStore;
    const [date] = displayDateTime.split(' - ');
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
    const {videoStore} = this.props;
    const {selectedStream, isAuthenticated, selectedStreamSnapshot} =
      videoStore;
    const {sWidth, sHeight, showController} = this.state;
    const width = sWidth;
    const height = sHeight;
    if (!selectedStream || !selectedStream.channel || !isAuthenticated) {
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
    if (!canPlay) {
      __DEV__ && console.log('GOND renderVid player NO PERMISSION');
      return (
        <ImageBackground
          source={selectedStreamSnapshot ?? NVR_Play_NoVideo_Image}
          style={{width: width, height: height}}
          resizeMode="cover">
          <TouchableWithoutFeedback onPress={this.onShowControlButtons}>
            <View style={styles.container}>
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
      noVideo: videoStore.isLive ? false : videoStore.noVideo,
      searchDate: videoStore.getSafeSearchDate(),
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
    const {showController} = this.state;

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
        <View style={styles.footerScreenTimelineContainer}>
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
    const {videoStore} = this.props;
    const {
      isLive,
      displayChannels,
      paused,
      noVideo,
      selectedStream,
      cloudType,
    } = videoStore;
    const {sHeight, buttonBoxHeight, showController} = this.state;

    let showPlayPauseButton =
      !isLive &&
      !noVideo &&
      selectedStream &&
      !selectedStream.isLoading &&
      selectedStream.isReady;
    if (cloudType == CLOUD_TYPE.HLS) {
      showPlayPauseButton = showPlayPauseButton && selectedStream.streamUrl;
    }

    const bottomPos = (sHeight - buttonBoxHeight) / 2;

    return (
      <Fragment>
        {showController && displayChannels.length > 1 && (
          <View
            style={[styles.controlButtonContainer, {bottom: bottomPos}]}
            onLayout={this.onControlButtonLayout}>
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
              {left: '45%', bottom: bottomPos},
            ]}
            onLayout={this.onControlButtonLayout}>
            <IconCustom
              name={paused ? 'play' : 'pause'}
              size={IconSize + 4}
              style={styles.pauseButton}
              onPress={() => {
                this.playerRef && this.playerRef.pause(!paused);
              }}
            />
          </View>
        )}
        {showController && displayChannels.length > 1 && (
          <View
            style={[
              styles.controlButtonContainer,
              {
                right: 0,
                bottom: bottomPos,
              },
            ]}
            onLayout={this.onControlButtonLayout}>
            <IconCustom
              name="keyboard-right-arrow-button"
              size={IconSize}
              onPress={this.onNext}
              style={[
                styles.controlButton,
                {
                  justifyContent: 'flex-end',
                  paddingRight: 5,
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
    const {videoStore, isLive} = this.props;
    const {showController} = this.state;
    const isMenuReady = videoStore.selectedStream
      ? videoStore.selectedStream.isMenuReady ?? true
      : false;

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
              onPress={this.onSwitchLiveSearch}
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
              disabled={!isMenuReady}
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
                videoStore.hdMode == true
                  ? CMSColors.PrimaryActive
                  : CMSColors.White
              }
              size={IconSize}
              onPress={this.onHDMode}
              disabled={
                !videoStore.selectedStream || !this.playerRef || !isMenuReady
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

    return videoStore.isLive || !videoStore.isAuthenticated ? (
      <View style={styles.timelineNoView}></View>
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
            onScrolling={this.onDraggingTimeRuler}
            onPauseVideoScrolling={() => {
              __DEV__ && console.log(`GOND onPauseVideoScrolling `);
              this.playerRef && this.playerRef.onBeginDraggingTimeline();
              if (
                videoStore.timeline &&
                videoStore.timeline.length > 0 &&
                videoStore.noVideo == true
              ) {
                videoStore.setNoVideo(false);
              }
            }}
            setShowHideTimeOnTimeRule={value => {
              this.timeOnTimeline && this.timeOnTimeline.setShowHide(value);
            }}
            onScrollEnd={this.onTimelineScrollEnd}
            onPositionChanged={secOffset => {
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
      displayChannels,
      selectedChannelIndex,
      selectedStream,
      selectedChannel,
      isFullscreen,
      isAuthenticated,
    } = this.props.videoStore;
    const itemWidth = this.state.sWidth / NUM_CHANNELS_ON_SCREEN;

    return isFullscreen ? null : (
      <View style={styles.channelsListContainer}>
        {isAuthenticated && (
          <FlatList
            ref={r => (this.channelsScrollView = r)}
            style={styles.container}
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
    return Platform.OS == 'ios' ? (
      <TimePicker
        ref={ref => {
          this.timePickerRef = ref;
        }}
        onCancel={() => this.timePickerRef && this.timePickerRef.close()}
        selectedTime={this.state.selectedTime}
        onConfirm={this.onSetSearchTime}
        datetime={this.props.videoStore.getSafeSearchDate()}
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

    return (
      <View style={styles.screenContainer} onLayout={this.onScreenLayout}>
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

export default inject('videoStore', 'appStore')(observer(VideoPlayerView));
