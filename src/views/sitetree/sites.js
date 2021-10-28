import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StyleSheet,
  BackHandler,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';
import {SwipeRow} from 'react-native-swipe-list-view';

// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import InputTextIcon from '../../components/controls/InputTextIcon';
import BackButton from '../../components/controls/BackButton';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';

import snackbar from '../../util/snackbar';

import ROUTERS from '../../consts/routes';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {Comps as CompTxt} from '../../localization/texts';

// const ListViewHeight = 56; // Dimensions.get('window').height / 16;

class SitesView extends Component {
  constructor(props) {
    super(props);
    const {route} = props;
    this._isMounted = false;

    // this.state = {
    //   enableSearchbar: false,
    // };
    this.state = {
      isHealthRoute: route.name == ROUTERS.HEALTH_SITES,
    };

    this.rowRefs = {};
    this.lastOpenRowId = null;
  }

  componentWillUnmount() {
    __DEV__ && console.log('SitesView componentWillUnmount');
    this._isMounted = false;
    this.props.sitesStore.onSitesViewExit();
    // BackHandler.removeEventListener('hardwareBackPress', this.onBack);
  }

  async componentDidMount() {
    this._isMounted = true;
    // const {sitesStore, healthStore, userStore, route} = this.props;
    if (__DEV__) console.log('SitesView componentDidMount: ', this.props);

    // BackHandler.addEventListener('hardwareBackPress', this.onBack);
    // const backEventHandler = e => {
    //   console.log('GOND navigation event: ', e);
    //   if (this.state.enableSearchbar && typeof e.preventDefault == 'function') {
    //     this.setState({enableSearchbar: false});
    //     e.preventDefault();
    //   }
    // };

    await this.getData();
    this.setHeader();
  }

  getData = async isReload => {
    const {sitesStore, healthStore, userStore, route} = this.props;
    const {isHealthRoute} = this.state;

    if (
      !sitesStore.selectedRegion ||
      !sitesStore.hasRegions
      // (!sitesStore.sitesList || sitesStore.sitesList.length == 0)
    ) {
      await sitesStore.getAllSites();
    }

    if (isHealthRoute) {
      if (!userStore.settings || userStore.settings.alertTypes.length == 0) {
        await userStore.getAlertTypesSettings();
      }
      await healthStore.getHealthData(
        userStore.settings.alertTypes,
        sitesStore.sitesList
      );
    } // else if (route.name == ROUTERS.VIDEO_SITES) {
    // }
  };

  setHeader = () => {
    const {sitesStore, navigation} = this.props;
    const {isHealthRoute} = this.state;
    if (isHealthRoute) return;
    const showRegionButton = sitesStore.hasRegions;
    let options = {};
    if (sitesStore.selectedRegion == null) {
      options = {
        headerLeft: () => null,
        headerRight: showRegionButton
          ? () => (
              <CMSTouchableIcon
                size={22}
                onPress={() => navigation.navigate(ROUTERS.VIDEO_REGIONS)}
                color={CMSColors.IconButton}
                styles={commonStyles.buttonSearchHeader}
                iconCustom="solid_region"
              />
            )
          : undefined,
      };
    } else {
      options = {
        headerTitle: sitesStore.selectedRegion.name ?? 'Unknow region',
      };
    }

    navigation.setOptions(options);
  };

  // onBack = () => {
  //   if (this.state.enableSearchbar) {
  //     this.setState({enableSearchbar: false});
  //   }
  // };

  onSiteSelected = item => {
    const {sitesStore, navigation, healthStore} = this.props;
    const {isHealthRoute} = this.state;
    sitesStore.selectSite(item.id);

    if (isHealthRoute) {
      healthStore.selectSite(item.id);
      navigation.push(ROUTERS.HEALTH_DETAIL);
    } else {
      if (item.dvrs.length == 1) {
        if (sitesStore.selectedDVR) return; // prevent double click
        sitesStore.selectDVR(item.dvrs[0]);
        navigation.push(ROUTERS.VIDEO_CHANNELS);
      } else {
        navigation.push(ROUTERS.VIDEO_NVRS);
      }
    }
  };

  gotoVideo = (isLive, data) => {
    const {sitesStore, videoStore, navigation} = this.props;
    __DEV__ && console.log('GOND Health gotoVideo ... ', data);
    sitesStore.selectSite(data.id);
    videoStore.switchLiveSearch(isLive);
    navigation.push(ROUTERS.HEALTH_CHANNELS);
  };

