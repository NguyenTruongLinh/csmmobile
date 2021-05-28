'use strict';
import React, {Component} from 'react';
import {StyleSheet} from 'react-native';
import PropTypes from 'prop-types';

import * as MaterialButton from '@geuntabuwono/react-native-material-buttons';

import CMSColors from '../../styles/cmscolors';
import {Text} from '../CMSText';
import CMSStyleSheet from '../CMSStyleSheet';

const Icon = CMSStyleSheet.Icon;
const IconCustom = CMSStyleSheet.IconCustom;
const FONT_SIZE = CMSStyleSheet.FontSize;
const HEIGHT = 50;

class Button extends Component {
  static propTypes = {
    type: PropTypes.string,
    icon: PropTypes.string,
    caption: PropTypes.string,
    onPress: PropTypes.func,
    textColor: PropTypes.string,
    backgroundColor: PropTypes.string,
  };

  static defaultProps = {
    type: 'primary',
    icon: undefined,
    iconSize: 18,
    height: undefined,
    width: undefined,
    textColor: undefined,
    backgroundColor: undefined,
  };

  /**
   *
   * @param {object} enable_style
   * @param {object} disable_style
   * @returns JSXElement
   */
  renderIcon(enable_style, disable_style) {
    let icon;
    if (this.props.icon) {
      let size = this.props.iconSize || FONT_SIZE;
      icon = (
        <Icon
          name={this.props.icon}
          size={size}
          style={
            this.props.enable
              ? [styles.caption, enable_style, styles.icon]
              : [styles.caption, disable_style, styles.icon]
          }
        />
      );
    }
    if (this.props.iconCustom) {
      let size = this.props.iconSize || FONT_SIZE;
      console.log('GOND enable_style = ', enable_style);
      icon = (
        <IconCustom
          name={this.props.iconCustom}
          size={size}
          style={
            this.props.enable
              ? [styles.caption_Icon, enable_style, styles.icon]
              : [styles.caption_Icon, disable_style, styles.icon]
          }
        />
      );
    }
    return icon;
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
    return (
      <Text
        style={[
          styles.caption,
          this.props.enable ? enable_style : disable_style,
        ]}>
        {caption}
      </Text>
    );
  }

  /**
   *
   * @param {string} caption
   * @returns JSXElement
   */
  renderCustom(caption) {
    console.log('GOND iconStyleEnable ', this.props.iconStyleEnable);
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

var styles = StyleSheet.create({
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
    borderColor: CMSColors.lightText,
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
    backgroundColor: CMSColors.primaryActive,
    borderColor: CMSColors.primaryActive,
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
    color: CMSColors.primaryActive,
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
