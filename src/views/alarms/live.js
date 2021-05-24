import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  FlatList,
  ActivityIndicator,
  Modal as ModalBase,
  Dimensions,
  BackHandler,
} from 'react-native';

const Timer_Get_Image = 3000;
const thumb_size = {width: 60, height: 60};
const lastScrollPos = 0;
const TabsConst = {ALARM: 'alarm', PVM: 'oam'};

class AlarmsLiveView extends Component {
  constructor(props) {
    super(props);
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}

  onDimensionChange = event => {
    const {width, height} = event.window;
    this.setState({width: width, height: height});
  };

  onBack = () => {
    // if (Actions.currentScene === ROUTERS.ALARM && this.state.index == 0 && this.props.alarm.AlarmPageSelected === ROUTERS.ALARMLIVE)
    //   BackHandler.exitApp();
  };

  componentDidMount() {
    __DEV__ && console.log('AlarmsLive componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmsLive componentWillUnmount');
  }

  render() {
    return <View />;
  }
}

export default AlarmsLiveView;
