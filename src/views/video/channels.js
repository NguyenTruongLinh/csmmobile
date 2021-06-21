import React, {Component} from 'react';
import {
  View,
  FlatList,
  Platform,
  Modal,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  // BackHandler,
} from 'react-native';

import {inject, observer} from 'mobx-react';

import DirectVideoView from './direct';
import HLSStreamingView from './hls';
import RTCStreamingView from './rtc';
import AuthenModal from '../../components/common/AuthenModal';

import CMSColors from '../../styles/cmscolors';
import videoStore from '../../stores/video';
import {CLOUD_TYPE} from '../../consts/video';
import sitesStore from '../../stores/sites';
import HeaderWithSearch from '../../components/containers/HeaderWithSearch';

class ChannelsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    const {width, height} = Dimensions.get('window');

    this.state = {
      viewableWindow: {
        width,
        height,
      },
      viewsPerRow: 2,
      showAuthen: false,
      liveData: [],
    };
  }

  componentWillUnmount() {
    __DEV__ && console.log('ChannelsView componentWillUnmount');
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    const {videoStore, sitesStore, navigation} = this.props;
    if (__DEV__)
      console.log('ChannelsView componentDidMount: ', sitesStore.selectedDVR);

    // navigation.setOptions({
    //   headerTitle: sitesStore.selectedDVR
    //     ? sitesStore.selectedDVR.name
    //     : 'No DVR was selected',
    // });
    if (!sitesStore.selectedDVR) return;
    videoStore.selectDVR(sitesStore.selectedDVR);

    this.getChannelsInfo();
  }

  getChannelsInfo = async () => {
    const {videoStore} = this.props;
    let newState = {};
    let res = await videoStore.getCloudSetting();
    res = res && (await videoStore.getDisplayingChannels());
    res = res && (await videoStore.getVideoInfos());
    if (videoStore.needAuthen) {
      newState.showAuthen = true;
    }
    if (res) {
      newState.liveData = this.buildLiveData();
    }
    this.setState(newState);
  };

  onAuthenSubmit = ({username, password}) => {
    this.props.videoStore.setNVRLoginInfo({username, password});
    this.setState({
      showAuthen: false,
      liveData: this.buildLiveData(),
    });
  };

  onAuthenCancel = () => {
    this.setState({showAuthen: false});
  };

  buildLiveData = () => {
    const {viewsPerRow} = this.state;
    const {videoStore} = this.props;
    const videoDataList = videoStore.buildVideoData();
    __DEV__ && console.log('ChannelsView videoDataList: ', videoDataList);
    if (!videoDataList || !Array.isArray(videoDataList)) return [];

    let result = [];
    let totalRow = Math.ceil(videoDataList.length / viewsPerRow);

    for (let row = 0; row < totalRow; row++) {
      let newRow = {key: 'videoRow_' + row, data: []};
      for (let col = 0; col < viewsPerRow; col++) {
        let index = row * viewsPerRow + col;
        if (index < videoDataList.length)
          newRow.data.push(videoDataList[index]);
        else newRow.data.push({});
      }
      result.push(newRow);
    }

    __DEV__ && console.log('ChannelsView build video data: ', result);
    return result;
  };

  onLayout = event => {
    const {x, y, width, height} = event.nativeEvent.layout;
    const {viewsPerRow} = this.state;
    __DEV__ && console.log('ChannelsView onLayout: ', event.nativeEvent);
    this.setState({
      viewableWindow: {
        width,
        height,
      },
      videoWindow: {
        width: width / viewsPerRow,
        height: height / viewsPerRow,
      },
    });
  };

  onFilter = value => {
    this.props.videoStore.setChannelFilter(value);
    this.setState({
      liveData: this.buildLiveData(),
    });
  };

  renderNVRAuthenModal = () => {
    const {showAuthen} = this.state;
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
        visible={showAuthen}
        onRequestClose={() => {
          this.setState({showAuthen: false});
        }}>
        <View style={[styles.modalcontainer]}>
          <AuthenModal
            style={{flex: 0, width: 343, height: 303}}
            onOK={this.onAuthenSubmit}
            onCancel={() => {
              this.setState({showAuthen: false}, () => {
                this.onAuthenCancel();
              });
            }}
            username={videoStore.nvrUser}
            password={''}
            title={'NVR Authorization'}
          />
        </View>
      </Modal>
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
          style={{
            flex: 1,
            width: videoWindow.width,
            height: videoWindow.height,
            borderColor: 'black',
            borderWidth: 1,
          }}>
          {this.renderVideoPlayer(item.data[i])}
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

    const playerProps = {
      with: videoWindow.width,
      height: videoWindow.height,
    };
    let player = null;
    switch (videoStore.cloudType) {
      case CLOUD_TYPE.DEFAULT:
      case CLOUD_TYPE.DIRECTION:
        player = <DirectVideoView {...playerProps} serverInfo={item} />;
        break;
      case CLOUD_TYPE.HLS:
        player = <HLSStreamingView {...playerProps} />;
        break;
      case CLOUD_TYPE.RTC:
        player = <RTCStreamingView {...playerProps} />;
        break;
    }

    return (
      <View
        style={{
          width: videoWindow.width,
          height: videoWindow.height,
          // borderColor: 'blue',
          // borderWidth: 2,
        }}>
        {player}
      </View>
    );
  };

  render() {
    const authenModal = this.renderNVRAuthenModal();
    const {appStore, videoStore, navigation} = this.props;
    // __DEV__ && console.log('GOND channels render data = ', this.state.liveData);

    return (
      <View style={{flex: 1}} onLayout={this.onLayout}>
        <HeaderWithSearch
          title={
            sitesStore.selectedDVR
              ? sitesStore.selectedDVR.name
              : 'No DVR was selected'
          }
          showSearchBar={appStore.showSearchBar}
          onChangeSearchText={this.onFilter}
          searchValue={videoStore.channelFilter}
          // backButton={false}
          navigator={navigation}
        />
        {authenModal}
        <View style={{flexDirection: 'column'}}>
          <FlatList
            renderItem={this.renderRow}
            data={this.state.liveData}
            keyExtractor={item => item.key}
            onRefresh={this.getChannelsInfo}
            refreshing={videoStore ? videoStore.isLoading : false}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modalcontainer: {
    flex: 1,
    backgroundColor: CMSColors.PrimaryColor54,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default inject(
  'appStore',
  'videoStore',
  'sitesStore'
)(observer(ChannelsView));
