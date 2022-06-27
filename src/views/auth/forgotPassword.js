import React, {Component} from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  Keyboard,
  ActivityIndicator,
} from 'react-native';

import {inject, observer} from 'mobx-react';

import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';

import {isValidHttpUrl} from '../../util/general';

import variable from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';

import {I3_Logo} from '../../consts/images';
import {CMS_Logo} from '../../consts/images';
import {Domain} from '../../consts/misc';
import {Login as LoginTxt} from '../../localization/texts';

// <!-- END CONSTS -->
// ----------------------------------------------------
const {width, height} = Dimensions.get('window');

class ForgotPasswordView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      username: '',
      domain: '',
      emailErrorFlag: false,
      domainErrorFlag: false,
      isLoading: false,
      errors: {
        domain: '',
        username: '',
        email: '',
      },
      isInputFocus: false,
    };
    this._refs = {
      domain: null,
      username: null,
      email: null,
    };
  }

  componentDidMount() {
    __DEV__ && console.log('ForgotPasswordView componentDidMount');
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
    __DEV__ && console.log('ForgotPasswordView componentWillUnmount');
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
    this._refs.email && this._refs.email.focus();
  };

  onTypingEmail = text => {
    let email = text;
    if (!email) return;
    const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let invalidMsg = '';
    if (!regexEmail.test(email)) {
      invalidMsg = 'Email is incorrect format.';
      this.setState({emailErrorFlag: true});
    } else {
      this.setState({emailErrorFlag: false});
    }
    this.setState({errors: {email: invalidMsg}});
    __DEV__ && console.log('email', `invalidMsg=${invalidMsg}`);
  };

  onSubmitEmail = () => {
    this._refs.username && this._refs.username.focus();
  };

  onTypingUsername = text => {};

  onSubmitUserName = () => {
    this._refs.username && this._refs.username.focus();
  };
  updateError = (name, text) => {
    this.setState({
      emailErrorFlag: name === 'email' || this.state.emailErrorFlag,
      domainErrorFlag: name === 'domain' || this.state.domainErrorFlag,
    });
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

  onFocus = event => {};

  onSubmit = () => {
    let domain = '' + this.state.domain;
    if (!domain) return;
    const regexSubName = /^[A-z0-9]+$/;
    if (regexSubName.test(domain)) {
      domain = Domain.urlI3care + domain;
    }
    domain = domain.toLowerCase();
    domain = this.removeSpecificPort(domain);
    const {username, email} = this.state;
    if (!email) return;
    const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!regexEmail.test(email)) {
      __DEV__ &&
        console.log('GOND Submit failed, email is incorrect!', this.props);
      return;
    }

    if (this.props.userStore) {
      this.props.userStore.submitForgotPassword(domain, email, username);
      console.log('GOND Submit successfull');
    } else {
      __DEV__ &&
        console.log('GOND Submit failed, no userStore available!', this.props);
    }
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

  onBack = () => {
    this.props.appStore.naviService.back();
  };

  render() {
    const {domain, username, email, errors, emailErrorFlag, domainErrorFlag} =
      this.state;
    let userStore = this.props.userStore;
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
        <View style={styles.viewContainer}>
          <View>
            {userStore.isSubmitForgotPassLoading && (
              <ActivityIndicator
                size="large"
                alignItems="center"
                color={CMSColors.SpinnerColor}
              />
            )}
          </View>
          <View style={styles.space}></View>
          <View style={styles.logoContainer}>
            <Image source={CMS_Logo} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={{height: 50}}></View>
          <View style={styles.textContainer}>
            <Text style={styles.textTitle}>{LoginTxt.forgotPasswordTitle}</Text>
          </View>
          <View style={{height: 50}}></View>

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
              ref={r => (this._refs.email = r)}
              name="email"
              value={this.state.email}
              maxLength={60}
              enablesReturnKeyAutomatically={true}
              onEndEditing={this.onEndEditing}
              onChangeText={this.onTypingEmail}
              onSubmitEditing={this.onSubmitEmail}
              onFocus={this.onFocus}
              returnKeyType="next"
              iconMaterial="mail"
              label={LoginTxt.email}
              autoCapitalize={'none'}
              autoCorrect={false}
              tintColor={CMSColors.PrimaryText}
              textColor={CMSColors.PrimaryText}
              baseColor={CMSColors.PrimaryText}
              iconColor={CMSColors.InputIconColor}
              error={emailErrorFlag ? errors.email : undefined}
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
              disabled={false}
              tintColor={CMSColors.PrimaryText}
              textColor={CMSColors.PrimaryText}
              baseColor={CMSColors.PrimaryText}
              iconColor={CMSColors.InputIconColor}
              secureTextEntry={false}
              fixAndroidBottomLine={true}
            />
          </View>

          <View style={{height: 50}}></View>
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
              style={styles.buttonSubmit}
              caption="SUBMIT"
              type="primary"
              captionStyle={{}}
              onPress={this.onSubmit}
              enable={
                username &&
                email &&
                domain &&
                !errors.domain &&
                !errors.email &&
                !userStore.isSubmitForgotPassLoading
              }
            />
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
          <Text style={styles.copyRightText}>{LoginTxt.copyRight}</Text>
        </View>
        <View style={styles.space_footer} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1,
    paddingHorizontal: width * 0.1,
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
  textTitle: {
    fontSize: 18,
    fontWeight: 'normal',
    alignItems: 'flex-start',
    marginLeft: 10,
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonSubmit: {
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

export default inject('userStore', 'appStore')(observer(ForgotPasswordView));
