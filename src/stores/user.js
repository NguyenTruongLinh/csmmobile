import {types, flow} from 'mobx-state-tree';
import {Alert} from 'react-native';

import {MODULES, Orient} from '../consts/misc';
import APP_INFO from '../consts/appInfo';
import ROUTERS from '../consts/routes';

import {Route, Account} from '../consts/apiRoutes';
import {Login as LoginTxt} from '../localization/texts';
import apiService from '../services/api';
import dbService from '../services/localdb';
import appStore from './appStore';
// import navigationService from '../navigation/navigationService';

// TODO: fixit
// const AppId = '4d53bce03ec34c0a911182d4c228ee6c';
import {LocalDBName} from '../consts/misc';
import {isNullOrUndef} from '../util/general';

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

const getDefaultModule = () => {
  console.log('GOND defaultmodule');
  return ModuleModel.create({
    moduleId: 0,
    functionId: 0,
    functionName: '',
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
    get() {
      const {url, appId, version, id, apiKey, token} = self;
      return {url, appId, version, id, apiKey, token};
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
  .actions(self => ({
    parse(_user) {
      self.userId = _user.UserID;
      self.userName = _user.UName || '';
      self.firstName = _user.FName;
      self.lastName = _user.LName;
      self.email = _user.Email;
      self.avatar = _user.UPhoto || undefined;
      self.isAdmin = _user.IsAdmin;
      // self.isAuth = true;
    },
    get() {
      const {userId, userName, firstName, lastName, email, isAdmin} = self;
      return {
        userId,
        userName,
        firstName,
        lastName,
        email,
        isAdmin,
        // avatar: '', // not saving/editing avatar
      };
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
    fcmKey: types.string,
    serverid: types.string,
  })
  .actions(self => ({
    parse(data) {
      self.fcmKey = data.fcm;
      self.serverid = data.serverid;
    },
  }));

export const UserDataModel = types
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
    // async login(domainname, username, password) {
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
      console.log('GOND login res = ', res);
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
      } catch (err) {
        console.log('GOND load user profile error: ', err);
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
      yield self.getUserPhoto();
      yield self.getPrivilege();
      let {configToken} = apiService.getConfig();
      if (configToken) {
        self.api.id = configToken.id;
        self.api.apiKey = configToken.apiKey;
        self.api.token = configToken.token;
      }

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
    logout: flow(function* logOut() {
      if (!self.deleteLocal()) return false;
      self.user = createAnonymousUser();
      self.error = '';
      self.message = '';
      self.isLoggedIn = false;
      self.fcm = null;
      self.api = null;
      self.modules = [];
      self.routes = [];
      return true;
    }),
    didShowError() {
      self.error = '';
    },
    loginError(errorMessage) {
      self.error = errorMessage;
    },
    passwordUpdated(data) {
      self.error = data.error;
      self.message = data.message;
    },
    getUserPhoto: flow(function* getUserPhoto() {
      if (self.user && self.user.userId) {
        try {
          let res = yield apiService.getBase64Stream(
            Account.controller,
            self.user.userId,
            Account.avatar
          );
          __DEV__ && console.log('GOND get user photo res: ', res);
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
            Account.controller,
            self.user.userId,
            Account.modules
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
            res.forEach(item => {
              const newModule = getDefaultModule();
              newModule.parse(item);
              self.modules.push(newModule);
            });
            return true;
          }
        } catch (err) {
          __DEV__ && console.log('GOND get user module failed: ', err);
          return false;
        }
      }
      return false;
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
    saveLocal: flow(function* saveLocal() {
      let data = self.user.get();
      data.api = self.api.get();
      let res = yield self.deleteLocal();
      res && (res = yield dbService.add(LocalDBName.user, data));
      __DEV__ && console.log('GOND user save local: ', res);
      return res == true;
    }),
    deleteLocal: flow(function* deleteLocal() {
      let res = yield dbService.delete(LocalDBName.user);
      __DEV__ && console.log('GOND user delete local: ', res);
      return res;
    }),
    loadLocalData: flow(function* loadLocalData() {
      const savedData = yield dbService.getFirstData(LocalDBName.user);
      __DEV__ && console.log('GOND user load local data: ', savedData);
      if (savedData && typeof savedData === 'object') {
        try {
          self.user = UserModel.create(savedData);
          self.api = APIModel.create(savedData.api);
        } catch (err) {
          __DEV__ && console.log('GOND load user local data failed: ', err);
          self.error = err;
          return false;
        }
        self.error = '';
        return true;
      }
      return false;
    }),
    shouldAutoLogin: flow(function* shouldAutoLogin() {
      const shouldLogin = yield self.loadLocalData();
      if (!appStore.deviceInfo || !appStore.deviceInfo.deviceId) {
        yield appStore.loadLocalData();
      }
      if (shouldLogin) {
        self.setConfigApi();

        let res = yield self.getUserPhoto();
        __DEV__ && console.log('GOND getUPhoto: ', res);
        res && (self.isLoggedIn = yield self.getPrivilege());
        // if (!self.isLoggedIn) self.deleteLocal();
        return self.isLoggedIn;
      }
      return false;
    }),
    updateProfile: flow(function* updateProfile(data) {
      self.user.updateProfile(data);
      let res = yield apiService.put(
        Account.controller,
        null,
        null,
        self.user.get()
      );
      return !res.error;
    }),
  }));

const userStore = UserDataModel.create({
  user: createAnonymousUser(),
  domain: '',
  error: '',
  message: '',
  isLoggedIn: false,
  fcm: FCMModel.create({fcmKey: '', serverid: ''}),
  api: getDefaultAPI(),
  modules: [],
  routes: [],
});

export default userStore;
