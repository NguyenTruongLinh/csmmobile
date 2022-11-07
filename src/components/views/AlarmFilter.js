import React, {Component} from 'react';
import {Text, View, StyleSheet, ScrollView, FlatList} from 'react-native';

import {inject, observer} from 'mobx-react';
import Modal from 'react-native-modal';

import CMSCalendarRange from './CMSCalendarRange';
import Ripple from 'react-native-material-ripple';

import CMSPanel from '../controls/CMSPanel';
import Button from '../controls/Button';
import CheckList from '../containers/CheckList';
import TimePicker from '../containers/TimePicker';
import CMSTouchableIcon from '../containers/CMSTouchableIcon';
import {IconCustom} from '../CMSStyleSheet';

import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/alarmFilterStyles';
import {DateFormat, FilterMore} from '../../consts/misc';
import AlarmFilterItem from './AlarmFilterItem';

let isFirst;

const Panels = {
  DateSelect: 0,
  FilterMore: 1,
};

class AlarmFilter extends Component {
  constructor(props) {
    super(props);
    const {dateFrom, dateTo} = props;
    isFirst = true;

    let filters = this.convertParamSelected(props);
    __DEV__ && console.log('GOND AlarmFilter initH = ', this.props.initheight);

    this.state = {
      // istest : false,
      reload: false,
      numberSelectStatus: 0,
      sitesData: this.props.sitesData,
      // contentheight: this.props.initheight,
      isSortAZ: true,
      panel: Panels.DateSelect,
      filterMore: filters,
      authmodal: false,
      dateRange: CMSCalendarRange.createDateRange(dateFrom, dateTo),
      lastFrom: null,
      lastTo: null,
    };
  }

  componentDidMount() {
    // if (this.props.Rotatable) {
    //   Dimensions.addEventListener('change', this.onDimensionChange);
    // }
    // this.onDimensionChange({window: Dimensions.get('window')});
  }

  componentWillUnmount() {
    // if (this.props.Rotatable) {
    //   Dimensions.removeEventListener('change', this.onDimensionChange);
    // }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    let {dateFrom, dateTo} = nextProps;
    const {lastFrom, lastTo} = prevState;
    __DEV__ &&
      console.log('GOND AlarmFilter getDerivedStateFromProps: ', nextProps);
    if (lastFrom != dateFrom || lastTo != dateTo)
      return {
        dateRange: CMSCalendarRange.createDateRange(dateFrom, dateTo),
        lastFrom: dateFrom,
        lastTo: dateTo,
      };
    return {};
  }

  convertParamSelected = props => {
    //{sdate, edate, sty, aty, ara,ano, sta, sid, vty, aid, avaid} = params;

    let {params} = props;
    if (!params) return [];
    let filterMore = [];
    let {sdate, edate, sty, aty, ara, ano, sta, sid, vty, aid, avaid, time} =
      props.params;
    //Status
    if (sta) filterMore.push(FilterMore.Status);

    //Sites
    if (sid) filterMore.push(FilterMore.Sites);

    //Time
    if (time) filterMore.push(FilterMore.Time);

    //Alert Type
    if (aty) filterMore.push(FilterMore.AlertType);

    //Rating
    if (ara) filterMore.push(FilterMore.Rating);

    //Video Analytics
    if (vty) filterMore.push(FilterMore.VA);

    return filterMore;
  };

  renderDate = () => {
    const {dateFrom, dateTo, onDateChange} = this.props;

    return (
      <CMSCalendarRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={onDateChange}
      />
    );
  };

