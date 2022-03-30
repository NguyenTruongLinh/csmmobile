// ----------------------------------------------------
// <!-- START MODULES -->
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  Image,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {inject, observer} from 'mobx-react';

import HomeWidget from '../../components/containers/HomeWidget';
import {IconCustom} from '../../components/CMSStyleSheet';
const {width, height} = Dimensions.get('window');

import {
  Home_Alarm,
  Home_Health,
  Home_OAM,
  Home_SmartER,
  Home_Video,
} from '../../consts/images';
import ROUTERS from '../../consts/routes';
import CMSColors from '../../styles/cmscolors';
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
    });

    this.unsubscribleBlurEvent = navigation.addListener('blur', () => {
      __DEV__ && console.log('Home componentWillBeBlurred');
      this.notifyClearIntervals();
    });

    userStore.setActivites(clientLogID.HOME);
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
    const {userStore} = this.props;
    const disableIndexes = userStore.disableHomeWidgetIndexes;
    const topIconSize = ((width - 118) * (width > 600 ? 4 : 5.8)) / 20;
    const iconSize = ((width - 78) * (width > 600 ? 3.5 : 4)) / 20;
    return (
      <View style={styles.container}>
        <View style={styles.header} />
        <View style={styles.headerBackground} />
        <View style={[styles.topWidgetsContainer]}>
          <View style={styles.leftWidget}>
            <HomeWidget
              isDisable={disableIndexes.includes(0)}
              icon={Home_Alarm}
              title="Alarm"
              alertCount={userStore.alarmWidgetCount}
              titleStyle={styles.topWidgetTitle}
              onPress={this.onAlarmPress}
              iconSize={topIconSize}
            />
          </View>
          <View style={styles.rightWidget}>
            <HomeWidget
              isDisable={disableIndexes.includes(1)}
              icon={Home_Video}
              title="Video"
              titleStyle={styles.topWidgetTitle}
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
              titleStyle={styles.normalWidgetTitle}
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
              titleStyle={styles.normalWidgetTitle}
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
              titleStyle={styles.normalWidgetTitle}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: CMSColors.White,
  },
  header: {
    flex: 5,
  },
  footer: {
    flex: 9,
    flexDirection: 'row',
  },
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: '76%',
    backgroundColor: CMSColors.HomeHeader,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topWidgetsContainer: {
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
    // borderColor: 'red',
    // borderWidth: 1,
  },
  topWidgetTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: CMSColors.Dark_Blue,
  },
  leftWidget: {flex: 1, marginRight: 14},
  rightWidget: {flex: 1, marginLeft: 14},
  normalWidgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  widgetRow: {
    flex: 28,
    flexDirection: 'row',
    margin: 25,
    marginTop: 0,
    // borderColor: 'red',
    // borderWidth: 1,
  },
});

export default inject('appStore', 'userStore')(observer(HomeView));
