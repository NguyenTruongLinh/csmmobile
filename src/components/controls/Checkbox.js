import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import PropTypes from 'prop-types';

import Ripple from 'react-native-material-ripple';

import {IconCustom} from '../CMSStyleSheet';

import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';

class Checkbox extends Component {
  static propTypes = {
    label: PropTypes.string,
    checked: PropTypes.bool,
    onPress: PropTypes.func,
    style: PropTypes.any,
  };

  static defaultProps = {
    label: '',
    checked: false,
    onPress: () => {},
    style: {},
  };

  constructor(props) {
    super(props);
  }

  checkedIcon = checked => {
    if (checked === true) {
      return (
        <View style={[styles.checkboxIcon, styles.checkedboxIcon]}>
          <IconCustom
            name={'check-symbol'}
            color={CMSColors.White}
            size={variables.fix_fontSire}
          />
        </View>
      );
    } else {
      return (
        <View
          style={[
            styles.checkboxIcon,
            {backgroundColor: CMSColors.White},
          ]}></View>
      );
    }
  };

  render() {
    const {label, checked, onPress, style} = this.props;
    const check_uncheck_Icon = this.checkedIcon(checked);

    return (
      <View style={[styles.checkboxContainer, style]}>
        <Ripple style={[styles.checkboxRipple]} onPress={() => onPress()}>
          <View style={{paddingRight: 12}}>{check_uncheck_Icon}</View>
          <Text style={styles.checkboxLabel}>{label}</Text>
        </Ripple>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
  },
  checkboxRipple: {
    flexDirection: 'row',
  },
  checkedboxIcon: {
    borderColor: CMSColors.PrimaryColor,
    backgroundColor: CMSColors.PrimaryColor,
    flex: 1,
  },
  checkboxIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'rgba(01,01,01,0.54)',
  },
  checkboxLabel: {
    fontSize: 16,
    color: CMSColors.PrimaryText,
  },
});

export default Checkbox;
