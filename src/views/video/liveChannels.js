import React from 'react';
import {
  View,
  FlatList,
  Dimensions,
  Text,
  AppState,
  StatusBar,
} from 'react-native';

import BackgroundTimer from 'react-native-background-timer';
import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import Orientation from 'react-native-orientation-locker';

import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import DirectChannelView from './directChannel';
import NVRAuthenModal from '../../components/views/NVRAuthenModal';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import CMSRipple from '../../components/controls/CMSRipple';
import LoadingOverlay from '../../components/common/loadingOverlay';
import CMSImage from '../../components/containers/CMSImage';
import PermissionModal from '../../components/views/PermissionModal';
import InformationText from './components/liveChannels/infoText';

import commonStyles from '../../styles/commons.style';
import videoStyles from '../../styles/scenes/videoPlayer.style';
import theme from '../../styles/appearance';
import styles from './styles/liveChannelStyles';
import CMSColors from '../../styles/cmscolors';

import util from '../../util/general';
import {
  CLOUD_TYPE,
  VIDEO_INACTIVE_TIMEOUT,
  AUTHENTICATION_STATES,
} from '../../consts/video';
import ROUTERS from '../../consts/routes';
import {MODULE_PERMISSIONS, OrientationType} from '../../consts/misc';
import {NVR_Play_NoVideo_Image} from '../../consts/images';

import {STREAM_STATUS} from '../../localization/texts';
import LayoutModal from './components/liveChannels/layoutModal';

class LiveChannelsView extends React.Component {
  constructor(props) {
    super(props);
    const {gridLayout} = props.videoStore;
    const {width, height} = Dimensions.get('window');

    this.state = {
      viewableWindow: {
        width,
        height,
      },
      videoWindow: {
        width: width / gridLayout,
        height: height / gridLayout,
      },
      showLayoutSelection: false,
      internalLoading: false,
    };
    this._isMounted = false;
    this.playerRefs = [];
    this.firstFocus = true;
    this.directViewList = [];
    this.resumeFromInterupt = false;
    this.reactions = [];
    this.authenRef = null;
  }

  componentWillUnmount() {
    __DEV__ && console.log('LiveChannelsView componentWillUnmount');
    const {videoStore, sitesStore} = this.props;
    this._isMounted = false;
    AppState.removeEventListener('change', this.handleAppStateChange);
    videoStore.resetNVRAuthentication();
    videoStore.releaseStreams();
    videoStore.setChannelFilter('');
    sitesStore.deselectDVR();
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    videoStore.enterVideoView(false);
    this.reactions && this.reactions.forEach(unsub => unsub());

    Orientation.removeDeviceOrientationListener(this.onOrientationChange);
    Orientation.lockToPortrait();
  }

  async componentDidMount() {
    this._isMounted = true;
    const {videoStore, sitesStore, navigation} = this.props;

    this.setHeader(false);
    this.appStateEvtSub = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    if (util.isNullOrUndef(sitesStore.selectedDVR)) {
      return;
    }
    videoStore.selectDVR(sitesStore.selectedDVR);
    videoStore.switchLiveSearch(true);
    videoStore.enterVideoView(true);
    videoStore.loadLocalData();

    this.initReactions();
    this.getChannelsInfo();
    this.authenRef && this.authenRef.forceUpdate();
    __DEV__ && console.log('Orientation.getDeviceOrientation');
    Orientation.getDeviceOrientation(orientation => {
      this.onOrientationChange(orientation);
    });

    Orientation.addDeviceOrientationListener(this.onOrientationChange);
    Orientation.unlockAllOrientations();
  }

  onOrientationChange = async orientation => {
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
    this.updateHeader(isFullscreen);
    StatusBar.setHidden(isFullscreen);
    this.props.appStore.hideBottomTabs(isFullscreen);
    return;
  };

  updateHeader = isFullscreen => {
    const {navigation} = this.props;
    navigation.setOptions({
      headerShown: !isFullscreen,
    });
  };

  initReactions = () => {
    const {videoStore} = this.props;

    this.reactions = [
      reaction(
        () => videoStore.videoData,
        videoList => {
          if (videoList && videoList.length > 0) {
            if (
              videoStore.cloudType == CLOUD_TYPE.HLS ||
              videoStore.cloudType == CLOUD_TYPE.RTC
            )
              this.playerRefs = videoList.map(() => null);
            else this.directViewList = videoList.map(() => null);
          } else this.playerRefs = [];
        }
      ),
      reaction(
        () => videoStore.gridLayout,
        (gridLayout, previousGridLayout) => {
          this.setState({
            videoWindow: {
              width: this.state.viewableWindow.width / gridLayout,
              height: this.state.viewableWindow.height / gridLayout,
            },
          });
        }
      ),

      reaction(
        () => videoStore.authenticationState,
        (authenticationState, previousValue) => {
          if (previousValue == authenticationState) return;
          if (authenticationState == AUTHENTICATION_STATES.AUTHEN_FAILED) {
            __DEV__ &&
              console.log(
                'GOND displayAuthen::check need authen',
                authenticationState,
                previousValue
              );
            videoStore.displayAuthen(true);
          } else if (
            authenticationState >= AUTHENTICATION_STATES.AUTHENTICATED &&
            videoStore.canLoadStream == true
          ) {
            this.setHeader(true);
            videoStore.getVideoInfos();
          }
        }
      ),
    ];
  };

