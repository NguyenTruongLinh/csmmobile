import React, {Component} from 'react';
import {View, FlatList, Text, Image} from 'react-native';

import {inject, observer} from 'mobx-react';
import {SwipeRow} from 'react-native-swipe-list-view';

import CMSRipple from '../../components/controls/CMSRipple';
import AlertDismissModal from '../health/modals/dismissModal';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import BackButton from '../../components/controls/BackButton';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import {IconCustom} from '../../components/CMSStyleSheet';
import HealthBackRow from './components/healthBackRow';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import styles from './styles/sitesStyles';
import theme from '../../styles/appearance';

import ROUTERS from '../../consts/routes';
import {WIDGET_COUNTS} from '../../consts/misc';
import {clientLogID} from '../../stores/user';
import NoData from '../../components/views/NoData';

class SitesView extends Component {
  constructor(props) {
    super(props);
    const {route} = props;
    this._isMounted = false;

    this.state = {
      isLoadingRegardlessStep: true,
      listHeight: 0,
      isHealthRoute: route.name == ROUTERS.HEALTH_SITES,
      refreshOnResume: false,
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
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    this.unsubscribleBlurEvent && this.unsubscribleBlurEvent();
  }

  async componentDidMount() {
    this._isMounted = true;
    const {navigation, userStore, sitesStore} = this.props;
    const {isHealthRoute} = this.state;
    if (__DEV__)
      console.log('SitesView componentDidMount: ', this.searchbarRef);

    this.unsubscribleFocusEvent = navigation.addListener('focus', () => {
      if (this.blurFlag) {
        this.blurFlag = false;
        this.setState({refreshOnResume: true});
      }
    });

    this.unsubscribleBlurEvent = navigation.addListener('blur', () => {
      this.blurFlag = true;
      this.setState({refreshOnResume: false});
    });
    if (sitesStore.selectedRegion == null) {
      navigation.setOptions({headerLeft: () => null});
    }
    await this.getData();

    this.setHeader();
    if (isHealthRoute) {
      userStore.resetWidgetCount(WIDGET_COUNTS.HEALTH);
      userStore.setActivites(clientLogID.HEALTH);
    } else {
      userStore.setActivites(clientLogID.VIDEO);
    }
  }

  getData = async () => {
    const {sitesStore, healthStore, userStore} = this.props;
    const {isHealthRoute} = this.state;
    this.setState({isLoadingRegardlessStep: true});
    if (!sitesStore.selectedRegion || !sitesStore.hasRegions) {
      await sitesStore.getAllSites();
    }

    if (isHealthRoute) {
      if (!userStore.settings || userStore.settings.alertTypes.length == 0) {
        await userStore.getAlertTypesSettings();
      }
      await healthStore.getHealthData(sitesStore.sitesList);
    }
    this.setState({isLoadingRegardlessStep: false});
  };

  setHeader = () => {
    const {sitesStore, navigation, appStore} = this.props;
    const {appearance} = appStore;
    const {isHealthRoute} = this.state;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    if (isHealthRoute) {
      __DEV__ &&
        console.log('SitesView setHeader isHealthRoute: ', isHealthRoute);
      navigation.setOptions({
        headerLeft: () => <BackButton navigator={navigation} />,
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
        color={theme[appearance].iconColor}
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
        headerRight: () => (
          <View style={commonStyles.headerContainer}>{searchButton}</View>
        ),
      };
    }

    navigation.setOptions(options);
  };

  onSiteSelected = item => {
    const {sitesStore, navigation, healthStore} = this.props;
    const {isHealthRoute} = this.state;

    if (isHealthRoute) {
      // __DEV__ && console.log(` selectSite 6 item = `, JSON.stringify(item));
      sitesStore.selectSite(item.id);
      healthStore.selectSite(item.id);
      navigation.push(ROUTERS.HEALTH_DETAIL);
    } else {
      // __DEV__ && console.log(` selectSite  7 item = `, JSON.stringify(item));
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

    if (
      this.lastOpenRowId &&
      this.lastOpenRowId != rowId &&
      this.rowRefs[this.lastOpenRowId]
    ) {
      this.rowRefs[this.lastOpenRowId].closeRow();
    }
    this.lastOpenRowId = rowId;
  };

  renderItem = ({item}) => {
    const {isHealthRoute} = this.state;
    const rowId = item.id ?? 0;
    const {appearance} = this.props.appStore;

    return (
      <SwipeRow
        onRowOpen={() => this.onRowOpen(item)}
        ref={r => (this.rowRefs[rowId] = r)}
        closeOnRowPress={true}
        disableRightSwipe={!isHealthRoute}
        disableLeftSwipe={!isHealthRoute}
        swipeToOpenPercent={10}
        rightOpenValue={isHealthRoute ? -100 : 0}
        leftOpenValue={isHealthRoute ? 50 : 0}>
        <HealthBackRow
          data={item}
          isHealthRoute={isHealthRoute}
          onRowOpen={this.onRowOpen}
        />
        <CMSRipple
          rippleOpacity={0.8}
          onPress={() => this.onSiteSelected(item)}
          style={[
            styles.listItemRipple,
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.siteNameContainer}>
            {isHealthRoute && (
              <IconCustom
                name="sites"
                color={theme[appearance].iconColor}
                size={variables.fix_fontSize_Icon}
              />
            )}
            <Text
              style={[
                styles.siteName,
                {paddingLeft: isHealthRoute ? 14 : 0},
                theme[appearance].text,
              ]}>
              {isHealthRoute ? item.siteName : item.name}
            </Text>
          </View>
          {isHealthRoute && (
            <View style={styles.alertsCountContainer}>
              <Text style={styles.alertsCount}>
                {item.computedTotalFromChildren != null
                  ? item.computedTotalFromChildren
                  : item.total}
              </Text>
            </View>
          )}
        </CMSRipple>
      </SwipeRow>
    );
  };

  renderNoData = () => {
    return <NoData style={{height: this.state.listHeight}} />;
  };

  onFlatListLayout = event => {
    const {height} = event.nativeEvent.layout;
    this.setState({
      listHeight: height,
    });
  };

  render() {
    const {sitesStore, healthStore, appStore} = this.props;
    const {isHealthRoute, isLoadingRegardlessStep, refreshOnResume} =
      this.state;
    const siteData = isHealthRoute
      ? healthStore.filteredSites
      : sitesStore.filteredSites;
    const noData = !isLoadingRegardlessStep && siteData == 0;
    const {appearance} = appStore;

    __DEV__ &&
      console.log(
        ` healthStore.selectedSite = `,
        JSON.stringify(healthStore.selectedSite),
        `| sitesStore.selectedSite = `,
        JSON.stringify(sitesStore.selectedSite)
      );

    return (
      <View style={[styles.screenContainer, theme[appearance].container]}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={sitesStore.siteFilter}
        />
        {!isHealthRoute && (
          <View style={[styles.summaryContainer, theme[appearance].container]}>
            <Text style={styles.sitesCount}>
              {sitesStore.filteredSites.length + ' sites'}
            </Text>
          </View>
        )}
        <View style={{flex: 1}} onLayout={this.onFlatListLayout}>
          <FlatList
            ref={ref => (this.sitesListRef = ref)}
            renderItem={this.renderItem}
            keyExtractor={item => item.key ?? item.id}
            data={siteData}
            onRefresh={this.getData}
            refreshing={isLoadingRegardlessStep}
            ListEmptyComponent={noData && this.renderNoData()}
            extraData={refreshOnResume}
          />
        </View>
        <AlertDismissModal
          callback={() => {
            __DEV__ && console.log(` selectSite 9 `);
            healthStore.selectSite(null);
          }}
        />
      </View>
    );
  }
}

export default inject(
  'sitesStore',
  'userStore',
  'healthStore',
  'appStore'
)(observer(SitesView));
