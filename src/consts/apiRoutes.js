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
  changePassword: 'changePassword',
  profile: 'profile',
  i3hostLogin: 'i3hostlogin',
  i3hostOtp: 'i3hostotp',
};

export const AlertType = {
  controller: 'alerttype',
  get: '',
  getAlertTypeVA: 'getalerttypeva',
};

export const Site = {
  controller: 'site',
  getAll: 'all=true',
  getAllWithDVR: '?all=true&dvr=true',
  getSiteOam: '?all=true&dvr=true&filter=pvm',
  getAllRegions: 'getallregions',
  getRegionSites: 'getregions',
  getNVRAndSitePermission: 'GetSiteByIdNVRPermission',
  getNVRPermission: 'GetNVRPermissionById',
};

export const Alert = {
  controller: 'alert',
  getByDvr: 'dvr',
  ignoreMutiAlertType: 'IgnoreMutiAlertType',
  ignoreMutiAlertSite: 'IgnoreMutiAlertSite',
};

export const Health = {
  controller: 'Mobile_SiteAlert',
  summary: 'alertsummary',
  dvrAlerts: 'GetAlertLastByDvrs',
  dvrSensorAlerts: 'GetSensorsAlertByDvrs',
};

export const DVR = {
  controller: 'dvr',
  getConnection: 'infoconnectvideo',
  getChannels: 'channels',
  getAllChannels: 'getallchannels',
  getTimezone: 'GetTimeZone',
};

export const Users = {
  controller: 'users',
  updateProfile: 'updateprofile',
  alertCount: 'AlertCount',
  resetAlert: 'ResetAlert',
};

export const Exception = {
  controller: 'exception',
  get: 'get',
  getTransactionTypes: 'GetTransactionTypes',
};

export const Transaction = {
  controller: 'transaction',
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
  getMultiURL: 'GetMultiURL',
  updateStream: 'Update',
  getHLSStream: 'GetHLSStream',
  getHLSData: 'GetStreamData',
  cloud: 'Cloud',
  setting: 'Setting',
  activeChannels: 'ActiveChannels',
  getActiveChannels: 'GetVSCActiveChannel',
  updateActiveChannels: 'UpdateVSCActiveChannel',
  linkNVRUser: 'LinkNVRUserToCMS',
  SetDataUsageActivityLogs: 'SetDataUsageActivityLogs',
  SetRelayDataUsageActivityLogs: 'SetRelayDataUsageActivityLogs',
};
export const Server = {
  controller: 'Server',
  version: 'Version',
};

export const OAM = {
  controller: 'PVM',
  getLastDoorCountData: 'GetLastDoorCountData',
  acknowledgePVMAlert: 'AcknowledgePVMAlert',
};

export const FCM = {
  controller: 'fcm',
};

export const File = {
  controller: 'file',
  getMedia: 'media',
};

export const CommonActions = {
  imageTime: 'imagetime',
  image: 'image',
};
