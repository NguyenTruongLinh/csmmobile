// import {CancelNotify} from './utils';
import PushNotification from 'react-native-push-notification';
import {NOTIFY_ACTION} from '../consts/misc';
import ROUTERS from '../consts/routes';

// import {Actions} from 'react-native-router-flux';
// import {GetStore} from '../stores/createStore';
// import {ModuleChange} from '../actions/user';
// import {waitForModuleChanged} from '../util/routing';

function GetAlertServerityString(alertType) {
  switch (alertType) {
    case 1:
      return 'Normal';
    case 2:
      return 'Caution';
    case 3:
      return 'Warning';
    case 4:
      return 'Urgent';
    default:
      console.log('GOND Unknown Serverity type: ', alertType);
      return 'Unknow';
  }
}

function onPVMEvent(oamStore, action, contentObj, cmd) {
  let notif = {};
  let title = 'OAM';
  let notifBodyPrefix =
    'Site ' +
    contentObj.SiteName +
    (contentObj.DVRName ? ' - ' + contentObj.DVRName : '');

  oamStore && oamStore.notifyRefeshFromPN(contentObj);

  if (action === NOTIFY_ACTION.WARNING || action === NOTIFY_ACTION.DIMISS) {
    PushNotification.getDeliveredNotifications(notifications => {
      let outDatedNotifs = [];
      notifications.map(item => {
        if (item.title == 'OAM' && item.body.startsWith(notifBodyPrefix))
          outDatedNotifs.push(item.identifier);
      });
      PushNotification.removeDeliveredNotifications(outDatedNotifs);
    });
  }
  console.log('GOND1 OnPVMEvent: action = ', action);
  switch (action) {
    case NOTIFY_ACTION.REFRESH:
      console.log('GOND1 OnPVMEvent: status update');
      // dispatch(receiveStatusUpdate(contentObj));//TODO
      return null;
    case NOTIFY_ACTION.WARNING:
      // console.log(
      //   'GOND1 OnPVMEvent: WARNING state changed, contentObj: ',
      //   contentObj
      // );

      notif.title = title;
      notif.isContent = true;
      notif.body =
        notifBodyPrefix +
        ' - Above ' +
        (contentObj.AboveCapacity || '?') +
        '% capacity';
      notif.id = 'pvm_notify';
      break;
    case NOTIFY_ACTION.DIMISS:
      console.log('GOND1 OnPVMEvent: alert dismissed');
      notif.title = title;
      notif.isContent = true;
      notif.body =
        notifBodyPrefix +
        ' - ' +
        GetAlertServerityString(contentObj.KAlertType) +
        ' has been acknowledged by ' +
        (contentObj.CMSUser || 'Unknown user');
      notif.id = 'pvm_notify';
      // dispatch(alertDismissed(contentObj));//TODO
      break;
    default:
      console.log(
        'GOND OnPVMEvent: unknow, action: ',
        action,
        ', content: ',
        content
      );
      return null;
  }
  return notif;
}

function onOpenPVMEvent(
  oamStore,
  navigator,
  action,
  content /*, noti_disable*/
) {
  let data = {};
  // try {
  //   data = typeof content === 'object' ? content : JSON.parse(content);
  // } catch (err) {
  //   console.log('GOND OnOpenPVMPushNotification parse data error: ', err);
  // }
  // console.log('GOND OnOpenPVMPushNotification data: ', data)
  switch (action) {
    case NOTIFY_ACTION.WARNING:
    case NOTIFY_ACTION.DIMISS:
      let title =
        content.DVRName && content.SiteName
          ? content.DVRName + ' - ' + content.SiteName
          : content.DVRName + content.SiteName;
      title = title
        .replace('null - ', '')
        .replace(' - null', '')
        .replace('null', '');
      oamStore.setTitle(title);
      oamStore.setKdvr(content.KDVR);
      navigator.navigate(ROUTERS.HOME_NAVIGATOR, {
        screen: ROUTERS.HOME,
        initial: false,
      });
      navigator.navigate(ROUTERS.HOME_NAVIGATOR, {
        screen: ROUTERS.OAM_SITES,
        initial: false,
      });
      navigator.navigate(ROUTERS.HOME_NAVIGATOR, {
        screen: ROUTERS.OAM_DETAIL,
        initial: false,
      });
      break;
    default:
      break;
  }
}
module.exports = {
  onPVMEvent,
  onOpenPVMEvent,
};
