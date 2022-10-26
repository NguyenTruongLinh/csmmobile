'use strict';
import React, {Component} from 'react';
import {View, Text, FlatList, Image} from 'react-native';

import {inject, observer} from 'mobx-react';

import CMSRipple from '../../components/controls/CMSRipple';
import {IconCustom} from '../../components/CMSStyleSheet';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import commonStyles from '../../styles/commons.style';
import variables from '../../styles/variables';
import theme from '../../styles/appearance';
import styles from './styles/sitesStyles';

import ROUTERS from '../../consts/routes';
import {No_Data} from '../../consts/images';
import {WIDGET_COUNTS} from '../../consts/misc';
import {clientLogID} from '../../stores/user';

class OAMSitesView extends Component {
  static defaultProps = {
    isPVMFullScreen: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      listHeight: 0,
      selectedSite: null,
    };
  }

  componentDidMount() {
    __DEV__ && console.log('OAMSitesView componentDidMount');

    const {sitesStore, userStore} = this.props;
    this.setHeader();
    sitesStore.getOAMSites();
    userStore.resetWidgetCount(WIDGET_COUNTS.OAM);
    userStore.setActivites(clientLogID.PVM);
  }

  setHeader = () => {
    const {navigation} = this.props;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>{searchButton}</View>
      ),
    });
  };

  componentWillUnmount() {
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    this.props.sitesStore.onSitesViewExit();
  }

  onDvrSelected = dvr => {
    const {oamStore, navigation} = this.props;
    if (dvr) {
      oamStore.setTitle(`${this.state.selectedSite.name} - ${dvr.name}`);
      oamStore.setKdvr(dvr.kDVR);
      navigation.push(ROUTERS.OAM_DETAIL);
    }
  };

  onSiteSelected = item => {
    const {sitesStore, oamStore, navigation} = this.props;
    sitesStore.selectSite(item.key);
    if (item.dvrs) {
      if (item.dvrs.length <= 1) {
        oamStore.setTitle(item.name);
        oamStore.setKdvr(item.dvrs[0].kDVR);
        navigation.push(ROUTERS.OAM_DETAIL);
      } else {
        this.setState({
          selectedSite: this.state.selectedSite == item ? null : item,
        });
      }
    }
  };

  notifyRenderDvrs(item) {
    return (
      item == this.state.selectedSite &&
      this.state.selectedSite.dvrs.map(dvr => (
        <CMSRipple
          rippleOpacity={0.8}
          onPress={() => this.onDvrSelected(dvr)}
          style={[
            styles.listItemRipple,
            {paddingLeft: 48},
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.siteNameContainer}>
            <IconCustom
              name="icon-dvr"
              color={theme[appearance].iconColor}
              size={variables.fix_fontSize_Icon}
            />
            <Text style={[styles.siteName, theme[appearance].text]}>
              {dvr.name}
            </Text>
          </View>
        </CMSRipple>
      ))
    );
  }

  notifyRenderArrow(item) {
    const {appearance} = this.props.appStore;
    return (
      item.dvrs &&
      item.dvrs.length > 1 && (
        <IconCustom
          name={
            item == this.state.selectedSite ? 'expand-arrow' : 'expand-button'
          }
          color={theme[appearance].iconColor}
          size={12}
          style={styles.arrowIcon}
        />
      )
    );
  }

  renderRow = ({item}) => {
    const {appearance} = this.props.appStore;

    return (
      <View>
        <CMSRipple
          delayTime={item.dvrs && item.dvrs.length > 1 ? 0 : undefined}
          rippleOpacity={0.8}
          onPress={() => this.onSiteSelected(item)}
          style={[
            styles.listItemRipple,
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.siteNameContainer}>
            <IconCustom
              name="sites"
              color={theme[appearance].iconColor}
              size={variables.fix_fontSize_Icon}
            />
            <Text style={[styles.siteName, theme[appearance].text]}>
              {item.name}
            </Text>
          </View>
        </CMSRipple>

        {this.notifyRenderArrow(item)}

        {this.notifyRenderDvrs(item)}
      </View>
    );
  };

  refreshLiveData = () => {
    const {sitesStore} = this.props;
    sitesStore.getOAMSites();
  };

  onFilter = value => {
    const {sitesStore} = this.props;
    sitesStore.setSiteFilter(value);
  };

  renderNoData = () => {
    const {appearance} = this.props.appStore;

    return (
      <View style={[styles.noDataContainer, {height: this.state.listHeight}]}>
        <Image source={No_Data} style={styles.noDataImg}></Image>
        <Text style={[styles.noDataTxt, theme[appearance].text]}>
          There is no data.
        </Text>
      </View>
    );
  };

  onFlatListLayout = event => {
    const {height} = event.nativeEvent.layout;
    this.setState({
      listHeight: height,
    });
  };

  render() {
    const {sitesStore, appStore} = this.props;
    const noData = !sitesStore.isLoading && sitesStore.filteredOamSites == 0;
    const {appearance} = appStore;

    return (
      <View style={[{flex: 1}, theme[appearance].container]}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={sitesStore.regionFilter}
        />
        <View style={{flex: 1}} onLayout={this.onFlatListLayout}>
          <FlatList
            style={{flex: 1}}
            renderItem={this.renderRow}
            data={sitesStore.filteredOamSites}
            keyExtractor={item => item.key}
            onRefresh={this.refreshLiveData}
            refreshing={sitesStore.isLoading}
            ListEmptyComponent={noData && this.renderNoData()}
          />
        </View>
      </View>
    );
  }
}

export default inject(
  'sitesStore',
  'oamStore',
  'userStore',
  'appStore'
)(observer(OAMSitesView));
