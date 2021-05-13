import { types } from 'mobx-state-tree';
import {MODULES, ROUTERS, Orient} from "../consts/general"

const ModuleModel = types.model({
  moduleId: types.identifierNumber,
  functionId: types.integer(0),
  functionName: types.string,
}).actions(self => ({
  load(_module) {
    self.moduleId = _module.ModuleID;
    self.functionId = _module.FunctionID;
    self.functionName = _module.FunctionName;
  }
}));

const APIModel = types.model({
  url: types.string,
  appId: types.string,
  version: types.string,
  id: types.string,
  apiKey: types.string,
  token: types.string,
  devId: types.string,
}).actions(self => ({
  load(_api) {
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
  }
}));

const UserModel = types.model({
  userId: types.identifierNumber,
  userName: types.string,
  firstName: types.string,
  lastName: types.string,
  email: types.string,
  userPhoto: types.string,
  isAuth: types.boolean(false),
  isAdmin: types.boolean(false),
}).actions(self => ({
  load(_user) {
    self.userId = _user.UserID;
    self.userName = _user.UName;
    self.firstName = _user.FName;
    self.lastName = _user.LName;
    self.email = _user.Email;
    self.userPhoto = _user.UPhoto;
    self.isAdmin = _user.IsAdmin;
    self.isAuth = _user.isAuth;
  }
}));

const LoginModel = types.model({
  domainname: types.string,
  username: types.string,
  password: types.string,
});

const FCMModel = types.model({
  fcmkey: types.string,
  serverid: types.string,
}).actions(self => ({
  load(data) {
    self.fcmkey = data.fcm;
    self.serverid = data.serverid;
  }
}));

const userStore = types.model({
  user: types.maybeNull(UserModel),
  error: types.maybeNull(types.string, ''),
  loading: types.boolean(false),
  message: types.string,
  isLoggedIn: types.boolean(false),
  loginInfo: types.maybeNull(LoginModel),
  //
  fcm: types.maybeNull(FCMModel),
  api: types.maybeNull(APIModel),
  modules: types.array(ModuleModel),
  routes: types.array(types.string),
}).actions(self => ({
  logout() {
    self.user = UserModel.create();
    self.error = '';
    self.message = '';
    self.loading = false;
    self.isLoggedIn = false;
    self.fcm = null;
    self.api = null;
    self.modules = [];
    self.routes = [];
  },
  loginSuccess(data) {
    self.user.load(data);
    self.error = '';
    self.loading = false;
    self.message = data.message || '';
    self.isLoggedIn =  true;
    self.api = APIModel.create().load(data.Api);
    self.modules = [];
    if (Array.isArray(data.Modules)) {
      data.Modules.forEach(item => {
        self.modules.push(ModuleModel.create().load(item))
      });
    }
    self.api = APIModel.create().load(data.Api);
    self.routes = [];
    if (Array.isArray(data.routes)) {
      data.routes.forEach(item => {
        self.routes.push(item);
      })
    }
  },
  loginFailed(data) {
    self.loginInfo = LoginModel.create(data);
  },
  loginRequest() {
    self.loading = true;
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
    let { photo, profile, module} = data;
    let user = state;
    if(module && Array.isArray(module))
    {
      self.modules = [];
      self.routes = [];
      module.forEach(item => {
        self.modules.push(ModuleModel.create().load(item));
        if (item.FunctionName == MODULES.MODULE_SITE) {
          self.routes = [...self.routes, ROUTERS.ALARM, ROUTERS.HEALTH];
        } else if (item.FunctionName == MODULES.MODULE_REBAR) {
          self.routes = [...self.routes, ROUTERS.POS];
        }
        self.routes.push(ROUTERS.OPTIONS);
      })
    } else {
      self.routes = [ROUTERS.OPTIONS]
    }

    if(photo)
      self.userPhoto = photo;
    if( profile){
      self.email = profile.Email;
      self.firstName = profile.FName;
      self.lastName = profile.LName;
      self.isAdmin = profile.IsAdmin;
      self.error = data.error;
    }
    return { ... user};
  },
})).create({
  user: null,
  error: null,
  loading: false,
  message: '',
  isLoggedIn: false,
  fcm: null,
  api: null,
  modules: [],
  routes: [],
});

export default userStore;