import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  all: {
    flexDirection: 'row',
    flex: 1,
  },
  container: {
    flex: 1,
    width: null,
    height: null,
  },
  headerRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 94,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgb(204, 204, 204)',
  },
  infoProfile: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconArrowProfile: {
    marginRight: 10,
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#3c7ba4',
    marginRight: 5,
    borderRadius: 30,
  },
  image: {
    top: 1,
    left: 1,
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  userInfo: {
    justifyContent: 'center',
    marginLeft: 10,
  },
  userInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
  },
  userInfoSubText: {
    fontSize: 14,
    color: CMSColors.ColorText,
  },
  rowContainer: {
    height: 70,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgb(204, 204, 204)',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listIcon: {
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  listText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
    lineHeight: 24,
  },
  listTextDomainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.ColorText,
    lineHeight: 22,
  },
  listTextDomain: {
    fontSize: 14,
    color: CMSColors.PrimaryColor,
  },
  listEnterIcon: {
    marginRight: 10,
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoConnectionContent: {
    flex: 1,
    margin: 15,
  },
  videoConnectionLittleText: {
    fontSize: 12,
    color: CMSColors.RowOptions,
    lineHeight: 18,
  },
  listRowLeft: {
    flex: 1,
    paddingLeft: 16,
  },
});
