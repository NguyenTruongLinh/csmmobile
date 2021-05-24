// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
  BackHandler,
} from 'react-native';

const HEADER_MAX_HEIGHT = Platform.OS !== 'ios' ? 54 : 64;
const HEADER_MIN_HEIGHT = 35;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

class AlertsView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('AlertsView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlertsView componentWillUnmount');
  }

  render() {
    return <View />;
  }
}

export default AlertsView;
