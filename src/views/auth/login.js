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
  Platform,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {onPatch} from 'mobx-state-tree';
// import validatejs from 'validate.js';

import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';

// import navigationService from '../../navigation/navigationService';

import {isValidHttpUrl} from '../../util/general';

import {Domain} from '../../consts/misc';
import APP_INFO from '../../consts/appInfo';
import variable from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';
import {I3_Logo} from '../../consts/images';
import {CMS_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';

// const backgroundImg = require('../../assets/images/intro/welcome.png');
// const launchscreenLogo = require('../../assets/images/CMS-logo-white.png');

// const validators = validatejs.validators;
// <!-- END CONSTS -->
// ----------------------------------------------------
const {width} = Dimensions.get('window');

class LoginView extends Component {
  constructor(props) {
    super(props);
    const {loginInfo} = props.userStore;

    this.state = {
      canLogin: false,
      domain: loginInfo ? loginInfo.domainname : '',
      username: loginInfo ? loginInfo.username : '',
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
    this.lastLoginError = '';
    // onPatch(props.userStore, this.onStoreChanged);
  }

  componentDidMount() {
    __DEV__ && console.log('LoginView componentDidMount');
    this.props.appStore.setLoading(false);
    // this.setState({domain: this.props.userStore.loginInfo ?? ''});
  }

  componentWillUnmount() {
    __DEV__ && console.log('LoginView componentWillUnmount');
  }

  // static getDerivedStateFromProps(nextProps, nextState) {
  //   __DEV__ && console.log('LoginView getDerivedStateFromProps: ', nextProps);
  // }

  // onStoreChanged = newValues => {
  //   const {error, isLoggedIn} = this.props.userStore;
  //   if (error != this.lastLoginError) {
  //     this.lastLoginError = error;
  //     error && Alert.alert(LoginTxt.errorTitle, error);
  //     return;
  //   }
  //   // if (newValues.path == '/isLoggedIn' && isLoggedIn === true)
  //   //   Alert.alert('Login successfully', 'Yay!');
  // };

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

    domain = domain.toLowerCase();

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
          // iconStyleDisable={{}}
          onPress={this.onBack}
        />
        <View style={styles.viewContainer}>
          <View style={styles.closeButtonContainer}></View>
          <View style={styles.space} />
          <View style={styles.logoContainer}>
            <Image source={CMS_Logo} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.space} />
          <View style={styles.textContainer}>
            <Text style={styles.textTitle}>
              {LoginTxt.title}
              <Text style={styles.textBold}>{LoginTxt.titleBold}</Text>
            </Text>
            <Text style={styles.textDesc}>{LoginTxt.description}</Text>
          </View>
          <View style={styles.space} />
          <View style={[styles.content, styles.centerContent]}>
            <InputTextIcon
              ref={r => (this._refs.domain = r)}
              name="domain"
              value={domain.replace(Domain.urlI3care, '')}
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
              iconColor={CMSColors.InputIconColor}
              error={errors.domain}
              disabled={false}
              secureTextEntry={false}
              fixAndroidBottomLine={true}
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
              iconColor={CMSColors.InputIconColor}
              secureTextEntry={false}
              fixAndroidBottomLine={true}
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
              iconColor={CMSColors.InputIconColor}
              secureTextEntry={true}
              revealable={true}
              fixAndroidBottomLine={true}
            />
          </View>
          <View style={styles.space} />
          <View style={styles.buttonsContainer}>
            <Button
              style={styles.buttonLogin}
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
              style={styles.buttonPassword}
              caption="FORGOT PASSWORD?"
              type="flat"
              captionStyle={{}}
              onPress={() => {
                Linking.openURL(APP_INFO.ContactUrl);
              }}
              enable={true}
            />
          </View>
        </View>
        <View style={styles.space_footer} />
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
  closeButtonContainer: {
    height: 30,
    flexDirection: 'column',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 30,
    // alignItems: 'center',
    position: 'absolute',
    right: width * 0.1 - 30,
    top: width * 0.1 - (Platform.OS == 'ios' ? 0 : 36),
    zIndex: 10,
  },
  logo: {
    tintColor: CMSColors.Dark_Blue,
    width: width * 0.3,
    height: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    height: 60,
    flexDirection: 'column',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    flexDirection: 'column',
  },
  textContainer: {
    alignItems: 'center',
  },
  textTitle: {fontSize: 20, fontWeight: 'normal'},
  textBold: {fontWeight: 'bold'},
  textDesc: {
    fontSize: 15,
  },
  inputsContainer: {
    // alignItems: 'center',
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonLogin: {
    width: '100%',
  },
  buttonPassword: {
    width: '100%',
  },
  content: {
    maxWidth: variable.deviceWidth,
    backgroundColor: CMSColors.Transparent,
  },
  captionStyle: {
    color: CMSColors.TextButtonLogin,
  },
  copyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '6%',
  },
  copyRightLogo: {
    tintColor: CMSColors.Dark_Blue,
    width: (width * 28) / 100,
    height: (width * 28 * 132) / 300 / 100,
  },
  copyRightText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 5,
  },
  space: {
    flex: 0.3,
  },
  space_footer: {
    flex: 0.05,
  },
});

export default inject('userStore', 'appStore')(observer(LoginView));
