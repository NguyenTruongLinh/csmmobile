import React from 'react';
import {View, requireNativeComponent} from 'react-native';
import PropTypes from 'prop-types';
// import {View} from 'react-native-animatable';
// const ViewPropTypes = require('ViewPropTypes');

const IFFMpegFrameView = requireNativeComponent('FFMpegFrameViewManager');

class FFMpegFrameView extends React.Component {
  setNativeProps = props => {
    if (this.nativeRef) this.nativeRef.setNativeProps(props);
  };

  render() {
    return (
      <IFFMpegFrameView
        ref={component => (this.nativeRef = component)}
        {...this.props}
      />
    );
  }
}

FFMpegFrameView.propTypes = {
  data: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  start: PropTypes.object,
  stop: PropTypes.number,
  exit: PropTypes.number,
  pause: PropTypes.number,
  firstrun: PropTypes.number,
  fullscreen: PropTypes.number,
  UpdateFrame: PropTypes.func,
  Live: PropTypes.func,
  seekpos: PropTypes.string,
  src: PropTypes.string,
  hdmode: PropTypes.number,
  ...View.propTypes,
};

module.exports = FFMpegFrameView;
