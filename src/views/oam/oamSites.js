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
} from 'react-native';
import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import InputTextIcon from '../components/controls/InputTextIcon';
import {Comps as CompTxt} from '../../localization/texts';
import Ripple from 'react-native-material-ripple';
import {IconCustom, ListViewHeight} from '../../components/CMSStyleSheet';
import variables from '../../styles/variables';
import ROUTERS from '../../consts/routes';

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
  }

  componentDidMount() {
    __DEV__ && console.log('PVMSitesView componentDidmmount');

    const {sitesStore} = this.props;
    sitesStore.getOAMSites();
  }

  componentWillUnmount() {
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    this.props.sitesStore.onSitesViewExit();
  }

  onSiteSelected = item => {
    const {sitesStore, oamStore, navigation} = this.props;
    sitesStore.selectSite(item.key);
    if (item.dvrs && item.dvrs[0]) {
      oamStore.setTitle(item.name);
      oamStore.setKdvr(item.dvrs[0].kDVR);
      navigation.push(ROUTERS.OAM_DETAIL);
    }
  };

  renderRow = ({item}) => {
    return (
      <Ripple
        rippleOpacity={0.8}
        onPress={() => this.onSiteSelected(item)}
        style={styles.listItemRipple}>
        <View style={styles.siteNameContainer}>
          <IconCustom
            name="sites"
            color={CMSColors.IconButton}
            size={variables.fix_fontSize_Icon}
          />
          <Text style={styles.siteName}>{item.name}</Text>
        </View>
      </Ripple>
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

  render() {
    const {sitesStore} = this.props;
    return (
      <View style={{flex: 1, backgroundColor: CMSColors.White, paddingTop: 16}}>
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
        <FlatList
          style={{flex: 1}}
          renderItem={this.renderRow}
          data={sitesStore.filteredOamSites}
          keyExtractor={item => item.key}
          onRefresh={this.refreshLiveData}
          refreshing={sitesStore.isLoading}
          ListEmptyComponent={null} //noData && this.renderNoData()}
        />
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
});

export default inject('sitesStore', 'oamStore')(observer(OAMSitesView));
