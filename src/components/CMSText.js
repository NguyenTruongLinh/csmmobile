'use strict';

import React from 'react';
import ReactNative, {StyleSheet} from 'react-native';

import CMSColors from '../styles/cmscolors';
import {getwindow} from '../../util/general';

/**
 *
 * @param {object} param0
 * @returns ReactElement
 */
export function Text({style, ...props}) {
  return <ReactNative.Text style={[styles.font, style]} {...props} />;
}

/**
 *
 * @param {object} param0
 * @returns ReactElement
 */
export function Heading1({style, ...props}) {
  return (
    <ReactNative.Text style={[styles.font, styles.h1, style]} {...props} />
  );
}

/**
 *
 * @param {object} param0
 * @returns ReactElement
 */
export function Paragraph({style, ...props}) {
  return <ReactNative.Text style={[styles.font, styles.p, style]} {...props} />;
}

const scale = getwindow().width / 375;

/**
 *
 * @param {number} size
 * @returns number
 */
function normalize(size) {
  return Math.round(scale * size);
}

const styles = StyleSheet.create({
  h1: {
    fontSize: normalize(24),
    lineHeight: normalize(27),
    color: CMSColors.DarkText,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  p: {
    fontSize: normalize(15),
    lineHeight: normalize(23),
    color: CMSColors.LightText,
  },
});
