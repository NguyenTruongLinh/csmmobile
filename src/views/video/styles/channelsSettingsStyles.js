import {Dimensions, Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

const {width} = Dimensions.get('window');
const IMAGE_HEIGHT = ((width - 40) * 3) / 8;
const MIN_ITEM_HEIGHT = 190;
const ITEM_HEIGHT = Math.max(MIN_ITEM_HEIGHT, (IMAGE_HEIGHT * 11) / 8);

export default StyleSheet.create({
  container: {flex: 1},
  summaryContainer: {
    backgroundColor: CMSColors.HeaderListRow,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    paddingLeft: 24,
    textAlignVertical: 'center',
    color: CMSColors.RowOptions,
  },
  item: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: CMSColors.White,
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowRadius: 2,
        shadowColor: CMSColors.BoxShadow,
      },
      android: {
        elevation: 2,
      },
    }),
    margin: 6,
  },
  itemNone: {
    flex: 1,
    margin: 6,
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    height: ITEM_HEIGHT,
    marginHorizontal: 10,
  },
  itemImageContainer: {
    flex: 8,
  },
  itemContentContainer: {
    flex: 3,
    flexDirection: 'row',
  },
  itemTextContainer: {flex: 1, justifyContent: 'center', padding: 7},
  iconContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
  },
  itemImageWrapper: {
    flex: 1,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  listContainer: {flex: 1, marginBottom: 14},
});
