import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
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
import styles from '../../styles/scenes/login.style';
import CMSColors from '../../styles/cmscolors';
import {I3_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';

// const backgroundImg = require('../../assets/images/intro/welcome.png');
// const launchscreenLogo = require('../../assets/images/CMS-logo-white.png');

// const validators = validatejs.validators;
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
      errors: {
        domain: '',
        username: '',
        password: '',
      },
    };
    this._refs = {
      domain: null,
      username: null,
      password: null,
    };
    this.keyboardView = null;
    this.lastLoginError = '';
    onPatch(props.userStore, this.onStoreChanged);
  }

  componentDidMount() {
    __DEV__ && console.log('LoginView componentDidMount');
    this.props.appStore.setLoading(false);
  }

  componentWillUnmount() {
    __DEV__ && console.log('LoginView componentWillUnmount');
  }

  // static getDerivedStateFromProps(nextProps, nextState) {
  //   __DEV__ && console.log('LoginView getDerivedStateFromProps: ', nextProps);
  // }

  onStoreChanged = newValues => {
    const {error, isLoggedIn} = this.props.userStore;
    if (error != this.lastLoginError) {
      this.lastLoginError = error;
      error && Alert.alert(LoginTxt.errorTitle, error);
      return;
    }
    // if (newValues.path == '/isLoggedIn' && isLoggedIn === true)
    //   Alert.alert('Login successfully', 'Yay!');
  };

  onTypingDomain = text => {};

  onSubmitDomain = () => {
    this._refs.username && this._refs.username.focus();
  };

  onTypingUsername = text => {};

  onSubmitUserName = () => {
    this._refs.password && this._refs.password.focus();
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

  removeSpecificPort = domain => {
    let ssl_port = ':443';
    let nonssl_port = ':80';
    let isSSL = domain.startsWith('https://');
    let specificPort = isSSL ? ssl_port : nonssl_port;

    if (domain.endsWith(specificPort) || domain.includes(specificPort + '/'))
      domain = domain.replace(specificPort, '');
    if (domain.endsWith('/')) {
      domain = domain.substring(0, domain.length - 1);
    }
    return domain;
  };

  validatedomain = domain => {
    if (!domain) return;

    if (!domain.startsWith('http://') && !domain.startsWith('https://'))
      domain = 'https://' + domain;

    // let options = {
    //   schemes: ['http', 'https'],
    //   allowLocal: true,
    //   message: 'Domain is not a valid url.',
    // };
    // __DEV__ && console.log('GOND validate domain: ', domain);
    // return validators.url({website: domain}, options);
    return isValidHttpUrl(domain) ? null : 'Domain is not a valid url.';
  };

  onLogin = () => {
    const {username, password} = this.state;
    let domain = '' + this.state.domain;
    if (!domain) return;

    const regexSubName = /^[A-z0-9]+$/;
    if (regexSubName.test(domain)) {
      domain = Domain.urlI3care + domain;
    }

    if (
      !domain.startsWith(domain, 'http://') &&
      !domain.startsWith(domain, 'https://')
    )
      domain = 'https://' + domain;

    let invalidMsg = this.validatedomain(domain);
    if (invalidMsg) {
      this.setState({errors: {domain: invalidMsg}});
      return;
    }

    domain = this.removeSpecificPort(domain);

    if (this.props.userStore) {
      this.props.userStore.login(domain, username, password);
    } else {
      __DEV__ &&
        console.log('GOND Login failed, no userStore available!', this.props);
    }
  };

  onBack = () => {
    // __DEV__ && console.log('GOND Login onback <');
    // navigationService.back();
    this.props.appStore.naviService.back();
  };

  render() {
    const {width} = Dimensions.get('window');
    const {domain, username, password, errors} = this.state;
    // const {isLoading} = this.props.appStore;
    // const {error} = this.props.userStore;
    // console.log('GOND login render isLoading: ', isLoading);

    // if (error)
    // console.log(
    //   'GOND login domain = ',
    //   domain,
    //   ', usn = ',
    //   username,
    //   ', psw = ',
    //   password,
    //   ', isloading = ',
    //   this.props.appStore.isLoading
    // );

    return (
      <View
        style={{
          flex: 1,
          paddingLeft: width * 0.1,
          paddingRight: width * 0.1,
        }}>
        <KeyboardAwareScrollView
          // keyBoardShouldPersistTaps="always"
          ref={r => {
            this.keyboardView = r;
          }}
          // enableAutomaticScroll={true}
          contentContainerStyle={{flex: 1}}
          getTextInputRefs={() => [
            this._refs.domain,
            this._refs.username,
            this._refs.password,
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
                iconCustom={'clear-button'}
                iconSize={16}
                iconStyleEnable={{
                  color: CMSColors.colorText,
                }}
                // iconStyleDisable={{}}
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
                  ref={r => (this._refs.domain = r)}
                  name="domain"
                  value={this.state.domain}
                  maxLength={60}
                  enablesReturnKeyAutomatically={true}
                  onEndEditing={this.onEndEditing}
                  onChangeText={this.onTypingDomain}
                  onSubmitEditing={this.onSubmitDomain}
                  onFocus={this.onFocus}
                  returnKeyType="next"
                  iconCustom="earth-grid-select-language-button"
                  label={LoginTxt.domain}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  tintColor={CMSColors.PrimaryText}
                  textColor={CMSColors.PrimaryText}
                  baseColor={CMSColors.PrimaryText}
                  error={errors.domain}
                  disabled={false}
                  secureTextEntry={false}
                />
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
                  secureTextEntry={false}
                />
                <InputTextIcon
                  ref={r => (this._refs.password = r)}
                  name="password"
                  maxLength={60}
                  autoCapitalize={'none'}
                  value={this.state.password}
                  autoCorrect={false}
                  enablesReturnKeyAutomatically={true}
                  onEndEditing={this.onEndEditing}
                  onFocus={this.onFocus}
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
                captionStyle={{}}
                onPress={this.onLogin}
                enable={
                  domain && username && password // &&
                  // !this.props.appStore.isLoading
                }
              />
              <Button
                style={{
                  width: '100%',
                  marginTop: 15,
                }}
                caption="FORGOT PASSWORD?"
                type="flat"
                captionStyle={{}}
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

export default inject('userStore', 'appStore')(observer(LoginView));
