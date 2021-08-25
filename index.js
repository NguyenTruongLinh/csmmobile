/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';

import App from './src/index';
import {name as appName} from './app.json';
import NotificationController from './src/notification/notificationController';

messaging().setBackgroundMessageHandler(async notification => {
  __DEV__ && console.log('GOND PN Receveived background: ', notification);
  NotificationController.onNotificationReceived({
    message: notification,
  });
});

AppRegistry.registerComponent(appName, () => App);
