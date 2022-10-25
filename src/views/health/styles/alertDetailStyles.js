import {StyleSheet} from 'react-native';
import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  container: {flex: 1},
  listImageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: CMSColors.White,
  },
  selectedChannelName: {
    fontSize: 14,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.White,
    justifyContent: 'center',
  },
  normalChannelName: {
    fontSize: 12,
    width: '100%',
    paddingTop: 10,
    color: CMSColors.SecondaryText,
    justifyContent: 'center',
  },
  actionButton: {
    borderRadius: 45,
    backgroundColor: CMSColors.PrimaryActive,
    justifyContent: 'center',
    alignItems: 'center',
    width: 52,
    height: 52,
  },
  infoContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  actionsButtonContainer: {
    flex: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  infoLeft: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  infoRight: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  infoText: {fontSize: 16, color: CMSColors.PrimaryText, fontWeight: 'bold'},
  hisText: {fontSize: 14, color: CMSColors.SecondaryText},
  dvrName: {fontSize: 14, color: CMSColors.PrimaryText},
  infoDateTimeText: {fontSize: 14},
  dvrInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  dvrIcon: {paddingRight: 5, justifyContent: 'center'},
  timeInfo: {flexDirection: 'row', paddingTop: 5},
  timeIcon: {paddingRight: 5, justifyContent: 'center'},
  buttonStyle: {
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 1,
    maxHeight: 32,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  buttonCaptionStyle: {
    fontSize: 14,
  },
  buttonDismiss: {
    marginRight: 0,
  },
  infoButtonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  imageSlideListContainer: {position: 'absolute', bottom: '5%'},
  infoViewContainer: {padding: 10},
});
