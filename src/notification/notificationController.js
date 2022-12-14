import React from 'react';
import {Platform} from 'react-native';
import {inject, observer} from 'mobx-react';
import {useRoute} from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification, {Importance} from 'react-native-push-notification';
import {DateTime} from 'luxon';

import {onVideoNotifEvent} from './video';
import {onAlarmEvent, onOpenAlarmEvent} from './alarm';
import {onPVMEvent, onOpenPVMEvent} from './pvm';
import {onUserEvent, onUserEventAsync, onOpenUserEvent} from './user';
import {onSiteEvent} from './site';
import {
  onAlertEvent,
  onOpenAlertEvent,
  onAlertSetting,
  onOpenAlertSetting,
} from './alert';
import {onExceptionEvent, onOpenExceptionEvent} from './exception';

import {getNotificationsLimit} from '../util/general';

import {NOTIFY_TYPE} from '../consts/misc';

const CHANNEL_ID = 'CMS_Channel';
// const LIMIT = await getNotificationsLimit();

class NotificationController extends React.Component {
  // static notification = 'N/A';

  constructor(props) {
    super(props);

    this.unsubscribeForegroundListioner = null;
    this.lastMsgTime = '';
    this.lastMsgId = '';
  }

  async componentDidMount() {
    // __DEV__ &&
    //   console.log('GOND Notification controller did mount: ', this.props);
    let isAllowed = await this.checkPermission();

    if (!isAllowed) {
      console.log('GOND: Notification is not allowed');
      return;
    }

    PushNotification.createChannel(
      {
        channelId: CHANNEL_ID,
        channelName: 'CMS',
        importance: Importance.HIGH,
      },
      created =>
        console.log('GOND Push notificaiton createChannel returned ', created)
    );
    this.createNotificationListeners();

    // Testing:
    // const {naviService} = this.props.appStore;
    // const this.testItv = setInterval(() => {
    //   console.log(
    //     '### TESTING ### currentRoute: ',
    //     naviService.getCurrentRouteName(),
    //     ', topRoute: ',
    //     naviService.getTopRouteName(),
    //     ', state:',
    //     naviService.state
    //   );
    // }, 2000);
  }

  componentWillUnmount() {
    if (this.unsubscribeForegroundListioner) {
      // unsubscribe
      this.unsubscribeForegroundListioner();
    }

    // this.testItv && clearInterval(this.testItv);
    PushNotificationIOS.removeEventListener('register');
    PushNotificationIOS.removeEventListener('registrationError');
  }

  static resetBadgeCount = async () => {
    // __DEV__ && console.log('GOND on reset badge count ...');
    if (Platform.OS === 'ios') {
      const notifs = await this.getCurrentNotifications();
      __DEV__ && console.log('GOND on reset badge count ...', notifs.length);
      PushNotificationIOS.setApplicationIconBadgeNumber(notifs.length);
    } // else {
    //   PushNotification.setApplicationIconBadgeNumber(0);
    // }
    // PushNotification.getApplicationIconBadgeNumber(
    //   count => __DEV__ && console.log('GOND on reset badge count: ', count)
    // );
  };

  checkPermission = async () => {
    let enabled = await messaging().hasPermission();
    console.log('GOND checkPermission notif:', enabled);
    // If Premission granted proceed towards token fetch
    // if (enabled) {
    //   this.getToken();
    // } else {
    //   // If permission hasn???t been granted to our app, request user in requestPermission method.
    //   enabled = await this.requestPermission();
    // }

    if (!enabled) {
      // If permission hasn???t been granted to our app, request user in requestPermission method.
      enabled = await this.requestPermission();
    }
    enabled && this.getToken();
    return enabled;
  };

  requestPermission = async () => {
    const authStatus = await messaging().requestPermission({badge: true});
    console.log('GOND Authorization status:', authStatus);
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    // if (enabled) {
    //   console.log('GOND Authorization status:', authStatus);
    // }

    return enabled;
  };

  getToken = async () => {
    const {userStore} = this.props;
    if (!userStore.fcm || !userStore.fcm.token) {
      try {
        const [fcmToken, apnsToken] = await Promise.all([
          messaging().getToken(),
          Platform.OS == 'ios' ? messaging().getAPNSToken() : Promise.resolve(),
        ]);
        if (fcmToken) {
          // user has a device token
          userStore.saveToken(fcmToken, apnsToken);
        }
      } catch (err) {
        console.log('GOND Cannot get fcmToken:', err);
      }
    }
  };

