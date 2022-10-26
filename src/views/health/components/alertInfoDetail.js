import React from 'react';
import {Text, View} from 'react-native';

import {inject, observer} from 'mobx-react';
import {DateTime} from 'luxon';

import {IconCustom} from '../../../components/CMSStyleSheet';
import Button from '../../../components/controls/Button';

import CMSColors from '../../../styles/cmscolors';
import styles from '../styles/alertDetailStyles';
import theme from '../../../styles/appearance';

import {
  HEALTH as HEALTH_TXT,
  VIDEO as VIDEO_TXT,
} from '../../../localization/texts';
import {DateFormat} from '../../../consts/misc';

class AlertInfoDetail extends React.Component {
  render() {
    const {
      healthStore,
      appStore,
      data,
      onLivePress,
      onSearchPress,
      onDismissPress,
    } = this.props;
    const {showDismissAllButtonInHealthDetail} = healthStore;
    const {appearance} = appStore;
    if (!data) return <View />;
    const {dvr, channelName, timezone} = data;

    return (
      <View style={styles.infoContainer}>
        <View style={{flexDirection: 'row'}}>
          <View style={styles.infoLeft}>
            <Text
              numberOfLines={2}
              style={[styles.infoText, theme[appearance].text]}>
              {channelName}
            </Text>
            <View style={styles.dvrInfo}>
              <View style={styles.dvrIcon}>
                <IconCustom
                  name="icon-dvr"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={[styles.dvrName, theme[appearance].text]}>
                {dvr.name}
              </Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            <Text style={[styles.hisText, theme[appearance].text]}>
              {HEALTH_TXT.HISTORICAL}
            </Text>
            <View style={styles.timeInfo}>
              <View style={styles.timeIcon}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={[styles.infoDateTimeText, theme[appearance].text]}>
                {DateTime.fromISO(timezone).toFormat(
                  DateFormat.AlertDetail_Date
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoButtonContainer}>
          <Button
            style={styles.buttonStyle}
            caption={VIDEO_TXT.LIVE}
            iconCustom="videocam-filled-tool"
            iconSize={17}
            type="flat"
            enable
            onPress={onLivePress}
            captionStyle={styles.buttonCaptionStyle}
          />
          <Button
            style={styles.buttonStyle}
            caption={VIDEO_TXT.SEARCH}
            iconCustom="searching-magnifying-glass"
            iconSize={17}
            type="flat"
            enable
            onPress={onSearchPress}
            captionStyle={styles.buttonCaptionStyle}
          />
          {showDismissAllButtonInHealthDetail && (
            <Button
              style={[styles.buttonStyle, styles.buttonDismiss]}
              caption={HEALTH_TXT.DISMISS_CURRENT}
              iconCustom="double-tick-indicator"
              iconSize={17}
              type="flat"
              enable
              onPress={onDismissPress}
              captionStyle={styles.buttonCaptionStyle}
            />
          )}
        </View>
      </View>
    );
  }
}

export default inject('healthStore', 'appStore')(observer(AlertInfoDetail));
