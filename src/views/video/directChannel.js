import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  Dimensions,
  Platform,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  ActivityIndicator,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';
import {DateTime} from 'luxon';

import FFMpegFrameView from '../../components/native/videonative';
import FFMpegFrameViewIOS from '../../components/native/videoios';

import util from '../../util/general';
import {numberValue} from '../../util/types';
import CMSColors from '../../styles/cmscolors';
import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';
import {NATIVE_MESSAGE} from '../../consts/video';
import {CALENDAR_DATE_FORMAT, NVRPlayerConfig} from '../../consts/misc';

import {Login as LoginTxt, VIDEO as VIDEO_TXT} from '../../localization/texts'; //'../../localization/texts';
import cmscolors from '../../styles/cmscolors';

import {
  Video_State,
  Limit_Time_Allow_Change_Live_Search,
  NATURAL_RATIO,
} from '../../consts/video';
import {STREAM_STATUS} from '../../localization/texts';

class DirectChannelView extends React.Component {
  static defaultProps = {
    enableSwitchChannel: true,
    serverInfo: {},
  };

  constructor(props) {
    super(props);

    this.state = {
      width: props.width,
      height: props.height,
      nextFrame: NVR_Play_NoVideo_Image,
    };
    // should set search time from alert/exception
    this.reactions = [];
    this.isPlaying = false;
    // this.isViewable = false;
  }

  componentDidMount() {
    this._isMounted = true;
    __DEV__ && console.log('DirectChannelView componentDidMount');
    const {index, singlePlayer, videoStore} = this.props;

    // const renderLimit = videoStore.gridLayout * (videoStore.gridLayout + 1);
    // __DEV__ &&
    //   console.log('DirectStreamingView renderLimit: ', renderLimit, index);

    // if (singlePlayer || index < renderLimit) {
    //   this.isViewable = true;
    // }
    // reactions:
    this.initReactions();
  }

  componentWillUnmount() {
    __DEV__ &&
      console.log(
        'DirectStreamingView componentWillUnmount: ',
        this.props.serverInfo.channelName
      );

    // this.setNative({disconnect: true}, true);
    this._isMounted = false;
    this.reactions.forEach(unsubsribe => unsubsribe());
  }

  initReactions = () => {
    const {videoStore, serverInfo} = this.props;

    this.reactions = [
      reaction(
        () => serverInfo.videoImage,
        frame =>
          setTimeout(() => {
            if (this._isMounted) this.setState({nextFrame: frame});
          }, 100)
      ),
    ];
  };

  onLayout = event => {
    if (event == null || event.nativeEvent == null) return;
    // __DEV__ &&
    //   console.log('GOND directplayer onlayout: ', event.nativeEvent.layout);
    let {width, height} = event.nativeEvent.layout;
    setTimeout(() => {
      if (!this._isMounted) return;

      if (width <= height) {
        const videoRatio = width / height;
        if (videoRatio !== NATURAL_RATIO) {
          // height = parseInt((width * 9) / 16);
          width = parseInt((height * 16) / 9);
          //console.log( _height);
        }
      }
      this.setState({
        // controller: false,
        // fullscreen: true,
        width: width,
        height: height,
        status: '',
      });
    }, 100);
  };

  // setViewable = isViewable => {
  //   this.isViewable = isViewable;
  // };

  render() {
    const {width, height, serverInfo, noVideo, videoStore} = this.props;
    // const {message, videoLoading, noVideo} = this.state;
    const {connectionStatus, isLoading} = serverInfo;
    const {nextFrame} = this.state;
    // if (!this.isViewable) return <View />;
    // __DEV__ &&
    //   console.log('GOND direct render channel: ', serverInfo.channelName);

    return (
      <View
        onLayout={this.onLayout}
        // {...this.props}
        style={{
          width: '100%',
          height: '100%',
        }}>
        <ImageBackground
          source={noVideo ? NVR_Play_NoVideo_Image : serverInfo.videoImage}
          // source={noVideo ? NVR_Play_NoVideo_Image : nextFrame}
          style={{
            width: width,
            height: height,
          }}
          // width="100%"
          // height="100%"
          resizeMode="cover">
          <Text
            style={[
              styles.channelInfo,
              {
                top: videoStore.isFullscreen ? '10%' : 0,
              },
            ]}>
            {serverInfo.channelName ?? 'Unknown'}
          </Text>
          <View style={styles.statusView}>
            <View style={styles.textContainer}>
              <Text style={[styles.textMessage]}>{connectionStatus}</Text>
            </View>
            {isLoading && (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="large"
                color="white"
              />
            )}
          </View>
          <View style={styles.playerView}>
            {noVideo ? null : (
              <Image
                // source={serverInfo.videoImage}
                source={nextFrame}
                style={{
                  width: width,
                  height: height,
                }}
                fadeDuration={0}
                // width="100%"
                // height="100%"
                resizeMode="cover"
              />
            )}
          </View>
        </ImageBackground>
      </View>
    );
  }
}

export default inject('videoStore')(observer(DirectChannelView));
