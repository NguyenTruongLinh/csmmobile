const _Account = {
  controller: 'account',
  get: '',
  post: '',
  avatar: 'avartar',
  getAlertSettings: 'settingalert',
  modules: 'modules',
  getNotifySettings: 'settingnotify',
  updateNotifySettings: 'EditUserNotifySettings',
};

const _Alertype = {
  controller: 'alerttype',
  get: '',
  getAlertTypeVA: 'getalerttypeva',
};

const _Site = {
  controller: 'site',
  getAll: 'all=true',
  getAllWithDVR: '?all=true&dvr=true',
  getSiteOam: '?all=true&dvr=true&filter=pvm',
};

const _Alert = {
  controller: 'alert',
  getByDvr: 'dvr',
  ignoreMutiAlertType: 'IgnoreMutiAlertType',
  ignoreMutiAlertSite: 'IgnoreMutiAlertSite',
};

const _DVR = {
  controller: 'dvr',
  getConnection: 'infoconnectvideo',
  getChannels: 'channels',
  getAllChannels: 'getallchannels',
};

const _Users = {
  controller: 'users',
  updateProfile: 'updateprofile',
};

const _Exception = {
  controller: 'exception',
  get: 'get',
  getTransactionTypes: 'GetTransactionTypes',
};

const _Channel = {
  controller: 'channel',
};

const _ACConfig = {
  controller: 'ACConfig',
  get: 'get',
  getRatingConfig: 'GetRatingConfig',
  getUserLog: 'GetUserLog',
  setActivites: 'setActivites',
};

const _VSC = {
  controller: 'VSC',
  requestVSCURL: 'RequestVSCURL',
  updateStream: 'Update',
  getHLSStream: 'GetHLSStream',
  cloud: 'Cloud',
  setting: 'Setting',
  activeChannels: 'ActiveChannels',
  getActiveChannels: 'GetVSCActiveChannel',
  updateActiveChannels: 'UpdateVSCActiveChannel',
};

const _OAM = {
  controller: 'PVM',
  getLastDoorCountData: 'GetLastDoorCountData',
  acknowledgePVMAlert: 'AcknowledgePVMAlert',
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
