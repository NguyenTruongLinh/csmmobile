import React from 'react';
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

import SummaryView from '../views/pos/summary';
import ExceptionsView from '../views/pos/transactions';
import TransactionDetailView from '../views/pos/transactionDetail';
import TransactionFCMView from '../views/pos/transactionDetailFCM';

import OAMSitesView from '../views/oam/oamSites';
import OAMDetailView from '../views/oam/detail';

import VideoStack from './videoNavigator';
import SettingsStack from './settingsNavigator';
import AlarmStack from './alarmNavigator';
import HealthStack from './healthNavigator';

import LoadingOverlay from '../components/common/loadingOverlay';
import ROUTERS from '../consts/routes';
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

const OAStack = createStackNavigator();
const OAMStack = () => (
  <OAStack.Navigator initialRouteName={ROUTERS.OAM_SITES} headerMode="float">
    <OAStack.Screen name={ROUTERS.OAM_SITES} component={OAMSitesView} />
    <OAStack.Screen name={ROUTERS.OAM_DETAIL} component={OAMDetailView} />
  </OAStack.Navigator>
);

// const HStack = createStackNavigator();
// const HealthStack = () => (
//   <HStack.Navigator initialRouteName={ROUTERS.HEALTH_SITES} headerMode="float">
//     <HStack.Screen name={ROUTERS.HEALTH_SITES} component={HealthView} />
//     <HStack.Screen name={ROUTERS.HEALTH_DETAIL} component={HealthDetailView} />
//     <HStack.Screen name={ROUTERS.HEALTH_ALERTS} component={AlertsView} />
//     <HStack.Screen
//       name={ROUTERS.HEALTH_ALERT_DETAIL}
//       component={AlertDetailView}
//     />
//   </HStack.Navigator>
// );

const PStack = createStackNavigator();
const POSStack = () => (
  <PStack.Navigator initialRouteName={ROUTERS.POS} headerMode="float">
    <PStack.Screen name={ROUTERS.POS} component={SummaryView} />
    <PStack.Screen name={ROUTERS.TRANSACTIONS} component={ExceptionsView} />
    <PStack.Screen
      name={ROUTERS.TRAN_DETAIL}
      component={TransactionDetailView}
    />
    <PStack.Screen
      name={ROUTERS.TRAN_DETAIL_FCM}
      component={TransactionFCMView}
    />
  </PStack.Navigator>
);

const HOStack = createStackNavigator();
const HomeNavigator = () => (
  <HOStack.Navigator initialRouteName={ROUTERS.HOME} headerMode="none">
    <HOStack.Screen name={ROUTERS.HOME} component={HomeView} />
    <HOStack.Screen name={ROUTERS.HEALTH_STACK} component={HealthStack} />
    <HOStack.Screen name={ROUTERS.POS_STACK} component={POSStack} />
    <HOStack.Screen name={ROUTERS.OAM_STACK} component={OAMStack} />
  </HOStack.Navigator>
);

const BottomTab = createBottomTabNavigator();
const CMSMainTab = navigatorSetter => (
  <BottomTab.Navigator
    initialRouteName={ROUTERS.HOME}
    headerMode="none"
    backBehavior="none"
    sceneContainerStyle={{
      flex: 1,
      backgroundColor: 'white',
    }}
    screenOptions={{unmountOnBlur: true}}
    tabBar={props => {
      return <CMSTabbar naviSetter={navigatorSetter} {...props} />;
    }}>
    <BottomTab.Screen name={ROUTERS.HOME_NAVIGATOR} component={HomeNavigator} />
    <BottomTab.Screen name={ROUTERS.VIDEO_STACK} component={VideoStack} />
    <BottomTab.Screen name={ROUTERS.ALARM_STACK} component={AlarmStack} />
    <BottomTab.Screen
      name={ROUTERS.OPTIONS_NAVIGATOR}
      component={SettingsStack}
    />
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
const AppNavigator = ({
  showIntro,
  isLoggedIn,
  isLoading,
  navigatorSetter,
  notificationController,
}) => {
  // __DEV__ && console.log('GOND NavContainer render, isLogin = ', isLoggedIn);
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
        // navigationService.setTopLevelNavigator(ref);
        if (typeof navigatorSetter == 'function') navigatorSetter(ref);
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
        CMSMainTab(navigatorSetter)
      ) : (
        <WelcomeStack.Navigator
          initialRouteName={ROUTERS.INTRO_WELCOME}
          headerMode="none">
          <WelcomeStack.Screen
            name={ROUTERS.INTRO_WELCOME}
            component={WelcomeView}
          />
          <WelcomeStack.Screen name={ROUTERS.LOGIN} component={LoginView} />
        </WelcomeStack.Navigator>
      )}
    </NavigationContainer>
  );
};
// };

export default AppNavigator;
