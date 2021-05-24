import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  StatusBar,
  BackHandler,
  Image,
} from 'react-native';

class ChannelsSettingView extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    __DEV__ && console.log('ChannelsSettingView componentWillUnmount');
  }

  componentDidMount() {
    __DEV__ && console.log('ChannelsSettingView componentDidMount');
  }

  render() {
    return <View></View>;
  }
}

export default ChannelsSettingView;
