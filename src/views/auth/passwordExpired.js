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
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {onPatch} from 'mobx-state-tree';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
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
const {width} = Dimensions.get('window');

class PasswordExpired extends Component {
  constructor(props) {
    super(props);
    const {loginInfo} = props.userStore;

    this.state = {
      username: loginInfo ? loginInfo.username : '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      errors: {
        username: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
    };
    this._refs = {
      username: null,
      oldPassword: null,
      newPassword: null,
      confirmPassword: null,
    };
    this.keyboardView = null;

    this.state = {};
  }

  componentDidMount() {
    __DEV__ && console.log('PasswordExpired componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('PasswordExpired componentWillUnmount');
  }

  onBack = () => {
    // __DEV__ && console.log('GOND Login onback <');
    // navigationService.back();
    this.props.appStore.naviService.back();
  };

  onEndEditing = (event, name) => {
    if (name && event.nativeEvent) {
      let {text} = event.nativeEvent;
      if (text != this.state[name]) {
        this.setState({[name]: text});
      }
    }
  };

  onFocus = event => {
    let {errors = {}} = this.state;
    // this._scrollToInput(findNodeHandle(event.target));
    for (let name in errors) {
      let ref = this._refs[name];
      // __DEV__ && console.log('GOND onFocus ref = ', ref);
      if (ref && ref.isFocused && ref.isFocused()) {
        delete errors[name];
      }
    }
    this.setState({errors});
  };

  onTypingUsername = text => {};

  onSubmitUserName = () => {
    this._refs.password && this._refs.password.focus();
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
          ref={r => {
            this.keyboardView = r;
          }}
          contentContainerStyle={{flex: 1}}
          getTextInputRefs={() => [this._refs.username, this._refs.password]}
          style={styles.viewContainer}>
          <View
            style={{
              flex: 1,
              // height: 450,
            }}>
            <View style={styles.topSpace}></View>
            <View style={{flex: 0.3}} />
            <Image source={CMS_Logo} style={styles.logo} resizeMode="contain" />
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
                onChangeText={this.onTypingUsername}
                onSubmitEditing={this.onSubmitUserName}
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
                ref={r => (this._refs.password = r)}
                name="oldPassword"
                maxLength={60}
                autoCapitalize={'none'}
                value={this.state.password}
                autoCorrect={false}
                enablesReturnKeyAutomatically={true}
                onEndEditing={this.onEndEditing}
                onFocus={this.onFocus}
                returnKeyType="next"
                iconCustom="locked-padlock"
                label={LoginTxt.oldPassword}
                placeholder=""
                // error={errors.password}
                disabled={false}
                tintColor={CMSColors.PrimaryText}
                textColor={CMSColors.PrimaryText}
                baseColor={CMSColors.PrimaryText}
                iconColor={CMSColors.InputIconColor}
                secureTextEntry={true}
                revealable={true}
              />
              <InputTextIcon
                // ref={r => (this._refs.password = r)}
                name="newPassword"
                maxLength={60}
                autoCapitalize={'none'}
                value={this.state.password}
                autoCorrect={false}
                enablesReturnKeyAutomatically={true}
                onEndEditing={this.onEndEditing}
                onFocus={this.onFocus}
                returnKeyType="next"
                iconCustom="locked-padlock"
                label={LoginTxt.newPassword}
                placeholder=""
                // error={errors.password}
                disabled={false}
                tintColor={CMSColors.PrimaryText}
                textColor={CMSColors.PrimaryText}
                baseColor={CMSColors.PrimaryText}
                iconColor={CMSColors.InputIconColor}
                secureTextEntry={true}
                revealable={true}
              />
              <InputTextIcon
                // ref={r => (this._refs.password = r)}
                name="confirmPassword"
                maxLength={60}
                autoCapitalize={'none'}
                value={this.state.password}
                autoCorrect={false}
                enablesReturnKeyAutomatically={true}
                onEndEditing={this.onEndEditing}
                onFocus={this.onFocus}
                returnKeyType="next"
                iconCustom="locked-padlock"
                label={LoginTxt.confirmPassword}
                placeholder=""
                // error={errors.password}
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
            <Button
              style={styles.buttonLogin}
              caption="SUBMIT"
              type="primary"
              captionStyle={{}}
              onPress={this.onLogin}
              enable={true}
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
