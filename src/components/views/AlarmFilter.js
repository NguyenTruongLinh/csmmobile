import React, {Component, PropTypes} from 'react';
import {
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Keyboard,
  FlatList,
  Modal,
} from 'react-native';

import {inject, observer} from 'mobx-react';

// import {CalendarList} from 'react-native-calendars';
import CMSCalendarRange from './CMSCalendarRange';
import {DateTime} from 'luxon';
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
import {DateFormat, AlertTypeVA, FilterMore} from '../../consts/misc';

let isFirst;

const Panels = {
  DateSelect: 0,
  FilterMore: 1,
};
const session_header_height = 48;

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

  /**
   *
   * @param {DateTime} from
   * @param {DateTime} to
   */
  /*
  static createDateRange(from, to) {
    const dateRangeObj = {};
    const selectedStyle = {
      color: CMSColors.PrimaryActive,
      textColor: CMSColors.White,
    };
    if (from.startOf('day').toSeconds() == to.startOf('day').toSeconds()) {
      dateRangeObj[from.toFormat(DateFormat.CalendarDate)] = {
        ...selectedStyle,
        startingDay: true,
        endingDay: true,
      };
    } else {
      const [dateFrom, dateTo] =
        from.startOf('day').toSeconds() < to.startOf('day').toSeconds()
          ? [from.startOf('day'), to.startOf('day')]
          : [to.startOf('day'), from.startOf('day')];
      dateRangeObj[dateFrom.toFormat(DateFormat.CalendarDate)] = {
        ...selectedStyle,
        startingDay: true,
      };
      dateRangeObj[dateTo.toFormat(DateFormat.CalendarDate)] = {
        ...selectedStyle,
        endingDay: true,
      };

      let current = dateFrom.plus({days: 1});
      while (current < dateTo) {
        dateRangeObj[current.toFormat(DateFormat.CalendarDate)] = {
          ...selectedStyle,
          marked: true,
          selected: true,
        };
        current = current.plus({days: 1});
      }
    }
    return dateRangeObj;
  }
  */

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
  // shouldComponentUpdate = (nextProps, nextState) => {
  //   __DEV__ && console.log('GOND AlarmFilter getDerivedStateFromProps: ');
  //   return true;
  // };

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

    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        style={{
          maxHeight: 60,
        }}>
        <View style={styles.contentHeader_FilterMore}>
          <View style={[styles.addMoreButtonContainer, {paddingLeft: 15}]}>
            <Button
              style={[
                styles.button_FilterMore_Add,
                hasStatus ? '' : styles.button_FilterMore_Add_None,
              ]}
              caption="Status"
              iconCustom="i-add"
              iconSize={18}
              type={hasStatus ? 'primary' : 'flat'}
              enable={true}
              onPress={() => {
                this.eventAddMoreFilter(FilterMore.Status);
              }}
            />
          </View>
          <View style={styles.addMoreButtonContainer}>
            <Button
              style={[
                styles.button_FilterMore_Add,
                hasSites ? '' : styles.button_FilterMore_Add_None,
              ]}
              caption="Site ID"
              iconCustom="i-add"
              iconSize={18}
              type={hasSites ? 'primary' : 'flat'}
              enable={true}
              onPress={() => {
                this.eventAddMoreFilter(FilterMore.Sites);
              }}
            />
          </View>
          <View style={styles.addMoreButtonContainer}>
            <Button
              style={[
                styles.button_FilterMore_Add,
                hasTime ? '' : styles.button_FilterMore_Add_None,
              ]}
              caption="Time"
              iconCustom="i-add"
              iconSize={18}
              type={hasTime ? 'primary' : 'flat'}
              enable={true}
              onPress={() => {
                this.eventAddMoreFilter(FilterMore.Time);
                let timeN = {
                  type: 'stime',
                  time: 0,
                };
                this.props.onAddMoreParams(timeN, FilterMore.Time);
              }}
            />
          </View>
          <View style={styles.addMoreButtonContainer}>
            <Button
              style={[
                styles.button_FilterMore_Add,
                hasAlertType ? '' : styles.button_FilterMore_Add_None,
              ]}
              caption="Alert Type"
              iconCustom="i-add"
              iconSize={18}
              type={hasAlertType ? 'primary' : 'flat'}
              enable={true}
              onPress={() => {
                this.eventAddMoreFilter(FilterMore.AlertType);
              }}
            />
          </View>
          <View style={styles.addMoreButtonContainer}>
            <Button
              style={[
                styles.button_FilterMore_Add,
                hasRating ? '' : styles.button_FilterMore_Add_None,
              ]}
              caption="Rating"
              iconCustom="i-add"
              iconSize={18}
              type={hasRating ? 'primary' : 'flat'}
              enable={true}
              onPress={() => {
                this.eventAddMoreFilter(FilterMore.Rating);
              }}
            />
          </View>
          <View style={styles.addMoreButtonContainer}>
            <Button
              style={[
                styles.button_FilterMore_Add,
                hasVA ? '' : styles.button_FilterMore_Add_None,
              ]}
              caption="Video Analytics"
              iconCustom="i-add"
              iconSize={18}
              type={hasVA ? 'primary' : 'flat'}
              enable={true}
              onPress={() => {
                this.eventAddMoreFilter(FilterMore.VA);
              }}
            />
          </View>
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
    let renderContentCustom = (
      <View style={styles.rowListFilter}>
        <CMSTouchableIcon
          size={24}
          onPress={() => {
            this.eventAddMoreFilter(_filterMore);
          }}
          color={CMSColors.PrimaryText}
          styles={styles.contentIconRemoveFilter}
          iconCustom="close"
        />
        <Text style={{color: CMSColors.PrimaryText}}>{title}</Text>
      </View>
    );
    let selected = this.getDataSeleted(_filterMore);
    let content = (
      <CheckList
        key={_filterMore}
        data={_dataSource}
        selected={selected}
        onAddMoreParams={data => {
          // this.setState({dataSource: this.state.filterMore});
          this.props.onAddMoreParams(data, _filterMore);
        }}
      />
    );

    return (
      <CMSPanel
        renderContentCustom={renderContentCustom}
        style={styles.rowListFilterContain}
        header={selected.length > 0 ? selected.length + ' Selected' : 'Any'}>
        {content}
      </CMSPanel>
    );
  };

  //   renderTimePickerModal = ()=>
  //  {
  //     let {authmodal} = this.state;
  //     return(

  //   );
  //   }

  setParamStartTime = time => {
    __DEV__ && console.log('GOND AlarmFilter setParamStartTime: ', time);
    let timeN = {
      type: 'stime',
      time: time,
    };
    this.props.onAddMoreParams(timeN, FilterMore.Time);
    // this.setState({dataSource: this.state.filterMore});
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
    const {dateFrom, dateTo} = this.props;
    __DEV__ && console.log('GOND AlarmFilter renderTimePicker: ', stime, etime);
    let renderContentCustom = (
      <View style={styles.rowListFilter}>
        <CMSTouchableIcon
          size={24}
          onPress={() => {
            this.eventAddMoreFilter(_filterMore);
          }}
          color={CMSColors.PrimaryText}
          styles={styles.contentIconRemoveFilter}
          iconCustom="close"
        />
        <Text style={{color: CMSColors.PrimaryText}}>{title}</Text>
      </View>
    );

    let content = (
      <View style={styles.modalcontainer_TimePicker}>
        <View style={{flex: 1, height: 150}}>
          <TimePicker
            type="start"
            setParamTime={this.setParamStartTime}
            selected={stime}
          />
        </View>
        <View
          style={{
            marginTop: 43,
            justifyContent: 'center',
          }}>
          <IconCustom
            name="arrow-to"
            size={30}
            color={CMSColors.SecondaryText}
          />
        </View>
        <View style={{flex: 1, height: 150}}>
          <TimePicker
            type="end"
            setParamTime={this.setParamEndTime}
            selected={etime}
          />
        </View>
      </View>
    );

    let header = (
      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{stime + ':00:00'}</Text>
          <Text style={styles.dateText}>
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
          <Text style={styles.timeText}>{etime + ':59:59'}</Text>
          <Text style={styles.dateText}>
            {dateTo.toFormat(DateFormat.POS_Filter_Date)}
          </Text>
        </View>
      </View>
    );

    let modal = (
      <Modal
        animationType={'slide'}
        transparent={true}
        isDisabled={false}
        backdrop={true}
        coverScreen={true}
        visible={this.state.authmodal}
        onRequestClose={() => {
          this.setState({authmodal: false}, () => this.forceUpdate());
        }}>
        <View opacity={1} style={[styles.modalcontainer]}>
          <TouchableOpacity
            style={{flex: 1}}
            activeOpacity={1}
            onPress={() => {
              this.setState({authmodal: false});
            }}
          />

          {content}
          <TouchableOpacity
            style={{flex: 1}}
            activeOpacity={1}
            onPress={() => {
              this.setState({authmodal: false});
            }}
          />
        </View>
      </Modal>
    );

    return (
      <View style={styles.rowListFilterTimeContain}>
        {renderContentCustom}
        <Ripple
          style={{justifyContent: 'center'}}
          onPress={() => {
            this.setState({
              authmodal: true,
              // dataSource: this.state.filterMore,
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
        // __DEV__ && console.log('GOND AlarmFilter sites: ', sites);
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
        //getAlertTypeVA
        let ds_Video_Analytics = alertTypesVA
          .filter(
            // i => i.id != AlertTypeVA.Unknown && i.id != AlertTypeVA.ManyHuman
            alert => util.isAlertTypeVASupported(alert.id)
          )
          .map(x => {
            return {
              id: x.id,
              name:
                x.id == 8 ? 'Ai Detection' : util.getAlertTypeVA(x.id, x.name),
            };
          });
        // __DEV__ &&
        //   console.log('GOND FilterMore VA build data = ', ds_Video_Analytics);
        //let ds_Video_Analytics = alertTypesVA;
        cmp = this.renderCombox('Video Analytics', item, ds_Video_Analytics);
        break;
      }
    }

    return cmp;
  };

  renderSelectedDates = () => {
    let {dateFrom, dateTo} = this.props;
    __DEV__ && console.log('GOND renderSelectedDates ', dateFrom, dateTo);
    return (
      dateFrom.toFormat(DateFormat.POS_Filter_Date) +
      ' -> ' +
      dateTo.toFormat(DateFormat.POS_Filter_Date)
    );
  };

  renderListFilter = () => {
    __DEV__ && console.log('GOND AlarmFilter renderListFilter: ');
    if (!this.state.filterMore || this.state.filterMore.length == 0) return;

    return (
      <View style={{flex: 1}}>
        <FlatList
          data={this.state.filterMore} // {this.state.dataSource}
          renderItem={this.renderRow}
          // onRefresh={this.onRefresh}
          keyExtractor={item => 'k' + item}
        />
      </View>
    );
  };

  render() {
    const {appearance} = this.props.appStore;
    __DEV__ && console.log('GOND AlarmFilter rerender: ', this.props);
    let contentHeader = (
      <View style={[styles.contentHeader, theme[appearance].container]}>
        <View style={styles.dateTab}>
          <Button
            style={[
              styles.button_DateSelect,
              this.state.panel == Panels.DateSelect
                ? {}
                : styles.button_DateNotSelect,
            ]}
            caption={this.renderSelectedDates()}
            captionStyle={{
              color:
                this.state.panel == Panels.DateSelect
                  ? CMSColors.White
                  : CMSColors.ColorText,
            }}
            type={this.state.panel == Panels.DateSelect ? 'primary' : 'flat'}
            enable={true}
            onPress={() => {
              isFirst = true;
              this.setState({panel: Panels.DateSelect});
            }}
          />
        </View>
        <View style={styles.addMoreButtonContainer}>
          <Button
            style={[
              styles.button_FilterMore,
              this.state.panel == Panels.FilterMore
                ? {color: CMSColors.White}
                : styles.button_FilterMore_None,
            ]}
            // captionStyle={{
            //   fontSize: 28,
            //   textAlignVertical: 'center',
            //   textAlign: 'center',
            //   includeFontPadding: false,
            //   color:
            //     this.state.panel == Panels.FilterMore
            //       ? CMSColors.White
            //       : CMSColors.PrimaryActive,
            // }}
            // captionCustom="+"
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

    // console.log('GOND render AlarmFilter, content heitght = ', this.state.contentheight)

    let contentBody =
      this.state.panel == Panels.DateSelect ? (
        <View
          style={[
            styles.contentBody,
            {
              /*this.state.contentheight*/
            },
          ]}>
          {this.renderDate()}
        </View>
      ) : (
        <View style={[styles.contentBody /*, {paddingBottom: 48}*/]}>
          {this.renderFilterMore()}
          {this.renderListFilter()}
        </View>
      );

    return (
      <View style={{flex: 1}}>
        {/* <Accordion
            ref="collapsible"
            key='1'
            activeSections={[0]}
            sections={SECTIONS}
            renderHeader={this._renderHeader.bind(this)}
            renderContent={this._renderContent.bind(this)} /> */}

        {contentHeader}
        {contentBody}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  contentHeader: {
    flex: 15,
    paddingLeft: 10,
    height: 45,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: CMSColors.White,
    // ...Platform.select({
    //   ios: {
    //     shadowOpacity: 0.3,
    //     shadowRadius: 3,
    //     shadowOffset: {
    //       height: 0,
    //       width: 0,
    //     },
    //   },
    //   android: {
    //     elevation: 1,
    //   },
    // }),
  },
  dateTab: {
    justifyContent: 'center',
    padding: 5,
  },
  button_DateSelect: {
    height: 32,
    minWidth: 230,
  },
  addMoreButtonContainer: {
    justifyContent: 'center',
    // padding: 5,
  },
  button_FilterMore: {
    height: 36,
    width: 36,
    backgroundColor: CMSColors.PrimaryActive,
  },
  button_FilterMore_None: {
    // backgroundColor: CMSColors.White_Smoke,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CMSColors.PrimaryActive,
    backgroundColor: CMSColors.White,
    // width: 32,
  },
  button_DateNotSelect: {
    // backgroundColor: CMSColors.White_Smoke,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CMSColors.DividerColor24_HEX,
    // width: 32,
  },
  button_FilterMore_Add: {
    height: 36,
    minWidth: 36,
    marginRight: 5,
    padding: 5,
  },

  button_FilterMore_Add_None: {
    backgroundColor: CMSColors.DividerColor24_HEX, // CMSColors.White,
  },

  contentBody: {
    flex: 85,
    backgroundColor: CMSColors.White, // CMSColors.DividerColor24_HEX,
  },

  contentHeader_FilterMore: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: CMSColors.transparent,
  },
  rowListFilterContain: {
    backgroundColor: CMSColors.White,
    marginTop: 6,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    // borderColor: 'red',
    // borderWidth: 1,
    backgroundColor: CMSColors.FilterRowBg,
  },
  rowListFilterTimeContain: {
    backgroundColor: CMSColors.White,
    marginTop: 6,
    // paddingLeft: 12,
    // paddingRight: 12,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.FilterRowBg,
  },
  rowListFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // backgroundColor: CMSColors.White,
    //flex: 1,
    height: 48,
  },
  contentIconRemoveFilter: {
    //paddingLeft: 6,
    //paddingTop: 6,
    paddingRight: 12,
  },
  modalcontainer: {
    flex: 1,
    backgroundColor: CMSColors.ModalTransparent,
    //justifyContent: 'center'
    //alignItems: 'center,
    flexDirection: 'column',
  },
  modalcontainer_TimePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.White,
    // marginLeft: 15,
    // marginRight: 15,
    marginHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  timeContainer: {
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
    flexDirection: 'column',
  },
  timeText: {color: CMSColors.PrimaryText, fontWeight: 'bold'},
  dateText: {color: CMSColors.SecondaryText, fontSize: 12},
});

export default inject('appStore')(observer(AlarmFilter));
