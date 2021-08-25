import React from 'react';
import {Platform} from 'react-native';
import {inject, observer} from 'mobx-react';
import {useRoute} from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification, {Importance} from 'react-native-push-notification';

import {onVideoNotifEvent} from './video';
import {onAlarmEvent, onOpenAlarmEvent} from './alarm';
import {NOTIFY_TYPE} from '../consts/misc';

const CHANNEL_ID = 'CMS_Channel';

class NotificationController extends React.Component {
  constructor(props) {
    super(props);

    this.unsubscribeForegroundListioner = null;
    this.lastMsgTime = '';
    this.lastMsgId = '';
  }

  async componentDidMount() {
    console.log('GOND Notification controller did mount');
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
  }

  componentWillUnmount() {
    if (this.unsubscribeForegroundListioner) {
      // unsubscribe
      this.unsubscribeForegroundListioner();
    }
  }

  checkPermission = async () => {
    let enabled = await messaging().hasPermission();
    console.log('GOND checkPermission notif:', enabled);
    // If Premission granted proceed towards token fetch
    if (enabled) {
      this.getToken();
    } else {
      // If permission hasn’t been granted to our app, request user in requestPermission method.
      enabled = await this.requestPermission();
    }
    return enabled;
  };

  requestPermission = async () => {
    const authStatus = await messaging().requestPermission();
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
    const {appStore, alarmStore, videoStore, userStore} = this.props;

    messaging().onTokenRefresh(newToken => {
      __DEV__ && console.log('GOND FCM Token has been refreshed: ', newToken);
      if (newToken) {
        userStore.saveToken(fcmToken);
      }
    });

    // This listener triggered when notification has been received in foreground
    this.unsubscribeForegroundListioner = messaging().onMessage(
      notification => {
        // __DEV__ && console.log('GOND Receveived notification: ', notification);
        NotificationController.onNotificationReceived({
          appStore,
          alarmStore,
          videoStore,
          userStore,
          message: notification,
        });
      }
    );

    messaging().setBackgroundMessageHandler(async notification => {
      __DEV__ &&
        console.log('GOND Receveived background notification: ', notification);
      NotificationController.onNotificationReceived({
        appStore,
        alarmStore,
        videoStore,
        userStore,
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
        appStore,
        alarmStore,
        videoStore,
        userStore,
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
            appStore,
            alarmStore,
            videoStore,
            userStore,
            message: remoteMessage.notification,
          });
        }
      });

    /*
    notifee.onForegroundEvent(({type, detail}) => {
      if (type == EventType.PRESS) {
        this.onNotificationOpened(detail.notification);
      }
    });

    notifee.onBackgroundEvent(async ({type, detail}) => {
      __DEV__ &&
        console.log(
          'GOND Receveived background notification event: ',
          type,
          detail
        );
      switch (type) {
        case EventType.PRESS:
          this.onNotificationOpened(detail.notification);
          break;
      }
    });

    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      __DEV__ &&
        console.log(
          'GOND notifee on open notification from closed state:',
          initialNotification
        );
      this.onNotificationOpened(initialNotification.notification);
    }
    */
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

  static displayLocalNotification = ({id, title, body, messageId, data}) => {
    let idNumber = typeof id == 'number' ? id : parseInt(id, 16);
    idNumber = isNaN(idNumber) ? undefined : idNumber;
    if (idNumber) PushNotification.cancelLocalNotification({idNumber});

    const notificationRequest = {
      id: idNumber,
      vibration: 500,
      title: title,
      message: /*Platform.OS == 'android' ? encodeURI(body) :*/ body,
      messageId: messageId,
      userInfo: data,
      invokeApp: true,
      // for android:
      channelId: CHANNEL_ID,
      largeIcon: 'noti_icon',
      smallIcon: 'noti_icon',
      // for iOS:
      category: CHANNEL_ID,
    };
    console.log('GOND displayLocalNotification: ', notificationRequest);

    // Platform.OS === 'ios'
    // ? PushNotificationIOS.addNotificationRequest(notificationRequest) :
    PushNotification.presentLocalNotification(notificationRequest);

    /*
    const strId = typeof id == 'string' ? id : String(id);
    if (strId) notifee.cancelNotification(strId);
    console.log('GOND displayLocalNotification: ', data);

    notifee.displayNotification({
      id: strId,
      title,
      body,
      data: {
        ...data,
        content:
          typeof data.content == 'object'
            ? JSON.stringify(data.content)
            : data.content,
      },
      android: {
        channelId: CHANNEL_ID,
        largeIcon: 'noti_icon',
        smallIcon: 'noti_icon',
        pressAction: {
          id: 'default',
        },
      },
    });
    */
  };

