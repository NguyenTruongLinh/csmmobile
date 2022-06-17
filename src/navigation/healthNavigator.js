import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import BackButton from '../components/controls/BackButton';

import SitesView from '../views/sitetree/sites';

// import HealthView from '../views/health/health';
import HealthDetailView from '../views/health/healthDetail';
import AlertsView from '../views/health/alerts';
import AlertDetailView from '../views/health/alertDetail';

import ChannelsListView from '../views/video/channelsList';
import ChannelsSettingView from '../views/video/channelsSetting';
import VideoPlayerView from '../views/video/player';

import ROUTERS, {getHeaderTitle} from '../consts/routes';
import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';

const HStack = createStackNavigator();

export default function HealthStack() {
  return (
    <HStack.Navigator
      initialRouteName={ROUTERS.HEALTH_SITES}
      screenOptions={({route, navigation}) => ({
        headerStyle: {
          // backgroundColor: CMSColors.White,
          borderBottomWidth: 1,
        },
        headerStatusBarHeight: variables.StatusBarHeight,
        headerTitleAlign: 'center',
        headerMode: 'screen',
        headerTitle: getHeaderTitle(route),
        headerLeft: () => <BackButton navigator={navigation} />,
      })}>
      <HStack.Screen name={ROUTERS.HEALTH_SITES} component={SitesView} />
      <HStack.Screen
        name={ROUTERS.HEALTH_DETAIL}
        component={HealthDetailView}
      />
      <HStack.Screen name={ROUTERS.HEALTH_ALERTS} component={AlertsView} />
      <HStack.Screen
        name={ROUTERS.HEALTH_ALERT_DETAIL}
        component={AlertDetailView}
      />
      <HStack.Screen
        name={ROUTERS.HEALTH_CHANNELS}
        component={ChannelsListView}
      />
      <HStack.Screen
        name={ROUTERS.VIDEO_CHANNELS_SETTING}
        component={ChannelsSettingView}
      />
      <HStack.Screen
        name={ROUTERS.HEALTH_VIDEO}
        component={VideoPlayerView}
        options={({route, navigation}) => ({
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
        })}
      />
    </HStack.Navigator>
  );
}
