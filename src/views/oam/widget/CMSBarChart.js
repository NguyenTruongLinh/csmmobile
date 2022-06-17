'use strict';

// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component, processColor} from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, View, Text} from 'react-native';
import {backgroundChart} from '../../../styles/CMSColors';
import {BarChart} from 'react-native-charts-wrapper';
// <!-- END MODULES -->
// ----------------------------------------------------

class CMSBarChart extends React.Component {
  handleSelect(event) {
    let entry = event.nativeEvent;
    if (entry == null) {
      this.setState({...this.state, selectedEntry: null});
    } else {
      this.setState({...this.state, selectedEntry: JSON.stringify(entry)});
    }
  }

  render() {
    const {legend, data, xAxis, styles} = this.props;

    return (
      <View style={styles.container}>
        <BarChart
          style={styles}
          data={data}
          xAxis={xAxis}
          animation={{durationX: 2000}}
          legend={legend}
          chartDescription={{text: ''}}
          description={{text: ''}}
          gridBackgroundColor={processColor(backgroundChart)}
          drawBarShadow={false}
          drawValueAboveBar={true}
          drawHighlightArrow={true}
          //onSelect={this.handleSelect.bind(this)}
        />
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    //alignItems: "center"
    flex: 1,
    width: null,
    height: null,
  },
});

module.exports = BarChart;
