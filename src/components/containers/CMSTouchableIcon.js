'use strict';

// ----------------------------------------------------
// <!-- START MODULES -->
import React from 'react';
import PropTypes from 'prop-types';
import {View, Image} from 'react-native';

import {Icon, IconCustom, MaterialIcons} from '../CMSStyleSheet';
import CMSRipple from '../controls/CMSRipple';
import cmscolors from '../../styles/cmscolors';

// <!-- END MODULES -->
// ----------------------------------------------------
const PRESS_DELAY_TIME = 1000;

class CMSTouchableIcon extends React.Component {
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
      return {disabled};
    }
    return {};
  }

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
        if (this.state.disabled && !this.props.disabled) {
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
      styles,
      isHidden,
      disabledColor,
    } = this.props;

    const {disabled} = this.state;

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
      <CMSRipple
        disabled={disabled ? disabled : false}
        rippleCentered={true}
        rippleOpacity={numOpacity}
        onPress={this.onPress}
        style={{width: styles.width, height: styles.height}}>
        {content}
      </CMSRipple>
    );
  }
}

module.exports = CMSTouchableIcon;
