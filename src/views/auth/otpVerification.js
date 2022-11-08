import React, {Component} from 'react';
import {ActivityIndicator, Image, Text, View} from 'react-native';

import {inject, observer} from 'mobx-react';
import {SafeAreaView} from 'react-native-safe-area-context';

import Button from '../../components/controls/Button';
import CountDown from '../../components/views/OtpCountdown';
import InputTextIcon from '../../components/controls/InputTextIcon';
import Radio from '../../components/controls/Radio';

import CMSColors from '../../styles/cmscolors';
import styles from './styles/otpVerificationStyles';

import {Login as LoginTxt} from '../../localization/texts';
import {I3_Logo} from '../../consts/images';
import ROUTERS from '../../consts/routes';
import theme from '../../styles/appearance';

class OTPVerification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedType: 0,
      otpCode: '',
      isSendOTP: false,
      otpError: '',
      isDisabledResend: false,
    };
    this._otpCodeRef = null;
    this._countdownRef = null;
  }

  onRadioPress = type => {
    this.setState({selectedType: type});
  };

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

  onSendOTP = async () => {
    const {selectedType} = this.state;
    const {userId} = this.props?.route?.params;

    const params = {
      UserID: userId,
      ByEmail: selectedType === 0,
      BySms: selectedType === 1,
    };
    if (this.props.userStore) {
      const res = await this.props.userStore.getOtp(params);
      return res;
    }

    return false;
  };

  onSendOTPPress = async () => {
    const {isSendOTP} = this.state;
    const isSent = await this.onSendOTP();

    if (!isSendOTP && isSent) {
      this.setState({isSendOTP: true});
    }
  };

  onReSendOTPPress = async () => {
    if (this._countdownRef) {
      if (this._countdownRef.getSeconds() === 0) {
        const isSent = await this.onSendOTP();

        if (isSent) {
          this._countdownRef.onReCountDown();
        }
      }
    }
  };

  onVerifyOTP = () => {
    const {otpCode} = this.state;
    const {userId} = this.props?.route?.params;

    if (otpCode.length === 6) {
      if (this.props.userStore) {
        const params = {
          userId,
          Token: otpCode,
          ClientId: 'i3AuthServer',
          ClientSecret: 'i3international_authorization',
          Scope:
            'profile i3Master.Services.i3Host i3Tenant.Services.i3Host i3Auth.Services.i3Host offline_access',
        };
        this.props.userStore.verifyOtp(params);
      }
      this.setState({otpError: ''});
    } else {
      this.setState({otpError: 'OTP is incorrect, please re-enter'});
    }
  };

  onBackToLogin = () => {
    this.props.appStore.naviService.navigate(ROUTERS.LOGIN);
  };

  onStartCountDown = () => {
    this.setState({isDisabledResend: true});
  };

  onStopCountDown = () => {
    this.setState({isDisabledResend: false});
  };

  renderSentContent = () => {
    const {otpError, isDisabledResend, otpCode} = this.state;
    const {isLoading, userEmail, countDownTimeOTP} = this.props.userStore;
    const {appearance} = this.props.appStore;

    const hashEmail = () => {
      // split userEmail by @ and get the first part, then change the middle part to ***
      const email = userEmail.split('@');
      const firstPart = email[0].slice(0, 2);
      const lastPart = email[0].slice(-2);
      const middlePart = email[0].slice(2, -2).replace(/./g, '*');
      return `${firstPart}${middlePart}${lastPart}@${email[1]}`;
    };

    return (
      <>
        <View style={styles.space_footer} />
        <Text style={[styles.enterTitle, theme[appearance].text]}>
          Enter the OTP code sent to email{' '}
          <Text style={styles.textBold}>{hashEmail()}</Text>
        </Text>
        <InputTextIcon
          ref={r => (this._otpCodeRef = r)}
          name="otpCode"
          maxLength={60}
          autoCapitalize={'none'}
          value={this.state.otpCode}
          autoCorrect={false}
          enablesReturnKeyAutomatically={true}
          onEndEditing={this.onEndEditing}
          onChangeText={this.onTyping}
          returnKeyType="next"
          label={LoginTxt.otpCode}
          placeholder=""
          disabled={false}
          tintColor={theme[appearance].inputIconColor}
          iconColor={theme[appearance].inputIconColor}
          error={otpError}
        />
        <CountDown
          ref={r => (this._countdownRef = r)}
          onStopCountDown={this.onStopCountDown}
          onStartCountDown={this.onStartCountDown}
          countDownTimeOTP={countDownTimeOTP}
        />
        <View style={styles.space} />
        <Text
          style={[
            styles.buttonText,
            isDisabledResend || isLoading ? styles.disableButtonText : null,
          ]}
          onPress={this.onReSendOTPPress}>
          {LoginTxt.resendOTP}
        </Text>
        <Button
          style={styles.buttonVerify}
          caption="VERIFY"
          type="primary"
          onPress={this.onVerifyOTP}
          enable={!isLoading && otpCode}
        />
        <Text style={styles.buttonText} onPress={this.onBackToLogin}>
          {LoginTxt.backToLogin}
        </Text>
      </>
    );
  };

  render() {
    const {selectedType, isSendOTP} = this.state;
    const {isLoading} = this.props.userStore;
    const {appearance} = this.props.appStore;
    const {isMultiOtpOptions} = this.props?.route?.params;

    const content = isSendOTP ? (
      this.renderSentContent()
    ) : (
      <>
        <View style={styles.space} />
        <Button
          caption={isLoading ? null : 'SEND OTP'}
          type="primary"
          onPress={this.onSendOTPPress}
          enable={!isLoading}>
          {isLoading && <ActivityIndicator size="small" color="#fff" />}
        </Button>
      </>
    );

    return (
      <SafeAreaView style={[styles.container, theme[appearance].container]}>
        <View style={styles.contentContainer}>
          <View style={styles.space_footer} />
          <Text style={[styles.textTitle, theme[appearance].text]}>
            {LoginTxt.otpVerification}
          </Text>
          <View style={styles.space_footer} />
          <View style={styles.checkboxGroupContainer}>
            <Radio
              label="By email"
              checked={selectedType === 0}
              onPress={() => this.onRadioPress(0)}
            />
            <Radio
              label="By phone number"
              checked={selectedType === 1}
              onPress={() => this.onRadioPress(1)}
              disabled={!isMultiOtpOptions}
            />
          </View>
          {content}
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

export default inject('userStore', 'appStore')(observer(OTPVerification));
