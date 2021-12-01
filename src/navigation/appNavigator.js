import React, {Fragment} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';

// import navigationService from './navigationService';
// import {navigationStore} from '../stores/navigation';
import CMSTabbar from './tabbar';

import CMSIntroView from '../views/intro/cmsIntro';
import WelcomeView from '../views/intro/welcome';
import LoginView from '../views/auth/login';

import HomeView from '../views/home/home';

// import DashboardView from '../views/smarter/summary';
// import ExceptionsView from '../views/smarter/transactions';
// import TransactionDetailView from '../views/smarter/transactionDetail';
// import TransactionFCMView from '../views/smarter/transactionDetailFCM';

import OAMSitesView from '../views/oam/oamSites';
import OAMDetailView from '../views/oam/detail';
import VideoPlayerView from '../views/video/player';

import SitesView from '../views/sitetree/sites';

// import HealthView from '../views/health/health';
import HealthDetailView from '../views/health/healthDetail';
import AlertsView from '../views/health/alerts';
import AlertDetailView from '../views/health/alertDetail';

import DashboardView from '../views/smarter/summary';
import ExceptionsView from '../views/smarter/transactions';
import TransactionDetailView from '../views/smarter/transactionDetail';
import TransactionFCMView from '../views/smarter/transactionDetailFCM';

import ChannelsListView from '../views/video/channelsList';
import ChannelsSettingView from '../views/video/channelsSetting';

import VideoStack from './videoNavigator';
import SettingsStack from './settingsNavigator';
import AlarmStack from './alarmNavigator';
import SmartERStack from './smarterNavigator';

import LoadingOverlay from '../components/common/loadingOverlay';
import ROUTERS, {getHeaderTitle} from '../consts/routes';

import BackButton from '../components/controls/BackButton';
import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';
import AccountLocked from '../views/auth/accountLocked';
import passwordExpired from '../views/auth/passwordExpired';
// import cmscolors from '../styles/cmscolors';

// const getHeaderOptions = route => {
//   const headerTitle = getHeaderTitle(route);
//   console.log('GOND getHeaderTitle: ', headerTitle);
//   return {
//     title: headerTitle,
//     headerStyle: {
//       backgroundColor: CMSColors.White_Op54,
//     },
//     // headerTintColor: '#fff',
//     headerTitleStyle: {
//       fontWeight: 'bold',
//     },
//   };
// };

// const HOStack = createStackNavigator();
// const HealthStack = () => (
//   <HOStack.Navigator initialRouteName={ROUTERS.HEALTH_SITES} headerMode="float">
//     <HOStack.Screen name={ROUTERS.HEALTH_SITES} component={HealthView} />
//     <HOStack.Screen name={ROUTERS.HEALTH_DETAIL} component={HealthDetailView} />
//     <HOStack.Screen name={ROUTERS.HEALTH_ALERTS} component={AlertsView} />
//     <HOStack.Screen
//       name={ROUTERS.HEALTH_ALERT_DETAIL}
//       component={AlertDetailView}
//     />
//   </HOStack.Navigator>
// );

// const HOStack = createStackNavigator();
// const POSStack = () => (
//   <HOStack.Navigator
//     initialRouteName={ROUTERS.SMARTER_DASHBOARD}
//     headerMode="float">
//     <HOStack.Screen name={ROUTERS.SMARTER_DASHBOARD} component={DashboardView} />
//     <HOStack.Screen name={ROUTERS.TRANSACTIONS} component={ExceptionsView} />
//     <HOStack.Screen
//       name={ROUTERS.TRAN_DETAIL}
//       component={TransactionDetailView}
//     />
//     <HOStack.Screen
//       name={ROUTERS.TRAN_DETAIL_FCM}
//       component={TransactionFCMView}
//     />
//   </HOStack.Navigator>
// );

const screenOptions = ({route, navigation}) => ({
  headerStyle: {
    // backgroundColor: CMSColors.White,
    borderBottomWidth: 1,
  },
  headerStatusBarHeight: variables.StatusBarHeight,
  headerTitleAlign: 'center',
  headerMode: 'screen',
  headerTitle: getHeaderTitle(route),
  headerLeft: () => <BackButton navigator={navigation} />,
});

const clearButtonScreenOptions = ({route, navigation}) => ({
  headerLeft: () => (
    <BackButton
      navigator={navigation}
      icon="clear-button"
      color={CMSColors.White}
    />
  ),
  headerStyle: {
    backgroundColor: CMSColors.DarkElement,
  },
  headerTitleStyle: {
    color: CMSColors.White,
  },
});

const HOStack = createStackNavigator();
const OAMScreens = () => (
  <Fragment>
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.OAM_SITES}
      component={OAMSitesView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.OAM_DETAIL}
      component={OAMDetailView}
    />
  </Fragment>
);

const HealthScreens = () => (
  <Fragment>
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.HEALTH_SITES}
      component={SitesView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.HEALTH_DETAIL}
      component={HealthDetailView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.HEALTH_ALERTS}
      component={AlertsView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.HEALTH_ALERT_DETAIL}
      component={AlertDetailView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.HEALTH_CHANNELS}
      component={ChannelsListView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.VIDEO_CHANNELS_SETTING}
      component={ChannelsSettingView}
    />
  </Fragment>
);

