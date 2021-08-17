import {flow, types /*, onSnapshot*/, applySnapshot} from 'mobx-state-tree';
import apiService from '../services/api';
import BigNumber from 'bignumber.js';
import snackbarUtil from '../util/snackbar';
import util from '../util/general';

import {No_Image} from '../consts/images';
import {AlertTypes, AlertType_Support} from '../consts/misc';
import {ACConfig, Alert, AlertType} from '../consts/apiRoutes';

const ID_Canned_Message = 5;

const AlarmRate = types.model({
  rateId: types.identifierNumber,
  rateName: types.string,
});

const AlarmTypeVA = types.model({
  id: types.identifierNumber,
  name: types.string,
});

const AlarmSnapshot = types
  .model({
    channelNo: types.number,
    time: types.number,
    fileName: types.maybeNull(types.string),
    channelName: types.string,
    image: types.maybeNull(types.frozen()),
    isLoading: types.boolean,
  })
  .actions(self => ({
    getImage: flow(function* getImage(kDVR, kAlertEvent, isTempSDAlert) {
      if (self.channelNo < 0 || self.time == 0) {
        self.image = {url_thumnail: No_Image};
        return;
      }
      self.isLoading = true;
      try {
        const res = yield apiService.getBase64Stream(
          Alert.controller,
          String(isTempSDAlert ? kAlertEvent : self.time),
          isTempSDAlert ? Alert.image : Alert.imageTime,
          {
            thumb: true,
            kdvr: kDVR,
            ch: self.channelNo,
            next: null,
            download: false,
          }
        );

        if (res && res.status == 200) {
          // __DEV__ && console.log('GOND get snapshot image success: ', res);
          self.image = {base64_thumnail: res.data};
        } else {
          __DEV__ && console.log('GOND get snapshot image failed: ', res);
          self.image = {url_thumnail: No_Image};
        }
      } catch (err) {
        __DEV__ && console.log('GOND get snapshot image error: ', err);
        self.image = {url_thumnail: No_Image};
      }
      self.isLoading = false;
    }),
  }));

const AlarmAddress = types.model({
  addressLine1: types.maybeNull(types.string),
  addressLine2: types.maybeNull(types.string),
  city: types.maybeNull(types.string),
  stateProvince: types.maybeNull(types.string),
  country: types.maybeNull(types.string),
  zipCode: types.maybeNull(types.string),
});

// base64_thumnail: types.maybeNull(types.string),
// const AlarmThumb = types.model({
// });

const ExtraData = types.model({
  key: types.string,
  value: types.string,
});

