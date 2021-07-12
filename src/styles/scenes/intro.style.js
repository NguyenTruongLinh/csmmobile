'use strict';

import {StyleSheet} from 'react-native';
import CMSColors from '../cmscolors';

module.exports = StyleSheet.create({
  container: {flex: 1, flexDirection: 'column'},
  listItemContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    flex: 3,
    tintColor: CMSColors.Dark_Blue,
  },
  itemImage: {
    flex: 7,
  },
  itemTextContainer: {
    flex: 3,
    justifyContent: 'center',
  },
  itemTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    paddingTop: 7,
    paddingLeft: 35,
    paddingRight: 35,
    fontFamily: 'Roboto-Regular',
  },
  itemDesc: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    paddingTop: 21,
    paddingLeft: 56,
    paddingRight: 56,
    flexWrap: 'wrap',
    fontFamily: 'Roboto-Regular',
  },
  skipContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 35,
    marginTop: 28,
  },
  indicatorContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backContainer: {flex: 1, alignContent: 'flex-start'},
  backButton: {
    // height: 63,
    // marginLeft: 28,
    // marginRight: 49,
    margin: 42,
    alignSelf: 'flex-start',
  },
  nextContainer: {flex: 1, alignContent: 'flex-end'},
  nextButton: {
    // backgroundColor: CMSColors.PrimaryActive,
    // height: 63,
    // marginLeft: 49,
    // marginRight: 35,
    margin: 42,
    alignSelf: 'flex-end',
  },
});
