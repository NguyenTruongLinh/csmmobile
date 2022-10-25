import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, View} from 'react-native';

import {inject, observer} from 'mobx-react';

import Button from '../controls/Button';
import MultiselectCheckBoxList from '../controls/MultiselectCheckBoxList';

import {getwindow} from '../../util/general';

import CMSColors from '../../styles/cmscolors';
import cmscolors from '../../styles/cmscolors';
import theme from '../../styles/appearance';

const {width, height} = getwindow(); //Dimensions.get('window');

const header_height = 50;
const footer_height = 60;

class ExceptionFilter extends Component {
  static propTypes = {
    exceptions: PropTypes.array,
    footercontent: PropTypes.any,
    selectedAlarms: PropTypes.array,
    onSubmit: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedAlarms: props.selectedAlarms ? props.selectedAlarms : [],
      contentheight: this.props.initheight - footer_height,
    };
  }

  _footer = () => {
    const {appearance} = this.props.appStore;
    if (this.props.footercontent) {
      return (
        <View style={styles.modal_footer_Apply}>
          {this.props.footercontent}
        </View>
      );
    }

    let footer = (
      <View
        style={[styles.modal_footer_Apply, theme[appearance].modalContainer]}>
        <View style={styles.content_button_cancel}>
          <Button
            style={styles.button_cancel}
            caption="Cancel"
            type="flat"
            enable={true}
            onPress={() => {
              this.ButtonClick(false);
            }}
          />
        </View>
        <View style={styles.separator}></View>
        <View style={styles.content_button_apply}>
          <Button
            style={styles.button_apply}
            caption="Apply"
            type="primary"
            enable={true}
            onPress={() => {
              this.ButtonClick(true);
            }}
          />
        </View>
      </View>
    );
    return footer;
  };

  onSelectionChanged(exceptions) {
    this.setState({selectedAlarms: exceptions});
  }

  _content = () => {
    let content = (
      <MultiselectCheckBoxList
        itemId={'id'}
        itemName={'name'}
        initheight={this.props.initheight - footer_height}
        initwidth={this.props.initwidth - footer_height}
        scr_width={width}
        scr_height={height}
        rotatable={this.props.rotatable}
        onSelectionChanged={this.onSelectionChanged.bind(this)}
        selectedItems={this.state.selectedAlarms}
        data={this.props.exceptions}
      />
    );
    return content;
  };

  ButtonClick = isOK => {
    if (!this.props.onSubmit) return;
    let param = null;
    if (isOK) {
      let {selectedAlarms} = this.state;
      param = {selectedAlarms: selectedAlarms};
    }

    this.props.onSubmit(isOK, param);
  };

  render() {
    const {appearance} = this.props.appStore;

    let footer = this._footer();
    let content = this._content();

    return (
      <View style={[styles.modal_container, theme[appearance].modalContainer]}>
        <View style={styles.modal_body}>{content}</View>
        {footer}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal_container: {
    flexDirection: 'column',
    flex: 1,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    overflow: 'hidden',
  },

  modal_title: {
    marginLeft: 10,
    fontSize: 16,
  },

  modal_title_search: {
    color: CMSColors.PrimaryText,
    fontSize: 16,
  },

  modal_body: {
    flex: 1,
  },

  modal_footer: {
    height: footer_height,
    backgroundColor: CMSColors.ModalFooter,
    borderTopWidth: 1,
    borderColor: CMSColors.FooterBorder,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  modal_footer_Apply: {
    height: footer_height,
    // borderTopWidth: 1,
    // borderColor: CMSColors.FooterBorder,
    flexDirection: 'row',
    justifyContent: 'center',
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

  button_cancel: {
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    borderColor: cmscolors.PrimaryActive,
    borderWidth: 1,
    height: 48,
  },

  content_button_apply: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    marginRight: 12,
  },

  content_button_cancel: {
    height: 50,
    flex: 2,
    justifyContent: 'center',
    marginLeft: 12,
  },

  button_apply: {
    height: 48,
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
  separator: {width: 8},
});

export default inject('appStore')(observer(ExceptionFilter));
