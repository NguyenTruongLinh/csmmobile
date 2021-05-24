const { ROUTERS } = require("../models/consts");
import {Actions} from 'react-native-router-flux';

getModule = (sceneName) => {
  switch (sceneName) {
    case ROUTERS.ALARM:
    case ROUTERS.ALARMDETAIL:
    case ROUTERS.PVM:
    case ROUTERS.PVMDETAIL:
      return ROUTERS.ALARM;
    case ROUTERS.HEALTH:
    case ROUTERS.HEALTHDETAIL:
    case ROUTERS.ALERTS:
    case ROUTERS.ALERTDETAIL:
    case ROUTERS.CHANNELS:
    case ROUTERS.STREAM_SETTINGS:
      return ROUTERS.HEALTH;
    case ROUTERS.POS:
    case ROUTERS.TRANS:
    case ROUTERS.TRAN_DETAIL:
    case ROUTERS.TRAN_DETAIL_FCM:
    // case ROUTERS.FULLSCREENVIDEO:
      return ROUTERS.POS;
    case ROUTERS.OPTIONS:
    case ROUTERS.PROFILE:
    case ROUTERS.PASSWORD:
    case ROUTERS.VIDEOSETTING:
    case ROUTERS.NOTIFY:
      return ROUTERS.OPTIONS;
    default:
      return sceneName;
  }
}

waitForModuleChanged = (moduleName, callbackFn) => {
  let countDown = 16;
    const scheduler = () => {
      setTimeout(() => {
        countDown--
        if (countDown < 0) {
          callbackFn();
          return
        }
        // console.log('################# On Open Notif PVM, data: ', data)
        // console.log('################# On waitForModuleChanged, currentScene: ', Actions.currentScene)
        if (Array.isArray(moduleName) ? moduleName.includes(Actions.currentScene) : getModule(Actions.currentScene) === moduleName)
          callbackFn();
        else
          scheduler();
      }, 200);
    }
    scheduler();
}

module.exports = {
  getModule,
  waitForModuleChanged,
}