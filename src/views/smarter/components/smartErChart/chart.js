import React from 'react';
import {Dimensions, processColor} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';
import {HorizontalBarChart} from 'react-native-charts-wrapper';

import {formatNumber} from '../../../../util/general';

const {width} = Dimensions.get('window');
const MAX_TEXT_LENGTH = 32;

class Chart extends React.Component {
  static PropTypes = {
    onChartEvent: PropTypes.func,
  };

  static defaultProps = {
    onChartEvent: () => {},
  };

  render() {
    const {exceptionStore, onChartEvent} = this.props;
    __DEV__ &&
      console.log('GOND renderChart chartValues: ', exceptionStore.chartData);
    const backgroundY =
      exceptionStore.chartData.length > 0
        ? exceptionStore.chartData[exceptionStore.chartData.length - 1].value
        : 0;
    const backgroundDataSet = exceptionStore.chartData.map(data => ({
      y: backgroundY,
      key: data.key,
    }));
    const labelDataSet = exceptionStore.chartData.map(data => ({
      y: 0,
      key: data.key,
    }));

    return (
      <HorizontalBarChart
        data={{
          dataSets: [
            {
              values: backgroundDataSet,
              label: '',
              config: {
                color: processColor('rgba(189, 189, 189, 0.24)'),
                highlightAlpha: 90,
                drawValues: false,
              },
            },
            {
              values: exceptionStore.chartData.map(data => ({
                y: data.value,
                key: data.key,
              })),
              label: '',
              config: {
                color: processColor('#FFC107'),
                highlightAlpha: 90,
                highlightColor: processColor('#FFC107'),
                drawValues: false,
              },
            },
            {
              values: labelDataSet,
              label: '',
              config: {
                drawValues: true,
                valueTextSize: 14,
                valueTextColor: processColor('black'),
                visible: true,
                valueFormatter: exceptionStore.chartData.map(x => {
                  let ellipsized =
                    width < 480 && x.name.length > MAX_TEXT_LENGTH
                      ? x.name.substring(0, MAX_TEXT_LENGTH) + '...'
                      : x.name;
                  return ellipsized + ' - ' + formatNumber(x.value);
                }),
              },
            },
          ],
          config: {
            barWidth: 0.3,
          },
        }}
        xAxis={{
          valueFormatter: exceptionStore.chartData.map(
            x => x.name + ' - ' + formatNumber(x.value)
          ),
          granularityEnabled: true,
          granularity: 1,
          drawLabels: false,
          drawGridLines: false,
          drawAxisLine: false,
          position: 'TOP_INSIDE',
        }}
        yAxis={{
          left: {
            textColor: processColor('white'),
            axisMinimum: 0,
            axisMaximum: backgroundY,
            labelCount: 5,
            labelCountForce: true,
            granularity: 1,
            granularityEnabled: true,
          },
          right: {
            textColor: processColor('white'),
            axisMinimum: 0,
            axisMaximum: backgroundY,
            labelCount: 5,
            labelCountForce: true,
            granularity: 1,
            granularityEnabled: true,
          },
        }}
        legend={{enabled: false}}
        chartDescription={{text: ''}}
        drawBorders={false}
        drawValueAboveBar={true}
        onSelect={onChartEvent}
        animation={{durationY: 500}}
        style={{flex: 1}}
      />
    );
  }
}

export default inject(
  'appStore',
  'exceptionStore',
  'sitesStore'
)(observer(Chart));
