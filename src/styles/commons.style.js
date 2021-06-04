'use strict';
import variable from './variables';
import {StyleSheet, Platform} from 'react-native';

module.exports = StyleSheet.create({
  // Component ActivityIndicator
  spinnerCenter: {
    height: 10,
    marginTop: 0,
  },

  // Component PullToRefreshListView
  PullToRefreshListView_Style: {
    marginTop: Platform.OS == 'ios' ? 1 : 1,
  },
  PullToRefreshListView_content: {
    backgroundColor: '#FFFFFF',
  },
  PullToRefreshListView_loading_header: {
    //height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
