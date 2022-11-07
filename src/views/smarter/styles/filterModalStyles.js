import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export const SECTION_HEADER_HEIGHT = 50;

export default StyleSheet.create({
  modal: {
    marginBottom: 0,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    flex: 1,
  },
  header: {
    flex: 10,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: SECTION_HEADER_HEIGHT,
  },
  siteNameContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  siteNameText: {
    fontSize: 14,
  },
  button_sort: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatSearchBarContainer: {
    paddingLeft: 18,
    paddingRight: 4,
    height: 50,
  },
  sortSiteContainer: {height: '100%'},
  dateTimeTextContainer: {justifyContent: 'center', marginLeft: 12},
  textBase: {fontSize: 16},
  iconHeaderContainer: {flex: 1, alignItems: 'flex-end'},
  siteSelectedContainer: {justifyContent: 'center', marginLeft: 12},
  siteSelectedIconContainer: {flex: 1, alignItems: 'flex-end'},
  siteItemContainer: {
    height: 40,
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  sortIconContainer: {flex: 1, alignItems: 'flex-end'},
  allSelectedContainer: {height: '100%'},
  allSelectedButton: {
    height: 40,
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
});
