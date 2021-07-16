import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {CalendarList} from 'react-native-calendars';
import Modal, {ModalContent, SlideAnimation} from 'react-native-modals';

import CMSImage from '../../components/containers/CMSImage';
import TimeRuler from '../../components/controls/BetterTimeRuler';
import TimeOnTimeRuler from '../../components/controls/TimeOnTimeRuler';
import Swipe from '../../components/controls/Swipe';
import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import {IconCustom} from '../../components/CMSStyleSheet';

import {normalize} from '../../util/general';
import {CLOUD_TYPE, HOURS_ON_SCREEN} from '../../consts/video';
import {NVRPlayerConfig, CALENDAR_DATE_FORMAT} from '../../consts/misc';
import CMSColors from '../../styles/cmscolors';
import {DateTime} from 'luxon';

const NUM_CHANNELS_ON_SCREEN = 5;

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
      pause: false,
      seekpos: {},
      sWidth: width,
      sHeight: height,
    };

    this.timelineAutoScroll = true;
    this.timeOnTimeline = null;
  }

  componentDidMount() {
    __DEV__ && console.log('VideoPlayerView componentDidMount');
    this._isMounted = true;

    Dimensions.addEventListener('change', this.onDimensionsChange);
    this.updateHeader();
  }

  updateHeader = () => {
    const {navigation, videoStore} = this.props;
    navigation.setOptions({
      headerTitle: videoStore.isLive ? 'Live' : 'Search',
    });
  };

  componentWillUnmount() {
    __DEV__ && console.log('VideoPlayerView componentWillUnmount');
    this._isMounted = false;
    Dimensions.removeEventListener('change', this.onDimensionsChange);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
    this.props.videoStore.reset();
    // this.props.videoStore.pauseAll(false);
  }

  onDimensionsChange = window => {
    const {width, height} = window;
    this.setState({sWidth: width, sHeight: height});
  };

  onSwitchLiveSearch = () => {
    // if (this.playerRef) this.playerRef.pause(true);
    setTimeout(() => {
      this.props.videoStore.switchLiveSearch();
      this.updateHeader();
    }, 200);
  };

  handleChannelsScroll = event => {};

  onSelectTime = () => {};

  onSwitchChannel = channelNo => {
    this.props.videoStore.selectChannel(channelNo);
  };

  onChannelSnapshotLoaded = (param, image) => {};

  onTakeVideoSnapshot = () => {};

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
      <View>
        <Modal
          visible={this.state.showCalendar}
          onTouchOutside={() => this.setState({showCalendar: false})}
          width={sWidth * 0.7}
          height={sHeight * 0.5}
          modalAnimation={new SlideAnimation({slideFrom: 'top'})}>
          <View style={styles.calendarContainer}>
            <CalendarList
              style={styles.calendar}
              onDayPress={value => {
                // value = {year, month, day, timestamp, dateString}
                videoStore.setSearchDate(value.dateString);
                this.setState({showCalendar: false});
              }}
              markedDates={videoStore.recordingDates}
              disableMonthChange={false}
              markingType={'period'}
            />
          </View>
        </Modal>
      </View>
    );
  };

  renderVideo = () => {
    if (!this._isMounted) return;
    const {videoStore} = this.props;
    const {pause, sWidth} = this.state;
    const height = (sWidth * 9) / 16;
    // __DEV__ &&
    console.log('GOND renderVid player: ', videoStore.selectedStream);

    let playerProps = {
      width: sWidth,
      height: height,
      hdMode: videoStore.hdMode,
      isLive: videoStore.isLive,
    };
    let player = null;
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
        player = (
          <DirectVideoView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            serverInfo={videoStore.selectedStream}
          />
        );
        break;
      case CLOUD_TYPE.HLS:
        player = (
          <HLSStreamingView {...playerProps} ref={r => (this.playerRef = r)} />
        );
        break;
      case CLOUD_TYPE.RTC:
        player = (
          <RTCStreamingView
            {...playerProps}
            ref={r => (this.playerRef = r)}
            viewer={videoStore.selectedStream}
          />
        );
        break;
    }

    return player;
  };

  renderDatetime = () => {
    const {displayDateTime, isLive, isFullscreen} = this.props.videoStore;
    const {sHeight} = this.state;

    return isFullscreen ? null : (
      <TouchableOpacity
        style={styles.datetimeContainer}
        onPress={() => !isLive && this.setState({showCalendar: true})}>
        <Text style={[styles.datetime, {fontSize: normalize(sHeight * 0.04)}]}>
          {isLive ? displayDateTime.split(' - ')[1] ?? '' : displayDateTime}
          {/* {isLive ? null : <Text>{searchDate} - </Text>}
        <Text>{frameTime}</Text>*/}
        </Text>
      </TouchableOpacity>
    );
  };

  renderControlButtons = () => {
    if (!this.state.showController) {
      return null;
    }

    const {
      isLive,
      selectedChannelIndex,
      displayChannels,
      nextChannel,
      previousChannel,
    } = this.props.videoStore;
    const {sHeight} = this.state;
    const iconSize = normalize(sHeight * 0.035);

    return (
      <View style={styles.controlsContainer}>
        {selectedChannelIndex > 0 ? (
          <IconCustom
            name="keyboard-left-arrow-button"
            size={iconSize}
            onPress={previousChannel}
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
        {(isLive && !this.playerRef) || (
          <IconCustom
            name={this.state.pause ? 'play' : 'pause'}
            size={iconSize}
            style={{justifyContent: 'center', color: CMSColors.White}}
            onPress={() => {
              const willPause = !this.state.pause;
              this.setState({pause: willPause});
              this.playerRef.pause(willPause);
            }}
          />
        )}
        {selectedChannelIndex < displayChannels.length - 1 ? (
          <IconCustom
            name="keyboard-right-arrow-button"
            size={iconSize}
            onPress={nextChannel}
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
    const {sWidth, sHeight} = this.state;
    // TODO add iconSize to state
    const iconSize = normalize(sHeight * 0.035);

    return (
      <View style={styles.buttonsContainers}>
        <IconCustom
          name={
            videoStore.isLive
              ? 'searching-magnifying-glass'
              : 'videocam-filled-tool'
          }
          size={iconSize}
          style={[styles.buttonStyle, {paddingRight: sWidth * 0.05}]}
          onPress={this.onSwitchLiveSearch}
        />
        <IconCustom
          name="camera"
          size={iconSize}
          style={[styles.buttonStyle, {paddingRight: sWidth * 0.05}]}
          onPress={this.onTakeVideoSnapshot}
        />
        <IconCustom
          name="hd"
          size={iconSize}
          style={[
            styles.buttonStyle,
            {
              color: videoStore.hdMode
                ? CMSColors.PrimaryActive
                : CMSColors.White,
              paddingRight: sWidth * 0.05,
            },
          ]}
          onPress={() => videoStore.switchHD()}
        />
        <IconCustom
          name="switch-to-full-screen-button"
          size={iconSize}
          style={[styles.buttonStyle, {paddingRight: sWidth * 0.05}]}
          onPress={() => videoStore.switchFullscreen()}
        />
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
            searchDate={videoStore.searchDateInSeconds}
            height="80%"
            markerPosition="absolute"
            timeData={videoStore.timeline}
            currentTime={videoStore.frameTime}
            onBeginSrcoll={() => {
              this.timelineAutoScroll = false;
            }}
            onScrollBeginDrag={time => {
              this.timeOnTimeline.setValue(time);
            }}
            onPauseVideoScrolling={() => this.setState({pause: true})}
            setShowHideTimeOnTimeRule={value => {
              this.timeOnTimeline.setShowHide(value);
            }}
            onScroll={() => {}}
            onScrollEnd={(event, value) => {
              __DEV__ && console.log('GOND onTimeline sliding end: ', value);
              if (this.playerRef) {
                this.playerRef.pause();
                setTimeout(
                  () => this.playerRef.playAt(value.milisecondValue),
                  500
                );
              }
            }}
          />
        </View>
        <TimeOnTimeRuler
          // key="1"
          ref={r => (this.timeOnTimeline = r)}
          styles={[styles.timeOnRuler, {left: sWidth / 2 - 30}]}
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
    const {isFullscreen, displayChannels, selectedChannelIndex} =
      this.props.videoStore;
    // console.log('GOND renderChannelsList: ', displayChannels);
    const itemWidth = this.state.sWidth / NUM_CHANNELS_ON_SCREEN;

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
          initialScrollIndex={selectedChannelIndex}
          horizontal={true}
          onScroll={this.handleChannelsScroll}
        />
      </View>
    );
  };

  render() {
    const {videoStore} = this.props;

    const datetimeBox = this.renderDatetime();
    const videoPlayer = this.renderVideo();
    const channelsList = this.renderChannelsList();
    const buttons = this.renderFeatureButtons();
    const timeline = this.renderTimeline();
    const controlButtons = this.renderControlButtons();

    return (
      <View style={styles.screenContainer}>
        {datetimeBox}
        <View style={styles.playerContainer}>
          <Swipe
            onSwipeLeft={() => videoStore.nextChannel()}
            onSwipeRight={() => videoStore.previousChannel()}>
            {videoPlayer}
            {controlButtons}
          </Swipe>
        </View>
        {buttons}
        {timeline}
        {channelsList}
        {this.renderCalendar()}
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
    margin: 28,
    backgroundColor: CMSColors.DarkElement,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
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
    width: '100%',
    height: '100%',
  },
  playerContainer: {
    flex: 44,
    justifyContent: 'flex-end',
    // alignContent: 'center',
    // borderWidth: 2,
    // borderColor: 'blue',
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
  buttonsContainers: {
    flex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: CMSColors.DarkElement,
  },
  buttonStyle: {
    color: CMSColors.White,
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
});

export default inject('videoStore')(observer(VideoPlayerView));
