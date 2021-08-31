import React, {Component} from 'react';
import {View, FlatList, Text, Dimensions, TouchableOpacity} from 'react-native';
import {inject, observer} from 'mobx-react';

import InputTextIcon from '../../components/controls/InputTextIcon';

import snackbar from '../../util/snackbar';

import ROUTERS from '../../consts/routes';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {Comps as CompTxt} from '../../localization/texts';

class RegionsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
  }

  componentWillUnmount() {
    __DEV__ && console.log('RegionsView componentWillUnmount');
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
    if (__DEV__) console.log('RegionsView componentDidMount');

    this.getRegionsList();
  }

  getRegionsList = async () => {
    let res = await this.props.sitesStore.getSiteTree();
    if (!res) {
      // snackbar.handleRequestFailed();
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
    this.props.appStore.naviService.push(ROUTERS.VIDEO_SITES);
    // if (item.dvrs.length == 1) {
    //   sitesStore.selectDVR(item.dvrs[0]);
    //   navigation.push(ROUTERS.VIDEO_CHANNELS);
    // } else {
    //   navigation.push(ROUTERS.VIDEO_NVRS);
    // }
    // // this.props.appStore.enableSearchbar(false);
  };

  onFilter = value => {
    const {sitesStore} = this.props;
    sitesStore.setRegionFilter(value);
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
          onPress={() => this.onRegionSelected(item)}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    const {sitesStore} = this.props;

    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
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
            {sitesStore.filteredRegions.length + ' regions'}
          </Text>
        </View>
        <FlatList
          // ref={ref => (this.sitesListRef = ref)}
          renderItem={this.renderItem}
          keyExtractor={item => item.key}
          data={this.props.sitesStore.filteredRegions}
          onRefresh={this.getRegionsList}
          refreshing={
            this.props.sitesStore ? this.props.sitesStore.isLoading : false
          }
        />
      </View>
    );
  }
}

export default inject('appStore', 'sitesStore')(observer(RegionsView));
