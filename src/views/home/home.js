// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, Text, Image} from 'react-native';
import {connect} from 'react-redux';
import {createIconSetFromFontello} from 'react-native-vector-icons';
import fontelloConfig from '../../components/common/fontello/config.json';
const IconCustom = createIconSetFromFontello(fontelloConfig);

class HomeView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (__DEV__) console.log('Home componentDidMount');
  }

  render() {
    return <View></View>;
  }
}

export default HomeView;
