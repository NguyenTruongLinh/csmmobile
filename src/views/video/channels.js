import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  StatusBar,
  BackHandler,
} from 'react-native';

const SEARCH_VIDEO_PREVIOUS_TIME = 15;
const SEARCH_VIDEO_LIMIT_TIME = 24 * 60;

const SEARCH_VIDEO_LIMIT_TIME_DVRDATE = 30;

class ChannelsView extends Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
  }

  componentWillUnmount() {
    __DEV__ && console.log('ChannelsView componentWillUnmount');
    this._isMounted = false;
  }
  componentDidMount() {
    this._isMounted = true;
    if (__DEV__) console.log('ChannelsView componentDidMount');
  }

  render() {
    return <View></View>;
  }
}

export default ChannelsView;
