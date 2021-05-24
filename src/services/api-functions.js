const _Account = {
  controller:"account",
  get:"",
  post:"",
  avartar:"avartar",
  getsettingalert:"settingalert",
  modules:"modules",
  getsettingnotify:"settingnotify",
  editsettingnotify:"EditUserNotifySettings"
};

const _Alertype = {
  controller:"alerttype",
  get:"",
  getalerttypeVA:"getalerttypeva"
};
const _Site ={
  controller:"site",
  get:"all=true",
  getdvrname:"?all=true&dvr=true",
  getsitepvm:"?all=true&dvr=true&filter=pvm",


}
const _Alert ={
  controller: "alert",
  getbydvr:"dvr",
  IgnoreMutiAlertType: "IgnoreMutiAlertType",
  IgnoreMutiAlertSite: "IgnoreMutiAlertSite"
} 

const _DVR = {
  controller: "dvr",
  getconnection: 'infoconnectvideo',
  getchannels: 'channels',
  getallchannels: "getallchannels" 
}

const _Users = {
  controller: "users",
  updateprofile: 'updateprofile'
}

const _Excp =
{
  controller: "exception",
  get:"get",
  gettransactiontypes:"GetTransactionTypes"
}

const _Channel ={
  controller:"channel"

}

const _ACConfig =
{
  controller: "ACConfig",
  get:"get",
  GetRatingConfig:"GetRatingConfig",
  GetUserLog:"GetUserLog",
  setActivites:"setActivites"
}

const _VSC ={
  controller: "VSC",
  RequestVSCURL :"RequestVSCURL",
  UpdateStream:"Update",
  GetHLSStream: "GetHLSStream",
  Cloud:"Cloud",
  Setting:"Setting",
  ActiveChannels:"ActiveChannels",
  GetActiveChannels: "GetVSCActiveChannel",
  UpdateActiveChannels: "UpdateVSCActiveChannel",
}

const _PVM = {
  controller: 'PVM',
  GetLastDoorCountData: 'GetLastDoorCountData',
  AcknowledgePVMAlert : 'AcknowledgePVMAlert'
}

module.exports = {
  Account: _Account,
  Alertype: _Alertype,
  Site: _Site,
  Alert: _Alert,
  DVR: _DVR,
  Excp:  _Excp,
  Users:  _Users,
  Channel:  _Channel,
  ACConfig: _ACConfig,
  VSC: _VSC,
  PVM: _PVM,
}
