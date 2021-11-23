import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, StyleSheet, Text, processColor, Dimensions} from 'react-native';
import CMSTrendingLine from './CMSTrendingLine';
import {isNullOrUndef} from '../../util/general';
import CMSColors from '../../../styles/cmscolors';

const DataTrendMap = [3, 4, 5, 6, 7, 8, 9, 10];

function buildChartData(arrayData, startIndex = 0) {
  if (!arrayData) return [];
  if (typeof arrayData[0] === 'object') {
    // API reponse data object: {Value, Time}
    return arrayData.map((value, index) => ({
      x: startIndex + index,
      y: parseInt(value.value, 10),
    }));
  } else {
    // API reponse raw data (int)
    return arrayData.map((value, index) => ({
      x: startIndex + index,
      y: parseInt(value, 10),
    }));
  }
}

function buildChartXAxisLabels(historicalData, forecastData) {
  if (!historicalData || typeof historicalData[0] != 'object') return undefined;
  let result = [];
  for (var data of historicalData) {
    result.push(data.hourLabel);
  }
  for (var data of forecastData) {
    result.push(data.hourLabel);
  }
  console.log('HAI buildChartXAxisLabels result = ', result);
  return result;
}

class TrendingView extends Component {
  static propTypes = {
    color: PropTypes.string,
    historicalData: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.number, PropTypes.object])
    ),
    forecastData: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.number, PropTypes.object])
    ),
    trendDataCount: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.state = {
      chartData: {
        dataSets: [
          {
            values: [],
            label: 'Historical',
            config: {
              drawHighlightIndicators: false,
              drawCircles: false,
              drawCubic: false,
              valueFormatter: '#',
              textLegendRotation: 0,
            },
          },
          {
            values: [],
            label: 'Forecast',
            config: {
              drawHighlightIndicators: false,
              drawCircles: false,
              drawCubic: false,
              dashedLine: {
                lineLength: 4,
                spaceLength: 4,
              },
              valueFormatter: '#',
              textLegendRotation: 0,
            },
            //color: [processColor('#F0AD4E')],
            highlightColor: processColor('#FFC107'),
          },
        ],
      },
      xAxis: {
        drawLabels: false,
        drawGridLines: true,
        drawAxisLine: true,
        // If we want to draw grid line at each point on xAxis, labelCount has to be set
        // equal to number of chart's data point and labelCountForce has to be set to true
        labelCount: 0,
        labelCountForce: true,
        position: 'BOTTOM',
        textSize: 8,
      },
      // yAxis: {
      //     left: {
      //         drawLabels: false,
      //         drawGridLines: false,
      //     },
      //     right: {
      //         enabled: false,
      //     },
      //     drawGridLines: false,
      // },
      trendDataCount: 0,
      color: '#fff',
    };
  }

  // static getDerivedStateFromProps(nextProps) {
  //   console.log(
  //     '********************** getDerivedStateFromProps nextProps = ',
  //     nextProps
  //   );
  //   return null;
  // }
  static getDerivedStateFromProps(nextProps, prevState) {
    let dataCount =
      nextProps.historicalData.length + nextProps.forecastData.length;
    console.log(
      '********************** getDerivedStateFromProps dataCount = ',
      dataCount
    );
    // build historical and forecast data:
    const historicalValues = buildChartData(nextProps.historicalData);
    // Insert last element of historical data into first place of forecast data to make the "bridging point"
    const forecastData =
      nextProps.historicalData.length > 0 &&
      nextProps.forecastData.length <= nextProps.historicalData.length
        ? [
            nextProps.historicalData[nextProps.historicalData.length - 1],
          ].concat(nextProps.forecastData)
        : nextProps.forecastData;
    const forecastValues = buildChartData(
      forecastData,
      nextProps.historicalData.length - 1
    );
    const xAxisLabels = buildChartXAxisLabels(
      nextProps.historicalData,
      nextProps.forecastData
    );
    // const yMin = [nextProps.historicalData].concat(nextProps.forecastData).reduce(
    //     (result, element) =>  result > element ? result : element
    // )

    //if(history_longest && forecast_longest)
    //{
    var history_longest =
      nextProps.historicalData && nextProps.historicalData.length > 0
        ? nextProps.historicalData.reduce(function (a, b) {
            return (isNullOrUndef(a.value) ? 0 : a.value.toString().length) >
              (isNullOrUndef(b.value) ? b.value.toString().length : 0)
              ? a
              : b;
          })
        : {Value: '0'};
    var forecast_longest =
      nextProps.forecastData && nextProps.forecastData.length > 0
        ? nextProps.forecastData.reduce(function (a, b) {
            return (isNullOrUndef(a.value) ? 0 : a.value.toString().length) >
              (isNullOrUndef(b.value) ? b.value.toString().length : 0)
              ? a
              : b;
          })
        : {Value: '0'};

    var history_l = 1;
    if (history_longest.value != undefined) {
      history_l = history_longest.value.toString().length;
    } else {
      history_l = history_longest.toString().length;
    }

    var forcast_l = 1;
    if (forecast_longest.value != undefined) {
      forcast_l = forecast_longest.value.toString().length;
    } else {
      forcast_l = forecast_longest.toString().length;
    }

    let textlength = history_l > forcast_l ? history_l : forcast_l;

    let textLabelRotation = 0;
    let dataLength = historicalValues.length;

    if (dataLength >= 6 && dataLength <= 10) {
      if (textlength == 1) {
        textLabelRotation = 0;
      }
      if (textlength == 2 || textlength == 3) {
        textLabelRotation = -Math.PI / 4;
      }
      if (textlength > 3) {
        textLabelRotation = -Math.PI / 2;
      }
    }
    if (dataLength >= 7) {
      textLabelRotation = -Math.PI / 2;
    }
    if (dataLength < 6) {
      textLabelRotation = 0;
      if (textlength >= 3) {
        textLabelRotation = -Math.PI / 4;
      }
      if (textlength >= 4) {
        textLabelRotation = -Math.PI / 2;
      }
    }
    //}

    /*if(dataLength >= 0 &&  dataLength < 7 )
        {
            textLabelRotation = - Math.PI/4;
        }
        if(dataLength >= 7 )
        {
            textLabelRotation = - Math.PI/2;
        }*/
    // console.log('GOND xAxisLabels:', xAxisLabels)
    const processedColor = processColor(nextProps.color);

    function calValueFontSize(values) {
      const {width} = Dimensions.get('window');
      // const hisTotalLen = historicalValues.reduce(
      //   (acc, cordinates) => '' + acc + cordinates.y
      // );
      let totalString = '';
      values.map(item => {
        totalString = totalString + item.y;
      });

      return (7 * width * 18) / (360 * totalString.length);
    }

    const valueTextSize = Math.min(
      Math.min(
        calValueFontSize(historicalValues),
        calValueFontSize(forecastValues)
      ),
      18
    );

    const historicalConfig = {
      drawHighlightIndicators: false,
      drawCircles: false,
      drawCubic: false,
      valueFormatter: '#',
      textLegendRotation: textLabelRotation,
      color: processedColor,
      valueTextColor: processedColor,
      valueTextSize: valueTextSize,
      lineWidth: 2,
    };
    const forecastConfig = {
      ...historicalConfig,
      dashedLine: {
        lineLength: 6,
        spaceLength: 5,
      },
    };
    return {
      chartData: {
        ...prevState.chartData,
        dataSets: [
          {
            ...prevState.chartData.dataSets[0],
            values: historicalValues,
            config: historicalConfig,
          },
          {
            ...prevState.chartData.dataSets[1],
            values: forecastValues,
            config: forecastConfig,
          },
        ],
      },
      xAxis: {
        ...prevState.xAxis,
        labelCount: dataCount,
        valueFormatter: xAxisLabels,
        drawLabels: xAxisLabels ? true : false,
        labelRotationAngle: 325,
        textColor: processedColor,
      },
      dataPoint: nextProps.dataPoint, //nextProps.trendDataCount,
      // yAxis: {
      //     ...this.state.yAxis,
      //     axisMaximum: Math.floor(yMin * 1.5),
      // },
    };
  }

  render() {
    const {color, borderAlpha} = this.props;
    const {chartData, xAxis, dataPoint} = this.state;
    const {width} = Dimensions.get('window');

    let hisTotalString = '';
    chartData.dataSets[0].values.map(item => {
      hisTotalString = hisTotalString + item.y;
    });

    return (
      <View
        style={[styles.container, {borderBottomColor: color + borderAlpha}]}>
        <Text style={[styles.title, {color: color}]}>
          {dataPoint} hours data trend{' '}
        </Text>
        <CMSTrendingLine
          style={styles}
          chartData={chartData}
          xAxis={xAxis}
          color={color}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // borderTopColor: '#fff',
    // borderTopWidth: 1,
    borderBottomColor: '#fff',
    borderBottomWidth: 2,
  },
  title: {
    flex: 2,
    fontSize: 15,
    fontWeight: 'bold',
    paddingLeft: 20,
    // textAlign: 'center',
    textAlignVertical: 'center',
  },
  chartContainer: {
    flex: 3,
    paddingBottom: 1,
  },
  chart: {
    flex: 1,
    // paddingBottom: 3,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 4,
    marginRight: 4,
  },
});

export default TrendingView;
