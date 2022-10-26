// ----------------------------------------------------
// <!-- START MODULES -->

import React from 'react';
import {View, Text, StyleSheet, Dimensions, Platform} from 'react-native';
import {inject, observer} from 'mobx-react';
// import Modal from 'react-native-modal';
import Modal from '../../../components/views/CMSModal';
// import Ripple from 'react-native-material-ripple';

// import InputTextIcon from '../../../components/controls/InputTextIcon';
import CMSRipple from '../../../components/controls/CMSRipple';
import {IconCustom, ListViewHeight} from '../../../components/CMSStyleSheet';

import snackbarUtil from '../../../util/snackbar';
import variables from '../../../styles/variables';
import CMSColors from '../../../styles/cmscolors';
import theme from '../../../styles/appearance';
import ROUTERS from '../../../consts/routes';
import {
  HEALTH as HEALTH_TXT,
  VIDEO as VIDEO_TXT,
} from '../../../localization/texts';

class AlertActionsModal extends React.Component {
  static defaultProps = {
    data: {},
    siteAlerts: false,
  };

  constructor(props) {
    super(props);

    this.state = {};
    this._isMounted = false;
  }

  componentDidMount() {
    __DEV__ && console.log('HEALTH ActionsModals componentDidMount');
    this._isMounted = true;
  }

  componentWillUnmount() {
    __DEV__ && console.log('HEALTH ActionsModals componentWillUnmount');
    this._isMounted = false;
  }

  onDismissAlert = description => {
    const {healthStore} = this.props;
    healthStore.showActionsModal(false);
    // __DEV__ && console.log('HEALTH ActionsModals actions modal dismissed');

    setTimeout(() => {
      // __DEV__ && console.log('HEALTH ActionsModals show dismiss modal');
      healthStore.showDismissModal(true);
    }, 500);
  };

  onLiveSearchVideo = (isLive, data) => {
    const {sitesStore, healthStore, videoStore, navigation} = this.props;
    __DEV__ && console.log('GOND Health gotoVideo ... ', data);
    if (data.kDVR) {
      videoStore.onAlertPlay(isLive, data);
      // videoStore.onHealthPlay(isLive, data);
      setTimeout(() => {
        navigation.push(ROUTERS.VIDEO_PLAYER);
      }, 500);
    } else if (data.siteId) {
      sitesStore.selectSite(data.siteId);
      setTimeout(() => {
        navigation.push(ROUTERS.HEALTH_CHANNELS);
      }, 500);
    } else {
      __DEV__ &&
        console.log('GOND HealthMonitor onLiveSearch data not valid: ', data);
      snackbarUtil.onError(VIDEO_TXT.CHANNEL_ERROR);
      return;
    }
    healthStore.showActionsModal(false);
    healthStore.setVideoMode(isLive);
  };

  render() {
    const {height} = Dimensions.get('window');
    const {healthStore, siteAlerts, data, appStore} = this.props;
    const {showDismissAllButtonInHealthDetail, actionsModalShown} = healthStore;
    const {appearance} = appStore;

    return (
      <Modal
        isVisible={actionsModalShown}
        onBackdropPress={() => healthStore.showActionsModal(false)}
        // onSwipeOut={() => this.setState({showFilterModal: false})}
        onBackButtonPress={() => healthStore.showActionsModal(false)}
        backdropOpacity={0.1}
        key="healthActionModal"
        name="healthActionModal"
        style={[
          styles.actionModal,
          {
            marginTop:
              height - (showDismissAllButtonInHealthDetail ? 210 : 140),
          },
          theme[appearance].modalContainer,
        ]}>
        <CMSRipple
          style={[
            styles.actionRowContainer,
            // {borderWidth: 1, borderColor: 'red'},
          ]}
          onPress={() => this.onLiveSearchVideo(true, data)}>
          <IconCustom
            name="videocam-filled-tool"
            color={theme[appearance].iconColor}
            size={variables.fix_fontSize_Icon}
          />
          <Text style={[styles.actionText, theme[appearance].text]}>
            {VIDEO_TXT.LIVE}
          </Text>
        </CMSRipple>
        <CMSRipple
          style={styles.actionRowContainer}
          onPress={() => this.onLiveSearchVideo(false, data)}>
          <IconCustom
            name="searching-magnifying-glass"
            color={theme[appearance].iconColor}
            size={variables.fix_fontSize_Icon}
          />
          <Text style={[styles.actionText, theme[appearance].text]}>
            {VIDEO_TXT.SEARCH}
          </Text>
        </CMSRipple>
        {showDismissAllButtonInHealthDetail && (
          <CMSRipple
            style={styles.actionRowContainer}
            onPress={this.onDismissAlert}>
            <IconCustom
              name="double-tick-indicator"
              color={theme[appearance].iconColor}
              size={variables.fix_fontSize_Icon}
            />
            <Text style={[styles.actionText, theme[appearance].text]}>
              {siteAlerts ? HEALTH_TXT.DISMISS_ALL : HEALTH_TXT.DISMISS_CURRENT}
            </Text>
          </CMSRipple>
        )}
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {},
  actionModal: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: CMSColors.White,
  },
  actionRowContainer: {
    width: '100%',
    height: ListViewHeight,
    borderBottomWidth: 1,
    borderBottomColor: CMSColors.BorderColorListRow,
    paddingLeft: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {marginLeft: 14},
  actionButtonContainer: {
    position: 'absolute',
    right: 35,
    bottom: 28,
    width: 63,
    height: 63,
    borderRadius: 45,
    backgroundColor: CMSColors.PrimaryActive,
    justifyContent: 'center',
    alignItems: 'center',
    // android's shadow
    elevation: 5,
    // ios's shadow check later
    shadowOffset: {width: 14, height: 14},
    shadowColor: 'black',
    shadowOpacity: 0.7,
    shadowRadius: 45,
  },
});

export default inject(
  'healthStore',
  'sitesStore',
  'videoStore',
  'appStore'
)(observer(AlertActionsModal));
