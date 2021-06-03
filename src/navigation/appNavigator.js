import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';

import navigationService from './navigationService';
// import {navigationStore} from '../stores/navigation';
import CMSTabbar from './tabbar';

import CMSIntroView from '../views/intro/cmsIntro';
import WelcomeView from '../views/intro/welcome';
import LoginView from '../views/auth/login';

import HomeView from '../views/home/home';

import AlarmsLiveView from '../views/alarms/live';
import AlarmsSearchView from '../views/alarms/search';
import AlarmDetailView from '../views/alarms/detail';

import HealthView from '../views/health/health';
import HealthDetailView from '../views/health/healthDetail';
import AlertsView from '../views/health/alerts';
import AlertDetailView from '../views/health/alertDetail';

import RegionsView from '../views/sitetree/regions';
import SitesView from '../views/sitetree/sites';
import NVRsView from '../views/sitetree/nvrs';

import ChannelsView from '../views/video/channels';
import ChannelsSettingView from '../views/video/channelsSetting';
import VideoPlayerView from '../views/video/player';

import SummaryView from '../views/pos/summary';
import ExceptionsView from '../views/pos/transactions';
import TransactionDetailView from '../views/pos/transactionDetail';
import TransactionFCMView from '../views/pos/transactionDetailFCM';

import OAMSitesView from '../views/oam/oamSites';
import OAMDetailView from '../views/oam/detail';

import SettingsView from '../views/settings/settings';
import ProfileView from '../views/settings/profile';
import AboutViews from '../views/settings/about';
import NotifySettingView from '../views/settings/notify';
import VideoSettingView from '../views/settings/video';

import LoadingOverlay from '../components/common/loadingOverlay';
import ROUTERS from '../consts/routes';

getHeaderTitle = route => {
  // If the focused route is not found, we need to assume it's the initial screen
  // This can happen during if there hasn't been any navigation inside the screen
  // In our case, it's "Feed" as that's the first screen inside the navigator
  const routeName = getFocusedRouteNameFromRoute(route) ?? '';

  switch (routeName) {
    case ROUTES.HEALTH_SITES:
      return 'Health';
    case ROUTES.HEALTH_DETAIL:
      return ''; // TODO: site name get from store
    case ROUTES.HEALTH_ALERTS:
      return ''; // TODO: get from store
    case ROUTES.HEALTH_ALERT_DETAIL:
      return ''; // TODO: get from store

    case ROUTES.VIDEO_REGIONS:
      return 'Regions';
    case ROUTES.VIDEO_SITES:
      return 'Sites';
    case ROUTES.VIDEO_NVRS:
      return 'NVRS';
    case ROUTES.VIDEO_CHANNELS:
      return 'Channels';
    case ROUTES.VIDEO_CHANNELS_SETTING:
      return 'Channels setting';
    // case ROUTES.VIDEO_PLAYER:

    case ROUTES.ALARM_LIVE:
      return 'Live';
    case ROUTES.ALARM_SEARCH:
      return 'Search';
    case ROUTES.ALARM_DETAIL:
    case ROUTES.ALARM_SEARCH_DETAIL:
      return ''; // TODO: get from store

    case ROUTES.OAM_SITES:
      return 'OAM';
    case ROUTES.OAM_DETAIL:
      return 'OAM';

    case ROUTES.POS:
      return 'POS';
    case ROUTES.TRANSACTIONS:
      return 'Transactions';
    case ROUTES.TRAN_DETAIL:
    case ROUTES.TRAN_DETAIL_FCM:
      return 'Transaction detail';

    case ROUTES.OPTIONS:
      return 'Options';
    case ROUTES.OPTIONS_PROFILE:
      return 'Profile';
    case ROUTES.OPTIONS_ABOUT:
      return 'About';
    case ROUTES.OPTIONS_NOTIFY:
      return 'Notification Setting';
    case ROUTES.OPTIONS_VIDEO:
      return 'Video Setting';
  }
  return null;
};

