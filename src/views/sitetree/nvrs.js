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

// import HeaderWithSearch from '../../components/containers/HeaderWithSearch';
import InputTextIcon from '../../components/controls/InputTextIcon';
import snackbar from '../../util/snackbar';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {Comps as CompTxt} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

class NVRsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
  }

  componentWillUnmount() {
    __DEV__ && console.log('SitesView componentWillUnmount');
    this._isMounted = false;

    // appStore.enableSearchbar(false);
  }

  componentDidMount() {
    this._isMounted = true;
    if (__DEV__) console.log('SitesView componentDidMount');

    const {sitesStore, navigation} = this.props;
    // navigation.setOptions({
    //   headerTitle: sitesStore.selectedSite
    //     ? sitesStore.selectedSite.name
    //     : 'No site was selected',
    // });
    // this.getSitesList();
  }

  onFilter = value => {
    const {sitesStore} = this.props;
    sitesStore.setDVRFilter(value);
  };

  onNVRSelected = item => {
    this.props.sitesStore.selectDVR(item);
    this.props.navigation.push(ROUTERS.VIDEO_CHANNELS);
    // this.props.appStore.enableSearchbar(false);
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
          onPress={() => this.onNVRSelected(item)}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
        </TouchableOpacity>
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
        <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={sitesStore.dvrFilter}
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
            {sitesStore.selectedSite
              ? sitesStore.selectedSite.dvrsCount + ' NVRs'
              : 0}
          </Text>
        </View>
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
      </View>
    );
  }
}

export default inject(
  // 'appStore',
  'sitesStore',
  'videoStore'
)(observer(NVRsView));
