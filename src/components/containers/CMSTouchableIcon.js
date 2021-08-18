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

  render() {
    const {
      icon,
      iconCustom,
      iconMaterial,
      color,
      size,
      image,
      onPress,
      styles,
      isHidden,
      disabled,
    } = this.props;

    let content;
    if (image) {
      content = React.cloneElement(image, {
        style: [styles, this.getCubes(size)],
      });
    } else if (icon) {
      content = (
        <View style={[styles]}>
          <Icon
            color={disabled ? cmscolors.Inactive : color}
            size={size}
            name={icon}
          />
        </View>
      );
    } else if (iconCustom) {
      content = (
        <View style={[styles]}>
          <IconCustom
            color={disabled ? cmscolors.Inactive : color}
            size={size}
            name={iconCustom}
          />
        </View>
      );
    } else if (iconMaterial) {
      content = (
        <View style={[styles]}>
          <MaterialIcons
            color={disabled ? cmscolors.Inactive : color}
            size={size}
            name={iconMaterial}
          />
        </View>
      );
    } else {
      content = null;
    }
    let numOpacity = isHidden == true ? 0 : 0.87;
    return (
      <Ripple
        disabled={disabled ? disabled : false}
        rippleCentered={true}
        rippleOpacity={numOpacity}
        onPress={onPress}>
        {content}
      </Ripple>
    );
  }
}

module.exports = CMSTouchableIcon;
