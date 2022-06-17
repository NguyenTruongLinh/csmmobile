import PropTypes from 'prop-types';
import {requireNativeComponent, View} from 'react-native';

const iAppStateView = {
  name: 'AppStateView',
  propTypes: {
    onAppStateChange: PropTypes.func,
    // ...ViewPropTypes
  },
};

module.exports = requireNativeComponent('AppStateView', iAppStateView);
