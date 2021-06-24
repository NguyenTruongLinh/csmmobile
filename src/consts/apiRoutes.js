export const Route = '/api/3rd';

export const Account = {
  controller: 'account',
  get: '',
  post: '',
  avatar: 'avartar',
  getAlertSettings: 'settingalert',
  modules: 'modules',
  getNotifySettings: 'settingnotify',
  updateNotifySettings: 'EditUserNotifySettings',
};

export const Alertype = {
  controller: 'alerttype',
  get: '',
  getAlertTypeVA: 'getalerttypeva',
};

export const Site = {
  controller: 'site',
  getAll: 'all=true',
  getAllWithDVR: '?all=true&dvr=true',
  getSiteOam: '?all=true&dvr=true&filter=pvm',
};

export const Alert = {
  controller: 'alert',
  getByDvr: 'dvr',
  ignoreMutiAlertType: 'IgnoreMutiAlertType',
  ignoreMutiAlertSite: 'IgnoreMutiAlertSite',
};

export const DVR = {
  controller: 'dvr',
  getConnection: 'infoconnectvideo',
  getChannels: 'channels',
  getAllChannels: 'getallchannels',
};

export const Users = {
  controller: 'users',
  updateProfile: 'updateprofile',
};

export const Exception = {
  controller: 'exception',
  get: 'get',
  getTransactionTypes: 'GetTransactionTypes',
};

export const Channel = {
  controller: 'channel',
};

export const ACConfig = {
  controller: 'ACConfig',
  get: 'get',
  getRatingConfig: 'GetRatingConfig',
  getUserLog: 'GetUserLog',
  setActivites: 'setActivites',
};

export const VSC = {
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

export const OAM = {
  controller: 'PVM',
  getLastDoorCountData: 'GetLastDoorCountData',
  acknowledgePVMAlert: 'AcknowledgePVMAlert',
};

export const FCM = {
  controller: 'fcm',
};
