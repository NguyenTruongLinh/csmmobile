// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, Text, Image, Platform} from 'react-native';
import {inject, observer} from 'mobx-react';

import HomeWidget from '../../components/containers/HomeWidget';
import {IconCustom} from '../../components/CMSStyleSheet';

import {
  Home_Alarm,
  Home_Health,
  Home_OAM,
  Home_SmartER,
  Home_Video,
} from '../../consts/images';
import ROUTERS from '../../consts/routes';
import CMSColors from '../../styles/cmscolors';

class HomeView extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (__DEV__) console.log('Home componentDidMount');
    const {appStore} = this.props;
    appStore.naviService && appStore.naviService.onReady();
  }

  onAlarmPress = () => {
    const {navigation} = this.props;

    navigation.navigate(ROUTERS.ALARM_STACK);
  };

  onVideoPress = () => {
    const {navigation} = this.props;

    navigation.navigate(ROUTERS.VIDEO_STACK);
  };

  onHealthPress = () => {
    const {navigation} = this.props;
    __DEV__ &&
      console.log('GOND onHealthPress, navi state: ', navigation.state);

    navigation.navigate(ROUTERS.HEALTH_STACK);
  };

  onSmartERPress = () => {
    const {navigation} = this.props;

    navigation.navigate(ROUTERS.POS_STACK);
  };

  onOAMPress = () => {
    const {navigation} = this.props;

    navigation.navigate(ROUTERS.OAM_STACK);
  };

  render() {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          backgroundColor: CMSColors.White,
        }}>
        <View
          style={{
            flex: 5,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: '76%',
            backgroundColor: CMSColors.HomeHeader,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        />
        <View
          style={{
            flex: 30,
            margin: 25,
            padding: 20,
            borderRadius: 16,

            flexDirection: 'row',
            backgroundColor: CMSColors.White,
            ...Platform.select({
              ios: {
                shadowRadius: 10,
                shadowColor: CMSColors.BoxShadow,
              },
              android: {
                elevation: 10,
              },
            }),
          }}>
          <View style={{flex: 1, marginRight: 14}}>
            <HomeWidget
              icon={Home_Alarm}
              title="Alarm"
              alertCount={5}
              titleStyle={{
                fontSize: 24,
                fontWeight: '700',
                color: CMSColors.Dark_Blue,
              }}
              onPress={this.onAlarmPress}
            />
          </View>
          <View style={{flex: 1, marginLeft: 14}}>
            <HomeWidget
              icon={Home_Video}
              title="Video"
              titleStyle={{
                fontSize: 24,
                fontWeight: '700',
                color: CMSColors.Dark_Blue,
              }}
              onPress={this.onVideoPress}
            />
          </View>
        </View>
        <View
          style={{
            flex: 28,
            flexDirection: 'row',
            margin: 25,
            marginTop: 0,
          }}>
          <View style={{flex: 1, marginRight: 14}}>
            <HomeWidget
              icon={Home_Health}
              title="Health Monitor"
              alertCount={1}
              titleStyle={{
                fontSize: 16,
                fontWeight: '500',
              }}
              onPress={this.onHealthPress}
            />
          </View>
          <View style={{flex: 1, marginLeft: 14}}>
            <HomeWidget
              icon={Home_SmartER}
              title="Smart-ER"
              alertCount={12}
              titleStyle={{
                fontSize: 16,
                fontWeight: '500',
              }}
              onPress={this.onSmartERPress}
            />
          </View>
        </View>
        <View
          style={{
            flex: 28,
            flexDirection: 'row',
            margin: 25,
            marginTop: 0,
          }}>
          <View style={{flex: 1, marginRight: 14}}>
            <HomeWidget
              icon={Home_OAM}
              title="OAM"
              alertCount={1}
              titleStyle={{
                fontSize: 16,
                fontWeight: '500',
              }}
              onPress={this.onOAMPress}
            />
          </View>
          <View style={{flex: 1, marginLeft: 14}}></View>
        </View>
        <View
          style={{
            flex: 9,
            flexDirection: 'row',
          }}
        />
      </View>
    );
  }
}

export default inject('appStore')(observer(HomeView));
