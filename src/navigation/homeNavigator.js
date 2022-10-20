import React from 'react';
import {View} from 'react-native';
import {inject, observer} from 'mobx-react';

import {createStackNavigator} from '@react-navigation/stack';

import BackButton from '../components/controls/BackButton';

import OAMSitesView from '../views/oam/oamSites';
import OAMDetailView from '../views/oam/detail';

import VideoPlayerView from '../views/video/player';
import ChannelsListView from '../views/video/channelsList';
import ChannelsSettingView from '../views/video/channelsSetting';

import SitesView from '../views/sitetree/sites';
import HealthDetailView from '../views/health/healthDetail';
import AlertsView from '../views/health/alerts';
import AlertDetailView from '../views/health/alertDetail';

import DashboardView from '../views/smarter/summary';
import ExceptionsView from '../views/smarter/transactions';
import TransactionDetailView from '../views/smarter/transactionDetail';
import TransactionFCMView from '../views/smarter/transactionDetailFCM';

import HomeView from '../views/home/home';

import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';
import theme from '../styles/appearance';
import ROUTERS, {getHeaderTitle} from '../consts/routes';

const HOStack = createStackNavigator();

const screenOptions = ({route, navigation}, appearance) => ({
  headerStyle: {
    backgroundColor: theme[appearance].container.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: CMSColors.DividerColor54,
  },
  headerStatusBarHeight: variables.StatusBarHeight,
  headerTitleAlign: 'center',
  headerMode: 'screen',
  headerTitle: getHeaderTitle(route),
  headerTitleStyle: {
    ...theme[appearance].text,
  },
  headerLeft: () => <BackButton navigator={navigation} />,
});

const clearButtonScreenOptions = ({navigation}) => ({
  headerLeft: () => (
    <BackButton
      navigator={navigation}
      icon="clear-button"
      color={CMSColors.White}
    />
  ),
  headerStatusBarHeight: variables.StatusBarHeight,
  headerTitleAlign: 'center',
  headerMode: 'screen',
  headerStyle: {
    backgroundColor: CMSColors.DarkElement,
  },
  headerTitleStyle: {
    color: CMSColors.White,
  },
});

const OAMScreens = appearance => (
  <>
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.OAM_SITES}
      component={OAMSitesView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.OAM_DETAIL}
      component={OAMDetailView}
    />
  </>
);

const HealthScreens = appearance => (
  <>
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.HEALTH_SITES}
      component={SitesView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.HEALTH_DETAIL}
      component={HealthDetailView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.HEALTH_ALERTS}
      component={AlertsView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.HEALTH_ALERT_DETAIL}
      component={AlertDetailView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.HEALTH_CHANNELS}
      component={ChannelsListView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.VIDEO_CHANNELS_SETTING}
      component={ChannelsSettingView}
    />
  </>
);

const SmartERScreens = appearance => (
  <>
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.SMARTER_DASHBOARD}
      component={DashboardView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.TRANSACTIONS}
      component={ExceptionsView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.TRANS_DETAIL}
      component={TransactionDetailView}
    />
    <HOStack.Screen
      options={props => screenOptions(props, appearance)}
      name={ROUTERS.TRANS_DETAIL_FCM}
      component={TransactionFCMView}
    />
  </>
);

function HomeStack(props) {
  const {appStore} = props;
  const {appearance} = appStore;

  return (
    <View style={[{flex: 1}, theme[appearance].container]}>
      <HOStack.Navigator initialRouteName={ROUTERS.HOME} headerMode="screen">
        <HOStack.Screen
          options={() => ({
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
        {HealthScreens(appearance)}
        {SmartERScreens(appearance)}
        {OAMScreens(appearance)}
        <HOStack.Screen
          name={ROUTERS.VIDEO_PLAYER}
          component={VideoPlayerView}
          options={clearButtonScreenOptions}
        />
      </HOStack.Navigator>
    </View>
  );
}

export default inject('appStore')(observer(HomeStack));
