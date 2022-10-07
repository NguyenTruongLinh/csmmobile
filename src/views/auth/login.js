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
  Keyboard,
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
import ROUTERS from '../../consts/routes';
// const backgroundImg = require('../../assets/images/intro/welcome.png');
// const launchscreenLogo = require('../../assets/images/CMS-logo-white.png');

// const validators = validatejs.validators;
// <!-- END CONSTS -->
// ----------------------------------------------------
const {width, height} = Dimensions.get('window');

class LoginView extends Component {
  constructor(props) {
    super(props);
    const {loginInfo} = props.userStore;

    this.state = {
      canLogin: false,
      domain: loginInfo ? loginInfo.domainname : '',
      username: loginInfo ? loginInfo.username : '',
      password: '',
      domainErrorFlag: false,
      errors: {
        domain: '',
        username: '',
        password: '',
      },
      isInputFocus: false,
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
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow.bind(this)
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide.bind(this)
    );
  }

  _keyboardDidShow(e) {
    __DEV__ &&
      console.log(
        ` e.endCoordinates.height = `,
        e.endCoordinates.height,
        ' | height = ',
        height
      );
    if (e.endCoordinates.height / height > 240 / 676)
      setTimeout(() => {
        this.setState({isInputFocus: true});
      }, 100);
  }

  _keyboardDidHide() {
    this.setState({isInputFocus: false});
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

  onTypingDomain = text => {
    let domain = text;
    if (!domain) return;

    const regexSubName = /^[A-z0-9]+$/;
    if (regexSubName.test(domain)) {
      domain = Domain.urlI3care + domain;
    }

    domain = domain.toLowerCase();

    let invalidMsg = isValidHttpUrl(domain)
      ? null
      : 'Domain is not a valid url.';
    __DEV__ && console.log('login', `invalidMsg=${invalidMsg}`);
    this.setState({errors: {domain: invalidMsg}});
  };

  onSubmitDomain = () => {
    this._refs.username && this._refs.username.focus();
  };

  onTyping = (text, name) => {
    // __DEV__ && console.log('LoginView onTyping ', name, text ?? 'no text');
    if (name) {
      if (text != this.state[name]) {
        this.setState({[name]: text});
      }
    }
  };

  onSubmitUserName = () => {
    this._refs.password && this._refs.password.focus();
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
      domainErrorFlag: name === 'domain' || this.state.domainErrorFlag,
    });
  };

  onFocus = event => {};

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

  onLogin = () => {
    const {username, password} = this.state;
    let domain = '' + this.state.domain;
    if (!domain) return;

    const regexSubName = /^[A-z0-9]+$/;
    if (regexSubName.test(domain)) {
      domain = Domain.urlI3care + domain;
    }

    // if (
    //   !domain.startsWith(domain, 'http://') &&
    //   !domain.startsWith(domain, 'https://')
    // )
    //   domain = 'https://' + domain;

    domain = domain.toLowerCase();

    // let invalidMsg = isValidHttpUrl(domain)
    //   ? null
    //   : 'Domain is not a valid url.';
    // if (invalidMsg) {
    //   this.setState({errors: {domain: invalidMsg}});
    //   return;
    // }

    domain = this.removeSpecificPort(domain);

    // if (this.props.userStore) {
    this.props.userStore.login(domain, username, password);
    // } else {
    //   __DEV__ &&
    //     console.log('GOND Login failed, no userStore available!', this.props);
    // }
  };

  onBack = () => {
    // __DEV__ && console.log('GOND Login onback <');
    // navigationService.back();
    this.props.appStore.naviService.back();
  };

  onForgotPasswordPress = () => {
    this.props.appStore.naviService.navigate(ROUTERS.FORGOT_PASSWORD);
  };

  onI3HostLoginPress = () => {
    this.props.appStore.naviService.navigate(ROUTERS.I3_HOST_LOGIN);
  };

  render() {
    const {width} = Dimensions.get('window');
    const {domain, username, password, errors, domainErrorFlag} = this.state;
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
        {/* <Button
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
        /> */}
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
              error={domainErrorFlag ? errors.domain : undefined}
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
              onChangeText={this.onTyping}
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
              onChangeText={this.onTyping}
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
                domain && username && password && !errors.domain // &&
                // !this.props.appStore.isLoading
              }
            />
            <Text
              style={styles.forgotPasswordLink}
              onPress={this.onForgotPasswordPress}>
              {LoginTxt.forgotPassword}
            </Text>
            <View style={styles.buttonLineThroughContainer}>
              <View style={styles.orTextContainer}>
                <Text style={styles.orText}>OR</Text>
              </View>
              <View style={styles.lineThrough} />
            </View>
            <Button
              style={styles.buttonLoginI3Host}
              caption="LOGIN WITH I3HOST"
              type="primary"
              captionStyle={styles.buttonLoginI3HostCaption}
              onPress={this.onI3HostLoginPress}
              enable
              backgroundColor={CMSColors.White}
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
  forgotPasswordLink: {
    marginTop: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
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
    height: 50,
    fontSize: 14,
    fontWeight: 'bold',
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
    flex: 0.2,
  },
  space_footer: {
    flex: 0.05,
  },
  buttonLineThroughContainer: {
    marginVertical: 30,
    width: '100%',
  },
  orTextContainer: {
    alignSelf: 'center',
    backgroundColor: CMSColors.White,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  orText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    overflow: 'hidden',
  },
  lineThrough: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: CMSColors.Grey,
    zIndex: 1,
  },
  buttonLoginI3Host: {
    borderWidth: 1,
    borderColor: CMSColors.PrimaryActive,
    shadowColor: CMSColors.White,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: '100%',
  },
  buttonLoginI3HostCaption: {
    color: CMSColors.PrimaryActive,
  },
});

export default inject('userStore', 'appStore')(observer(LoginView));
