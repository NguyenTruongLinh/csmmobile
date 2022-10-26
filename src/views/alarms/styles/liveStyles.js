import {StyleSheet} from 'react-native';
import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  noDataContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataImg: {
    width: 100,
    height: 100,
  },
  noDataTxt: {
    marginTop: 12,
    paddingBottom: 50,
    fontSize: 16,
    color: CMSColors.PrimaryText,
  },
});
