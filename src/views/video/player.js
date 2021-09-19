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
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {CalendarList} from 'react-native-calendars';
// import Modal, {SlideAnimation} from 'react-native-modals';
import Modal from 'react-native-modal';
import Orientation from 'react-native-orientation-locker';
import TimePicker from 'react-native-24h-timepicker';
import {DateTime} from 'luxon';

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

import snackbar from '../../util/snackbar';
import {normalize} from '../../util/general';
import {
  CLOUD_TYPE,
  HOURS_ON_SCREEN,
  CONTROLLER_TIMEOUT,
} from '../../consts/video';
import {NVRPlayerConfig, CALENDAR_DATE_FORMAT} from '../../consts/misc';
import CMSColors from '../../styles/cmscolors';
import {Video as VideoTxt} from '../../localization/texts';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import NVRAuthenModal from '../../components/views/NVRAuthenModal';

const NUM_CHANNELS_ON_SCREEN = 5;
const iconSize = normalize(28);

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
    this.isNoDataSearch = false;
  }

  componentDidMount() {
    __DEV__ && console.log('VideoPlayerView componentDidMount');
    const {videoStore} = this.props;
    this._isMounted = true;

    this.dimensionsChangeEvtSub = Dimensions.addEventListener(
      'change',
      this.onDimensionsChange
    );
    AppState.addEventListener('change', this.handleAppStateChange);
    this.updateHeader();
    // this.unsubSearchTimeReaction = reaction(
    //   () => videoStore.searchPlayTime,
    //   (value, previousValue) => {
    //     if (!videoStore.isLive) {
    //       const searchTime = DateTime.fromISO(value, {
    //         zone: 'utc',
    //       });
    //       __DEV__ &&
    //         console.log(
    //           'GOND on searchPlayTime reaction ',
    //           value,
    //           ' -> ',
    //           previousValue,
    //           '/n - DateTime = ',
    //           searchTime
    //         );

    //       this.onSetSearchTime(
    //         searchTime.hour,
    //         searchTime.minute,
    //         searchTime.second
    //       );
    //     }
    //   }
    // );
  }

  updateHeader = () => {
    const {navigation, videoStore} = this.props;
    navigation.setOptions({
      headerShown: !videoStore.isFullscreen,
      headerTitle: videoStore.isLive ? 'Live' : 'Search',
    });
  };

  componentWillUnmount() {
    __DEV__ && console.log('VideoPlayerView componentWillUnmount');
    this._isMounted = false;
    // Dimensions.removeEventListener('change', this.onDimensionsChange);
    this.dimensionsChangeEvtSub && this.dimensionsChangeEvtSub.remove();
    AppState.removeEventListener('change', this.handleAppStateChange);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
    const {videoStore} = this.props;

    if (videoStore.isSingleMode) {
      videoStore.releaseStreams();
    }
    if (videoStore.isFullscreen) {
      this.onFullscreenPress();
    }
    videoStore.resetVideoChannel();

    // dongpt: TODO handle Orientation
    Orientation.lockToPortrait();
    // this.unsubSearchTimeReaction();
  }

  handleAppStateChange = nextAppState => {
    __DEV__ &&
      console.log('GOND _handleAppStateChange nextAppState: ', nextAppState);
    const {videoStore} = this.props;
    if (nextAppState === 'active' && this.appState) {
      if (this.appState.match(/inactive|background/)) {
        // todo: check is already paused to not resume video
        // this.playerRef.pause(false);
        videoStore.pause(false);
      }
    } else {
      // this.playerRef.pause(true);
      videoStore.pause(true);
    }
    this.appState = nextAppState;
  };

  checkDataOnSearchDate = () => {
    // dongpt: add no data (selected a day without data)
    const {videoStore} = this.props;
    const recordingDates = {...(this.props.videoStore.recordingDates ?? {})};
    let datesList = [];
    if (typeof recordingDates == 'object') {
      datesList = Object.keys(recordingDates);
    }

    let selectedDate = videoStore.searchDate.toFormat(CALENDAR_DATE_FORMAT);
    __DEV__ &&
      console.log(
        'GOND checkDataOnSearchDate selectedDate = ',
        selectedDate,
        '\n --- object = ',
        videoStore.searchDate
      );
    // let selectedDate = USE_TIMESTAMP ? this.state.sdate.format('CALENDAR_DATE_FORMAT') : dayjs(this.searchDate * 1000).format('CALENDAR_DATE_FORMAT'); // .utcOffset(0)
    if (
      (!datesList && datesList.length <= 0) ||
      datesList.indexOf(selectedDate) < 0
    ) {
      __DEV__ && console.log('GOND: checkDataOnSearchDate NOVIDEO');
      this.isNoDataSearch = true;
      // this.playerRef.pause();
      videoStore.pause(true);
      snackbar.showMessage(VIDEO_MESSAGE.MSG_NO_VIDEO_DATA, true);
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

    this.isNoDataSearch = false;
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

  onFullscreenPress = () => {
    const {videoStore} = this.props;
    videoStore.switchFullscreen();
    this.updateHeader();
    if (videoStore.isFullscreen) {
      Orientation.lockToLandscape();
    } else {
      Orientation.lockToPortrait();
    }
  };

  onSwitchLiveSearch = () => {
    const {videoStore} = this.props;
    videoStore.switchLiveSearch();
    this.updateHeader();
    // if (this.playerRef) this.playerRef.pause(true);
    videoStore.pause(true);
    setTimeout(() => {
      this.channelsScrollView &&
        this.channelsScrollView.scrollToIndex({
          animated: true,
          index: videoStore.selectedChannelIndex,
        });
    }, 200);
  };

  handleChannelsScroll = event => {};

  onSelectDate = value => {
    // value = {year, month, day, timestamp, dateString}
    __DEV__ && console.log('GOND onSelectDate: ', value);
    this.props.videoStore.setSearchDate(value.dateString, CALENDAR_DATE_FORMAT);
    if (this.checkDataOnSearchDate()) {
      this.setState({showCalendar: false});
    } else {
      // this.playerRef.pause();
      this.setState({showCalendar: false});
    }
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
    this.playerRef.playAt(secondsValue);
  };

  onSwitchChannel = channelNo => {
    const {videoStore} = this.props;
    videoStore.selectChannel(channelNo);
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
        this.controllerTimeout = setTimeout(() => {
          __DEV__ && console.log('GOND onShowControlButtons hidden');
          if (this._isMounted) this.setState({showController: false});
        }, CONTROLLER_TIMEOUT);
      });
    }
  };

  onTimelineScrollEnd = (event, value) => {
    __DEV__ && console.log('GOND onTimeline sliding end: ', value);
    if (this.playerRef) {
      // this.playerRef.pause();
      if (this.timelineScrollTimeout) {
        clearTimeout(this.timelineScrollTimeout);
      }
      this.timelineScrollTimeout = setTimeout(() => {
        if (this.playerRef) {
          this.playerRef.playAt(value.timestamp);
        }
        this.timelineScrollTimeout = null;
      }, 500);
    } else {
      __DEV__ && console.log('GOND playAt failed playerRef not available!');
    }
  };

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
            ? sHeight * 0.35
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
    const height = videoStore.isFullscreen ? sHeight : (sWidth * 9) / 16;
    // __DEV__ &&
    //   console.log('GOND renderVid player: ', videoStore.selectedStream);
    if (!selectedStream) {
      return (
        <Image
          style={{width: sWidth, height: height}}
          source={NVR_Play_NoVideo_Image}
        />
      );
    }

    let playerProps = {
      width: sWidth,
      height: height,
      hdMode: videoStore.hdMode,
      isLive: videoStore.isLive,
      noVideo: videoStore.isLive ? false : this.isNoDataSearch,
      searchDate: videoStore.searchDate,
      searchPlayTime: videoStore.searchPlayTime,
      paused: videoStore.paused,
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
            {videoStore.isLive ? VideoTxt.live : VideoTxt.search}
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
              paddingBottom: (sHeight * 0.2 - iconSize) / 4,
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
      {fontSize: normalize(isFullscreen ? 24 : 32)},
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
          <TouchableOpacity
            onPress={() => !isLive && this.setState({showCalendar: true})}>
            <Text style={textStyle}>{date}</Text>
          </TouchableOpacity>
        )}
        {isLive ? null : <Text style={textStyle}> - </Text>}
        <TouchableOpacity
          onPress={() =>
            !isLive && this.timePickerRef && this.timePickerRef.open()
          }>
          <Text style={textStyle}>{time}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  renderControlButtons = () => {
    if (!this.state.showController) {
      return null;
    }

    const {videoStore} = this.props;
    const {isLive, selectedChannelIndex, displayChannels, paused} = videoStore;
    const {sHeight} = this.state;
    // const iconSize = normalize(28); // normalize(sHeight * 0.035);

    return (
      <View style={styles.controlsContainer}>
        {selectedChannelIndex > 0 ? (
          <IconCustom
            name="keyboard-left-arrow-button"
            size={iconSize}
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
        {!isLive && this.playerRef ? (
          <IconCustom
            name={paused ? 'play' : 'pause'}
            size={iconSize + 4}
            style={styles.pauseButton}
            onPress={() => {
              // const willPause = paused;
              // this.setState({pause: willPause});
              // this.playerRef.pause();
              videoStore.pause();
            }}
          />
        ) : null}
        {selectedChannelIndex < displayChannels.length - 1 ? (
          <IconCustom
            name="keyboard-right-arrow-button"
            size={iconSize}
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
    );
  };

  renderFeatureButtons = () => {
    const {videoStore} = this.props;
    // const {sWidth, sHeight} = this.state;
    // const iconSize = normalize(28); // normalize(sHeight * 0.035);

    return (
      <View
        style={
          videoStore.isFullscreen
            ? styles.buttonsContainersFullscreen
            : styles.buttonsContainers
        }>
        <View style={styles.buttonWrap}>
          <CMSTouchableIcon
            iconCustom={
              videoStore.isLive
                ? 'searching-magnifying-glass'
                : 'videocam-filled-tool'
            }
            color={CMSColors.White}
            size={iconSize}
            // style={styles.buttonStyle}
            onPress={this.onSwitchLiveSearch}
            // disabled={videoStore.isLoading || !this.playerRef}
          />
        </View>
        {/* 
        <View style={styles.buttonWrap}>
        <CMSTouchableIcon
          name="camera"
          size={iconSize}
          style={styles.buttonStyle}
          onPress={this.onTakeVideoSnapshot}
        /> 
        </View>*/}
        <View style={styles.buttonWrap}>
          <CMSTouchableIcon
            iconCustom="hd"
            color={
              videoStore.hdMode === true
                ? CMSColors.PrimaryActive
                : CMSColors.White
            }
            size={iconSize}
            // style={styles.buttonStyle}
            onPress={() => videoStore.switchHD()}
            disabled={videoStore.isLoading || !this.playerRef}
          />
        </View>
        <View style={styles.buttonWrap}>
          <CMSTouchableIcon
            iconCustom={
              videoStore.isFullscreen
                ? 'out-fullscreen'
                : 'switch-to-full-screen-button'
            }
            size={iconSize}
            color={CMSColors.White}
            // style={styles.buttonStyle}
            onPress={this.onFullscreenPress}
          />
        </View>
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
            height="80%"
            markerPosition="absolute"
            timeData={videoStore.timeline}
            currentTime={videoStore.frameTime}
            onBeginSrcoll={() => {
              this.timelineAutoScroll = false;
            }}
            onScrollBeginDrag={time => {
              this.timeOnTimeline && this.timeOnTimeline.setValue(time);
            }}
            // onPauseVideoScrolling={() => this.setState({pause: true})}
            onPauseVideoScrolling={() => videoStore.pause(true)}
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
      <TouchableOpacity
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
      </TouchableOpacity>
    );
  };

  renderChannelsList = () => {
    const {allChannels, selectedChannelIndex, selectedStream} =
      this.props.videoStore;
    // console.log('GOND renderChannelsList: ', displayChannels);
    const itemWidth = this.state.sWidth / NUM_CHANNELS_ON_SCREEN;

    return (
      <View style={styles.channelsListContainer}>
        <FlatList
          ref={r => (this.channelsScrollView = r)}
          style={{flex: 1}}
          data={[{}, {}, ...allChannels, {}, {}]}
          renderItem={this.renderChannelItem}
          keyExtractor={(item, index) => item.channelNo ?? 'dummy' + index}
          getItemLayout={(data, index) => ({
            length: itemWidth,
            offset: itemWidth * index,
            index,
          })}
          initialNumToRender={allChannels.length + 4}
          initialScrollIndex={
            selectedStream.channelNo == null ? undefined : selectedChannelIndex
          }
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

  onNext = () => {
    this.props.videoStore.nextChannel();
  };

  onPrevious = () => {
    this.props.videoStore.previousChannel();
  };

  render() {
    const {videoStore} = this.props;
    const {isFullscreen} = videoStore;

    const fullscreenHeader = this.renderFullscreenHeader();
    const fullscreenFooter = this.renderFullscreenFooter();
    const datetimeBox = isFullscreen ? null : this.renderDatetime();
    const videoPlayer = this.renderVideo();
    const channelsList = isFullscreen ? null : this.renderChannelsList();
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
        <NVRAuthenModal store={videoStore} />
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
  controlButton: {
    color: CMSColors.White,
    backgroundColor: CMSColors.OpacityButton,
    padding: 7,
    margin: 14,
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
