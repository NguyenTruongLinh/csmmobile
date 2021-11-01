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
import Ripple from 'react-native-material-ripple';

import AlarmItem from './alarmItem';
import InputTextIcon from '../components/controls/InputTextIcon';

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
  }

  componentDidMount() {
    __DEV__ && console.log('AlarmsLive componentDidMount');

    this.props.alarmStore.getLiveData(this.buildRequestParams());
    // this.refreshLiveData();
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmsLive componentWillUnmount');
  }

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
      <Ripple onPress={() => this.onSelectAlarm(item)}>
        <AlarmItem data={item} />
      </Ripple>
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
        <View style={commonStyles.flatSearchBarContainer}>
          <InputTextIcon
            label=""
            value={alarmStore.filterText}
            onChangeText={this.onFilter}
            placeholder={CompTxt.searchPlaceholder}
            iconCustom="searching-magnifying-glass"
            disabled={false}
            iconPosition="right"
          />
        </View>
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
