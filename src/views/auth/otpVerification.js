import React, {Component} from 'react';
import {Image, Text, View} from 'react-native';

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
    const type = selectedType === 0 ? 'email' : 'phone';
    if (this.props.userStore) {
      const res = await this.props.userStore.getOtp(type);
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

    if (otpCode.length === 6) {
      if (this.props.userStore) {
        this.props.userStore.verifyOtp(otpCode);
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
    const {isLoading} = this.props.userStore;
    const {appearance} = this.props.appStore;

    return (
      <>
        <View style={styles.space_footer} />
        <Text style={[styles.enterTitle, theme[appearance].text]}>
          Enter the OTP code sent to email{' '}
          <Text style={styles.textBold}>i3xxxx@gmail.com</Text>
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
          iconColor={theme[appearance].inputIconColor}
          fixAndroidBottomLine={true}
          error={otpError}
        />
        <CountDown
          ref={r => (this._countdownRef = r)}
          onStopCountDown={this.onStopCountDown}
          onStartCountDown={this.onStartCountDown}
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

    const content = isSendOTP ? (
      this.renderSentContent()
    ) : (
      <>
        <View style={styles.space} />
        <Button
          caption="SEND OTP"
          type="primary"
          onPress={this.onSendOTPPress}
          enable={!isLoading}
        />
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