  renderFilterMore = () => {
    const hasStatus = this.state.filterMore.includes(FilterMore.Status);
    const hasSites = this.state.filterMore.includes(FilterMore.Sites);
    const hasTime = this.state.filterMore.includes(FilterMore.Time);
    const hasAlertType = this.state.filterMore.includes(FilterMore.AlertType);
    const hasRating = this.state.filterMore.includes(FilterMore.Rating);
    const hasVA = this.state.filterMore.includes(FilterMore.VA);

    const data = [
      {
        id: 1,
        caption: 'Status',
        isActive: hasStatus,
        onPress: () => this.eventAddMoreFilter(FilterMore.Status),
        style: {paddingLeft: 15},
      },
      {
        id: 2,
        caption: 'Site ID',
        isActive: hasSites,
        onPress: () => this.eventAddMoreFilter(FilterMore.Sites),
      },
      {
        id: 3,
        caption: 'Time',
        isActive: hasTime,
        onPress: () => {
          this.eventAddMoreFilter(FilterMore.Time);
          let timeN = {
            type: 'stime',
            time: 0,
          };
          this.props.onAddMoreParams(timeN, FilterMore.Time);
        },
      },
      {
        id: 4,
        caption: 'Alert Type',
        isActive: hasAlertType,
        onPress: () => this.eventAddMoreFilter(FilterMore.AlertType),
      },
      {
        id: 5,
        caption: 'Rating',
        isActive: hasRating,
        onPress: () => this.eventAddMoreFilter(FilterMore.Rating),
      },
      {
        id: 6,
        caption: 'Video Analytics',
        isActive: hasVA,
        onPress: () => this.eventAddMoreFilter(FilterMore.VA),
      },
    ];

    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        style={styles.scrollViewContainer}>
        <View style={styles.contentHeader_FilterMore}>
          {data.map(item => {
            return <AlarmFilterItem key={item.id} data={item} />;
          })}
          <View style={[styles.addMoreButtonContainer, {width: 45}]}></View>
        </View>
      </ScrollView>
    );
  };

  eventAddMoreFilter = filter => {
    if (this.state.filterMore.includes(filter)) {
      let newFilterList = this.state.filterMore.filter(x => x != filter);
      this.props.onRemoveParam(filter);
      this.setState({filterMore: newFilterList});
    } else {
      this.setState({filterMore: [filter, ...this.state.filterMore]});
    }
  };

  onRefresh = () => {
    // setTimeout( () => {
    //   this.setState({loading: true, });
    // }, 1);
  };

  getDataSeleted = filterType => {
    let {params} = this.props;
    if (util.isNullOrUndef(params)) return [];
    let res;
    switch (filterType) {
      case FilterMore.Status: {
        res = params.sta;
        break;
      }
      case FilterMore.Sites: {
        res = params.sid;
        break;
      }
      case FilterMore.Time: {
        // res = params.time;
        break;
      }
      case FilterMore.AlertType: {
        res = params.aty;
        break;
      }
      case FilterMore.Rating: {
        res = params.ara;
        break;
      }
      case FilterMore.VA: {
        res = params.vty;
        break;
      }
    }

    if (util.isNullOrUndef(res) || !res || res == '') return [];
    return res.split(',').map(function (item) {
      return parseInt(item, 10);
    });
  };

  renderCombox = (title, _filterMore, _dataSource) => {
    const {appearance} = this.props.appStore;

    let renderContentCustom = (
      <View style={styles.rowListFilter}>
        <CMSTouchableIcon
          size={24}
          onPress={() => {
            this.eventAddMoreFilter(_filterMore);
          }}
          color={theme[appearance].text.color}
          styles={styles.contentIconRemoveFilter}
          iconCustom="close"
        />
        <Text style={theme[appearance].text}>{title}</Text>
      </View>
    );
    let selected = this.getDataSeleted(_filterMore);
    let content = (
      <CheckList
        key={_filterMore}
        data={_dataSource}
        selected={selected}
        onAddMoreParams={data => {
          this.props.onAddMoreParams(data, _filterMore);
        }}
        style={theme[appearance].headerListRow}
      />
    );

    return (
      <CMSPanel
        renderContentCustom={renderContentCustom}
        style={[styles.rowListFilterContain, theme[appearance].headerListRow]}
        header={selected.length > 0 ? selected.length + ' Selected' : 'Any'}
        headerStyle={theme[appearance].text}>
        {content}
      </CMSPanel>
    );
  };

  setParamStartTime = time => {
    __DEV__ && console.log('GOND AlarmFilter setParamStartTime: ', time);
    let timeN = {
      type: 'stime',
      time: time,
    };
    this.props.onAddMoreParams(timeN, FilterMore.Time);
  };

  setParamEndTime = time => {
    __DEV__ && console.log('GOND AlarmFilter setParamEndTime: ', time);
    let timeN = {
      type: 'etime',
      time: time,
    };
    this.props.onAddMoreParams(timeN, FilterMore.Time);
    // this.setState({dataSource: this.state.filterMore});
  };

  getTimeData = type => {
    let {params} = this.props;
    __DEV__ && console.log('GOND AlarmFilter getTimeData 0: ', params);
    if (util.isNullOrUndef(params)) return type == 'stime' ? 0 : 23;
    let {time} = params;
    if (util.isNullOrUndef(time)) return type == 'stime' ? 0 : 23;
    let {stime, etime} = time;
    __DEV__ && console.log('GOND AlarmFilter getTimeData: ', params, time);
    return type == 'stime' ? stime : etime;
  };

  renderTimePicker = (title, _filterMore) => {
    let stime = this.getTimeData('stime');
    let etime = this.getTimeData('etime');
    const {dateFrom, dateTo, appStore} = this.props;
    const {appearance} = appStore;

    __DEV__ && console.log('GOND AlarmFilter renderTimePicker: ', stime, etime);

    let renderContentCustom = (
      <View style={styles.rowListFilter}>
        <CMSTouchableIcon
          size={24}
          onPress={() => {
            this.eventAddMoreFilter(_filterMore);
          }}
          color={theme[appearance].text.color}
          styles={styles.contentIconRemoveFilter}
          iconCustom="close"
        />
        <Text style={theme[appearance].text}>{title}</Text>
      </View>
    );

    let content = (
      <View style={styles.modalcontainer_TimePicker}>
        <View style={styles.timePickerContainer}>
          <TimePicker
            type="start"
            setParamTime={this.setParamStartTime}
            selected={stime}
          />
        </View>
        <View
          style={[styles.arrowIconContainer, theme[appearance].headerListRow]}>
          <IconCustom
            name="arrow-to"
            size={30}
            color={CMSColors.SecondaryText}
          />
        </View>
        <View style={styles.timePickerContainer}>
          <TimePicker
            type="end"
            setParamTime={this.setParamEndTime}
            selected={etime}
          />
        </View>
      </View>
    );

    let header = (
      <View style={styles.timePickerHeaderContainer}>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, theme[appearance].text]}>
            {stime + ':00:00'}
          </Text>
          <Text style={[styles.dateText, theme[appearance].text]}>
            {dateFrom.toFormat(DateFormat.POS_Filter_Date)}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <IconCustom
            name="arrow-to"
            size={20}
            color={CMSColors.SecondaryText}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, theme[appearance].text]}>
            {etime + ':59:59'}
          </Text>
          <Text style={[styles.dateText, theme[appearance].text]}>
            {dateTo.toFormat(DateFormat.POS_Filter_Date)}
          </Text>
        </View>
      </View>
    );

    let modal = (
      <Modal
        visible={this.state.authmodal}
        onBackdropPress={() => {
          this.setState({authmodal: false});
        }}
        style={styles.modalTimePickerContainer}>
        <View style={[styles.modalcontainer]}>{content}</View>
      </Modal>
    );

    return (
      <View
        style={[
          styles.rowListFilterTimeContain,
          theme[appearance].headerListRow,
        ]}>
        {renderContentCustom}
        <Ripple
          style={styles.justifyCenter}
          onPress={() => {
            this.setState({
              authmodal: true,
            });
          }}>
          {header}
        </Ripple>
        {modal}
      </View>
    );
  };

  renderRow = ({item}) => {
    let cmp = <View />;
    if (util.isNullOrUndef(item)) return cmp;

    switch (item) {
      case FilterMore.Status: {
        let ds_Status = [
          {id: 1, name: 'Process'},
          {id: 2, name: 'Pending'},
        ];
        cmp = this.renderCombox('Status', item, ds_Status);
        break;
      }
      case FilterMore.Sites: {
        let {sites} = this.props;
        if (util.isNullOrUndef(sites)) break;

        let ds_Sites = sites.map(x => {
          return {id: x.key, name: x.name};
        });
        cmp = this.renderCombox('Sites', item, ds_Sites);
        break;
      }
      case FilterMore.Time: {
        let fromTime = '';
        let toTime = '';
        cmp = this.renderTimePicker('Time', item, fromTime, toTime);
        break;
      }
      case FilterMore.AlertType: {
        let ds_AlertType = [
          {id: 9, name: 'Sensor triggered'},
          {id: 36, name: 'VA detection'},
          {id: 113, name: 'Temperature Out Of Range'},
          {id: 114, name: 'Not Wearing Mask'},
          {id: 115, name: 'Increasing Temperature Rate By Date'},
          {id: 116, name: 'Social Distance'},
        ];
        cmp = this.renderCombox('Alert Type', item, ds_AlertType);
        break;
      }
      case FilterMore.Rating: {
        let {alarmConfig} = this.props;
        if (util.isNullOrUndef(alarmConfig)) break;
        __DEV__ &&
          console.log('GOND FilterMore rating alarmConfig = ', alarmConfig);

        let ds_Rating = alarmConfig.map(x => ({
          id: x.rateId,
          name: x.rateName,
        }));
        cmp = this.renderCombox('Rating', item, ds_Rating);
        break;
      }
      case FilterMore.VA: {
        let {alertTypesVA} = this.props;
        if (util.isNullOrUndef(alertTypesVA)) break;
        __DEV__ &&
          console.log('GOND FilterMore VA alertTypesVA = ', alertTypesVA, item);
        let ds_Video_Analytics = alertTypesVA
          .filter(alert => util.isAlertTypeVASupported(alert.id))
          .map(x => {
            return {
              id: x.id,
              name:
                x.id == 8 ? 'Ai Detection' : util.getAlertTypeVA(x.id, x.name),
            };
          });
        cmp = this.renderCombox('Video Analytics', item, ds_Video_Analytics);
        break;
      }
    }

    return cmp;
  };

  renderSelectedDates = () => {
    let {dateFrom, dateTo} = this.props;

    return {
      from: dateFrom.toFormat(DateFormat.POS_Filter_Date),
      to: dateTo.toFormat(DateFormat.POS_Filter_Date),
    };
  };

  renderListFilter = () => {
    __DEV__ && console.log('GOND AlarmFilter renderListFilter: ');
    if (!this.state.filterMore || this.state.filterMore.length == 0) return;

    return (
      <View style={styles.container}>
        <FlatList
          data={this.state.filterMore}
          renderItem={this.renderRow}
          keyExtractor={item => 'k' + item}
        />
      </View>
    );
  };

  render() {
    const {appearance} = this.props.appStore;
    __DEV__ && console.log('GOND AlarmFilter rerender: ', this.props);
    let contentHeader = (
      <View style={[styles.contentHeader, theme[appearance].modalContainer]}>
        <View style={styles.dateTab}>
          <Button
            style={[
              styles.button_DateSelect,
              this.state.panel == Panels.DateSelect
                ? {}
                : theme[appearance].alarmSearchButtonFilter,
            ]}
            type="primary"
            enable={true}
            onPress={() => {
              isFirst = true;
              this.setState({panel: Panels.DateSelect});
            }}>
            <Text style={[styles.buttonHeaderText, theme[appearance].text]}>
              {this.renderSelectedDates().from}
            </Text>
            <IconCustom
              name="arrow-to"
              size={20}
              color={theme[appearance].text.color}
              style={{marginHorizontal: 5}}
            />
            <Text style={[styles.buttonHeaderText, theme[appearance].text]}>
              {this.renderSelectedDates().to}
            </Text>
          </Button>
        </View>
        <View style={styles.addMoreButtonContainer}>
          <Button
            style={[
              styles.button_FilterMore,
              theme[appearance].modalContainer,
              this.state.panel == Panels.FilterMore
                ? styles.button_FilterMore_Select
                : null,
            ]}
            iconCustom="i-add"
            iconSize={24}
            iconStyleEnable={{
              textAlign: 'center',
              color:
                this.state.panel == Panels.FilterMore
                  ? CMSColors.White
                  : CMSColors.PrimaryActive,
              paddingLeft: 4,
            }}
            type={'flat'}
            enable={true}
            onPress={() => {
              isFirst = true;
              this.setState({panel: Panels.FilterMore});
            }}
          />
        </View>
      </View>
    );

    let contentBody =
      this.state.panel == Panels.DateSelect ? (
        <View style={[styles.contentBody, theme[appearance].modalContainer]}>
          {this.renderDate()}
        </View>
      ) : (
        <View style={[styles.contentBody, theme[appearance].modalContainer]}>
          {this.renderFilterMore()}
          {this.renderListFilter()}
        </View>
      );

    return (
      <View style={[styles.container, theme[appearance].modalContainer]}>
        {contentHeader}
        {contentBody}
      </View>
    );
  }
}

export default inject('appStore')(observer(AlarmFilter));
