import {
  NOTIFY_ACTION,
  // AlertTypes,
  AlertType_Support,
} from '../consts/misc';
import {parseAlarmData} from '../stores/alert';
import ROUTERS from '../consts/routes';

import {
  generateNotifId,
  getCurrentRouteName,
  getRandomId,
} from '../util/general';

const getAlertName = (notifObj, alertSettings, site) => {
  if (!notifObj) return null;
  if (typeof notifObj == 'number')
    return alertSettings.find(a => a.id == notifObj);

  if (typeof notifObj == 'object' && Object.keys(notifObj).length > 0) {
    const alertId = notifObj.alertType;
    const alertType = alertSettings.find(a => a.id == alertId);
    const alertName = alertType
      ? alertType.name
      : 'Unknow alertType: ' + alertId;
    return site ? `${site.name}: ${alertName}` : alertName;
  }
  return String(notifObj);
};

exports.onAlertEvent = async (action, content) => {
  const {healthStore, userStore, sitesStore, navigation, state} = this.props;
  let alert = null;
  if (typeof content != 'object') {
    try {
      alert = JSON.parse(content);
    } catch (ex) {
      __DEV__ &&
        console.log('GOND Parse alert notification content failed: ', ex);
    }
  }
  if (!alert) return;
  if (userStore.settings.alertTypes.length == 0) {
    await userStore.getAlertTypesSettings();
  }

  let noti = null;
  const currentRoute = getCurrentRouteName(navigation, state);
  let shouldRefresh = false;

  switch (action) {
    case NOTIFY_ACTION.ADD:
    case NOTIFY_ACTION.EDIT:
      noti = {
        body: getAlertName(alert, userStore.settings.alertTypes),
        isContent: true,
        id: generateNotifId(alert.AlertType, alert.KDVR),
      };
      shouldRefresh = true;
      break;
    case NOTIFY_ACTION.DELETE:
      noti = {
        body: getAlertName(alert, userStore.settings.alertTypes) + 'resolved.',
        isContent: false,
        id: generateNotifId(alert.AlertType, alert.KDVR),
      };
      shouldRefresh = true;
      // OnHealth(dispatch, toAlertDetail(alert), HEALTH.IGNOREALERTS);
      break;
    case NOTIFY_ACTION.REFRESH:
      noti = {
        isContent: true,
        body: 'Alert dismissed.',
      };
      shouldRefresh = true;
      break;
    case NOTIFY_ACTION.DISMISS:
      //{"AlertType":5,"Detail":{"User":{"UserID":1,"FName":"Demo","LName":"demo","Status":false,"Email":null},"KChannel":[165,166,167,168],"AlertType":0,
      //"KAlert":417030},"Sites":6553,"Kdvr":3,"Kchannel":0,"KAlert":417030,"Description":""}
      const {User} = alert.Detail;
      let alertName = getAlertName(
        alert,
        userStore.settings.alertTypes,
        alert.Sites
          ? sitesStore.getSiteByKey(
              Array.isArray(alert.Sites) ? alert.Sites[0] : alert.Sites
            )
          : undefined
      );
      noti = {
        isContent: false,
        body:
          (User.FName + ' ' + User.LName).trim() +
          ' dismissed ' +
          (alertName && alertName.length > 0 ? alertName : 'alert.'),
      };
      shouldRefresh = true;
      break;
    case NOTIFY_ACTION.DISMISS_BLOCK:
      // {"Total":3,"User":{"UserID":1,"FName":"Demo1","LName":"Aaa","Status":false,"Email":null}}
      let {Total, User} = alert;
      noti = {
        isContent: false,
        body:
          (User.FName + ' ' + User.LName).trim() +
          ' dismissed ' +
          Total.toString() +
          (Total > 1)
            ? ' alerts.'
            : ' alert',
      };
      shouldRefresh = true;
      break;
    case NOTIFY_ACTION.NVR_STATUS:
      // {"AlertType":32,"isOffline":true,"NVRs":[{"Key":3028,"Value":"2017-10-18T08:21:00.9130117-04:00"}]}
      if (alert.NVRs && alert.NVRs.length > 0) {
        noti = {isContent: true, id: generateNotifId(alert.AlertType)};
        const kDVR =
          alert.NVRs && alert.NVRs.length > 0 ? alert.NVRs[0].Key : 0;
        const site = kDVR ? sitesStore.getSiteByKDVR(kd) : null;
        let alertName = getAlertName(
          alert.AlertType,
          userStore.settings.alertTypes,
          site
        );

        if (!alert.isOffline) {
          noti = {...noti, body: alertName + ' resolved.'};
        } else {
          noti = {
            ...noti,
            body: alertName + (alert.Count ? '(' + alert.Count + ')' : '(1)'),
          };
        }
      }
      shouldRefresh = true;
      break;
  }

  if (shouldRefresh) healthStore.refresh(true);
  if (noti && noti != {}) {
    noti.title = 'CMS Alarms.';
  }

  return noti;
};

