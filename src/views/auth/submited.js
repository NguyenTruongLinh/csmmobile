import React, {Component} from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  Platform,
} from 'react-native';

import {inject, observer} from 'mobx-react';
import Button from '../../components/controls/Button';

import variable from '../../styles/variables';
import CMSColors from '../../styles/cmscolors';
import theme from '../../styles/appearance';

import {Login as LoginTxt} from '../../localization/texts';
import {I3_Logo, Submited_Img} from '../../consts/images';
import ROUTERS from '../../consts/routes';

const {width} = Dimensions.get('window');

class SubmitedView extends Component {
  constructor(props) {
    super(props);
  }

  onBackToLogin = () => {
    this.props.appStore.naviService.navigate(ROUTERS.LOGIN);
  };

  render() {
    const {appearance} = this.props.appStore;

    return (
      <SafeAreaView style={[{flex: 1}, theme[appearance].container]}>
        <View style={styles.viewContainer}>
          <View style={styles.closeButtonContainer}></View>
          <View style={styles.space}></View>
          <View style={{height: 50}}></View>
          <View style={styles.logoContainer}>
            <Image
              source={Submited_Img}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={{height: 50}}></View>
          <View style={styles.textContainer}>
            <Text style={[styles.textTitle, theme[appearance].text]}>
              {LoginTxt.submitedForgotPassword}
            </Text>
          </View>
          <View style={{height: 50}}></View>

          <View style={styles.buttonsContainer}>
            <Button
              style={styles.buttonSubmit}
              caption="BACK TO LOGIN"
              type="primary"
              captionStyle={{}}
              onPress={this.onBackToLogin}
              enable={true}
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
          <Text style={[styles.copyRightText, theme[appearance].text]}>
            {LoginTxt.copyRight}
          </Text>
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
  closeButtonContainer: {
    height: 30,
    flexDirection: 'column',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 30,
    position: 'absolute',
    right: width * 0.1 - 30,
    top: width * 0.1 - (Platform.OS == 'ios' ? 0 : 36),
    zIndex: 10,
  },
  logo: {
    width: width * 0.3,
    height: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    height: 120,
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
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
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

export default inject('userStore', 'appStore')(observer(SubmitedView));
