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
// import Ripple from 'react-native-material-ripple';
import {SwipeRow} from 'react-native-swipe-list-view';

import CMSRipple from '../../components/controls/CMSRipple';
import AlertDismissModal from '../health/modals/dismissModal';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
// import InputTextIcon from '../../components/controls/InputTextIcon';
// import BackButton from '../../components/controls/BackButton';
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
    this.searchbarRef = null;
    this.lastOpenRowId = null;
  }

  componentWillUnmount() {
    __DEV__ && console.log('SitesView componentWillUnmount');
    this._isMounted = false;
    this.props.sitesStore.onSitesViewExit();
    this.onFilter('');
    // BackHandler.removeEventListener('hardwareBackPress', this.onBack);
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    this.unsubscribleBlurEvent && this.unsubscribleBlurEvent();
  }

  async componentDidMount() {
    this._isMounted = true;
    // const {sitesStore, healthStore, userStore, route} = this.props;
    const {navigation} = this.props;
    if (__DEV__)
      console.log('SitesView componentDidMount: ', this.searchbarRef);

    // BackHandler.addEventListener('hardwareBackPress', this.onBack);
    // const backEventHandler = e => {
    //   console.log('GOND navigation event: ', e);
    //   if (this.state.enableSearchbar && typeof e.preventDefault == 'function') {
    //     this.setState({enableSearchbar: false});
    //     e.preventDefault();
    //   }
    // };

    this.unsubscribleFocusEvent = navigation.addListener('focus', () => {
      if (this.blurFlag) {
        this.blurFlag = false;
        this.getData(true);
      }
    });

    this.unsubscribleBlurEvent = navigation.addListener('blur', () => {
      this.blurFlag = true;
    });

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
      await healthStore.getHealthData(sitesStore.sitesList);
    } // else if (route.name == ROUTERS.VIDEO_SITES) {
    // }
  };

  setHeader = () => {
    const {sitesStore, navigation} = this.props;
    const {isHealthRoute} = this.state;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;
    // __DEV__ && console.log('SitesView searchButton: ', searchButton);

    if (isHealthRoute) {
      __DEV__ &&
        console.log('SitesView setHeader isHealthRoute: ', isHealthRoute);
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerContainer}>{searchButton}</View>
        ),
      });
      return;
    }
    __DEV__ &&
      console.log(
        'SitesView setHeader not health route, hasRegion: ',
        sitesStore.hasRegions
      );
    const regionButton = sitesStore.hasRegions ? (
      <CMSTouchableIcon
        size={28}
        onPress={() => navigation.navigate(ROUTERS.VIDEO_REGIONS)}
        color={CMSColors.IconButton}
        styles={commonStyles.headerIcon}
        iconCustom="solid_region"
      />
    ) : undefined;
    __DEV__ && console.log('SitesView regionButton: ', regionButton);

    let options = {};
    if (sitesStore.selectedRegion == null) {
      options = {
        headerLeft: () => null,
        headerRight: () => (
          <View style={commonStyles.headerContainer}>
            {regionButton}
            {searchButton}
          </View>
        ),
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

  onDismissSiteAlerts = item => {
    if (!this.state.isHealthRoute) return;
    const {healthStore} = this.props;
    healthStore.selectSite(item.id);
    this.onRowOpen();
    healthStore.showDismissModal(true);
  };

  onSiteSelected = item => {
    const {sitesStore, navigation, healthStore} = this.props;
    const {isHealthRoute} = this.state;

    if (isHealthRoute) {
      sitesStore.selectSite(item.id);
      healthStore.selectSite(item.id);
      navigation.push(ROUTERS.HEALTH_DETAIL);
    } else {
      sitesStore.selectSite(item.key);
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
    const {sitesStore, healthStore, navigation} = this.props;
    __DEV__ && console.log('GOND Health gotoVideo ... ', data);
    sitesStore.selectSite(data.id);
    healthStore.setVideoMode(isLive);
    navigation.push(ROUTERS.HEALTH_CHANNELS);
  };

  onFilter = value => {
    const {sitesStore, healthStore} = this.props;
    const {isHealthRoute} = this.state;
    if (isHealthRoute) {
      healthStore.setSiteFilter(value);
    } else {
      sitesStore.setSiteFilter(value);
    }
  };

  onRowOpen = data => {
    const rowId = data ? data.id ?? 0 : null;
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

  renderBackRow = data => {
    const {isHealthRoute} = this.state;

    return isHealthRoute ? (
      <View style={styles.backRowContainer}>
        <View style={styles.backRowLeft}>
          <View style={styles.backRowButtonContainer}>
            <CMSTouchableIcon
              iconCustom="double-tick-indicator"
              size={26}
              onPress={() => this.onDismissSiteAlerts(data)}
              color={CMSColors.IconButton}
              // disabledColor={CMSColors.DisabledIconButton}
              // disabled={isLoading}
            />
          </View>
        </View>
        <View style={styles.backRowRight}>
          {/* <View style={{flex: 6}} /> */}
          <View style={styles.backRowButtonContainer}>
            <CMSTouchableIcon
              iconCustom="searching-magnifying-glass"
              size={26}
              onPress={() => this.gotoVideo(false, data)}
              color={CMSColors.IconButton}
              // disabledColor={CMSColors.DisabledIconButton}
              // disabled={isLoading}
            />
          </View>
          <View style={styles.backRowButtonContainer}>
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
      </View>
    ) : (
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
        disableRightSwipe={!isHealthRoute}
        disableLeftSwipe={!isHealthRoute}
        swipeToOpenPercent={10}
        rightOpenValue={isHealthRoute ? -100 : 0}
        leftOpenValue={isHealthRoute ? 50 : 0}
        // tension={2}
        // friction={3}
      >
        {this.renderBackRow(item)}
        <CMSRipple
          rippleOpacity={0.8}
          onPress={() => this.onSiteSelected(item)}
          style={styles.listItemRipple}>
          <View style={styles.siteNameContainer}>
            {isHealthRoute && (
              <IconCustom
                name="sites"
                color={CMSColors.IconButton}
                size={variables.fix_fontSize_Icon}
              />
            )}
            <Text style={styles.siteName}>
              {isHealthRoute ? item.siteName : item.name}
            </Text>
          </View>
          {isHealthRoute && (
            <View style={styles.alertsCountContainer}>
              <Text style={styles.alertsCount}>{item.total}</Text>
            </View>
          )}
        </CMSRipple>
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
      <View style={styles.screenContainer}>
        {/* <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={sitesStore.siteFilter}
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
          value={sitesStore.siteFilter}
        />
        {!isHealthRoute && (
          <View style={styles.summaryContainer}>
            <Text style={styles.sitesCount}>
              {sitesStore.filteredSites.length + ' sites'}
            </Text>
          </View>
        )}
        <FlatList
          ref={ref => (this.sitesListRef = ref)}
          renderItem={this.renderItem}
          keyExtractor={item => item.key ?? item.id}
          data={siteData}
          onRefresh={this.getData}
          refreshing={sitesStore.isLoading || healthStore.isLoading}
        />
        <AlertDismissModal
          callback={() => {
            healthStore.selectSite(null);
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 7,
  },
  screenContainer: {flex: 1, flexDirection: 'column'},
  backRowContainer: {flex: 1, flexDirection: 'row'},
  backRowLeft: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: ListViewHeight,
  },
  backRowButtonContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backRowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: ListViewHeight,
    // padding: 15,
  },
  listItemRipple: {
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
  },
  siteNameContainer: {
    flex: 1,
    flexDirection: 'row',
    // backgroundColor: CMSColors.Transparent,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '500',
    paddingLeft: 14,
  },
  alertsCountContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: ListViewHeight - 15,
    height: ListViewHeight - 15,
    marginRight: 14,
    backgroundColor: CMSColors.BtnNumberListRow,
  },
  alertsCount: {
    fontSize: 16,
    fontWeight: '500',
    color: CMSColors.White,
  },
  summaryContainer: {
    backgroundColor: CMSColors.HeaderListRow,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sitesCount: {
    paddingLeft: 24,
    textAlignVertical: 'center',
    color: CMSColors.RowOptions,
  },
});

export default inject(
  'sitesStore',
  'userStore',
  'healthStore'
)(observer(SitesView));
