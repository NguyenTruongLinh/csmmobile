import React from 'react';
import {View} from 'react-native';

import {inject, observer} from 'mobx-react';

import CMSRipple from '../../../components/controls/CMSRipple';
import {IconCustom} from '../../../components/CMSStyleSheet';

import styles from '../styles/alertsStyles';
import CMSColors from '../../../styles/cmscolors';
import theme from '../../../styles/appearance';

class AlertsBackItem extends React.Component {
  onItemPress = () => {
    const {onPress} = this.props;
    onPress && onPress();
  };

  render() {
    const {appearance} = this.props.appStore;
    return (
      <CMSRipple
        style={[styles.backRowRipple, theme[appearance].modalContainer]}
        onPress={this.onItemPress}>
        <View style={styles.backRowView}>
          <IconCustom
            name="double-tick-indicator"
            size={24}
            color={CMSColors.Dismiss}
          />
        </View>
      </CMSRipple>
    );
  }
}

export default inject('appStore')(observer(AlertsBackItem));
