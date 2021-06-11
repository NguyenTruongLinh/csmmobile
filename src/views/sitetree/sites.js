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

class SitesView extends Component {
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

    this.getSitesList();
  }

  getSitesList = async () => {
    let res = await this.props.sitesStore.getAllSites();
    if (!res) snackbar.handleGetDataFailed();
  };

  onSiteSelected = item => {
    this.props.sitesStore.selectSite(item);
    // this.props.appStore.naviService.push(ROUTERS.VIDEO_NVRS);
    this.props.navigation.push(ROUTERS.VIDEO_NVRS);
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
            borderColor: CMSColors.borderColorListRow,
          }}
          onPress={() => this.onSiteSelected(item)}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  render() {
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
            {this.props.sitesStore.sitesCount + ' sites'}
          </Text>
        </View>
        <FlatList
          ref={ref => (this.sitesListRef = ref)}
          renderItem={this.renderItem}
          keyExtractor={item => item.key}
          data={this.props.sitesStore.sitesList}
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
