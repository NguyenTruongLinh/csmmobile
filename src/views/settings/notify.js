import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Platform,
  Modal as ModalBase,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

class NotifySettingView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('NotifySettingView componentDidMount');
  }

  render() {
    return <View></View>;
  }
}

export default NotifySettingView;
