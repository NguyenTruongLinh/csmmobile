import {
  NOTIFY_ACTION,
  AlertTypes,
  AlertNames,
  AlertType_Support,
} from '../consts/misc';
import {parseAlarmData} from '../stores/alert';
import ROUTERS from '../consts/routes';

import {generateNotifId, getRandomId} from '../util/general';

const getAlertName = (notifObj, alertSettings, site) => {
  if (!notifObj) return null;
  if (typeof notifObj == 'string') return String(notifObj);

  const alertId = typeof notifObj == 'number' ? notifObj : notifObj.AlertType;
  if (!alertId) {
    __DEV__ && console.log('GOND getAlertName, bad alert: ', notifObj);
    return;
  }
  const alertType =
    alertSettings && alertSettings.length > 0
      ? alertSettings.find(a => a.id == notifObj)
      : null;
  let alertName = alertType ? alertType.name : null;
  if (!alertName) {
    alertName = AlertNames[alertId] ?? 'Unknow alert: ' + alertId;
  }
  // __DEV__ && console.log('GOND getAlertName, site: ', site);

  return site ? `${site.name}: ${alertName}` : alertName;
};

const onAlertEvent = async props => {
  const {healthStore, userStore, sitesStore, action, content} = props;
  // __DEV__ && console.log('GOND onAlertEvent 1');
  let alert = content;
  if (typeof content != 'object') {
    try {
      alert = JSON.parse(content);
    } catch (ex) {
      __DEV__ &&
        console.log('GOND Parse alert notification content failed: ', ex);
    }
  }
  if (!alert) return;
  // __DEV__ && console.log('GOND onAlertEvent 2');
  if (userStore && userStore.settings.alertTypes.length == 0) {
    await userStore.getAlertTypesSettings();
  }
  // __DEV__ && console.log('GOND onAlertEvent 3');

  let noti = null;
  // const currentRoute = getCurrentRouteName(navigation, state);
  let shouldRefresh = false;

  switch (action) {
    case NOTIFY_ACTION.ADD:
    case NOTIFY_ACTION.EDIT: {
      // __DEV__ && console.log('GOND onAlertEvent 4a');
      noti = {
        body: getAlertName(
          alert,
          userStore ? userStore.settings.alertTypes : null,
          {
            name: alert.SiteName,
          }
        ),
        isContent: true,
        id: generateNotifId(alert.AlertType, alert.KDVR),
      };
      shouldRefresh = true;
      break;
    }
    case NOTIFY_ACTION.DELETE: {
      // __DEV__ && console.log('GOND onAlertEvent 4b');
      noti = {
        body:
          getAlertName(
            alert,
            userStore ? userStore.settings.alertTypes : null
          ) + 'resolved.',
        isContent: false,
        id: generateNotifId(alert.AlertType, alert.KDVR),
      };
      shouldRefresh = true;
      // OnHealth(dispatch, toAlertDetail(alert), HEALTH.IGNOREALERTS);
      break;
    }
    case NOTIFY_ACTION.REFRESH: {
      // __DEV__ && console.log('GOND onAlertEvent 4c');
      noti = {
        isContent: true,
        body: 'Alert dismissed.',
      };
      shouldRefresh = true;
      break;
    }
    case NOTIFY_ACTION.DISMISS: {
      // __DEV__ && console.log('GOND onAlertEvent 4d');
      //{"AlertType":5,"Detail":{"User":{"UserID":1,"FName":"Demo","LName":"demo","Status":false,"Email":null},"KChannel":[165,166,167,168],"AlertType":0,
      //"KAlert":417030},"Sites":6553,"Kdvr":3,"Kchannel":0,"KAlert":417030,"Description":""}
      const {User} = alert.Detail;
      const site = null;
      if (alert.Sites && sitesStore)
        site = await sitesStore.getSiteByKey(
          Array.isArray(alert.Sites) ? alert.Sites[0] : alert.Sites
        );
      let alertName = getAlertName(
        alert,
        userStore ? userStore.settings.alertTypes : null,
        site
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
    }
    case NOTIFY_ACTION.DISMISS_BLOCK: {
      // __DEV__ && console.log('GOND onAlertEvent 4e');
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
    }
    case NOTIFY_ACTION.NVR_STATUS: {
      // __DEV__ && console.log('GOND onAlertEvent 4f');
      // {"AlertType":32,"isOffline":true,"NVRs":[{"Key":3028,"Value":"2017-10-18T08:21:00.9130117-04:00"}]}
      if (alert.NVRs && alert.NVRs.length > 0) {
        noti = {isContent: true, id: generateNotifId(alert.AlertType)};
        const kDVR =
          alert.NVRs && alert.NVRs.length > 0 ? alert.NVRs[0].Key : null;
        let site = null;
        if (kDVR && sitesStore) site = await sitesStore.getSiteByKDVR(kDVR);

        let alertName = getAlertName(
          alert.AlertType,
          userStore ? userStore.settings.alertTypes : null,
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
  }

  if (shouldRefresh && healthStore) healthStore.refresh(true);
  if (noti && noti != {}) {
    // __DEV__ && console.log('GOND onAlertEvent 5');
    noti.title = 'CMS Health.';
  }

  // __DEV__ && console.log('GOND onAlertEvent 6');
  return noti;
};

const onOpenAlertEvent = async props => {
  const {healthStore, sitesStore, userStore, naviService, action, content} =
    props;
  __DEV__ &&
    console.log(`onOpenAlertEvent action = `, action, `| content = `, content);
  try {
    const alert = typeof content === 'object' ? content : JSON.parse(content);
    if (!alert) return;

    naviService.navigate(ROUTERS.HOME_NAVIGATOR, {
      screen: ROUTERS.HOME,
      initial: false,
    });
    naviService.navigate(ROUTERS.HOME_NAVIGATOR, {
      screen: ROUTERS.HEALTH_SITES,
      initial: false,
    });

    switch (action) {
      case NOTIFY_ACTION.ADD:
      case NOTIFY_ACTION.EDIT:
      case NOTIFY_ACTION.DISMISS: {
        const kDVR =
          alert.Kdvr ??
          alert.KDVR ??
          (alert.NVRs && alert.NVRs.length > 0 ? alert.NVRs[0].Key : null);
        if (!kDVR) {
          console.log('GOND onOpenAlertEvent: no kDVR ', alert);
          return;
        }

        let site = null;
        if (kDVR) {
          site = await sitesStore.getSiteByKDVR(kDVR);
        }
        if (!site) {
          console.log('GOND onOpenAlertEvent: site not found, kDVR = ', kDVR);
          return;
        }
        if (userStore.settings.alertTypes.length == 0) {
          await userStore.getAlertTypesSettings();
        }
        let naviParams = await healthStore.onAlertNotification(
          alert,
          site,
          userStore.settings.alertTypes
        );
        naviService.navigate(ROUTERS.HOME_NAVIGATOR, naviParams);
        return;
      }
      case NOTIFY_ACTION.DELETE: {
        return null;
      }
      case NOTIFY_ACTION.NVR_STATUS: {
        // const kDVR =
        //   alert.NVRs && alert.NVRs.length > 0 ? alert.NVRs[0].Key : null;
        // if (!kDVR) return;

        // let site = null;
        // if (kDVR) {
        //   site = await sitesStore.getSiteByKDVR(kDVR);
        // }
        if (
          !alert.NVRs ||
          !Array.isArray(alert.NVRs) ||
          !alert.NVRs.length ||
          !alert.NVRs[0]
        ) {
          console.log('GOND onOpenAlertEvent: no NVR data', alert);
          return;
        }
        // call get site for getting data first
        const site = await sitesStore.getSiteByKDVR(alert.NVRs[0].Key);
        const dvrs = await Promise.all(
          alert.NVRs.map(async nvr => {
            const result = await sitesStore.getDVR(nvr.Key);
            return result
              ? {...result, timezone: nvr.Value}
              : {kDVR: nvr.Key, name: 'KDVR ' + nvr.Key, timezone: nvr.Value};
          })
        );
        // console.log('GOND onOpen NVR status, dvrs = ', dvrs);
        await healthStore.onNVRStatusNotification(alert, dvrs, site);
        naviService.navigate(ROUTERS.HOME_NAVIGATOR, {
          screen: ROUTERS.HEALTH_ALERTS,
          initial: false,
        });
        return;
      }
      default: {
        return;
      }
    }
  } catch (ex) {
    __DEV__ && console.log('GOND onOpenAlertEvent parse content error: ', ex);
  }
};

const onAlertSetting = async props => {
  if (props.action === NOTIFY_ACTION.EDIT) {
    const {userStore, healthStore} = props;
    if (userStore && healthStore) {
      await userStore.getAlertTypesSettings();
      healthStore.saveAlertTypesConfig(userStore.settings.alertTypes);
    }
  }

  return {
    title: 'Alert Settings.',
    body: 'Alert Settings has changed.',
    isContent: false,
  };
};

const onOpenAlertSetting = props => {
  //console.log('alerttype: ' + content);
  const {naviService} = props;
  if (props.action === NOTIFY_ACTION.EDIT) {
    const currentRoute = naviService.getCurrentRouteName();
    // __DEV__ &&
    // console.log('GOND onAlertSettings, current Top route: ', currentRoute);

    if (!currentRoute.includes(ROUTERS.HEALTH))
      naviService.navigate(ROUTERS.HEALTH_SITES);
  }
};

module.exports = {
  onAlertEvent,
  onOpenAlertEvent,
  onAlertSetting,
  onOpenAlertSetting,
};
