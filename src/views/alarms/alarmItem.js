import React from 'react';
import PropTypes from 'prop-types';
import {View, StyleSheet, Text} from 'react-native';
// import { inject } from 'mobx-react';
import {DateTime} from 'luxon';

import AlarmThumb from './alarmThumb';
import {DateFormat, AlertTypes, AlertNames} from '../../consts/misc';
import {IconCustom} from '../../components/CMSStyleSheet';
import {BigNumber} from 'bignumber.js';

import CMSTouchableIcon from '../../components/containers/CMSTouchableIcon';
import util from '../../util/general';
import CMSColors from '../../styles/cmscolors';
import variable from '../../styles/variables';

class AlarmItem extends React.Component {
  static propTypes = {
    iconstyle: PropTypes.object,
    iconName: PropTypes.string,
    containerstyle: PropTypes.object,
    defaultIcon: PropTypes.string,
    data: PropTypes.object,
    api: PropTypes.object,
  };

  static defaultProps = {
    icon: {size: 36, color: CMSColors.Dark_Gray},
    containerstyle: null,
    iconName: null,
    data: null,
    api: null,
    onPress: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      image: null,
      live: true,
      // snapshot: props.data.snapshot,
    };
  }

  // static getDerivedStateFromProps(nextProps, prevState) {
  //   const oldSnapshot = prevState.data.snapshot;
  //   const {snapshot} = nextProps.data;

  //   if (oldSnapshot.length != snapshot.length) {
  //     return {snapshot};
  //   }
  //   for (let i = 0; i < snapshot.length; i++) {
  //     if (
  //       JSON.stringify({...snapshot[i]}) != JSON.stringify({...oldSnapshot[i]})
  //     ) {
  //       return {snapshot};
  //     }
  //   }
  // }

  getIconName = type => {
    switch (type) {
      case AlertTypes.DVR_Sensor_Triggered:
        return 'sensor';
      case AlertTypes.DVR_VA_detection:
        return 'va';
      case AlertTypes.TEMPERATURE_OUT_OF_RANGE:
      case AlertTypes.TEMPERATURE_NOT_WEAR_MASK:
      case AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY:
        return 'ic-temperature-32px';
      case AlertTypes.SOCIAL_DISTANCE:
        return 'social-distancing-group';
    }
    return '';
  };

  onItemPress = () => {
    if (!this.props.onPress) return;
    let {site, data} = this.props;
    this.props.onPress({site, data});
  };

  renderTime = () => {
    let {timezone} = this.props.data;
    if (!timezone) return null;
    // __DEV__ && console.log('GOND renderAlarmItem time: ', timezone);
    let formatedTime = DateTime.fromISO(timezone, {zone: 'utc'}).toFormat(
      DateFormat.Alert_Date
    );
    // __DEV__ && console.log('GOND renderAlarmItem time output: ', formatedTime);
    return this.renderIconText(formatedTime, 'clock-with-white-face');
  };

  renderSite = () => {
    let {site, siteName} = this.props.data;

    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View
          style={{
            justifyContent: 'center',
            paddingRight: variable.inputPaddingLeft,
          }}>
          <IconCustom name="sites" size={14} color={CMSColors.SecondaryText} />
        </View>
        <Text style={styles.subtext}>{siteName ?? site}</Text>
      </View>
    );
  };

  renderIconText = (content, icon) => {
    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View
          style={{
            justifyContent: 'center',
            paddingRight: variable.inputPaddingLeft,
          }}>
          <IconCustom name={icon} size={14} color={CMSColors.SecondaryText} />
        </View>
        <Text style={styles.subtext}>{content}</Text>
      </View>
    );
  };

  renderChannel = () => {
    let channelsList = [];
    let {channelNo, chanMask} = this.props.data;
    // console.log('-------- ', this.props.data.description,' ---------')
    // console.log('GOND renderChannel channel = ', channel, ', chanMask = ', chanMask)

    // if (util.isNullOrUndef(chanMask) || chanMask == 0) {
    if (!chanMask) {
      if (util.isNullOrUndef(channelNo)) return null;

      let channelNum = parseInt(channelNo) + 1;
      if (channelNum == 0) return null;
      else channelsList.push(channelNum);
    } else {
      let str = BigNumber(chanMask).toString(2);
      // console.log('GOND renderChannel str from mask = ', str)
      let len = str.length;
      let index = -1;
      for (let i = len - 1; i >= 0; i--) {
        if (str[i] === '1') {
          index = len - 1 - i;
          channelsList.push(index + 1);
        }
      }
    }

    let channelName;
    if (channelsList.length == 1)
      channelName = 'Channel ' + channelsList.join(', ');
    else channelName = 'Channel(s) ' + channelsList.join(', ');

    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={{width: 20, textAlign: 'center'}}></Text>
        <View
          style={{
            justifyContent: 'center',
            paddingRight: variable.inputPaddingLeft,
          }}>
          <IconCustom
            name="videocam-filled-tool"
            size={14}
            color={CMSColors.SecondaryText}
          />
        </View>
        <Text style={styles.subtext}>{channelName}</Text>
      </View>
    );
  };

  renderNVRName = () => {
    let {serverID} = this.props.data;
    if (util.isNullOrUndef(serverID)) return null;

    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={{width: 20, textAlign: 'center'}}></Text>
        <View
          style={{
            justifyContent: 'center',
            paddingRight: variable.inputPaddingLeft,
          }}>
          <IconCustom
            name="icon-dvr"
            size={14}
            color={CMSColors.SecondaryText}
          />
        </View>
        <Text style={styles.subtext}>{serverID}</Text>
      </View>
    );
  };

  customDescription = (desc, kAlertTypeVA) => {
    if (!desc) return;
    try {
      // version old
      if (desc.includes(':')) {
        let lst = desc.split(' ');
        if (!lst || lst.length == 0) return '';
        lst[lst.length - 1] = util.getAlertTypeVA(kAlertTypeVA);
        return lst.join(' ');
      } else {
        let lst = desc.split('.');
        if (!lst || lst.length == 0) return '';
        lst[lst.length - 1] = util.getAlertTypeVA(kAlertTypeVA);
        lst[lst.length - 2] = util.capitalize(lst[lst.length - 2], '&');
        lst[lst.length - 2] = ': ' + util.capitalize(lst[lst.length - 2], '/');
        return lst.map(s => s.trim()).join(' ');
      }
    } catch (err) {
      __DEV__ && console.log('GOND custom desciption failed: ', err);
      return;
    }
  };

  renderDescription = () => {
    let {description, kAlertTypeVA, kAlertType, status} = this.props.data;
    let descriptCustomVA = '';
    let areaName = '';
    // console.log('GOND renderDescription kAlertType = ', kAlertType)
    switch (kAlertType) {
      case AlertTypes.DVR_Sensor_Triggered:
        descriptCustomVA = description;
        break;
      case AlertTypes.DVR_VA_detection:
        descriptCustomVA = this.customDescription(description, kAlertTypeVA);
        break;
      case AlertTypes.TEMPERATURE_OUT_OF_RANGE:
      case AlertTypes.TEMPERATURE_NOT_WEAR_MASK:
      case AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY:
        descriptCustomVA = AlertNames[kAlertType.toString()];
        break;
      case AlertTypes.SOCIAL_DISTANCE:
        areaName = description.split(',')[0];
        descriptCustomVA = areaName
          ? areaName + ': Social distance'
          : 'Social distance';
        break;
    }

    // console.log('GOND descriptCustomVA = ', descriptCustomVA)
    if (status == 1) {
      return (
        <View style={styles.descriptionContainer}>
          <View
            style={{
              justifyContent: 'center',
              paddingRight: variable.inputPaddingLeft,
            }}>
            <IconCustom
              name={'baseline-check_circle'}
              size={15}
              color={CMSColors.Success}
            />
          </View>
          {/* <Text numberOfLines={1} style={styles.description} >
            {util.isTemperatureAlert(kAlertType) ? AlertNames[kAlertType] : util.capitalize(descriptCustomVA)}
          </Text> */}
          <Text numberOfLines={1} style={styles.description}>
            {util.capitalize(descriptCustomVA)}
          </Text>
        </View>
      );
    }
    return (
      <Text numberOfLines={1} style={styles.description}>
        {util.capitalize(descriptCustomVA)}
      </Text>
    );
  };

  renderIcon() {
    const {data} = this.props;
    const {size, color} = this.props.icon;
    let time = new Date().getTime();
    const iconName = this.getIconName(data.kAlertType);
    const _isTempAlert = util.isTemperatureAlert(data.kAlertType);
    const _isSDAlert = util.isSDAlert(data.kAlertType);
    // if (__DEV__) {
    //   console.log(
    //     'GOND renderAlarmIcon type: ',
    //     data.kAlertType,
    //     ', isTemp: ',
    //     _isTempAlert,
    //     ', isSD: ',
    //     _isSDAlert
    //   );
    //   console.log('GOND renderAlarmIcon, snapshot: ', data.snapshot.length);
    // }

    return data.snapshot.length == 0 || _isTempAlert || _isSDAlert ? (
      <CMSTouchableIcon
        size={size}
        disabled={true}
        color={color}
        iconCustom={iconName}
      />
    ) : (
      <View
        style={[
          styles.thumbSizeContain,
          {justifyContent: 'flex-end', alignItems: 'flex-end'},
        ]}>
        <View style={{top: 0, left: 0, position: 'absolute'}}>
          <AlarmThumb
            id={data.kAlertEvent}
            index={time}
            data={data}
            api={this.props.api}
            onLoad={data.getThumbnail}
            imgsize={{width: 60, height: 60}}
            resizeMode="contain"
          />
        </View>
        <CMSTouchableIcon
          size={18}
          disabled={true}
          color={CMSColors.White}
          styles={{
            width: 25,
            height: 25,
            backgroundColor: CMSColors.PrimaryColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          iconCustom={iconName}
        />
      </View>
    );
  }

  render() {
    let icon = this.renderIcon();
    let description = this.renderDescription();
    let site = this.renderSite();
    let time = this.renderTime();
    let channel = this.renderChannel();
    let nvrname = this.renderNVRName();

    return (
      <View style={[styles.container, this.props.containerstyle]}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.datacontainer}>
          {description}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 2,
            }}>
            <View style={{flex: 0.6}}>{time}</View>
            <View style={{flex: 0.4}}>{channel}</View>
          </View>

          <View
            key={this.props.data.kAlertEvent}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 2,
            }}>
            <View style={{flex: 0.6}}>{site}</View>
            <View style={{flex: 0.4}}>{nvrname}</View>
          </View>
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: CMSColors.White,
    justifyContent: 'flex-start',
    padding: variable.contentPadding,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: CMSColors.DividerColor24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datacontainer: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: variable.contentPadding,
    //height: 60
    paddingTop: 2,
    paddingBottom: 2,
  },
  descriptionContainer: {
    flexDirection: 'row',
    //backgroundColor: 'red'
  },
  description: {
    fontSize: 16,
    color: CMSColors.PrimaryText,
  },
  subtext: {
    color: CMSColors.SecondaryText,
    fontSize: 12,
    paddingRight: 35,
  },
  thumbSizeContain: {
    width: 60,
    height: 60,
  },
});

export default AlarmItem;
