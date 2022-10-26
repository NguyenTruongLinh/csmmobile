import React from 'react';
import {Text, View} from 'react-native';

import {DateTime} from 'luxon';
import {inject, observer} from 'mobx-react';

import CMSRipple from '../../../components/controls/CMSRipple';
import {IconCustom} from '../../components/CMSStyleSheet';

import styles from '../styles/alertsStyles';
import theme from '../../../styles/appearance';
import CMSColors from '../../../styles/cmscolors';

import {DateFormat} from '../../../consts/misc';

class UnDismissNormalAlertItem extends React.Component {
  render() {
    const {data, appStore} = this.props;
    const {appearance} = appStore;

    return (
      <CMSRipple
        style={[styles.alertRipple, theme[appearance].borderColor]}
        underlayColor={CMSColors.Underlay}>
        <View style={[styles.alertContainer, theme[appearance].container]}>
          <View style={styles.alertIconContainer}>
            <IconCustom name="icon-dvr" size={36} color={CMSColors.Dark_Gray} />
          </View>
          <View style={styles.unDismissAbleContainer}>
            <Text style={[styles.unDismissAbleText, theme[appearance].text]}>
              {data.dvr.name}
            </Text>

            <View style={styles.thumbSub}>
              <View style={styles.thumbSubIcon}>
                <IconCustom
                  name="clock-with-white-face"
                  size={12}
                  color={CMSColors.SecondaryText}
                />
              </View>
              <Text style={[styles.thumbText, theme[appearance].text]}>
                {DateTime.fromISO(data.timezone, {zone: 'utc'}).toFormat(
                  DateFormat.Alert_Date
                )}
              </Text>
            </View>
          </View>
        </View>
      </CMSRipple>
    );
  }
}

export default inject('appStore')(observer(UnDismissNormalAlertItem));
