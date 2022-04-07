import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
// import Ripple from 'react-native-material-ripple';

import CMSRipple from '../../components/controls/CMSRipple';
// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
// import InputTextIcon from '../../components/controls/InputTextIcon';
import snackbar from '../../util/snackbar';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
// import {Comps as CompTxt} from '../../localization/texts';
import ROUTERS from '../../consts/routes';
import NoDataView from '../../components/views/NoData';

class NVRsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.reactions = [];
  }

  componentWillUnmount() {
    __DEV__ && console.log('SitesView componentWillUnmount');
    this._isMounted = false;

    // appStore.enableSearchbar(false);
    this.onFilter('');
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
  }

  componentDidMount() {
    this._isMounted = true;
    const {sitesStore} = this.props;
    if (__DEV__)
      console.log('NVRS componentDidMount: ', sitesStore.selectedSite);

    // navigation.setOptions({
    //   headerTitle: sitesStore.selectedSite
    //     ? sitesStore.selectedSite.name
    //     : 'No site was selected',
    // });
    // this.getSitesList();
    this.setHeader();

    this.initReactions();
  }

  initReactions = () => {
    const {sitesStore, navigation} = this.props;
    this.reactions = [
      reaction(
        () => sitesStore.selectedSite,
        newSite => {
          navigation.setOptions({
            headerTitle: newSite ? newSite.name : '',
          });
        }
      ),
    ];
  };

  setHeader = () => {
    const {sitesStore, navigation} = this.props;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;
    let options = {};

    if (sitesStore.selectedSite != null) {
      options = {
        headerTitle: sitesStore.selectedSite.name || 'Unknown site',
      };
    }
    navigation.setOptions({
      ...options,
      headerRight: () => (
        <View style={commonStyles.headerContainer}>{searchButton}</View>
      ),
    });
  };

  onFilter = value => {
    const {sitesStore} = this.props;
    sitesStore.setDVRFilter(value);
  };

  onNVRSelected = item => {
    const {sitesStore, navigation} = this.props;

    if (sitesStore.selectedDVR) return; // prevent double click
    sitesStore.selectDVR(item.kDVR);
    navigation.push(ROUTERS.VIDEO_CHANNELS);
    // this.props.appStore.enableSearchbar(false);
  };

  renderItem = ({item}) => {
    const itemHeight = Dimensions.get('window').height / 16;
    return (
      <View style={{height: itemHeight + 1}}>
        <CMSRipple
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
          onPress={() => this.onNVRSelected(item)}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
        </CMSRipple>
      </View>
    );
  };

  render() {
    const {/*appStore,*/ sitesStore, navigation} = this.props;
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        {/* <HeaderWithSearch
          title={
            sitesStore.selectedSite
              ? sitesStore.selectedSite.name
              : 'No site was selected'
          }
          showSearchBar={appStore.showSearchBar}
          onChangeSearchText={this.onFilter}
          searchValue={sitesStore.dvrFilter}
          // backButton={false}
          navigator={navigation}
        /> */}
        {/* <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={sitesStore.dvrFilter}
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
          value={sitesStore.dvrFilter}
        />
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
            {sitesStore.filteredDVRs
              ? sitesStore.filteredDVRs.length + ' NVRs'
              : 0}
          </Text>
        </View>
        {sitesStore.filteredDVRs.length == 0 ? (
          <NoDataView isLoading={false} style={{flex: 1}} />
        ) : (
          <FlatList
            ref={ref => (this.nvrsListRef = ref)}
            renderItem={this.renderItem}
            keyExtractor={item => item.kDVR}
            data={sitesStore.filteredDVRs}
            // onRefresh={this.getSitesList}
            // refreshing={
            //   sitesStore ? sitesStore.isLoading : false
            // }
          />
        )}
      </View>
    );
  }
}

export default inject(
  // 'appStore',
  'sitesStore',
  'videoStore'
)(observer(NVRsView));
