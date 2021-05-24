import React, {Component} from 'react';
import {
  View,
  Modal as ModalBase,
  TouchableOpacity,
  BackHandler,
} from 'react-native';

class WelcomeView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('WelcomeView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('WelcomeView componentWillUnmount');
  }

  render() {
    return <View></View>;
  }
}

export default WelcomeView;
