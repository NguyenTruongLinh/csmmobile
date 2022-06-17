// Using "views/sitetree/sites" instead
//
import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Image,
  Platform,
  BackHandler,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';

class HealthView extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    if (__DEV__) console.log('HealthView componentWillUnmount');
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    Dimensions.removeEventListener('change', this.onDimensionChange);
  }

  onDimensionChange = event => {
    const {width, height} = event.window;
    this.setState({width: width, height: height});
  };

  componentDidMount() {
    if (__DEV__) console.log('HealthView componentDidMount');
    Dimensions.addEventListener('change', this.onDimensionChange);
  }

  render() {
    return <View></View>;
  }
}

export default HealthView;
