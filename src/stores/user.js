import {types, flow, getSnapshot} from 'mobx-state-tree';
import {Alert} from 'react-native';

import {WIDGET_COUNTS, MODULES, Orient, NOTIFY_ACTION} from '../consts/misc';
import APP_INFO from '../consts/appInfo';
import ROUTERS from '../consts/routes';

import {
  Route,
  Account as AccountRoute,
  Users as UserRoute,
  FCM as FCMRoute,
  ACConfig,
} from '../consts/apiRoutes';
import {Login as LoginTxt} from '../localization/texts';
import apiService from '../services/api';
import dbService from '../services/localdb';
import appStore from './appStore';

// TODO: fixit
// const AppId = '4d53bce03ec34c0a911182d4c228ee6c';
import {isNullOrUndef} from '../util/general';
import snackbarUtil from '../util/snackbar';
import {LocalDBName, MODULE_PERMISSIONS} from '../consts/misc';

import cmscolors from '../styles/cmscolors';
import notificationController from '../notification/notificationController';
import {toUTCDate} from '../util/general.js';

export const clientLogID = {
  LOGIN: 600,
  LOGOUT: 601,
  ALARM: 602,
  HEALTH: 603,
  BI: 605,
  SMART_ER: 604,
  SETTINGS: 606,
  PVM: 607,
  VIDEO: 608,
  HOME: 609,
  APP_TO_BACKGROUND: 698,
  APP_TO_FOREGROUND: 699,
};
export const ClientType = {
  BROWSER: 0,
  CMS_MOBILE_ANDROID: 1,
  CMS_MOBILE_IOS: 2,
  ALERT_CENTER: 3,
  OTHER: 4,
};

let moduleSwitchLogId = 0;
let loginLogId = 0;
let lastReportId = clientLogID.APP_TO_BACKGROUND;

const LOGIN_FAIL_CAUSES = {
  USER_LOCK: 'USER_LOCK',
  USER_NOT_EXIST: 'USER_NOT_EXIST',
  EXPIRED_PASSWORD: 'EXPIRED_PASSWORD',
  ACCOUNT_IS_EXPIRED: 'ACCOUNT_IS_EXPIRED',
};
const PASS_CHANGE_FAIL_CAUSES = {
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  USER_PASSWORD_EXISTED: 'USER_PASSWORD_EXISTED',
};

const MODULE_TAB_MAP = new Map([
  [MODULE_PERMISSIONS.VSC, [1]],
  [MODULE_PERMISSIONS.SITE, [2]],
]);

const MODULE_HOME_WIDGET_MAP = new Map([
  [MODULE_PERMISSIONS.VSC, [1]],
  [MODULE_PERMISSIONS.SITE, [0, 2, 4]],
  [MODULE_PERMISSIONS.REBAR, [3]],
]);

const ModuleModel = types
  .model({
    functionId: types.number,
    functionName: types.string,
    moduleId: types.number,
  })
  .actions(self => ({
    parse(_module) {
      self.moduleId = _module.ModuleID;
      self.functionId = _module.FunctionID;
      self.functionName = _module.FunctionName;
    },
  }));

const parseModule = _module => {
  return ModuleModel.create({
    moduleId: _module.ModuleID,
    functionId: _module.FunctionID,
    functionName: _module.FunctionName,
  });
};

const WidgetCountModel = types.model({
  id: types.identifier,
  total: types.number,
});

const APIModel = types
  .model({
    url: types.string,
    appId: types.string,
    version: types.string,
    id: types.string,
    apiKey: types.string,
    token: types.string,
  })
  .views(self => ({
    get data() {
      const {url, appId, version, id, apiKey, token} = self;
      return {url, appId, version, id, apiKey, token};
    },
  }))
  .actions(self => ({
    parse(_api) {
      __DEV__ && console.log('GOND load _api: ', _api);
      if (!_api._Api || !_api._ApiToken) {
        return false;
      }
      self.url = _api._Api.Url || self.url;
      self.appId = _api._Api.AppId || self.appId;
      self.version = _api._Api.Version || self.version;
      self.id = _api._ApiToken.Id || self.id;
      self.apiKey = _api._ApiToken.ApiKey || self.apiKey;
      self.token = _api._ApiToken.Token || self.token;
      return true;
    },
  }));

const getDefaultAPI = () =>
  APIModel.create({
    url: '',
    appId: '',
    version: '',
    id: '',
    apiKey: '',
    token: '',
  });

