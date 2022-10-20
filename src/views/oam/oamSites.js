'use strict';
import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  BackHandler,
  StyleSheet,
  Image,
} from 'react-native';

// import Ripple from 'react-native-material-ripple';

import CMSRipple from '../../components/controls/CMSRipple';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import theme from '../../styles/appearance';
import ROUTERS from '../../consts/routes';
import {No_Data} from '../../consts/images';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import {WIDGET_COUNTS} from '../../consts/misc';
import {clientLogID} from '../../stores/user';

const Item = ({title}) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

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

const styles = StyleSheet.create({
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
    marginRight: 50,
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
  noDataContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataImg: {
    width: 100,
    height: 100,
  },
  noDataTxt: {
    marginTop: 12,
    paddingBottom: 50,
    fontSize: 16,
    color: CMSColors.PrimaryText,
  },
  arrowIcon: {
    position: 'absolute',
    right: 20,
    top: ListViewHeight / 2 - 6,
  },
});

export default inject(
  'sitesStore',
  'oamStore',
  'userStore',
  'appStore'
)(observer(OAMSitesView));
