import React from 'react';
import {
  View,
  FlatList,
  Platform,
  Dimensions,
  StyleSheet,
  Text,
  Animated,
  // BackHandler,
} from 'react-native';
import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';
import {Dropdown} from 'react-native-element-dropdown';

import LoadingOverlay from '../../components/common/loadingOverlay';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import CMSImage from '../../components/containers/CMSImage';
import {IconCustom} from '../../components/CMSStyleSheet';
import CMSRipple from '../../components/controls/CMSRipple';
import NVRAuthenModal from '../../components/views/NVRAuthenModal';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import {CLOUD_TYPE} from '../../consts/video';
import ROUTERS from '../../consts/routes';
import {MODULE_PERMISSIONS, ChannelStatus} from '../../consts/misc';
import commonStyles from '../../styles/commons.style';
// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import {
  Comps as CompTxt,
  VIDEO as VIDEO_TXT,
  STREAM_STATUS,
} from '../../localization/texts';
// import Ripple from 'react-native-material-ripple';

const {width, height} = Dimensions.get('window');

const ITEMS_PER_ROW = 2;
const ITEM_HEIGHT = 200;
const DROPDOWN_ITEM_HEIGHT = 56;

class ChannelsListView extends React.Component {
  constructor(props) {
    super(props);
    const {gridLayout} = props.videoStore;
    const {width, height} = Dimensions.get('window');

    this.state = {
      width,
      height,
      isListView: true,
      isLoading: false,
    };
    this._isMounted = false;
    this.dvrSelectorRef = null;
    this.firstFocus = true;
    this.reactions = [];
  }

  componentWillUnmount() {
    __DEV__ && console.log('ChannelsListView componentWillUnmount');
    const {videoStore, sitesStore, healthStore} = this.props;
    this._isMounted = false;

    videoStore.releaseStreams();
    videoStore.setChannelFilter('');
    sitesStore.deselectDVR();
    sitesStore.onNVRsViewExit();
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    this.onFilter('');
    videoStore.enterVideoView(false);
    videoStore.resetNVRAuthentication();
  }

  async componentDidMount() {
    this._isMounted = true;
    const {videoStore, healthStore, sitesStore, navigation} = this.props;
    if (__DEV__) {
      console.log(
        'ChannelsListView componentDidMount: ',
        sitesStore.selectedDVR,
        ', default: ',
        sitesStore.selectedSiteDefaultDVR
      );
    }

    this.unsubscribleFocusEvent = navigation.addListener('focus', () => {
      // __DEV__ &&
      //   console.log(
      //     'GOND channels list view on focused, set islive: ',
      //     healthStore.isLiveVideo
      //   );
      videoStore.setShouldShowVideoMessage(false);
      videoStore.setLiveMode(healthStore.isLiveVideo);
      // if (this.firstFocus) {
      //   this.firstFocus = false;
      // } else {
      //   videoStore.resetNVRAuthentication();
      // }
    });
    // __DEV__ &&
    //   console.log(
    //     'GOND channels list view on focused event sub: ',
    //     this.unsubscribleFocusEvent
    //   );

    if (util.isNullOrUndef(sitesStore.selectedDVR)) {
      sitesStore.selectDVR(); // select default
      videoStore.selectDVR(sitesStore.selectedSiteDefaultDVR);
    }
    videoStore.enterVideoView(true);
    this.reactions = [
      reaction(
        () => videoStore.authenticationState,
        newState => {
          this.setHeader(true);
        }
      ),
    ];

    this.dvrSelectorRef && this.dvrSelectorRef.onSelect(sitesStore.selectedDVR);
    this.setHeader(false);

    this.getChannelsInfo();
  }

  setHeader = enableSettingButton => {
    if (!this._isMounted) return;
    const {navigation, videoStore, healthStore, sitesStore, userStore} =
      this.props;
    const {isListView} = this.state;

    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() =>
          this.setHeader(enableSettingButton)
        )
      : null;

    let title = sitesStore.selectedSite
      ? sitesStore.selectedSite.name
      : 'No Site was selected';

