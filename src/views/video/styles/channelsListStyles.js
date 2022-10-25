import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export const ITEMS_PER_ROW = 2;
export const ITEM_HEIGHT = 200;
export const DROPDOWN_ITEM_HEIGHT = 56;

export default StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  headerIcon: {
    flex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: 5,
  },
  dropdownContainer: {
    height: DROPDOWN_ITEM_HEIGHT,
    marginVertical: 14,
    padding: 14,
    backgroundColor: CMSColors.WidgetBackground,
  },
  videoListContainer: {flex: 1, flexDirection: 'column'},
  infoTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIcon: {marginRight: 14},
  gridNoItem: {
    flex: 1,
    width: '48%',
    height: ITEM_HEIGHT,
    marginRight: 0,
    marginLeft: 7,
  },
  gridItemRipple: {
    flex: 1,
    flexDirection: 'column',
    height: ITEM_HEIGHT,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CMSColors.BorderColorListRow,
  },
  gridImageContainer: {flex: 8},
  gridImage: {width: '100%', height: '100%'},
  gridInfoContainer: {
    flex: 2,
    flexDirection: 'row',
  },
  gridCamIcon: {justifyContent: 'center', paddingLeft: 7},
  channelName: {flex: 1, justifyContent: 'center', paddingLeft: 7},
  listItemRipple: {
    height: 74,
    borderBottomWidth: 1,
    borderBottomColor: CMSColors.BorderColorListRow,
  },
  listItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 5,
  },
  listItemImage: {width: 60, height: 60},
  listInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7,
  },
  noChannelIcon: {
    flex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
