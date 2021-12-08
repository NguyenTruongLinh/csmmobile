'use strict';
import variable from '../variables';
import CMSColors from '../cmscolors';
import {View, StyleSheet, Platform} from 'react-native';

module.exports = StyleSheet.create({
  channelInfo: {
    color: CMSColors.White,
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  statusView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
    zIndex: 1,
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
  },
  textMessage: {
    width: '100%',
    height: '15%',
    color: CMSColors.Danger,
    alignSelf: 'center',
    // ...Platform.select({
    //   ios: {
    //     height: '15%',
    //   },
    //   android: {
    //     width: '100%',
    //     textAlignVertical: 'bottom',
    //   },
    // }),
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
