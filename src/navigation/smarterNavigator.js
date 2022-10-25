import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import BackButton from '../components/controls/BackButton';

import DashboardView from '../views/smarter/summary';
import ExceptionsView from '../views/smarter/transactions';
import TransactionDetailView from '../views/smarter/transactionDetail';
import TransactionFCMView from '../views/smarter/transactionDetailFCM';

import VideoPlayerView from '../views/video/player';

import ROUTERS, {getHeaderTitle} from '../consts/routes';
import variables from '../styles/variables';
import CMSColors from '../styles/cmscolors';

const PStack = createStackNavigator();

export default function SmartERStack() {
  return (
    <PStack.Navigator
      initialRouteName={ROUTERS.SMARTER_DASHBOARD}
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
      <PStack.Screen
        name={ROUTERS.SMARTER_DASHBOARD}
        component={DashboardView}
      />
      <PStack.Screen name={ROUTERS.TRANSACTIONS} component={ExceptionsView} />
      <PStack.Screen
        name={ROUTERS.TRANS_DETAIL}
        component={TransactionDetailView}
      />
      <PStack.Screen
        name={ROUTERS.TRANS_DETAIL_FCM}
        component={TransactionFCMView}
      />
      <PStack.Screen
        name={ROUTERS.TRANS_VIDEO}
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
    </PStack.Navigator>
  );
}
