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

// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import InputTextIcon from '../../components/controls/InputTextIcon';
import BackButton from '../../components/controls/BackButton';

import snackbar from '../../util/snackbar';

import ROUTERS from '../../consts/routes';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {Comps as CompTxt} from '../../localization/texts';

class SitesView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;

    // this.state = {
    //   enableSearchbar: false,
    // };
  }

  componentWillUnmount() {
    __DEV__ && console.log('SitesView componentWillUnmount');
    this._isMounted = false;
    this.props.sitesStore.setSiteFilter('');
    // BackHandler.removeEventListener('hardwareBackPress', this.onBack);
  }

  componentDidMount() {
    this._isMounted = true;
    if (__DEV__) console.log('SitesView componentDidMount');

    // BackHandler.addEventListener('hardwareBackPress', this.onBack);
    // const backEventHandler = e => {
    //   console.log('GOND navigation event: ', e);
    //   if (this.state.enableSearchbar && typeof e.preventDefault == 'function') {
    //     this.setState({enableSearchbar: false});
    //     e.preventDefault();
    //   }
    // };
    if (!this.props.sitesStore.selectedRegion) {
      this.getSitesList();
      this.props.navigation.setOptions({
        headerLeft: () => null,
      });
    }
  }

  getSitesList = async () => {
    let res = await this.props.sitesStore.getAllSites();
    if (!res) snackbar.handleRequestFailed();
  };

  // onBack = () => {
  //   if (this.state.enableSearchbar) {
  //     this.setState({enableSearchbar: false});
  //   }
  // };

  onSiteSelected = item => {
    const {sitesStore, navigation} = this.props;
    sitesStore.selectSite(item);
    // this.props.appStore.naviService.push(ROUTERS.VIDEO_NVRS);
    if (item.dvrs.length == 1) {
      if (sitesStore.selectedDVR) return; // prevent double click
      sitesStore.selectDVR(item.dvrs[0]);
      navigation.push(ROUTERS.VIDEO_CHANNELS);
    } else {
      navigation.push(ROUTERS.VIDEO_NVRS);
    }
    // this.props.appStore.enableSearchbar(false);
  };

  onFilter = value => {
    const {sitesStore} = this.props;
    sitesStore.setSiteFilter(value);
  };

  renderItem = ({item}) => {
    const itemHeight = Dimensions.get('window').height / 16;
    return (
      <View style={{height: itemHeight + 1}}>
        <TouchableOpacity
          style={{
            height: itemHeight,
            backgroundColor: CMSColors.White,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: 16,
            borderBottomWidth: variables.borderWidthRow,
            borderColor: CMSColors.BorderColorListRow,
          }}
          onPress={() => this.onSiteSelected(item)}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const {appStore, sitesStore, navigation} = this.props;

    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        {/* <HeaderWithSearch
          title="All Sites"
          showSearchBar={appStore.showSearchBar}
          onChangeSearchText={this.onFilter}
          searchValue={sitesStore.siteFilter}
          // backButton={false}
          navigator={navigation}
        /> */}
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
          keyExtractor={item => item.key}
          data={sitesStore.filteredSites}
          onRefresh={this.getSitesList}
          refreshing={
            this.props.sitesStore ? this.props.sitesStore.isLoading : false
          }
        />
      </View>
    );
  }
}

export default inject('appStore', 'sitesStore')(observer(SitesView));
