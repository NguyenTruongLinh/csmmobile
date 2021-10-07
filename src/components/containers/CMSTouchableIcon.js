'use strict';

// ----------------------------------------------------
// <!-- START MODULES -->
import React from 'react';
import PropTypes from 'prop-types';
import {View, Image} from 'react-native';

import {Icon, IconCustom, MaterialIcons} from '../CMSStyleSheet';
import Ripple from 'react-native-material-ripple';
import cmscolors from '../../styles/cmscolors';

// <!-- END MODULES -->
// ----------------------------------------------------
const PRESS_DELAY_TIME = 1000;

class CMSTouchableIcon extends React.Component {
  //const TYPES = ['circle', 'square'];
  static propTypes = {
    type: PropTypes.string,
    icon: PropTypes.string,
    iconCustom: PropTypes.string,
    iconMaterial: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    onPress: PropTypes.func,
    styles: Image.propTypes.style,
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    type: 'circle',
    size: 40,
    styles: {},
    isscale: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      disabled: props.disabled,
    };

    this.onPressTimeout = null;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {disabled} = nextProps;
    if (disabled != prevState.disabled) {
      // __DEV__ && console.log('GOND TouchIcon get disbaled: ', disabled);
      return {disabled};
    }
    return {};
  }

  // componentDidUpdate(prevProps) {
  //   if (prevProps.disabled != this.props.disabled && this.onPressTimeout) {
  //     __DEV__ && console.log('GOND TouchIcon cancel Timeout');
  //     clearTimeout(this.onPressTimeout);
  //     this.onPressTimeout = null;
  //   }
  // }

  getCubes(size) {
    let borderRd;
    switch (this.props.type) {
      case 'circle':
        borderRd = size / 2;
        break;
      case 'square':
        borderRd = 0;
        break;
      default:
        borderRd = 0;
    }
    return {
      width: size,
      height: size,
      borderRadius: borderRd,
    };
  }

  onPress = () => {
    const {onPress} = this.props;

    this.setState({disabled: true}, () => {
      onPress();

      this.onPressTimeout = setTimeout(() => {
        // __DEV__ && console.log('GOND TouchIcon onPressTimeout');
        if (this.state.disabled && !this.props.disabled) {
          // __DEV__ && console.log('GOND TouchIcon onPressTimeout >>>');
          this.setState({disabled: false});
        }
      }, PRESS_DELAY_TIME);
    });
  };

  render() {
    const {
      icon,
      iconCustom,
      iconMaterial,
      color,
      size,
      image,
      // onPress,
      styles,
      isHidden,
      disabledColor,
    } = this.props;

    const {disabled} = this.state;
    // __DEV__ &&
    //   console.log('GOND touch icon color: ', color, ', disabled: ', disabled);

    let content;
    if (image) {
      content = React.cloneElement(image, {
        style: [styles, this.getCubes(size)],
      });
    } else if (icon) {
      content = (
        <View style={[styles]}>
          <Icon
            color={
              disabled ? disabledColor ?? cmscolors.DisabledIconButton : color
            }
            size={size}
            name={icon}
          />
        </View>
      );
    } else if (iconCustom) {
      content = (
        <View style={[styles]}>
          <IconCustom
            color={
              disabled ? disabledColor ?? cmscolors.DisabledIconButton : color
            }
            size={size}
            name={iconCustom}
          />
        </View>
      );
    } else if (iconMaterial) {
      content = (
        <View style={[styles]}>
          <MaterialIcons
            color={
              disabled ? disabledColor ?? cmscolors.DisabledIconButton : color
            }
            size={size}
            name={iconMaterial}
          />
        </View>
      );
    }

    let numOpacity = isHidden == true ? 0 : 0.87;
    return (
      <Ripple
        disabled={disabled ? disabled : false}
        rippleCentered={true}
        rippleOpacity={numOpacity}
        onPress={this.onPress}>
        {content}
      </Ripple>
    );
  }
}

module.exports = CMSTouchableIcon;
