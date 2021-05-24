import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StatusBar,
  BackHandler,
} from 'react-native';

class RegionsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
  }

  componentWillUnmount() {
    __DEV__ && console.log('RegionsView componentWillUnmount');
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
    if (__DEV__) console.log('RegionsView componentDidMount');
  }

  render() {
    return <View></View>;
  }
}

export default RegionsView;
