import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variable from '../../../styles/variables';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingVertical: 10,
  },
  textInfoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textInfo: {
    fontSize: 15,
    color: CMSColors.PrimaryText,
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  Indicator: {
    flexDirection: 'row',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: variable.contentPadding,
  },
  leftInfoContainer: {
    flex: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  RightInfoContainer: {
    flex: 1,
    paddingRight: variable.contentPadding,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  date_text: {
    color: CMSColors.PrimaryText,
    fontSize: 14,
    paddingLeft: variable.inputPaddingLeft,
  },
  name_text: {
    color: CMSColors.PrimaryText,
    fontSize: 14,
    paddingLeft: variable.inputPaddingLeft,
  },
  temp_text: {
    color: CMSColors.PrimaryText,
    fontSize: 15,
    marginLeft: 10,
  },
  inputNote: {
    borderBottomWidth: 1,
    borderColor: CMSColors.DarkText,
    textAlignVertical: 'top',
    padding: 10,
    fontSize: 14,
  },
  subtext: {
    color: CMSColors.SecondaryText,
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  ratingContainer: {
    borderWidth: 0,
    flexDirection: 'column',
    paddingTop: variable.inputPaddingLeft,
    paddingBottom: variable.inputPaddingLeft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
  },
  alertStatusWrapper: {
    justifyContent: 'center',
    paddingRight: variable.inputPaddingLeft,
    paddingLeft: 4,
  },
  alertStatusSuccess: {fontSize: 14, color: CMSColors.Success},
  alertStatusBottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertStatusBottomText: {
    fontSize: 14,
    color: CMSColors.Success,
    fontWeight: 'bold',
  },
  imageThumbContainer: {top: 0, left: 0, position: 'absolute'},
  imageThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  height3: {
    height: 3,
  },
  videoButtonContainer: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoButtonWrapper: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  likeContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  temperatureInfoContainer: {
    paddingLeft: 10,
    paddingRight: 16,
  },
  alignCenter: {
    alignItems: 'center',
  },
});
