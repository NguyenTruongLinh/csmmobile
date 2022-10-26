'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Image,
  ImageBackground,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import apiService from '../../services/api';
import {isNullOrUndef, stringtoBase64} from '../util/general';

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
  };

  static defaultProps = {
    styles: {},
    styleImage: {},
    twoStepsLoading: false,
    isBackground: false,
    showLoading: true,
    visible: true,
  };

  loadImage = async () => {
    const {domain, source, twoStepsLoading, dataSource, defaultImage} =
      this.props;

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

          if (pathResponse && !pathResponse.isCloud) {
            if (pathResponse.isExist) {
              if (pathResponse.url_thumnail) {
                const dataPath = stringtoBase64(pathResponse.url_thumnail);
                response = await apiService.getBase64Stream(
                  File.controller,
                  dataPath
                );

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
      styles: style,
      styleImage,
      resizeMode,
      isBackground,
      children,
      showLoading,
      visible,
    } = this.props;
    const {isLoading, image} = this.state;
    if (image && image.uri && image.uri.uri) image.uri = image.uri.uri;

    return (
      <View style={style}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            animating={true}
            style={styles.loadingIcon}
            size="small"
            color="white" // "#039BE5"
          />
        </View>
        {isLoading && showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              animating={true}
              style={styles.loadingIcon}
              size="small"
              color="white" // "#039BE5"
            />
          </View>
        ) : isBackground ? (
          <ImageBackground
            style={styleImage}
            imageStyle={{opacity: visible ? 1 : 0}}
            source={image}
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingIcon: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CMSImage;