const onOpenNVRStatus = (alert, healthStore, sitesStore, userStore) => {
  if (!alert) {
    console.log('OnOpenNVRStatus: invalid alert data or no NVR in alert!');
    return;
  }

  let alt_type = _.find(health.AlertTypes, function (o) {
    return o.Id == alert.AlertType;
  });
  if (!alt_type) return;

  let title = alt_type.Name; //getAlertName(AlertTypes.DVR_is_off_line);
  if (!title) return;
  //let SiteKey = _.map(alert.NVRs, 'Key');
  let SiteKey = _.flatMap(sites, it => {
    if (!it.Childs) return [];
    return _.map(it.Childs, 'KDVR');
  });

  let sdate = null;
  let edate = null;
  // console.log('GONDx OnOpenNVRStatus: NVRs = ', alert.NVRs)
  if (!Array.isArray(alert.NVRs) || alert.NVRs.length <= 0) {
    console.log('OnOpenNVRStatus NVRs list is empty, alert = ', alert);
    dispatch(ModuleChange(ROUTERS.HEALTH));
    return;
  } else if (alert.NVRs.length <= 2) {
    [sdate, edate] =
      alert.NVRs[0] < alert.NVRs[alert.NVRs.length - 1]
        ? [alert.NVRs[0], alert.NVRs[alert.NVRs.length - 1]]
        : [alert.NVRs[alert.NVRs.length - 1], alert.NVRs[0]];
  } else {
    const a_sort = _.sortBy(alert.NVRs, [
      function (o) {
        return o.Value;
      },
    ]);
    sdate = a_sort[0];
    edate = a_sort[a_sort.length - 1];
    // const alerts = NVRStatustoALerts(alert.NVRs, sites);
  }
  if (isNullOrUndef(sdate) || isNullOrUndef(edate)) {
    console.log('OnOpenNVRStatus: start date or end date is invalid');
    return;
  }

  const data = {
    channelName: '',
    // kDVR: types.number,
    id: getRandomId(), // Consider using kChannel instead
    alertId: alert.AlertType,
    // timezone: types.string,
    // time: types.string,
    // dvr: types.reference(DVRModel),
  };

  dispatch(ModuleChange(ROUTERS.HEALTH));
  //dispatch( ToScense(ROUTERS.ALERTS, data) );
  //{"AlertType":32,"isOffline":true,"NVRs":[{"Key":3028,"Value":"2017-10-18T08:21:00.9130117-04:00"}]}
  waitForModuleChanged(ROUTERS.HEALTH, () => {
    if (Actions.currentScene == ROUTERS.ALERTS) {
      Actions.refresh(data);
    } else {
      Actions[ROUTERS.ALERTS](data);
    }
  });
};

export async function onOpenAlertEvent(action, content) {
  const {healthStore, navigation, state} = this.props;

  try {
    const alert = typeof content === 'object' ? content : JSON.parse(content);
    if (!alert) return;
    const currentRoute = navigator.getCurrentRouteName(navigation, state);
    console.log('GOND onOpenAlarmEvent content: ', content);

    switch (action) {
      case NOTIFY_ACTION.NVR_STATUS:
        onOpenNVRStatus(alert, currentRoute);
        return;
      case NOTIFY_ACTION.EDIT:
      case NOTIFY_ACTION.REFRESH:
      case NOTIFY_ACTION.ADD:
        // TODO: navigate to Alarm live screen
        console.log('GOND onOpenAlarmEvent add');
        await alarmStore.getAlarms({aty: AlertType_Support});
        const alarmData = parseAlarmData(alert);
        const params = alarmStore.selectAlarm(alarmData)
          ? {screen: ROUTERS.ALARM_DETAIL, initial: false}
          : undefined;
        console.log('GOND onOpenAlarmEvent navigate ', alert, ', ', params);
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
