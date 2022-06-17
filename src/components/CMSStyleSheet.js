'use strict';

import {StyleSheet, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {createIconSetFromFontello} from 'react-native-vector-icons';
import fontelloConfig from '../assets/fontello/config.json';

const IconCustom = createIconSetFromFontello(fontelloConfig);
const TEXT_FONT_SIZE = 16;

/**
 *
 * @param {object} styles
 * @returns StyleSheet
 */
export function create(styles) {
  const platformStyles = {};
  Object.keys(styles).forEach(name => {
    let {ios, android, ...style} = {...styles[name]};
    if (ios && Platform.OS === 'ios') {
      style = {...style, ...ios};
    }
    if (android && Platform.OS === 'android') {
      style = {...style, ...android};
    }
    platformStyles[name] = style;
  });
  return StyleSheet.create(platformStyles);
}

module.exports = {
  FontSize: TEXT_FONT_SIZE,
  FontWeight: '500',
  Icon: Icon,
  IconCustom: IconCustom,
  MaterialIcons: MaterialIcons,
  ListViewHeight: 56,
};
