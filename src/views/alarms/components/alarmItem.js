import React from 'react';
import PropTypes from 'prop-types';
import {View, StyleSheet, Text} from 'react-native';

import {DateTime} from 'luxon';
import {inject, observer} from 'mobx-react';

import AlarmThumb from '../alarmThumb';
import {DateFormat, AlertTypes} from '../../../consts/misc';
import {IconCustom} from '../../../components/CMSStyleSheet';
import {BigNumber} from 'bignumber.js';

import CMSTouchableIcon from '../../../components/containers/CMSTouchableIcon';
import util from '../../../util/general';
import CMSColors from '../../../styles/cmscolors';
import variable from '../../../styles/variables';
import theme from '../../../styles/appearance';

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
    };
  }

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
    const {appStore} = this.props;
    const {appearance} = appStore;

    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View
          style={{
            justifyContent: 'center',
            paddingRight: variable.inputPaddingLeft,
          }}>
          <IconCustom name="sites" size={14} color={CMSColors.SecondaryText} />
        </View>
        <Text style={[styles.subtext, theme[appearance].text]}>
          {siteName && siteName.length > 0 ? siteName : site.split(':')[0]}
        </Text>
      </View>
    );
  };

  renderIconText = (content, icon) => {
    const {appStore} = this.props;
    const {appearance} = appStore;
    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View
          style={{
            justifyContent: 'center',
            paddingRight: variable.inputPaddingLeft,
          }}>
          <IconCustom name={icon} size={14} color={CMSColors.SecondaryText} />
        </View>
        <Text style={[styles.subtext, theme[appearance].text]}>{content}</Text>
      </View>
    );
  };

  renderChannel = () => {
    const {appearance} = this.props.appStore;
    let channelsList = [];
    let {channelNo, chanMask} = this.props.data;

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
        <Text style={[styles.subtext, theme[appearance].text]}>
          {channelName}
        </Text>
      </View>
    );
  };

  renderNVRName = () => {
    const {appearance} = this.props.appStore;
    let {serverID} = this.props.data;
    if (util.isNullOrUndef(serverID)) return null;

    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text
          style={[
            {width: 20, textAlign: 'center'},
            theme[appearance].text,
          ]}></Text>
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
        <Text style={[styles.subtext, theme[appearance].text]}>{serverID}</Text>
      </View>
    );
  };

  renderDescription = () => {
    let {status, customDescription} = this.props.data;
    const {appStore} = this.props;
    const {appearance} = appStore;

    // console.log('GOND customDescription = ', customDescription)
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
          <Text
            numberOfLines={1}
            style={[styles.description, theme[appearance].text]}>
            {util.capitalize(customDescription)}
          </Text>
        </View>
      );
    }
    return (
      <Text
        numberOfLines={1}
        style={[styles.description, theme[appearance].text]}>
        {util.capitalize(customDescription)}
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
        <View style={styles.thumbViewContainer}>
          <AlarmThumb
            id={data.kAlertEvent}
            index={time}
            data={data}
            api={this.props.api}
            onLoad={data.getThumbnail}
            imgsize={{width: 60, height: 60}}
            resizeMode="contain"
            styles={styles.thumbContainer}
          />
        </View>
        <View
          style={{
            width: 25,
            height: 25,
            backgroundColor: CMSColors.PrimaryActive,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <IconCustom size={18} color={CMSColors.White} name={iconName} />
        </View>
      </View>
    );
  }

  render() {
    const {data, appStore} = this.props;
    const {appearance} = appStore;
    let icon = this.renderIcon();
    let description = this.renderDescription();
    let site = this.renderSite();
    let time = this.renderTime();
    let channel = this.renderChannel();
    let nvrname = this.renderNVRName();

    return (
      <View
        style={[
          styles.container,
          theme[appearance].container,
          theme[appearance].borderColor,
          this.props.containerstyle,
        ]}>
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
            <View style={[{flex: 0.6}, theme[appearance].text]}>{time}</View>
            <View style={[{flex: 0.4}, theme[appearance].text]}>{channel}</View>
          </View>

          <View
            key={this.props.data.kAlertEvent}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 2,
            }}>
            <View style={[{flex: 0.6}, theme[appearance].text]}>{site}</View>
            <View style={[{flex: 0.4}, theme[appearance].text]}>{nvrname}</View>
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
    borderBottomWidth: 1,
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
    paddingVertical: 2,
  },
  descriptionContainer: {
    flexDirection: 'row',
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
  thumbViewContainer: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
  },
  thumbContainer: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default inject('appStore')(observer(AlarmItem));