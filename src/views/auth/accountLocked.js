import React, {Component} from 'react';
import {View, SafeAreaView, Text, Image, TouchableOpacity} from 'react-native';

import {inject, observer} from 'mobx-react';
import call from 'react-native-phone-call';

import Button from '../../components/controls/Button';

import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';
import styles from './styles/accountLockStyles';

import {I3_Logo, Lock} from '../../consts/images';
import {CMS_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';
import ROUTERS from '../../consts/routes';
// <!-- END CONSTS -->
// ----------------------------------------------------

class AccountLocked extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    __DEV__ && console.log('AccountLocked componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('AccountLocked componentWillUnmount');
  }

  onBack = () => {
    // __DEV__ && console.log('GOND Login onback <');
    this.props.navigation.goBack();
  };
  onBackToLoginPress = () => {
    this.props.navigation.replace(ROUTERS.LOGIN);
  };
  onPhonePress = () => {
    const args = {
      number: LoginTxt.phoneContactNumber.replace(/\./g, ''),
      prompt: false,
    };
    call(args).catch(error => {
      __DEV__ && console.log(`onPhonePress error`, error);
    });
  };
  render() {
    const {userStore} = this.props;
    const lockedTime = userStore.loginInfo.lockedTime;
    const {appearance} = this.props.appStore;

    return (
      <SafeAreaView style={[{flex: 1}, theme[appearance].container]}>
        <Button
          style={styles.closeButton}
          enable={true}
          type={'flat'}
          iconCustom={'clear-button'}
          iconSize={16}
          iconStyleEnable={{
            color: CMSColors.ColorText,
          }}
          onPress={this.onBack}
        />
        <View style={styles.viewContainer}>
          <View style={styles.topSpace}></View>
          <View style={{flex: 0.3}} />
          <Image source={CMS_Logo} style={styles.logo} resizeMode="contain" />
          <View style={{flex: 0.3}} />
          <Image source={Lock} style={styles.lock} resizeMode="contain" />
          <View style={{flex: 0.3}} />
          <Text style={[styles.textAccInfo, theme[appearance].text]}>
            {LoginTxt.accountLocked.replace(
              '%s',
              `${lockedTime} ${lockedTime > 1 ? 'minutes' : 'minute'}`
            )}
          </Text>
          <View style={{flex: 0.2}} />
          <View style={styles.textContainer}>
            <Text style={[styles.textDesc, theme[appearance].contactI3SubText]}>
              {LoginTxt.phoneContactTitle}
            </Text>
            <TouchableOpacity onPress={this.onPhonePress}>
              <Text style={[styles.phone, theme[appearance].text]}>
                {LoginTxt.phoneContactNumber}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{flex: 0.6}} />
          <Button
            style={styles.buttonLogin}
            caption="BACK TO LOGIN"
            type="primary"
            captionStyle={{}}
            onPress={this.onBackToLoginPress}
            enable={true}
          />
        </View>
        <View style={{flex: 0.15}} />
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

export default inject('userStore', 'appStore')(observer(AccountLocked));
