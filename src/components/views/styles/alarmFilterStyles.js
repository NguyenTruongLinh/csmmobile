import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  container: {flex: 1},
  contentHeader: {
    paddingLeft: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  dateTab: {
    justifyContent: 'center',
    padding: 5,
  },
  button_DateSelect: {
    height: 32,
    paddingHorizontal: 10,
  },
  addMoreButtonContainer: {
    justifyContent: 'center',
  },
  button_FilterMore: {
    height: 36,
    width: 36,
    borderWidth: 1,
    borderColor: CMSColors.PrimaryActive,
  },
  button_FilterMore_None: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CMSColors.White,
  },
  button_FilterMore_Select: {
    backgroundColor: CMSColors.PrimaryActive,
  },
  button_DateNotSelect: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CMSColors.DividerColor24_HEX,
  },
  button_FilterMore_Add: {
    height: 36,
    minWidth: 0,
    marginRight: 5,
    margin: 0,
    padding: 0,
    paddingHorizontal: 6,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  button_FilterMore_Add_None: {
    backgroundColor: CMSColors.DividerColor24_HEX, // CMSColors.White,
  },

  contentBody: {
    flex: 1,
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
    marginHorizontal: 15,
    borderRadius: 2,
  },
  rowListFilterTimeContain: {
    marginTop: 6,
    paddingHorizontal: 12,
    marginHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 2,
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
    paddingTop: 43,
    justifyContent: 'center',
  },
  timePickerHeaderContainer: {flexDirection: 'row', justifyContent: 'center'},
  justifyCenter: {justifyContent: 'center'},

  buttonFilterMoreCaption: {
    textTransform: 'capitalize',
    color: CMSColors.PrimaryText,
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
  },
  button_FilterMore_Add_Active: {
    color: CMSColors.White,
  },
  buttonHeaderText: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
  },
});
