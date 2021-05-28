import React, {Component} from 'react';
import {
  View,
  ImageBackground,
  Image,
  Text,
  Dimensions,
  Linking,
} from 'react-native';

import navigationService from '../../navigation/navigationService';

import Button from '../../components/controls/Button';

import ROUTERS from '../../consts/routes';
import {I3_Logo} from '../../consts/images';
import CMSColor from '../../styles/cmscolors';

const backgroundImg = require('../../assets/images/intro/welcome.png');
const titleText = 'SIGN IN TO GET THE MOST OUT OF YOUR';
const titleBoldText = 'SMART VIDEO SYSTEM.';
const descriptionText =
  'By signing up for your i3 cloud account you will be able to unlock multiple features like real-time alarms, POS integration, video streaming, health monitoring, and much more. ';
const hyperlinkText = 'Contact i3 to sign up today.';

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
    navigationService.navigate(ROUTERS.LOGIN);
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
              {titleText}
            </Text>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 27,
                flexWrap: 'wrap',
                fontFamily: 'Roboto-Regular',
              }}>
              {titleBoldText}
            </Text>
            <Text
              style={{
                fontWeight: 'normal',
                fontSize: 16,
                flexWrap: 'wrap',
                fontFamily: 'Roboto-Regular',
                paddingTop: 48,
              }}>
              {descriptionText}
              <Text
                style={{
                  // fontWeight: 'normal',
                  // fontSize: 16,
                  color: CMSColor.primaryActive,
                }}
                onPress={() => {
                  Linking.openURL('https://i3international.com/contact');
                }}>
                {hyperlinkText}
              </Text>
            </Text>
          </View>
          <View style={{flex: 40}}>
            <Button
              enable={true}
              style={{marginTop: 21}}
              type={'primary'}
              caption={'LOGIN'}
              onPress={this.onLogin}
            />
            <Button
              enable={true}
              style={{marginTop: 14}}
              type={'flat'}
              caption={'Skip to stand alone remote app'}
              onPress={this.onGoPro}
            />
          </View>
        </View>
      </ImageBackground>
      // </View>
    );
  }
}

export default WelcomeView;
