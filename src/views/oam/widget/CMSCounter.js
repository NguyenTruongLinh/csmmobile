import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import CMSStyleSheet from '../../../components/CMSStyleSheet';
import {normalize} from '../../../util/general';
import CMSColors from '../../../styles/cmscolors';

const {height, width} = Dimensions.get('window');
const aspectRatio = height / width;

const IconCustom = CMSStyleSheet.IconCustom;

class CounterView extends Component {
  static propTypes = {
    title: PropTypes.string,
    count: PropTypes.string,
    color: PropTypes.string,
    icon: PropTypes.string,
  };
  constructor(props) {
    super(props);
  }

  render() {
    const {count, icon, color, borderAlpha, paddingLeft, paddingRight, flex} =
      this.props;
    let fontSize = DEFAULT_COUNTER_SIZE;
    if (!isNaN(count) && count.length > 3 && aspectRatio > 1.6) {
      // styles.counter.fontSize = normalize((DEFAULT_COUNTER_SIZE - (count.length - 3)*12))
      fontSize = DEFAULT_COUNTER_SIZE - (count.length - 3) * 12;
    }
    // else {
    //    styles.counter.fontSize = normalize(DEFAULT_COUNTER_SIZE)
    // }

    return (
      <View
        style={[
          styles.container,
          {
            flex: flex,
            paddingLeft: paddingLeft ? paddingLeft : 0,
            paddingRight: paddingRight ? paddingRight : 0,
          },
        ]}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: color}]}>{this.props.title}</Text>
        </View>
        <View style={styles.body}>
          <IconCustom
            style={[styles.icon, {color: color}]}
            size={normalize(33)}
            name={icon}
          />
          <Text
            numberOfLines={1}
            style={[styles.counter, {color: color, fontSize: normalize(40)}]}>
            {count}
          </Text>
        </View>
      </View>
    );
  }
}

// Use these following styles for debugging flex box
// borderColor: '#fff',
// borderWidth: 2,
const DEFAULT_COUNTER_SIZE = 40;
const styles = StyleSheet.create({
  header: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 20,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    // alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1.5,
    // paddingHorizontal: 10,
    paddingBottom: 4,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    textAlign: 'left',
  },
  icon: {
    // flex: 1,
    // paddingLeft: 20,
  },
  counter: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: -12,
    marginLeft: 20,
  },
});

export default CounterView;
