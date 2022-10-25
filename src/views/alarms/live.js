import React, {Component} from 'react';
import {View, FlatList, ActivityIndicator, Text, Image} from 'react-native';
import {inject, observer} from 'mobx-react';

import CMSRipple from '../../components/controls/CMSRipple';
import AlarmItem from './components/alarmItem';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/liveStyles';

import {AlertType_Support, WIDGET_COUNTS} from '../../consts/misc';
import ROUTERS from '../../consts/routes';
import {No_Data} from '../../consts/images';
import {PAGE_LENGTH} from '../../stores/alarm';
import {clientLogID} from '../../stores/user';

class AlarmsLiveView extends Component {
  constructor(props) {
    super(props);
    this.state = {height: 0};
    this.searchbarRef = null;
  }

  componentDidMount() {
    __DEV__ && console.log('AlarmsLive componentDidMount');

    const {userStore} = this.props;
    userStore.resetWidgetCount(WIDGET_COUNTS.ALARM);
    userStore.setActivites(clientLogID.ALARM);
    this.props.alarmStore.getLiveData(this.buildRequestParams());
    this.setHeader();
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmsLive componentWillUnmount');
    this.onFilter('');
  }

  setHeader = () => {
    const {navigation, appStore} = this.props;
    const {appearance} = appStore;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>
          <CMSTouchableIcon
            size={28}
            onPress={() => navigation.push(ROUTERS.ALARM_SEARCH)}
            color={theme[appearance].iconColor}
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

    alarmStore.selectAlarm(alarm, false);
    navigation.push(ROUTERS.ALARM_DETAIL);
  };

  renderAlarmItem = ({item, index}) => {
    const {alarmStore, appStore} = this.props;
    const {appearance} = appStore;

    return (
      <CMSRipple
        style={theme[appearance].container}
        onPress={() => this.onSelectAlarm(item)}>
        <AlarmItem data={item} />
        {index == alarmStore.liveCurrentPage * PAGE_LENGTH - 1 &&
          index != alarmStore.liveRawAlarms.length - 1 && (
            <ActivityIndicator
              color={CMSColors.SpinnerColor}></ActivityIndicator>
          )}
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
    const {appearance} = this.props.appStore;
    return (
      <View
        style={[
          styles.noDataContainer,
          {height: this.state.height},
          theme[appearance].container,
        ]}>
        <Image source={No_Data} style={styles.noDataImg}></Image>
        <Text style={[styles.noDataTxt, theme[appearance].text]}>
          There is no data.
        </Text>
      </View>
    );
  };

  onLoadMore = pullDistance => {
    const {alarmStore} = this.props;

    // TODO:
    // if (!alarmStore.isLoading) {
    //   this.currentPage++;
    //   alarmStore.alarmStore.getAlarms(this.buildSearchParam(), true);
    // }
    alarmStore.loadMore();
  };

  render() {
    const {alarmStore, appStore} = this.props;
    const noData =
      !alarmStore.isLoading && alarmStore.filteredLiveData.length == 0;
    const {appearance} = appStore;

    return (
      <View style={[styles.container, theme[appearance].container]}>
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
            // keyExtractor={item => item.kAlertEvent}
            onRefresh={this.refreshLiveData}
            refreshing={alarmStore.isLoading}
            ListEmptyComponent={noData && this.renderNoData()}
            onEndReached={this.onLoadMore}
          />
        </View>
      </View>
    );
  }
}

export default inject(
  'alarmStore',
  'userStore',
  'appStore'
)(observer(AlarmsLiveView));