const UserModel = types
  .model({
    userId: types.maybeNull(types.number),
    userName: types.string,
    firstName: types.string,
    lastName: types.string,
    email: types.maybeNull(types.string),
    avatar: types.maybeNull(types.string),
    // isAuth: types.boolean,
    isAdmin: types.maybeNull(types.boolean),
  })
  .views(self => ({
    get dataForProfileUpdate() {
      return {
        FName: self.firstName,
        LName: self.lastName,
        Email: self.email,
        // UPhoto: self.avatar,
      };
    },
    get data() {
      const {userId, userName, firstName, lastName, email, isAdmin} = self;
      return {
        userId,
        userName,
        firstName,
        lastName,
        email,
        isAdmin,
        avatar: '', // not saving/editing avatar
      };
    },
  }))
  .actions(self => ({
    parse(_user) {
      self.userId = _user.UserID;
      self.userName = _user.UName ?? self.userName;
      self.firstName = _user.FName ?? self.firstName;
      self.lastName = _user.LName ?? self.lastName;
      self.email = _user.Email ?? self.email;
      self.avatar = _user.UPhoto ?? '';
      self.isAdmin = _user.IsAdmin ?? false;
      // self.isAuth = true;
    },
    updateProfile({firstName, lastName, email, avatar}) {
      self.firstName = firstName || self.firstName;
      self.lastName = lastName || self.lastName;
      self.email = email || self.email;
      self.avatar = avatar || self.avatar;
    },
  }));

const createAnonymousUser = () =>
  UserModel.create({
    userId: 0,
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
    // isAuth: false,
    isAdmin: false,
  });

const LoginModel = types
  .model({
    domainname: types.string,
    username: types.string,
    password: types.string,
    lockedTime: types.maybeNull(types.number),
  })
  .actions(self => ({
    getData() {
      return self.domainname && self.username && self.password
        ? {
            domainname: self.domainname,
            username: self.username,
            password: self.password,
          }
        : null;
    },
    validate(_data) {
      return _data.domainname && _data.username && data.password;
    },
    parse(_data) {
      if (self.validate(_data)) {
        self.domainname = _data.domainname;
        self.username = _data.username;
        self.password = _data.password;
        return true;
      }
      return false;
    },
    postLogin() {
      self.password = '';
    },
  }));

const FCMModel = types
  .model({
    token: types.string,
    apnsToken: types.string,
    serverId: types.string,
  })
  .actions(self => ({
    saveToken(fcmToken, apnsToken) {
      let saved = false;
      if (fcmToken && fcmToken != self.token) {
        self.token = fcmToken;
        saved = true;
      }
      if (apnsToken && apnsToken != self.apnsToken) {
        self.apnsToken = apnsToken;
        saved = true;
      }
      return saved;
    },
  }));

const AlertTypeModel = types.model({
  id: types.identifierNumber,
  kAlertSeverity: types.number,
  name: types.string,
  cmsWebType: types.maybeNull(types.number),
  cmsWebGroup: types.maybeNull(types.number),
  displayStatus: types.maybeNull(types.number),
});

const parseAlertType = _data => {
  return AlertTypeModel.create({
    id: _data.Id,
    kAlertSeverity: _data.KAlertSeverity,
    name: _data.Name,
    cmsWebType: _data.CmsWebType,
    cmsWebGroup: _data.CmsWebGroup,
    displayStatus: _data.DisplayStatus,
  });
};

const UserSettingsModel = types.model({
  selectedNotifies: types.array(types.number),
  selectedExceptions: types.array(types.number),
  alertTypes: types.array(AlertTypeModel),
});

const WidgeCountsModel = types.model({
  602: types.maybeNull(types.number),
  603: types.maybeNull(types.number),
  604: types.maybeNull(types.number),
  607: types.maybeNull(types.number),
});

