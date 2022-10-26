import {Dimensions, Platform, StyleSheet} from 'react-native';
import CMSColors from '../../../styles/cmscolors';

const {width} = Dimensions.get('window');

export default StyleSheet.create({
  viewContainer: {
    flex: 1,
    paddingHorizontal: width * 0.1,
  },
  closeButton: {
    width: 30,
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
  textAccInfo: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    color: CMSColors.PrimaryText,
    lineHeight: 25,
  },
  textDesc: {
    textAlign: 'center',
    fontSize: 14,
    color: CMSColors.SecondaryText,
  },
  phone: {
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
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
