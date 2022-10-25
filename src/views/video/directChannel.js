import React, {Fragment} from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {reaction} from 'mobx';

import CMSImage from '../../components/containers/CMSImage';

import styles from '../../styles/scenes/videoPlayer.style';
import {NVR_Play_NoVideo_Image} from '../../consts/images';

import {NATURAL_RATIO} from '../../consts/video';

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
      nextFrame: null,
    };
    this.reactions = [];
    this.isPlaying = false;
  }

  componentDidMount() {
    this._isMounted = true;
    __DEV__ && console.log('DirectChannelView componentDidMount');

    this.initReactions();
  }

  componentWillUnmount() {
    __DEV__ &&
      console.log(
        'DirectStreamingView componentWillUnmount: ',
        this.props.serverInfo.channelName
      );

    this._isMounted = false;
    this.reactions.forEach(unsubsribe => unsubsribe());
  }

  initReactions = () => {
    const {serverInfo} = this.props;

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
    let {width, height} = event.nativeEvent.layout;
    setTimeout(() => {
      if (!this._isMounted) return;

      if (width <= height) {
        const videoRatio = width / height;
        if (videoRatio !== NATURAL_RATIO) {
          width = parseInt((height * 16) / 9);
        }
      }
      this.setState({
        width: width,
        height: height,
        status: '',
      });
    }, 100);
  };

  renderContent = videoShowed => {
    const {width, height, serverInfo, noVideo, videoStore} = this.props;
    const {connectionStatus, isLoading, videoFrame} = serverInfo;
    const {nextFrame} = this.state;

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
          {!noVideo && isLoading && (!videoFrame || videoFrame.length == 0) && (
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
    const {width, height, serverInfo, noVideo} = this.props;

    const videoShowed =
      !noVideo && serverInfo.videoFrame && serverInfo.videoFrame.length > 0;
    const content = this.renderContent(videoShowed);
    return (
      <View onLayout={this.onLayout} style={styleSheet.container}>
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

const styleSheet = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});

export default inject('videoStore')(observer(DirectChannelView));
