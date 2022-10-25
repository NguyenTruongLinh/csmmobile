import React, {Component} from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import CMSTouchableIcon from '../../../components/containers/CMSTouchableIcon';

import styles from '../styles/sitesStyles';
import theme from '../../../styles/appearance';

import ROUTERS from '../../../consts/routes';

class HealthBackRow extends Component {
  static propTypes = {
    isHealthRoute: PropTypes.bool,
    data: PropTypes.object,
    onRowOpen: PropTypes.func,
  };

  static defaultProps = {
    isHealthRoute: false,
    data: {},
    onRowOpen: () => {},
  };

  onDismissSiteAlerts = item => {
    const {isHealthRoute, healthStore, onRowOpen} = this.props;

    if (!isHealthRoute) return;

    __DEV__ && console.log(` selectSite 5 item = `, JSON.stringify(item));
    healthStore.selectSite(item.id);
    onRowOpen && onRowOpen();
    healthStore.showDismissModal(true);
  };

  gotoVideo = (isLive, data) => {
    const {sitesStore, healthStore, appStore} = this.props;
    __DEV__ && console.log('GOND Health gotoVideo ... ', data);
    __DEV__ && console.log(` selectSite 8 data = `, JSON.stringify(data));
    sitesStore.selectSite(data.id);
    healthStore.setVideoMode(isLive);
    appStore.naviService.push(ROUTERS.HEALTH_CHANNELS);
  };

  render() {
    const {isHealthRoute, data, appStore} = this.props;
    const {appearance} = appStore;

    if (!isHealthRoute) return null;

    return (
      <View style={[styles.backRowContainer, theme[appearance].modalContainer]}>
        <View style={styles.backRowLeft}>
          <View style={styles.backRowButtonContainer}>
            <CMSTouchableIcon
              iconCustom="double-tick-indicator"
              size={26}
              onPress={() => this.onDismissSiteAlerts(data)}
              color={theme[appearance].iconColor}
            />
          </View>
        </View>
        <View style={styles.backRowRight}>
          <View style={styles.backRowButtonContainer}>
            <CMSTouchableIcon
              iconCustom="searching-magnifying-glass"
              size={26}
              onPress={() => this.gotoVideo(false, data)}
              color={theme[appearance].iconColor}
            />
          </View>
          <View style={styles.backRowButtonContainer}>
            <CMSTouchableIcon
              iconCustom="videocam-filled-tool"
              size={26}
              onPress={() => this.gotoVideo(true, data)}
              color={theme[appearance].iconColor}
            />
          </View>
        </View>
      </View>
    );
  }
}

export default inject(
  'sitesStore',
  'healthStore',
  'appStore'
)(observer(HealthBackRow));
