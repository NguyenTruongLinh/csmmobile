import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, StyleSheet, Text, processColor} from 'react-native';
import CMSColors from '../../../styles/cmscolors';

class WaitTime extends Component {
  static propTypes = {
    color: PropTypes.string,
    waitTime: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.state = {
      estWaitTime: '00:00',
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const getTimeString = val => (val < 10 ? '0' : '') + val;
    if (!nextProps.estWaitTime) return;
    if (isNaN(nextProps.estWaitTime)) {
      this.setState({
        estWaitTime: nextProps.estWaitTime,
      });
    } else if (nextProps.estWaitTime != this.state.estWaitTime) {
      let sec = nextProps.estWaitTime % 60;
      let min = (nextProps.estWaitTime - sec) / 60;
      this.setState({
        estWaitTime: getTimeString(min) + ':' + getTimeString(sec),
      });
    }
  }

  render() {
    const {style, color, borderAlpha} = this.props;
    return (
      <View
        style={[
          styles.container,
          {borderBottomColor: color + borderAlpha},
          style,
        ]}>
        <Text style={[styles.title, {color: color}]}>Est. wait time</Text>
        <Text style={[styles.time, {color: color}]}>
          {this.state.estWaitTime}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#fff',
    borderBottomWidth: 2,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    // lineHeight: 18,
    paddingLeft: 20,
    // justifyContent: 'center',
    // alignItems: 'center'
  },
  time: {
    flex: 1,
    fontSize: 40,
    fontWeight: 'bold',
    paddingRight: 28,
    textAlign: 'right',
    textAlignVertical: 'center',
  },
});
export default WaitTime;
