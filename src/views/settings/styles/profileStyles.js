import {Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';

export default StyleSheet.create({
  container: {
    flex: 1,
    width: null,
    height: null,
  },
  rowHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    height: 120,
  },
  avatar: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#3c7ba4',
    marginRight: 5,
    borderRadius: 50,
  },
  image: {
    top: 1,
    left: 1,
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  control: {
    marginLeft: 24,
    marginRight: 24,
  },
  statusBar: {
    height: variables.isPhoneX ? 44 : 20,
    backgroundColor: CMSColors.White, // CMSColors.Dark_Blue,
  },
  navbarBody: {
    backgroundColor: CMSColors.Dark_Blue,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: {
          height: 0,
          width: 0,
        },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  navbar: {
    backgroundColor: CMSColors.White,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowOffset: {
          height: 0,
          width: 0,
        },
      },
      android: {
        elevation: 1,
      },
    }),
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#828287',
    borderTopWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  left: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 10,
    marginTop: 2,
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  contentIcon: {
    paddingTop: 2,
  },
  title: {
    marginLeft: 5,
  },
  spinner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    height: 50,
  },
});
