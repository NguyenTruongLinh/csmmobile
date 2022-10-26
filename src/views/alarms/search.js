import React, {Component} from 'react';
import {View, Text, FlatList, Dimensions, Image} from 'react-native';

import {ActivityIndicator} from 'react-native-paper';
import {inject, observer} from 'mobx-react';
import Modal from '../../components/views/CMSModal';
import {DateTime} from 'luxon';

import CMSRipple from '../../components/controls/CMSRipple';
import AlarmItem from './components/alarmItem';
import AlarmFilter from '../../components/views/AlarmFilter';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import Button from '../../components/controls/Button';
import CMSSearchbar from '../../components/containers/CMSSearchbar';
import NoDataView from '../../components/views/NoData';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/searchStyles';

import {Comps as CompTxt} from '../../localization/texts';
import {
  AlertType_Support,
  AlertTypes,
  FilterMore,
  FilterParamNames,
  DateFormat,
} from '../../consts/misc';
import ROUTERS from '../../consts/routes';
import {No_Data} from '../../consts/images';
import {PAGE_LENGTH} from '../../stores/alarm';

class AlarmsSearchView extends Component {
  constructor(props) {
    super(props);
    const {width, height} = Dimensions.get('window');
    const {filterParams} = props.alarmStore;

    this.state = {
      showFilterModal: true, // __DEV__ ? false : true,
      from: filterParams
        ? DateTime.fromFormat(filterParams.sdate, DateFormat.QuerryDateTime)
        : DateTime.now().minus({days: 1}),
      to: filterParams
        ? DateTime.fromFormat(filterParams.edate, DateFormat.QuerryDateTime)
        : DateTime.now().minus({days: 1}),
      params: filterParams ?? {},
      width,
      height,
      listHeight: 0,
    };

    this.searchbarRef = null;
    this.currentPage = 1;
  }

  componentDidMount() {
    __DEV__ && console.log('AlarmsSearch componentDidMount');
    const {sitesStore, alarmStore} = this.props;
    this.setHeader();
    sitesStore.getAllSites();
    if (!alarmStore.vaConfig || alarmStore.vaConfig.length == 0) {
      alarmStore.getVAConfigs();
    }
    if (!alarmStore.rateConfig || alarmStore.rateConfig.length == 0) {
      alarmStore.getConfigs();
    }
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmsSearch componentWillUnmount');
    this.onFilter('');
  }

  setHeader = () => {
    const {navigation} = this.props;
    const searchButton = this.searchbarRef
      ? this.searchbarRef.getSearchButton(() => this.setHeader())
      : null;

    navigation.setOptions({
      headerRight: () => (
        <View style={commonStyles.headerContainer}>{searchButton}</View>
      ),
    });
  };
  showFilter = isShowed => {
    this.setState({showFilterModal: isShowed});
  };

  buildSearchParam = () => {
    let {params} = this.state;
    if (!params || Object.keys(params).length == 0) {
      return {
        sdate: DateTime.now().toFormat('yyyyMMdd000000'),
        edate: DateTime.now().toFormat('yyyyMMdd235959'),
        aty: AlertType_Support,
      };
    } else {
      //return params.aty ? {...params} : {...params, aty: AlertType_Support };
      // __DEV__ && console.log('GOND ALARM params: ', params);
      if (params.vty) {
        let baty;
        if (params.aty) {
          baty = params.aty.includes(AlertTypes.DVR_VA_detection.toString())
            ? params.aty
            : params.aty + ',' + AlertTypes.DVR_VA_detection;
        } else {
          baty = AlertTypes.DVR_VA_detection.toString();
        }
        return {...params, aty: baty};
      } else {
        return params.aty ? {...params} : {...params, aty: AlertType_Support};
      }
    }
  };

  formatTimeParam = (time, type) => {
    let hour = time > 9 ? time : '0' + time;
    return type === 'stime' ? hour + '0000' : hour + '5959';
  };

