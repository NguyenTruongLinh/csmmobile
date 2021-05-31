import {types, flow} from 'mobx-state-tree';
import {Alert} from 'react-native';

import {MODULES, Orient, APP_INFO} from '../consts/misc';
import ROUTERS from '../consts/routes';

import {Route, Account} from '../consts/apiRoutes';
import {Login as LoginTxt} from '../localization/texts';
import apiService from '../services/api';
import dbService from '../services/localdb';
import appStore from './appStore';

// TODO: fixit
// const AppId = '4d53bce03ec34c0a911182d4c228ee6c';

const ModuleModel = types
  .model({
    moduleId: types.identifierNumber,
    functionId: types.integer,
    functionName: types.string,
  })
  .actions(self => ({
    load(_module) {
      self.moduleId = _module.ModuleID;
      self.functionId = _module.FunctionID;
      self.functionName = _module.FunctionName;
    },
  }));

const getDefaultModule = () =>
  ModuleModel.create({
    moduleId: 0,
    functionId: 0,
    functionName: '',
  });

const APIModel = types
  .model({
    url: types.string,
    appId: types.string,
    version: types.string,
    id: types.string,
    apiKey: types.string,
    token: types.string,
    devId: types.string,
  })
  .actions(self => ({
    load(_api) {
      console.log('GOND load _api: ', _api);
      if (!_api._Api || !_api._ApiToken) {
        console.log('GOND API is not valid!');
        return false;
      }
      self.url = _api._Api.Url;
      self.appId = _api._Api.AppId;
      self.version = _api._Api.Version;
      self.id = _api._ApiToken.Id;
      self.apiKey = _api._ApiToken.ApiKey;
      self.token = _api._ApiToken.Token;
      self.devId = _api._ApiToken.devId;
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
    devId: '',
  });

const UserModel = types
  .model({
    userId: types.maybeNull(types.number),
    userName: types.string,
    firstName: types.string,
    lastName: types.string,
    email: types.string,
    userPhoto: types.maybe(types.string),
    isAuth: types.boolean,
    isAdmin: types.boolean,
  })
  .actions(self => ({
    load(_user) {
      self.userId = _user.UserID;
      self.userName = _user.UName || '';
      self.firstName = _user.FName;
      self.lastName = _user.LName;
      self.email = _user.Email;
      self.userPhoto = _user.UPhoto || undefined;
      self.isAdmin = _user.IsAdmin;
      self.isAuth = true;
    },
  }));

const createAnonymousUser = () =>
  UserModel.create({
    userId: 0,
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    userPhoto: '',
    isAuth: false,
    isAdmin: false,
  });

const LoginModel = types.model({
  domainname: types.string,
  username: types.string,
  password: types.string,
});

const FCMModel = types
  .model({
    fcmkey: types.string,
    serverid: types.string,
  })
  .actions(self => ({
    load(data) {
      self.fcmkey = data.fcm;
      self.serverid = data.serverid;
    },
  }));

export const UserDataModel = types
  .model({
    user: types.maybeNull(UserModel),
    error: types.maybeNull(types.string),
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
    // async login(domainname, username, password) {
    login: flow(function* login(domainname, username, password) {
      appStore.setLoading(true);
      self.error = '';
      self.loginInfo = LoginModel.create({
        domainname,
        username,
        password,
      });

      apiService.updateConfig(
        {
          Url: domainname + Route,
          AppId: APP_INFO.AppId,
          Version: APP_INFO.Version,
        },
        {
          Id: '',
          ApiKey: '',
          Token: '',
        }
      );

      // const res = await apiService.login(username, password);
      const res = yield apiService.login(username, password);
      console.log('GOND login res = ', res);
      if (res && res.status == 200 && res.Result) {
        try {
          self.user.load(res.Result);
        } catch (err) {
          console.log('GOND load user profile error: ', err);
          self.isLoggedIn = false;
          self.error = err;
          appStore.setLoading(false);
          return;
        }
        self.error = '';
        self.message = res.message || '';
        self.isLoggedIn = true;

        self.api = res.Api
          ? getDefaultAPI().load(res.Api)
          : APIModel.create({
              url: domainname,
              appId: APP_INFO.AppId,
              version: APP_INFO.Version,
              id: '',
              apiKey: '',
              token: '',
              devId: '', // load from db
            });

        self.modules = [];
        if (Array.isArray(res.Modules)) {
          res.Modules.forEach(item => {
            self.modules.push(getDefaultModule().load(item));
          });
        }
        self.routes = [];
        if (Array.isArray(res.routes)) {
          res.routes.forEach(item => {
            self.routes.push(item);
          });
        }
        console.log(
          'GOND logged in modules = ',
          self.modules,
          '\n --- routes: ',
          self.routes
        );
      } else {
        if (res.status === 401) {
          self.error = LoginTxt.errorLoginIncorrect;
        } else {
          self.error = LoginTxt.errorLoginCantConnect;
        }
        self.isLoggedIn = false;
      }
      appStore.setLoading(false);
    }),
    logout() {
      self.user = createAnonymousUser();
      self.error = '';
      self.message = '';
      self.isLoggedIn = false;
      self.fcm = null;
      self.api = null;
      self.modules = [];
      self.routes = [];
    },
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
    profileUpdated(data) {
      let {photo, profile, module} = data;
      let user = state;
      if (module && Array.isArray(module)) {
        self.modules = [];
        self.routes = [];
        module.forEach(item => {
          self.modules.push(getDefaultModule().load(item));
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

      if (photo) self.userPhoto = photo;
      if (profile) {
        self.email = profile.Email;
        self.firstName = profile.FName;
        self.lastName = profile.LName;
        self.isAdmin = profile.IsAdmin;
        self.error = data.error;
      }
      return {...user};
    },
  }));

const userStore = UserDataModel.create({
  user: createAnonymousUser(),
  error: '',
  message: '',
  isLoggedIn: false,
  fcm: null,
  api: null,
  modules: [],
  routes: [],
});

export default userStore;
