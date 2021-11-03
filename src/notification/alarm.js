import {
  NOTIFY_ACTION,
  // AlertTypes,
  AlertType_Support,
  AlertNames,
} from '../consts/misc';
import {parseAlarmData} from '../stores/alarm';
import ROUTERS from '../consts/routes';

import {generateNotifId} from '../util/general';

export function onAlarmEvent(alarmStore, navigator, action, content) {
  const alert = content;
  // try {
  //   alert = JSON.parse(content);
  // } catch (ex) {
  //   __DEV__ &&
  //     console.log('GOND Parse alarm notification content failed: ', ex);
  // }
  if (!alert) return;

  let noti = null;
  const currentRoute = navigator ? navigator.getCurrentRouteName() : '';

  switch (action) {
    case NOTIFY_ACTION.ADD:
      if (currentRoute == ROUTERS.ALARM_LIVE) {
        // reloadAlarms(dispatch);
        alarmStore && alarmStore.getAlarms({aty: AlertType_Support});
      } else {
        let strAlertType = String(alert.KAlertType);
        const msg = AlertNames[strAlertType]
          ? AlertNames[strAlertType]
          : 'Unknow alert, id = ' + strAlertType;
        noti = {
          id: generateNotifId(msg, alert.KAlertEvent ?? 0),
          body: (alert.SiteName ?? 'Unknown site') + msg,
          isContent: true,
        };
      }
      break;
    case NOTIFY_ACTION.NEWIMAGE:
      // if (currentRoute == ROUTERS.ALARM_DETAIL) {
      alarmStore && alarmStore.onNewSnapshot(alert);
      // }
      break;
    case NOTIFY_ACTION.EDIT:
      break;
    case NOTIFY_ACTION.DELETE:
      break;
    case NOTIFY_ACTION.REFRESH:
      if (currentRoute == ROUTERS.ALARM_LIVE) {
        __DEV__ && console.log('GOND Parse alarm notification refresh...');
        alarmStore && alarmStore.getAlarms({aty: AlertType_Support});
      } // else {
      //   // TEST
      //   let strAlertType = String(alert.KAlertType);
      //   const msg = AlertNames[strAlertType]
      //     ? AlertNames[strAlertType]
      //     : 'Unknow alert, id = ' + strAlertType;
      //   noti = {
      //     id: generateNotifId(msg, alert.KAlertEvent ?? 0),
      //     body: (alert.SiteName ?? 'Unknown site') + msg,
      //     isContent: true,
      //   };
      // }
      break;
  }

  if (noti && noti != {}) {
    noti.title = 'CMS Alarms.';
  }

  return noti;
}

export async function onOpenAlarmEvent(alarmStore, navigator, action, content) {
  try {
    const alarm = typeof content === 'object' ? content : JSON.parse(content);
    if (!alarm) return;
    const currentRoute = navigator.getCurrentRouteName();
    console.log('GOND onOpenAlarmEvent content: ', content);

    switch (action) {
      case NOTIFY_ACTION.NVR_STATUS:
        return;
      case NOTIFY_ACTION.EDIT:
      case NOTIFY_ACTION.REFRESH:
      case NOTIFY_ACTION.ADD:
        // TODO: navigate to Alarm live screen
        console.log('GOND onOpenAlarmEvent add');
        await alarmStore.getAlarms({aty: AlertType_Support});
        const alarmData = parseAlarmData(alarm);
        const params = alarmStore.selectAlarm(alarmData)
          ? {screen: ROUTERS.ALARM_DETAIL, initial: false}
          : undefined;
        console.log('GOND onOpenAlarmEvent navigate ', alarm, ', ', params);
        navigator.navigate(ROUTERS.ALARM_STACK, params);
        return;
      case NOTIFY_ACTION.DELETE:
        return null;
      default:
        if (!currentRoute.includes(ROUTERS.OPTIONS)) {
          // TODO: navigate to Settings screen
          navigator.navigate(ROUTERS.OPTIONS_NAVIGATOR);
        }
    }
  } catch (ex) {
    __DEV__ && console.log('GOND onOpenAlarmEvent parse content error: ', ex);
  }
}
