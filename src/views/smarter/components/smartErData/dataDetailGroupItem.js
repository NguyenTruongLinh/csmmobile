import React from 'react';
import {Text, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import CMSRipple from '../../../../components/controls/CMSRipple';
import {IconCustom} from '../../../../components/CMSStyleSheet';

import styles from '../../styles/smartErStyles';
import theme from '../../../../styles/appearance';

import {formatNumber} from '../../../../util/general';

class DataDetailGroupItem extends React.Component {
  static PropTypes = {
    onPress: PropTypes.func,
    data: PropTypes.object,
  };

  static defaultProps = {
    onPress: () => {},
    data: {},
  };

  render() {
    const {data, appStore, onPress} = this.props;
    const {appearance} = appStore;

    return (
      <CMSRipple onPress={onPress}>
        <View
          style={[
            styles.groupItemContainer,
            theme[appearance].modalContainer,
            theme[appearance].borderColor,
          ]}>
          <View style={styles.userIconContainer}>
            <IconCustom
              name="user-shape"
              size={20}
              color={theme[appearance].iconColor}
            />
          </View>

          <View style={styles.employeeNameContainer}>
            <Text style={[styles.employeeNameText, theme[appearance].text]}>
              {data.employeeName}
            </Text>
          </View>
          <View style={styles.employeeNameRiskContainer}>
            <Text style={styles.employeeNameRiskText}>
              {formatNumber(data.riskFactor)}
            </Text>
            <IconCustom
              name="keyboard-right-arrow-button"
              size={20}
              color={theme[appearance].iconColor}
            />
          </View>
        </View>
      </CMSRipple>
    );
  }
}

export default inject('appStore')(observer(DataDetailGroupItem));
