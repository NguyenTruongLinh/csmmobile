// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import {View, Dimensions} from 'react-native';
import {inject, observer} from 'mobx-react';

import HomeWidget from '../../components/containers/HomeWidget';
const {width} = Dimensions.get('window');

import theme from '../../styles/appearance';
import styles from './styles/homeStyles';

import {
  Home_Alarm,
  Home_Health,
  Home_OAM,
  Home_SmartER,
  Home_Video,
} from '../../consts/images';
import ROUTERS from '../../consts/routes';
import {clientLogID} from '../../stores/user';

class HomeView extends Component {
  constructor(props) {
    super(props);
  }

  notifyClearIntervals() {
    if (this.interval) clearInterval(this.interval);
  }

  componentDidMount() {
    if (__DEV__) console.log('Home componentDidMount');
    const {appStore, userStore, navigation} = this.props;
    appStore.naviService && appStore.naviService.onReady();

    this.unsubscribleFocusEvent = navigation.addListener('focus', () => {
      __DEV__ && console.log('Home componentWillBeFocused');
      userStore.getWidgetCounts();
      this.notifyClearIntervals();
      this.interval = setInterval(function () {
        userStore.getWidgetCounts();
        __DEV__ && console.log('GOND intervalUpdateWidgetCounts ...');
      }, 30 * 1000);
      userStore.setActivites(clientLogID.HOME);
    });

    this.unsubscribleBlurEvent = navigation.addListener('blur', () => {
      __DEV__ && console.log('Home componentWillBeBlurred');
      this.notifyClearIntervals();
    });
  }

  componentWillUnmount() {
    __DEV__ && console.log('Home componentWillUnmount');
    this.unsubscribleFocusEvent && this.unsubscribleFocusEvent();
    this.unsubscribleBlurEvent && this.unsubscribleBlurEvent();
    this.notifyClearIntervals();
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

    navigation.navigate(ROUTERS.HEALTH_SITES);
  };

  onSmartERPress = () => {
    const {navigation} = this.props;
    navigation.navigate(ROUTERS.SMARTER_DASHBOARD);
  };

  onOAMPress = () => {
    const {navigation} = this.props;
    navigation.navigate(ROUTERS.OAM_SITES);
  };

  render() {
    const {userStore, appStore} = this.props;
    const disableIndexes = userStore.disableHomeWidgetIndexes;
    const {appearance} = appStore;
    const topIconSize = ((width - 118) * (width > 600 ? 4 : 5.8)) / 20;
    const iconSize = ((width - 78) * (width > 600 ? 3.5 : 4)) / 20;
    return (
      <View style={[styles.container, theme[appearance].container]}>
        <View style={styles.header} />
        <View style={styles.headerBackground} />
        <View
          style={[styles.topWidgetsContainer, theme[appearance].homeHeaderRow]}>
          <View style={styles.leftWidget}>
            <HomeWidget
              isDisable={disableIndexes.includes(0)}
              icon={Home_Alarm}
              title="Alarm"
              alertCount={userStore.alarmWidgetCount}
              titleStyle={[styles.topWidgetTitle, theme[appearance].text]}
              onPress={this.onAlarmPress}
              iconSize={topIconSize}
            />
          </View>
          <View style={styles.rightWidget}>
            <HomeWidget
              isDisable={disableIndexes.includes(1)}
              icon={Home_Video}
              title="Video"
              titleStyle={[styles.topWidgetTitle, theme[appearance].text]}
              onPress={this.onVideoPress}
              iconSize={topIconSize}
            />
          </View>
        </View>
        <View style={styles.widgetRow}>
          <View style={styles.leftWidget}>
            <HomeWidget
              isDisable={disableIndexes.includes(2)}
              icon={Home_Health}
              title="Health Monitor"
              alertCount={userStore.healthWidgetCount}
              titleStyle={[styles.normalWidgetTitle, theme[appearance].text]}
              onPress={this.onHealthPress}
              iconSize={iconSize}
            />
          </View>
          <View style={styles.rightWidget}>
            <HomeWidget
              isDisable={disableIndexes.includes(3)}
              icon={Home_SmartER}
              title="Smart-ER"
              alertCount={userStore.smartWidgetCount}
              titleStyle={[styles.normalWidgetTitle, theme[appearance].text]}
              onPress={this.onSmartERPress}
              iconSize={iconSize}
            />
          </View>
        </View>
        <View style={styles.widgetRow}>
          <View style={styles.leftWidget}>
            <HomeWidget
              isDisable={disableIndexes.includes(4)}
              icon={Home_OAM}
              title="OAM"
              alertCount={userStore.oamWidgetCount}
              titleStyle={[styles.normalWidgetTitle, theme[appearance].text]}
              onPress={this.onOAMPress}
              iconSize={iconSize}
            />
          </View>
          <View style={styles.rightWidget}></View>
        </View>
        <View style={styles.footer} />
      </View>
    );
  }
}

export default inject('appStore', 'userStore')(observer(HomeView));
