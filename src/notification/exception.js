import {DateTime} from 'luxon';
import {
  NOTIFY_ACTION,
  AlertTypes,
  AlertNames,
  AlertType_Support,
  DateFormat,
} from '../consts/misc';

import ROUTERS from '../consts/routes';

import {generateNotifId, getRandomId} from '../util/general';
import {SMARTER as SMARTER_TXT} from '../localization/texts';

function getExceptionName(alt) {
  if (!alt) return null;
  let siteName = alt.SiteName;

  return SMARTER_TXT.NOTIFY_TITLE + (siteName ? ' | ' + siteName : '');
}

const onExceptionEvent = props => {
  const {exceptionStore, sitesStore, action, content} = props;
  // __DEV__ && console.log('GOND onAlertEvent 1');
  let alert = {};
  if (typeof content == 'object') {
    alert = content;
  } else {
    try {
      alert = JSON.parse(content);
    } catch (ex) {
      __DEV__ &&
        console.log('GOND Parse alert notification content failed: ', ex);
    }
  }
  if (!alert) return;

  // const currentRoute = getCurrentRouteName(navigation, state);
  switch (action) {
    case NOTIFY_ACTION.ADD: {
      const transDate = DateTime.fromISO(alert.DateTime, {
        zone: 'utc',
      }).toFormat(DateFormat.TranDate);

      return {
        id: generateNotifId('smarter', alert.TranID),
        isContent: true,
        title: getExceptionName(alert),
        body: '(' + transDate + ') ' + (alert.Flagname ?? ''),
      };
    }
    case NOTIFY_ACTION.EDIT:
    case NOTIFY_ACTION.DELETE:
    case NOTIFY_ACTION.REFRESH:
    case NOTIFY_ACTION.DISMISS:
    case NOTIFY_ACTION.DISMISS_BLOCK:
    case NOTIFY_ACTION.NVR_STATUS:
      return;
  }
};

const onOpenExceptionEvent = async props => {
  const {exceptionStore, naviService, action, content} = props;

  try {
    const alert = typeof content === 'object' ? content : JSON.parse(content);
    if (!alert) return;

    switch (action) {
      case NOTIFY_ACTION.ADD:
      case NOTIFY_ACTION.EDIT:
      case NOTIFY_ACTION.REFRESH:
        if (exceptionStore && naviService) {
          const res = await exceptionStore.onExceptionNotification(alert);
          const currentRoute = naviService.getCurrentRouteName();
          const topRoute = naviService.getTopRouteName();
          console.log(
            'GOND onOpenExceptionEvent: ',
            alert,
            ', currently at: ',
            topRoute,
            ' - ',
            currentRoute
          );

          if (res) {
            naviService.navigate(ROUTERS.HOME_NAVIGATOR, {
              screen: ROUTERS.HOME,
              initial: false,
            });
            naviService.navigate(ROUTERS.HOME_NAVIGATOR, {
              screen: ROUTERS.SMARTER_DASHBOARD,
              initial: false,
            });
            naviService.navigate(ROUTERS.HOME_NAVIGATOR, {
              screen: ROUTERS.TRANS_DETAIL,
              initial: false,
            });
          }
        }
        break;
      case NOTIFY_ACTION.DELETE: {
        return null;
      }
      default: {
        if (!currentRoute.includes(ROUTERS.OPTIONS)) {
          naviService.navigate(ROUTERS.OPTIONS);
        }
        break;
      }
    }
  } catch (ex) {
    __DEV__ &&
      console.log('GOND onOpenExceptionEvent parse content error: ', ex);
  }
};

module.exports = {
  onExceptionEvent,
  onOpenExceptionEvent,
};
