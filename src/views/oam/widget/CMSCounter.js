import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import CMSStyleSheet from '../../../components/CMSStyleSheet'; //'../../components/CMSStyleSheet';
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
    const {count, icon, color, borderAlpha} = this.props;
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
        style={[styles.container, {borderBottomColor: color + borderAlpha}]}>
        <IconCustom
          style={[styles.icon, {color: color}]}
          size={normalize(44)}
          name={icon}
        />
        <View style={styles.body}>
          <Text style={[styles.title, {color: color}]}>{this.props.title}</Text>
          <Text
            numberOfLines={1}
            style={[
              styles.counter,
              {color: color, fontSize: normalize(fontSize)},
            ]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#fff',
    borderBottomWidth: 2,
    // borderColor: '#fff',
    // borderWidth: 2,
  },
  icon: {
    // flex: 1,
    width: 60,
    paddingLeft: 15,
    // borderColor: '#fff',
    // borderWidth: 2,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    // paddingTop: 18,
    // alignItems: 'stretch',
    // alignItems: 'center',
    // backgroundColor: 'green',
  },
  title: {
    flex: 1,
    fontSize: normalize(16),
    fontWeight: 'bold',
    paddingTop: 4,
    // paddingTop: 18,
    textAlign: 'center',
    textAlignVertical: 'bottom',
    paddingHorizontal: 10,
    // backgroundColor: 'blue',
    paddingBottom: 10,
  },
  counter: {
    flex: 2,
    // fontSize:  normalize( DEFAULT_COUNTER_SIZE),
    fontWeight: 'bold',
    textAlign: 'center',
    // backgroundColor: 'green',
    textAlignVertical: 'top',
    // borderColor: '#fff',
    // borderWidth: 2,
  },
});

export default CounterView;
