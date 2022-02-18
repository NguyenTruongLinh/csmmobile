import React from 'react';
import {Provider} from 'mobx-react';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
// import {ModalPortal} from 'react-native-modals';

import appStore from './stores/appStore';
import userStore from './stores/user';
import videoStore from './stores/video';
import alarmStore from './stores/alarm';
import exceptionStore from './stores/smarter';
import oamStore from './stores/oam';
import sitesStore from './stores/sites';
import healthStore from './stores/health';
import App from './app';
import NotificationController from './notification/notificationController';
import {Platform} from 'react-native';

const Main = () => {
  // console.log('GOND userStore: ', userStore);
  let naviCheckInterval = null;
  PushNotification.configure({
    requestPermissions: true,
    onNotification: notification => {
      __DEV__ && console.log('GOND onNotification evt: ', notification);
      const {userInteraction} = notification;
      if (userInteraction) {
        __DEV__ &&
          console.log(
            'GOND PN onNotification interation: ',
            appStore.naviService
          );
        naviCheckInterval = setInterval(() => {
          if (appStore.naviService.isReadyForPushShowing && naviCheckInterval) {
            clearInterval(naviCheckInterval);
            naviCheckInterval = null;
            NotificationController.onNotificationOpened({
              appStore,
              alarmStore,
              userStore,
              exceptionStore,
              oamStore,
              sitesStore,
              healthStore,
              message: notification,
              debug: 'onNotification',
            });
          }
        }, 500);
      }
    },
  });
  if (Platform.OS === 'ios') {
    let naviCheckIntervalInitialForIOS = null;
    PushNotification.popInitialNotification(notification => {
      console.log('Initial Notification', notification);
      // NotificationController.notification = JSON.stringify(notification);
      // const {userInteraction} = notification;
      // if (userInteraction) {
      // }
      // __DEV__ &&
      //   console.log('GOND PN onNotification interation: ', appStore.naviService);
      naviCheckIntervalInitialForIOS = setInterval(() => {
        if (
          appStore.naviService.isReadyForPushShowing &&
          naviCheckIntervalInitialForIOS
        ) {
          clearInterval(naviCheckIntervalInitialForIOS);
          naviCheckIntervalInitialForIOS = null;
          NotificationController.onNotificationOpened({
            appStore,
            alarmStore,
            userStore,
            exceptionStore,
            oamStore,
            sitesStore,
            healthStore,
            message: notification,
            debug: 'popInitialNotification',
          });
        }
      }, 500);
    });
  }
  return (
    <Provider
      appStore={appStore}
      userStore={userStore}
      sitesStore={sitesStore}
      videoStore={videoStore}
      alarmStore={alarmStore}
      exceptionStore={exceptionStore}
      healthStore={healthStore}
      oamStore={oamStore}>
      <App />
      {/* <ModalPortal /> */}
    </Provider>
  );
};
// <!-- END CONSTS -->
// ----------------------------------------------------

export default Main;
