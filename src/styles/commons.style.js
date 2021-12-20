'use strict';
import variable from './variables';
import {StyleSheet, Platform} from 'react-native';
import CMSColors, {transparent} from './cmscolors';

module.exports = StyleSheet.create({
  rowsViewContainer: {
    flexDirection: 'row',
    flex: 1,
    // backgroundColor: '#fff',
  },
  normalViewContainer: {
    flex: 1,
    backgroundColor: CMSColors.White,
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
    color: CMSColors.PrimaryColor,
  },
  buttonSearchHeader: {
    width: 40,
    height: 40,
    paddingTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 7,
  },
  headerIcon: {
    flex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatSearchBarContainer: {
    paddingLeft: 18,
    height: 50,
    backgroundColor: CMSColors.White,
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
  modalContainer: {
    flexDirection: 'column',
    flex: 1,
    margin: 0,
    marginTop: '10%',
    backgroundColor: CMSColors.DividerColor24_HEX,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalHeader: {
    // flex: 10,
    alignItems: 'center',
    flexDirection: 'row',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: CMSColors.White,
    justifyContent: 'center',
  },
  modalHeaderSeparator: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: {
          height: 0,
          width: 0,
        },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  modalFooter: {
    height: 50,
    backgroundColor: CMSColors.White,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: CMSColors.PrimaryText,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalButtonCancelContainer: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    marginRight: 10,
  },
  modalButtonApplyContainer: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalButtonCancel: {
    height: 50,
    flex: 1,
    justifyContent: 'center',
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 1,
    margin: 3,
  },
  modalButtonApply: {
    height: 50,
    flex: 1,
    backgroundColor: CMSColors.PrimaryActive,
    margin: 3,
  },
  floatingActionButton: {
    position: 'absolute',
    right: 35,
    bottom: 28,
    width: 63,
    height: 63,
    borderRadius: 45,
    backgroundColor: CMSColors.PrimaryActive,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: {width: 14, height: 14},
        shadowColor: 'black',
        shadowOpacity: 0.7,
        shadowRadius: 45,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
