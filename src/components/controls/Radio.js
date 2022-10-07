import React, {Component} from 'react';
import {StyleSheet, Text} from 'react-native';
import PropTypes from 'prop-types';

import Icon from 'react-native-vector-icons/FontAwesome';
import Ripple from 'react-native-material-ripple';

import CMSColors from '../../styles/cmscolors';

class Radio extends Component {
  static PropTypes = {
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
    this.state = {
      selectedId: props.selectedId,
    };
  }

  render() {
    const {label, onPress, style, checked} = this.props;
    return (
      <Ripple
        style={[styles.radioButtonContainer, style]}
        onPress={() => {
          onPress && onPress();
        }}>
        <Icon
          name={checked ? 'dot-circle-o' : 'circle-o'}
          size={24}
          color={CMSColors.PrimaryActive}
        />
        <Text style={styles.text}>{label}</Text>
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

export default Radio;