  onSubmitFilter = isOk => {
    if (isOk) {
      const {from, to, params} = this.state;
      const {alarmStore} = this.props;
      let sTime = '000000';
      let eTime = '235959';
      if (params) {
        const {time} = params;
        sTime = params.time
          ? this.formatTimeParam(time.stime, 'stime')
          : '000000';
        eTime = params.time
          ? this.formatTimeParam(time.etime, 'etime')
          : '235959';
      }

      let newParams = {
        ...params,
        sdate: from.toFormat('yyyyMMdd') + sTime,
        edate: to.toFormat('yyyyMMdd') + eTime,
      };

      __DEV__ && console.log('GOND AlarmFilter onSubmit: ', newParams);
      this.currentPage = 1;
      this.setState(
        {
          params: newParams,
        },
        () => alarmStore.getAlarms(this.buildSearchParam(), true)
      );
    }

    this.showFilter(false);
  };

  refreshData = () => {
    const {alarmStore} = this.props;

    this.currentPage = 1;
    alarmStore.getAlarms(this.buildSearchParam(), true);
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

  onDateChange = ({from, to}) => {
    __DEV__ && console.log('GOND Alarm search onDateChange: ', from, to);
    this.setState({from, to});
  };

  onLayout = event => {
    const {width, height} = event.nativeEvent.layout;
    this.setState({
      width,
      height,
    });
  };

  onAddMoreParams = (data, filterType) => {
    // __DEV__ &&
    //   console.log('GOND Alarm search onAddMoreParams: ', data, filterType);
    const {params} = this.state;
    let newParams;

    switch (filterType) {
      case FilterMore.Status: {
        newParams = {
          ...params,
          sta: data.join(','),
        };
        this.setState({params: newParams});
        break;
      }
      case FilterMore.Sites: {
        newParams = {
          ...params,
          sid: data.join(','),
        };
        this.setState({params: newParams});
        break;
      }
      case FilterMore.Time: {
        if (!params || !params.time) {
          newParams = {
            ...params,
            time: {
              stime: data.type == 'stime' ? data.time : 0,
              etime: data.type == 'etime' ? data.time : 23,
            },
          };
        } else {
          let {time} = params;

          newParams = {
            ...params,
            time: {
              stime: data.type == 'stime' ? data.time : time.stime,
              etime: data.type == 'etime' ? data.time : time.etime,
            },
          };
        }

        __DEV__ &&
          console.log('GOND Alarm search onAddMoreParams result: ', newParams);
        this.setState({params: newParams});
        break;
      }
      case FilterMore.AlertType: {
        newParams = {
          ...params,
          aty: data.join(','),
        };
        this.setState({params: newParams});
        break;
      }
      case FilterMore.Rating: {
        newParams = {
          ...params,
          ara: data.join(','),
        };
        this.setState({params: newParams});
        break;
      }
      case FilterMore.VA: {
        newParams = {
          ...params,
          vty: data.join(','),
        };
        this.setState({params: newParams});
        break;
      }
    }
  };

  onRemoveParam = filter => {
    if (!this.state.params) return;
    let nameP =
      filter < FilterParamNames.length ? FilterParamNames[filter] : '';
    let {params} = this.state;
    if (this.state.params.hasOwnProperty(nameP)) {
      params[nameP] = undefined;
      this.setState({params});
    }
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

  modalHeader = title => {
    const {appearance} = this.props.appStore;

    return (
      <View
        style={[
          styles.modal_header,
          {
            flex: 10,
            justifyContent: 'center',
          },
          theme[appearance].container,
        ]}>
        <Text
          style={[
            styles.modal_title,
            styles.modal_title_search,
            theme[appearance].text,
          ]}>
          {title ?? CompTxt.alarmFilterTitle}
        </Text>
      </View>
    );
  };

  modalFooter = () => {
    const {appearance} = this.props.appStore;
    if (this.props.footercontent) {
      return (
        <View style={styles.modal_footer_Apply}>
          {this.props.footercontent}
        </View>
      );
    }
    return (
      <View
        style={[
          styles.modal_footer_Apply,
          {flex: 15},
          theme[appearance].container,
        ]}>
        <View style={styles.content_button_cancel}>
          <Button
            style={styles.button_cancel}
            caption={CompTxt.cancelButton}
            type="flat"
            enable={true}
            onPress={() => {
              this.onSubmitFilter(false);
            }}
          />
        </View>
        <View style={styles.content_button_apply}>
          <Button
            style={styles.button_apply}
            caption={CompTxt.applyButton}
            captionStyle={{color: CMSColors.White}}
            type="flat"
            enable={true}
            onPress={() => {
              this.onSubmitFilter(true);
            }}
          />
        </View>
      </View>
    );
  };

  modalContent = () => {
    const {alarmStore, sitesStore, appStore} = this.props;
    const {appearance} = appStore;
    const {from, to, params} = this.state;
    __DEV__ && console.log('GOND modalContent =', params);
    return (
      <View style={[{flex: 75}, theme[appearance].container]}>
        <AlarmFilter
          ref={r => (this.filterRef = r)}
          dateFrom={from}
          dateTo={to}
          params={params}
          sites={sitesStore.sitesList}
          alarmConfig={alarmStore.rateConfig}
          alertTypesVA={alarmStore.vaConfig}
          onDateChange={this.onDateChange}
          onAddMoreParams={this.onAddMoreParams}
          onRemoveParam={this.onRemoveParam}
        />
      </View>
    );
  };

  renderFilterModal = () => {
    const {appearance} = this.props.appStore;
    __DEV__ &&
      console.log('GOND renderFilterModal: ', this.state.showFilterModal);
    return (
      <Modal
        isVisible={this.state.showFilterModal}
        onBackdropPress={() => this.showFilter(false)}
        onBackButtonPress={() => this.showFilter(false)}
        backdropOpacity={0.3}
        key="alarmFilterModal"
        name="alarmFilterModal"
        style={styles.filterModalContainer}>
        <View style={[styles.modal_container, theme[appearance].container]}>
          {this.modalHeader()}
          {this.modalContent()}
          {this.modalFooter()}
        </View>
      </Modal>
    );
  };

  renderAlarmItem = ({item, index}) => {
    const {alarmStore} = this.props;
    return (
      <CMSRipple onPress={() => this.onSelectAlarm(item)}>
        <AlarmItem data={item} />
        {index == alarmStore.searchCurrentPage * PAGE_LENGTH - 1 &&
          index != alarmStore.searchRawAlarms.length - 1 && (
            <ActivityIndicator
              color={CMSColors.SpinnerColor}></ActivityIndicator>
          )}
      </CMSRipple>
    );
  };

  renderActionButton() {
    return (
      <View style={commonStyles.floatingActionButton}>
        <CMSTouchableIcon
          iconCustom="search_solid_advancedfind"
          onPress={() => this.showFilter(true)}
          size={28}
          color={CMSColors.White}
        />
      </View>
    );
  }

  onFlatListLayout = event => {
    const {height} = event.nativeEvent.layout;
    this.setState({
      listHeight: height,
    });
  };

  renderNoData = () => <NoDataView style={{height: this.state.listHeight}} />;

  render() {
    const {alarmStore, appStore} = this.props;
    const {appearance} = appStore;
    const actionButton = this.renderActionButton();
    const filterModal = this.renderFilterModal();
    const noData =
      !alarmStore.isLoading && alarmStore.filteredSearchData.length == 0;
    __DEV__ &&
      console.log(
        'GOND renderAlarmSearch filter: ',
        this.state.showFilterModal
      );

    return (
      <View
        style={[{flex: 1}, theme[appearance].container]}
        onLayout={this.onLayout}>
        <CMSSearchbar
          ref={r => (this.searchbarRef = r)}
          onFilter={this.onFilter}
          value={alarmStore.filterText}
        />
        <View style={styles.contentWrapper} onLayout={this.onFlatListLayout}>
          <FlatList
            renderItem={this.renderAlarmItem}
            data={alarmStore.filteredSearchData}
            keyExtractor={item => item.kAlertEvent}
            onRefresh={this.refreshData}
            refreshing={alarmStore.isLoading}
            ListEmptyComponent={noData && this.renderNoData()}
            onEndReached={this.onLoadMore}
          />
        </View>
        {actionButton}
        {filterModal}
      </View>
    );
  }
}

export default inject(
  'alarmStore',
  'sitesStore',
  'appStore'
)(observer(AlarmsSearchView));
