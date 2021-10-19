'use strict';
import React, {Component} from 'react';
import {View, FlatList, TextInput, BackHandler} from 'react-native';
const SEARCH_VIDEO_LIMIT_TIME = 24 * 60;

class OAMSitesView extends Component {
  static defaultProps = {
    isPVMFullScreen: false,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('PVMSitesView componentDidmmount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
  }

  render() {
    return <View></View>;
  }
}

export default OAMSitesView;
