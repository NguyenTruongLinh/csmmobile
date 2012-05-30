import React from 'react';
import {View} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import BackButton from '../components/controls/BackButton';
import Ripple from 'react-native-material-ripple';
import CMSTouchableIcon from '../components/containers/CMSTouchableIcon';

import AlarmsLiveView from '../views/alarms/live';
import AlarmsSearchView from '../views/alarms/search';
import AlarmDetailView from '../views/alarms/detail';

import ROUTERS, {getHeaderTitle} from '../consts/routes';
import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';

const AStack = createStackNavigator();

export default function AlarmStack() {
  return (
    <AStack.Navigator
      initialRouteName={ROUTERS.ALARM_SEARCH} // {ROUTERS.ALARM_LIVE}
      headerMode="screen"
      screenOptions={({route, navigation}) => ({
        headerStyle: {
          borderBottomWidth: 1,
        },
        headerStatusBarHeight: variables.StatusBarHeight,
        headerTitleAlign: 'center',
        headerMode: 'screen',
        headerTitle: getHeaderTitle(route),
        headerLeft: () => <BackButton navigator={navigation} />,
      })}>
      <AStack.Screen
        name={ROUTERS.ALARM_LIVE}
        component={AlarmsLiveView}
        options={({route, navigation}) => ({
          headerLeft: () => {},
          headerRight: () => (
            <Ripple
              rippleCentered={true}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginRight: 10,
                marginTop: 14,
                alignItems: 'center',
              }}
              onPress={() => navigation.push(ROUTERS.ALARM_SEARCH)}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 5,
                }}>
                <CMSTouchableIcon
                  size={20}
                  color="black"
                  styles={{position: 'relative', paddingBottom: 14}}
                  iconCustom="filter" //TODO
                />
              </View>
            </Ripple>
          ),
        })}
      />
      <AStack.Screen name={ROUTERS.ALARM_SEARCH} component={AlarmsSearchView} />
      <AStack.Screen name={ROUTERS.ALARM_DETAIL} component={AlarmDetailView} />
    </AStack.Navigator>
  );
}
