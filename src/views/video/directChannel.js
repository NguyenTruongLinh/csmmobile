import React, {Fragment} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';

import CMSImage from '../../components/containers/CMSImage';

import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';

import {NATURAL_RATIO} from '../../consts/video';
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
      // nextFrame: NVR_Play_NoVideo_Image,
      nextFrame: null,
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

  renderContent = videoShowed => {
    const {width, height, serverInfo, noVideo, videoStore} = this.props;
    // const {message, videoLoading, noVideo} = this.state;
    const {connectionStatus /*, isLoading*/, videoFrame} = serverInfo;
    const {nextFrame} = this.state;
    const isLoading = !noVideo && (!videoFrame || videoFrame.length == 0);
    // __DEV__ &&
    //   console.log(
    //     'GOND direct render channel: ',
    //     serverInfo.channelName,
    //     videoFrame ? videoFrame.length : 'null'
    //   );

    return (
      <Fragment>
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
          {videoShowed && (
            <Image
              // source={serverInfo.videoImage}
              source={nextFrame ?? serverInfo.snapshot}
              style={{
                width: width,
                height: height,
              }}
              fadeDuration={0}
              resizeMode="cover"
            />
          )}
        </View>
      </Fragment>
    );
  };

  render() {
    const {width, height, serverInfo, noVideo, videoStore} = this.props;
    // const {message, videoLoading, noVideo} = this.state;
    // const {connectionStatus, isLoading} = serverInfo;
    // const {nextFrame} = this.state;
    // if (!this.isViewable) return <View />;
    // __DEV__ &&
    //   console.log('GOND direct render channel: ', serverInfo.videoImage);
    const videoShowed =
      !noVideo && serverInfo.videoFrame && serverInfo.videoFrame.length > 0;
    const content = this.renderContent(videoShowed);
    return (
      <View
        onLayout={this.onLayout}
        // {...this.props}
        style={{
          width: '100%',
          height: '100%',
        }}>
        {videoShowed ? (
          <ImageBackground
            source={noVideo ? serverInfo.snapshot : serverInfo.videoImage}
            style={{
              width: width,
              height: height,
            }}
            resizeMode="cover">
            {content}
          </ImageBackground>
        ) : (
          <CMSImage
            isBackground={true}
            dataSource={serverInfo.snapshot}
            defaultImage={NVR_Play_NoVideo_Image}
            resizeMode="cover"
            showLoading={false}
            styleImage={{width: width, height: height}}
            dataCompleteHandler={(param, data) =>
              serverInfo.channel && serverInfo.channel.saveSnapshot(data)
            }
            domain={{
              controller: 'channel',
              action: 'image',
              id: serverInfo.kChannel,
            }}>
            {content}
          </CMSImage>
        )}
      </View>
    );
  }
}

export default inject('videoStore')(observer(DirectChannelView));
