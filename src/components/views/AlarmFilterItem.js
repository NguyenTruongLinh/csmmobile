import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import Button from '../controls/Button';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/alarmFilterStyles';

class AlarmFilterItem extends React.Component {
  static propTypes = {
    data: PropTypes.object,
  };

  static defaultProps = {
    data: {},
  };

  render() {
    const {data, appStore} = this.props;
    const {appearance} = appStore;

    return (
      <View style={[styles.addMoreButtonContainer, data.style]}>
        <Button
          style={[
            styles.button_FilterMore_Add,
            data.isActive ? null : theme[appearance].alarmSearchButtonFilter,
          ]}
          caption={data.caption}
          iconCustom="i-add"
          iconColor={CMSColors.ActionText}
          iconSize={18}
          type="primary"
          enable={true}
          onPress={data.onPress}
          captionStyle={[
            styles.buttonFilterMoreCaption,
            theme[appearance].text,
            data.isActive ? styles.button_FilterMore_Add_Active : null,
          ]}
          iconStyle={[
            theme[appearance].text,
            data.isActive ? styles.button_FilterMore_Add_Active : null,
          ]}
        />
      </View>
    );
  }
}

export default inject('appStore')(observer(AlarmFilterItem));
