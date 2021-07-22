import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import BackButton from '../components/controls/BackButton';

import RegionsView from '../views/sitetree/regions';
import SitesView from '../views/sitetree/sites';
import NVRsView from '../views/sitetree/nvrs';

import ChannelsView from '../views/video/liveChannels';
import ChannelsSettingView from '../views/video/channelsSetting';
import VideoPlayerView from '../views/video/player';

import ROUTERS, {getHeaderTitle} from '../consts/routes';
import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';

const VStack = createStackNavigator();

export default function VideoStack() {
  return (
    <VStack.Navigator
      initialRouteName={ROUTERS.VIDEO_SITES} //{ROUTERS.VIDEO_REGIONS}
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
      })}
      // screenOptions={() => ({
      //   headerShown: false,
      // })}
    >
      <VStack.Screen name={ROUTERS.VIDEO_REGIONS} component={RegionsView} />
      <VStack.Screen
        name={ROUTERS.VIDEO_SITES}
        component={SitesView}
        options={{headerLeft: () => {}}}
      />
      <VStack.Screen name={ROUTERS.VIDEO_NVRS} component={NVRsView} />
      <VStack.Screen name={ROUTERS.VIDEO_CHANNELS} component={ChannelsView} />
      <VStack.Screen
        name={ROUTERS.VIDEO_CHANNELS_SETTING}
        component={ChannelsSettingView}
      />
      <VStack.Screen
        name={ROUTERS.VIDEO_PLAYER}
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
    </VStack.Navigator>
  );
}
