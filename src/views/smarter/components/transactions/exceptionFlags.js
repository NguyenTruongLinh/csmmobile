import React from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';

import {IconCustom} from '../../../../components/CMSStyleSheet';

import variables from '../../../../styles/variables';
import styles from '../../styles/transactionsStyles';

class ExceptionFlags extends React.PureComponent {
  static PropTypes = {
    trans: PropTypes.object,
  };

  static defaultProps = {
    trans: {},
  };

  render() {
    const {trans} = this.props;
    if (!trans || trans.exceptionTypes.length === 0) return null;

    let reversed = trans.exceptionTypes
      .slice(0, trans.exceptionTypes.length)
      .reverse();

    return reversed.map((flag, index) => (
      <View
        key={'flag_' + index}
        style={[
          styles.flagsContainer,
          {left: index * variables.exceptionFlagOffset},
        ]}>
        <IconCustom size={20} color={flag.color} name="ic_flag_black_48px" />
      </View>
    ));
  }
}

export default ExceptionFlags;
