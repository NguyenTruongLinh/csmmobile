import React, {Component} from 'react';
import {
  View,
  ImageBackground,
  Image,
  Text,
  Dimensions,
  Linking,
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

  onGoPro = () => {};

  render() {
    const {width, height} = Dimensions.get('window');
    return (
      // <View style={{position: 'absolute'}}>
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
            paddingLeft: width * 0.1,
            paddingRight: width * 0.1,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
          }}>
          <Image
            source={I3_Logo}
            style={{
              flex: 15,
              width: width * 0.5,
              paddingTop: 84,
              tintColor: CMSColor.Dark_Blue,
            }}
            resizeMode="contain"
          />
          <View
            style={{
              flex: 45,
              flexDirection: 'column',
              width: width * 0.8,
              // borderColor: 'black',
              // borderWidth: 1,
            }}>
            <Text
              style={{
                fontWeight: 'normal',
                fontSize: 28,
                flexWrap: 'wrap',
                fontFamily: 'Roboto-Regular',
              }}>
              {WelcomeTxt.title}
            </Text>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 27,
                flexWrap: 'wrap',
                fontFamily: 'Roboto-Regular',
              }}>
              {WelcomeTxt.titleBold}
            </Text>
            <Text
              style={{
                fontWeight: 'normal',
                fontSize: 16,
                flexWrap: 'wrap',
                fontFamily: 'Roboto-Regular',
                paddingTop: 48,
              }}>
              {WelcomeTxt.description}
              <Text
                style={{
                  // fontWeight: 'normal',
                  // fontSize: 16,
                  color: CMSColor.primaryActive,
                }}
                onPress={() => {
                  Linking.openURL(APP_INFO.ContactUrl);
                }}>
                {WelcomeTxt.contactLink}
              </Text>
            </Text>
          </View>
          <View style={{flex: 40}}>
            <Button
              enable={true}
              style={{marginTop: 21}}
              type={'primary'}
              caption={WelcomeTxt.login}
              onPress={this.onLogin}
            />
            <Button
              enable={true}
              style={{marginTop: 14}}
              type={'flat'}
              caption={WelcomeTxt.skip}
              onPress={this.onGoPro}
            />
          </View>
        </View>
      </ImageBackground>
      // </View>
    );
  }
}

export default inject('appStore')(observer(WelcomeView));
