import {Dimensions, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';

const {width} = Dimensions.get('window');

export default StyleSheet.create({
  viewContainer: {
    flex: 1,
    paddingHorizontal: width * 0.1,
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
  textTitle: {
    fontSize: 18,
    fontWeight: 'normal',
    alignItems: 'flex-start',
    marginLeft: 10,
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonSubmit: {
    width: '100%',
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
    flex: 0.3,
  },
  space_footer: {
    flex: 0.05,
  },
});
