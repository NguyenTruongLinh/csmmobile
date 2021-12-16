import PushNotification from 'react-native-push-notification';
import {NOTIFY_ACTION} from '../consts/misc';
import ROUTERS from '../consts/routes';

import ProfileView from '../views/settings/profile';
import notificationController from './notificationController';

function refreshUserAsync(userStore) {
  // let user = GetStore('user'); //store.getState().user;
  // userStore(RefreshUser(user.Api, user));
  // userStore(ActionHome(user.Api, user));
}

function logOut(userStore) {
  // let user = GetStore('user'); //store.getState().user.Api;
  // let config = GetStore('config'); // store.getState().config;
  // userStore(logOut(user.Api, config.deviceid, config));
}

function loadProfileAsync(userStore) {
  // let user = GetStore('user'); //store.getState().user;
  // userStore(LoadProfile(user.Api, user));
}

function getDisplayName(userStore) {
  let user = userStore && userStore.user;
  if (!user) {
    return 'User profile';
  }
  let {firstName, lastName} = user;
  if (!firstName && !lastName) return 'User profile';
  if (firstName && lastName) return (firstName + ' ' + lastName).trim();
  if (firstName && !lastName) return firstName;
  if (!firstName && lastName) return lastName;
}
class CustomVariables {
  static userEventFlag = false;
}

function onUserEvent(notifExtraData, appStore, userStore, action, content) {
  let noti = null;
  let user = getDisplayName(userStore);
  let title = 'CMS User.';
  let isContent = false;
  let logout = false;
  let refresh = false;
  __DEV__ &&
    console.log('onUserEvent', `userStore.user=${userStore && userStore.user}`);
  __DEV__ && console.log('onUserEvent', `content=${JSON.stringify(content)}`);
  switch (action) {
    case NOTIFY_ACTION.REFRESH:
      noti = {
        body: user + ' has updated.',
      };
      refresh = true;
      break;
    case NOTIFY_ACTION.DELETE:
      noti = {
        body: user + ' has deleted.',
      };
      logout = true;
      break;
    case NOTIFY_ACTION.LOG_OUT:
      logout = true;
      noti = {
        body: user + ' has expired.',
      };
      break;
    case NOTIFY_ACTION.PWD_CHANGE:
      logout = true;
      noti = {
        body: user + "'s" + ' login info has changed.',
      };
      break;

    default:
      isContent = true;
      noti = {
        body: user + "'s profile" + ' has changed.',
      };
      break;
  }
  noti.title = title;
  noti.isContent = isContent;
  noti.id = 'user_notify';
  if (logout) {
    PushNotification.removeAllDeliveredNotifications();
    userStore.logout();
  }
  if (refresh && userStore) {
    userStore.refreshUserFromNotif(user, noti, notifExtraData);
    return null;
  }
  return noti;
}

function onOpenUserEvent(appStore, userStore, naviService, action, content) {
  if (action == NOTIFY_ACTION.USER_PERMISSION_REFRESH) {
    appStore.setLoading(true);
    setTimeout(() => {
      appStore.setLoading(false);
    }, 500);
  } else if (action == NOTIFY_ACTION.REFRESH)
    naviService.navigate(ROUTERS.OPTIONS_NAVIGATOR);
}

module.exports = {
  onUserEvent,
  onOpenUserEvent,
  CustomVariables,
};
