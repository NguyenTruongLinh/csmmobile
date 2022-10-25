import React from 'react';
import {View, FlatList, Dimensions, Text} from 'react-native';
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
import commonStyles from '../../styles/commons.style';
import styles, {
  DROPDOWN_ITEM_HEIGHT,
  ITEMS_PER_ROW,
} from './styles/channelsListStyles';
import theme from '../../styles/appearance';

import {CLOUD_TYPE} from '../../consts/video';
import {MODULE_PERMISSIONS, ChannelStatus} from '../../consts/misc';
import ROUTERS from '../../consts/routes';
import {
  Comps as CompTxt,
  VIDEO as VIDEO_TXT,
  STREAM_STATUS,
} from '../../localization/texts';

const {width, height} = Dimensions.get('window');

class ChannelsListView extends React.Component {
  constructor(props) {
    super(props);

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
    const {videoStore, sitesStore} = this.props;
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
      videoStore.setShouldShowVideoMessage(false);
      videoStore.setLiveMode(healthStore.isLiveVideo);
    });

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
    const {
      navigation,
      videoStore,
      healthStore,
      sitesStore,
      userStore,
      appStore,
    } = this.props;
    const {isListView} = this.state;
    const {appearance} = appStore;

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
              color={theme[appearance].iconColor}
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
            color={theme[appearance].iconColor}
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
      this.getChannelsInfo();
    }
  };

  renderItemList = ({item}) => {
    const {appearance} = this.props.appStore;
    const isStatusOK = item.status && item.status != ChannelStatus.VIDEOLOSS;

    return (
      <CMSRipple
        onPress={() => {
          this.onChannelSelect(item);
        }}
        underlayColor={CMSColors.Underlay}
        style={styles.listItemRipple}>
        <View style={[styles.listItemContainer]}>
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
            }}
            styles={styles.listItemImage}
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
              <Text style={theme[appearance].text}>{item.name}</Text>
            </View>
          </View>
        </View>
      </CMSRipple>
    );
  };

  renderItemGrid = ({item, index}) => {
    const {appearance} = this.props.appStore;

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
            <Text numberOfLines={2} style={theme[appearance].text}>
              {item.name}
            </Text>
          </View>
        </View>
      </CMSRipple>
    );
  };

  renderInfoText = () => {
    const {userStore, videoStore, navigation, appStore} = this.props;
    const {appearance} = appStore;

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
          <Text style={theme[appearance].text}>
            {VIDEO_TXT.SELECT_CHANNEL_1}
          </Text>
          <CMSTouchableIcon
            size={22}
            onPress={() => navigation.push(ROUTERS.VIDEO_CHANNELS_SETTING)}
            color={theme[appearance].iconColor}
            styles={styles.noChannelIcon}
            iconCustom="add-cam"
          />
          <Text style={theme[appearance].text}>
            {VIDEO_TXT.SELECT_CHANNEL_2}
          </Text>
        </View>
      );

    return (
      <View style={styles.infoTextContainer}>
        <Text style={theme[appearance].text}>
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
    const {videoStore, sitesStore, appStore} = this.props;
    const {appearance} = appStore;
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
      <View style={[styles.screenContainer, theme[appearance].container]}>
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
                    color={theme[appearance].text}
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
          {videoStore.displayChannels.length > 0 &&
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
          )}
        </View>
      </View>
    );
  }
}

export default inject(
  'videoStore',
  'healthStore',
  'sitesStore',
  'userStore',
  'appStore'
)(observer(ChannelsListView));
