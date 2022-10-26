// ----------------------------------------------------
// <!-- START MODULES -->

import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {inject, observer} from 'mobx-react';
// import Modal from 'react-native-modal';
import Modal from './CMSModal';

import CMSColors from '../../styles/cmscolors';
import ROUTERS from '../../consts/routes';
import {STREAM_STATUS} from '../../localization/texts';
import Button from '../../components/controls/Button';
import {Warning_Img} from '../../consts/images';
import theme from '../../styles/appearance';

class PermissionModal extends React.Component {
  static defaultProps = {
    hideOnDefault: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      showed: !props.hideOnDefault,
    };
    this._isMounted = false;
  }

  componentDidMount() {
    __DEV__ && console.log('VIDEO PermissionModal componentDidMount');
    this._isMounted = true;
  }

  componentWillUnmount() {
    __DEV__ && console.log('VIDEO PermissionModal componentWillUnmount');
    this._isMounted = false;
  }

  show = isShowed => {
    this.setState({showed: isShowed});
  };

  onOK = () => {
    const {hideOnDefault, appStore} = this.props;
    if (hideOnDefault) this.setState({showed: false});
    else {
      this.setState({showed: false}, () => appStore.naviService.goBack());
      // appStore.naviService.goBack();
    }
  };

  render() {
    const {videoStore, appStore} = this.props;
    const {appearance} = appStore;
    // const hasNVRPermission = videoStore.hasNVRPermission;
    __DEV__ &&
      console.log(
        'GOND Render modal',
        videoStore.isAPIPermissionSupported,
        videoStore.isNoPermission,
        videoStore.authenticationState
      );
    return (
      <Modal
        isVisible={videoStore.isNoPermission && this.state.showed}
        onBackdropPress={() => this.onOK()}
        onBackButtonPress={() => this.onOK()}
        backdropOpacity={0.1}
        key="permissionModal"
        name="permissionModal"
        style={styles.containerModal}>
        <View
          style={[styles.containerContent, theme[appearance].modalContainer]}>
          <Image
            source={Warning_Img}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={[styles.actionText, theme[appearance].text]}>
            {STREAM_STATUS.NO_PERMISSION}
          </Text>
          <Button
            style={styles.button}
            title="OK"
            caption={'OK'}
            iconSize={24}
            backgroundColor={CMSColors.White}
            textColor={CMSColors.PrimaryActive}
            captionStyle={{color: CMSColors.PrimaryColor, fontSize: 20}}
            type="flat"
            enable={true}
            onPress={() => this.onOK()}
          />
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  containerModal: {
    flex: 1,
    bottom: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  containerContent: {
    position: 'absolute',
    flex: 1,
    bottom: 0,
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    height: 300,
    padding: 20,
    maxHeight: 300,
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: CMSColors.White,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  icon: {
    position: 'absolute',
    top: 50,
    width: 55,
    height: 55,
  },
  actionText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 40,
    height: 50,
    borderColor: CMSColors.PrimaryActive,
    borderWidth: 2,
    width: '100%',
    alignContent: 'center',
    justifyContent: 'center',
  },
});

export default inject('videoStore', 'appStore')(observer(PermissionModal));
