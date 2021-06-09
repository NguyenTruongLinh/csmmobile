import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, View, Platform} from 'react-native';

import Button from '../controls/Button';
import MultiselectCheckBoxList from '../controls/MultiselectCheckBoxList';

import CMSColors from '../../styles/cmscolors';
import {getwindow} from '../../util/general';

const {width, height} = getwindow(); //Dimensions.get('window');

const header_height = 50;
const footer_height = 50;

const TemperatureAlarmData = [
  {
    id: 113,
    name: 'Temperature out of range',
    Desc: '',
    FlagTime: null,
    TypeWeight: 0,
  },
  {
    id: 114,
    name: 'Not wearing mask',
    Desc: '',
    FlagTime: null,
    TypeWeight: 0,
  },
  {
    id: 115,
    name: 'Increasing temperature rate by day',
    Desc: '',
    FlagTime: null,
    TypeWeight: 0,
  },
];

export default class TemperatureFilter extends Component {
  static propTypes = {
    tempAlarms: PropTypes.array,
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

  renderFooter = () => {
    // if( this.props.footercontent)
    // {
    //   return(<View style={styles.modal_footer_Apply}>{ this.props.footercontent}</View>);
    // }
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

  onAlarmSelected = alarms => {
    this.setState({selectedAlarms: alarms});
  };

  renderBody = () => {
    const paddingBottom = Platform.OS === 'ios' ? 0 : -25;
    let content = (
      <MultiselectCheckBoxList
        itemId={'id'}
        itemName={'name'}
        initheight={this.props.initheight - footer_height + paddingBottom}
        initwidth={this.props.initwidth - footer_height}
        scr_width={width}
        scr_height={height}
        rotatable={this.props.rotatable}
        onSelectionChanged={this.onAlarmSelected}
        selectedItems={this.state.selectedAlarms}
        data={TemperatureAlarmData}
        titleText={'Temperature alarm settings'}
        showTitleIcon={true}
        titleIconName={'ic-temperature-32px'}
        showItemIcon={false}
        enableAllSelection={false}
        enableSearch={false}
        enableSort={false}
        showSelectAll={false}
      />
    );

    return content;
  };

  ButtonClick = isOK => {
    if (!this.props.onSubmit) return;
    let param = null;
    if (isOK) {
      let {selectedAlarms} = this.state;
      param = {selectedTemperatureAlarms: selectedAlarms};
    }
    //  __DEV__ && console.log('GOND ------------------- param = ', param);
    this.props.onSubmit(isOK, param);
  };

  render() {
    return (
      <View style={styles.modal_container}>
        <View style={styles.modal_body}>{this.renderBody()}</View>
        {this.renderFooter()}
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