const AlarmData = types
  .model({
    kAlertEvent: types.identifierNumber,
    kAlertTypeVA: types.number,
    cmsUser: types.maybeNull(types.string),
    status: types.number,
    updateTime: types.number,
    rate: types.number,
    note: types.maybeNull(types.string),
    image: types.string,
    imageTime: types.number,
    thumbnail: types.maybeNull(types.string),
    severity: types.number,
    serverID: types.string,
    site: types.string,
    siteName: types.string,
    serverIP: types.string,
    dtUpdateTime: types.string,
    snapshot: types.array(AlarmSnapshot),
    address: types.maybeNull(AlarmAddress),
    isManual: types.boolean,
    actionName: types.string,
    extra: types.array(ExtraData),
    temperatureImage: types.maybeNull(types.string),
    kAlertType: types.number,
    kDVR: types.number,
    time: types.string,
    timezone: types.string,
    dVRUser: types.maybeNull(types.string),
    description: types.string,
    channelNo: types.number,
    alertType: types.string,
    chanMask: types.maybeNull(types.frozen(BigNumber)),
    thumb: types.maybeNull(types.frozen()),
  })
  .views(self => ({
    get snapshotItems() {
      let res = self.snapshot.map(ss => ({
        channelNo: ss.channelNo,
        channelName: ss.channelName,
        imageTime: ss.time,
      }));
      switch (self.alertType) {
        case AlertTypes.DVR_Sensor_Triggered:
          res.filter(
            ss =>
              ss.imageTime <= self.imageTime + 1 &&
              ss.imageTime >= self.imageTime - 1
          );
          res.sort(
            (a, b) =>
              a.channelNo < b.channelNo ||
              (a.channelNo == b.channelNo && a.imageTime < b.imageTime)
          );
          break;
        case AlertTypes.DVR_VA_detection:
          if (res.length == 0) {
            res = [
              {
                channelNo: self.channelNo,
                channelName: 'Channel ' + (self.channelNo + 1),
                imageTime: undefined,
              },
            ];
          }
          break;
        case AlertTypes.TEMPERATURE_OUT_OF_RANGE:
        case AlertTypes.TEMPERATURE_NOT_WEAR_MASK:
        case AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY:
        case AlertTypes.SOCIAL_DISTANCE:
          res = [
            {
              channelNo: self.channelNo,
              channelName: 'Channel ' + (self.channelNo + 1),
              imageTime: res.length > 0 ? res[0].imageTime : undefined,
            },
          ];
          break;
      }
      return res;
    },
    get isTemperatureAlert() {
      return util.isTemperatureAlert(self.kAlertType);
    },
    get isSDAlert() {
      return util.isSDAlert(self.kAlertType);
    },
    get isTempSDAlert() {
      return self.isTemperatureAlert || self.isSDAlert;
    },
  }))
  .actions(self => ({
    getThumbnail: flow(function* getThumbnail() {
      if (!self.snapshot || self.snapshot.length == 0)
        return {url_thumnail: No_Image};
      try {
        const res = yield apiService.getBase64Stream(
          Alert.controller,
          String(self.isTempSDAlert ? self.kAlertEvent : self.snapshot[0].time),
          self.isTempSDAlert ? Alert.image : Alert.imageTime,
          {
            thumb: true,
            kdvr: self.kDVR,
            ch: self.snapshot[0].channelNo,
            next: null,
            download: false,
          }
        );

        if (res && res.status == 200) {
          // __DEV__ && console.log('GOND get alarm thumbnail success: ', res);
          return {base64_thumnail: res.data};
        } else {
          __DEV__ && console.log('GOND get alarm thumbnail failed: ', res);
        }
      } catch (err) {
        __DEV__ && console.log('GOND get alarm thumbnail error: ', err);
      }
      return {url_thumnail: No_Image};
    }),
    loadSnapshotImages(index) {
      if (index) {
        if (index > 0 && index < self.snapshot.length) {
          self.snapshot[index].getImage(
            self.kDVR,
            self.kAlertEvent,
            self.isTempSDAlert
          );
        }
      } else {
        if (self.snapshot && self.snapshot.length > 0) {
          self.snapshot.forEach(ss =>
            ss.getImage(self.kDVR, self.kAlertEvent, self.isTempSDAlert)
          );
        } else {
          self.snapshot = [AlarmSnapshot.create(defaultSnapshot)];
        }
      }
    },
    addSnapshot: flow(function* snapshot(snap) {
      if (!snap.Time || !snap.Channel) return;
      self.snapshot.push(
        AlarmSnapshot.create({
          time: snap.Time,
          channelNo: snap.Channel,
          fileName: snap.FileName ?? 'snap_' + snap.Channel + '_' + snap.Time,
          channelName:
            snap.ChannelName && snap.ChannelName.length > 0
              ? snap.ChannelName
              : util.isNullOrUndef(snap.Channel)
              ? 'No Channel'
              : 'Channel ' + (snap.Channel + 1),
          isLoading: false,
        })
      );
    }),
    setThumbnail(value) {
      self.thumb = value;
    },
    update({rateId, note}) {
      self.rate = rateId;
      self.note = note;
    },
  }));

