import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Keyboard,
  ScrollView,
} from 'react-native';
// import uuid from 'react-native-uuid';

const ID_Canned_Message = 5;

class AlarmDetailView extends Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    __DEV__ && console.log('AlarmDetail componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmDetail componentWillUnmount');
  }

  render() {
    return <View></View>;
  }
}
export default AlarmDetailView;