  static onNotificationReceived = async ({
    videoStore,
    alarmStore,
    appStore,
    message,
    shouldValidate,
  }) => {
    const {data, messageId} = message;
    // const {videoStore, alarmStore, appStore} = this.props;
    const naviService = appStore ? appStore.naviService : null;

    __DEV__ && console.log('GOND onNotificationReceived: ', data);
    if (shouldValidate && !this.validate(data)) {
      __DEV__ && console.log('GOND notification is not valid: ', data);
      return;
    }
    let {type, action, content} = data;
    if (!content && data.data) content = data.data;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (ex) {
        __DEV__ &&
          console.log('GOND Parse notification content failed: ', content);
      }
    }

    let notif = null;
    switch (type) {
      case NOTIFY_TYPE.SITE:
        // notif = onSiteEvent(dispatch, action, content);
        break;
      case NOTIFY_TYPE.DVR:
        notif = {
          title: 'DVR configuration.',
          body: 'DVR: ' + content.Name + ' has changed.',
        };
        break;
      case NOTIFY_TYPE.USER:
        // notif = onUserEvent(dispatch, action, content);
        break;
      case NOTIFY_TYPE.ALERT_TYPE:
        // notif = onAlertSetting(dispatch, action, content);
        break;
      case NOTIFY_TYPE.ALERT:
        // notif = onAlertEvent(dispatch, action, content);
        break;
      case NOTIFY_TYPE.ALARM:
        notif = onAlarmEvent(alarmStore, naviService, action, content);
        break;
      case NOTIFY_TYPE.EXCEPTION:
        // notif = onExceptionEvent(dispatch, action, content);
        break;
      case NOTIFY_TYPE.STREAMING:
        onVideoNotifEvent(videoStore, action, content);
        break;
      case NOTIFY_TYPE.PVM:
        // notif = onPVMEvent(dispatch,action, content);
        break;
    }

    const enabled = await messaging().hasPermission();
    if (enabled && notif) {
      NotificationController.displayLocalNotification({
        ...notif,
        messageId,
        id: data.msg_id,
        data: {type, action, content},
      });
    }
  };

  static onNotificationOpened = ({
    // videoStore,
    alarmStore,
    appStore,
    message,
  }) => {
    __DEV__ && console.log('GOND onNotificationOpened message = ', message);
    const {naviService} = appStore ?? {};
    if (!message || (!message.content && !message.data)) {
      console.log('GOND OnOpenNotifyHandler message content not exist');
      return;
    }

    let msgData = message.content ?? message.data;
    msgData = typeof msgData === 'object' ? msgData : JSON.parse(msgData);
    let {type, action, content} = msgData;
    __DEV__ && console.log('GOND onNotificationOpened content = ', content);
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
        // onOpenOnUserEvent(dispatch,action, content, noti_disable);
        break;
      case NOTIFY_TYPE.ALERT_TYPE:
        // onOpenAlertSetting( dispatch,action, content, noti_disable);
        break;
      case NOTIFY_TYPE.ALERT:
        // onOpenAlertEvent( dispatch,action, content, noti_disable);
        break;
      case NOTIFY_TYPE.ALARM:
        onOpenAlarmEvent(alarmStore, naviService, action, content);
        break;
      case NOTIFY_TYPE.EXCEPTION:
        // onOpenExceptionEvent( dispatch,action, content, noti_disable);
        break;
      case NOTIFY_TYPE.PVM:
        // onOpenPVMPushNotification( dispatch, action, content, noti_disable);
        break;
      default:
        __DEV__ &&
          console.log(
            'GOND OnOpenNotifyHandler type is not valid: ',
            msgData,
            msgData
          );
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
  'alarmStore'
)(
  observer(NotificationController)
  // observer(props => {
  //   const route = useRoute();
  //   return <NotificationController {...props} route={route} />;
  // })
);
