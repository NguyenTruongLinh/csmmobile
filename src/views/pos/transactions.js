import React, {Component} from 'react';
import {
  View,
  FlatList,
  Text,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  BackHandler,
} from 'react-native';

const Flag_Distance_Offset = 5;
// const options = [
//   <IconCustom name="view-list-button" size={10} color="#212121" />,
//   <IconCustom
//     name="two-rows-and-three-columns-layout"
//     size={10}
//     color="#212121"
//   />,
// ];

class ExceptionsView extends Component {
  static defaultProps = {
    Transactions: {Data: []},
  };

  constructor(props) {
    super(props);
  }

  // handleBack =()=>{
  //   let  isSearchBar = this.state.isSearchBar;
  //   if( isSearchBar)
  //   {
  //     if(this.searchBar_Tran)
  //       this.searchBar_Tran.hide();
  //     if(this.refs && this.refs.search_tran_view)
  //       this.refs.search_tran_view.fadeOutRight(500);

  //     this.setState({isSearchBar: false});
  //     return true;
  //   }
  //   return false;
  // }

  componentWillUnmount() {
    __DEV__ && console.log('ExceptionsView componentDidMount');
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
  }

  componentDidMount() {
    __DEV__ && console.log('ExceptionsView componentWillUnmount');
  }

  render() {
    return <View></View>;
  }
}

export default ExceptionsView;
