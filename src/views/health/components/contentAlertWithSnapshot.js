import React from 'react';
import {Text, View} from 'react-native';

import {inject, observer} from 'mobx-react';
import {DateTime} from 'luxon';

import {IconCustom} from '../../../components/CMSStyleSheet';

import styles from '../styles/alertsStyles';
import theme from '../../../styles/appearance';
import CMSColors from '../../../styles/cmscolors';
import {DateFormat} from '../../../consts/misc';

class ContentAlertWithSnapshot extends React.Component {
  render() {
    const {alert, appStore, isListView} = this.props;
    const {appearance} = appStore;

    const containerStyle = isListView ? styles.listView : styles.gridView;
    const numberOfLines = isListView ? 0 : 1;

    return (
      <View style={containerStyle}>
        <Text
          numberOfLines={numberOfLines}
          style={[styles.thumbChannelText, theme[appearance].text]}>
          {alert.channelName}
        </Text>

        <View style={styles.thumbSub}>
          <View style={styles.thumbSubIcon}>
            <IconCustom
              name="icon-dvr"
              size={12}
              color={CMSColors.SecondaryText}
            />
          </View>
          <Text style={[styles.thumbSubText, theme[appearance].text]}>
            {alert.dvr.name}
          </Text>
        </View>

        <View style={styles.thumbSub}>
          <View style={styles.thumbSubIcon}>
            <IconCustom
              name="clock-with-white-face"
              size={12}
              color={CMSColors.SecondaryText}
            />
          </View>
          <Text style={[styles.thumbSubText, theme[appearance].text]}>
            {DateTime.fromISO(alert.timezone, {zone: 'utc'}).toFormat(
              DateFormat.Alert_Date
            )}
          </Text>
        </View>
      </View>
    );
  }
}

export default inject('appStore')(observer(ContentAlertWithSnapshot));