  onFilter = value => {
    const {sitesStore} = this.props;
    sitesStore.setSiteFilter(value);
  };

  onRowOpen = data => {
    const rowId = data.id ?? 0;
    // __DEV__ && console.log('GOND Health onRowOpen ... ', this.lastOpenRowId);

    if (
      this.lastOpenRowId &&
      this.lastOpenRowId != rowId &&
      this.rowRefs[this.lastOpenRowId]
    ) {
      this.rowRefs[this.lastOpenRowId].closeRow();
    }
    this.lastOpenRowId = rowId;
  };

  renderVideoButtons = data => {
    const {isHealthRoute} = this.state;

    return isHealthRoute ? (
      // <View style={{flex: 1}}>
      <View
        style={{
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          height: ListViewHeight,
          // padding: 15,
        }}>
        {/* <View style={{flex: 6}} /> */}
        <View
          style={{
            // flex: 1,
            width: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <CMSTouchableIcon
            iconCustom="searching-magnifying-glass"
            size={26}
            onPress={() => this.gotoVideo(false, data)}
            color={CMSColors.IconButton}
            // disabledColor={CMSColors.DisabledIconButton}
            // disabled={isLoading}
          />
        </View>
        <View
          style={{
            // flex: 1,
            width: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <CMSTouchableIcon
            iconCustom="videocam-filled-tool"
            size={26}
            onPress={() => this.gotoVideo(true, data)}
            color={CMSColors.IconButton}
            // disabledColor={CMSColors.DisabledIconButton}
            // disabled={isLoading}
          />
        </View>
      </View>
    ) : (
      // </View>
      <View />
    );
  };

  renderItem = ({item}) => {
    const {isHealthRoute} = this.state;
    const rowId = item.id ?? 0;
    // __DEV__ && console.log('GOND site height: ', ListViewHeight);

    return (
      <SwipeRow
        onRowOpen={() => this.onRowOpen(item)}
        ref={r => (this.rowRefs[rowId] = r)}
        closeOnRowPress={true}
        disableRightSwipe={true}
        disableLeftSwipe={!isHealthRoute}
        swipeToOpenPercent={10}
        rightOpenValue={isHealthRoute ? -100 : 0}
        // tension={2}
        // friction={3}
      >
        {this.renderVideoButtons(item)}
        <Ripple
          rippleOpacity={0.8}
          onPress={() => this.onSiteSelected(item)}
          style={{
            flex: 1,
            height: ListViewHeight + 2,
            backgroundColor: CMSColors.White,
            flexDirection: 'row',
            alignItems: 'center',
            // justifyContent: 'flex-start',
            paddingLeft: 16,
            // borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: CMSColors.BorderColorListRow,
          }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              // backgroundColor: CMSColors.Transparent,
            }}>
            {isHealthRoute && (
              <IconCustom
                name="sites"
                color={CMSColors.IconButton}
                size={variables.fix_fontSize_Icon}
              />
            )}
            <Text style={{fontSize: 16, fontWeight: '500', paddingLeft: 14}}>
              {isHealthRoute ? item.siteName : item.name}
            </Text>
          </View>
          {isHealthRoute && (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: ListViewHeight - 15,
                height: ListViewHeight - 15,
                marginRight: 14,
                backgroundColor: CMSColors.BtnNumberListRow,
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: CMSColors.White,
                }}>
                {item.total}
              </Text>
            </View>
          )}
        </Ripple>
      </SwipeRow>
    );
  };

  render() {
    const {sitesStore, healthStore} = this.props;
    const {isHealthRoute} = this.state;
    const siteData = isHealthRoute
      ? healthStore.filteredSites
      : sitesStore.filteredSites;

    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={sitesStore.siteFilter}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View>
        <View
          style={{
            backgroundColor: CMSColors.HeaderListRow,
            height: 35,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            style={{
              paddingLeft: 24,
              textAlignVertical: 'center',
              color: CMSColors.RowOptions,
            }}>
            {sitesStore.filteredSites.length + ' sites'}
          </Text>
        </View>
        <FlatList
          ref={ref => (this.sitesListRef = ref)}
          renderItem={this.renderItem}
          keyExtractor={item => item.key ?? item.id}
          data={siteData}
          onRefresh={this.getData}
          refreshing={sitesStore.isLoading || healthStore.isLoading}
        />
      </View>
    );
  }
}

export default inject(
  'videoStore',
  'sitesStore',
  'userStore',
  'healthStore'
)(observer(SitesView));
