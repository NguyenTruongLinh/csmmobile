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
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {onPatch} from 'mobx-state-tree';
import call from 'react-native-phone-call';

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
const {width, height} = Dimensions.get('window');

class PasswordExpired extends Component {
  constructor(props) {
    super(props);
    const {loginInfo} = props.userStore;

    this.state = {
      username: loginInfo ? loginInfo.username : '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      newPasswordError: '',
      confirmPasswordError: '',
      newPasswordErrorFlag: false,
      confirmPasswordErrorFlag: false,
      isInputFocus: false,
    };
    this._refs = {
      username: null,
      oldPassword: null,
      newPassword: null,
      confirmPassword: null,
    };
  }

  componentDidMount() {
    __DEV__ && console.log('PasswordExpired componentDidMount');
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow.bind(this)
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide.bind(this)
    );
  }

  componentWillUnmount() {
    __DEV__ && console.log('PasswordExpired componentWillUnmount');
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow() {
    setTimeout(() => {
      this.setState({isInputFocus: true});
    }, 100);
  }

  _keyboardDidHide() {
    this.setState({isInputFocus: false});
  }

  onBack = () => {
    this.props.appStore.naviService.back();
  };

  onEndEditing = (event, name) => {
    if (name && event.nativeEvent) {
      let {text} = event.nativeEvent;
      if (text != this.state[name]) {
        this.setState({[name]: text});
      }
      this.updateError(name, text);
    }
  };

  updateError = (name, text) => {
    this.setState({
      newPasswordErrorFlag:
        name === 'newPassword' || this.state.newPasswordErrorFlag,
      confirmPasswordErrorFlag:
        name === 'confirmPassword' || this.state.confirmPasswordErrorFlag,
    });
  };

  onFocus = event => {};

  onTypingNewPassword = text => {
    const newPasswordError =
      text.length > 0 && text.length < 10
        ? 'Password must contain at least 10 characters'
        : null;
    const confirmPasswordError =
      // !newPasswordError &&
      text.length > 0 &&
      this.state.confirmPassword.length > 0 &&
      text != this.state.confirmPassword
        ? 'Password does not match!'
        : null;
    this.setState({
      newPasswordError,
      confirmPasswordError,
    });
  };

  onTypingConfirmPassword = text => {
    const confirmPasswordError =
      text.length > 0 &&
      // !this.state.newPasswordError &&
      text != this.state.newPassword
        ? 'Password does not match!'
        : '';
    this.setState({
      confirmPasswordError,
    });
  };

  onUserNameNextPress = () => {
    this._refs.oldPassword && this._refs.oldPassword.focus();
  };
  onOldPasswordNextPress = () => {
    this._refs.newPassword && this._refs.newPassword.focus();
  };
  onNewPasswordNextPress = () => {
    this._refs.confirmPassword && this._refs.confirmPassword.focus();
  };

  onSubmit = () => {
    const {username, oldPassword, newPassword} = this.state;
    if (this.props.userStore) {
      this.props.userStore.changePassword(username, oldPassword, newPassword);
    } else {
      __DEV__ &&
        console.log(
          'GOND onSubmit failed, no userStore available!',
          this.props
        );
    }
  };

  render() {
    const {
      domain,
      username,
      oldPassword,
      newPassword,
      confirmPassword,
      newPasswordError,
      confirmPasswordError,
      newPasswordErrorFlag,
      confirmPasswordErrorFlag,
    } = this.state;
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
        <View style={styles.viewContainer}>
          <View style={styles.topSpace}></View>
          <View style={{flex: 0.3}} />
          <Image
            source={CMS_Logo}
            style={[
              styles.logo,
              {
                display:
                  height < 1000 && this.state.isInputFocus ? 'none' : 'flex',
              },
            ]}
            resizeMode="contain"
          />
          <View style={{flex: 0.3}} />
          <Text style={styles.textTitle}>{LoginTxt.changePasswordTitte}</Text>
          <View style={{flex: 0.05}} />
          <Text style={styles.textDesc}>
            {LoginTxt.changePassworDescription}
          </Text>
          <View style={{flex: 0.1}} />
          <View style={[styles.content, styles.centerContent]}>
            <InputTextIcon
              ref={r => (this._refs.username = r)}
              name="username"
              maxLength={60}
              value={this.state.username}
              autoCorrect={false}
              enablesReturnKeyAutomatically={true}
              onEndEditing={this.onEndEditing}
              onFocus={this.onFocus}
              onSubmitEditing={this.onUserNameNextPress}
              returnKeyType="next"
              autoCapitalize={'none'}
              iconCustom="user-shape"
              label={LoginTxt.username}
              placeholder=""
              // error={errors.username}
              disabled={false}
              tintColor={CMSColors.PrimaryText}
              textColor={CMSColors.PrimaryText}
              baseColor={CMSColors.PrimaryText}
              iconColor={CMSColors.InputIconColor}
              secureTextEntry={false}
            />
            <InputTextIcon
              ref={r => (this._refs.oldPassword = r)}
              name="oldPassword"
              maxLength={60}
              autoCapitalize={'none'}
              value={this.state.password}
              autoCorrect={false}
              enablesReturnKeyAutomatically={true}
              onEndEditing={this.onEndEditing}
              onFocus={this.onFocus}
              onSubmitEditing={this.onOldPasswordNextPress}
              returnKeyType="next"
              iconCustom="locked-padlock"
              label={LoginTxt.oldPassword}
              placeholder=""
              // error={errors.oldPassword}
              disabled={false}
              tintColor={CMSColors.PrimaryText}
              textColor={CMSColors.PrimaryText}
              baseColor={CMSColors.PrimaryText}
              iconColor={CMSColors.InputIconColor}
              secureTextEntry={true}
              revealable={true}
            />
            <InputTextIcon
              ref={r => (this._refs.newPassword = r)}
              name="newPassword"
              maxLength={60}
              autoCapitalize={'none'}
              value={this.state.newPassword}
              autoCorrect={false}
              enablesReturnKeyAutomatically={true}
              onEndEditing={this.onEndEditing}
              onChangeText={this.onTypingNewPassword}
              onFocus={this.onFocus}
              onSubmitEditing={this.onNewPasswordNextPress}
              returnKeyType="next"
              iconCustom="locked-padlock"
              label={LoginTxt.newPassword}
              placeholder=""
              error={newPasswordErrorFlag && newPasswordError}
              disabled={false}
              tintColor={CMSColors.PrimaryText}
              textColor={CMSColors.PrimaryText}
              baseColor={CMSColors.PrimaryText}
              iconColor={CMSColors.InputIconColor}
              secureTextEntry={true}
              revealable={true}
            />
            <InputTextIcon
              ref={r => (this._refs.confirmPassword = r)}
              name="confirmPassword"
              maxLength={60}
              autoCapitalize={'none'}
              value={this.state.confirmPassword}
              autoCorrect={false}
              enablesReturnKeyAutomatically={true}
              onChangeText={this.onTypingConfirmPassword}
              onEndEditing={this.onEndEditing}
              onFocus={this.onFocus}
              returnKeyType="next"
              iconCustom="locked-padlock"
              label={LoginTxt.confirmPassword}
              placeholder=""
              error={confirmPasswordErrorFlag && confirmPasswordError}
              //   !this.state.confirmPassword ||
              //   this.state.confirmPassword === this.state.newPassword
              //     ? ''
              //     : LoginTxt.confirmPasswordError
              // }
              // marginTopExtended={newPasswordErrorFlag && newPasswordError}
              disabled={false}
              tintColor={CMSColors.PrimaryText}
              textColor={CMSColors.PrimaryText}
              baseColor={CMSColors.PrimaryText}
              iconColor={CMSColors.InputIconColor}
              secureTextEntry={true}
              revealable={true}
            />
          </View>
          <View style={{flex: 0.3}} />
          <View
            style={{
              height: this.state.isInputFocus ? 160 : 0,
            }}
          />
          <Button
            style={styles.buttonLogin}
            caption="SUBMIT"
            type="primary"
            captionStyle={{}}
            onPress={this.onSubmit}
            enable={
              username &&
              oldPassword &&
              newPassword &&
              confirmPassword &&
              !newPasswordError &&
              !confirmPasswordError
            }
          />
        </View>
        <View style={{flex: 0.05}} />
        <View style={styles.copyRight}>
          <Image
            source={I3_Logo}
            style={styles.copyRightLogo}
            resizeMode="contain"
          />
          <Text style={styles.copyRightText}>{LoginTxt.copyRight}</Text>
        </View>
        <View style={styles.space_footer} />
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
  topSpace: {
    height: 30,
  },
  logo: {
    tintColor: CMSColors.Dark_Blue,
    height: 56,
    alignSelf: 'center',
  },
  space: {
    flex: 0.3,
  },
  lock: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  space_text: {
    flex: 0.15,
  },
  space_footer: {
    flex: 0.05,
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    borderColor: 'blue',
    borderWidth: 1,
  },
  buttonLogin: {
    width: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: CMSColors.PrimaryText,
  },
  textDesc: {
    fontSize: 14,
    color: CMSColors.SecondaryText,
    lineHeight: 20,
  },
  phone: {
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
  },
  content: {
    maxWidth: variable.deviceWidth,
    backgroundColor: CMSColors.Transparent,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexDirection: 'column',
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

export default inject('userStore', 'appStore')(observer(PasswordExpired));
