import {StyleSheet} from 'react-native';

import {ListViewHeight} from '../../../components/CMSStyleSheet';
import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 7,
  },
  screenContainer: {flex: 1, flexDirection: 'column'},
  backRowContainer: {flex: 1, flexDirection: 'row'},
  backRowLeft: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: ListViewHeight,
  },
  backRowButtonContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backRowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: ListViewHeight,
  },
  listItemRipple: {
    flex: 1,
    height: ListViewHeight + 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    borderBottomWidth: 1,
  },
  siteNameContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  siteName: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 30,
  },
  alertsCountContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: ListViewHeight - 15,
    height: ListViewHeight - 15,
    marginRight: 14,
    backgroundColor: CMSColors.BtnNumberListRow,
  },
  alertsCount: {
    fontSize: 16,
    fontWeight: '500',
    color: CMSColors.White,
  },
  summaryContainer: {
    backgroundColor: CMSColors.HeaderListRow,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sitesCount: {
    paddingLeft: 24,
    textAlignVertical: 'center',
    color: CMSColors.RowOptions,
  },
});
