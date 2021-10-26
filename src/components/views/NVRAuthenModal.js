import React from 'react';
import {View, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';

import AuthenModal from '../common/AuthenModal';

import CMSColors from '../../styles/cmscolors';
import {VIDEO as VIDEO_TXT} from '../../localization/texts';
import {inject, observer} from 'mobx-react';

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
    const {videoStore} = this.props;

    return (
      <Modal
        isVisible={videoStore.showAuthenModal}
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
    );
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

export default inject('videoStore')(observer(NVRAuthenModal));
