'use strict';
import variable from './variables';
import {StyleSheet, Platform} from 'react-native';
import cmscolors from './cmscolors';

module.exports = StyleSheet.create({
  rowsViewContainer: {
    flexDirection: 'row',
    flex: 1,
    // backgroundColor: '#fff',
  },
  normalViewContainer: {
    flex: 1,
    backgroundColor: cmscolors.White,
  },
  // Component ActivityIndicator
  spinnerCenter: {
    height: 10,
    marginTop: 0,
  },
  buttonSave: {
    marginRight: 12,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSaveText: {
    fontSize: 16,
    color: '#436D8F',
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
