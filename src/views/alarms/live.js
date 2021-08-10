import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  FlatList,
  ActivityIndicator,
  Modal as ModalBase,
  Dimensions,
  BackHandler,
} from 'react-native';
import {inject, observer} from 'mobx-react';
import Ripple from 'react-native-material-ripple';

import AlarmItem from './alarmItem';
import InputTextIcon from '../components/controls/InputTextIcon';

import commonStyles from '../../styles/commons.style';
import CMSColors from '../../styles/cmscolors';

import {Comps as CompTxt} from '../../localization/texts';
import {AlertType_Support} from '../../consts/misc';

const Timer_Get_Image = 3000;
const thumb_size = {width: 60, height: 60};
const lastScrollPos = 0;

class AlarmsLiveView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('AlarmsLive componentDidMount');

    this.refreshLiveData();
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

  render() {
    const {alarmStore} = this.props;

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
        <View style={{flex: 1, flexDirection: 'column'}}>
          <FlatList
            renderItem={this.renderAlarmItem}
            data={alarmStore.filteredLiveData}
            keyExtractor={item => item.kAlertEvent}
            onRefresh={this.refreshLiveData}
            refreshing={alarmStore.isLoading}
          />
        </View>
      </View>
    );
  }
}

export default inject('alarmStore')(observer(AlarmsLiveView));