    title =
      width < 440 && title.length > 10 ? title.substring(0, 9) + '...' : title;

    // __DEV__ &&
    //   console.log(
    //     'GOND channels setHeader: ',
    //     healthStore.isLiveVideo,
    //     videoStore.hasNVRPermission,
    //     videoStore.authenticationState
    //   );

    navigation.setOptions({
      headerTitle: title,
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          {healthStore.isLiveVideo &&
          (videoStore.cloudType == CLOUD_TYPE.HLS ||
            videoStore.cloudType == CLOUD_TYPE.RTC) ? (
            <CMSTouchableIcon
              size={24}
              onPress={() => navigation.push(ROUTERS.VIDEO_CHANNELS_SETTING)}
              color={CMSColors.ColorText}
              disabled={
                !enableSettingButton ||
                !userStore.hasPermission(MODULE_PERMISSIONS.VSC) ||
                !videoStore.hasNVRPermission
              }
              styles={commonStyles.headerIcon}
              iconCustom="add-cam"
            />
          ) : null}
          <CMSTouchableIcon
            size={24}
            onPress={() => {
              this.setState({isListView: !this.state.isListView}, () =>
                this.setHeader(enableSettingButton)
              );
            }}
            color={CMSColors.ColorText}
            styles={commonStyles.headerIcon}
            iconCustom={isListView ? 'grid-view-4' : 'view-list-button'}
          />
          {searchButton}
        </View>
      ),
    });
  };

  getChannelsInfo = () => {
    const {videoStore, healthStore} = this.props;
    this.setState({isLoading: true}, async () => {
      let res = await videoStore.getCloudSetting();
      res = res && (await videoStore.getDisplayingChannels());
      if (videoStore.isAuthenticated && res) {
        this.setHeader(true);

        if (healthStore.isLiveVideo) {
          res = await videoStore.getVideoInfos();
        }
      }

      this.setState({isLoading: false});
    });
  };

  onChannelSelect = value => {
    const {videoStore, healthStore, navigation} = this.props;
    __DEV__ && console.log('GOND Health select channel: ', value);
    // prevent double click
    if (!value || Object.keys(value) == 0 /*|| videoStore.selectedChannel*/)
      return;
    // videoStore.switchLiveSearch(healthStore.isLiveVideo);

    if (healthStore.isLiveVideo) {
      videoStore.selectChannel(
        value.channelNo, // ?? value.channel.channelNo
        false
      );
    } else {
      videoStore.onHealthPlay(healthStore.isLiveVideo, value);
    }
    // this.pauseAll(true);
    setTimeout(() => {
      // __DEV__ && console.log('GOND select channel to Health Video ');
      videoStore.setShouldShowVideoMessage(true);
      navigation.push(ROUTERS.VIDEO_PLAYER);
    }, 500);
  };

  onLayout = event => {
    const {width, height} = event.nativeEvent.layout;
    __DEV__ && console.log('ChannelsListView onLayout: ', event.nativeEvent);
    this.setState({
      width,
      height,
    });
  };

  onFilter = value => {
    this.props.videoStore.setChannelFilter(value);
  };

  onChannelSnapshotLoaded = (channel, imgData) => {
    channel.saveSnapshot(imgData);
  };

  onSwitchDVR = item => {
    const {sitesStore, videoStore} = this.props;
    console.log('GOND renderItemList ', item);
    if (!videoStore.selectedDVR || item.kDVR != videoStore.selectedDVR.kDVR) {
      sitesStore.selectDVR(item.kDVR); // select default
      videoStore.selectDVR(item.kDVR);
      videoStore.releaseStreams();
      // videoStore.resetNVRAuthentication(true);
      this.getChannelsInfo();
    }
  };

  renderItemList = ({item}) => {
    console.log('GOND renderItemList ');
    const isStatusOK = item.status && item.status != ChannelStatus.VIDEOLOSS;

    return (
      <CMSRipple
        onPress={() => {
          this.onChannelSelect(item);
        }}
        underlayColor={CMSColors.Underlay}
        style={styles.listItemRipple}>
        <View style={styles.listItemContainer}>
          <CMSImage
            id={'list_' + item.kChannel}
            src={item.snapshot}
            dataCompleteHandler={(param, data) =>
              this.onChannelSnapshotLoaded(item, data)
            }
            domain={{
              controller: 'channel',
              action: 'image',
              id: item.kChannel,
            }} // {this.getSnapShot(item)}
            styleImage={styles.listItemImage}
          />
          <View style={styles.listInfoContainer}>
            <IconCustom
              name={
                isStatusOK ? 'videocam-filled-tool' : 'turn-video-off-button'
              }
              color={isStatusOK ? CMSColors.Success : CMSColors.SecondaryText}
              size={24}
            />
            <View style={styles.channelName}>
              <Text>{item.name}</Text>
            </View>
          </View>
        </View>
      </CMSRipple>
    );
  };

  renderItemGrid = ({item, index}) => {
    // __DEV__ && console.log('GOND renderChannelItem: ', item);
    return Object.keys(item).length == 0 ? (
      <View key="ch_none" style={styles.gridNoItem} />
    ) : (
      <CMSRipple
        key={item.kChannel}
        onPress={() => this.onChannelSelect(item)}
        style={[
          styles.gridItemRipple,
          {
            marginRight: index % 2 == 0 ? 7 : 0,
            marginLeft: index % 2 == 0 ? 0 : 7,
          },
        ]}>
        <View style={styles.gridImageContainer}>
          <CMSImage
            id={'grid_' + item.kChannel}
            resizeMode="cover"
            styleImage={styles.gridImage}
            // src={item.snapshot}
            dataSource={item.snapshot}
            dataCompleteHandler={(param, data) =>
              this.onChannelSnapshotLoaded(item, data)
            }
            // zzz
            domain={{
              controller: 'channel',
              action: 'image',
              id: item.kChannel,
            }}
          />
        </View>
        <View style={styles.gridInfoContainer}>
          <View style={styles.gridCamIcon}>
            <IconCustom
              name={
                item.enable ? 'videocam-filled-tool' : 'turn-video-off-button'
              }
              color={item.enable ? CMSColors.Green : CMSColors.DarkText}
              size={24}
            />
          </View>
          <View style={styles.channelName}>
            <Text numberOfLines={2} style={{}}>
              {item.name}
            </Text>
          </View>
        </View>
      </CMSRipple>
    );
  };

  renderInfoText = () => {
    const {userStore, videoStore, navigation} = this.props;

    __DEV__ &&
      console.log(
        'GOND channels renderInfoText',
        videoStore.authenticationState,
        videoStore.hasNVRPermission,
        videoStore.isAPIPermissionSupported
      );
    if (this.state.isLoading) {
      return (
        <LoadingOverlay
          height={48}
          backgroundColor={CMSColors.Transparent}
          indicatorColor={CMSColors.PrimaryActive}
        />
      );
    }

    if (
      userStore.hasPermission(MODULE_PERMISSIONS.VSC) &&
      videoStore.hasNVRPermission
    )
      return (
        <View style={styles.infoTextContainer}>
          <Text>{VIDEO_TXT.SELECT_CHANNEL_1}</Text>
          {/* <IconCustom name="add-cam" size={22} color={CMSColors.ColorText} /> */}
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
      );

    return (
      <View style={styles.infoTextContainer}>
        <Text>
          {videoStore.allChannels.length == 0
            ? VIDEO_TXT.NO_CHANNEL
            : userStore.hasPermission(MODULE_PERMISSIONS.VSC)
            ? STREAM_STATUS.NO_PERMISSION
            : VIDEO_TXT.NO_VSC_PERMISSION}
        </Text>
      </View>
    );
  };

  render() {
    const {videoStore, sitesStore} = this.props;
    const {isListView, isLoading} = this.state;
    __DEV__ &&
      console.log(
        'GOND channels render: ',
        videoStore.isAuthenticated,
        videoStore.authenticationState
      );
    this.playerRefs = [];
    const renderItem = isListView ? this.renderItemList : this.renderItemGrid;
    const dvrsCount = sitesStore.selectedSiteDVRs.length;
    const data =
      isListView || videoStore.filteredDisplayChannels.length % 2 == 0
        ? videoStore.filteredDisplayChannels
        : [...videoStore.filteredDisplayChannels, {}];
    return (
      <View style={styles.screenContainer}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={videoStore.channelFilter}
        />
        <NVRAuthenModal ref={r => (this.authenRef = r)} onSubmit={() => {}} />
        {dvrsCount > 1 && (
          <View style={styles.dropdownContainer}>
            <Dropdown
              data={sitesStore.selectedSiteDVRs}
              labelField="name"
              valueField="kDVR"
              value={
                sitesStore.selectedDVR ? sitesStore.selectedDVR.kDVR : undefined
              }
              search={dvrsCount > 5}
              searchPlaceholder={CompTxt.searchPlaceholder}
              onChange={this.onSwitchDVR}
              renderLeftIcon={() => (
                <View style={styles.dropdownIcon}>
                  <IconCustom
                    name={'icon-dvr'}
                    size={24}
                    color={CMSColors.PrimaryText}
                  />
                </View>
              )}
              maxHeight={
                dvrsCount < 5
                  ? dvrsCount * DROPDOWN_ITEM_HEIGHT
                  : 4 * DROPDOWN_ITEM_HEIGHT
              }
              containerStyle={{flex: 1, height: DROPDOWN_ITEM_HEIGHT}}
            />
          </View>
        )}
        <View style={styles.videoListContainer} onLayout={this.onLayout}>
          {
            // isLoading ||
            // !videoStore.isCloud ||
            videoStore.displayChannels.length > 0 &&
            videoStore.isAuthenticated &&
            videoStore.hasNVRPermission ? (
              <FlatList
                ref={r => (this.videoListRef = r)}
                renderItem={renderItem}
                data={data} // {this.state.liveData}
                columnWrapperStyle={
                  isListView ? undefined : {justifyContent: 'space-between'}
                }
                key={isListView ? 'listChannels' : 'gridlChannels'}
                keyExtractor={item =>
                  (isListView ? 'list_' : 'grid_') + item.kChannel
                }
                numColumns={isListView ? 1 : ITEMS_PER_ROW}
                onRefresh={this.getChannelsInfo}
                refreshing={isLoading}
              />
            ) : (
              this.renderInfoText()
            )
          }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: CMSColors.White,
  },
  headerIcon: {
    flex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: 5,
  },
  dropdownContainer: {
    height: DROPDOWN_ITEM_HEIGHT,
    marginVertical: 14,
    padding: 14,
    backgroundColor: CMSColors.WidgetBackground,
  },
  videoListContainer: {flex: 1, flexDirection: 'column'},
  infoTextContainer: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIcon: {marginRight: 14},
  gridNoItem: {
    flex: 1,
    width: '48%',
    height: ITEM_HEIGHT,
    marginRight: 0,
    marginLeft: 7,
  },
  gridItemRipple: {
    flex: 1,
    flexDirection: 'column',
    // width: '48%',
    height: ITEM_HEIGHT,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CMSColors.BorderColorListRow,
  },
  gridImageContainer: {flex: 8},
  gridImage: {width: '100%', height: '100%'},
  gridInfoContainer: {
    flex: 2,
    flexDirection: 'row',
  },
  gridCamIcon: {justifyContent: 'center', paddingLeft: 7},
  channelName: {flex: 1, justifyContent: 'center', paddingLeft: 7},
  listItemRipple: {
    height: 74,
    borderBottomWidth: 1,
    borderBottomColor: CMSColors.BorderColorListRow,
  },
  listItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 5,
  },
  listItemImage: {width: 60, height: 60},
  listInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7,
  },
});

export default inject(
  'videoStore',
  'healthStore',
  'sitesStore',
  'userStore'
)(observer(ChannelsListView));
