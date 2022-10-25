import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

export default StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  all: {
    flex: 1,
  },
  firstContainer: {
    flex: 1,
  },
  iconAlert: {
    margin: 5,
    color: '#CDCDCD',
    width: 36,
    height: 36,
    marginLeft: 0,
    marginRight: 14,
    fontSize: 36,
  },
  rowList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: 1,
  },
  rowButton_contain_icon: {},
  rowButton_icon: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rowButton_icon_check: {
    backgroundColor: CMSColors.PrimaryActive,
  },
  rowButton_icon_uncheck: {
    backgroundColor: '#D8D8D8',
  },
  rowButton_contain_name: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rowButton_name: {
    margin: 5,
    marginLeft: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  containIconCheck: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
  alarmsModalWrapper: {flex: 1, flexDirection: 'column'},
  rowIcon: {
    alignSelf: 'center',
  },
});
