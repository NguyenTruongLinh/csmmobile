'use strict';
import React, {Component} from 'react';
import {StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

import * as MaterialButton from '@geuntabuwono/react-native-material-buttons';

import CMSColors from '../../styles/cmscolors';
import {Text} from '../CMSText';
import {
  Icon,
  IconCustom,
  MaterialIcons,
  FontSize as FONT_SIZE,
} from '../CMSStyleSheet';

const HEIGHT = 50;

class Button extends Component {
  static propTypes = {
    type: PropTypes.string,
    icon: PropTypes.string,
    caption: PropTypes.string,
    onPress: PropTypes.func,
    backgroundColor: PropTypes.string,
  };

  static defaultProps = {
    type: 'primary',
    icon: undefined,
    iconSize: 18,
    height: undefined,
    width: undefined,
    backgroundColor: undefined,
  };

  /**
   *
   * @param {object} enable_style
   * @param {object} disable_style
   * @returns JSXElement
   */
  renderIcon(enable_style, disable_style) {
    const size = this.props.iconSize || FONT_SIZE;
    const {icon, iconMaterial, iconCustom, enable} = this.props;
    let IconComponent = null;
    let iconName = '';

    if (icon) {
      IconComponent = Icon;
      iconName = icon;
    }
    if (iconMaterial) {
      IconComponent = MaterialIcons;
      iconName = iconMaterial;
    }
    if (iconCustom) {
      IconComponent = IconCustom;
      iconName = iconCustom;
    }

    return IconComponent ? (
      <IconComponent
        name={iconName}
        size={size}
        style={
          enable
            ? [styles.caption_Icon, enable_style, styles.icon]
            : [styles.caption_Icon, disable_style, styles.icon]
        }
      />
    ) : null;
  }

  /**
   *
   * @param {string} caption
   * @param {object} enable_style
   * @param {object} disable_style
   * @returns JSXElement
   */
  renderText(caption, enable_style, disable_style) {
    if (this.props.captionCustom) {
      return (
        <Text
          style={[
            styles.caption,
            this.props.enable ? enable_style : disable_style,
          ]}>
          {this.props.captionCustom}
        </Text>
      );
    }
    return caption ? (
      <Text
        style={[
          styles.caption,
          this.props.enable ? enable_style : disable_style,
        ]}>
        {caption}
      </Text>
    ) : null;
  }

  /**
   *
   * @param {string} caption
   * @returns JSXElement
   */
  renderCustom(caption) {
    // __DEV__ && console.log('GOND iconStyleEnable ', this.props.iconStyleEnable);
    let icon = this.renderIcon(
      this.props.iconStyleEnable,
      this.props.iconStyleDisable
    );
    let text = this.renderText(
      caption,
      this.props.captionStyle ? this.props.captionStyle : styles.primaryCaption,
      styles.disableCaption
    );
    let Background = this.props.backgroundColor
      ? {backgroundColor: this.props.backgroundColor}
      : styles.Background;
    return (
      <MaterialButton.RaisedButton
        onPress={this.props.onPress}
        rippleOpacity={0.54}
        disabled={this.props.enable ? false : true}
        style={
          this.props.enable
            ? [styles.container, Background, this.props.style]
            : [styles.container, styles.disableBackground, this.props.style]
        }>
        {icon}
        {text}
      </MaterialButton.RaisedButton>
    );
  }

  /**
   *
   * @param {string} caption
   * @returns JSXElement
   */
  renderPrimary(caption) {
    let icon = this.renderIcon(styles.primaryCaption, styles.disableCaption);
    let text = this.renderText(
      caption,
      {...styles.primaryCaption, ...(this.props.captionStyle || {})},
      styles.disableCaption
    );
    let Background = this.props.backgroundColor
      ? {backgroundColor: this.props.backgroundColor}
      : styles.Background;
    return (
      <MaterialButton.RaisedButton
        onPress={this.props.onPress}
        rippleOpacity={0.54}
        disabled={this.props.enable ? false : true}
        style={
          this.props.enable
            ? [styles.container, Background, this.props.style]
            : [styles.container, styles.disableBackground, this.props.style]
        }>
        {icon}
        {text}
      </MaterialButton.RaisedButton>
    );
  }

  /**
   *
   * @param {string} caption
   * @returns JSXElement
   */
  renderFlat(caption) {
    const {captionStyle, captionDisabledStyle} = this.props;
    let icon = this.renderIcon(
      this.props.iconStyleEnable || styles.flatCaption,
      this.props.iconStyleDisable || styles.flatCaptionDisable
    );
    let text = this.renderText(
      caption,
      {...styles.flatCaption, ...captionStyle},
      captionDisabledStyle || styles.flatCaptionDisable
    );
    return (
      <MaterialButton.Button
        onPress={this.props.onPress}
        disabled={this.props.enable ? false : true}
        style={
          this.props.enable
            ? [styles.container, styles.flatbackground, this.props.style]
            : [styles.container, styles.flatbackgrounddisable, this.props.style]
        }>
        {icon}
        {text}
      </MaterialButton.Button>
    );
  }

  /**
   *
   * @param {string} caption
   * @returns JSXElement
   */
  renderLink(caption) {
    let text = this.renderText(
      caption,
      styles.linkcaption,
      styles.linkcaptiondisable
    );
    return (
      <MaterialButton.Button
        onPress={this.props.onPress}
        disabled={this.props.enable ? false : true}
        style={
          this.props.enable
            ? [styles.container, styles.linkbackground, this.props.style]
            : [styles.container, styles.linkbackgrounddisable, this.props.style]
        }>
        {text}
      </MaterialButton.Button>
    );
  }

  render() {
    let {title, titleColor, disabledTitleColor, style, ...props} = this.props;

    const caption = this.props.caption
      ? this.props.caption.toUpperCase()
      : this.props.caption;

    if (this.props.type === 'primary') {
      return this.renderPrimary(caption);
    } else if (this.props.type === 'link') {
      return this.renderLink(caption);
    } else if (this.props.type === 'custom') {
      return this.renderCustom(caption);
    } else {
      return this.renderFlat(caption);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    // borderRadius: HEIGHT / 2,
    // borderWidth: 1 / PixelRatio.get(),
  },

  button: {
    // flex: 1,
    //flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'red',
  },

  border: {
    borderWidth: 1,
    borderColor: CMSColors.LightText,
    borderRadius: HEIGHT / 2,
  },

  primaryButton: {
    borderRadius: HEIGHT / 2,
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: 5,
  },
  caption: {
    letterSpacing: 1,
    fontSize: FONT_SIZE,
  },

  caption_Icon: {
    letterSpacing: 1,
    //fontSize: FONT_SIZE,
  },

  Background: {
    //backgroundColor: 'rgba(0, 86, 145, 1)'
    backgroundColor: CMSColors.PrimaryActive,
    borderColor: CMSColors.PrimaryActive,
  },

  disableBackground: {
    //backgroundColor: 'rgba(0, 0, 0, 0.12)'
    backgroundColor: '#E1E1E1',
  },

  disableCaption: {
    //color: 'rgba(0, 0, 0, 0.26)'
    color: '#9C9C9C',
  },
  primaryCaption: {
    color: 'rgb(242,242,242)',
    //backgroundColor: CMSColors.PrimaryColor,
  },

  flatCaption: {
    // color: 'rgba(0, 86, 145, 1)',
    color: CMSColors.PrimaryActive,
  },
  flatCaptionDisable: {
    color: 'rgb(156,156,156)',
  },

  flatbackgrounddisable: {
    backgroundColor: 'transparent', //'rgb(225,225,225)'
  },
  flatbackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
  },

  // Style button link
  linkcaption: {
    color: 'rgba(0, 86, 145, 1)',
  },
  linkcaptiondisable: {
    color: 'rgb(156,156,156)',
  },

  linkbackgrounddisable: {
    //backgroundColor: 'rgb(225,225,225)'
    backgroundColor: 'transparent',
  },
  linkbackground: {
    //backgroundColor: 'rgba(0, 0, 0, 0.0)'
    backgroundColor: 'transparent',
  },
});

module.exports = Button;
