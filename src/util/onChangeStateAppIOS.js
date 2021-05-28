import PropTypes from 'prop-types';
import {requireNativeComponent, View} from 'react-native';

var iAppStateView = {
  name: 'AppStateView',
  propTypes: {
    onAppStateChange: PropTypes.func,
    // ...ViewPropTypes
  },
};

module.exports = requireNativeComponent('AppStateView', iAppStateView);
