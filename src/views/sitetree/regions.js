import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {inject, observer} from 'mobx-react';
// import Ripple from 'react-native-material-ripple';

// import InputTextIcon from '../../components/controls/InputTextIcon';
import CMSRipple from '../../components/controls/CMSRipple';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import snackbar from '../../util/snackbar';

import ROUTERS from '../../consts/routes';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {Comps as CompTxt} from '../../localization/texts';
import {reaction} from 'mobx';
import {No_Data} from '../../consts/images';
import {clientLogID} from '../../stores/user';

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
    const {userStore} = this.props;
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
    const {sitesStore, navigation} = this.props;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          <CMSTouchableIcon
            size={22}
            onPress={this.onAllSitesPress}
            color={CMSColors.IconButton}
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
          rippleOpacity={0.8}
          onPress={() => this.onRegionSelected(item)}>
          <Text style={{fontSize: 16, fontWeight: '500'}}>{item.name}</Text>
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
    const {sitesStore} = this.props;
    const noData = !sitesStore.isLoading && sitesStore.filteredRegions == 0;

    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        {/* <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={sitesStore.siteFilter}
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
          value={sitesStore.regionFilter}
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
            {sitesStore.filteredRegions.length + ' regions'}
          </Text>
        </View>
        <View style={{flex: 1}} onLayout={this.onFlatListLayout}>
          <FlatList
            // ref={ref => (this.sitesListRef = ref)}
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

const styles = StyleSheet.create({
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
});
export default inject(
  'appStore',
  'sitesStore',
  'userStore'
)(observer(RegionsView));
