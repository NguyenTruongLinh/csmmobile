import React, {Component} from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, View} from 'react-native';

import {Dropdown} from 'react-native-element-dropdown';
import {inject, observer} from 'mobx-react';
import {SafeAreaView} from 'react-native-safe-area-context';

import Button from '../../components/controls/Button';
import Checkbox from '../../components/controls/Checkbox';
import {IconCustom} from '../../components/CMSStyleSheet';
import InputTextIcon from '../../components/controls/InputTextIcon';

import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {I3_Logo} from '../../consts/images';
import ROUTERS from '../../consts/routes';
import {Login as LoginTxt} from '../../localization/texts';

class I3HostLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
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
    if (this.props.userStore) {
      const res = await this.props.userStore.i3HostLogin(
        this.state.email,
        this.state.password
      );
      if (res) {
        this.props.appStore.naviService.navigate(ROUTERS.OTP_VERIFICATION);
      }
    }
  };

  render() {
    const {email, password, rememberPassword, errors} = this.state;
    const {isLoading} = this.props.userStore;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.space_footer} />
          <Text style={styles.textTitle}>
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
              onChangeText={this.onTypingEmail}
              onSubmitEditing={this.onSubmitEmail}
              returnKeyType="next"
              autoCapitalize={'none'}
              iconCustom="user-shape"
              label={LoginTxt.email}
              placeholder=""
              error={errors.email}
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
              onChangeText={this.onTypingPassword}
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
          <View style={styles.space_footer} />
          <Checkbox
            label="Remember password"
            checked={rememberPassword}
            onPress={() => {
              this.setState({rememberPassword: !this.state.rememberPassword});
            }}
            style={styles.checkbox}
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
          />
        </View>
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
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.deviceWidth * 0.1,
  },
  space: {
    height: 40,
  },
  copyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '6%',
  },
  copyRightLogo: {
    tintColor: CMSColors.Dark_Blue,
    width: (variables.deviceWidth * 28) / 100,
    height: (variables.deviceWidth * 28 * 132) / 300 / 100,
  },
  copyRightText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 5,
  },
  space_footer: {
    height: 25,
  },
  forgotPasswordLink: {
    marginTop: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
    textAlign: 'center',
  },
  textTitle: {
    fontSize: 24,
    fontWeight: 'normal',
    textAlign: 'center',
  },
  textBold: {fontWeight: 'bold'},
  checkbox: {
    marginBottom: 20,
  },
  dropdown: {
    width: 128,
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: CMSColors.DividerColor,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  buttonLoginCaption: {
    color: 'white',
  },
});

export default inject('userStore', 'appStore')(observer(I3HostLogin));
