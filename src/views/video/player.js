import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  Platform,
  AppState,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {CalendarList} from 'react-native-calendars';
// import Modal, {SlideAnimation} from 'react-native-modals';
import Modal from 'react-native-modal';
import Orientation from 'react-native-orientation-locker';
import TimePicker from 'react-native-24h-timepicker';
import {DateTime} from 'luxon';

import CMSRipple from '../../components/controls/CMSRipple';
import CMSImage from '../../components/containers/CMSImage';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import TimeRuler from '../../components/controls/BetterTimeRuler';
import BackButton from '../../components/controls/BackButton';
import TimeOnTimeRuler from '../../components/controls/TimeOnTimeRuler';
import Swipe from '../../components/controls/Swipe';
import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import {IconCustom} from '../../components/CMSStyleSheet';
import {StatusBar} from 'react-native';

import snackbar from '../../util/snackbar';
import {normalize, isNullOrUndef, getAutoRotateState} from '../../util/general';
import {
  CLOUD_TYPE,
  HOURS_ON_SCREEN,
  CONTROLLER_TIMEOUT,
  VIDEO_MESSAGE,
  VIDEO_INACTIVE_TIMEOUT,
} from '../../consts/video';
import {
  NVRPlayerConfig,
  CALENDAR_DATE_FORMAT,
  OrientationType,
} from '../../consts/misc';
import CMSColors from '../../styles/cmscolors';
import {STREAM_STATUS, VIDEO as VIDEO_TXT} from '../../localization/texts';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import NVRAuthenModal from '../../components/views/NVRAuthenModal';

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
      showController: false,
      videoLoading: true,
      // pause: false,
      seekpos: {},
      sWidth: width,
      sHeight: height,
      // selectedHour: '0',
      // selectedMinute: '00',
      // selectedSecond: '00',
    };

    this.timelineAutoScroll = true;
    this.timeOnTimeline = null;
    // this.isNoDataSearch = false;
    this.eventSubscribers = [];
    this.resumeFromInterupt = false;
    this.lastOrientation = OrientationType.LANDSCAPE;
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
    Orientation.addDeviceOrientationListener(this.onOrientationChange);
    Orientation.unlockAllOrientations();
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
  }

  //#region Event handlers
  clearAppStateTimeout = () => {
    __DEV__ && console.log('GOND: clearAppStateTimeout ') && console.trace();
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
    // if (locked) {
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
    }
    this.onFullscreenPress(isFullscreen);
    return;
    // }

    if (
      [
        OrientationType.LANDSCAPE,
        OrientationType.LANDSCAPE_LEFT,
        OrientationType.LANDSCAPE_RIGHT,
      ].includes(orientation) &&
      !videoStore.isFullscreen
    ) {
      this.onFullscreenPress(true);
      // this.lastOrientation = orientation;
    } else if (
      [OrientationType.PORTRAIT, OrientationType.PORTRAIT_UPSIDE_DOWN].includes(
        orientation
      ) &&
      videoStore.isFullscreen
    ) {
      this.onFullscreenPress(false);
      // this.lastOrientation = OrientationType.PORTRAIT;
    }
    this.lastOrientation = orientation;
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

  // onVideoReady = () => {
  //   // TODO: get nvr timezone first
  //   const {videoStore} = this.props;
  //   __DEV__ && console.log('GOND onVideoReady', videoStore.searchPlayTime);
  //   videoStore.setStreamReadyCallback(null);
  //   if (videoStore.isLive) {
  //     // Did it auto play?
  //   } else if (this.playerRef) {
  //     if (videoStore.searchPlayTime) {
  //       // this.playerRef.playAt(videoStore.searchPlayTimeBySeconds);
  //       const searchTime = DateTime.fromISO(videoStore.searchPlayTime, {
  //         zone: 'utc',
  //       });
  //       __DEV__ && console.log('GOND onVideoReady 2 ', searchTime);

  //       this.onSetSearchTime(
  //         searchTime.hour,
  //         searchTime.minute,
  //         searchTime.second
  //       );
  //     } // else {
  //     // this.playerRef.playAt(0);
  //     // }
  //   }
  // };

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
  };

  onSwitchLiveSearch = () => {
    const {videoStore} = this.props;
    // videoStore.setNoVideo(false);
    videoStore.switchLiveSearch(undefined, true);
    this.updateHeader();
    this.playerRef && this.playerRef.pause(true);
    setTimeout(() => {
      this.channelsScrollView &&
        videoStore.selectedChannelIndex >= 0 &&
        this.channelsScrollView.scrollToIndex({
          animated: true,
          index: videoStore.selectedChannelIndex,
        });
    }, 200);
  };

  handleChannelsScroll = event => {};

  onSelectDate = value => {
    const {videoStore} = this.props;
    // value = {year, month, day, timestamp, dateString}
    __DEV__ &&
      console.log(
        'GOND onSelectDate: ',
        value,
        ', recording dates: ',
        Object.keys(videoStore.recordingDates)
      );

    videoStore.setDisplayDateTime(
      DateTime.fromFormat(value.dateString, CALENDAR_DATE_FORMAT).toFormat(
        NVRPlayerConfig.FrameFormat
      )
    );
    if (this.checkDataOnSearchDate(value.dateString)) {
      // videoStore.setNoVideo(false);
      this.setState({showCalendar: false});
      videoStore.setSearchDate(value.dateString, CALENDAR_DATE_FORMAT);
    } else {
      this.setState({showCalendar: false});
    }

    this.playerRef && this.playerRef.onChangeSearchDate(value);
  };

  onSetSearchTime = (hours, minutes, seconds) => {
    if (!this.playerRef) return;
    const secondsValue =
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
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

    // Should call?
    // if (videoStore.noVideo) {
    //   videoStore.setNoVideo(false);
    // }
    // this.playerRef && this.playerRef.pause();
    // setTimeout(() => {
    //   this.playerRef && this.playerRef.playAt(secondsValue);
    // }, 200);
    this.onTimelineScrollEnd(
      {},
      {hours, minutes, seconds, timestamp: secondsValue}
    );
    this.timePickerRef && this.timePickerRef.close();
  };

  onSwitchChannel = channelNo => {
    const {videoStore} = this.props;

    if (videoStore.selectedChannel && channelNo == videoStore.selectedChannel)
      return;

    if (videoStore.frameTimeString) {
      videoStore.setPlayTimeForSearch(
        DateTime.fromFormat(
          videoStore.frameTimeString,
          NVRPlayerConfig.FrameFormat
        ).toFormat(NVRPlayerConfig.RequestTimeFormat)
      );
    }
    // videoStore.setNoVideo(false);
    videoStore.selectChannel(channelNo);
    if (videoStore.paused && this.playerRef) this.playerRef.pause(false);
  };

  onChannelSnapshotLoaded = (param, image) => {};

  onTakeVideoSnapshot = () => {};

  onShowControlButtons = () => {
    __DEV__ && console.log('GOND onShowControlButtons');
    if (__DEV__ && this.props.videoStore.isFullscreen) {
      this.setState({showController: !this.state.showController});
    } else {
      this.setState({showController: true}, () => {
        __DEV__ && console.log('GOND onShowControlButtons already showed');
        if (this.controllerTimeout) clearTimeout(this.controllerTimeout);
        this.controllerTimeout = setTimeout(
          () => {
            __DEV__ && console.log('GOND onShowControlButtons hidden');
            if (this._isMounted) this.setState({showController: false});
          },
          __DEV__ ? 10000 : CONTROLLER_TIMEOUT
        );
      });
    }
  };

  onTimelineScrollEnd = (event, value) => {
    const {videoStore} = this.props;
    const {searchDate, timeline, timezone} = videoStore;
    // if (this.timelineScrollTimeout) {
    //   clearTimeout(this.timelineScrollTimeout);
    // }
    // this.timelineScrollTimeout = setTimeout(() => {
    const destinationTime = searchDate
      ? searchDate.plus({seconds: value.timestamp}).toSeconds()
      : DateTime.now()
          .setZone(timezone)
          .startOf('day')
          .plus({seconds: value.timestamp})
          .toSeconds();
    __DEV__ &&
      console.log(
        'GOND onTimeline sliding end: ',
        value,
        searchDate ?? DateTime.now().setZone(timezone).startOf('day'),
        destinationTime,
        timeline[timeline.length - 1],
        destinationTime >= timeline[timeline.length - 1].end
      );

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
    }
    if (this.playerRef) {
      // this.playerRef.pause();
      // setTimeout(() => this.playerRef.playAt(value.timestamp), 200);
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
  };

  onPrevious = () => {
    this.props.videoStore.previousChannel();
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

  renderVideo = () => {
    // if (!this._isMounted) return;
    const {videoStore} = this.props;
    const {selectedStream} = videoStore;
    const {pause, sWidth, sHeight} = this.state;
    const width = sWidth;
    const height = videoStore.isFullscreen ? sHeight : (sWidth * 9) / 16;
    // __DEV__ && console.log('GOND renderVid player: ', selectedStream);
    if (!selectedStream) {
      return (
        <Image
          style={{width: width, height: height}}
          source={NVR_Play_NoVideo_Image}
          resizeMode="cover"
        />
      );
    }

    let playerProps = {
      width: width,
      height: height,
      hdMode: videoStore.hdMode,
      isLive: videoStore.isLive,
      noVideo: videoStore.isLive ? false : videoStore.noVideo, // this.isNoDataSearch,
      searchDate: videoStore.searchDate,
      // searchPlayTime: videoStore.searchPlayTime,
      paused: videoStore.paused,
      singlePlayer: true,
    };
    let player = null;
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
        player = (
          <DirectVideoView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            serverInfo={selectedStream}
          />
        );
        break;
      case CLOUD_TYPE.HLS:
        player = (
          <HLSStreamingView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            streamData={selectedStream}
            // streamUrl={
            //   selectedStream.targetUrl
            //     ? videoStore.selectedStream.targetUrl.url
            //     : null
            // }
            // streamUrl={selectedStream.streamUrl}
            timezone={videoStore.timezone}
          />
        );
        break;
      case CLOUD_TYPE.RTC:
        player = (
          <RTCStreamingView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            viewer={selectedStream}
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

    return videoStore.isFullscreen && showController ? (
      <View
        style={[
          styles.footerContainerFullscreen,
          {
            top: sHeight * 0.8,
          },
        ]}>
        <View style={{flex: 75, alignContent: 'flex-start'}}>
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
        <CMSRipple
          onPress={() =>
            !isLive && this.timePickerRef && this.timePickerRef.open()
          }>
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
    } = videoStore;
    const {sHeight, showController} = this.state;
    // const IconSize = normalize(28); // normalize(sHeight * 0.035);

    return (
      <View style={styles.controlsContainer}>
        <View style={styles.controlButtonContainer}>
          {showController && selectedChannelIndex > 0 ? (
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
          ) : (
            <View />
          )}
        </View>
        <View style={styles.controlButtonContainer}>
          {!isLive &&
          this.playerRef &&
          !noVideo &&
          selectedStream &&
          !selectedStream.isLoading &&
          (showController || (paused && timeline && timeline.length > 0)) ? (
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
          ) : null}
        </View>
        <View style={styles.controlButtonContainer}>
          {showController &&
          selectedChannelIndex < displayChannels.length - 1 ? (
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
          ) : (
            <View />
          )}
        </View>
      </View>
    );
  };

  renderFeatureButtons = () => {
    const {videoStore} = this.props;
    // const {sWidth, sHeight} = this.state;
    // const IconSize = normalize(28); // normalize(sHeight * 0.035);
    return (
      <View
        style={
          videoStore.isFullscreen
            ? styles.buttonsContainersFullscreen
            : [
                styles.buttonsContainers,
                {
                  backgroundColor: this.state.showController
                    ? CMSColors.DarkElement
                    : CMSColors.Transparent,
                },
              ]
        }>
        {this.state.showController && (
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
            />
          </View>
        )}
        {this.state.showController && (
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
              onPress={() => videoStore.switchHD()}
              disabled={
                !videoStore.selectedStream ||
                // videoStore.selectedStream.isLoading ||
                !this.playerRef
              }
            />
          </View>
        )}
        {this.state.showController && (
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

    return videoStore.isLive ? (
      <View style={{flex: 8}}></View>
    ) : (
      <View style={styles.timelineContainer}>
        <View style={styles.rulerContainer}>
          <TimeRuler
            ref={r => (this.ruler = r)}
            searchDate={videoStore.searchDateInSeconds()} // if direct ('UTC', {keepLocalTime: true})
            height="100%"
            markerPosition="absolute"
            timeData={videoStore.timeline}
            currentTime={videoStore.frameTime}
            onBeginSrcoll={() => {
              this.timelineAutoScroll = false;
              if (
                videoStore.timeline.length > 0 &&
                videoStore.noVideo === true
              ) {
                videoStore.setNoVideo(false);
              }
            }}
            onScrollBeginDrag={time => {
              this.timeOnTimeline && this.timeOnTimeline.setValue(time);
            }}
            // onPauseVideoScrolling={() => this.setState({pause: true})}
            onPauseVideoScrolling={() =>
              // this.playerRef && this.playerRef.pause(true)
              this.playerRef && this.playerRef.onBeginDraggingTimeline()
            }
            setShowHideTimeOnTimeRule={value => {
              this.timeOnTimeline && this.timeOnTimeline.setShowHide(value);
            }}
            onScroll={() => {}}
            onScrollEnd={this.onTimelineScrollEnd}
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
          // resizeMode="cover"
          style={{height: imageW}}
          styleImage={[borderStyle, {width: imageW, height: imageW}]}
          dataCompleteHandler={this.onChannelSnapshotLoaded}
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
    } = this.props.videoStore;
    // console.log('GOND renderChannelsList: ', isFullscreen);
    const itemWidth = this.state.sWidth / NUM_CHANNELS_ON_SCREEN;
    // const channelsList = isLive ? activeChannels : allChannels;

    return isFullscreen ? null : (
      <View style={styles.channelsListContainer}>
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
      </View>
    );
  };

  renderTimePicker = () => {
    return (
      <TimePicker
        ref={ref => {
          this.timePickerRef = ref;
        }}
        onCancel={() => this.timePickerRef && this.timePickerRef.close()}
        onConfirm={this.onSetSearchTime}
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
        <NVRAuthenModal onSubmit={this.onAuthenSubmit} />
        <View
          style={styles.playerContainer}
          // onLongPress={__DEV__ ? this.onShowControlButtons : undefined}
        >
          <Swipe
            onSwipeLeft={this.onNext}
            onSwipeRight={this.onPrevious}
            onPress={this.onShowControlButtons}>
            {videoPlayer}
            {controlButtons}
          </Swipe>
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
    width: IconViewSize,
    height: IconViewSize,
    justifyContent: 'center',
    alignItems: 'center',
    // margin: 14,
  },
  controlButton: {
    color: CMSColors.White,
    backgroundColor: CMSColors.OpacityButton,
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
    flex: 25,
    justifyContent: 'center',
    paddingLeft: 20,
  },
});

export default inject('videoStore')(observer(VideoPlayerView));
