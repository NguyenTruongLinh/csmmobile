import React from 'react';
import {View} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import {inject, observer} from 'mobx-react';
import BackButton from '../components/controls/BackButton';

import AlarmsLiveView from '../views/alarms/live';
import AlarmsSearchView from '../views/alarms/search';
import AlarmDetailView from '../views/alarms/detail';
import VideoPlayerView from '../views/video/player';

import ROUTERS, {getHeaderTitle} from '../consts/routes';
import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';
import theme from '../styles/appearance';

const AStack = createStackNavigator();

function AlarmStack(props) {
  const {appStore} = props;
  const {appearance} = appStore;

  return (
    <View style={[{flex: 1}, theme[appearance].container]}>
      <AStack.Navigator
        initialRouteName={ROUTERS.ALARM_LIVE} // {ROUTERS.ALARM_LIVE}
        headerMode="screen"
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
          cardOverlayEnabled: true,
          cardOverlay: () => (
            <View
              style={{
                flex: 1,
                backgroundColor: theme[appearance].container.backgroundColor,
              }}
            />
          ),
        })}>
        <AStack.Screen
          name={ROUTERS.ALARM_LIVE}
          component={AlarmsLiveView}
          options={({route, navigation}) => ({
            headerLeft: () => {},
          })}
        />
        <AStack.Screen
          name={ROUTERS.ALARM_SEARCH}
          component={AlarmsSearchView}
        />
        <AStack.Screen
          name={ROUTERS.ALARM_DETAIL}
          component={AlarmDetailView}
        />
        <AStack.Screen
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
      </AStack.Navigator>
    </View>
  );
}

export default inject('appStore')(observer(AlarmStack));
