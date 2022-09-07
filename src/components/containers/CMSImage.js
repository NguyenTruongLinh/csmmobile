'use strict';

import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import {View, Image, ImageBackground, ActivityIndicator} from 'react-native';
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
    isBackground: PropTypes.bool,
    showLoading: PropTypes.bool,
    visible: PropTypes.bool,
    // dataSource: PropTypes.string,
    // defaultImage: PropTypes.object,
  };

  static defaultProps = {
    styles: {},
    styleImage: {},
    twoStepsLoading: false,
    isBackground: false,
    showLoading: true,
    visible: true,
    // dataSource: PropTypes.string,
    // defaultImage: PropTypes.object,
  };

  loadImage = async () => {
    const {
      domain,
      source,
      twoStepsLoading,
      // srcUrl,
      dataSource,
      defaultImage,
    } = this.props;
    // if (srcUrl && isValidHttpUrl(srcUrl)) {
    if (dataSource && dataSource.length > 0) {
      this.setState({
        isLoading: false,
        image: {uri: dataSource},
      });
      __DEV__ && console.log('GOND CMSImage loadImage return 1');
      return;
    }

    this.setState({isLoading: true, image: defaultImage});
    let imgData = await this.loadImageAsync(
      domain,
      source,
      defaultImage,
      twoStepsLoading
    );
    // __DEV__ && console.log('GOND CMSImage completed imgData =', imgData);
    if (this._isMounted) {
      this.onLoadingCompleted(domain, imgData);
      this.setState(
        imgData
          ? {
              isLoading: false,
              image: imgData.url_thumnail
                ? {uri: imgData.url_thumnail}
                : imgData,
            }
          : {isLoading: false}
      );
    }
  };

  /**
   *
   * @param {object} data
   * @param {string} source
   * @returns
   */
  loadImageAsync = async (data, source, defaultImage, isTwoSteps) => {
    // __DEV__ && console.log('GOND loadImageAsync, source: ', source);
    if (source) {
      return {uri: 'data:image/jpeg;base64,' + this.props.source};
    } else {
      if (isNullOrUndef(data)) {
        __DEV__ && console.log('GOND CMSImage loadImage return 2');
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
          // console.log('GOND loadImageAsync step 1 res = ', pathResponse);

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
        // __DEV__ && console.log('GOND CMSImage loadImageAsync res = ', response);
        let imgbase64 =
          response.data && response.data != 'null' ? response.data : null;
        if (imgbase64) return {uri: 'data:image/jpeg;base64,' + imgbase64};
        else return defaultImage ? null : noImage;
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
    if (this.props.domain.id != prevProps.domain.id) {
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
    const {
      styles,
      styleImage,
      resizeMode,
      isBackground,
      children,
      showLoading,
      visible,
    } = this.props;
    const {isLoading, image} = this.state;
    // __DEV__ && console.log('GOND CMSImage render: ', isLoading, image);
    if (image && image.uri && image.uri.uri) image.uri = image.uri.uri;

    return (
      <View style={styles}>
        {/* <Fragment> */}
        {isLoading && showLoading ? (
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
            color="white" // "#039BE5"
          />
        ) : isBackground ? (
          <ImageBackground
            style={styleImage}
            source={visible ? image : null}
            resizeMode={resizeMode}
            children={children}
          />
        ) : (
          <Image
            style={styleImage}
            source={visible ? image : null}
            resizeMode={resizeMode}
          />
        )}
        {/* </Fragment> */}
      </View>
    );
  }
}

export default CMSImage;
