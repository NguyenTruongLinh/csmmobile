import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import BackButton from '../components/controls/BackButton';

import SettingsView from '../views/settings/settings';
import ProfileView from '../views/settings/profile';
import AboutViews from '../views/settings/about';
import NotifySettingView from '../views/settings/notify';
import VideoSettingView from '../views/settings/video';

import variables from '../styles/variables';
import ROUTERS, {getHeaderTitle} from '../consts/routes';

const OPStack = createStackNavigator();

// export default SettingsStack = () => (
export default function SettingsStack() {
  return (
    <OPStack.Navigator
      initialRouteName={ROUTERS.OPTIONS}
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
      <OPStack.Screen
        name={ROUTERS.OPTIONS}
        component={SettingsView}
        options={{headerLeft: () => {}}}
      />
      <OPStack.Screen name={ROUTERS.OPTIONS_PROFILE} component={ProfileView} />
      <OPStack.Screen name={ROUTERS.OPTIONS_ABOUT} component={AboutViews} />
      <OPStack.Screen
        name={ROUTERS.OPTIONS_NOTIFY}
        component={NotifySettingView}
      />
      <OPStack.Screen
        name={ROUTERS.OPTIONS_VIDEO}
        component={VideoSettingView}
      />
    </OPStack.Navigator>
  );
}