  clearAppStateTimeout = () => {
    __DEV__ && console.log('GOND: clearAppStateTimeout ') && console.trace();
    BackgroundTimer.stopBackgroundTimer();
    this.resumeFromInterupt = false;
  };

  handleAppStateChange = nextAppState => {
    __DEV__ &&
      console.log('GOND handleAppStateChange nextAppState: ', nextAppState);

    const {videoStore, isLive} = this.props;
    if (nextAppState === 'active') {
      if (this.appState && this.appState.match(/inactive|background/)) {
        if (this.resumeFromInterupt) {
          switch (videoStore.cloudType) {
            case CLOUD_TYPE.DEFAULT:
            case CLOUD_TYPE.DIRECTION:
            case CLOUD_TYPE.RS:
              this.playerRefs.forEach(p => p && p.reconnect());
              break;
            case CLOUD_TYPE.HLS:
            case CLOUD_TYPE.RTC:
              videoStore.resumeVideoStreamFromBackground(false);
              break;
            default:
              __DEV__ &&
                console.log(
                  'GOND _handleAppStateChange resume playing failed: cloudType is not valid: ',
                  videoStore.cloudType
                );
              break;
          }
        }
        this.clearAppStateTimeout();
      }
    } else {
      __DEV__ && console.log('GOND: Video setting stop timeout from interupt');
      BackgroundTimer.runBackgroundTimer(() => {
        __DEV__ && console.log('GOND: Video check to stop ', this.appState);
        if (this.appState != 'active') {
          __DEV__ && console.log('GOND: Video stop from interupt');
          this.playerRefs.forEach(p => p && p.stop());
          BackgroundTimer.stopBackgroundTimer();
          this.resumeFromInterupt = true;
        }
      }, VIDEO_INACTIVE_TIMEOUT);
    }
    this.appState = nextAppState;
  };

  setHeader = enableSettingButton => {
    const {navigation, videoStore, sitesStore, userStore, appStore} =
      this.props;
    const {appearance} = appStore;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() =>
          this.setHeader(enableSettingButton)
        )
      : null;
    let gridIcon = 'grid-view-4';
    switch (videoStore.gridLayout) {
      case 3:
        gridIcon = 'grid-view-9';
        break;
      case 4:
        gridIcon = 'grid-view-16';
        break;
    }

