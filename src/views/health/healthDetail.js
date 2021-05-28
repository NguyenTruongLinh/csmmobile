// ----------------------------------------------------
// <!-- START MODULES -->

import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableHighlight,
  Image,
  Platform,
} from 'react-native';

import CMSColors from '../../styles/cmscolors';
const RowEmpty = {isEmpty: true};

class HealthDetailView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('HealthDetailView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('HealthDetailView componentWillUnmount');
  }

  render() {
    return <View />;
  }
}

export default HealthDetailView;