export const parseAlarmData = item =>
  AlarmData.create({
    kAlertEvent: item.KAlertEvent,
    kAlertTypeVA: item.KAlertTypeVA,
    cmsUser: item.CMSUser,
    status: item.Status,
    updateTime: item.UpdateTime,
    rate: item.Rate,
    note: item.Note ?? '',
    image: item.Image,
    imageTime: item.ImageTime,
    thumbnail: item.Thumbnail,
    severity: item.Severity,
    serverID: item.ServerID,
    site: item.Site,
    siteName: item.SiteName,
    serverIP: item.ServerIP,
    dtUpdateTime: item.dtUpdateTime,
    snapshot:
      item.SnapShot && Array.isArray(item.SnapShot)
        ? item.SnapShot.map(ss =>
            AlarmSnapshot.create({
              channelNo: ss.Channel,
              time: ss.Time,
              fileName: ss.FileName,
              channelName:
                ss.ChannelName && ss.ChannelName.length > 0
                  ? ss.ChannelName
                  : util.isNullOrUndef(ss.Channel)
                  ? 'No Channel'
                  : 'Channel ' + (ss.Channel + 1),
              isLoading: false,
            })
          )
        : [AlarmSnapshot.create(defaultSnapshot)],
    address: AlarmAddress.create({
      addressLine1: item.Address.AddressLine1,
      addressLine2: item.Address.AddressLine2,
      city: item.Address.City,
      stateProvince: item.Address.StateProvince,
      country: item.Address.Country,
      zipCode: item.Address.ZipCode,
    }),
    isManual: item.IsManual,
    actionName: item.ActionName,
    extra:
      item.Extra && Array.isArray(item.Extra)
        ? item.Extra.map(ex => ExtraData.create({key: ex.Key, value: ex.Value}))
        : [],
    temperatureImage: item.TemperatureImage,
    kAlertType: item.KAlertType,
    kDVR: item.KDVR,
    timezone: item.TimeZone,
    dVRUser: item.DVRUser,
    description: item.Description,
    time: item.Time,
    channelNo: parseInt(item.Channel),
    alertType: item.AlertType,
    chanMask: item.ChanMask ? BigNumber(item.ChanMask) : null,
  });

const AlarmTime = types.model({
  stime: types.number,
  etime: types.number,
});

const AlarmFilterParams = types.model({
  time: AlarmTime,
  aty: types.string,
  sdate: types.string,
  edate: types.string,
});

