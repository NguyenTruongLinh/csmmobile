import {Dimensions, Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';

const {width} = Dimensions.get('window');

export default StyleSheet.create({
  viewContainer: {
    flex: 1,
    paddingHorizontal: width * 0.1,
  },
  closeButtonContainer: {
    height: 30,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 30,
    // alignItems: 'center',
    position: 'absolute',
    right: width * 0.1 - 30,
    top: width * 0.1 - (Platform.OS == 'ios' ? 0 : 36),
    zIndex: 10,
  },
  logo: {
    tintColor: CMSColors.Dark_Blue,
    width: width * 0.3,
    height: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    height: 60,
    flexDirection: 'column',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    flexDirection: 'column',
  },
  textContainer: {
    alignItems: 'center',
  },
  textTitle: {fontSize: 20, fontWeight: 'normal'},
  textBold: {fontWeight: 'bold'},
  textDesc: {
    fontSize: 15,
  },
  inputsContainer: {
    // alignItems: 'center',
  },
  forgotPasswordLink: {
    marginTop: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonLogin: {
    width: '100%',
  },
  buttonPassword: {
    width: '100%',
    height: 50,
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    maxWidth: variables.deviceWidth,
    backgroundColor: CMSColors.Transparent,
  },
  captionStyle: {
    color: CMSColors.TextButtonLogin,
  },
  copyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '6%',
  },
  copyRightLogo: {
    tintColor: CMSColors.Dark_Blue,
    width: (width * 28) / 100,
    height: (width * 28 * 132) / 300 / 100,
  },
  copyRightText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 5,
  },
  space: {
    flex: 0.2,
  },
  space_footer: {
    flex: 0.05,
  },
  buttonLineThroughContainer: {
    marginVertical: 30,
    width: '100%',
  },
  orTextContainer: {
    alignSelf: 'center',
    backgroundColor: CMSColors.White,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  orText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    overflow: 'hidden',
  },
  lineThrough: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: CMSColors.Grey,
    zIndex: 1,
  },
  buttonLoginI3Host: {
    borderWidth: 1,
    borderColor: CMSColors.PrimaryActive,
    shadowColor: CMSColors.White,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: '100%',
  },
  buttonLoginI3HostCaption: {
    color: CMSColors.PrimaryActive,
  },
});
