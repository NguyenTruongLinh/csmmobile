/**
 * @format
 */
import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';

import App, {onNotificationReceived} from './src/index';
import {name as appName} from './app.json';
// import NotificationController from './src/notification/notificationController';

messaging().setBackgroundMessageHandler(async notification => {
  __DEV__ &&
    console.log('GOND PN Receveived background - app closed: ', notification);
  onNotificationReceived(notification);
});

AppRegistry.registerComponent(appName, () => App);
