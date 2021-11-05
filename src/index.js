import React from 'react';
import {Provider} from 'mobx-react';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
// import {ModalPortal} from 'react-native-modals';

import appStore from './stores/appStore';
import userStore from './stores/user';
import videoStore from './stores/video';
import alarmStore from './stores/alarm';
import posStore from './stores/pos';
import oamStore from './stores/oam';
import sitesStore from './stores/sites';
import healthStore from './stores/health';
import App from './app';
import NotificationController from './notification/notificationController';

const Main = () => {
  // console.log('GOND userStore: ', userStore);
  let naviCheckInterval = null;
  PushNotification.configure({
    requestPermissions: true,
    onNotification: notification => {
      __DEV__ && console.log('GOND PN onNotification evt: ', notification);
      const {userInteraction} = notification;
      if (userInteraction) {
        __DEV__ &&
          console.log(
            'GOND PN onNotification interation: ',
            appStore.naviService
          );
        naviCheckInterval = setInterval(() => {
          if (appStore.naviService.isReady && naviCheckInterval) {
            clearInterval(naviCheckInterval);
            naviCheckInterval = null;
            NotificationController.onNotificationOpened({
              appStore,
              alarmStore,
              userStore,
              posStore,
              oamStore,
              sitesStore,
              healthStore,
              message: notification,
            });
          }
        }, 500);
      }
    },
  });

  return (
    <Provider
      appStore={appStore}
      userStore={userStore}
      sitesStore={sitesStore}
      videoStore={videoStore}
      alarmStore={alarmStore}
      posStore={posStore}
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
