import {Platform, StyleSheet} from 'react-native';

import CMSColors from '../../../styles/cmscolors';

const footerHeight = 50;

export default StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal_container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: CMSColors.DividerColor24_HEX,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modal_header: {
    alignItems: 'center',
    flexDirection: 'row',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
  modal_header_icon: {
    marginLeft: 15,
  },
  modal_title: {
    marginLeft: 10,
    fontSize: 16,
  },
  modal_title_search: {
    color: CMSColors.PrimaryText,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '500',
  },
  modal_body: {
    flex: 1,
  },
  modal_footer: {
    height: footerHeight,
    backgroundColor: CMSColors.ModalFooter,
    borderTopWidth: 1,
    borderColor: CMSColors.FooterBorder,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modal_footer_Apply: {
    height: footerHeight,
    backgroundColor: CMSColors.White,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form_horizontal: {
    flex: 1,
    padding: 10,
    flexDirection: 'column',
  },
  form_horizontal_label: {
    flex: 1,
    textAlign: 'center',
  },
  form_horizontal_textarea: {
    flex: 3,
  },
  form_horizontal_datepicker: {
    flex: 1,
  },
  form_horizontal_datepicker_group: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  form_horizontal_datepicker_text: {
    width: 40,
    alignSelf: 'center',
  },
  form_horizontal_datepicker_date: {
    flex: 1,
  },
  form_horizontal_listcheckbox: {
    flex: 2,
  },
  button: {
    height: 26,
    borderWidth: 0,
    marginTop: 3,
  },

  content_button_apply: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    marginRight: 10,
  },
  content_button_cancel: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    marginLeft: 10,
  },
  button_cancel: {
    height: 50,
    flex: 1,
    justifyContent: 'center',
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 1,
    margin: 3,
  },
  button_apply: {
    height: 50,
    flex: 1,
    backgroundColor: CMSColors.PrimaryActive,
    margin: 3,
  },
  dateIcon: {
    position: 'absolute',
    left: 0,
    top: 4,
    marginLeft: 0,
  },
  dateInput: {
    marginLeft: 36,
    height: 25,
  },
  inputDescript: {
    height: 130,
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: 4,
    textAlignVertical: 'top',
    padding: 10,
    fontSize: 14,
  },
  modal_header_dismiss: {
    borderColor: CMSColors.White,
  },
  modal_footer_dismiss: {
    marginRight: 10,
    alignItems: 'center',
    borderColor: CMSColors.White,
  },
  noDataContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataImg: {
    width: 100,
    height: 100,
  },
  noDataTxt: {
    marginTop: 12,
    paddingBottom: 50,
    fontSize: 16,
    color: CMSColors.PrimaryText,
  },

  filterModalContainer: {
    marginBottom: 0,
    marginTop: '10%',
    marginLeft: 0,
    marginRight: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  contentWrapper: {flex: 1, flexDirection: 'column'},
});
