import React from 'react';
import {Text, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import theme from '../../../../styles/appearance';
import styles from '../../styles/smartErStyles';

import {SMARTER as SMARTER_TXT} from '../../../../localization/texts';
import {formatNumber} from '../../../../util/general';
import Chart from './chart';

class ChartView extends React.Component {
  static PropTypes = {
    onChartEvent: PropTypes.func,
  };

  static defaultProps = {
    onChartEvent: () => {},
  };

  render() {
    const {exceptionStore, appStore, onChartEvent} = this.props;
    const {appearance} = appStore;

    return (
      <View style={[styles.container, theme[appearance].container]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartHeaderText, theme[appearance].text]}>
            {SMARTER_TXT.TOTAL_RISK}
          </Text>
          <Text style={[styles.chartHeaderRiskValue, theme[appearance].text]}>
            {formatNumber(exceptionStore.totalRiskFactors)}
          </Text>
        </View>
        <View style={styles.chartContainer}>
          <Chart {...{onChartEvent}} />
        </View>
        <View
          style={[styles.manuallyClipText, theme[appearance].container]}></View>
      </View>
    );
  }
}

export default inject(
  'appStore',
  'exceptionStore',
  'sitesStore'
)(observer(ChartView));
