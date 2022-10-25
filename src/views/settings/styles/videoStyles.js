import {StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';
import variables from '../../../styles/variables';

export default StyleSheet.create({
  all: {
    flex: 1,
  },
  firstContainer: {
    flex: 1,
  },

  statusbarios: {
    height: variables.isPhoneX ? 44 : 20,
    backgroundColor: CMSColors.Dark_Blue,
  },
  rowList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: variables.borderWidthRow,
    borderColor: 'rgb(204, 204, 204)',
  },
  rowButton_contain_icon: {},
  rowButton_icon: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  rowButton_icon_check: {
    backgroundColor: CMSColors.PrimaryColor,
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
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rowButton_desc: {
    margin: 5,
    paddingTop: 10,
    paddingBottom: 10,
  },
  containIconCheck: {
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
});