const AStack = createStackNavigator();
const AlarmStack = () => (
  <AStack.Navigator initialRouteName={ROUTERS.ALARM_LIVE} headerMode="none">
    <AStack.Screen name={ROUTERS.ALARM_LIVE} component={AlarmsLiveView} />
    <AStack.Screen name={ROUTERS.ALARM_SEARCH} component={AlarmsSearchView} />
    <AStack.Screen name={ROUTERS.ALARM_DETAIL} component={AlarmDetailView} />
  </AStack.Navigator>
);

const VStack = createStackNavigator();
const VideoStack = () => (
  <VStack.Navigator initialRouteName={ROUTERS.VIDEO_REGIONS} headerMode="none">
    <VStack.Screen name={ROUTERS.VIDEO_REGIONS} component={RegionsView} />
    <VStack.Screen name={ROUTERS.VIDEO_SITES} component={SitesView} />
    <VStack.Screen name={ROUTERS.VIDEO_NVRS} component={NVRsView} />
    <VStack.Screen name={ROUTERS.VIDEO_CHANNELS} component={ChannelsView} />
    <VStack.Screen
      name={ROUTERS.VIDEO_CHANNELS_SETTING}
      component={ChannelsSettingView}
    />
    <VStack.Screen name={ROUTERS.VIDEO_PLAYER} component={VideoPlayerView} />
  </VStack.Navigator>
);

const OPStack = createStackNavigator();
const OptionsStack = () => (
  <OPStack.Navigator initialRouteName={ROUTERS.OPTIONS} headerMode="none">
    <OPStack.Screen name={ROUTERS.OPTIONS} component={SettingsView} />
    <OPStack.Screen name={ROUTERS.OPTIONS_PROFILE} component={ProfileView} />
    <OPStack.Screen name={ROUTERS.OPTIONS_ABOUT} component={AboutViews} />
    <OPStack.Screen
      name={ROUTERS.OPTIONS_NOTIFY}
      component={NotifySettingView}
    />
    <OPStack.Screen name={ROUTERS.OPTIONS_VIDEO} component={VideoSettingView} />
  </OPStack.Navigator>
);

const OAStack = createStackNavigator();
const OAMStack = () => (
  <OAStack.Navigator initialRouteName={ROUTERS.OAM_SITES} headerMode="float">
    <OAStack.Screen name={ROUTERS.OAM_SITES} component={OAMSitesView} />
    <OAStack.Screen name={ROUTERS.OAM_DETAIL} component={OAMDetailView} />
  </OAStack.Navigator>
);

const HStack = createStackNavigator();
const HealthStack = () => (
  <HStack.Navigator initialRouteName={ROUTERS.HEALTH_SITES} headerMode="float">
    <HStack.Screen name={ROUTERS.HEALTH_SITES} component={HealthView} />
    <HStack.Screen name={ROUTERS.HEALTH_DETAIL} component={HealthDetailView} />
    <HStack.Screen name={ROUTERS.HEALTH_ALERTS} component={AlertsView} />
    <HStack.Screen
      name={ROUTERS.HEALTH_ALERT_DETAIL}
      component={AlertDetailView}
    />
  </HStack.Navigator>
);

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
const CMSMainTab = () => (
  <BottomTab.Navigator
    initialRouteName={ROUTERS.HOME}
    headerMode="none"
    tabBar={props => {
      return <CMSTabbar {...props} />;
    }}>
    <BottomTab.Screen name={ROUTERS.HOME_NAVIGATOR} component={HomeNavigator} />
    <BottomTab.Screen name={ROUTERS.VIDEO_STACK} component={VideoStack} />
    <BottomTab.Screen name={ROUTERS.ALARM_STACK} component={AlarmStack} />
    <BottomTab.Screen
      name={ROUTERS.OPTIONS_NAVIGATOR}
      component={OptionsStack}
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
const AppNavigator = ({showIntro, isLoggedIn, isLoading}) => {
  __DEV__ && console.log('GOND NavContainer render, isLogin = ', isLoggedIn);
  return (
    <NavigationContainer
      ref={ref => {
        // __DEV__ && console.log('GOND NavContainer ref = ', ref);
        navigationService.setTopLevelNavigator(ref);
      }}>
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
        </WelcomeStack.Navigator>
      )}
    </NavigationContainer>
  );
};
// };

export default AppNavigator;
