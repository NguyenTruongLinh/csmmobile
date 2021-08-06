import React from 'react';
import {
  View,
  FlatList,
  Platform,
  Modal,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  AppState,
  // BackHandler,
} from 'react-native';
// import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';
import {BottomModal, ModalContent} from 'react-native-modals';

import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import AuthenModal from '../../components/common/AuthenModal';
import CMSAvatars from '../../components/containers/CMSAvatars';
import InputTextIcon from '../../components/controls/InputTextIcon';

import CMSColors from '../../styles/cmscolors';
import {CLOUD_TYPE} from '../../consts/video';
import sitesStore from '../../stores/sites';
import ROUTERS from '../../consts/routes';
import variables from '../../styles/variables';
import commonStyles from '../../styles/commons.style';
// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import {Comps as CompTxt} from '../../localization/texts';

const LayoutData = [
  {
    key: 'layout_2x2',
    value: 2,
    icon: 'grid-view-4',
  },
  {
    key: 'layout_3x33',
    value: 3,
    icon: 'grid-view-9',
  },
  {
    key: 'layout_4x4',
    value: 4,
    icon: 'grid-view-16',
  },
];

class ChannelsView extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    const {width, height} = Dimensions.get('window');

    this.state = {
      viewableWindow: {
        width,
        height,
      },
      gridLayout: 2,
      showLayoutSelection: false,
      liveData: [],
    };
    // this.channelsCount = 0;
    this.playerRefs = [];
    this.firstFocus = true;
    // this.showAllTimeout = null;
  }

  componentWillUnmount() {
    __DEV__ && console.log('ChannelsView componentWillUnmount');
    const {videoStore} = this.props;
    this._isMounted = false;
    AppState.removeEventListener('change', this.handleAppStateChange);
    videoStore.releaseStreams();
    videoStore.setChannelFilter('');
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    this.stopAll();
    videoStore.setStreamReadyCallback(null);
  }

  componentDidMount() {
    this._isMounted = true;
    const {videoStore, sitesStore, navigation} = this.props;
    if (__DEV__) {
      console.log('ChannelsView componentDidMount: ', sitesStore.selectedDVR);
      // if (sitesStore.selectedDVR.name === 'jackhome')
      //   videoStore.setNVRLoginInfo('i3admin', 'i3admin');
    }
    this.setHeader(false);
    AppState.addEventListener('change', this.handleAppStateChange);

    if (!sitesStore.selectedDVR) return;
    videoStore.selectDVR(sitesStore.selectedDVR);

    // videoStore.setStreamInfoCallback(this.onReceiveStreamInfo);
    videoStore.setStreamReadyCallback(this.onStreamReady);
    this.unsubscribleFocusEvent = navigation.addListener('focus', () => {
      if (this.firstFocus) {
        this.firstFocus = false;
        return;
      }
      __DEV__ && console.log('GOND live channels view on focused');
      this.pauseAll(false);
    });

    // reaction(
    //   () => videoStore.showAuthenModal,
    //   (value, previousValue) => {
    //     __DEV__ &&
    //       console.log(
    //         'GOND showAuthenModal changed ',
    //         previousValue,
    //         ' -> ',
    //         value
    //       );
    //     if (value && !previousValue) {
    //       if (this.showAllTimeout) {
    //         __DEV__ && console.log('clearShowAllTimeout');
    //         clearTimeout(this.showAllTimeout);
    //         this.showAllTimeout = null;
    //       }
    //     }
    //   }
    // );

    this.getChannelsInfo();
  }

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
    const {navigation, videoStore} = this.props;
    let gridIcon = 'grid-view-4';
    switch (this.state.gridLayout) {
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
        <View style={styles.headerRight}>
          {videoStore.cloudType == CLOUD_TYPE.HLS ||
          videoStore.cloudType == CLOUD_TYPE.RTC ? (
            <CMSAvatars
              size={22}
              onPress={() => navigation.push(ROUTERS.VIDEO_CHANNELS_SETTING)}
              color={CMSColors.ColorText}
              disabled={!enableSettingButton}
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
          <CMSAvatars
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
        </View>
      ),
    });
  };

  getChannelsInfo = async () => {
    const {videoStore} = this.props;
    let newState = {};
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

    // Streaming will call onStreamReady when finish initialization
    if (
      res &&
      (videoStore.cloudType == CLOUD_TYPE.DEFAULT ||
        videoStore.cloudType == CLOUD_TYPE.DIRECTION)
    ) {
      newState.liveData = this.buildLiveData(this.state.gridLayout /*, true*/);
      // __DEV__ && console.log('GOND show first channels 1!');
      // this.showAllTimeout = setTimeout(() => {
      //   __DEV__ && console.log('GOND show all channels... 1');
      //   this.onStreamReady();
      //   this.showAllTimeout = null;
      // }, 3000);
    }
    this.setState(newState);
  };

  // onReceiveStreamInfo = streamInfo => {
  //   initRTCStream(streamInfo);
  // };

  onStreamReady = () => {
    if (!this._isMounted) return;
    this.setState({liveData: this.buildLiveData(this.state.gridLayout)});
    // dongpt: any side effect?
    this.props.videoStore.setStreamReadyCallback(null);
  };

  onAuthenSubmit = ({username, password}) => {
    if (!username || !password) return;
    const {videoStore} = this.props;
    videoStore.setNVRLoginInfo(username, password);
    videoStore.displayAuthen(false);

    // if (
    //   videoStore.cloudType == CLOUD_TYPE.DEFAULT ||
    //   videoStore.cloudType == CLOUD_TYPE.DIRECTION
    // ) {
    //   if (this.showAllTimeout) {
    //     clearTimeout(this.showAllTimeout);
    //   }
    //   this.showAllTimeout = setTimeout(() => {
    //     __DEV__ && console.log('GOND show all channels... 2');
    //     this.onStreamReady();
    //     this.showAllTimeout = null;
    //   }, 3000);
    // }
    __DEV__ && console.log('GOND show first channels 2!');
    this.setState({
      liveData: this.buildLiveData(this.state.gridLayout /*, true*/),
    });
  };

  onAuthenCancel = () => {
    this.props.videoStore.displayAuthen(false);
  };

  onChannelSelect = value => {
    __DEV__ && console.log('GOND select channel: ', value);
    if (!value || Object.keys(value) == 0) return;

    this.props.videoStore.selectChannel(value.channelNo);
    this.pauseAll(true);
    setTimeout(() => {
      this.props.navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 200);
  };

  pauseAll = value => {
    this.playerRefs.forEach(p => p && p.pause(value));
  };

  stopAll = () => {
    this.playerRefs.forEach(p => p && p.stop());
  };

  buildLiveData = (gridLayout, isFirst = false) => {
    // const {gridLayout} = this.state;
    const {videoStore} = this.props;
    const videoDataList = videoStore.buildVideoData();
    __DEV__ &&
      console.log(
        'ChannelsView videoDataList: ',
        videoDataList,
        ', layout: ',
        gridLayout
      );
    // this.channelsCount = videoDataList.length;
    if (!videoDataList || !Array.isArray(videoDataList)) return [];
    if (isFirst) {
      let newRow = {key: 'videoRow_0', data: []};
      for (let i = 0; i < gridLayout; i++) {
        if (i == 0) {
          newRow.data.push(videoDataList[i]);
        } else newRow.data.push({});
      }
      return [newRow];
    }

    let result = [];
    let totalRow = Math.ceil(videoDataList.length / gridLayout);

    for (let row = 0; row < totalRow; row++) {
      let newRow = {key: 'videoRow_' + row, data: []};
      for (let col = 0; col < gridLayout; col++) {
        let index = row * gridLayout + col;
        if (index < videoDataList.length) {
          newRow.data.push(videoDataList[index]);
          __DEV__ &&
            console.log('ChannelsView build video newRow.data: ', newRow);
        } else newRow.data.push({});
      }
      result.push(newRow);
    }

    __DEV__ && console.log('ChannelsView build video data: ', result);
    return result;
  };

  onLayout = event => {
    const {x, y, width, height} = event.nativeEvent.layout;
    const {gridLayout} = this.state;
    __DEV__ && console.log('ChannelsView onLayout: ', event.nativeEvent);
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
    this.setState({
      liveData: this.buildLiveData(this.state.gridLayout),
    });
  };

  renderNVRAuthenModal = () => {
    const {videoStore} = this.props;

    return (
      <Modal
        animationType={'slide'}
        transparent={true}
        isDisabled={false}
        backdrop={true}
        coverScreen={true}
        supportedOrientations={[
          'portrait',
          'landscape',
          'portrait-upside-down',
          'landscape-left',
          'landscape-right',
        ]}
        visible={videoStore.showAuthenModal}
        onRequestClose={() => {
          this.setState(this.onAuthenCancel);
        }}>
        <View style={[styles.modalcontainer]}>
          <AuthenModal
            style={styles.authenModal}
            onOK={this.onAuthenSubmit}
            onCancel={this.onAuthenCancel}
            username={videoStore.nvrUser}
            password={''}
            title={'NVR Authorization'}
          />
        </View>
      </Modal>
    );
  };

  renderLayoutItem = ({item}) => {
    const {height} = Dimensions.get('window');
    const {viewableWindow} = this.state;

    return (
      <CMSAvatars
        size={height * 0.07}
        // style={{alignSelf: 'center'}}
        onPress={() =>
          this.setState(
            {
              gridLayout: item.value,
              showLayoutSelection: false,
              liveData: this.buildLiveData(item.value),
              videoWindow: {
                width: viewableWindow.width / item.value,
                height: viewableWindow.height / item.value,
              },
            },
            () => this.setHeader()
          )
        }
        color={CMSColors.ColorText}
        // styles={{flex: 1}}
        iconCustom={item.icon}
      />
    );
  };

  renderLayoutModal = () => {
    const {width, height} = Dimensions.get('window');

    return (
      <BottomModal
        visible={this.state.showLayoutSelection}
        onTouchOutside={() => this.setState({showLayoutSelection: false})}
        onSwipeOut={() => this.setState({showLayoutSelection: false})}
        height={0.25}>
        <ModalContent style={styles.layoutModalContainer}>
          <Text style={styles.layoutModalTitle}>Division</Text>
          <FlatList
            contentContainerStyle={styles.layoutModalBody}
            renderItem={this.renderLayoutItem}
            data={LayoutData}
            horizontal={true}
          />
        </ModalContent>
      </BottomModal>
    );
  };

  renderRow = ({item}) => {
    const {viewableWindow, videoWindow} = this.state;
    // console.log(
    //   'GOND renderRow viewableWindow = ',
    //   viewableWindow,
    //   ', item = ',
    //   item
    // );
    const playerViews = [];
    for (let i = 0; i < item.data.length; i++) {
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
          <TouchableOpacity
            style={{width: '100%', height: '100%', borderWidth: 0}}
            onPress={() => this.onChannelSelect(item.data[i])}>
            {this.renderVideoPlayer(item.data[i])}
          </TouchableOpacity>
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

  renderVideoPlayer = item => {
    // __DEV__ && console.log('GOND renderVid player: ', item);
    if (!item || Object.keys(item).length == 0) return null;
    const {videoWindow} = this.state;
    const {videoStore} = this.props;

    let playerProps = {
      with: videoWindow.width,
      height: videoWindow.height,
      isLive: true,
      hdMode: false,
    };
    let player = null;
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
        player = (
          <DirectVideoView
            {...playerProps}
            serverInfo={item}
            ref={ref => this.playerRefs.push(ref)}
          />
        );
        break;
      case CLOUD_TYPE.HLS:
        player = (
          <HLSStreamingView
            {...playerProps}
            ref={ref => this.playerRefs.push(ref)}
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

    return player;
  };

  render() {
    const authenModal = this.renderNVRAuthenModal();
    const {appStore, videoStore, navigation} = this.props;
    // __DEV__ && console.log('GOND channels render data = ', this.state.liveData);
    this.playerRefs = [];

    return (
      <View style={styles.screenContainer}>
        {/* <Searchbar
          // autoFocus
          // onIconPress={() => appStore.enableSearchbar(false)}
          icon={{}}
          placeholder="Search..." //{CompTxt.searchPlaceholder}
          value={videoStore.channelFilter}
          onChangeText={this.onFilter}
        /> */}
        <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={videoStore.channelFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View>
        {authenModal}
        <View style={styles.videoListContainer} onLayout={this.onLayout}>
          <FlatList
            renderItem={this.renderRow}
            data={this.state.liveData}
            keyExtractor={item => item.key}
            onRefresh={this.getChannelsInfo}
            refreshing={videoStore.isLoading}
          />
        </View>
        {this.renderLayoutModal()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screenContainer: {flex: 1, backgroundColor: CMSColors.White},
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
  },
  modalcontainer: {
    flex: 1,
    backgroundColor: CMSColors.PrimaryColor54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authenModal: {flex: 0, width: 343, height: 303},
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
    height: '80%',
    // width: width,
  },
  layoutModalTitle: {
    alignContent: 'center',
    fontSize: 24,
    fontWeight: '700',
    paddingBottom: 25,
  },
  layoutModalBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 35,
    paddingRight: 35,
  },
});

export default inject(
  'appStore',
  'videoStore',
  'sitesStore'
)(observer(ChannelsView));
