'use strict';
import variable from '../variables';
import CMSColors from '../cmscolors';
import {View, StyleSheet} from 'react-native';

//var device = Dimensions.get('window');
//width: device.width,
//height: device.height,
module.exports = StyleSheet.create({
  all: {
    // flex: 1,
    // backgroundColor: CMSColors.Dark_Blue,
  },
  imagebgContainer: {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
  },
  imagebg: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
  },
  scrollView: {
    flex: 1,
  },
  imageLogo: {
    flex: 1,
    alignItems: 'center',
    //backgroundColor: CMSColors.Transparent,
    //flexDirection:'row',
    justifyContent: 'flex-end',
  },
  size_launchscreenLogo: {
    width: variable.fix_width_logo,
    height: variable.fix_width_logo,
  },
  contentLogin: {
    flex: 2,
    margin: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 7,
    paddingRight: 7,
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    maxWidth: variable.deviceWidth > 370 ? 400 : variable.deviceWidth,
    backgroundColor: CMSColors.Transparent,
  },
  loginbuttonContainer: {
    paddingTop: 20,
    paddingLeft: 7,
    paddingRight: 7,
    maxWidth: variable.deviceWidth > 370 ? 400 : variable.deviceWidth,
  },
  button: {
    height: 36,
    flex: 1,
    maxWidth: variable.deviceWidth > 370 ? 400 : variable.deviceWidth,
  },
  buttonlink: {
    height: 36,
    borderWidth: 0,
    marginTop: 5,
    alignItems: 'center',
    padding: 10,
  },
  buttonlink_Text: {
    color: '#436D8F',
  },
  controlgroup_column: {
    //flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  controlgroup_row: {
    //flex: 1,
    flexDirection: 'row',
  },
  spinner: {
    flex: 2,
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: 9,
    justifyContent: 'center',
  },
  captionStyle: {
    color: CMSColors.TextButtonLogin,
  },
  msgErr: {
    height: 50,
    justifyContent: 'center',
  },
  textErr: {
    color: CMSColors.Danger,
    fontSize: 14,
  },
});
