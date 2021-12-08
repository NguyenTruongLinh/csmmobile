'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {View, Image, ActivityIndicator} from 'react-native';
import CryptoJS from 'crypto-js';

import apiService from '../../services/api';
import {isNullOrUndef, isValidHttpUrl, stringtoBase64} from '../util/general';

import {File, CommonActions} from '../../consts/apiRoutes';
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

  static propTypes = {
    styles: PropTypes.object,
    styleImage: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.arrayOf(PropTypes.object),
    ]),
    twoStepsLoading: PropTypes.bool,
  };

  loadImage = async () => {
    const {domain, source, twoStepsLoading, srcUrl} = this.props;
    if (srcUrl && isValidHttpUrl(srcUrl)) {
      this.setState({
        isLoading: false,
        image: {uri: srcUrl},
      });
      return;
    }

    this.setState({isLoading: true});
    let imgData = await this.loadImageAsync(domain, source, twoStepsLoading);
    __DEV__ && console.log('GOND loadImage imgData =', imgData);
    if (this._isMounted) {
      this.onLoadingCompleted(domain, imgData);
      this.setState({
        isLoading: false,
        image: imgData.url_thumnail ? {uri: imgData.url_thumnail} : imgData,
      });
    }
  };

  /**
   *
   * @param {object} data
   * @param {string} source
   * @returns
   */
  loadImageAsync = async (data, source, isTwoSteps) => {
    // __DEV__ && console.log('GOND loadImageAsync, source: ', source);
    if (source) {
      return {uri: 'data:image/jpeg;base64,' + this.props.source};
    } else {
      if (isNullOrUndef(data)) {
        return null;
      }

      if (typeof data == 'object') {
        let response = {};
        const noImage = data.no_img ?? No_Image;

        if (isTwoSteps) {
          let pathResponse = await apiService.get(
            data.controller,
            data.id,
            CommonActions.image
          );
          // __DEV__ &&
          //   console.log('GOND loadImageAsync step 1 res = ', pathResponse);

          if (pathResponse && !pathResponse.isCloud) {
            if (pathResponse.isExist) {
              if (pathResponse.url_thumnail) {
                // const dataPath = CryptoJS.enc.Base64.stringify(
                //   CryptoJS.enc.Utf8.parse(pathResponse.url_thumnail)
                // );
                const dataPath = stringtoBase64(pathResponse.url_thumnail);
                response = await apiService.getBase64Stream(
                  File.controller,
                  dataPath
                );

                // __DEV__ &&
                //   console.log('GOND loadImageAsync step 2 res = ', response);
                if (response.data)
                  return {
                    ...pathResponse,
                    url_thumnail: {
                      uri: 'data:image/jpeg;base64,' + response.data,
                    },
                  };
              }
            }
          } else if (pathResponse.isCloud == true) {
            return pathResponse;
          }
        } else {
          response = await apiService.getBase64Stream(
            data.controller,
            data.id,
            data.action,
            data.param
          );
        }
        // __DEV__ && console.log('GOND loadImageAsync res = ', response);
        let imgbase64 = response.data;
        if (imgbase64) return {uri: 'data:image/jpeg;base64,' + imgbase64};
        else return noImage;
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
