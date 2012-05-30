//import { PropTypes } from 'react';
import PropTypes from 'prop-types';
import {requireNativeComponent, View} from 'react-native';
// const ViewPropTypes = require('ViewPropTypes');

const iAppStateView = {
  name: 'AppStateView',
  propTypes: {
    onAppStateChange: PropTypes.func,
    // ...ViewPropTypes
  },
};

module.exports = requireNativeComponent('AppStateView', iAppStateView);
