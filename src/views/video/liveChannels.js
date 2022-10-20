import React from 'react';
import {
  View,
  FlatList,
  Platform,
  Dimensions,
  StyleSheet,
  Text,
  // TouchableOpacity,
  AppState,
  StatusBar,
  // BackHandler,
  ImageBackground,
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';
// import Modal from 'react-native-modal';
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import Orientation from 'react-native-orientation-locker';

import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import DirectChannelView from './directChannel';
// import AuthenModal from '../../components/common/AuthenModal';
import Modal from '../../components/views/CMSModal';
import NVRAuthenModal from '../../components/views/NVRAuthenModal';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
// import InputTextIcon from '../../components/controls/InputTextIcon';
// import {IconCustom} from '../../components/CMSStyleSheet';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import CMSRipple from '../../components/controls/CMSRipple';
import LoadingOverlay from '../../components/common/loadingOverlay';
// import Swipe from '../../components/controls/Swipe';
import CMSImage from '../../components/containers/CMSImage';
import PermissionModal from '../../components/views/PermissionModal';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import {
  CLOUD_TYPE,
  LAYOUT_DATA,
  VIDEO_INACTIVE_TIMEOUT,
  AUTHENTICATION_STATES,
} from '../../consts/video';
import ROUTERS from '../../consts/routes';
import {MODULE_PERMISSIONS, OrientationType} from '../../consts/misc';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import variables from '../../styles/variables';
import commonStyles from '../../styles/commons.style';
import videoStyles from '../../styles/scenes/videoPlayer.style';
import theme from '../../styles/appearance';

import {
  Comps as CompTxt,
  VIDEO as VIDEO_TXT,
  STREAM_STATUS,
} from '../../localization/texts';

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
      // gridLayout: 2,
      showLayoutSelection: false,
      // liveData: [],
      internalLoading: false,
    };
    // this.channelsCount = 0;
    this._isMounted = false;
    this.playerRefs = [];
    this.firstFocus = true;
    this.directViewList = [];
    this.resumeFromInterupt = false;
    this.reactions = [];
    this.authenRef = null;
    // this.viewableList = [];
    // this.showAllTimeout = null;
    // this.didFilter = false;
    // this.needUpdateVideos = false;
  }

  componentWillUnmount() {
    __DEV__ && console.log('LiveChannelsView componentWillUnmount');
    const {videoStore, sitesStore} = this.props;
    this._isMounted = false;
    AppState.removeEventListener('change', this.handleAppStateChange);
    videoStore.resetNVRAuthentication();
    // this.appStateEvtSub && this.appStateEvtSub.remove();
    videoStore.releaseStreams();
    videoStore.setChannelFilter('');
    sitesStore.deselectDVR();
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    videoStore.enterVideoView(false);
    // this.stopAll();
    // videoStore.setStreamReadyCallback(null);
    this.reactions && this.reactions.forEach(unsub => unsub());

    Orientation.removeDeviceOrientationListener(this.onOrientationChange);
    Orientation.lockToPortrait();
  }

  async componentDidMount() {
    this._isMounted = true;
    const {videoStore, sitesStore, navigation} = this.props;
    /*if (__DEV__) {
      console.log(
        'LiveChannelsView componentDidMount: ',
        sitesStore.selectedDVR
      );
      // if (sitesStore.selectedDVR.name === 'jackhome')
      //   videoStore.setNVRLoginInfo('i3admin', 'i3admin');
    }*/
    this.setHeader(false);
    this.appStateEvtSub = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    if (util.isNullOrUndef(sitesStore.selectedDVR)) {
      // this.props.navigation.pop();
      return;
    }
    videoStore.selectDVR(sitesStore.selectedDVR);
    videoStore.switchLiveSearch(true);
    videoStore.enterVideoView(true);
    videoStore.loadLocalData();
    // dongpt test:
    // videoStore.saveLoginInfo();

    // videoStore.setStreamInfoCallback(this.onReceiveStreamInfo);
    // videoStore.setStreamReadyCallback(this.onStreamReady);
    // this.unsubscribleFocusEvent = navigation.addListener('focus', () => {
    //   if (this.firstFocus) {
    //     this.firstFocus = false;
    //     return;
    //   }
    //   __DEV__ && console.log('GOND live channels view on focused');
    //   this.pauseAll(false);
    // });

    this.initReactions();
    this.getChannelsInfo();
    this.authenRef && this.authenRef.forceUpdate();
    __DEV__ && console.log('Orientation.getDeviceOrientation');
    Orientation.getDeviceOrientation(orientation => {
      //if (orientation != OrientationType.PORTRAIT) {
      this.onOrientationChange(orientation);
      //}
    });

    Orientation.addDeviceOrientationListener(this.onOrientationChange);
    Orientation.unlockAllOrientations();
  }

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
      // reaction(
      //   () => videoStore.needAuthen,
      //   (needAuthen, previousValue) => {
      //     if (needAuthen == true && previousValue == false) {
      //       __DEV__ &&
      //         console.log('GOND displayAuthen::check need authen', needAuthen);
      //       videoStore.displayAuthen(true);
      //     }
      //   }
      // ),
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

  /*
  componentDidUpdate(prevProps) {
    __DEV__ &&
      console.log(
        'GOND liveChannels componentDidUpdate didFilter: ',
        this.didFilter,
        ', needUpdateVideos: ',
        this.needUpdateVideos
      );
    if (this.didFilter && this.needUpdateVideos) {
      this.didFilter = false;
      this.needUpdateVideos = false;
      this.playerRefs && this.playerRefs.forEach(p => p && p.forceUpdate());
    }
  }
  */

  clearAppStateTimeout = () => {
    __DEV__ && console.log('GOND: clearAppStateTimeout ') && console.trace();
    BackgroundTimer.stopBackgroundTimer();
    this.resumeFromInterupt = false;
  };

  handleAppStateChange = nextAppState => {
    __DEV__ &&
      console.log('GOND handleAppStateChange nextAppState: ', nextAppState);
    // if (nextAppState === 'active' && this.appState) {
    //   if (this.appState.match(/inactive|background/)) {
    //     this.pauseAll(false);
    //   }
    // } else {
    //   this.pauseAll(true);
    // }
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
    // __DEV__ &&
    //   console.trace(
    //     'GOND liveChannels setHeaders: ',
    //     enableSettingButton,
    //     userStore.hasPermission(MODULE_PERMISSIONS.VSC)
    //   );

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
    // let newState = {};
    // this.stopAll();

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

    // if (videoStore.needAuthen) {
    //   __DEV__ && console.log('GOND need authen ->');
    //   videoStore.displayAuthen(true);
    //   return;
    // }
  };

  // onAuthenCancel = () => {
  //   this.props.videoStore.displayAuthen(false);
  // };

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
    // this.pauseAll(true);
    // __DEV__ && console.log('GOND select channel: ', videoStore.selectedChannel);
    setTimeout(() => {
      this.props.navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 500);
  };

  onVideosViewableChanged = ({changed, viewableItems}) => {
    return;
    const {gridLayout, cloudType} = this.props.videoStore;
    // __DEV__ &&
    //   console.log('GOND onVideosViewableChanged: ', changed, viewableItems);
    if (
      cloudType == CLOUD_TYPE.HLS ||
      cloudType == CLOUD_TYPE.RTC ||
      viewableItems.length <= 0
    )
      return;

    let minIndex = viewableItems[0].index;
    let maxIndex = viewableItems[0].index;
    viewableItems.forEach(({index}) => {
      minIndex = index < minIndex ? index : minIndex;
      maxIndex = index > maxIndex ? index : maxIndex;
    });

    __DEV__ &&
      console.log(
        'GOND onVideosViewableChanged: minIdx ',
        minIndex,
        'maxIdx ',
        maxIndex
      );

    this.directViewList.forEach((p, index) => {
      if (!p) return;
      if (index < minIndex - gridLayout || index > maxIndex + gridLayout) {
        // __DEV__ &&
        //   console.log('GOND onVideosViewableChanged outbound index: ', index);
        p.setViewable(false);
        // if (p.isPlaying) {
        //   p.setViewable(false);
        //   p.stop();
        //   __DEV__ &&
        //     console.log('GOND onVideosViewableChanged outbound stopped!');
        // }
      } else {
        // __DEV__ &&
        //   console.log('GOND onVideosViewableChanged inbound index: ', index);
        p.setViewable(true);
        // if (!p.isPlaying) {
        //   p.setViewable(true);
        //   p.play();
        //   __DEV__ &&
        //     console.log('GOND onVideosViewableChanged inbound started!');
        // }
      }
    });
  };

  // pauseAll = value => {
  //   this.playerRefs.forEach(p => p && p.pause(value));
  // };

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
    // this.didFilter = true;
  };

  renderLayoutItem = ({item}) => {
    const {height} = Dimensions.get('window');
    const {viewableWindow} = this.state;
    const {videoStore, appStore} = this.props;
    const {appearance} = appStore;

    return (
      <CMSTouchableIcon
        size={height * 0.07}
        onPress={() => {
          videoStore.setGridLayout(item.value);
          this.setState(
            {
              // gridLayout: item.value,
              showLayoutSelection: false,
              // liveData: this.buildLiveData(item.value),
              videoWindow: {
                width: viewableWindow.width / item.value,
                height: viewableWindow.height / item.value,
              },
            },
            () => {
              this.videoListRef &&
                this.videoListRef.scrollToOffset({animated: false, offset: 0});
              this.setHeader(true);
            }
          );
        }}
        color={theme[appearance].iconColor}
        // styles={{height: height * 0.07}}
        iconCustom={item.icon}
      />
    );
  };

  renderLayoutModal = () => {
    const {appearance} = this.props.appStore;
    const {width, height} = Dimensions.get('window');
    return (
      <Modal
        isVisible={this.state.showLayoutSelection}
        onBackdropPress={() => this.setState({showLayoutSelection: false})}
        // onSwipeOut={() => this.setState({showFilterModal: false})}
        onBackButtonPress={() => this.setState({showLayoutSelection: false})}
        backdropOpacity={0.1}
        key="divisionModal"
        name="divisionModal"
        style={[
          {
            ...styles.layoutModalContainer,
            marginBottom: 0,
            marginTop: height - (width > 480 ? 300 : 220),
            marginLeft: 0,
            marginRight: 0,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            alignItems: 'center',
          },
          theme[appearance].modalContainer,
        ]}>
        <Text style={[styles.layoutModalTitle, theme[appearance].text]}>
          Division
        </Text>
        <FlatList
          contentContainerStyle={styles.layoutModalBody}
          renderItem={this.renderLayoutItem}
          data={LAYOUT_DATA}
          horizontal={true}
          style={{
            paddingBottom: height * 0.07,
          }}
        />
      </Modal>
    );
  };

  renderDirectFrame = () => {
    const {videoStore} = this.props;
    const {cloudType} = videoStore;
    const {videoWindow} = this.state;

    if (cloudType == CLOUD_TYPE.HLS || cloudType == CLOUD_TYPE.RTC) return;
    // console.log('GOND renderDirectFrame: ', videoStore.directConnection);

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
    // const {width, height} = this.state.videoWindow;

    return (
      /*<ImageBackground
        source={NVR_Play_NoVideo_Image}
        style={{width: width, height: height}}
        resizeMode="cover">*/
      <CMSImage
        dataSource={item.snapshot}
        defaultImage={NVR_Play_NoVideo_Image}
        resizeMode="cover"
        isBackground={true}
        showLoading={false}
        style={{height: height}}
        styleImage={{width, height}}
        dataCompleteHandler={(params, imageData) =>
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
      /* </ImageBackground> */
    );
  };

  // renderVideoPlayer = (item, index) => {
  renderVideoPlayer = ({item, index}) => {
    // __DEV__ && console.log('GOND renderVid liveChannels ', item);
    if (!item || Object.keys(item).length == 0)
      return (
        <View
          key={'ch_none_' + index}
          style={{flex: 1, backgroundColor: 'black'}}
        />
      );
    const {videoWindow} = this.state;
    const {videoStore, userStore} = this.props;

    let playerProps = {
      width: videoWindow.width,
      height: videoWindow.height,
      isLive: true,
      hdMode: false,
      // streamStatus: item.streamStatus,
      index,
    };
    let player = null;
    const canView = item.channel && item.channel.canPlayMode(true);

    // __DEV__ && console.log('GOND renderVid password ', videoStore.nvrPassword);
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
      case CLOUD_TYPE.RS:
        player = (
          //<DirectVideoView
          <DirectChannelView
            {...playerProps}
            serverInfo={item}
            // username={videoStore.nvrUser}
            // password={videoStore.nvrPassword}
            // ref={ref => this.playerRefs.push(ref)}
            ref={ref => (this.directViewList[index] = ref)}
          />
        );
        break;
      case CLOUD_TYPE.HLS:
        __DEV__ && console.log('GOND renderVid HLS: ', item.targetUrl);
        player = (
          <HLSStreamingView
            {...playerProps}
            // channel={item.channel}
            streamData={item}
            // ref={ref => this.playerRefs.push(ref)}
            ref={ref => (this.playerRefs[index] = ref)}
            // streamUrl={item.targetUrl.url} //{item.targetUrl ? item.targetUrl.url : null}
            timezone={videoStore.timezone}
          />
        );
        break;
      case CLOUD_TYPE.RTC:
        // playerProps = Object.assign({}, playerProps, item);
        player = (
          <RTCStreamingView
            {...playerProps}
            viewer={item}
            // ref={ref => this.playerRefs.push(ref)}
            ref={ref => (this.playerRefs[index] = ref)}
          />
        );
        break;
    }

    // __DEV__ && console.log('GOND renderVid liveChannels ', videoWindow);
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

  renderInfoText = () => {
    const {userStore, videoStore, navigation} = this.props;
    if (!videoStore.isAuthenticated) return null;

    return userStore.hasPermission(MODULE_PERMISSIONS.VSC) &&
      videoStore.hasNVRPermission ? (
      <View style={styles.infoTextContainer}>
        <Text>{VIDEO_TXT.SELECT_CHANNEL_1}</Text>
        <CMSTouchableIcon
          size={22}
          onPress={() => navigation.push(ROUTERS.VIDEO_CHANNELS_SETTING)}
          color={CMSColors.ColorText}
          styles={{
            flex: 1,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          iconCustom="add-cam"
        />
        <Text>{VIDEO_TXT.SELECT_CHANNEL_2}</Text>
      </View>
    ) : (
      <View style={styles.infoTextContainer}>
        <Text>
          {userStore.hasPermission(MODULE_PERMISSIONS.VSC)
            ? STREAM_STATUS.NO_PERMISSION
            : VIDEO_TXT.NO_VSC_PERMISSION}
        </Text>
      </View>
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
        data={videoStore.videoData} // {this.state.liveData}
        // keyExtractor={item => item.key}
        keyExtractor={item => 'ch_' + item.channelNo}
        onRefresh={this.getChannelsInfo}
        refreshing={videoStore.isLoading}
        maxToRenderPerBatch={videoStore.gridLayout}
        // onViewableItemsChanged={this.onVideosViewableChanged}
        viewabilityConfig={{
          minimumViewTime: 200,
          // viewAreaCoveragePercentThreshold: 25,
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
    // __DEV__ && console.log('GOND LIVE videoData: ', videoStore.currentDisplayVideoData);

    return (
      <GestureRecognizer
        onSwipe={(direction, state) => this.onSwipe(direction, state)}
        config={{
          velocityThreshold: 0.2,
          directionalOffsetThreshold: 80,
          // gestureIsClickThreshold: 3,
        }}
        style={{
          flex: 1,
          backgroundColor: CMSColors.Transparent,
        }}>
        {this.state.internalLoading || videoStore.waitForTimezone ? (
          <LoadingOverlay
            height={48}
            // backgroundColor={CMSColors.Transparent}
            indicatorColor={CMSColors.White}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              zIndex: 1,
              backgroundColor: CMSColors.Transparent,
            }}
          />
        ) : null}
        {
          // videoStore.canDisplayChannels && (
          /*!videoStore.isAPIPermissionSupported ||*/ videoStore.isAuthenticated && (
            <FlatList
              key={'grid_' + videoStore.gridLayout}
              ref={r => (this.videoListRef = r)}
              renderItem={this.renderVideoPlayer}
              numColumns={videoStore.gridLayout}
              data={videoStore.currentDisplayVideoData}
              keyExtractor={(item, index) =>
                'ch_' +
                (item && item.channelNo ? item.channelNo : 'none' + index)
              }
              refreshing={
                videoStore.isLoading ||
                this.state.internalLoading ||
                videoStore.waitForTimezone
              }
              scrollEnabled={false}
            />
          )
        }
      </GestureRecognizer>
    );
  };

  render() {
    // const authenModal = this.renderNVRAuthenModal();
    const {appStore, videoStore, navigation} = this.props;
    //  __DEV__ &&
    // console.log('GOND channels render data = ', videoStore.videoData);
    // this.playerRefs = [];

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
          videoStore.videoData.length > 0
            ? this.renderStaticVideoList()
            : this.renderInfoText()}
        </View>
        {this.renderLayoutModal()}
        {this.renderDirectFrame()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screenContainer: {flex: 1, backgroundColor: 'black'},
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: 5,
  },
  videoListContainer: {flex: 1, flexDirection: 'column'},
  videoRow: {
    flex: 1,
    borderColor: CMSColors.DarkTheme,
    borderWidth: 1,
  },
  layoutModalContainer: {
    backgroundColor: CMSColors.White,
    justifyContent: 'center',
    alignItems: 'center',
    // height: '80%',
    // width: width,
  },
  layoutModalTitle: {
    alignContent: 'center',
    fontSize: 20,
    fontWeight: '700',
    paddingBottom: 36,
    paddingTop: 25,
  },
  layoutModalBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 35,
    paddingRight: 35,
  },
  infoTextContainer: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default inject(
  'appStore',
  'videoStore',
  'sitesStore',
  'userStore'
)(observer(LiveChannelsView));
