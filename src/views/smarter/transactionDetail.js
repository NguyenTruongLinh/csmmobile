// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import {View, FlatList, ActivityIndicator} from 'react-native';

class TransactionDetailView extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    __DEV__ && console.log('TransactionDetailView componentWillUnmount');
  }

  componentDidMount() {
    __DEV__ && console.log('TransactionDetailView componentDidMount');
    //this.props.RefeshPage(!this.props.app.stateapp)
  }

  render() {
    return <View></View>;
  }
}

export default TransactionDetailView;
