import React, {Component} from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Text,
  Image,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {onPatch} from 'mobx-state-tree';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
// import validatejs from 'validate.js';

import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';

// import navigationService from '../../navigation/navigationService';

import {isValidHttpUrl} from '../../util/general';

import {Domain} from '../../consts/misc';
import APP_INFO from '../../consts/appInfo';
import variable from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';
import {I3_Logo, Lock} from '../../consts/images';
import {CMS_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';

// const backgroundImg = require('../../assets/images/intro/welcome.png');
// const launchscreenLogo = require('../../assets/images/CMS-logo-white.png');

// const validators = validatejs.validators;
// <!-- END CONSTS -->
// ----------------------------------------------------
const {width} = Dimensions.get('window');

class AccountLocked extends Component {
  constructor(props) {
    super(props);
    const {loginInfo} = props.userStore;

    this.state = {};
  }

  componentDidMount() {
    __DEV__ && console.log('AccountLocked componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('AccountLocked componentWillUnmount');
  }

  onBack = () => {
    // __DEV__ && console.log('GOND Login onback <');
    // navigationService.back();
    this.props.appStore.naviService.back();
  };

  render() {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
        <Button
          style={styles.closeButton}
          enable={true}
          type={'flat'}
          iconCustom={'clear-button'}
          iconSize={16}
          iconStyleEnable={{
            color: CMSColors.ColorText,
          }}
          onPress={this.onBack}
        />

        <KeyboardAwareScrollView
          // ref={r => {
          //   this.keyboardView = r;
          // }}
          contentContainerStyle={{flex: 1}}
          // getTextInputRefs={() => [
          //   this._refs.domain,
          //   this._refs.username,
          //   this._refs.password,
          // ]}
          style={styles.viewContainer}>
          <View
            style={{
              flex: 1,
            }}>
            <View style={styles.closeButtonContainer}></View>
            <View style={styles.space} />
            <Image source={CMS_Logo} style={styles.logo} resizeMode="contain" />
            <View style={styles.space} />
            <Image source={Lock} style={styles.lock} resizeMode="contain" />
            <View style={styles.space} />
            <View style={styles.textContainer}>
              <Text style={styles.textBold}>{LoginTxt.accountLocked}</Text>
              <Text style={styles.textDesc}>{LoginTxt.description}</Text>
            </View>
            <View style={styles.space} />
            <View style={styles.buttonsContainer}>
              <Button
                style={styles.buttonLogin}
                caption="BACK TO LOGIN"
                type="primary"
                captionStyle={{}}
                onPress={this.onLogin}
                enable={true}
              />
            </View>
          </View>
          <View style={styles.space} />
          <View style={styles.copyRight}>
            <Image
              source={I3_Logo}
              style={styles.copyRightLogo}
              resizeMode="contain"
            />
            <Text style={styles.copyRightText}>{LoginTxt.copyRight}</Text>
          </View>
          <View style={styles.space_footer} />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }
}

const dim = Dimensions.get('window');

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    paddingHorizontal: width * 0.1,
  },
  closeButton: {
    width: 30,
    // alignItems: 'center',
    position: 'absolute',
    right: width * 0.1 - 30,
    top: width * 0.1 - 36,
    zIndex: 10,
  },
  closeButtonContainer: {
    height: 30,
    flexDirection: 'column',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  logoContainer: {
    height: 60,
    flexDirection: 'column',
  },
  logo: {
    tintColor: CMSColors.Dark_Blue,
    width: width * 0.3,
    alignSelf: 'center',
  },
  space: {
    // flex: 0.3,
  },
  lock: {
    width: 50,
    height: 50,
    alignSelf: 'center',
  },
  space_footer: {
    // flex: 0.05,
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonLogin: {
    width: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  textTitle: {fontSize: 20, fontWeight: 'normal'},
  textBold: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  textDesc: {
    fontSize: 15,
  },
  copyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyRightLogo: {
    tintColor: CMSColors.Dark_Blue,
    width: '32%',
    height: '100%',
  },
  copyRightText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 5,
  },
});

export default inject('userStore', 'appStore')(observer(AccountLocked));
