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

import util from '../../util/general';

class VideoPlayerView extends Component {
  static defaultProps = {
    enableSwitchChannel: true,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('VideoPlayerView componentDidMount');
    // if (Platform.OS === 'ios') {
    //   const eventEmitter = new NativeEventEmitter(NativeModules.FFMpegFrameEventEmitter)
    //   this.appStateEventListener = eventEmitter.addListener('onFFMPegFrameChange', this.onChange)
    // }
  }

  componentWillUnmount() {
    __DEV__ && console.log('VideoPlayerView componentWillUnmount');
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
export default VideoPlayerView;
