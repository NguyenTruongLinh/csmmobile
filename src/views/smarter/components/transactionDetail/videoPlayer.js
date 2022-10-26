import React from 'react';
import {Dimensions, View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';
import VideoPlayer from 'react-native-video-player';

import {videoH, videoW, ViewModes} from '../../styles/transactionDetailStyles';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const fullscreenVideoW = SCREEN_HEIGHT;
const fullscreenVideoH = SCREEN_WIDTH;

class VideoPlayerView extends React.Component {
  static PropTypes = {
    viewMode: PropTypes.number,
    onViewVideo: PropTypes.func,
  };

  static defaultProps = {
    viewMode: ViewModes.normal,
    onViewVideo: () => {},
  };

  render() {
    const {exceptionStore, viewMode, onViewVideo} = this.props;
    const {selectedTransaction} = exceptionStore;
    const width =
      viewMode === ViewModes.fullscreenVideo ? fullscreenVideoW : videoW;
    const height =
      viewMode === ViewModes.fullscreenVideo ? fullscreenVideoH : videoH;

    return (
      <View style={{height, width}}>
        <VideoPlayer
          video={
            selectedTransaction.media
              ? {uri: selectedTransaction.media}
              : undefined
          }
          videoWidth={width}
          videoHeight={height}
          poster={
            selectedTransaction.snapshot.uri
              ? selectedTransaction.snapshot.uri
              : selectedTransaction.snapshot
          }
          resizeMode={'stretch'}
          disableControlsAutoHide
          muted
          autoplay
          fullScreenHandler={onViewVideo}
          showDuration={true}
        />
      </View>
    );
  }
}

export default inject('exceptionStore')(observer(VideoPlayerView));
