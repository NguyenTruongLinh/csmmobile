import {Dimensions, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';

const itemHeight = Dimensions.get('window').height / 16;

export default StyleSheet.create({
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
  itemContainer: {
    height: itemHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 16,
    borderBottomWidth: variables.borderWidthRow,
  },
  itemText: {fontSize: 16, fontWeight: '500'},
  rowHeader: {
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowHeaderText: {
    paddingLeft: 24,
    textAlignVertical: 'center',
    color: CMSColors.RowOptions,
  },
});