export const AlarmModel = types
  .model({
    isLoading: types.boolean,
    rateConfig: types.array(AlarmRate),
    vaConfig: types.array(AlarmTypeVA),
    liveAlarms: types.array(AlarmData),
    filterText: types.string,
    filterParams: types.maybeNull(AlarmFilterParams),
    alarmPage: types.string,
    selectedAlarm: types.maybeNull(types.reference(AlarmData)),
    notifiedAlarm: types.maybeNull(AlarmData),
  })
  .views(self => ({
    get filteredLiveData() {
      if (!self.filterText) return self.liveAlarms;
      return self.liveAlarms.filter(
        item =>
          item.serverID.toLowerCase().includes(self.filterText) ||
          item.siteName.toLowerCase().includes(self.filterText) ||
          item.alertType.toLowerCase().includes(self.filterText) ||
          item.description.toLowerCase().includes(self.filterText)
      );
    },
    getRate(id) {
      return (
        self.rateConfig.find(item => item.rateId == id) ?? {
          rateId: -1,
          rateName: '',
        }
      );
    },
  }))
  .actions(self => ({
    setTextFilter(value) {
      self.filterText = value.toLowerCase();
    },
    selectAlarm(alarm) {
      // __DEV__ && console.log('GOND selectAlarm: ', kAlertEvent);
      if (!alarm || util.isNullOrUndef(alarm.kAlertEvent)) {
        __DEV__ && console.log('GOND selectAlarm failed');
        return false;
      }
      if (self.liveAlarms.find(item => item.kAlertEvent == alarm.kAlertEvent)) {
        self.selectedAlarm = alarm.kAlertEvent;
      } else {
        self.notifiedAlarm = alarm;
        self.selectedAlarm = self.notifiedAlarm.kAlertEvent;
      }
      return true;
    },
    getConfigs: flow(function* getConfigs() {
      try {
        const res = yield apiService.get(
          ACConfig.controller,
          apiService.configToken.userId ?? 0,
          ACConfig.getRatingConfig
        );
        __DEV__ && console.log('GOND get alarm configs: ', res);
        if (res.error) {
          __DEV__ && console.log('GOND get alarm configs failed: ', res.error);
        } else {
          self.rateConfig = res.map(item =>
            AlarmRate.create({rateId: item.RateID, rateName: item.RateName})
          );
        }
      } catch (err) {
        __DEV__ && console.log('GOND get alarm configs error: ', err);
      }
    }),
    getVAAlert: flow(function* getVAAlert() {
      try {
        const res = yield apiService.get(
          AlertType.controller,
          apiService.configToken.userId ?? 0,
          AlertType.getAlertTypeVA
        );
        __DEV__ && console.log('GOND get getVAAlert: ', res);
        if (res.error) {
          __DEV__ && console.log('GOND get getVAAlert failed: ', res.error);
        } else {
          self.vaConfig = res.map(item =>
            AlarmTypeVA.create({id: item.Id, name: item.Name})
          );
        }
      } catch (err) {
        __DEV__ && console.log('GOND get getVAAlert error: ', err);
      }
    }),
    getAlarms: flow(function* getAlarms(params) {
      self.isLoading = true;
      try {
        const res = yield apiService.get(Alert.controller, null, null, params);
        __DEV__ && console.log('GOND get getAlarms: ', res);

        if (res.error) {
          __DEV__ && console.log('GOND get getAlarms failed: ', res.error);
        } else {
          self.liveAlarms = res.map(item => {
            if (!item.SnapShot || item.SnapShot.length <= 0) {
              let channelsList = [];
              let {ImageTime, ChanMask, Channel} = item;
              item.SnapShot = [];
              if (ChanMask != 0) {
                let str = BigNumber(ChanMask).toString(2);
                let len = str.length;
                let index = -1;
                for (let i = len - 1; i >= 0; i--) {
                  if (str[i] === '1') {
                    index = len - 1 - i;
                    channelsList.push(index);
                  }
                }
              } else channelsList.push(Channel);

              item.SnapShot = channelsList.map(ch => ({
                Channel: ch,
                Time: ImageTime,
                FileName: '',
                ChannelName: null,
              }));
            }

            const alarm = parseAlarmData(item);

            return alarm;
          });
        }
      } catch (err) {
        __DEV__ && console.log('GOND get getAlarms error: ', err);
      }
      self.isLoading = false;
    }),
    getLiveData: flow(function* getLiveData(params) {
      self.isLoading = true;
      const [resConfig, resVAAlert, resAlarms] = yield Promise.all([
        self.getConfigs(),
        self.getVAAlert(),
        self.getAlarms(params),
      ]);
      self.isLoading = false;
      return resConfig && resVAAlert && resAlarms;
    }),
    onNewSnapshot(alarm) {
      __DEV__ && console.log('GOND onAlarm NewSnapshot: ', alarm);
    },
    updateSelectedAlarm: flow(function* ({rate, note}) {
      self.isLoading = true;
      const rateId = rate == -1 ? ID_Canned_Message : rate;
      self.selectedAlarm.update({rateId, note});
      try {
        const res = apiService.put(
          Alert.controller,
          String(self.selectedAlarm.kAlertEvent),
          '',
          {
            KAlertEvent: self.selectedAlarm.kAlertEvent,
            KAlertType: self.selectedAlarm.kAlertType,
            Note: note,
            Rate: rateId,
          }
        );
        snackbarUtil.handleSaveResult(res);
      } catch (err) {
        __DEV__ && console.log('GOND update alarm error: ', err);
        snackbarUtil.handleRequestFailed();
      }
      self.isLoading = false;
    }),
    cleanUp() {
      applySnapshot(self, storeDefault);
    },
  }));

const defaultSnapshot = {
  channelNo: -1,
  time: 0,
  channelName: 'No Channel',
  isLoading: false,
  image: {url_thumnail: No_Image},
};

const storeDefault = {
  isLoading: false,
  filterText: '',
  rateConfig: [],
  vaConfig: [],
  liveAlarms: [],
  filter: null,
  alarmPage: '',
};

const alarmStore = AlarmModel.create(storeDefault);
export default alarmStore;
