import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  container: {flex: 1},
  contentHeader: {
    flex: 15,
    paddingLeft: 10,
    height: 45,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: CMSColors.White,
  },
  dateTab: {
    justifyContent: 'center',
    padding: 5,
  },
  button_DateSelect: {
    height: 32,
    minWidth: 230,
  },
  addMoreButtonContainer: {
    justifyContent: 'center',
  },
  button_FilterMore: {
    height: 36,
    width: 36,
    backgroundColor: CMSColors.PrimaryActive,
  },
  button_FilterMore_None: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CMSColors.PrimaryActive,
    backgroundColor: CMSColors.White,
  },
  button_DateNotSelect: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CMSColors.DividerColor24_HEX,
  },
  button_FilterMore_Add: {
    height: 36,
    minWidth: 36,
    marginRight: 5,
    padding: 5,
  },

  button_FilterMore_Add_None: {
    backgroundColor: CMSColors.DividerColor24_HEX, // CMSColors.White,
  },

  contentBody: {
    flex: 85,
  },

  contentHeader_FilterMore: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: CMSColors.transparent,
  },
  rowListFilterContain: {
    marginTop: 6,
    paddingHorizontal: 12,
    marginHorizontal: 12,
  },
  rowListFilterTimeContain: {
    marginTop: 6,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.FilterRowBg,
  },
  rowListFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 48,
  },
  contentIconRemoveFilter: {
    paddingRight: 12,
  },
  modalcontainer: {
    flexDirection: 'column',
    paddingHorizontal: 15,
  },
  modalcontainer_TimePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CMSColors.White,
    borderRadius: 5,
    overflow: 'hidden',
  },
  timeContainer: {
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
    flexDirection: 'column',
  },
  timeText: {color: CMSColors.PrimaryText, fontWeight: 'bold'},
  dateText: {color: CMSColors.SecondaryText, fontSize: 12},
  modalTimePickerContainer: {
    margin: 0,
    backgroundColor: CMSColors.VideoOpacityLayer,
  },
  scrollViewContainer: {
    maxHeight: 60,
  },
  timePickerContainer: {flex: 1, height: 150},
  arrowIconContainer: {
    marginTop: 43,
    justifyContent: 'center',
  },
  timePickerHeaderContainer: {flexDirection: 'row', justifyContent: 'center'},
  justifyCenter: {justifyContent: 'center'},
});
