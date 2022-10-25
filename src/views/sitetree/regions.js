import React, {Component} from 'react';
import {View, FlatList, Text, Image} from 'react-native';

import {reaction} from 'mobx';
import {inject, observer} from 'mobx-react';

import CMSRipple from '../../components/controls/CMSRipple';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/regionStyles';

import ROUTERS from '../../consts/routes';
import {No_Data} from '../../consts/images';

class RegionsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.reactions = [];
    this.state = {
      listHeight: 0,
    };
  }

  componentWillUnmount() {
    __DEV__ && console.log('RegionsView componentWillUnmount');
    this._isMounted = false;

    this.reactions && this.reactions.map(unsubscribe => unsubscribe());
    this.onFilter('');
  }

  componentDidMount() {
    this._isMounted = true;
    if (__DEV__) console.log('RegionsView componentDidMount');

    this.getRegionsList();
    this.initReactions();
    this.setHeader();
  }

  initReactions = () => {
    const {sitesStore} = this.props;

    this.reactions = [
      reaction(
        () => sitesStore.isLoading,
        () => this.setHeader()
      ),
    ];
  };

  onAllSitesPress = () => {
    const {sitesStore, navigation} = this.props;
    sitesStore.selectRegion(null);
    sitesStore.selectSite(null);
    navigation.navigate(ROUTERS.VIDEO_SITES);
  };

  setHeader = () => {
    const {sitesStore, navigation, appStore} = this.props;
    const {appearance} = appStore;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          <CMSTouchableIcon
            size={22}
            onPress={this.onAllSitesPress}
            color={theme[appearance].iconColor}
            styles={commonStyles.headerIcon}
            iconCustom="sites"
            disabled={sitesStore.isLoading}
          />
          {searchButton}
        </View>
      ),
    });
  };

  getRegionsList = async () => {
    let res = await this.props.sitesStore.getSiteTree();
    if (!res) {
      this.props.navigation.navigate(ROUTERS.VIDEO_SITES);
    }
  };

  onBack = () => {
    // if (this.state.enableSearchbar) {
    //   this.setState({enableSearchbar: false});
    // }
  };

  onRegionSelected = item => {
    const {sitesStore, navigation} = this.props;
    sitesStore.selectRegion(item);
    if (item.sites.length == 1) {
      sitesStore.selectSite(item.sites[0]);
      if (item.sites[0].dvrs && item.sites[0].dvrs.length == 1) {
        sitesStore.selectDVR(item.sites[0].dvrs[0]);
        navigation.push(ROUTERS.VIDEO_CHANNELS);
      } else {
        navigation.push(ROUTERS.VIDEO_NVRS);
      }
    } else {
      navigation.push(ROUTERS.VIDEO_SITES);
    }
  };

  onFilter = value => {
    const {sitesStore} = this.props;
    sitesStore.setRegionFilter(value);
  };

  renderItem = ({item}) => {
    const {appearance} = this.props.appStore;

    return (
      <View style={{height: itemHeight + 1}}>
        <CMSRipple
          style={[
            styles.itemContainer,
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}
          rippleOpacity={0.8}
          onPress={() => this.onRegionSelected(item)}>
          <Text style={[styles.itemText, theme[appearance].text]}>
            {item.name}
          </Text>
        </CMSRipple>
      </View>
    );
  };

  renderNoData = () => {
    return (
      <View style={[styles.noDataContainer, {height: this.state.listHeight}]}>
        <Image source={No_Data} style={styles.noDataImg}></Image>
        <Text style={styles.noDataTxt}>There is no data.</Text>
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
    const noData = !sitesStore.isLoading && sitesStore.filteredRegions == 0;
    const {appearance} = appStore;

    return (
      <View style={[{flex: 1}, theme[appearance].container]}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={sitesStore.regionFilter}
        />
        <View style={[styles.rowHeader, theme[appearance].container]}>
          <Text style={styles.rowHeaderText}>
            {sitesStore.filteredRegions.length + ' regions'}
          </Text>
        </View>
        <View style={{flex: 1}} onLayout={this.onFlatListLayout}>
          <FlatList
            renderItem={this.renderItem}
            keyExtractor={item => item.key}
            data={this.props.sitesStore.filteredRegions}
            onRefresh={this.getRegionsList}
            refreshing={
              this.props.sitesStore ? this.props.sitesStore.isLoading : false
            }
            ListEmptyComponent={noData && this.renderNoData()}
          />
        </View>
      </View>
    );
  }
}

export default inject(
  'appStore',
  'sitesStore',
  'userStore'
)(observer(RegionsView));