const SmartERScreens = () => (
  <Fragment>
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.SMARTER_DASHBOARD}
      component={DashboardView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.TRANSACTIONS}
      component={ExceptionsView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.TRANS_DETAIL}
      component={TransactionDetailView}
    />
    <HOStack.Screen
      options={screenOptions}
      name={ROUTERS.TRANS_DETAIL_FCM}
      component={TransactionFCMView}
    />
  </Fragment>
);

const HomeNavigator = () => (
  <HOStack.Navigator initialRouteName={ROUTERS.HOME} headerMode="screen">
    <HOStack.Screen
      options={({route, navigation}) => ({
        headerStyle: {
          height: 0,
        },
        headerMode: 'none',
        headerTitle: '',
      })}
      name={ROUTERS.HOME}
      component={HomeView}
    />
    {/* <HOStack.Screen name={ROUTERS.HEALTH_STACK} component={HealthStack} /> */}
    {/* <HOStack.Screen name={ROUTERS.SMARTER_STACK} component={SmartERStack} /> */}
    {HealthScreens()}
    {SmartERScreens()}
    {OAMScreens()}
    <HOStack.Screen
      name={ROUTERS.VIDEO_PLAYER}
      component={VideoPlayerView}
      options={clearButtonScreenOptions}
    />
  </HOStack.Navigator>
);

const BottomTab = createBottomTabNavigator();
const CMSMainTab = () => (
  <BottomTab.Navigator
    initialRouteName={ROUTERS.HOME_NAVIGATOR}
    headerMode="none"
    backBehavior="none"
    sceneContainerStyle={{
      flex: 1,
      backgroundColor: 'white',
    }}
    screenOptions={{unmountOnBlur: true}}
    tabBar={props => {
      return <CMSTabbar {...props} />;
    }}>
    <BottomTab.Screen name={ROUTERS.HOME_NAVIGATOR} component={HomeNavigator} />
    <BottomTab.Screen name={ROUTERS.VIDEO_STACK} component={VideoStack} />
    <BottomTab.Screen name={ROUTERS.ALARM_STACK} component={AlarmStack} />
    <BottomTab.Screen
      name={ROUTERS.OPTIONS_NAVIGATOR}
      component={SettingsStack}
    />
    {/* Hidden tabs: can only access from Home screen*/}
    {/* <BottomTab.Screen name={ROUTERS.HEALTH_STACK} component={HealthStack} />
    <BottomTab.Screen name={ROUTERS.SMARTER_STACK} component={POSStack} />
    <BottomTab.Screen name={ROUTERS.OAM_STACK} component={OAMStack} /> */}
  </BottomTab.Navigator>
);

const IntroStack = createStackNavigator();
const WelcomeStack = createStackNavigator();

/**
 *
 * @param {bool} showIntro
 * @param {bool} isLoggedIn
 * @returns ReactElement
 */
const AppNavigator = ({isLoggedIn, appStore, notificationController}) => {
  const {showIntro, isLoading, naviService} = appStore;

  // __DEV__ && console.log('GOND NavContainer: ', this.props);
  return (
    <NavigationContainer
      // theme={{
      //   ...DefaultTheme,
      //   colors: {
      //     ...DefaultTheme.colors,
      //     background: cmscolors.White,
      //   },
      // }}
      ref={ref => {
        // __DEV__ && console.log('GOND NavContainer ref = ', ref);
        appStore.setNavigator(ref);
      }}
      onReady={() => {
        __DEV__ && console.log('GOND NavigationContainer onReady!!!!!');
        naviService && naviService.onReady(true);
      }}
      onStateChange={state => {
        __DEV__ &&
          console.log('GOND onStateChange state = ' + JSON.stringify(state));
        naviService && naviService.onStateChange(state);
      }}>
      {isLoggedIn && notificationController}

      {isLoading ? (
        <LoadingOverlay />
      ) : showIntro ? (
        <IntroStack.Navigator
          initialRouteName={ROUTERS.INTRO_CMS}
          headerMode="none">
          <IntroStack.Screen
            name={ROUTERS.INTRO_CMS}
            component={CMSIntroView}
          />
        </IntroStack.Navigator>
      ) : isLoggedIn ? (
        CMSMainTab()
      ) : (
        <WelcomeStack.Navigator
          initialRouteName={ROUTERS.INTRO_WELCOME}
          headerMode="none">
          <WelcomeStack.Screen
            name={ROUTERS.INTRO_WELCOME}
            component={WelcomeView}
          />
          <WelcomeStack.Screen name={ROUTERS.LOGIN} component={LoginView} />
          {/* AccountLocked} /> */}
          <WelcomeStack.Screen
            name={ROUTERS.PASSWORD_EXPIRED}
            component={passwordExpired}
          />
          <WelcomeStack.Screen
            name={ROUTERS.ACCOUNT_LOCKED}
            component={AccountLocked}
          />
        </WelcomeStack.Navigator>
      )}
    </NavigationContainer>
  );
};
// };

export default AppNavigator;
