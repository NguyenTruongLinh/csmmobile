import React, {Component} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

import {inject, observer} from 'mobx-react';
import {SafeAreaView} from 'react-native-safe-area-context';

import Button from '../../components/controls/Button';
import CountDown from '../../components/views/OtpCountdown';
import InputTextIcon from '../../components/controls/InputTextIcon';
import Radio from '../../components/controls/Radio';

import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import {Login as LoginTxt} from '../../localization/texts';
import {I3_Logo} from '../../consts/images';
import ROUTERS from '../../consts/routes';

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
    this._refs = {
      otpCode: null,
      countDown: null,
    };
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
    if (this._refs.countDown) {
      if (this._refs.countDown.getSeconds() === 0) {
        const isSent = await this.onSendOTP();

        if (isSent) {
          this._refs.countDown.onReCountDown();
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

    return (
      <>
        <View style={styles.space_footer} />
        <Text style={styles.enterTitle}>
          Enter the OTP code sent to email{' '}
          <Text style={styles.textBold}>i3xxxx@gmail.com</Text>
        </Text>
        <InputTextIcon
          ref={r => (this._refs.otpCode = r)}
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
          tintColor={CMSColors.PrimaryText}
          textColor={CMSColors.PrimaryText}
          baseColor={CMSColors.PrimaryText}
          iconColor={CMSColors.InputIconColor}
          fixAndroidBottomLine={true}
          error={otpError}
        />
        <CountDown
          ref={r => (this._refs.countDown = r)}
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
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.space_footer} />
          <Text style={styles.textTitle}>{LoginTxt.otpVerification}</Text>
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
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  textTitle: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  checkboxGroupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  enterTitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  textBold: {
    fontWeight: 'bold',
  },
  buttonVerify: {
    marginVertical: 30,
  },
  disableButtonText: {
    color: 'rgb(156,156,156)',
  },
});

export default inject('userStore', 'appStore')(observer(OTPVerification));
