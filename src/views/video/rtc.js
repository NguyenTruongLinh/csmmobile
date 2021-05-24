import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  Modal,
  UIManager,
  BackHandler,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';

import util, {normalize} from '../../util/general';

const Video_State = {STOP: 0, PLAY: 1, PAUSE: 2};
// const Time_Ruler_Height = normalize(variables.isPhoneX ? 75 : 65);
// const content_padding = normalize(6);

const Default_Action_Offset = 30;
const Action_Button_Height = 54;
const naturalRatio = 16 / 9;
const Limit_Time_Allow_Change_Live_Search = 1;
const header_height = 50;
const footer_height = 50;
// let isSwitchToLive = false;

class RTCStreamingView extends Component {
  static defaultProps = {
    enableSwitchChannel: true,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('RTCStreamingView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('RTCStreamingView componentWillUnmount');
    // Dimensions.removeEventListener('change', this.Dimension_handler);
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    // if (Platform.OS === 'ios') {
    //   this.appStateEventListener.remove();
    // }
  }

  render() {
    return <View></View>;
  }
}

export default RTCStreamingView;
