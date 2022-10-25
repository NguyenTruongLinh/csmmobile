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

import styles from './styles/loginStyles';

import {isValidHttpUrl} from '../../util/general';

import {Domain} from '../../consts/misc';
import theme from '../../styles/appearance';
import {I3_Logo} from '../../consts/images';
import {CMS_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';
import ROUTERS from '../../consts/routes';
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
  }

  componentDidMount() {
    __DEV__ && console.log('LoginView componentDidMount');
    this.props.appStore.setLoading(false);
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

    domain = domain.toLowerCase();

    domain = this.removeSpecificPort(domain);

    this.props.userStore.login(domain, username, password);
  };

  onBack = () => {
    this.props.appStore.naviService.back();
  };

  onForgotPasswordPress = () => {
    this.props.appStore.naviService.navigate(ROUTERS.FORGOT_PASSWORD);
  };

  render() {
    const {domain, username, password, errors, domainErrorFlag} = this.state;
    const {appearance} = this.props.appStore;

    return (
      <SafeAreaView style={[{flex: 1}, theme[appearance].container]}>
        <View style={styles.viewContainer}>
          <View style={styles.closeButtonContainer}></View>
          <View style={styles.space} />
          <View style={styles.logoContainer}>
            <Image source={CMS_Logo} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.space} />
          <View style={styles.textContainer}>
            <Text style={[styles.textTitle, theme[appearance].text]}>
              {LoginTxt.title}
              <Text style={[styles.textBold, theme[appearance].text]}>
                {LoginTxt.titleBold}
              </Text>
            </Text>
            <Text style={[styles.textDesc, theme[appearance].loginSubText]}>
              {LoginTxt.description}
            </Text>
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
              iconColor={theme[appearance].inputIconColor}
              error={domainErrorFlag ? errors.domain : undefined}
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
              onChangeText={this.onTyping}
              onSubmitEditing={this.onSubmitUserName}
              returnKeyType="next"
              autoCapitalize={'none'}
              iconCustom="user-shape"
              label={LoginTxt.username}
              placeholder=""
              disabled={false}
              iconColor={theme[appearance].inputIconColor}
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
              onChangeText={this.onTyping}
              returnKeyType="next"
              iconCustom="locked-padlock"
              label={LoginTxt.password}
              placeholder=""
              disabled={false}
              iconColor={theme[appearance].inputIconColor}
              secureTextEntry={true}
              revealable={true}
            />
          </View>
          <View style={styles.space} />
          <View
            style={[
              styles.space,
              {
                display: this.state.isInputFocus ? 'flex' : 'none',
              },
            ]}
          />
          <View style={styles.buttonsContainer}>
            <Button
              style={styles.buttonLogin}
              caption="LOGIN"
              type="primary"
              captionStyle={{}}
              onPress={this.onLogin}
              enable={domain && username && password && !errors.domain}
            />
            <Text
              style={styles.forgotPasswordLink}
              onPress={this.onForgotPasswordPress}>
              {LoginTxt.forgotPassword}
            </Text>
            <View style={{height: 50}}></View>
          </View>
        </View>
        <View style={styles.space_footer} />
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

export default inject('userStore', 'appStore')(observer(LoginView));
