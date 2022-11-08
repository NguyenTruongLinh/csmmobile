import React, {Component} from 'react';
import {ActivityIndicator, Image, Text, View} from 'react-native';

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
      email: __DEV__ ? 'i3admin' : '',
      password: __DEV__ ? 'i3admin' : '',
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

  onForgotPasswordPress = () => {
    this.props.appStore.naviService.navigate(ROUTERS.FORGOT_PASSWORD);
  };

  onLogin = async () => {
    const {route} = this.props;
    const {domain} = route.params || {};

    if (this.props.userStore) {
      const res = await this.props.userStore.i3HostLogin(
        domain,
        this.state.email,
        this.state.password
      );

      if (res) {
        if ('isMultiOtpOptions' in res) {
          const {userId, isMultiOtpOptions} = res;
          this.props.appStore.naviService.navigate(ROUTERS.OTP_VERIFICATION, {
            userId,
            isMultiOtpOptions,
          });
        }
      }
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
              onChangeText={this.onTyping}
              onSubmitEditing={this.onSubmitEmail}
              returnKeyType="next"
              autoCapitalize={'none'}
              iconCustom="user-shape"
              label={LoginTxt.email}
              placeholder=""
              error={errors.email}
              disabled={false}
              tintColor={theme[appearance].inputIconColor}
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
              onChangeText={this.onTyping}
              returnKeyType="next"
              iconCustom="locked-padlock"
              label={LoginTxt.password}
              placeholder=""
              disabled={false}
              tintColor={theme[appearance].inputIconColor}
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
            caption={isLoading ? null : 'LOGIN'}
            type="primary"
            captionStyle={styles.buttonLoginCaption}
            onPress={this.onLogin}
            enable={email && password && !isLoading && !errors.email}>
            {isLoading && <ActivityIndicator size="small" color="#fff" />}
          </Button>
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
