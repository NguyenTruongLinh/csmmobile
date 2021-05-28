// ----------------------------------------------------
// <!-- START CONST -->
//const PATH_ACTIONS = "../../actions";
//const PATH_VIEW = "../../actions";

// <!-- END CONST -->
// ----------------------------------------------------

// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  Alert,
  Platform,
  findNodeHandle,
  Dimensions,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview';
import validatejs from 'validate.js';

import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';

import navigationService from '../../navigation/navigationService';

import {createIconSetFromFontello} from 'react-native-vector-icons';
import fontelloConfig from '../../components/common/fontello/config.json';
import {Domain} from '../../consts/misc';
import styles from '../../styles/scenes/login.style';
import CMSColors from '../../styles/cmscolors';
import {I3_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';
const IconCustom = createIconSetFromFontello(fontelloConfig);

const backgroundImg = require('../../assets/images/intro/welcome.png');
// const launchscreenLogo = require('../../assets/images/CMS-logo-white.png');

const validators = validatejs.validators;
// <!-- END CONSTS -->
// ----------------------------------------------------

class LoginView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      canLogin: false,
      domain: '',
      username: '',
      password: '',
    };
    this.domainBox = null;
    this.usernameBox = null;
    this.passwordBox = null;
    this.keyboardView = null;
  }

  componentDidMount() {
    __DEV__ && console.log('LoginView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('LoginView componentWillUnmount');
  }

  onTypingDomain = text => {};

  onSubmitDomain = () => {
    this.usernameBox && this.usernameBox.focus();
  };

  onTypingUsername = text => {};

  onSubmitUserName = () => {
    this.passwordBox && this.passwordBox.focus();
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
    // let { errors = {} } = this.state;
    // this._scrollToInput(findNodeHandle(event.target));
    // for (let name in errors) {
    //   let ref = this.refs[name];
    //   if (ref && ref.isFocused && ref.isFocused()) {
    //     delete errors[name];
    //   }
    // }
    // this.setState({ errors });
  };

  onLogin = () => {};

  onBack = () => {
    console.log('GOND Login onback <');
    navigationService.back();
  };

  render() {
    const {width} = Dimensions.get('window');

    return (
      <View
        style={{flex: 1, paddingLeft: width * 0.1, paddingRight: width * 0.1}}>
        <KeyboardAwareScrollView
          // keyBoardShouldPersistTaps="always"
          ref={r => {
            this.keyboardView = r;
          }}
          // enableAutomaticScroll={true}
          contentContainerStyle={{flex: 1}}
          getTextInputRefs={() => [
            this.domainBox,
            this.usernameBox,
            this.passwordBox,
          ]}>
          <View style={{flex: 1}}>
            <View
              style={{
                flex: 5,
                marginTop: 16,
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}>
              <Button
                style={{
                  // width: width * 0.1,
                  alignItems: 'center',
                }}
                enable={true}
                type={'flat'}
                caption={'X'}
                styleCaption={{
                  color: 'CMSColors.PrimaryText',
                  fontSize: 24,
                  fontWeight: '500',
                }}
                onPress={this.onBack}
              />
            </View>
            <View style={{flex: 20}}>
              <Image
                source={I3_Logo}
                style={{
                  tintColor: CMSColors.Dark_Blue,
                  width: width * 0.5,
                  height: '100%',
                }}
                resizeMode="contain"
              />
            </View>
            <View
              style={{
                flex: 10,
                paddingTop: 28,
              }}>
              <Text style={{fontSize: 24, fontWeight: 'normal'}}>
                {LoginTxt.title}
                <Text style={{fontWeight: 'bold'}}>{LoginTxt.titleBold}</Text>
              </Text>
              <Text style={{fontSize: 16, paddingTop: 14}}>
                {LoginTxt.description}
              </Text>
            </View>
            <View
              style={[
                styles.all,
                styles.content,
                styles.centerContent,
                {flex: 35},
              ]}>
              {/* <View style={styles.centerContent}> */}
              <View style={{alignItems: 'center'}}>
                <InputTextIcon
                  ref={r => (this.domainBox = r)}
                  value={this.state.domain}
                  maxLength={60}
                  enablesReturnKeyAutomatically={true}
                  onEndEditing={this.onEndEditing}
                  onChangeText={this.onTypingDomain}
                  onSubmitEditing={this.onSubmitDomain}
                  returnKeyType="next"
                  iconCustom="earth-grid-select-language-button"
                  label={LoginTxt.domain}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  tintColor={CMSColors.PrimaryText}
                  textColor={CMSColors.PrimaryText}
                  baseColor={CMSColors.PrimaryText}
                  // error={errors.domain}
                  disabled={false}
                  secureTextEntry={false}
                />
                <InputTextIcon
                  ref={r => (this.usernameBox = r)}
                  name="username"
                  maxLength={60}
                  value={this.state.username}
                  autoCorrect={false}
                  enablesReturnKeyAutomatically={true}
                  onEndEditing={this.onEndEditing}
                  onFocus={event => {
                    this.onFocus(event);
                  }}
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
                  secureTextEntry={false}
                />
                <InputTextIcon
                  ref={r => (this.passwordBox = r)}
                  name="password"
                  maxLength={60}
                  autoCapitalize={'none'}
                  value={this.state.password}
                  autoCorrect={false}
                  enablesReturnKeyAutomatically={true}
                  onEndEditing={this.onEndEditing}
                  onFocus={event => {
                    this.onFocus(event);
                  }}
                  returnKeyType="next"
                  iconCustom="locked-padlock"
                  label={LoginTxt.password}
                  placeholder=""
                  // error={errors.password}
                  disabled={false}
                  tintColor={CMSColors.PrimaryText}
                  textColor={CMSColors.PrimaryText}
                  baseColor={CMSColors.PrimaryText}
                  secureTextEntry={true}
                />
              </View>
            </View>
            <View
              style={{
                flex: 30,
                // paddingTop: 20,
                alignItems: 'center',
                flexDirection: 'column',
              }}>
              <Button
                style={{
                  width: '100%',
                  marginTop: 40,
                }}
                caption="LOGIN"
                type="primary"
                styleCaption={{}}
                onPress={this.onLogin}
                enable={this.state.canLogin}
              />
              <Button
                style={{
                  width: '100%',
                  marginTop: 15,
                }}
                caption="FORGOT PASSWORD?"
                type="flat"
                styleCaption={{}}
                onPress={this.onLogin}
                enable={true}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }
}

export default inject('userStore')(observer(LoginView));
