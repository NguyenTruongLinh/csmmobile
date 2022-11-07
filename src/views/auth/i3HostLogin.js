import React, {Component} from 'react';
import {Image, Text, View} from 'react-native';

import {Dropdown} from 'react-native-element-dropdown';
import {inject, observer} from 'mobx-react';
import {SafeAreaView} from 'react-native-safe-area-context';

import Button from '../../components/controls/Button';
import Checkbox from '../../components/controls/Checkbox';
import {IconCustom} from '../../components/CMSStyleSheet';
import InputTextIcon from '../../components/controls/InputTextIcon';

import CMSColors from '../../styles/cmscolors';
import styles from './styles/i3LoginStyles';
import theme from '../../styles/appearance';

import {I3_Logo} from '../../consts/images';
import ROUTERS from '../../consts/routes';
import {Login as LoginTxt} from '../../localization/texts';

class I3HostLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: __DEV__ ? 'hanhan3@mailinator.com' : '',
      password: __DEV__ ? 'Han@123456' : '',
      errors: {
        email: '',
        password: '',
      },
      rememberPassword: false,
    };
    this._refs = {
      email: null,
      password: null,
    };
  }

  onTyping = (text, name) => {
    if (name) {
      if (text != this.state[name]) {
        this.setState({[name]: text});
      }
    }
  };

  onTypingPassword = (text, name) => {
    this.setState({password: text});
  };

  onTypingEmail = text => {
    let email = text;
    this.setState({email: text});
    if (!email) return;
    const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let invalidMsg = '';
    if (!regexEmail.test(email)) {
      invalidMsg = 'Email is incorrect format.';
      this.setState({errors: {email: invalidMsg}});
    } else {
      this.setState({errors: {email: invalidMsg}});
    }
    __DEV__ && console.log('email', `invalidMsg=${invalidMsg}`);
  };

  onEndEditing = (event, name) => {
    if (name && event.nativeEvent) {
      let {text} = event.nativeEvent;
      if (text != this.state[name]) {
        this.setState({[name]: text});
      }
    }
  };

  onSubmitEmail = () => {
    this._refs.password && this._refs.password.focus();
  };

  onFocus = event => {};

  onForgotPasswordPress = () => {
    this.props.appStore.naviService.navigate(ROUTERS.FORGOT_PASSWORD);
  };

  onLogin = async () => {
    const {route} = this.props;
    const {domain} = route.params || {};

    if (this.props.userStore) {
      const res = await this.props.userStore.getI3HostDomain(
        domain,
        this.state.email,
        this.state.password
      );
      console.log(
        '🚀 ~ file: i3HostLogin.js ~ line 101 ~ I3HostLogin ~ onLogin= ~ res',
        res
      );
      // if (res) {
      //   this.props.appStore.naviService.navigate(ROUTERS.OTP_VERIFICATION);
      // }
    }
  };

  render() {
    const {email, password, rememberPassword, errors} = this.state;
    const {isLoading} = this.props.userStore;
    const {appearance} = this.props.appStore;

    return (
      <SafeAreaView style={[styles.container, theme[appearance].container]}>
        <View style={styles.contentContainer}>
          <View style={styles.space_footer} />
          <Text style={[styles.textTitle, theme[appearance].text]}>
            {LoginTxt.i3HostTitle}
            <Text style={styles.textBold}>{LoginTxt.i3HostTitleBold}</Text>
          </Text>
          <View style={styles.space} />
          <View>
            <InputTextIcon
              ref={r => (this._refs.email = r)}
              name="email"
              maxLength={60}
              value={this.state.email}
              autoCorrect={false}
              enablesReturnKeyAutomatically={true}
              onEndEditing={this.onEndEditing}
              onFocus={this.onFocus}
              onChangeText={this.onTyping}
              onSubmitEditing={this.onSubmitEmail}
              returnKeyType="next"
              autoCapitalize={'none'}
              iconCustom="user-shape"
              label={LoginTxt.email}
              placeholder=""
              error={errors.email}
              disabled={false}
              iconColor={theme[appearance].inputIconColor}
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
              disabled={false}
              iconColor={theme[appearance].inputIconColor}
              secureTextEntry={true}
              revealable={true}
              fixAndroidBottomLine={true}
            />
          </View>
          <View style={styles.space_footer} />
          <Checkbox
            label="Remember password"
            checked={rememberPassword}
            onPress={() => {
              this.setState({rememberPassword: !this.state.rememberPassword});
            }}
            style={styles.checkbox}
            labelStyle={theme[appearance].text}
          />
          <View style={styles.space_footer} />
          <Button
            style={styles.buttonLogin}
            caption="LOGIN"
            type="primary"
            captionStyle={styles.buttonLoginCaption}
            onPress={this.onLogin}
            enable={email && password && !isLoading && !errors.email}
          />
          <Text
            style={styles.forgotPasswordLink}
            onPress={this.onForgotPasswordPress}>
            {LoginTxt.forgotPassword}
          </Text>
          <View style={styles.space} />
          <Dropdown
            // data={sitesStore.selectedSiteDVRs}
            disable
            placeholder="English"
            labelField="name"
            valueField="kDVR"
            // value={}
            onChange={this.onSwitchDVR}
            renderLeftIcon={() => (
              <View style={styles.dropdownIcon}>
                <IconCustom
                  name={'earth-grid-select-language-button'}
                  size={24}
                  color={CMSColors.DividerColor}
                />
              </View>
            )}
            style={styles.dropdown}
            placeholderStyle={theme[appearance].text}
          />
        </View>
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

export default inject('userStore', 'appStore')(observer(I3HostLogin));
