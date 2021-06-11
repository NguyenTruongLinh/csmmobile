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

import snackbar from '../../util/snackbar';

import ROUTERS from '../../consts/routes';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';

class NVRsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
  }

  componentWillUnmount() {
    __DEV__ && console.log('SitesView componentWillUnmount');
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    if (__DEV__) console.log('SitesView componentDidMount');

    const {sitesStore, navigation} = this.props;
    navigation.setOptions({
      headerTitle: sitesStore.selectedSite
        ? sitesStore.selectedSite.name
        : 'No site was selected',
    });
    // this.getSitesList();
  }

  // getSitesList = async () => {
  //   let res = await this.props.sitesStore.getAllSites();
  //   if (!res) snackbar.handleGetDataFailed();
  // };

  onNVRSelected = () => {
    this.props.sitesStore.selectDVR(item);
    this.props.appStore.naviService.push(ROUTERS.VIDEO_CHANNELS);
  };

  renderItem = ({item}) => {
    console.log('GOND render site: ', item.name);
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
            borderColor: CMSColors.borderColorListRow,
          }}
          onPress={this.onSiteSelected}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const {sitesStore} = this.props;
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View
          style={{
            backgroundColor: CMSColors.headerListRow,
            height: 35,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            style={{
              paddingLeft: 24,
              textAlignVertical: 'center',
              color: CMSColors.colorRow_options,
            }}>
            {sitesStore.selectedSite
              ? sitesStore.selectedSite.dvrsCount + ' NVRs'
              : 0}
          </Text>
        </View>
        <FlatList
          ref={ref => (this.nvrsListRef = ref)}
          renderItem={this.renderItem}
          keyExtractor={item => item.key}
          data={sitesStore.selectedSiteDVRs}
          // onRefresh={this.getSitesList}
          // refreshing={
          //   sitesStore ? sitesStore.isLoading : false
          // }
        />
      </View>
    );
  }
}

export default inject('appStore', 'sitesStore')(observer(NVRsView));
