'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, Dimensions, View, Text} from 'react-native';
import {backgroundChart} from '../../styles/CMSColors';
import {BarChart, LineChart} from 'react-native-charts-wrapper';

// const {height, width} = Dimensions.get('window')
// const aspectRatio = height/width

class CMSTrendingLine extends React.Component {
  static defaultProps = {
    xAxis: {
      drawLabels: false,
      drawGridLines: true,
      drawAxisLine: true,
      // If we want to draw grid line at each point on xAxis, labelCount has to be set
      // equal to number of chart's data point and labelCountForce has to be set to true
      labelCount: 10,
      labelCountForce: true,
      position: 'BOTH_SIDED',
    },
    yAxis: {
      left: {
        drawLabels: false,
        drawGridLines: false,
      },
      right: {
        enabled: false,
      },
      drawGridLines: false,
    },
    // legend: {
    //   enable: true,
    //   form: 'NONE',
    //   wordWrapEnabled: false,
    //   formToTextSpace: 0,
    //   xEntrySpace: wp('24'),
    //   // position: 'BELOW_CHART_CENTER',
    //   horizontalAlignment: 'CENTER',
    //   orientation: 'HORIZONTAL'
    // },
  };
  static propTypes = {
    legend: PropTypes.object,
    chartData: PropTypes.object,
    xAxis: PropTypes.object,
    yAxis: PropTypes.object,
  };

  constructor(props) {
    super(props);
    const {width} = Dimensions.get('window');

    this.state = {
      legend: {
        enable: true,
        form: 'NONE',
        wordWrapEnabled: false,
        formToTextSpace: -(width * 0.05),
        xEntrySpace: width * 0.18,
        // position: 'BELOW_CHART_CENTER',
        horizontalAlignment: 'CENTER',
        orientation: 'HORIZONTAL',
      },
    };
  }

  onLayout = e => {
    const {width} = Dimensions.get('window');
    this.setState({
      legend: {
        ...this.state.legend,
        // formToTextSpace: -(width * 0.4),
        // xEntrySpace: width * 0.18,
      },
    });
  };

  render() {
    const {
      // totalDataCount,
      chartData,
      style,
      xAxis,
      yAxis,
    } = this.props;

    const {legend} = this.state;
    // if (totalDataCount)
    //     xAxis.labelCount = totalDataCount
    // console.log('GOND, legend = ', legend) //, ' <> ', aspectRatio, ' : ', wp('20'))
    // chartData.dataSets[0].label = '';
    // chartData.dataSets[1].label = '';
    if (xAxis && xAxis.labelCount > 0 && chartData && chartData.dataSets)
      return (
        <View
          onLayout={this.onLayout}
          style={[style.chartContainer, styles.chart]}>
          {/* <Text>{JSON.stringify(chartData.dataSets)}</Text> */}
          <LineChart
            style={style.chart}
            data={chartData}
            // animation={{durationX: 1000}}
            legend={legend}
            chartDescription={{text: ''}}
            // description={{text: "hist"}}
            // drawHighlightArrow={true}
            drawBorders={false}
            drawGridBackground={false}
            xAxis={xAxis}
            yAxis={yAxis}
            touchEnabled={false}
            dragDecelerationEnabled={false}
          />
        </View>
      );
    else return <View style={{flex: 1, paddingBottom: 3}} />;
  }
}

const styles = StyleSheet.create({
  chart: {
    backgroundColor: '#00000022',
    marginRight: 16,
  },
});

module.exports = CMSTrendingLine;
