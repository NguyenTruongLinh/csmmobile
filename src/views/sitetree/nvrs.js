import React, {Component} from 'react';
import {View, FlatList, Text, Dimensions} from 'react-native';
import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';

import CMSRipple from '../../components/controls/CMSRipple';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import commonStyles from '../../styles/commons.style';
import theme from '../../styles/appearance';

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

    this.onFilter('');
    this.reactions && this.reactions.forEach(unsubscribe => unsubscribe());
  }

  componentDidMount() {
    this._isMounted = true;
    const {sitesStore} = this.props;
    if (__DEV__)
      console.log('NVRS componentDidMount: ', sitesStore.selectedSite);

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
  };

  renderItem = ({item}) => {
    const {appearance} = this.props.appStore;

    const itemHeight = Dimensions.get('window').height / 16;
    return (
      <View style={{height: itemHeight + 1}}>
        <CMSRipple
          style={[
            {
              height: itemHeight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingLeft: 16,
              borderBottomWidth: 1,
            },
            theme[appearance].container,
            theme[appearance].borderColor,
          ]}
          onPress={() => this.onNVRSelected(item)}>
          <Text
            style={[{fontSize: 16, fontWeight: '500'}, theme[appearance].text]}>
            {item.name}
          </Text>
        </CMSRipple>
      </View>
    );
  };

  render() {
    const {appStore, sitesStore, navigation} = this.props;
    const {appearance} = appStore;

    return (
      <View style={[{flex: 1}, theme[appearance].container]}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={sitesStore.dvrFilter}
        />
        <View
          style={[
            {
              height: 35,
              flexDirection: 'row',
              alignItems: 'center',
            },
            theme[appearance].headerListRow,
          ]}>
          <Text
            style={[
              {
                paddingLeft: 24,
                textAlignVertical: 'center',
              },
              theme[appearance].videoConnectionLittleText,
            ]}>
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
          />
        )}
      </View>
    );
  }
}

export default inject(
  'appStore',
  'sitesStore',
  'videoStore'
)(observer(NVRsView));
