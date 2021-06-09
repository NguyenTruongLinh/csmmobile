'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {View, Image, ActivityIndicator} from 'react-native';

import apiService from '../../services/api';
import {isNullOrUndef} from '../util/general';

class CMSImage extends React.Component {
  constructor(props) {
    super(props);
    __DEV__ && console.log('GOND CMSImage styleImage = ', props.styleImage);
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
        let imgbase64 = resposne.data || '';
        if (imgbase64) return {uri: 'data:image/jpeg;base64,' + imgbase64};
        else return data.no_img;
      } else return data;
    }
  };

  onLoadingCompleted(param, imgData) {
    if (this.props.dataCompleteHandler && data && this._isMounted)
      this.props.dataCompleteHandler(param, data);
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
    const {styles, styleImage} = this.props;

    return (
      <View style={styles}>
        {this.state.isLoading ? (
          <ActivityIndicator
            animating={true}
            style={[{height: 20, paddingTop: 10}]}
            size="small"
            color="#039BE5"
          />
        ) : (
          <Image style={[styleImage]} source={this.state.image} />
        )}
      </View>
    );
  }
}

module.exports = CMSImage;
