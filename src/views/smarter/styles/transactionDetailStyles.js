import {Dimensions, StyleSheet} from 'react-native';
import CMSColors from '../../../styles/cmscolors';

const {width} = Dimensions.get('window');
export const ViewModes = {
  normal: 0,
  fullscreenBill: 1,
  fullscreenVideo: 2,
};
export const videoW = width;
export const videoH = (width * 9) / 16;

export default StyleSheet.create({
  viewContainer: {
    flex: 1,
  },
  contentView: {
    paddingHorizontal: 12,
  },
  button: {
    height: 50,
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 2,
    marginTop: 16,
    justifyContent: 'center',
  },
  defaultBillContainer: {flex: 1, marginTop: 16},
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'green',
  },

  billViewContainer: {
    flex: 1,
    flexDirection: 'column',
    padding: 7,
  },
  normalText: {
    fontSize: 13,
  },
  headerText: {
    fontSize: 15,
  },
  normalTextContainer: {
    height: 35,
  },
  paymentText: {
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'right',
  },
});