export const UserStoreModel = types
  .model({
    user: types.maybeNull(UserModel),
    error: types.maybeNull(types.string),
    domain: types.maybeNull(types.string),
    message: types.string,
    isLoggedIn: types.boolean,
    loginInfo: types.maybeNull(LoginModel),
    //
    fcm: types.maybeNull(FCMModel),
    api: types.maybeNull(APIModel),
    modules: types.array(ModuleModel),
    routes: types.array(types.string),
    //
    settings: types.maybeNull(UserSettingsModel),
    //
    widgetCounts: types.maybeNull(WidgeCountsModel),
    //
    moduleUpdatedFlag: types.boolean,
    isSubmitForgotPassLoading: types.maybeNull(types.boolean),
  })
  .volatile(self => ({
    onLogin: () => __DEV__ && console.log('GOND onLogin event not defined!'),
    onLogout: () => __DEV__ && console.log('GOND onLogout event not defined!'),
  }))
  .views(self => ({
    get disableTabIndexes() {
      let result = [1, 2];
      let tmp = [];
      for (const [key, value] of MODULE_TAB_MAP.entries()) {
        if (key == MODULE_PERMISSIONS.VSC || self.hasPermission(key)) {
          tmp.push(...value);
        }
      }
      result = result.filter(item => !tmp.includes(item));
      return result;
    },
    get disableHomeWidgetIndexes() {
      let result = [0, 1, 2, 3, 4];
      let tmp = [];
      for (const [key, value] of MODULE_HOME_WIDGET_MAP.entries()) {
        if (key == MODULE_PERMISSIONS.VSC || self.hasPermission(key)) {
          tmp.push(...value);
        }
      }
      result = result.filter(item => !tmp.includes(item));
      return result;
    },
    get alarmWidgetCount() {
      return (self.widgetCounts && self.widgetCounts[WIDGET_COUNTS.ALARM]) || 0;
    },
    get healthWidgetCount() {
      return (
        (self.widgetCounts && self.widgetCounts[WIDGET_COUNTS.HEALTH]) || 0
      );
    },
    get smartWidgetCount() {
      return (
        (self.widgetCounts && self.widgetCounts[WIDGET_COUNTS.SMART_ER]) || 0
      );
    },
    get oamWidgetCount() {
      return (self.widgetCounts && self.widgetCounts[WIDGET_COUNTS.OAM]) || 0;
    },
  }))
  .actions(self => ({
    setConfigApi() {
      apiService.updateConfig(
        {
          url: self.api.url,
          appId: self.api.appId,
          version: self.api.version,
        },
        {
          id: self.api.id,
          apiKey: self.api.apiKey,
          token: self.api.token,
          devId: appStore.deviceInfo.deviceId,
        }
      );
    },
    // #region authorization
    addAuthenticationEventListeners({onLogin, onLogout}) {
      if (onLogin != undefined && typeof onLogin == 'function')
        self.onLogin = onLogin;
      if (onLogout != undefined && typeof onLogout == 'function')
        self.onLogout = onLogout;
    },
    login: flow(function* (domainname, username, password) {
      appStore.setLoading(true);
      if (!appStore.deviceInfo || !appStore.deviceInfo.deviceId) {
        yield appStore.loadLocalData();
      }
      self.error = '';
      self.loginInfo = LoginModel.create({
        domainname,
        username,
        password,
      });
      self.domain = domainname;
      self.api = APIModel.create({
        url: domainname + Route,
        appId: APP_INFO.AppId,
        version: APP_INFO.Version,
        id: '',
        apiKey: '',
        token: '',
      });

      self.setConfigApi();
      // const res = await apiService.login(username, password);
      const res = yield apiService.login(username, password);
      __DEV__ && console.log('GOND login res = ', JSON.stringify(res));
      if (res && res.status == 200 && res.Result) {
        self.user.userName = username;
        self.loginSuccess(res);
      } else {
        self.loginFailed(res);
      }
      // appStore.setLoading(false);
    }),
    loginSuccess: flow(function* (data) {
      try {
        self.user.parse(data.Result);
        apiService.updateUserId(self.user.userId);
      } catch (err) {
        __DEV__ && console.log('GOND load user profile error: ', err);
        self.isLoggedIn = false;
        self.error = err;
        appStore.setLoading(false);
        return;
      }
      if (isNullOrUndef(self.user.userId) || self.user.userId <= 0) {
        self.error = 'Error! Not a valid user!';
        return;
      }
      self.error = '';
      self.message = data.message || '';
      self.isLoggedIn = true;

      // data.Api && self.api.parse(data.Api);
      // yield self.getUserPhoto();
      // yield self.getPrivilege();
      let {configToken} = apiService.getConfig();
      if (configToken) {
        self.api.id = configToken.id;
        self.api.apiKey = configToken.apiKey;
        self.api.token = configToken.token;
      }

      self.getDataPostLogin(false);
      self.saveLocal(); // no need to yield
      // clear login info
      self.loginInfo.postLogin();
      self.setActivites(clientLogID.LOGIN);
    }),
    loginFailed(data) {
      if (data.status === 401) {
        const retMess = data.Result && data.Result.ReturnMessage;
        const failInfos = retMess && retMess[0] && retMess[0].split(';');
        const failReason = failInfos && failInfos[0];
        if (failReason == LOGIN_FAIL_CAUSES.USER_LOCK) {
          self.loginInfo.lockedTime =
            failInfos &&
            failInfos[1] &&
            !isNaN(failInfos[1]) &&
            Number.parseInt(failInfos[1]);
          setTimeout(() => {
            appStore.naviService.navigate(ROUTERS.ACCOUNT_LOCKED);
          }, 200);
        } else if (failReason == LOGIN_FAIL_CAUSES.EXPIRED_PASSWORD) {
          setTimeout(() => {
            appStore.naviService.navigate(ROUTERS.PASSWORD_EXPIRED);
          }, 200);
        } else if (failReason == LOGIN_FAIL_CAUSES.ACCOUNT_IS_EXPIRED) {
          Alert.alert(LoginTxt.errorTitle, LoginTxt.errorExpiredAccount);
        } else {
          Alert.alert(LoginTxt.errorTitle, LoginTxt.errorLoginIncorrect);
        }
      } else {
        Alert.alert(LoginTxt.errorTitle, LoginTxt.errorLoginCantConnect);
      }
      self.isLoggedIn = false;
      appStore.setLoading(false);
    },
    logout: flow(function* () {
      yield self.setActivites(clientLogID.LOGOUT);

      if (!self.deleteLocal()) return false;

      self.onLogout();

      self.loginInfo = LoginModel.create({
        domainname: self.domain,
        username: '',
        password: '',
      });
      self.user = createAnonymousUser();
      self.error = '';
      self.message = '';
      self.isLoggedIn = false;

      self.unregisterToken();
      self.fcm = FCMModel.create({token: '', apnsToken: '', serverId: ''});
      self.api = null;
      self.modules = [];
      self.routes = [];
      return true;
    }),
    getDataPostLogin: flow(function* (refreshUserFlag) {
      try {
        const [
          refreshUserRes,
          uPhotoRes,
          modulesRes,
          alertTypesRes,
          registerTokenRes,
        ] = yield Promise.all([
          refreshUserFlag ? self.refreshUser() : self.dummyFunction(),
          self.getUserPhoto(),
          self.getPrivilege(),
          self.getAlertTypesSettings(),
          self.registerToken(),
          // self.getWidgetCounts(),
        ]);
        __DEV__ &&
          console.log(
            'GOND getDataPostLogin ',
            refreshUserRes,
            uPhotoRes,
            modulesRes,
            alertTypesRes,
            registerTokenRes
          );
        // TODO: should we?
        // return uPhotoRes && modulesRes; // && alertTypesRes;
        self.onLogin();
        appStore.setLoading(false);
        return true;
      } catch (err) {
        __DEV__ && console.log('GOND getDataPostLogin failed: ', err);
        snackbarUtil.handleRequestFailed();
        return false;
      }
    }),
    dummyFunction: flow(function* () {
      return false;
    }),
    refreshUser: flow(function* () {
      if (self.user && self.user.userId) {
        try {
          let res = yield apiService.get(
            AccountRoute.controller,
            self.user.userId,
            AccountRoute.profile
          );
          self.user.parse(res);
          self.saveLocal();
          return true;
        } catch (err) {
          __DEV__ && console.log('GOND refreshUser failed: ', err);
          return false;
        }
      }
      return false;
    }),
    refreshUserFromNotif: flow(function* (user, noti, notifExtraData) {
      if (self.user && self.user.userId) {
        yield self.getDataPostLogin(true);
        if (self.moduleUpdatedFlag)
          noti.body = user + "'s permission has updated.";
        __DEV__ &&
          console.log(
            'refreshUserFromNotif',
            `notifExtraData=${JSON.stringify(notifExtraData)}`,
            noti
          );
        if (self.moduleUpdatedFlag)
          notifExtraData.data.action = NOTIFY_ACTION.USER_PERMISSION_REFRESH;

        notificationController.displayLocalNotification({
          ...noti,
          ...notifExtraData,
        });
        return true;
      }
      return false;
    }),
    passwordUpdated(data) {
      self.error = data.error;
      self.message = data.message;
    },
    getUserPhoto: flow(function* () {
      __DEV__ && console.log('getUserPhoto');
      if (self.user && self.user.userId) {
        try {
          let res = yield apiService.getBase64Stream(
            AccountRoute.controller,
            self.user.userId,
            AccountRoute.avatar
          );
          // __DEV__ && console.log('GOND get user photo res: ', res);
          if (res && res.status == 200) {
            self.user.avatar = res.data;
            return true;
          }
        } catch (err) {
          __DEV__ && console.log('GOND get user photo failed: ', err);
          return false;
        }
        return false;
      }
      return false;
    }),
    getDisableTabIndexes() {
      let result = [1, 2];
      let tmp = [];
      for (const [key, value] of MODULE_TAB_MAP.entries()) {
        if (self.hasPermission(key)) {
          tmp.push(...value);
        }
      }
      result = result.filter(item => !tmp.includes(item));
      return result;
    },
    getDisableHomeWidgetIndexes() {
      let result = [0, 1, 2, 3, 4];
      let tmp = [];
      for (const [key, value] of MODULE_HOME_WIDGET_MAP.entries()) {
        if (self.hasPermission(key)) {
          tmp.push(...value);
        }
      }
      result = result.filter(item => !tmp.includes(item));
      return result;
    },
    getPrivilege: flow(function* () {
      if (self.user && self.user.userId) {
        try {
          let res = yield apiService.get(
            AccountRoute.controller,
            self.user.userId,
            AccountRoute.modules
          );

          __DEV__ &&
            console.log(
              'GOND user getmodules: ',
              res,
              ' \n self.modules = ',
              self.modules
            );
          __DEV__ && console.log(`getPrivilege res = `, JSON.stringify(res));
          if (
            Array.isArray(res) // ||
            // (typeof res == 'object' &&
            //   res.status == 200 &&
            //   Array.isArray(res.data))
          ) {
            self.moduleUpdatedFlag = false;
            const prevDisableTabIndexes = self.getDisableTabIndexes();
            const prevDisableHomeWidgetIndexes =
              self.getDisableHomeWidgetIndexes();
            self.modules = res.map(item => parseModule(item));
            self.moduleUpdatedFlag =
              JSON.stringify(prevDisableTabIndexes) !=
                JSON.stringify(self.getDisableTabIndexes()) ||
              JSON.stringify(prevDisableHomeWidgetIndexes) !=
                JSON.stringify(self.getDisableHomeWidgetIndexes());
            __DEV__ &&
              console.log(
                'getPrivilege',
                `self.moduleUpdatedFlag=${self.moduleUpdatedFlag}`
              );

            return true;
          }
        } catch (err) {
          __DEV__ && console.log('GOND get user module failed: ', err);
          return false;
        }
      }
      return false;
    }),
    changePassword: flow(function* (username, oldPassword, newPassword) {
      // if (self.user && self.user.userId) {
      try {
        const res = yield apiService.changePassword(
          username,
          oldPassword,
          newPassword
        );
        __DEV__ && console.log('GOND user changePassword: ', res);
        if (res && res.status == 200 && res.Result && !res.Result.error) {
          snackbarUtil.showToast(
            LoginTxt.passwordChangedSuccess,
            cmscolors.Success
          );
          appStore.naviService.replace(ROUTERS.LOGIN, {});
          return true;
        } else if (
          res.Result &&
          res.Result.message &&
          Array.isArray(res.Result.message) &&
          res.Result.message.length > 0
        ) {
          Alert.alert(
            LoginTxt.passwordChangeErrorTitle,
            (res.Result &&
              res.Result.message[0] ==
                PASS_CHANGE_FAIL_CAUSES.USER_PASSWORD_EXISTED &&
              LoginTxt.userPassswordExisted.replace(
                '%d',
                res.Result.message[1]
              )) ||
              LoginTxt.errorLoginIncorrect
          );
          return false;
        } else if (
          res.Result.ReturnMessage &&
          res.Result.ReturnMessage.length > 0
        ) {
          let message = '';
          res.Result.ReturnMessage.map(
            item => (message = message + item + '\n')
          );
          Alert.alert(LoginTxt.passwordChangeErrorTitle, message);
        }
      } catch (err) {
        __DEV__ && console.log('GOND user changePassword failed: ', err);
        return false;
      }
      // }
      // return false;
    }),
    submitForgotPassword: flow(function* (domain, email, username) {
      // if (self.user && self.user.userId) {
      self.isSubmitForgotPassLoading = true;
      try {
        const res = yield apiService.submitForgotPassword(
          domain + Route,
          email,
          username
        );
        __DEV__ && console.log('GOND user submitForgotPassword: ', res);
        if (res && res.status == 200 && res.Result && !res.Result.error) {
          appStore.naviService.navigate(ROUTERS.SUBMITED);
          self.isSubmitForgotPassLoading = false;
          return true;
        } else if (res.Result == undefined && res.error == undefined) {
          Alert.alert(
            LoginTxt.forgotPasswordErrorTitle,
            LoginTxt.errorLoginCantConnect
          );
          self.isSubmitForgotPassLoading = false;
          return false;
        } else {
          Alert.alert(
            LoginTxt.forgotPasswordErrorTitle,
            LoginTxt.emailOrUsernameIncorrect
          );
          self.isSubmitForgotPassLoading = false;
          return false;
        }
      } catch (err) {
        __DEV__ && console.log('GOND user changePassword failed: ', err);
        return false;
      }
      self.isSubmitForgotPassLoading = false;
    }),
    getWidgetCounts: flow(function* () {
      if (self.user && self.user.userId) {
        try {
          let res = yield apiService.get(
            UserRoute.controller,
            self.user.userId,
            UserRoute.alertCount
          );
          // __DEV__ && console.log('GOND user getWidgetCounts: res = ', res);
          if (!Array.isArray(res)) return false;
          let data = {};
          res.map(item => {
            data['' + item.Id] = item.Total;
          });
          self.widgetCounts = WidgeCountsModel.create(data);
          return true;
        } catch (err) {
          __DEV__ && console.log('GOND get user getWidgetCounts failed: ', err);
          return false;
        }
      }
      return false;
    }),
    intervalUpdateWidgetCounts() {
      // return;
      return setInterval(function () {
        self.getWidgetCounts();
        __DEV__ && console.log('GOND intervalUpdateWidgetCounts ...');
      }, 30000); // 30 secs
    },
    resetWidgetCount: flow(function* (widgetId) {
      __DEV__ && console.log('GOND resetWidgetCount widgetId: ', widgetId);
      if (!self.widgetCounts) return;
      if (self.widgetCounts[widgetId] === 0) return true;
      self.widgetCounts[widgetId] = 0;
      try {
        const res = yield apiService.post(
          UserRoute.controller,
          self.user.userId,
          UserRoute.resetAlert,
          {Id: widgetId}
        );
        if (res.error) {
          __DEV__ && console.log('GOND resetWidgetCount failed: ', res);
          return false;
        }
        __DEV__ && console.log('GOND resetWidgetCount res: ', res);
        return true;
      } catch (ex) {
        __DEV__ && console.log('GOND resetWidgetCount failed: ', ex);
        return false;
      }
    }),
    // #endregion
    // #region local data
    saveLocal: flow(function* () {
      try {
        let data = {...self.user};
        data.api = self.api.data;
        data.domain = self.domain;
        let localUser = yield dbService.getFirstData(LocalDBName.user);

        // __DEV__ && console.log('GOND user save local data: ', data);
        if (!localUser) {
          yield dbService.add(LocalDBName.user, data);
        } else {
          if (localUser.userId != data.userId) {
            __DEV__ &&
              console.log(
                'GOND This is weird, saved user (',
                localUser,
                ') is different than logged in user ',
                data
              );
          }
          yield dbService.update(LocalDBName.user, data, {
            userId: localUser.userId,
          });
        }

        return true;
      } catch (err) {
        __DEV__ && console.log('GOND save data local failed: ', err);
        snackbarUtil.handleSaveLocalDataFailed(err);
        return false;
      }
    }),
    deleteLocal: flow(function* () {
      let res = yield dbService.delete(LocalDBName.user);
      // __DEV__ && console.trace('GOND user delete local: ', res);
      return res;
    }),
    loadLocalData: flow(function* () {
      const savedData = yield dbService.getFirstData(LocalDBName.user);
      const savedDomain = yield dbService.getFirstData(LocalDBName.domain);

      __DEV__ &&
        console.log('GOND user load local data: ', savedData, savedDomain);
      if (savedData && typeof savedData === 'object') {
        try {
          if (
            savedDomain &&
            savedDomain.Url &&
            (savedData.UserName || savedData.Token)
          ) {
            self.user = UserModel.create({
              userId: savedData.UserId ?? null,
              userName: savedData.UserName ?? '',
              firstName: savedData.FName ?? '',
              lastName: savedData.LName ?? '',
              email: savedData.Email ?? '',
              isAdmin: savedData.IsAdmin ?? false,
            });

            self.domain = savedDomain.Url;

            self.api = APIModel.create({
              url: self.domain + Route,
              appId: APP_INFO.AppId,
              version: APP_INFO.Version,
              id: '',
              apiKey: savedData.ApiKey ?? '',
              token: savedData.Token ?? '',
            });
          } else {
            self.user = UserModel.create(savedData);
            self.api = APIModel.create(savedData.api);
            self.domain = savedData.domain ?? '';
          }

          self.setConfigApi();
          apiService.updateUserId(self.user.userId);
        } catch (err) {
          __DEV__ && console.log('GOND load user local data failed: ', err);
          snackbarUtil.handleReadLocalDataFailed(err);
          self.error = err;
          return false;
        }
        self.error = '';
        return true;
      }
      return false;
    }),
    shouldAutoLogin: flow(function* () {
      appStore.setLoading(true);
      const shouldLogin = yield self.loadLocalData();
      if (!appStore.deviceInfo || !appStore.deviceInfo.deviceId) {
        yield appStore.loadLocalData();
      }
      if (shouldLogin) {
        // __DEV__ &&
        //   console.log('GOND shouldAutoLogin before: ', getSnapshot(self.user));
        self.isLoggedIn = yield self.getDataPostLogin(true);
        // __DEV__ &&
        //   console.log('GOND shouldAutoLogin after: ', getSnapshot(self.user));
        // dongpt: no need to delete local data #51542
        // if (!self.isLoggedIn) self.deleteLocal();
        // else self.setActivites(clientLogID.LOGIN);
        // __DEV__ && console.log('GOND self.isLoggedIn: ', self.isLoggedIn);
      }
      appStore.setLoading(false);
      return self.isLoggedIn;
    }),
    // #endregion
    // #region FCM
    saveToken(fcmToken, apnsToken) {
      if (!self.fcm) {
        self.fcm = FCMModel.create({token: '', apnsToken: '', serverId: ''});
      }
      // if (self.fcm.token != fcmToken) {
      //   __DEV__ && console.log('GOND save token: ', fcmToken);
      //   self.fcm.token = fcmToken;

      //   apnsToken && (self.fcm.apnsToken = apnsToken);
      //   if (self.isLoggedIn) self.registerToken();
      // }
      if (self.isLoggedIn && self.fcm.saveToken(fcmToken, apnsToken))
        self.registerToken();
    },
    registerToken: flow(function* () {
      if (!self.fcm.token || self.fcm.token.length == 0) {
        __DEV__ &&
          console.log(
            'GOND registerToken failed, fcm token empty ',
            self.fcm.token
          );
        return false;
      }
      const data = {
        fcm_token: self.fcm.token,
        deviceid: appStore.deviceInfo.deviceId,
        info: appStore.deviceInfo.deviceModel,
        apns_token: self.fcm.apnsToken,
        killstate: 0,
      };
      try {
        const res = yield apiService.post(
          FCMRoute.controller,
          null,
          null,
          data
        );
        if (res.error || !res.Value) {
          __DEV__ && console.log('GOND registerToken failed: ', res);
          snackbarUtil.onMessage(
            'Failed to connect to CMS server, please try again later!'
          );
          return false;
        }
        if (res.Key != 'OK') {
          __DEV__ && console.log('GOND registerToken failed: ', res);
          return false;
        }
        console.log(
          'GOND register FCM token res: ',
          res,
          self.fcm.token,
          self.fcm.apnsToken
        );
        self.fcm.serverId = res.Value;
        return true;
      } catch (ex) {
        console.log('GOND register FCM token failed: ', ex);
        return false;
      }
    }),
    unregisterToken: flow(function* () {
      if (!appStore.deviceInfo.deviceId) return;

      try {
        const res = yield apiService.delete(
          FCMRoute.controller,
          appStore.deviceInfo.deviceId
        );
        if (res.error || !res.Value) {
          __DEV__ && console.log('GOND unregisterToken failed: ', res);
          return false;
        }

        return res;
      } catch (ex) {
        console.log('GOND unregister FCM token failed: ', ex);
        return false;
      }
    }),
    // #endregion
    // #region Settings:
    hasPermission(id) {
      return !!self.modules.find(mod => mod.functionId == id);
    },
    updateProfile: flow(function* (data) {
      self.user.updateProfile(data);
      let res = yield apiService.put(
        UserRoute.controller,
        null,
        null,
        self.user.dataForProfileUpdate
      );
      // __DEV__ && console.log('GOND update user profile: ', res);
      if (res.error) return false;
      res = yield self.saveLocal();
      __DEV__ && console.log('GOND update user profile save local: ', res);
      return res;
    }),
    onProfileUpdated(data) {
      let {photo, profile, module} = data;
      let user = state;
      if (module && Array.isArray(module)) {
        self.modules = [];
        self.routes = [];
        module.forEach(item => {
          self.modules.push(getDefaultModule().parse(item));
          if (item.FunctionName == MODULES.MODULE_SITE) {
            self.routes = [...self.routes, ROUTERS.ALARM, ROUTERS.HEALTH];
          } else if (item.FunctionName == MODULES.MODULE_REBAR) {
            self.routes = [...self.routes, ROUTERS.POS];
          }
          self.routes.push(ROUTERS.OPTIONS);
        });
      } else {
        self.routes = [ROUTERS.OPTIONS];
      }

      if (photo) self.avatar = photo;
      if (profile) {
        self.email = profile.Email;
        self.firstName = profile.FName;
        self.lastName = profile.LName;
        self.isAdmin = profile.IsAdmin;
        self.error = data.error;
      }
      return {...user};
    },
    getNotifySettings: flow(function* () {
      let res = yield apiService.get(
        AccountRoute.controller,
        self.user.userId,
        AccountRoute.getNotifySettings
      );
      if (res.error) {
        __DEV__ && console.log('GOND getNotifySetting failed: ', res.error);
        snackbarUtil.handleRequestFailed();
        return false;
      } else {
        // __DEV__ && console.log('GOND getNotifySettings: ', res);
        res.NotifySelected &&
          (self.settings.selectedNotifies = [...res.NotifySelected]);
        res.ExceptionSelected &&
          (self.settings.selectedExceptions = [...res.ExceptionSelected]);
        return true;
      }
    }),
    updateNotifySettings: flow(function* (newSetting) {
      let res = yield apiService.post(
        AccountRoute.controller,
        self.user.userId,
        AccountRoute.updateNotifySettings,
        JSON.stringify({
          NotifySelected: newSetting.selectedNotifies,
          ExceptionSelected: newSetting.selectedExceptions,
        })
      );
      // __DEV__ && console.log('GOND updateNotifySettings: ', res);
      snackbarUtil.handleSaveResult(res);
      res && !res.error && self.getNotifySettings();
    }),
    getAlertTypesSettings: flow(function* () {
      let res = yield apiService.get(
        AccountRoute.controller,
        self.user.userId,
        AccountRoute.getAlertSettings
      );
      __DEV__ && console.log('GOND getAlertTypesSettings: ', res);
      if (!res || res.error) {
        __DEV__ && console.log('!!! GOND getAlertTypesSetting failed: ', res);
        // snackbarUtil.handleRequestFailed();
        return false;
      } else {
        if (!Array.isArray(res)) {
          __DEV__ &&
            console.log(
              'GOND getAlertTypeSettings failed: result is not an array.'
            );
          return;
        }
        self.settings.alertTypes = res.map(alertType =>
          parseAlertType(alertType)
        );
        return true;
      }
    }),
    setActivites: flow(function* (reportId) {
      __DEV__ && console.log('setActivites ', `reportId=${reportId}`);
      const isScreenSwitch = reportId > clientLogID.LOGOUT;

      let model = {
        LogID:
          isScreenSwitch || reportId == clientLogID.APP_TO_BACKGROUND
            ? moduleSwitchLogId
            : loginLogId,
        UserID: self.user.UserID,
        AccessTime: new Date(),
        ClientTime: toUTCDate(new Date()),
        // ReportID: reportId,
        ClientName: APP_INFO.Name,
        Version: APP_INFO.Version,
        ClientType:
          Platform.OS == 'ios'
            ? ClientType.CMS_MOBILE_IOS
            : ClientType.CMS_MOBILE_ANDROID,
      };

      if (
        reportId != clientLogID.APP_TO_FOREGROUND &&
        reportId != clientLogID.APP_TO_BACKGROUND
      ) {
        model.ReportID = reportId;
        lastReportId = reportId;
      } else {
        model.ReportID = lastReportId;
      }

      let logId = 0;

      //set activity STOP OLD activity
      if (reportId != clientLogID.APP_TO_FOREGROUND) {
        logId = yield apiService.post(
          ACConfig.controller,
          self.user.userId,
          ACConfig.setActivites,
          model
        );
        __DEV__ &&
          console.log(
            'setActivites 1st request STOP OLD activity',
            `logId=${JSON.stringify(logId)}`
          );

        if (isScreenSwitch) moduleSwitchLogId = logId;
        else loginLogId = logId;
      }

      //set activity START NEW activity
      if (reportId != clientLogID.APP_TO_BACKGROUND) {
        if (logId == 0) {
          model.LogID = 0;
          logId = yield apiService.post(
            ACConfig.controller,
            self.user.userId,
            ACConfig.setActivites,
            model
          );
          __DEV__ &&
            console.log(
              'setActivites 2nd request START NEW activity',
              `logId=${JSON.stringify(logId)}`
            );

          if (isScreenSwitch) moduleSwitchLogId = logId;
          else loginLogId = logId;
        }
      }
      return true;
    }),
    // #endregion
  }));

const userStore = UserStoreModel.create({
  user: createAnonymousUser(),
  domain: '',
  error: '',
  message: '',
  isLoggedIn: false,
  fcm: FCMModel.create({token: '', apnsToken: '', serverId: ''}),
  api: getDefaultAPI(),
  modules: [],
  routes: [],
  settings: UserSettingsModel.create({
    selectedNotifies: [],
    selectedExceptions: [],
    alertTypes: [],
  }),
  widgetCounts: null,
  moduleUpdatedFlag: false,
  isSubmitForgotPassLoading: false,
});

export default userStore;
