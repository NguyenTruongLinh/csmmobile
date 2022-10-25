import {Dimensions, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

const {width, height} = Dimensions.get('window');

export default StyleSheet.create({
  screenContainer: {flex: 1, backgroundColor: 'black'},
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: 5,
  },
  videoListContainer: {flex: 1, flexDirection: 'column'},
  videoRow: {
    flex: 1,
    borderColor: CMSColors.DarkTheme,
    borderWidth: 1,
  },
  layoutModalContainer: {
    backgroundColor: CMSColors.White,
    justifyContent: 'center',
    alignItems: 'center',
    // height: '80%',
    // width: width,
  },
  layoutModalTitle: {
    alignContent: 'center',
    fontSize: 20,
    fontWeight: '700',
    paddingBottom: 36,
    paddingTop: 25,
  },
  layoutModalBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 35,
    paddingRight: 35,
  },
  infoTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutModalContainerExtra: {
    marginBottom: 0,
    marginTop: height - (width > 480 ? 300 : 220),
    marginLeft: 0,
    marginRight: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },

  loadingVideoList: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: CMSColors.Transparent,
  },
  staticVideoListContainer: {
    flex: 1,
    backgroundColor: CMSColors.Transparent,
  },
  videoPlayerNoItemContainer: {flex: 1, backgroundColor: 'black'},
  infoTextIcon: {
    flex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
