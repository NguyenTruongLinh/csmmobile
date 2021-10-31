// ----------------------------------------------------
// <!-- START MODULES -->

import React from 'react';
import {View, Text, StyleSheet, Dimensions, Platform} from 'react-native';
import {inject, observer} from 'mobx-react';
import Modal from 'react-native-modal';
import Ripple from 'react-native-material-ripple';

// import InputTextIcon from '../../../components/controls/InputTextIcon';
import {IconCustom, ListViewHeight} from '../../../components/CMSStyleSheet';

import variables from '../../../styles/variables';
import CMSColors from '../../../styles/cmscolors';
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
    const {sitesStore, healthStore, navigation} = this.props;
    __DEV__ && console.log('GOND Health gotoVideo ... ', data);
    sitesStore.selectSite(data.id);
    healthStore.showActionsModal(false);
    healthStore.setVideoMode(isLive);
    setTimeout(() => {
      navigation.push(ROUTERS.HEALTH_CHANNELS);
    }, 500);
  };

  render() {
    const {height} = Dimensions.get('window');
    const {healthStore, siteAlerts, data} = this.props;
    const {showDismissAllButtonInHealthDetail, actionsModalShown} = healthStore;

    return (
      <Modal
        isVisible={actionsModalShown}
        onBackdropPress={() => healthStore.showActionsModal(false)}
        // onSwipeOut={() => this.setState({showFilterModal: false})}
        onBackButtonPress={() => healthStore.showActionsModal(false)}
        backdropOpacity={0.1}
        style={[
          styles.actionModal,
          {
            marginTop:
              height - (showDismissAllButtonInHealthDetail ? 210 : 140),
          },
        ]}>
        <Ripple
          style={[
            styles.actionRowContainer,
            // {borderWidth: 1, borderColor: 'red'},
          ]}
          onPress={() => this.onLiveSearchVideo(true, data)}>
          <IconCustom
            name="videocam-filled-tool"
            color={CMSColors.IconButton}
            size={variables.fix_fontSize_Icon}
          />
          <Text style={styles.actionText}>{VIDEO_TXT.LIVE}</Text>
        </Ripple>
        <Ripple
          style={styles.actionRowContainer}
          onPress={() => this.onLiveSearchVideo(false, data)}>
          <IconCustom
            name="searching-magnifying-glass"
            color={CMSColors.IconButton}
            size={variables.fix_fontSize_Icon}
          />
          <Text style={styles.actionText}>{VIDEO_TXT.SEARCH}</Text>
        </Ripple>
        {showDismissAllButtonInHealthDetail && (
          <Ripple
            style={styles.actionRowContainer}
            onPress={this.onDismissAlert}>
            <IconCustom
              name="double-tick-indicator"
              color={CMSColors.IconButton}
              size={variables.fix_fontSize_Icon}
            />
            <Text style={styles.actionText}>
              {siteAlerts ? HEALTH_TXT.DISMISS_ALL : HEALTH_TXT.DISMISS_CURRENT}
            </Text>
          </Ripple>
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

export default inject('healthStore', 'sitesStore')(observer(AlertActionsModal));
