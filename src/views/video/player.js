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

import CMSImage from '../../components/containers/CMSImage';
import TimeRuler from '../../components/controls/BetterTimeRuler';
import Swipe from '../../components/controls/Swipe';
import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import {IconCustom} from '../../components/CMSStyleSheet';

import {normalize} from '../../util/general';
import {CLOUD_TYPE} from '../../consts/video';
import CMSColors from '../../styles/cmscolors';
import {blue, green} from 'chalk';
import {event} from 'react-native-reanimated';

const NUM_CHANNELS_ON_SCREEN = 5;

class VideoPlayerView extends Component {
  static defaultProps = {
    enableSwitchChannel: true,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('VideoPlayerView componentDidMount');
    const {navigation, videoStore} = this.props;
    // if (Platform.OS === 'ios') {
    //   const eventEmitter = new NativeEventEmitter(NativeModules.FFMpegFrameEventEmitter)
    //   this.appStateEventListener = eventEmitter.addListener('onFFMPegFrameChange', this.onChange)
    // }

    navigation.setOptions({
      headerTitle: videoStore.isLive ? 'Live' : 'Search',
    });
  }

  componentWillUnmount() {
    __DEV__ && console.log('VideoPlayerView componentWillUnmount');
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
  }

  onLayout = event => {};

  handleChannelsScroll = event => {};

  onSelectDate = () => {};

  onSwitchChannel = channelNo => {
    this.props.videoStore.selectChannel(channelNo);
  };

  onChannelSnapshotLoaded = (param, image) => {};

  onTakeVideoSnapshot = () => {};

  renderVideo = () => {
    const {videoStore} = this.props;
    const {width} = Dimensions.get('window');
    const height = (width * 9) / 16;
    __DEV__ &&
      console.log('GOND renderVid player: ', videoStore.selectedStream);

    let playerProps = {
      width: width,
      height: height,
    };
    let player = null;
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
        player = (
          <DirectVideoView
            {...playerProps}
            serverInfo={videoStore.selectedStream}
          />
        );
        break;
      case CLOUD_TYPE.HLS:
        player = <HLSStreamingView {...playerProps} />;
        break;
      case CLOUD_TYPE.RTC:
        player = (
          <RTCStreamingView
            {...playerProps}
            viewer={videoStore.selectedStream}
          />
        );
        break;
    }

    return player;
  };

  renderDatetime = () => {
    const {searchDate, frameTime, isLive, isFullscreen} = this.props.videoStore;
    const {height} = Dimensions.get('window');

    return isFullscreen ? null : (
      <View style={styles.datetimeContainer}>
        <Text style={[styles.datetime, {fontSize: normalize(height * 0.04)}]}>
          {isLive ? null : (
            <Text onPress={this.onSelectDate}>{searchDate} - </Text>
          )}
          <Text>{frameTime}</Text>
        </Text>
      </View>
    );
  };

  renderControlButtons = () => {
    const {
      isLive,
      selectedChannelIndex,
      displayChannels,
      nextChannel,
      previousChannel,
    } = this.props.videoStore;
    const {height} = Dimensions.get('window');
    const iconSize = normalize(height * 0.035);

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
        {isLive || (
          <IconCustom
            name="pause"
            size={iconSize}
            style={{justifyContent: 'center', color: CMSColors.White}}
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
    const {width, height} = Dimensions.get('window');
    // TODO add iconSize to state
    const iconSize = normalize(height * 0.035);

    return (
      <View style={styles.buttonsContainers}>
        <IconCustom
          name={
            videoStore.isLive
              ? 'searching-magnifying-glass'
              : 'videocam-filled-tool'
          }
          size={iconSize}
          style={[styles.buttonStyle, {paddingRight: width * 0.05}]}
          onPress={() => videoStore.switchLiveSearch()}
        />
        <IconCustom
          name="camera"
          size={iconSize}
          style={[styles.buttonStyle, {paddingRight: width * 0.05}]}
          onPress={this.onTakeVideoSnapshot}
        />
        <IconCustom
          name="hd"
          size={iconSize}
          style={[
            styles.buttonStyle,
            {
              color: videoStore.isHD
                ? CMSColors.primaryActive
                : CMSColors.White,
              paddingRight: width * 0.05,
            },
          ]}
          onPress={() => videoStore.switchHD()}
        />
        <IconCustom
          name="switch-to-full-screen-button"
          size={iconSize}
          style={[styles.buttonStyle, {paddingRight: width * 0.05}]}
          onPress={() => videoStore.switchFullscreen()}
        />
      </View>
    );
  };

  renderTimeline = () => {
    return this.props.videoStore.isLive ? (
      <View style={{flex: 10}}></View>
    ) : (
      <View style={{flex: 10, backgroundColor: CMSColors.darkElement}}></View>
    );
  };

  renderChannelItem = ({item}) => {
    const {kChannel, channelNo, name} = item;
    const {width} = Dimensions.get('window');
    const {videoStore} = this.props;
    const isSelected = videoStore.selectedChannel == channelNo;
    const imageW = (width / NUM_CHANNELS_ON_SCREEN) * (isSelected ? 1.2 : 1);
    const borderStyle = isSelected
      ? {borderWidth: 2, borderColor: CMSColors.primaryActive}
      : {};
    console.log('GOND renderChannelItem ', item);

    return (
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
    const {isFullscreen, displayChannels} = this.props.videoStore;
    // console.log('GOND renderChannelsList: ', displayChannels);

    return isFullscreen ? null : (
      <View style={{flex: 30, justifyContent: 'center'}}>
        <FlatList
          style={{flex: 1}}
          data={displayChannels}
          renderItem={this.renderChannelItem}
          keyExtractor={item => item.channelNo}
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
      <View onLayout={this.onLayout} style={styles.screenContainer}>
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: CMSColors.darkTheme,
  },
  datetimeContainer: {
    flex: 10,
    margin: 28,
    backgroundColor: CMSColors.darkElement,
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
  playerContainer: {
    flex: 40,
    justifyContent: 'flex-end',
    // alignContent: 'center',
    borderWidth: 2,
    borderColor: blue,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 7,
    margin: 14,
  },
  buttonsContainers: {
    flex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: CMSColors.darkElement,
  },
  buttonStyle: {
    color: CMSColors.White,
  },
  channelContainer: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    backgroundColor: CMSColors.darkTheme,
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
});

export default inject('videoStore')(observer(VideoPlayerView));
