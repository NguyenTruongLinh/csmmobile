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

import variable from '../../styles/variables';
import {getwindow} from '../../util/general';
const ModalHeight_percent = variable.ModalHeight_percent;
const {width, height} = getwindow();

class VideosettingView extends Component {
  static defaultProps = {
    cloudType: -2,
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('VideoSettingView componentDidMount');
  }

  render() {
    // let statusbar =
    //   Platform.OS == 'ios' ? <View style={styles.statusbarios}></View> : null;
    return <View></View>;
  }
}

export default VideosettingView;
