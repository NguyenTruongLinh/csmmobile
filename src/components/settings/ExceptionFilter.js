import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, View} from 'react-native';

import Button from '../controls/Button';
import MultiselectCheckBoxList from '../controls/MultiselectCheckBoxList';

import {getwindow} from '../../util/general';

import variable from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';

const {width, height} = getwindow(); //Dimensions.get('window');

const header_height = 50;
const footer_height = 50;

export default class ExceptionFilter extends Component {
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
    if (this.props.footercontent) {
      return (
        <View style={styles.modal_footer_Apply}>
          {this.props.footercontent}
        </View>
      );
    }

    let footer = (
      <View style={styles.modal_footer_Apply}>
        <View style={styles.content_button_cancel}>
          <Button
            style={styles.button_cancel}
            caption="Cancel"
            type="flat"
            iconCustom="clear-button"
            enable={true}
            onPress={() => {
              this.ButtonClick(false);
            }}
          />
        </View>
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
    const paddingBottom = variable.isIOS == false ? -25 : 0;
    let content = (
      <MultiselectCheckBoxList
        itemId={'id'}
        itemName={'name'}
        initheight={this.props.initheight - footer_height + paddingBottom}
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
    let footer = this._footer();
    let content = this._content();

    return (
      <View style={styles.modal_container}>
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
    backgroundColor: CMSColors.White,
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
    backgroundColor: CMSColors.modalfooter,
    borderTopWidth: 1,
    borderColor: CMSColors.footer_border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  modal_footer_Apply: {
    height: footer_height,
    backgroundColor: CMSColors.White,
    borderTopWidth: 1,
    borderColor: CMSColors.footer_border,
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
    height: 50,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
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

  button_apply: {
    height: 36,
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
});
