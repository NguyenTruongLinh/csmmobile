import React from 'react';
import PropTypes from 'prop-types';
import { requireNativeComponent } from 'react-native';

class I3VideoNativeView extends React.Component {
  render() {
    return <I3VideoNative {...this.props} />;
  }
}

I3VideoNativeView.propTypes = {
  /**
   * When this property is set to `true` and a valid camera is associated
   * with the map, the camera’s pitch angle is used to tilt the plane
   * of the map. When this property is set to `false`, the camera’s pitch
   * angle is ignored and the map is always displayed as if the user
   * is looking straight down onto it.
   */
  isImage: PropTypes.array,
  serverVersion: PropTypes.number,
  isStop: PropTypes.bool
};

var I3VideoNative = requireNativeComponent('I3VideoNative', I3VideoNativeView);
module.exports = I3VideoNativeView;