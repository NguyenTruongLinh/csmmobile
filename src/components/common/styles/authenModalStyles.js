import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';
import {normalize} from '../../../util/general';

export default StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.White,
    paddingHorizontal: normalize(16),
    paddingTop: normalize(24),
    paddingBottom: normalize(48),
  },
  header: {
    marginBottom: normalize(8),
  },
  headerText: {
    fontSize: normalize(20),
    color: CMSColors.PrimaryText,
    textAlign: 'center',
    fontWeight: '700',
  },
  body: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginBottom: normalize(8),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkboxContainer: {
    paddingLeft: normalize(18 + 12), // 18 for icon font 12 for padding
    flexDirection: 'row',
  },
  checkboxRipple: {
    flexDirection: 'row',
  },
  checkedboxIcon: {
    borderColor: CMSColors.PrimaryColor,
    backgroundColor: CMSColors.PrimaryColor,
    flex: 1,
  },
  checkboxIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: normalize(22),
    height: normalize(22),
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'rgba(01,01,01,0.54)',
  },
  checkboxLable: {
    fontSize: normalize(16),
    color: CMSColors.PrimaryText,
  },
  button: {
    width: (variables.deviceWidth - 40) / 2,
  },
  cancelButton: {
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
  },
  buttonText: {
    fontWeight: '700',
  },
  cancelButtonText: {
    color: CMSColors.PrimaryActive,
    fontWeight: '700',
  },
});
