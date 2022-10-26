import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';

import CMSTabbar from './tabbar';

import CMSIntroView from '../views/intro/cmsIntro';
import LoginView from '../views/auth/login';
import ForgotPasswordView from '../views/auth/forgotPassword';
import SubmitedView from '../views/auth/submited';
import I3HostLogin from '../views/auth/i3HostLogin';
import OTPVerification from '../views/auth/otpVerification';

import AccountLocked from '../views/auth/accountLocked';
import passwordExpired from '../views/auth/passwordExpired';

import VideoStack from './videoNavigator';
import SettingsStack from './settingsNavigator';
import AlarmStack from './alarmNavigator';
import HomeStack from './homeNavigator';

import LoadingOverlay from '../components/common/loadingOverlay';
import BackButton from '../components/controls/BackButton';
import GlobalModal from '../components/views/GlobalModal';

import theme from '../styles/appearance';
import ROUTERS from '../consts/routes';

const BottomTab = createBottomTabNavigator();
const IntroStack = createStackNavigator();
const WelcomeStack = createStackNavigator();

/**
 *
 * @param {bool} showIntro
 * @param {bool} isLoggedIn
 * @returns ReactElement
 */
const AppNavigator = ({isLoggedIn, appStore, notificationController}) => {
  const {showIntro, isLoading, naviService, appearance} = appStore;

  const renderContentNavigator = () => {
    if (isLoading) {
      return <LoadingOverlay />;
    }

    if (showIntro) {
      return (
        <IntroStack.Navigator
          initialRouteName={ROUTERS.INTRO_CMS}
          headerMode="none">
          <IntroStack.Screen
            name={ROUTERS.INTRO_CMS}
            component={CMSIntroView}
          />
        </IntroStack.Navigator>
      );
    }

    if (isLoggedIn) {
      return (
        <BottomTab.Navigator
          initialRouteName={ROUTERS.HOME_NAVIGATOR}
          headerMode="none"
          backBehavior="none"
          sceneContainerStyle={{
            flex: 1,
            backgroundColor: 'white',
          }}
          screenOptions={{unmountOnBlur: true}}
          tabBar={props => <CMSTabbar {...props} />}>
          <BottomTab.Screen
            name={ROUTERS.HOME_NAVIGATOR}
            component={HomeStack}
          />
          <BottomTab.Screen name={ROUTERS.VIDEO_STACK} component={VideoStack} />
          <BottomTab.Screen name={ROUTERS.ALARM_STACK} component={AlarmStack} />
          <BottomTab.Screen
            name={ROUTERS.OPTIONS_NAVIGATOR}
            component={SettingsStack}
          />
        </BottomTab.Navigator>
      );
    }

    return (
      <WelcomeStack.Navigator
        initialRouteName={ROUTERS.LOGIN}
        headerMode="screen">
        <WelcomeStack.Screen
          options={() => ({
            headerStyle: {
              height: 0,
            },
            headerMode: 'none',
            headerTitle: '',
          })}
          name={ROUTERS.LOGIN}
          component={LoginView}
        />

        <WelcomeStack.Screen
          options={() => ({
            headerStyle: {
              height: 0,
            },
            headerMode: 'none',
            headerTitle: '',
          })}
          name={ROUTERS.PASSWORD_EXPIRED}
          component={passwordExpired}
        />
        <WelcomeStack.Screen
          options={() => ({
            headerStyle: {
              height: 0,
            },
            headerMode: 'none',
            headerTitle: '',
          })}
          name={ROUTERS.ACCOUNT_LOCKED}
          component={AccountLocked}
        />
        <WelcomeStack.Screen
          options={() => ({
            headerShown: false,
            headerStyle: {
              height: 0,
            },
            headerMode: 'none',
            headerTitle: '',
          })}
          name={ROUTERS.SUBMITED}
          component={SubmitedView}
        />
        <WelcomeStack.Screen
          options={({navigation}) => ({
            headerMode: 'screen',
            headerTitle: '',
            headerStyle: {
              ...theme[appearance].container,
            },
            headerLeft: () => <BackButton navigator={navigation} />,
          })}
          name={ROUTERS.FORGOT_PASSWORD}
          component={ForgotPasswordView}
        />

        <WelcomeStack.Screen
          options={() => ({
            headerMode: 'screen',
            headerTitle: '',
          })}
          name={ROUTERS.I3_HOST_LOGIN}
          component={I3HostLogin}
        />
        <WelcomeStack.Screen
          options={() => ({
            headerMode: 'screen',
            headerTitle: '',
          })}
          name={ROUTERS.OTP_VERIFICATION}
          component={OTPVerification}
        />
      </WelcomeStack.Navigator>
    );
  };

  return (
    <NavigationContainer
      ref={ref => {
        appStore.setNavigator(ref);
      }}
      onReady={() => {
        __DEV__ && console.log('GOND NavigationContainer onReady!!!!!');
        naviService && naviService.onReady(true);
      }}
      onStateChange={state => {
        naviService && naviService.onStateChange(state);
      }}>
      {isLoggedIn && notificationController}
      <GlobalModal ref={r => appStore.setModalRef(r)} />
      {renderContentNavigator()}
    </NavigationContainer>
  );
};
// };

export default AppNavigator;