  createNotificationListeners = async () => {
    const {appStore, alarmStore, videoStore, userStore, oamStore} = this.props;

    PushNotificationIOS.addEventListener('register', newAPNSToken =>
      userStore.saveToken(undefined, newAPNSToken)
    );

    PushNotificationIOS.addEventListener('registrationError', error =>
      console.log('GOND *** IOS Failed to register for notification: ', error)
    );

    messaging().onTokenRefresh(newToken => {
      __DEV__ && console.log('GOND FCM Token has been refreshed: ', newToken);
      if (newToken) {
        userStore.saveToken(newToken);
      }
    });

    // This listener triggered when notification has been received in foreground
    this.unsubscribeForegroundListioner = messaging().onMessage(
      notification => {
        // __DEV__ && console.log('GOND Received notification: ', notification);
        NotificationController.onNotificationReceived({
          ...this.props,
          message: notification,
        });
      }
    );

    messaging().setBackgroundMessageHandler(async notification => {
      __DEV__ &&
        console.log('GOND Receveived background notification: ', notification);
      NotificationController.onNotificationReceived({
        ...this.props,
        message: notification,
      });
    });

    // This listener triggered when app is in backgound and we click, tapped and opened notifiaction
    messaging().onNotificationOpenedApp(async remoteMessage => {
      __DEV__ &&
        console.log(
          'GOND on open notification from background:',
          remoteMessage
        );
      NotificationController.onNotificationOpened({
        ...this.props,
        message: remoteMessage.notification,
      });
    });

    // This listener triggered when app is closed and we click,tapped and opened notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          __DEV__ &&
            console.log(
              'GOND on open notification from closed state:',
              remoteMessage.notification
            );
          // setInitialRoute(remoteMessage.data.type); // e.g. "Settings"
          NotificationController.onNotificationOpened({
            ...this.props,
            message: remoteMessage.notification,
          });
        }
      });
  };

  validate = data => {
    const {userStore} = this.props;
    // __DEV__ && console.log('GOND NotifController validate: ', userStore.fcm);
    if (!userStore.fcm) {
      __DEV__ && console.log('GOND fcm not initialized yet ', userStore);
      return false;
    }
    if (userStore.fcm.serverId && data.serverid != userStore.fcm.serverId) {
      __DEV__ &&
        console.log(
          'GOND fcm serverid not match :',
          data.serverid,
          ' != ',
          userStore.fcm.serverId
        );
      return false;
    }
    if (data.msg_id === this.lastMsgId && data.msg_time === this.lastMsgTime) {
      __DEV__ && console.log('GOND fcm already handled: ', data);
      return false;
    }
    this.lastMsgId = data.msg_id;
    this.lastMsgTime = data.lastMsgTime;
    return true;
  };

  clearAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };

  static getCurrentNotifications = async () => {
    return new Promise(resolve => {
      PushNotification.getDeliveredNotifications(deliveredNotifs => {
        __DEV__ &&
          console.log('GOND deliveredNotifications: ', deliveredNotifs);
        if (deliveredNotifs == null || deliveredNotifs == undefined)
          return resolve([]);
        if (Array.isArray(deliveredNotifs)) {
          deliveredNotifs.sort((a, b) => (a.postTime ?? 0) - (b.postTime ?? 0));
          return resolve(deliveredNotifs);
        }
        return resolve([deliveredNotifs]);
      });
    });
  };

  static displayLocalNotification = async (
    // appStore,
    {id, title, body, messageId, data}
  ) => {
    let idNumber = typeof id == 'number' ? id : parseInt(id, 16);
    idNumber = isNaN(idNumber) ? undefined : idNumber;
    // if (idNumber) PushNotification.cancelLocalNotification(idNumber);
    const notificationRequest = {
      // id: idNumber,
      vibration: 500,
      title: title,
      message: /*Platform.OS == 'android' ? encodeURI(body) :*/ body,
      messageId: messageId,
      userInfo: Platform.OS == 'ios' ? data : JSON.stringify(data),
      invokeApp: true,
      // number: 1,
      // for android:
      channelId: CHANNEL_ID,
      largeIcon: 'noti_icon',
      smallIcon: 'noti_icon',
      actions: [],
      // for iOS:
      alertAction: 'view',
      category: CHANNEL_ID,
    };
    // __DEV__ &&
    //   console.log('GOND displayLocalNotification: ', notificationRequest);

    // const currentNotifs = await this.getCurrentNotifications();
    if (Platform.OS == 'android') {
      const currentNotifs = await this.getCurrentNotifications();
      const LIMIT = await getNotificationsLimit();
      const dismissCount =
        currentNotifs.length > 0 ? currentNotifs.length - (LIMIT - 1) : 0;

      if (dismissCount > 0) {
        // const oldestNotifs = currentNotifs.reduce((result, notif) => {
        //   if (!result || !notif.postTime || notif.postTime < result.postTime)
        //     return notif;
        //   return result;
        // }, null);
        const oldestNotifIds = currentNotifs.reduce((result, notif, index) => {
          if (index < dismissCount) return [...result, notif.identifier];
          return result;
        }, []);

        __DEV__ && console.log('GOND oldest notif: ', oldestNotifIds);
        PushNotification.removeDeliveredNotifications(oldestNotifIds);
      }
      PushNotification.presentLocalNotification(notificationRequest);
    } else {
      const currentNotifs = await this.getCurrentNotifications();
      __DEV__ &&
        console.log('GOND displayLocalNotification 2: ', currentNotifs);

      PushNotification.localNotification(notificationRequest);
    }
    // Platform.OS === 'ios'
    //   ? PushNotification.localNotification(notificationRequest)
    //   : PushNotification.presentLocalNotification(notificationRequest);

    // if (!appStore || appStore.appState != 'active') {
    PushNotification.getApplicationIconBadgeNumber(badgeCount => {
      __DEV__ && console.log('GOND displayLocalNotification 3: ', badgeCount);
      PushNotification.setApplicationIconBadgeNumber(badgeCount + 1);
    });
    // }
  };

  static onNotificationReceived = async props => {
    const {
      videoStore,
      alarmStore,
      healthStore,
      userStore,
      appStore,
      sitesStore,
      oamStore,
      exceptionStore,
      message,
      shouldValidate,
    } = props;
    const {data, messageId} = message;
    // const {videoStore, alarmStore, appStore} = this.props;

    __DEV__ &&
      console.log(`onNotificationReceived message = `, JSON.stringify(message));

    const naviService = appStore ? appStore.naviService : null;

    if (!userStore.isLoggedIn) {
      console.log(
        'GOND onNotificationReceived: not show notifications if user not logged in yet!',
        data
      );
      return;
    }

    // __DEV__ && console.log('GOND onNotificationReceived: ', data);
    if (shouldValidate && !this.validate(data)) {
      __DEV__ && console.log('GOND notification is not valid: ', data);
      return;
    }
    let {type, action, content, cmd} = data;
    if (!content && data.data) content = data.data;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (ex) {
        __DEV__ &&
          console.log('GOND Parse notification content failed: ', content);
        return;
      }
    }

    let notif = null;
    switch (type) {
      case NOTIFY_TYPE.SITE:
        notif = onSiteEvent(
          sitesStore,
          healthStore,
          oamStore,
          exceptionStore,
          action,
          content
        );
        break;
      case NOTIFY_TYPE.DVR:
        notif = {
          title: 'DVR configuration.',
          body: 'DVR: ' + contentObj.Name + ' has changed.',
        };
        break;
      case NOTIFY_TYPE.USER:
        const notifExtraData = {
          messageId,
          id: data.msg_id,
          data: {type, action, content},
        };
        if (userStore) {
          notif = onUserEvent(
            notifExtraData,
            appStore,
            userStore,
            action,
            content
          );
        } else {
          let notif = await onUserEventAsync(
            notifExtraData,
            appStore,
            userStore,
            action,
            content
          );
          NotificationController.onNotifReady(
            notif,
            messageId,
            data,
            type,
            action,
            content,
            userStore
          );

          // let notifPromise = onUserEventAsync(
          //   notifExtraData,
          //   appStore,
          //   userStore,
          //   action,
          //   content
          // );
          // notifPromise.then(notif =>
          //   NotificationController.onNotifReady(
          //     notif,
          //     messageId,
          //     data,
          //     type,
          //     action,
          //     content,
          //     userStore
          //   )
          // );
          return;
        }
        break;
      case NOTIFY_TYPE.ALERT_TYPE:
        __DEV__ && console.log('GOND ALERT_TYPE content = : ', content);
        let notifPromise = onAlertSetting({...props, action, content});
        __DEV__ && console.log('GOND ALERT_TYPE notif = : ', notifPromise);
        notifPromise.then(notif =>
          NotificationController.onNotifReady(
            notif,
            messageId,
            data,
            type,
            action,
            content,
            userStore
          )
        );
        break;
      case NOTIFY_TYPE.ALERT:
        // __DEV__ && console.log('GOND onAlert Notification: ', props);
        notif = await onAlertEvent({...props, naviService, action, content});
        // __DEV__ && console.log('GOND onAlert notif: ', notif);
        break;
      case NOTIFY_TYPE.ALARM:
        notif = onAlarmEvent({...props, naviService, action, content});
        break;
      case NOTIFY_TYPE.EXCEPTION:
        __DEV__ && console.log('GOND SmartER Notification: ', data);
        notif = onExceptionEvent({exceptionStore, action, content});
        __DEV__ && console.log('GOND onSmartER notif: ', notif);
        break;
      case NOTIFY_TYPE.STREAMING:
        onVideoNotifEvent({videoStore, action, content, cmd});
        break;
      case NOTIFY_TYPE.PVM:
        __DEV__ && console.log('HAI onPVM Notification: content ', content);
        notif = onPVMEvent(oamStore, action, content, cmd);
        break;
    }
    // const enabled = await messaging().hasPermission();
    // if (enabled && notif) {
    //   __DEV__ && console.log('GOND show local notify, content: ', content);
    //   if (Platform.OS === 'ios' && content && typeof content === 'string') {
    //     content = content.replace(/null/g, '""'); // content.split('null').join('');
    //   }
    //   NotificationController.displayLocalNotification({
    //     ...notif,
    //     messageId,
    //     id: data.msg_id,
    //     data: {type, action, content},
    //   });
    //   userStore && userStore.getWidgetCounts();
    // }
    __DEV__ && console.log('GOND pre onNotifReady: ', notif);
    NotificationController.onNotifReady(
      notif,
      messageId,
      data,
      type,
      action,
      content,
      userStore,
      appStore
    );
  };

  static onNotifReady = async (
    notif,
    messageId,
    data,
    type,
    action,
    content,
    userStore
    // appStore
  ) => {
    const enabled = await messaging().hasPermission();
    if (enabled && notif) {
      __DEV__ && console.log('GOND show local notify, content: ', content);
      if (Platform.OS === 'ios' && content) {
        if (typeof content !== 'string') content = JSON.stringify(content);
        content = content.replace(/null/g, '""'); // content.split('null').join('');
      }
      NotificationController.displayLocalNotification(
        // appStore,
        {
          ...notif,
          messageId,
          id: data.msg_id,
          data: {type, action, content}, //content
        }
      );
      userStore && userStore.getWidgetCounts();
    }
  };

  static onNotificationOpened = props => {
    const {
      videoStore,
      alarmStore,
      healthStore,
      userStore,
      appStore,
      oamStore,
      exceptionStore,
      message,
      debug,
    } = props;

    __DEV__ && console.log('GOND onNotificationOpened: ', props);
    __DEV__ && console.log('GOND onNotificationOpened: debug = ', debug);
    const {naviService} = appStore ?? {};
    if (!message || (!message.content && !message.data)) {
      console.log('GOND OnOpenNotifyHandler message content not exist');
      return;
    }

    let msgData = message.content ?? message.data;
    msgData = typeof msgData === 'object' ? msgData : JSON.parse(msgData);
    let {type, action, content} = msgData;
    __DEV__ &&
      console.log(
        'onNotificationOpened',
        `content=${JSON.stringify(content)} | type=${type} | action=${action}`
      );
    content = typeof content === 'object' ? content : JSON.parse(content);
    // __DEV__ && console.log('GOND1 OnOpenNotifyHandler: serverid', serverid, ', is valid: ', isValid(serverid))
    if (!content) {
      __DEV__ &&
        console.log('GOND1 OnOpenNotifyHandler content not found: ', msgData);
      return;
    }
    // const {appStore, alarmStore} = this.props;

    switch (type) {
      case NOTIFY_TYPE.SITE:
        // onOpenSiteEvent(dispatch,action, content, noti_disable);
        break;
      case NOTIFY_TYPE.DVR:
        break;
      case NOTIFY_TYPE.USER:
        onOpenUserEvent(appStore, userStore, naviService, action, content);
        break;
      case NOTIFY_TYPE.ALERT_TYPE:
        onOpenAlertSetting({...props, naviService, action, content});
        break;
      case NOTIFY_TYPE.ALERT:
        onOpenAlertEvent({...props, naviService, action, content});
        break;
      case NOTIFY_TYPE.ALARM:
        onOpenAlarmEvent({alarmStore, naviService, action, content});
        break;
      case NOTIFY_TYPE.EXCEPTION:
        onOpenExceptionEvent({exceptionStore, naviService, action, content});
        // testing only
        // __DEV__ &&
        //   setTimeout(
        //     () =>
        //       NotificationController.displayLocalNotification({
        //         ...message,
        //         body: message.message || 'POS again',
        //         id: DateTime.now().toSeconds(),
        //       }),
        //     1000
        //   );
        break;
      case NOTIFY_TYPE.PVM:
        onOpenPVMEvent(oamStore, naviService, action, content);
        break;
      default:
        __DEV__ &&
          console.log('GOND OnOpenNotifyHandler type is not valid: ', msgData);
        break;
    }
  };

  render() {
    return null;
  }
}

export default inject(
  'appStore',
  'userStore',
  'videoStore',
  'alarmStore',
  'healthStore',
  'sitesStore',
  'oamStore',
  'exceptionStore'
)(
  observer(NotificationController)
  // observer(props => {
  //   const route = useRoute();
  //   return <NotificationController {...props} route={route} />;
  // })
);
