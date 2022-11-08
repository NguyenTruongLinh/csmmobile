import React, {Component} from 'react';
import {StyleSheet, Text} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ripple from 'react-native-material-ripple';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';

class Radio extends Component {
  static PropTypes = {
    label: PropTypes.string,
    checked: PropTypes.bool,
    onPress: PropTypes.func,
    style: PropTypes.any,
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    label: '',
    checked: false,
    onPress: () => {},
    style: {},
    disabled: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedId: props.selectedId,
    };
  }

  render() {
    const {label, onPress, style, checked, appStore, disabled} = this.props;
    const {appearance} = appStore;

    return (
      <Ripple
        style={[styles.radioButtonContainer, style]}
        onPress={() => {
          onPress && onPress();
        }}
        disabled={disabled}>
        <Icon
          name={checked ? 'dot-circle-o' : 'circle-o'}
          size={24}
          color={disabled ? CMSColors.SecondaryText : CMSColors.PrimaryActive}
        />
        <Text
          style={[
            styles.text,
            disabled
              ? {color: CMSColors.SecondaryText}
              : theme[appearance].text,
          ]}>
          {label}
        </Text>
      </Ripple>
    );
  }
}

const styles = StyleSheet.create({
  radioButtonContainer: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 22,
  },
});

export default inject('appStore')(observer(Radio));
