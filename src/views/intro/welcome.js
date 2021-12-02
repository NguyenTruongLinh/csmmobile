import React, {Component} from 'react';
import {
  View,
  ImageBackground,
  Image,
  Text,
  Dimensions,
  Linking,
  StyleSheet,
  // SafeAreaView,
} from 'react-native';

import {inject, observer} from 'mobx-react';
// import navigationService from '../../navigation/navigationService';

import Button from '../../components/controls/Button';

import ROUTERS from '../../consts/routes';
import {I3_Logo} from '../../consts/images';
import CMSColor from '../../styles/cmscolors';

import APP_INFO from '../../consts/appInfo';
import {Welcome as WelcomeTxt} from '../../localization/texts';

const backgroundImg = require('../../assets/images/intro/welcome.png');

class WelcomeView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    __DEV__ && console.log('WelcomeView componentDidMount');
  }

  componentWillUnmount() {
    __DEV__ && console.log('WelcomeView componentWillUnmount');
  }

  onLogin = () => {
    // navigationService.navigate(ROUTERS.LOGIN);
    this.props.appStore.naviService.navigate(ROUTERS.LOGIN);
  };

  onGoPro = () => {
    // this.props.appStore.naviService.navigate(ROUTERS.PASSWORD_EXPIRED);
  };

  render() {
    const {width, height} = Dimensions.get('window');
    console.log('GOND Dimension = ', Dimensions.get('window'));

    return (
      // <SafeAreaView style={{flex: 1}}>
      <ImageBackground
        source={backgroundImg}
        style={{
          width: width,
          flex: 1,
          resizeMode: 'cover',
        }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            // paddingLeft: width * 0.1,
            // paddingRight: width * 0.1,
            paddingHorizontal: width * 0.1,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
          }}>
          <View style={styles.larger_space} />
          <Image
            source={I3_Logo}
            style={{
              width: 180,
              height: 90,
              tintColor: CMSColor.Dark_Blue,
            }}
            resizeMode="contain"
          />
          <View style={styles.space} />
          <View
            style={{
              flexDirection: 'column',
              width: width * 0.8,
            }}>
            <Text
              style={{
                fontWeight: 'normal',
                fontSize: height > 600 ? 28 : 24,
                flexWrap: 'wrap',
                fontFamily: 'Roboto-Regular',
              }}>
              {WelcomeTxt.title}
            </Text>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: height > 600 ? 27 : 23,
                flexWrap: 'wrap',
              }}>
              {WelcomeTxt.titleBold}
            </Text>
          </View>
          <View style={styles.text_space} />
          <Text
            style={{
              fontWeight: 'normal',
              fontSize: 16,
              flexWrap: 'wrap',
              fontFamily: 'Roboto-Regular',
            }}>
            {WelcomeTxt.description}
            <Text
              style={{
                // fontWeight: 'normal',
                // fontSize: 16,
                color: CMSColor.PrimaryActive,
              }}
              onPress={() => {
                Linking.openURL(APP_INFO.ContactUrl);
              }}>
              {WelcomeTxt.contactLink}
            </Text>
          </Text>
          <View style={styles.larger_space} />
          <Button
            enable={true}
            type={'primary'}
            caption={WelcomeTxt.login}
            onPress={this.onLogin}
          />
          <View style={styles.smaller_space} />
          <Button
            enable={true}
            type={'flat'}
            caption={WelcomeTxt.skip}
            onPress={this.onGoPro}
          />
        </View>
      </ImageBackground>
      // </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  space: {
    flex: 0.15,
  },
  larger_space: {
    flex: 0.2,
  },
  smaller_space: {
    flex: 0.05,
  },
  text_space: {
    flex: 0.1,
  },
});

export default inject('appStore')(observer(WelcomeView));
