// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Modal as ModalBase,
  processColor,
  ScrollView,
  TouchableHighlight,
} from 'react-native';

class SummaryView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('ExceptionsSummaryView componentWillUnmount');
  }

  render() {
    return <View></View>;
  }
}

export default SummaryView;
