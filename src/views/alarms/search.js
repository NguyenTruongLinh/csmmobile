import React, {Component} from 'react';
import {
  View,
  Text,
  FlatList,
  Modal as ModalBase,
  Platform,
  Dimensions,
  StyleSheet,
  Image,
} from 'react-native';
import {inject, observer} from 'mobx-react';
// import Ripple from 'react-native-material-ripple';
import Modal from 'react-native-modal';
import {DateTime} from 'luxon';

import CMSRipple from '../../components/controls/CMSRipple';
import AlarmItem from './alarmItem';
import AlarmFilter from '../../components/views/AlarmFilter';
import InputTextIcon from '../../components/controls/InputTextIcon';
import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
// import {IconCustom} from '../../components/CMSStyleSheet';
import Button from '../../components/controls/Button';
import CMSSearchbar from '../../components/containers/CMSSearchbar';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';

import {Comps as CompTxt} from '../../localization/texts';
import {
  AlertType_Support,
  AlertTypes,
  FilterMore,
  FilterParamNames,
  DateFormat,
} from '../../consts/misc';
import ROUTERS from '../../consts/routes';
import variables from '../../styles/variables';
import {No_Data} from '../../consts/images';

const header_height = 50;
const footer_height = 50;

class AlarmsSearchView extends Component {
  //{sdate, edate, sty, aty, ara,ano, sta, sid, vty, aid, avaid} = params;
  constructor(props) {
    super(props);
    const {width, height} = Dimensions.get('window');
    const {filterParams} = props.alarmStore;

    this.state = {
      showFilterModal: true,
      from: filterParams
        ? DateTime.fromFormat(filterParams.sdate, DateFormat.QuerryDateTime)
        : DateTime.now().minus({days: 1}),
      to: filterParams
        ? DateTime.fromFormat(filterParams.edate, DateFormat.QuerryDateTime)
        : DateTime.now().minus({days: 1}),
      // selectedSites: [], // props.selectedsite? props.selectedsite: [],
      params: filterParams ?? {},
      width,
      height,
      listHeight: 0,
    };

    this.searchbarRef = null;
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
      this.setState(
        {
          params: newParams,
        },
        () => alarmStore.getAlarms(this.buildSearchParam(), true)
      );
    }

