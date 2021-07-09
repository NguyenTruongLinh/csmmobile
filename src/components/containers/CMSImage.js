'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {View, Image, ActivityIndicator} from 'react-native';

import apiService from '../../services/api';
import {isNullOrUndef} from '../util/general';
import {No_Image} from '../../consts/images';

class CMSImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image: null,
      isLoading: true,
      id: null,
    };
    this._isMounted = false;
  }

  // static propTypes = {
  //   styles: PropTypes.style,
  //   styleImage: PropTypes.style,
  // };

  loadImage = async () => {
    const {domain, source} = this.props;
    this.setState({isLoading: true});
    let imgData = await this.loadImageAsync(domain, source);
    if (this._isMounted) {
      this.onLoadingCompleted(domain, imgData);
      this.setState({isLoading: false, image: imgData});
    }
  };

  /**
   *
   * @param {object} data
   * @param {string} source
   * @returns
   */
  loadImageAsync = async (data, source) => {
    // __DEV__ && console.log('GOND loadImageAsync, source: ', source);
    if (source) {
      return {uri: 'data:image/jpeg;base64,' + this.props.source};
    } else {
      if (isNullOrUndef(data)) {
        return null;
      }
      if (typeof data == 'object') {
        let resposne = await apiService.getBase64Stream(
          data.controller,
          data.id,
          data.action,
          data.param
        );
        // __DEV__ && console.log('GOND loadImageAsync res = ', resposne);
        let imgbase64 = resposne.data || '';
        if (imgbase64) return {uri: 'data:image/jpeg;base64,' + imgbase64};
        else return data.no_img ?? No_Image;
      } else return data;
    }
  };

  onLoadingCompleted(param, imgData) {
    if (this.props.dataCompleteHandler && imgData && this._isMounted)
      this.props.dataCompleteHandler(param, imgData);
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadImage();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.id != prevProps.id) {
      if (apiService || this.props.source) {
        this.loadImage();
      } else {
        this.setState({
          image: null,
        });
      }
    }
  }

  render() {
    const {styles, styleImage, resizeMode} = this.props;
    const {image} = this.state;
    // __DEV__ && console.log('GOND render CMSImage: ', image);

    return (
      <View style={styles}>
        {this.state.isLoading ? (
          <ActivityIndicator
            animating={true}
            style={{
              height: 20,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            size="small"
            color="#039BE5"
          />
        ) : (
          <Image style={styleImage} source={image} resizeMode={resizeMode} />
        )}
      </View>
    );
  }
}

export default CMSImage;
