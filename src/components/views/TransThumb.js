'use strict';

// ----------------------------------------------------
// <!-- START MODULES -->
import React from 'react';
import PropTypes from 'prop-types';
import {View, Image, ActivityIndicator} from 'react-native';
import {observer} from 'mobx-react';

import {No_Image} from '../../consts/images';
// <!-- END MODULES -->
// ----------------------------------------------------

class TransThumb extends React.Component {
  constructor(props) {
    super(props);
  }

  //const TYPES = ['circle', 'square'];
  static propTypes = {
    onPress: PropTypes.func,
    containerStyle: PropTypes.object,
    containerStyle: PropTypes.object,
    data: PropTypes.object,
  };

  /*
  loadImage = async (data) => {
    //await this.LoadImageAsync( data, format);}
    if (!data) return;
    let {catchname} = this.props;
    if (catchname && _.has(data, catchname) && data[catchname]) {
      let {imageSize} = this.props;
      let catche = data[catchname];
      if (_.isNumber(catche.url_thumnail) == false) {
        if (catche.isCloud)
          this.setState({
            image: {uri: catche.url_thumnail, ...imageSize},
            isloading: false,
          });
        else
          this.setState({
            image: {
              uri: 'data:image/jpeg;base64,' + catche.base64_thumnail,
              ...imageSize,
            },
            isloading: false,
          });
      } else this.setState({image: catche.url_thumnail, isloading: false});
      return;
    }
    if (this.props.onLoad) {
      let ret = await this.props.onLoad(data);
      if (catchname) data[catchname] = ret;
      let {imageSize} = this.props;
      if (ret && ret.isCloud == true) {
        var url = ret.url_thumnail;

        this.setState({image: {uri: url, ...imageSize}, isloading: false});
      } else {
        if (_.isNumber(ret.url_thumnail) == false)
          this.setState({
            image: {
              uri: 'data:image/jpeg;base64,' + ret.base64_thumnail,
              ...imageSize,
            },
            isloading: false,
          });
        else this.setState({image: ret.url_thumnail, isloading: false});
      }
    }
  };
  */

  render() {
    const {containerStyle, imageStyle, imageSize, data, resizeMode} =
      this.props;
    const {image, isLoading} = data;

    let imageSource = null;

    // __DEV__ && console.log('GOND transthumb: ', image);
    if (image) {
      if (image.url_thumnail && typeof image.url_thumnail == 'number') {
        imageSource = image.url_thumnail;
      } else {
        imageSource = {
          uri: 'data:image/jpeg;base64,' + image.base64_thumnail,
          ...imageSize,
        };
      }
    } else {
      imageSource = No_Image;
    }

    return (
      <View style={containerStyle}>
        {isLoading ? (
          <ActivityIndicator animating={true} size="small" color="#039BE5" />
        ) : (
          <Image style={[imageStyle, imageSize]} source={imageSource} />
        )}
      </View>
    );
  }
}

export default observer(TransThumb);
