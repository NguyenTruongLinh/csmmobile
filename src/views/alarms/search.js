import React, {Component} from 'react';
import {
  View,
  ActivityIndicator,
  FlatList,
  Modal as ModalBase,
  Dimensions,
} from 'react-native';

const Timer_Get_Image = 3000;
const thumb_size = {width: 60, height: 60};
const RowEmpty = {isEmpty: true};
const lastScrollPos = 0;
class AlarmsSearchView extends Component {
  //{sdate, edate, sty, aty, ara,ano, sta, sid, vty, aid, avaid} = params;
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    __DEV__ && console.log('AlarmsSearch componentWillUnmount');
    Dimensions.removeEventListener('change', this.onDimensionChange);
  }

  componentDidMount() {
    __DEV__ && console.log('AlarmsSearch componentDidMount');
    Dimensions.addEventListener('change', this.onDimensionChange);
  }

  onDimensionChange = event => {
    const {width, height} = event.window;
    this.setState({width: width, height: height});
  };

  render() {
    return <View />;
  }
}

export default AlarmsSearchView;
