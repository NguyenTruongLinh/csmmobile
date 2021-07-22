import React from 'react';
import {Platform} from 'react-native';
import {inject, observer} from 'mobx-react';
import messaging from '@react-native-firebase/messaging';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';

import {onVideoNotifEvent} from './video';
import {NOTIFY_TYPE} from '../consts/misc';

const CHANNEL_ID = 'commonCMS';

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
        this.onNotificationReceived(notification);
      }
    );

    messaging().setBackgroundMessageHandler(notification => {
      __DEV__ &&
        console.log('GOND Receveived background notification: ', notification);
      this.onNotificationReceived(notification);
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
    __DEV__ && console.log('GOND NotifController validate: ', userStore.fcm);
    if (!userStore.fcm) {
      __DEV__ && console.log('GOND fcm not initialized yet ', userStore);
    }
    if (userStore.fcm.serverId && data.serverid != userStore.fcm.serverId)
      return false;
    if (data.msg_id === this.lastMsgId && data.msg_time === this.lastMsgTime)
      return false;
    this.lastMsgId = data.msg_id;
    this.lastMsgTime = data.lastMsgTime;
    return true;
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
    const {data, messageId} = message;
    const {videoStore} = this.props;

    __DEV__ && console.log('GOND onNotificationReceived: ', data);
    if (!this.validate(data)) {
      __DEV__ && console.log('GOND notification is not valid: ', data);
      return;
    }
    let {type, action, content} = data;
    if (!content && data.data) content = data.data;
    if (typeof content === 'string') content = JSON.parse(content);

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
        onVideoNotifEvent(videoStore, action, content);
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

export default inject('userStore', 'videoStore')(NotificationController);
