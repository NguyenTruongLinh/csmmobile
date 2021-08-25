// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, Text, Image} from 'react-native';
import {inject, observer} from 'mobx-react';

import CMSStyleSheet from '../../components/CMSStyleSheet';

// const Icon = CMSStyleSheet.Icon;
const IconCustom = CMSStyleSheet.IconCustom;

class HomeView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (__DEV__) console.log('Home componentDidMount');
    const {appStore} = this.props;
    appStore.naviService && appStore.naviService.onReady();
  }

  render() {
    return <View></View>;
  }
}

export default inject('appStore')(observer(HomeView));
