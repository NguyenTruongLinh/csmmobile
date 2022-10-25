import React, {Component} from 'react';
import {
  View,
  SafeAreaView,
  Text,
  Image,
  Dimensions,
  Keyboard,
} from 'react-native';

import {inject, observer} from 'mobx-react';

import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import {I3_Logo} from '../../consts/images';
import {CMS_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';

// const validators = validatejs.validators;
// <!-- END CONSTS -->
// ----------------------------------------------------
const {height} = Dimensions.get('window');

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
    let newPasswordError = null;
    if (text.length > 0) {
      if (text.length < 10)
        newPasswordError = 'Password must contain at least 10 characters';
      else {
        const hasNumber = /[0-9]+/;
        const hasUpperChar = /[A-Z]+/;
        const hasLowerChar = /[a-z]+/;
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        if (
          !hasNumber.test(text) ||
          !hasUpperChar.test(text) ||
          !hasLowerChar.test(text) ||
          !hasSpecialChar.test(text)
        ) {
          newPasswordError =
            'Password must contain at least (A-Z,a-z,0-9,ex:@ any).';
        }
      }
    }
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
    const {appearance} = this.props.appStore;

    return (
      <SafeAreaView style={[{flex: 1}, theme[appearance].container]}>
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
          <Text style={[styles.textTitle, theme[appearance].text]}>
            {LoginTxt.changePasswordTitte}
          </Text>
          <View style={{flex: 0.05}} />
          <Text style={[styles.textDesc, theme[appearance].text]}>
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
              disabled={false}
              iconColor={theme[appearance].inputIconColor}
              secureTextEntry={false}
              fixAndroidBottomLineBottom={0}
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
              disabled={false}
              iconColor={theme[appearance].inputIconColor}
              secureTextEntry={true}
              revealable={true}
              fixAndroidBottomLineBottom={0}
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
              iconColor={theme[appearance].inputIconColor}
              secureTextEntry={true}
              revealable={true}
              fixAndroidBottomLineBottom={0}
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
              disabled={false}
              iconColor={theme[appearance].inputIconColor}
              secureTextEntry={true}
              revealable={true}
              fixAndroidBottomLineBottom={0}
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
          <Text style={[styles.copyRightText, theme[appearance].text]}>
            {LoginTxt.copyRight}
          </Text>
        </View>
        <View style={styles.space_footer} />
      </SafeAreaView>
    );
  }
}

export default inject('userStore', 'appStore')(observer(PasswordExpired));
