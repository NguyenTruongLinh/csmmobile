// import React from 'react';
import PropTypes from 'prop-types';
import {requireNativeComponent} from 'react-native';
// const ViewPropTypes = require('ViewPropTypes');

const iFFMpegFrameView = {
  name: 'FFMpegFrameView',
  propTypes: {
    data: PropTypes.array,
    width: PropTypes.number,
    height: PropTypes.number,
    start: PropTypes.string,
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
    stretch: PropTypes.boolean,
    onFFMPegFrameChange: PropTypes.func,
    scaleXY: PropTypes.number,
    scaleXYZ: PropTypes.number,
    translateX: PropTypes.number,
    translateY: PropTypes.number,
    // ...ViewPropTypes
  },
};

const FFMpegFrameViewIOS = requireNativeComponent(
  'FFMpegFrameView',
  iFFMpegFrameView
);

module.exports = FFMpegFrameViewIOS;
