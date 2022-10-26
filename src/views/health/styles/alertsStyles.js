import {Dimensions, Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export const ALERTS_GRID_LAYOUT = 2;
const {width} = Dimensions.get('window');
const itemWidth = width / ALERTS_GRID_LAYOUT - 15;

export default StyleSheet.create({
  container: {flex: 1},
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
  thumbSub: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbChannelText: {
    fontSize: 16,
    color: CMSColors.PrimaryText,
    marginTop: 0,
  },
  thumbSubIcon: {
    paddingRight: 5,
  },
  thumbSubText: {
    color: CMSColors.SecondaryText,
    fontSize: 12,
    marginBottom: 2,
  },
  thumbText: {
    padding: 2,
    fontSize: 12,
  },
  alertThumbView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CMSColors.White,
    borderBottomWidth: 1,
    borderColor: CMSColors.BorderColorListRow,
    padding: 5,
  },
  alertThumbContainer: {
    margin: 5,
    width: 60,
    height: 60,
  },
  alertThumb: {
    width: 60,
    height: 60,
  },
  alertThumbGrid: {
    width: 150,
    height: 145,
    resizeMode: 'cover',
  },
  alertThumbGrid_2: {
    width: itemWidth,
    height: Math.floor((itemWidth * 3) / 4),
  },
  backRowRipple: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  backRowView: {
    paddingRight: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  alertRipple: {
    alignItems: 'center',
    borderBottomColor: CMSColors.BorderColorListRow,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: CMSColors.DividerColor24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  alertContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
  },
  listView: {flex: 2},
  gridView: {
    backgroundColor: CMSColors.transparent,
    padding: 5,
    width: itemWidth,
  },
  alertItemGridViewContainer: {
    borderRadius: 2,
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
    margin: 5,
    width: width / ALERTS_GRID_LAYOUT - 15,
  },
  itemGridViewWrapper: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemGridViewContentContainer: {
    width: itemWidth,
    height: Math.floor((itemWidth * 3) / 4),
  },
  unDismissAbleContainer: {flex: 2},
  unDismissAbleText: {padding: 2, fontSize: 16},
});
