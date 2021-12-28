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
  // BackHandler,
} from 'react-native';
import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';
// import {BottomModal, ModalContent} from 'react-native-modals';
import Modal from 'react-native-modal';

import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
// import AuthenModal from '../../components/common/AuthenModal';
import NVRAuthenModal from '../../components/views/NVRAuthenModal';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
// import InputTextIcon from '../../components/controls/InputTextIcon';
import {IconCustom} from '../../components/CMSStyleSheet';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import CMSRipple from '../../components/controls/CMSRipple';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import {CLOUD_TYPE, LAYOUT_DATA} from '../../consts/video';
import ROUTERS from '../../consts/routes';
import {MODULE_PERMISSIONS} from '../../consts/misc';
import variables from '../../styles/variables';
import commonStyles from '../../styles/commons.style';
// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import {Comps as CompTxt, VIDEO as VIDEO_TXT} from '../../localization/texts';

// const LayoutData = [
//   {
//     key: 'layout_2x2',
//     value: 2,
//     icon: 'grid-view-4',
//   },
//   {
//     key: 'layout_3x33',
//     value: 3,
//     icon: 'grid-view-9',
//   },
//   {
//     key: 'layout_4x4',
//     value: 4,
//     icon: 'grid-view-16',
//   },
// ];

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
    };
    // this.channelsCount = 0;
    this._isMounted = false;
    this.playerRefs = [];
    this.firstFocus = true;
    this.channelsData = [];
    // this.showAllTimeout = null;
    // this.didFilter = false;
    // this.needUpdateVideos = false;
  }

  componentWillUnmount() {
    __DEV__ && console.log('LiveChannelsView componentWillUnmount');
    const {videoStore, sitesStore} = this.props;
    this._isMounted = false;
    AppState.removeEventListener('change', this.handleAppStateChange);
    // this.appStateEvtSub && this.appStateEvtSub.remove();
    videoStore.releaseStreams();
    videoStore.setChannelFilter('');
    sitesStore.deselectDVR();
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    // this.stopAll();
    // videoStore.setStreamReadyCallback(null);
  }

  componentDidMount() {
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

    /*
    reaction(
      () => videoStore.videoData,
      (value, previousValue) => {
        __DEV__ &&
          console.log(
            'GOND videoData has changed, update? ',
            this.needUpdateVideos
          );
        if (this.didFilter) {
          this.needUpdateVideos = true;
        }
      }
    );
    */

    this.getChannelsInfo();
  }

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
    this.appState = nextAppState;
  };

  setHeader = enableSettingButton => {
    const {navigation, videoStore, sitesStore, userStore} = this.props;
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
              color={CMSColors.ColorText}
              disabled={
                !enableSettingButton ||
                !userStore.hasPermission(MODULE_PERMISSIONS.VSC)
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
            color={CMSColors.ColorText}
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
    const {videoStore} = this.props;
    // let newState = {};
    let res = await videoStore.getCloudSetting();
    res = res && (await videoStore.getDisplayingChannels());
    if (res) {
      this.setHeader(true);
    }

    res = res && (await videoStore.getVideoInfos());
    if (videoStore.needAuthen) {
      __DEV__ && console.log('GOND need authen ->');
      videoStore.displayAuthen(true);
      return;
    }
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
    __DEV__ && console.log('GOND select channel: ', value);
    if (!value || Object.keys(value) == 0 || videoStore.selectedChannel) return;

    videoStore.selectChannel(
      value.channelNo // ?? value.channel.channelNo
    );
    // this.pauseAll(true);
    setTimeout(() => {
      this.props.navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 500);
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
  };

  onFilter = value => {
    this.props.videoStore.setChannelFilter(value);
    // this.didFilter = true;
  };

  renderLayoutItem = ({item}) => {
    const {height} = Dimensions.get('window');
    const {viewableWindow} = this.state;
    const {videoStore} = this.props;

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
              this.videoListRef.scrollToOffset({animated: false, offset: 0});
              this.setHeader(true);
            }
          );
        }}
        color={CMSColors.ColorText}
        // styles={{height: height * 0.07}}
        iconCustom={item.icon}
      />
    );
  };

  renderLayoutModal = () => {
    const {width, height} = Dimensions.get('window');
    return (
      <Modal
        isVisible={this.state.showLayoutSelection}
        onBackdropPress={() => this.setState({showLayoutSelection: false})}
        // onSwipeOut={() => this.setState({showFilterModal: false})}
        onBackButtonPress={() => this.setState({showLayoutSelection: false})}
        backdropOpacity={0.1}
        style={{
          ...styles.layoutModalContainer,
          marginBottom: 0,
          marginTop: height - (width > 480 ? 300 : 220),
          marginLeft: 0,
          marginRight: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          alignItems: 'center',
        }}>
        <Text style={styles.layoutModalTitle}>Division</Text>
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

  renderRow = ({item, index}) => {
    const {viewableWindow, videoWindow} = this.state;
    console.log(
      'GOND renderRow videoWindow = ',
      videoWindow,
      ', item = ',
      item
    );
    const playerViews = [];

    for (let i = 0; i < item.data.length; i++) {
      const videoIndex = item.data.length * index + i;
      playerViews.push(
        <View
          key={item.key + '_' + i}
          style={[
            styles.videoRow,
            {
              width: videoWindow.width,
              height: videoWindow.height,
            },
          ]}>
          <CMSRipple
            style={{width: '100%', height: '100%', borderWidth: 0}}
            onPress={() => this.onChannelSelect(item.data[i])}>
            {this.renderVideoPlayer(item.data[i], videoIndex)}
          </CMSRipple>
        </View>
      );
    }

    return (
      <View
        key={item.key}
        style={{
          flexDirection: 'row',
          height: videoWindow.height,
          width: viewableWindow.width,
        }}>
        {playerViews}
      </View>
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
      with: videoWindow.width,
      height: videoWindow.height,
      isLive: true,
      hdMode: false,
      // streamStatus: item.streamStatus,
      index,
    };
    let player = null;
    // __DEV__ && console.log('GOND renderVid password ', videoStore.nvrPassword);
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
        player = (
          <DirectVideoView
            {...playerProps}
            serverInfo={item}
            // username={videoStore.nvrUser}
            // password={videoStore.nvrPassword}
            ref={ref => this.playerRefs.push(ref)}
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
            ref={ref => this.playerRefs.push(ref)}
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
            ref={ref => this.playerRefs.push(ref)}
          />
        );
        break;
    }

    return (
      <CMSRipple
        style={[
          styles.videoRow,
          {width: '100%', height: '100%', borderWidth: 0},
        ]}
        onPress={() => this.onChannelSelect(item)}>
        {player}
      </CMSRipple>
    );
  };

  renderInfoText = () => {
    const {userStore} = this.props;

    return userStore.hasPermission(MODULE_PERMISSIONS.VSC) ? (
      <View style={styles.infoTextContainer}>
        <Text>{VIDEO_TXT.SELECT_CHANNEL_1}</Text>
        <IconCustom name="add-cam" size={22} color={CMSColors.ColorText} />
        <Text>{VIDEO_TXT.SELECT_CHANNEL_2}</Text>
      </View>
    ) : (
      <View style={styles.infoTextContainer}>
        <Text>{VIDEO_TXT.NO_PERMISSION}</Text>
      </View>
    );
  };

  render() {
    // const authenModal = this.renderNVRAuthenModal();
    const {appStore, videoStore, navigation} = this.props;
    __DEV__ &&
      console.log('GOND channels render data = ', videoStore.videoData);
    this.playerRefs = [];

    return (
      <View style={styles.screenContainer}>
        {/* <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={videoStore.channelFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View> */}
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={videoStore.channelFilter}
          animation={false}
        />
        <NVRAuthenModal onSubmit={this.onAuthenSubmit} />
        <View style={styles.videoListContainer} onLayout={this.onLayout}>
          {videoStore.isLoading ||
          !videoStore.isCloud ||
          videoStore.videoData.length > 0 ? (
            <FlatList
              key={'grid_' + videoStore.gridLayout}
              ref={r => (this.videoListRef = r)}
              // renderItem={this.renderRow}
              renderItem={this.renderVideoPlayer}
              numColumns={videoStore.gridLayout}
              data={videoStore.videoData} // {this.state.liveData}
              // keyExtractor={item => item.key}
              keyExtractor={item => 'ch_' + item.channelNo}
              onRefresh={this.getChannelsInfo}
              refreshing={videoStore.isLoading}
              maxToRenderPerBatch={videoStore.gridLayout}
            />
          ) : (
            this.renderInfoText()
          )}
        </View>
        {this.renderLayoutModal()}
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
    borderColor: 'black',
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
