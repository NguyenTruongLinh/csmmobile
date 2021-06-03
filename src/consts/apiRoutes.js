const _Account = {
  controller: 'account',
  get: '',
  post: '',
  avatar: 'avartar',
  getsettingalert: 'settingalert',
  modules: 'modules',
  getsettingnotify: 'settingnotify',
  editsettingnotify: 'EditUserNotifySettings',
};

const _Alertype = {
  controller: 'alerttype',
  get: '',
  getalerttypeVA: 'getalerttypeva',
};

const _Site = {
  controller: 'site',
  get: 'all=true',
  getdvrname: '?all=true&dvr=true',
  getsitepvm: '?all=true&dvr=true&filter=pvm',
};

const _Alert = {
  controller: 'alert',
  getbydvr: 'dvr',
  IgnoreMutiAlertType: 'IgnoreMutiAlertType',
  IgnoreMutiAlertSite: 'IgnoreMutiAlertSite',
};

const _DVR = {
  controller: 'dvr',
  getconnection: 'infoconnectvideo',
  getchannels: 'channels',
  getallchannels: 'getallchannels',
};

const _Users = {
  controller: 'users',
  updateprofile: 'updateprofile',
};

const _Exception = {
  controller: 'exception',
  get: 'get',
  gettransactiontypes: 'GetTransactionTypes',
};

const _Channel = {
  controller: 'channel',
};

const _ACConfig = {
  controller: 'ACConfig',
  get: 'get',
  GetRatingConfig: 'GetRatingConfig',
  GetUserLog: 'GetUserLog',
  setActivites: 'setActivites',
};

const _VSC = {
  controller: 'VSC',
  RequestVSCURL: 'RequestVSCURL',
  UpdateStream: 'Update',
  GetHLSStream: 'GetHLSStream',
  Cloud: 'Cloud',
  Setting: 'Setting',
  ActiveChannels: 'ActiveChannels',
  GetActiveChannels: 'GetVSCActiveChannel',
  UpdateActiveChannels: 'UpdateVSCActiveChannel',
};

const _OAM = {
  controller: 'PVM',
  GetLastDoorCountData: 'GetLastDoorCountData',
  AcknowledgePVMAlert: 'AcknowledgePVMAlert',
};

module.exports = {
  Route: '/api/3rd',
  Account: _Account,
  Alertype: _Alertype,
  Site: _Site,
  Alert: _Alert,
  DVR: _DVR,
  Exception: _Exception,
  Users: _Users,
  Channel: _Channel,
  ACConfig: _ACConfig,
  VSC: _VSC,
  OAM: _OAM,
};