    this.setState({showFilterModal: false});
  };

  refreshData = () => {
    const {alarmStore} = this.props;

    alarmStore.getAlarms(this.buildSearchParam(), true);
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

  onDateChange = ({from, to}) => {
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
        if (!params) {
          let timeNe;
          if (data.type == 'stime')
            timeNe = {
              stime: data.time,
              etime: 23,
            };
          else
            timeNe = {
              stime: 0,
              etime: data.time,
            };
          newParams = {
            ...params,
            time: timeNe,
          };
        } else {
          let {time} = params;
          if (!time) {
            let timeN;
            if (data.type == 'stime')
              timeN = {
                stime: data.time,
                etime: 23,
              };
            else
              timeN = {
                stime: 0,
                etime: data.time,
              };
            newParams = {
              ...params,
              time: timeN,
            };
          } else {
            let timeU;
            if (data.type == 'stime') {
              timeU = {
                stime: data.time,
                etime: time.etime < data.time ? data.time : time.etime,
              };
            } else {
              timeU = {
                stime: time.stime > data.time ? data.time : time.stime,
                etime: data.time,
              };
            }
            newParams = {
              ...params,
              time: timeU,
            };
          }
        }

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
        // __DEV__ && console.log('GOND on add Rating: ', data);
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

  // onSiteSelected = sites => {
  //   this.setState({selectedSites: sites});
  // };

  modalHeader = title => {
    // if (this.props.headercontent) {
    //   return (
    //     <View style={[styles.modal_header, {backgroundColor: CMSColors.White}]}>
    //       {this.props.headercontent}
    //     </View>
    //   );
    // }
    return (
      <View
        style={[
          styles.modal_header,
          {
            flex: 10,
            backgroundColor: CMSColors.White,
            justifyContent: 'center',
          },
        ]}>
        <Text style={[styles.modal_title, styles.modal_title_search]}>
          {title ?? CompTxt.alarmFilterTitle}
        </Text>
      </View>
    );
  };

  modalFooter = () => {
    if (this.props.footercontent) {
      return (
        <View style={styles.modal_footer_Apply}>
          {this.props.footercontent}
        </View>
      );
    }
    return (
      <View style={[styles.modal_footer_Apply, {flex: 15}]}>
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
            // enable={this.state.selectedSites.length > 0}
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
    const {alarmStore, sitesStore} = this.props;
    const {from, to, params} = this.state;
    // __DEV__ &&
    //   console.log(
    //     `GOND modalContent ModalHeightPercentage = ${variables.ModalHeightPercentage}, stateH = ${this.state.height}`
    //   );
    return (
      <View style={{flex: 75}}>
        <AlarmFilter
          dateFrom={from}
          dateTo={to}
          params={params}
          sites={sitesStore.sitesList}
          alarmConfig={alarmStore.rateConfig}
          alertTypesVA={alarmStore.vaConfig}
          // initheight={
          //   /*variables.ModalHeightPercentage **/ this.state.height -
          //   header_height
          // }
          // initwidth={
          //   variables.ModalHeightPercentage * this.state.width -
          //   header_height -
          //   footer_height
          // }
          onDateChange={this.onDateChange}
          onAddMoreParams={this.onAddMoreParams}
          onRemoveParam={this.onRemoveParam}
          // selectedsite={this.state.selectedSites}
          // sitesData={this.props.sitesStore.sitesList}
        />
      </View>
    );
  };

  renderFilterModal = () => {
    return (
      <Modal
        isVisible={this.state.showFilterModal}
        onBackdropPress={() => this.setState({showFilterModal: false})}
        // onSwipeOut={() => this.setState({showFilterModal: false})}
        onBackButtonPress={() => this.setState({showFilterModal: false})}
        panResponderThreshold={10}
        backdropOpacity={0.3}
        style={{
          marginBottom: 0,
          marginTop: '10%',
          marginLeft: 0,
          marginRight: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}>
        <View style={styles.modal_container}>
          {this.modalHeader()}
          {this.modalContent()}
          {this.modalFooter()}
        </View>
      </Modal>
    );
  };

  renderAlarmItem = ({item}) => {
    return (
      <CMSRipple onPress={() => this.onSelectAlarm(item)}>
        <AlarmItem data={item} />
      </CMSRipple>
    );
  };

  renderActionButton() {
    return (
      <View
        style={{
          position: 'absolute',
          right: 35,
          bottom: 28,
          width: 63,
          height: 63,
          borderRadius: 45,
          backgroundColor: CMSColors.PrimaryActive,
          justifyContent: 'center',
          alignItems: 'center',
          // android's shadow
          elevation: 5,
          // ios's shadow check later
          shadowOffset: {width: 14, height: 14},
          shadowColor: 'black',
          shadowOpacity: 0.7,
          shadowRadius: 45,
        }}>
        <CMSTouchableIcon
          iconCustom="search_solid_advancedfind"
          onPress={() => this.setState({showFilterModal: true})}
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

  renderNoData = () => {
    return (
      <View style={[styles.noDataContainer, {height: this.state.listHeight}]}>
        <Image source={No_Data} style={styles.noDataImg}></Image>
        <Text style={styles.noDataTxt}>There is no data.</Text>
      </View>
    );
  };

  render() {
    const {alarmStore} = this.props;
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
        style={{flex: 1, backgroundColor: CMSColors.White}}
        onLayout={this.onLayout}>
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
            data={alarmStore.filteredSearchData}
            keyExtractor={item => item.kAlertEvent}
            onRefresh={this.refreshData}
            refreshing={alarmStore.isLoading}
            ListEmptyComponent={noData && this.renderNoData()}
          />
        </View>
        {actionButton}
        {filterModal}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    //height: 200,
    //width: 300,
  },
  modal_container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: CMSColors.DividerColor24_HEX,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modal_header: {
    // height: header_height,
    alignItems: 'center',
    flexDirection: 'row',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: {
          height: 0,
          width: 0,
        },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  modal_header_icon: {
    marginLeft: 15,
  },
  modal_title: {
    marginLeft: 10,
    fontSize: 16,
  },
  modal_title_search: {
    color: CMSColors.PrimaryText,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
  },
  modal_body: {
    flex: 1,

    //alignSelf: 'stretch',
  },
  modal_footer: {
    height: footer_height,
    backgroundColor: CMSColors.ModalFooter,
    borderTopWidth: 1,
    borderColor: CMSColors.FooterBorder,
    //alignItems: 'flex-end',
    //paddingRight: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modal_footer_Apply: {
    height: footer_height,
    backgroundColor: CMSColors.White,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form_horizontal: {
    flex: 1,
    padding: 10,
    flexDirection: 'column',
  },
  form_horizontal_label: {
    flex: 1,
    textAlign: 'center',
  },
  form_horizontal_textarea: {
    flex: 3,
  },
  form_horizontal_datepicker: {
    flex: 1,
  },
  form_horizontal_datepicker_group: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  form_horizontal_datepicker_text: {
    width: 40,
    alignSelf: 'center',
  },
  form_horizontal_datepicker_date: {
    flex: 1,
  },
  form_horizontal_listcheckbox: {
    flex: 2,
  },
  button: {
    height: 26,
    borderWidth: 0,
    marginTop: 3,
  },

  content_button_apply: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    //paddingLeft: 10,
    //paddingRight: 10,
    marginRight: 10,
  },
  content_button_cancel: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    marginLeft: 10,
  },
  button_cancel: {
    height: 50,
    flex: 1,
    justifyContent: 'center',
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 1,
    margin: 3,
    //backgroundColor: 'red'
  },
  button_apply: {
    height: 50,
    flex: 1,
    backgroundColor: CMSColors.PrimaryActive,
    margin: 3,
  },
  dateIcon: {
    position: 'absolute',
    left: 0,
    top: 4,
    marginLeft: 0,
  },
  dateInput: {
    marginLeft: 36,
    height: 25,
  },
  inputDescript: {
    height: 130,
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: 4,
    textAlignVertical: 'top',
    padding: 10,
    fontSize: 14,
  },
  modal_header_dismiss: {
    borderColor: CMSColors.White,
  },
  modal_footer_dismiss: {
    marginRight: 10,
    alignItems: 'center',
    borderColor: CMSColors.White,
  },
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

export default inject('alarmStore', 'sitesStore')(observer(AlarmsSearchView));
