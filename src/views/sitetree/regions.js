import React, {Component} from 'react';
import {View, FlatList, Text, Dimensions, TouchableOpacity} from 'react-native';
import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';

import InputTextIcon from '../../components/controls/InputTextIcon';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import snackbar from '../../util/snackbar';

import ROUTERS from '../../consts/routes';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {Comps as CompTxt} from '../../localization/texts';
import {reaction} from 'mobx';

class RegionsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.reactions = [];
  }

  componentWillUnmount() {
    __DEV__ && console.log('RegionsView componentWillUnmount');
    this._isMounted = false;

    this.reactions && this.reactions.map(unsubscribe => unsubscribe());
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

  setHeader = () => {
    const {sitesStore, navigation} = this.props;

    navigation.setOptions({
      headerRight: () => (
        <CMSTouchableIcon
          size={22}
          onPress={() => navigation.navigate(ROUTERS.VIDEO_SITES)}
          color={CMSColors.IconButton}
          styles={commonStyles.buttonSearchHeader}
          iconCustom="sites"
          disabled={sitesStore.isLoading}
        />
      ),
    });
  };

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
        <Ripple
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
          rippleOpacity={0.8}
          onPress={() => this.onRegionSelected(item)}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
        </Ripple>
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
