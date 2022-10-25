import {Dimensions, Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';

const {width} = Dimensions.get('window');

export default StyleSheet.create({
  viewContainer: {
    flex: 1,
    paddingHorizontal: width * 0.1,
  },
  closeButton: {
    width: 30,
    // alignItems: 'center',
    position: 'absolute',
    right: width * 0.1 - 30,
    top: width * 0.1 - (Platform.OS === 'ios' ? 0 : 36),
    zIndex: 10,
  },
  topSpace: {
    height: 30,
  },
  logo: {
    tintColor: CMSColors.Dark_Blue,
    height: 56,
    alignSelf: 'center',
  },
  space: {
    flex: 0.3,
  },
  lock: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  space_text: {
    flex: 0.15,
  },
  space_footer: {
    flex: 0.05,
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    borderColor: 'blue',
    borderWidth: 1,
  },
  buttonLogin: {
    width: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: CMSColors.PrimaryText,
  },
  textDesc: {
    fontSize: 14,
    color: CMSColors.SecondaryText,
    lineHeight: 20,
  },
  phone: {
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
  },
  content: {
    maxWidth: variables.deviceWidth,
    backgroundColor: CMSColors.Transparent,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexDirection: 'column',
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
});
