import {types /*, onSnapshot*/} from 'mobx-state-tree';

const AlarmRate = types.model({
  RateID: types.identifierNumber,
  RateName: types.string,
});

const AlarmTypeVA = types.model({
  Id: types.identifierNumber,
  Name: types.string,
});

const AlarmSnapShot = types.model({
  Channel: types.integer,
  Time: types.number,
  FileName: types.string,
  ChannelName: types.string,
});

const AlarmAddress = types.model({
  AddressLine1: types.maybeNull(types.string),
  AddressLine2: types.maybeNull(types.string),
  City: types.maybeNull(types.string),
  StateProvince: types.maybeNull(types.string),
  Country: types.maybeNull(types.string),
  ZipCode: types.maybeNull(types.string),
});

const AlarmThumb = types.model({
  base64_thumnail: types.maybeNull(types.string),
});

const AlarmData = types.model({
  KAlertEvent: types.integer,
  KAlertTypeVA: types.integer,
  CMSUser: types.maybeNull(types.string),
  Status: types.integer,
  UpdateTime: types.number,
  Rate: types.integer,
  Note: types.maybeNull(types.string),
  Image: types.string,
  ImageTime: types.number,
  Thumbnail: types.string,
  Severity: types.integer,
  ServerID: types.string,
  Site: types.string,
  SiteName: types.string,
  ServerIP: types.string,
  dtUpdateTime: types.string,
  SnapShot: types.array(AlarmSnapShot),
  Address: types.array(AlarmAddress),
  IsManual: types.boolean,
  ActionName: types.string,
  Extra: types.maybeNull(types.string),
  TemperatureImage: types.string,
  KAlertType: types.integer,
  KDVR: types.integer,
  TimeZone: types.string,
  DVRUser: types.string,
  Description: types.string,
  Time: types.string,
  Channel: types.integer,
  AlertType: types.string,
  ChanMask: types.number, // BigInt
  thumb: AlarmThumb,
});

const AlarmTime = types.model({
  stime: types.integer,
  etime: types.integer,
});

const AlarmFilter = types.model({
  time: AlarmTime,
  aty: types.string,
  sdate: types.string,
  edate: types.string,
});

export const AlarmModel = types
  .model({
    // id: types.identifier,
    rateConfig: types.map(AlarmRate),
    vaConfig: types.map(AlarmTypeVA),
    alarmList: types.array(AlarmData),
    filter: types.maybeNull(AlarmFilter),
    alarmPage: types.string,
  })
  .actions(self => ({
    loadRateConfig(config) {
      if (Array.isArray(config)) {
        config.forEach(item => self.rateConfig.put(item));
      }
    },
    loadVAConfig(config) {
      if (Array.isArray(config)) {
        config.forEach(item => self.vaConfig.put(item));
      }
    },
  }));

export const alarmStore = AlarmModel.create({
  rateConfig: {},
  vaConfig: {},
  alarmList: [],
  filter: null,
  alarmPage: '',
});

// export default alarmStore;
