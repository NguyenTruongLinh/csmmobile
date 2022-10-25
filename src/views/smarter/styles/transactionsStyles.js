import {Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  viewContainer: {flex: 1, flexDirection: 'column'},
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
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  thumbContainer: {
    width: 60,
    height: 60,
    backgroundColor: CMSColors.DividerColor24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  transContainer: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  flagsContainer: {
    position: 'absolute',
    backgroundColor: CMSColors.Transparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transInfoContainer: {flex: 2},
  transNoText: {padding: 2, fontSize: 16},
  transDateText: {
    padding: 2,
    fontSize: 12,
  },
  transInfoFlags: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  gridItemContainer: {
    // flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 2,
    backgroundColor: CMSColors.White,
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
  },
  gridSnapshot: {flex: 8},
  gridInfoContainer: {flexDirection: 'row', paddingHorizontal: 5},
  gridInfoLeft: {flex: 3},
});
