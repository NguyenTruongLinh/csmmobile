import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.deviceWidth * 0.1,
  },
  space: {
    height: 40,
  },
  copyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '6%',
  },
  copyRightLogo: {
    tintColor: CMSColors.Dark_Blue,
    width: (variables.deviceWidth * 28) / 100,
    height: (variables.deviceWidth * 28 * 132) / 300 / 100,
  },
  copyRightText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 5,
  },
  space_footer: {
    height: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  textTitle: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  checkboxGroupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  enterTitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  textBold: {
    fontWeight: 'bold',
  },
  buttonVerify: {
    marginVertical: 30,
  },
  disableButtonText: {
    color: 'rgb(156,156,156)',
  },
});
