import PropTypes from 'prop-types';
import {requireNativeComponent, View} from 'react-native';

const iface = {
  name: 'GraphicView',
  propTypes: {
    data: PropTypes.array,
    widthScreen: PropTypes.number,
    heightScreen: PropTypes.number,
    channelId: PropTypes.number,
    svVersion: PropTypes.number,
    ...View.propTypes,
  },
};

// const iFFMpegFrameView = {
//   name: 'FFMpegFrameView',
//   propTypes: {
//     data: PropTypes.array,
//     width: PropTypes.number,
//     height: PropTypes.number,
//     start: PropTypes.string,
//     stop: PropTypes.number,
//     exit: PropTypes.number,
//     pause: PropTypes.number,
//     firstrun: PropTypes.number,
//     fullscreen:PropTypes.number,
//     UpdateFrame: PropTypes.func,
//     Live: PropTypes.func,
//     seekpos: PropTypes.string,
//     src: PropTypes.string,
//     hdmode:PropTypes.number,
//     ...View.propTypes,
//   }
// };

// module.exports = requireNativeComponent('FFMpegFrameViewManager', iFFMpegFrameView);
// module.exports = requireNativeComponent('RenderImageModule', iface);
