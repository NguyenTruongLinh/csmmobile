import React from 'react';

import messaging from '@react-native-firebase/messaging';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';

import {inject, observer} from 'mobx-react';

import {NOTIFY_TYPE} from '../consts/misc';

const CHANNEL_ID = 'commonCMS';

class NotificationController extends React.Component {
  constructor(props) {
    super(props);
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
      },
      created =>
        console.log('GOND Push notificaiton createChannel returned ', created)
    );
    this.createNotificationListeners();
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
      const [fcmToken, apnsToken] = await Promise.all([
        messaging().getToken(),
        messaging().getAPNSToken(),
      ]);
      if (fcmToken) {
        // user has a device token
        userStore.saveToken(fcmToken, apnsToken);
      }
    }
  };

  createNotificationListeners = async () => {
    // This listener triggered when notification has been received in foreground
    messaging().onMessage(notification => {
      const {data} = notification;
      __DEV__ && console.log('GOND Receveived notification: ', notification);
      this.onNotificationReceived(data);
    });

    messaging().setBackgroundMessageHandler(notification => {
      __DEV__ &&
        console.log('GOND Receveived background notification: ', notification);
      const {data} = notification;
      this.onNotificationReceived(data);
    });

    // This listener triggered when app is in backgound and we click, tapped and opened notifiaction
    messaging().onNotificationOpenedApp(remoteMessage => {
      __DEV__ &&
        console.log(
          'GOND on open notification from background:',
          remoteMessage
        );
      this.onNotificationOpened(remoteMessage.notification);
    });

    // This listener triggered when app is closed and we click,tapped and opened notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'GOND on open notification from closed state:',
            remoteMessage.notification
          );
          // setInitialRoute(remoteMessage.data.type); // e.g. "Settings"
          this.onNotificationOpened(remoteMessage.notification);
        }
      });
  };

  validate = data => {
    const {userStore} = this.props;
    return !userStore.fcm.serverId || data.serverId == userStore.fcm.serverId;
  };

  displayLocalNotification = ({id, title, body, messageId, data}) => {
    PushNotification.localNotification({
      channelId: CHANNEL_ID,
      // category: CHANNEL_ID,
      id: id,
      vibration: 500,
      title: title,
      message: body,
      messageId: messageId,
      userInfo: data,
      // for android:
      // largeIcon: 'noti_icon',
      // smallIcon: 'noti_icon',
    });
  };

  onNotificationReceived = async message => {
    __DEV__ && console.log('GOND Receveived notification: ', data);
    if (!this.validate(data)) {
      __DEV__ && console.log('GOND notification is not valid: ', data);
      return;
    }
    const {data, messageId} = message;
    let {type, action, content} = data;
    if (!content && data.data) content = data.data;

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
        // notif = onAlarmEvent(dispatch, action, content);
        break;
      case NOTIFY_TYPE.EXCEPTION:
        // notif = onExceptionEvent(dispatch, action, content);
        break;
      case NOTIFY_TYPE.STREAMING:
        // onVideoEvent(action, content);
        break;
      case NOTIFY_TYPE.PVM:
        // notif = onPVMEvent(dispatch,action, content);
        break;
    }

    const enabled = await messaging().hasPermission();
    if (enabled && notif) {
      this.displayLocalNotification({...notif, messageId, id: data.msg_id});
    }
  };

  onNotificationOpened(data) {}

  render() {
    return null;
  }
}

export default inject('appStore', 'userStore')(NotificationController);