    navigation.setOptions({
      headerTitle: sitesStore.selectedDVR
        ? sitesStore.selectedDVR.name
        : 'No DVR was selected',
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          {videoStore.cloudType == CLOUD_TYPE.HLS ||
          videoStore.cloudType == CLOUD_TYPE.RTC ? (
            <CMSTouchableIcon
              size={22}
              onPress={() => navigation.push(ROUTERS.VIDEO_CHANNELS_SETTING)}
              color={theme[appearance].iconColor}
              disabled={
                !enableSettingButton ||
                !userStore.hasPermission(MODULE_PERMISSIONS.VSC) ||
                !videoStore.hasNVRPermission
              }
              styles={{
                flex: 1,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              iconCustom="add-cam"
            />
          ) : null}
          <CMSTouchableIcon
            size={22}
            onPress={() => this.setState({showLayoutSelection: true})}
            color={theme[appearance].iconColor}
            styles={{
              flex: 1,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            iconCustom={gridIcon}
          />
          {searchButton}
        </View>
      ),
    });
  };

  getChannelsInfo = async () => {
    const {videoStore, userStore, sitesStore} = this.props;

    const isStreamingAvailable = userStore.hasPermission(
      MODULE_PERMISSIONS.VSC
    );
    let res = await videoStore.getCloudSetting(isStreamingAvailable);
    res = res && (await videoStore.getDisplayingChannels());

    __DEV__ &&
      console.log(
        'GOND liveChannels getChannelsInfo: ',
        res,
        videoStore.isAuthenticated
      );
    // await videoStore.getDVRPermission(); // already called in getDisplayingChannels
    if (videoStore.isAuthenticated && res) {
      this.setHeader(true);
      // res = await videoStore.getVideoInfos();
    }
  };

  onAuthenSubmit = (username, password) => {
    this.playerRefs.forEach(p => {
      if (
        p &&
        p.onLoginInfoChanged &&
        typeof p.onLoginInfoChanged == 'function'
      ) {
        p.onLoginInfoChanged(username, password);
      }
    });
  };

  onChannelSelect = value => {
    const {videoStore} = this.props;
    __DEV__ &&
      console.log(
        'GOND select channel: 111',
        value,
        ' videoStore.selectedChannel = ',
        videoStore.selectedChannel
      );
    if (!value || Object.keys(value) == 0 || videoStore.selectedChannel) return;
    __DEV__ &&
      console.log(
        'GOND select channel: 222 ',
        value,
        ' videoStore.selectedChannel = ',
        videoStore.selectedChannel
      );
    videoStore.selectChannel(
      value.channelNo,
      true,
      true // ?? value.channel.channelNo
    );

    if (
      videoStore.isAPIPermissionSupported == true &&
      !videoStore.selectedChannelData.canPlayMode(true) &&
      videoStore.selectedChannelData.canPlayMode(false)
    ) {
      videoStore.switchLiveSearch(false, false);
    }

    setTimeout(() => {
      this.props.navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 500);
  };

  stopAll = () => {
    this.playerRefs.forEach(p => p && p.stop());
  };

  onLayout = event => {
    const {x, y, width, height} = event.nativeEvent.layout;
    const {gridLayout} = this.props.videoStore; // this.state;
    __DEV__ && console.log('LiveChannelsView onLayout: ', event.nativeEvent);
    this.setState({
      viewableWindow: {
        width,
        height,
      },
      videoWindow: {
        width: width / gridLayout,
        height: height / gridLayout,
      },
    });
    Orientation.getDeviceOrientation(orientation => {
      if (orientation != OrientationType.PORTRAIT) {
        this.onOrientationChange(orientation);
      }
    });
  };

  onFilter = value => {
    this.props.videoStore.setChannelFilter(value);
  };

  onLayoutItemPress = data => {
    this.setState(
      {
        showLayoutSelection: false,
        videoWindow: {
          width: viewableWindow.width / data.value,
          height: viewableWindow.height / data.value,
        },
      },
      () => {
        this.videoListRef &&
          this.videoListRef.scrollToOffset({animated: false, offset: 0});
        this.setHeader(true);
      }
    );
  };

  renderDirectFrame = () => {
    const {videoStore} = this.props;
    const {cloudType} = videoStore;
    const {videoWindow} = this.state;

    if (cloudType == CLOUD_TYPE.HLS || cloudType == CLOUD_TYPE.RTC) return;

    return videoStore.directConnection ? (
      <DirectVideoView
        width={videoWindow.width}
        height={videoWindow.height}
        isLive={true}
        hdMode={false}
        serverInfo={videoStore.directConnection}
        ref={ref => (this.playerRefs = [ref])}
      />
    ) : null;
  };

  renderNoPermissionChannel = (item, width, height) => {
    return (
      <CMSImage
        dataSource={item.snapshot}
        defaultImage={NVR_Play_NoVideo_Image}
        resizeMode="cover"
        isBackground={true}
        showLoading={false}
        style={{height: height}}
        styleImage={{width, height}}
        dataCompleteHandler={(_, imageData) =>
          item.channel && item.channel.saveSnapshot(imageData)
        }
        // zzz
        domain={{
          controller: 'channel',
          action: 'image',
          id: item.kChannel,
        }}>
        <Text style={videoStyles.channelInfo}>
          {item.channelName ?? 'Unknown'}
        </Text>
        <View style={videoStyles.statusView}>
          <View style={videoStyles.textContainer}>
            <Text style={videoStyles.textMessage}>
              {STREAM_STATUS.NO_PERMISSION}
            </Text>
          </View>
        </View>
      </CMSImage>
    );
  };

  renderVideoPlayer = ({item, index}) => {
    if (!item || Object.keys(item).length == 0)
      return (
        <View
          key={'ch_none_' + index}
          style={styles.videoPlayerNoItemContainer}
        />
      );
    const {videoWindow} = this.state;
    const {videoStore, userStore} = this.props;

    let playerProps = {
      width: videoWindow.width,
      height: videoWindow.height,
      isLive: true,
      hdMode: false,
      index,
    };
    let player = null;
    const canView = item.channel && item.channel.canPlayMode(true);

    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
      case CLOUD_TYPE.RS:
        player = (
          <DirectChannelView
            {...playerProps}
            serverInfo={item}
            ref={ref => (this.directViewList[index] = ref)}
          />
        );
        break;
      case CLOUD_TYPE.HLS:
        __DEV__ && console.log('GOND renderVid HLS: ', item.targetUrl);
        player = (
          <HLSStreamingView
            {...playerProps}
            streamData={item}
            ref={ref => (this.playerRefs[index] = ref)}
            timezone={videoStore.timezone}
          />
        );
        break;
      case CLOUD_TYPE.RTC:
        player = (
          <RTCStreamingView
            {...playerProps}
            viewer={item}
            ref={ref => (this.playerRefs[index] = ref)}
          />
        );
        break;
    }

    return (
      <CMSRipple
        style={[
          styles.videoRow,
          {
            width: videoWindow.width,
            height: videoWindow.height,
          },
        ]}
        onPress={() => this.onChannelSelect(item)}>
        {canView
          ? player
          : this.renderNoPermissionChannel(
              item,
              videoWindow.width,
              videoWindow.height
            )}
      </CMSRipple>
    );
  };

  renderScrollVideoList = () => {
    const {videoStore} = this.props;

    return (
      <FlatList
        key={'grid_' + videoStore.gridLayout}
        ref={r => (this.videoListRef = r)}
        renderItem={this.renderVideoPlayer}
        numColumns={videoStore.gridLayout}
        data={videoStore.videoData}
        keyExtractor={item => 'ch_' + item.channelNo}
        onRefresh={this.getChannelsInfo}
        refreshing={videoStore.isLoading}
        maxToRenderPerBatch={videoStore.gridLayout}
        viewabilityConfig={{
          minimumViewTime: 200,
          itemVisiblePercentThreshold: 25,
        }}
      />
    );
  };

  showShortTimeLoading = () => {
    __DEV__ && console.log('GOND showShortTimeLoading - show');
    this.setState({internalLoading: true}, () =>
      setTimeout(() => {
        __DEV__ && console.log('GOND showShortTimeLoading - hide');
        this._isMounted && this.setState({internalLoading: false});
      }, 1000)
    );
  };

  onSwipe = (direction, state) => {
    switch (direction) {
      case swipeDirections.SWIPE_UP:
        return this.onSwipeUp(state);
      case swipeDirections.SWIPE_DOWN:
        return this.onSwipeDown(state);
      default:
        __DEV__ && console.log('GOND LIVE : onSwipe: ', direction, state);
        return;
    }
  };

  onSwipeUp = state => {
    __DEV__ && console.log('GOND LIVE : onSwipeUp: ', state);
    if (this.props.videoStore.changeGridPage(true)) this.showShortTimeLoading();
  };

  onSwipeDown = state => {
    __DEV__ && console.log('GOND LIVE : onSwipeDown: ', state);
    if (this.props.videoStore.changeGridPage(false))
      this.showShortTimeLoading();
  };

  renderStaticVideoList = () => {
    const {videoStore} = this.props;

    return (
      <GestureRecognizer
        onSwipe={(direction, state) => this.onSwipe(direction, state)}
        config={{
          velocityThreshold: 0.2,
          directionalOffsetThreshold: 80,
        }}
        style={styles.staticVideoListContainer}>
        {this.state.internalLoading || videoStore.waitForTimezone ? (
          <LoadingOverlay
            height={48}
            indicatorColor={CMSColors.White}
            style={styles.loadingVideoList}
          />
        ) : null}
        {videoStore.isAuthenticated && (
          <FlatList
            key={'grid_' + videoStore.gridLayout}
            ref={r => (this.videoListRef = r)}
            renderItem={this.renderVideoPlayer}
            numColumns={videoStore.gridLayout}
            data={videoStore.currentDisplayVideoData}
            keyExtractor={(item, index) =>
              'ch_' + (item && item.channelNo ? item.channelNo : 'none' + index)
            }
            refreshing={
              videoStore.isLoading ||
              this.state.internalLoading ||
              videoStore.waitForTimezone
            }
            scrollEnabled={false}
          />
        )}
      </GestureRecognizer>
    );
  };

  render() {
    const {videoStore} = this.props;

    return (
      <View style={styles.screenContainer}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          applyOnEnter={true}
          value={videoStore.channelFilter}
          animation={false}
        />
        <NVRAuthenModal
          ref={r => (this.authenRef = r)}
          onSubmit={this.onAuthenSubmit}
        />
        <PermissionModal />
        <View style={styles.videoListContainer} onLayout={this.onLayout}>
          {videoStore.isLoading ||
          videoStore.waitForTimezone ||
          !videoStore.isCloud ||
          videoStore.videoData.length > 0 ? (
            this.renderStaticVideoList()
          ) : (
            <InformationText />
          )}
        </View>
        <LayoutModal
          isVisible={this.state.showLayoutSelection}
          onClose={() => this.setState({showLayoutSelection: false})}
          onItemPress={this.onLayoutItemPress}
        />
        {this.renderDirectFrame()}
      </View>
    );
  }
}

export default inject(
  'appStore',
  'videoStore',
  'sitesStore',
  'userStore'
)(observer(LiveChannelsView));
