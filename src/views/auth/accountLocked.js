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
  TouchableOpacity,
  Platform,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import {onPatch} from 'mobx-state-tree';
import call from 'react-native-phone-call';

// import validatejs from 'validate.js';

import InputTextIcon from '../../components/controls/InputTextIcon';
import Button from '../../components/controls/Button';

// import navigationService from '../../navigation/navigationService';

import {isValidHttpUrl} from '../../util/general';

import {Domain} from '../../consts/misc';
import APP_INFO from '../../consts/appInfo';
import variable from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';
import {I3_Logo, Lock} from '../../consts/images';
import {CMS_Logo} from '../../consts/images';
import {Login as LoginTxt} from '../../localization/texts';
import ROUTERS from '../../consts/routes';

// const backgroundImg = require('../../assets/images/intro/welcome.png');
// const launchscreenLogo = require('../../assets/images/CMS-logo-white.png');

// const validators = validatejs.validators;
// <!-- END CONSTS -->
// ----------------------------------------------------
const {width} = Dimensions.get('window');

class AccountLocked extends Component {
  constructor(props) {
    super(props);
    const {loginInfo} = props.userStore;

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
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
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
          <Text style={styles.textAccInfo}>
            {LoginTxt.accountLocked.replace(
              '%s',
              `${lockedTime} ${lockedTime > 1 ? 'minutes' : 'minute'}`
            )}
          </Text>
          <View style={{flex: 0.2}} />
          <View style={styles.textContainer}>
            <Text style={styles.textDesc}>{LoginTxt.phoneContactTitle}</Text>
            <TouchableOpacity onPress={this.onPhonePress}>
              <Text style={styles.phone}>{LoginTxt.phoneContactNumber}</Text>
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
  closeButton: {
    width: 30,
    // alignItems: 'center',
    position: 'absolute',
    right: width * 0.1 - 30,
    top: width * 0.1 - (Platform.OS == 'ios' ? 0 : 36),
    zIndex: 10,
  },
  topSpace: {
    height: 30,
  },
  logo: {
    tintColor: CMSColors.Dark_Blue,
    height: 56,
    alignSelf: 'center',
  },
  space: {
    flex: 0.3,
  },
  lock: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  space_text: {
    flex: 0.15,
  },
  space_footer: {
    flex: 0.05,
  },
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    borderColor: 'blue',
    borderWidth: 1,
  },
  buttonLogin: {
    width: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textAccInfo: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    color: CMSColors.PrimaryText,
    lineHeight: 25,
  },
  textDesc: {
    textAlign: 'center',
    fontSize: 14,
    color: CMSColors.SecondaryText,
  },
  phone: {
    fontWeight: 'bold',
    color: CMSColors.PrimaryActive,
  },
  copyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyRightLogo: {
    tintColor: CMSColors.Dark_Blue,
    width: '32%',
    height: '100%',
  },
  copyRightText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 5,
  },
});

export default inject('userStore', 'appStore')(observer(AccountLocked));
