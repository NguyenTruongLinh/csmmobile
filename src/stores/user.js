import {types, flow} from 'mobx-state-tree';
import {Alert} from 'react-native';

import {MODULES, Orient} from '../consts/misc';
import APP_INFO from '../consts/appInfo';
import ROUTERS from '../consts/routes';

import {
  Route,
  Account as AccountRoute,
  Users as UserRoute,
  FCM as FCMRoute,
} from '../consts/apiRoutes';
import {Login as LoginTxt} from '../localization/texts';
import apiService from '../services/api';
import dbService from '../services/localdb';
import appStore from './appStore';

// TODO: fixit
// const AppId = '4d53bce03ec34c0a911182d4c228ee6c';
import {isNullOrUndef} from '../util/general';
import snackbarUtil from '../util/snackbar';
import {LocalDBName} from '../consts/misc';

const ModuleModel = types
  .model({
    moduleId: types.number,
    functionId: types.number,
    functionName: types.string,
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

const APIModel = types
  .model({
    url: types.string,
    appId: types.string,
    version: types.string,
    id: types.string,
    apiKey: types.string,
    token: types.string,
    // devId: types.string,
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
      // self.devId = _api._ApiToken.devId || self.devId;
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
    // devId: '',
  });

const UserModel = types
  .model({
    userId: types.maybeNull(types.number),
    userName: types.string,
    firstName: types.string,
    lastName: types.string,
    email: types.string,
    avatar: types.maybeNull(types.string),
    // isAuth: types.boolean,
    isAdmin: types.boolean,
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
      self.userName = _user.UName ?? '';
      self.firstName = _user.FName ?? '';
      self.lastName = _user.LName ?? '';
      self.email = _user.Email ?? '';
      self.avatar = _user.UPhoto ?? '';
      self.isAdmin = _user.IsAdmin ?? '';
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
      self.token = fcmToken;
      self.apnsToken = apnsToken;
    },
  }));

const AlertTypeModel = types.model({
  id: types.identifierNumber,
  kAlertSeverity: types.number,
  name: types.string,
  cmsWebType: types.number,
  cmsWebGroup: types.number,
  displayStatus: types.number,
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
  })
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
    login: flow(function* login(domainname, username, password) {
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
        // devId: appStore.deviceInfo.deviceId,
      });

      self.setConfigApi();
      // const res = await apiService.login(username, password);
      const res = yield apiService.login(username, password);
      __DEV__ && console.log('GOND login res = ', res);
      if (res && res.status == 200 && res.Result) {
        self.loginSuccess(res);
      } else {
        self.loginFailed(res);
      }
      appStore.setLoading(false);
    }),
    loginSuccess: flow(function* loginSuccess(data) {
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

      self.getDataPostLogin();
      self.saveLocal(); // no need to yield
      // clear login info
      self.loginInfo.postLogin();
    }),
    loginFailed(data) {
      if (data.status === 401) {
        self.error = LoginTxt.errorLoginIncorrect;
      } else {
        self.error = LoginTxt.errorLoginCantConnect;
      }
      self.isLoggedIn = false;
    },
    logout: flow(function* logout() {
      if (!self.deleteLocal()) return false;
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
    getDataPostLogin: flow(function* getDataPostLogin() {
      try {
        const [uPhotoRes, modulesRes, alertTypesRes, registerTokenRes] =
          yield Promise.all([
            self.getUserPhoto(),
            self.getPrivilege(),
            self.getAlertTypesSettings(),
            self.registerToken(),
          ]);
        __DEV__ &&
          console.log(
            'GOND getDataPostLogin ',
            uPhotoRes,
            modulesRes,
            alertTypesRes,
            registerTokenRes
          );
        return uPhotoRes && modulesRes; // && alertTypesRes;
      } catch (err) {
        __DEV__ && console.log('GOND getDataPostLogin failed: ', err);
        snackbarUtil.handleRequestFailed();
        return false;
      }
    }),
    passwordUpdated(data) {
      self.error = data.error;
      self.message = data.message;
    },
    getUserPhoto: flow(function* getUserPhoto() {
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
    getPrivilege: flow(function* getPrivilege() {
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
          if (
            Array.isArray(res) // ||
            // (typeof res == 'object' &&
            //   res.status == 200 &&
            //   Array.isArray(res.data))
          ) {
            self.modules = res.map(item => parseModule(item));
            return true;
          }
        } catch (err) {
          __DEV__ && console.log('GOND get user module failed: ', err);
          return false;
        }
      }
      return false;
    }),
    // #endregion
    // #region local data
    saveLocal: flow(function* saveLocal() {
      try {
        let data = self.user.data;
        data.api = self.api.data;
        data.domain = self.domain;
        let localUser = yield dbService.getFirstData(LocalDBName.user);

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
    deleteLocal: flow(function* deleteLocal() {
      let res = yield dbService.delete(LocalDBName.user);
      // __DEV__ && console.log('GOND user delete local: ', res);
      return res;
    }),
    loadLocalData: flow(function* loadLocalData() {
      const savedData = yield dbService.getFirstData(LocalDBName.user);

      // __DEV__ && console.log('GOND user load local data: ', savedData);
      if (savedData && typeof savedData === 'object') {
        try {
          self.user = UserModel.create(savedData);
          self.domain = savedData.domain ?? '';
          self.api = APIModel.create(savedData.api);
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
    shouldAutoLogin: flow(function* shouldAutoLogin() {
      appStore.setLoading(true);
      const shouldLogin = yield self.loadLocalData();
      if (!appStore.deviceInfo || !appStore.deviceInfo.deviceId) {
        yield appStore.loadLocalData();
      }
      if (shouldLogin) {
        self.isLoggedIn = yield self.getDataPostLogin();
        if (!self.isLoggedIn) self.deleteLocal();
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
      if (self.fcm.token != fcmToken) {
        __DEV__ && console.log('GOND save token: ', fcmToken);
        self.fcm.token = fcmToken;

        apnsToken && (self.fcm.apnsToken = apnsToken);
        if (self.isLoggedIn) self.registerToken();
      }
    },
    registerToken: flow(function* registerToken() {
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
          console.log('GOND register FCM token error: ', res);
          return false;
        }
        console.log('GOND register FCM token res: ', res);
        self.fcm.serverId = res.Value;
        return true;
      } catch (ex) {
        console.log('GOND register FCM token failed: ', ex);
        return false;
      }
    }),
    unregisterToken: flow(function* unregisterToken() {
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
    updateProfile: flow(function* updateProfile(data) {
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
    getNotifySettings: flow(function* getNotifySettings() {
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
    updateNotifySettings: flow(function* updateNotifySettings(newSetting) {
      let res = yield apiService.post(
        AccountRoute.controller,
        self.user.userId,
        AccountRoute.updateNotifySettings,
        newSetting
      );
      // __DEV__ && console.log('GOND updateNotifySettings: ', res);
      snackbarUtil.handleSaveResult(res);
      res && !res.error && self.getNotifySettings();
    }),
    getAlertTypesSettings: flow(function* getAlertTypesSettings() {
      let res = yield apiService.get(
        AccountRoute.controller,
        self.user.userId,
        AccountRoute.getAlertSettings
      );
      // __DEV__ && console.log('GOND getAlertTypesSettings: ', res);
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
});

export default userStore;
