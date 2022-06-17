'use strict';

// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import util from '../../util/general';
const Timer_Get_Image = 1;

// <!-- END MODULES -->
// ----------------------------------------------------

class AlarmThumb extends React.Component {
  static propTypes = {
    type: PropTypes.string,
    icon: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    text: PropTypes.string,
    onPress: PropTypes.func,
    styles: Image.propTypes.style,
    src: PropTypes.string,
    onLoad: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      image: null,
      isloading: true,
    };
  }

  componentWillUnmount() {
    // this.clearTimerImage();
  }

  componentDidMount() {
    let {data} = this.props;
    //this.InitTimerImage();
    // __DEV__ && console.log('GOND Alarm thumb didmount:', this.viewRef);
    if (this.viewRef) {
      this.setState({isloading: true});
      this.loadImage(data);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id != this.props.id) {
      setTimeout(() => {
        if (this.viewRef) {
          this.setState({isloading: true});
          this.loadImage(this.props.data);
        }
      }, 1);
    }
  }

  // clearImageInterval = () => {
  //   if (this.imageLoadingInterval) {
  //     clearTimeout(this.imageLoadingInterval);
  //   }
  // };

  // initImageInterval = () => {
  //   this.clearTimerImage();
  //   this.imageLoadingInterval = setInterval(() => {
  //     let {data} = this.props;
  //     this.setState({isloading: true});
  //     this.loadImage(data);
  //   }, Timer_Get_Image);
  // };

  loadImage = async data => {
    __DEV__ && console.log('GOND Alarm load thumb:');
    if (!data) return;
    if (data.thumb) {
      __DEV__ && console.log('GOND Alarm load thumb: catch');
      let {imgsize} = this.props;
      let cachedImg = data.thumb;
      if (typeof cachedImg.url_thumnail == 'number') {
        if (this.viewRef) {
          this.setState({image: cachedImg.url_thumnail, isloading: false});
        }
      } else {
        if (cachedImg.isCloud) {
          if (this.viewRef) {
            this.setState({
              image: {uri: cachedImg.url_thumnail, ...imgsize},
              isloading: false,
            });
          }
        } else {
          if (this.viewRef) {
            this.setState({
              image: {
                uri: 'data:image/jpeg;base64,' + cachedImg.base64_thumnail,
                ...imgsize,
              },
              isloading: false,
            });
          }
        }
      }
      return;
    }

    if (this.props.onLoad) {
      let res = await this.props.onLoad(data);
      // __DEV__ && console.log('GOND Alarm load thumb: loaded', res);
      data.setThumbnail(res);
      // __DEV__ && console.log('GOND Alarm load thumb: onLoad ', data.thumb);
      let {imgsize} = this.props;
      if (res && res.isCloud == true) {
        let url = res.url_thumnail;
        if (this.viewRef) {
          this.setState({image: {uri: url, ...imgsize}, isloading: false});
        }
      } else {
        if (typeof res.url_thumnail == 'number') {
          if (this.viewRef) {
            this.setState({image: res.url_thumnail, isloading: false});
          }
        } else {
          if (this.viewRef) {
            this.setState({
              image: {
                uri: 'data:image/jpeg;base64,' + res.base64_thumnail,
                ...imgsize,
              },
              isloading: false,
            });
          }
        }
      }
    }
  };

  GetImageComplete(param, data) {
    if (this.props.DataCompleteHandler && data)
      this.props.DataCompleteHandler(param, data);
  }

  render() {
    const {type, color, size, onPress, styles, domain, imageStyle, imgsize} =
      this.props;

    return (
      <View style={styles} ref={r => (this.viewRef = r)}>
        {this.state.isloading == false ? (
          <Image style={[imageStyle, imgsize]} source={this.state.image} />
        ) : (
          <ActivityIndicator animating={true} size="small" color="#039BE5" />
        )}
      </View>
    );
  }
}

// const styles_Com = StyleSheet.create({

// });

module.exports = AlarmThumb;
