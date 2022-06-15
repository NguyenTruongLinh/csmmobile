import React from 'react';
import {View, StyleSheet} from 'react-native';
import {inject, observer} from 'mobx-react';
import Modal from 'react-native-modal';

import AuthenModal from '../common/AuthenModal';

import CMSColors from '../../styles/cmscolors';
import {VIDEO as VIDEO_TXT} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

const VIDEO_AUTHEN_VIEWS = [
  ROUTERS.VIDEO_PLAYER,
  ROUTERS.VIDEO_CHANNELS,
  ROUTERS.HEALTH_CHANNELS,
];

class NVRAuthenModal extends React.Component {
  constructor(props) {
    super(props);
  }

  onAuthenSubmit = ({username, password}) => {
    const {videoStore, onSubmit} = this.props;
    videoStore.onAuthenSubmit({username, password});
    if (onSubmit && typeof onSubmit == 'function') {
      onSubmit(username, password);
    }
  };

  render() {
    const {videoStore, appStore} = this.props;
    const currentScreen = appStore.naviService.getCurrentRouteName();
    __DEV__ &&
      console.log(
        'GOND !!! render Authen modal: ',
        videoStore.needAuthen,
        videoStore.showAuthenModal,
        videoStore.isAuthenCanceled
      );

    // return currentScreen == ROUTERS.VIDEO_PLAYER ||
    //   currentScreen == ROUTERS.VIDEO_CHANNELS ||
    //   currentScreen == ROUTERS.HEALTH_CHANNELS ? (
    return VIDEO_AUTHEN_VIEWS.includes(currentScreen) ? (
      <Modal
        isVisible={videoStore.needAuthen && videoStore.showAuthenModal}
        onBackdropPress={videoStore.onAuthenCancel}
        onBackButtonPress={videoStore.onAuthenCancel}
        backdropOpacity={0}
        style={{margin: 0}}>
        <View style={[styles.modalcontainer]}>
          <AuthenModal
            style={styles.authenModal}
            onOK={this.onAuthenSubmit}
            onCancel={videoStore.onAuthenCancel}
            username={videoStore.nvrUser}
            password={''}
            title={VIDEO_TXT.AUTHEN_TITLE}
          />
        </View>
      </Modal>
    ) : null;
  }
}

const styles = StyleSheet.create({
  modalcontainer: {
    flex: 1,
    backgroundColor: CMSColors.PrimaryColor54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authenModal: {flex: 0, width: 343, height: 303},
});

export default inject('videoStore', 'appStore')(observer(NVRAuthenModal));
