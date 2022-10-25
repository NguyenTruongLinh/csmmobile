import {Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import {ListViewHeight} from '../../../components/CMSStyleSheet';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  sortModal: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: CMSColors.White,
  },
  modalHeader: {height: 70, alignItems: 'center', justifyContent: 'center'},
  modalTitle: {textAlign: 'center', fontSize: 24, fontWeight: 'bold'},
  sortItemRipple: {
    width: '100%',
    height: ListViewHeight,
    paddingLeft: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortItemText: {marginLeft: 14, fontSize: 15},
  siteIconContainer: {marginLeft: 19, marginRight: 14},
  siteNameContainer: {
    flex: 1,
    margin: 5,
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: CMSColors.transparent,
  },
  siteNameText: {
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 16,
    color: CMSColors.PrimaryText,
    backgroundColor: CMSColors.transparent,
  },
  siteRiskContainer: {
    backgroundColor: CMSColors.BtnNumberListRow,
    minWidth: 65,
    height: 24,
    borderRadius: 3,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteRiskText: {fontSize: 16, color: CMSColors.TextNumberListRow},
  groupItemContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  userIconContainer: {
    backgroundColor: CMSColors.Transparent,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    marginHorizontal: 14,
  },
  employeeNameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  employeeNameText: {fontSize: 16, color: CMSColors.PrimaryText},
  employeeNameRiskContainer: {
    marginLeft: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  employeeNameRiskText: {
    marginRight: 10,
    fontSize: 16,
    color: CMSColors.Danger,
  },
  groupInfoContainer: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  itemInfo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textTitleInfo: {
    fontSize: 12,
    color: CMSColors.Dark_Gray,
  },
  textValueInfo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CMSColors.Dark_Gray_2,
  },
  chartHeader: {flex: 1, justifyContent: 'center', alignContent: 'center'},
  chartHeaderText: {fontSize: 16, textAlign: 'center'},
  chartHeaderRiskValue: {fontSize: 35, textAlign: 'center', fontWeight: 'bold'},
  chartContainer: {
    flex: 4,
    marginTop: 0,
  },
  manuallyClipText: {
    position: 'absolute',
    backgroundColor: CMSColors.White,
    width: '100%',
    height: Platform.OS === 'android' ? 14 : 10,
    bottom: 0,
  },
  topInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIconContainer: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  dateRangeText: {marginLeft: 5, fontSize: 16},
  sortButton: {
    height: 42,
    padding: 5,
  },
  mainViewContainer: {flex: 11, backgroundColor: CMSColors.White},
  switchViewButton: {
    height: 46,
    padding: 5,
  },
  dummyBugFixingText: {
    display: 'none',
  },
  siteItemContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    height: 48,
    borderBottomWidth: 1,
  },
  dataSearchContainer: {
    paddingHorizontal: 16,
  },
  siteDetailLoadingContainer: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteLoadingDetail: {
    paddingTop: 0,
  },
  iconSearchData: {
    position: 'absolute',
    right: -10,
    top: 5,
  },
});
