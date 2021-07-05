'use strict';
import variable from '../variables';
import CMSColors from '../cmscolors';
import {View, StyleSheet, Platform} from 'react-native';

module.exports = StyleSheet.create({
  channelInfo: {color: CMSColors.White, position: 'absolute', zIndex: 1},
  statusView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
  },
  textMessge: {
    width: '100%',
    height: '80%',
    color: CMSColors.Danger,
    alignSelf: 'center',
    textAlignVertical: 'bottom',
  },
  loadingIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerView: {position: 'absolute', width: '100%', height: '100%'},
});
