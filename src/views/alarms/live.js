import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  FlatList,
  ActivityIndicator,
  Modal as ModalBase,
  Dimensions,
  BackHandler,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import {inject, observer} from 'mobx-react';
// import Ripple from 'react-native-material-ripple';

import CMSRipple from '../../components/controls/CMSRipple';
import AlarmItem from './alarmItem';
// import InputTextIcon from '../components/controls/InputTextIcon';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';

import {Comps as CompTxt} from '../../localization/texts';
import {AlertType_Support} from '../../consts/misc';
import ROUTERS from '../../consts/routes';
import {No_Data, No_Image} from '../../consts/images';

class AlarmsLiveView extends Component {
  constructor(props) {
    super(props);
    this.state = {height: 0};
    this.searchbarRef = null;
  }

  componentDidMount() {
    __DEV__ && console.log('AlarmsLive componentDidMount');

    this.props.alarmStore.getLiveData(this.buildRequestParams());
    // this.refreshLiveData();
    this.setHeader();
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmsLive componentWillUnmount');
    this.onFilter('');
  }

  setHeader = () => {
    const {navigation} = this.props;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          <CMSTouchableIcon
            size={28}
            onPress={() => navigation.push(ROUTERS.ALARM_SEARCH)}
            color={CMSColors.ColorText}
            styles={commonStyles.headerIcon}
            iconCustom="search_solid_advancedfind"
          />
          {searchButton}
        </View>
      ),
    });
  };

  buildRequestParams = params => {
    return {
      ...(params ?? {}),
      aty: AlertType_Support,
    };
  };

  refreshLiveData = () => {
    const {alarmStore} = this.props;

    alarmStore.getLiveData(this.buildRequestParams());
  };

  onFilter = value => {
    const {alarmStore} = this.props;
    alarmStore.setTextFilter(value);
  };

  onSelectAlarm = alarm => {
    const {alarmStore, navigation} = this.props;

    alarmStore.selectAlarm(alarm);
    navigation.push(ROUTERS.ALARM_DETAIL);
  };

  // onDimensionChange = event => {
  //   const {width, height} = event.window;
  //   this.setState({width: width, height: height});
  // }

  renderAlarmItem = ({item}) => {
    return (
      <CMSRipple onPress={() => this.onSelectAlarm(item)}>
        <AlarmItem data={item} />
      </CMSRipple>
    );
  };

  onFlatListLayout = event => {
    const {width, height} = event.nativeEvent.layout;
    this.setState({
      width,
      height,
    });
  };

  renderNoData = () => {
    return (
      <View style={[styles.noDataContainer, {height: this.state.height}]}>
        <Image source={No_Data} style={styles.noDataImg}></Image>
        <Text style={styles.noDataTxt}>There is no data.</Text>
      </View>
    );
  };

  render() {
    const {alarmStore} = this.props;
    const noData =
      !alarmStore.isLoading && alarmStore.filteredLiveData.length == 0;
    return (
      <View style={{flex: 1, backgroundColor: CMSColors.White}}>
        {/* <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={alarmStore.filterText}
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
          value={alarmStore.filterText}
        />
        <View
          style={{flex: 1, flexDirection: 'column'}}
          onLayout={this.onFlatListLayout}>
          <FlatList
            renderItem={this.renderAlarmItem}
            data={alarmStore.filteredLiveData}
            keyExtractor={item => item.kAlertEvent}
            onRefresh={this.refreshLiveData}
            refreshing={alarmStore.isLoading}
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

export default inject('alarmStore')(observer(AlarmsLiveView));
