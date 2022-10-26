import React from 'react';
import {View} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import {inject, observer} from 'mobx-react';

import BackButton from '../components/controls/BackButton';

import RegionsView from '../views/sitetree/regions';
import SitesView from '../views/sitetree/sites';
import NVRsView from '../views/sitetree/nvrs';

import LiveChannelsView from '../views/video/liveChannels';
import ChannelsSettingView from '../views/video/channelsSetting';
import VideoPlayerView from '../views/video/player';

import ROUTERS, {getHeaderTitle} from '../consts/routes';
import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';
import theme from '../styles/appearance';

const VStack = createStackNavigator();

function VideoStack(props) {
  const {appStore} = props;
  const {appearance} = appStore;

  return (
    <View style={[{flex: 1}, theme[appearance].container]}>
      <VStack.Navigator
        initialRouteName={ROUTERS.VIDEO_SITES} // {ROUTERS.VIDEO_REGIONS}
        screenOptions={({route, navigation}) => ({
          headerStyle: {
            ...theme[appearance].container,
            borderBottomWidth: 1,
          },
          headerStatusBarHeight: variables.StatusBarHeight,
          headerTitleAlign: 'center',
          headerMode: 'screen',
          headerTitle: getHeaderTitle(route),
          headerLeft: () => <BackButton navigator={navigation} />,
          headerTitleStyle: {
            ...theme[appearance].text,
          },
        })}>
        <VStack.Screen
          name={ROUTERS.VIDEO_REGIONS}
          component={RegionsView}
          options={{headerLeft: () => null}}
        />
        <VStack.Screen name={ROUTERS.VIDEO_SITES} component={SitesView} />
        <VStack.Screen name={ROUTERS.VIDEO_NVRS} component={NVRsView} />
        <VStack.Screen
          name={ROUTERS.VIDEO_CHANNELS}
          component={LiveChannelsView}
          options={{gestureEnabled: false}}
        />
        <VStack.Screen
          name={ROUTERS.VIDEO_CHANNELS_SETTING}
          component={ChannelsSettingView}
        />
        <VStack.Screen
          name={ROUTERS.VIDEO_PLAYER}
          component={VideoPlayerView}
          options={({navigation}) => ({
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
    </View>
  );
}

export default inject('appStore')(observer(VideoStack));
