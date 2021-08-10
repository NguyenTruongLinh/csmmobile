import {flow, types /*, onSnapshot*/, applySnapshot} from 'mobx-state-tree';
import apiService from '../services/api';
import BigNumber from 'bignumber.js';
import snackbarUtil from '../util/snackbar';
import util from '../util/general';

import {No_Image} from '../consts/images';
import {AlertType_Support} from '../consts/misc';
import {ACConfig, Alert, AlertType} from '../consts/apiRoutes';

const AlarmRate = types.model({
  rateId: types.identifierNumber,
  rateName: types.string,
});

const AlarmTypeVA = types.model({
  id: types.identifierNumber,
  name: types.string,
});

const AlarmSnapshot = types.model({
  channel: types.number,
  time: types.number,
  fileName: types.string,
  channelName: types.string,
});

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
    timezone: types.string,
    dVRUser: types.maybeNull(types.string),
    description: types.string,
    time: types.string,
    channel: types.number,
    alertType: types.string,
    chanMask: types.number, // BigInt
    thumb: types.maybeNull(types.frozen()),
  })
  .actions(self => ({
    getSnapshot: flow(function* getSnapshot() {
      if (!self.snapshot || self.snapshot.length == 0)
        return {url_thumnail: No_Image};
      const isTempSDAlert =
        util.isTemperatureAlert(self.kAlertType) ||
        util.isSDAlert(self.kAlertType);
      try {
        const res = yield apiService.getBase64Stream(
          Alert.controller,
          String(isTempSDAlert ? self.kAlertEvent : self.snapshot[0].time),
          isTempSDAlert ? Alert.image : Alert.imageTime,
          {
            thumb: true,
            kdvr: self.kDVR,
            ch: self.snapshot[0].channel,
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
    setThumbnail(value) {
      self.thumb = value;
    },
  }));

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
  }))
  .actions(self => ({
    setTextFilter(value) {
      self.filterText = value.toLowerCase();
    },
    selectAlarm(alarm) {
      self.selectedAlarm = alarm.kAlertEvent;
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
      try {
        const res = yield apiService.get(Alert.controller, null, null, params);
        __DEV__ && console.log('GOND get getAlarms: ', res);

        if (res.error) {
          __DEV__ && console.log('GOND get getAlarms failed: ', res.error);
        } else {
          self.liveAlarms = res.map(item => {
            if (!item.SnapShot || item.SnapShot.length <= 0) {
              let channelsList = [];
              let {imageTime, chanMask, channel} = item;
              item.SnapShot = [];
              if (chanMask != 0) {
                let str = BigNumber(chanMask).toString(2);
                let len = str.length;
                let index = -1;
                for (let i = len - 1; i >= 0; i--) {
                  if (str[i] === '1') {
                    index = len - 1 - i;
                    channelsList.push(index);
                  }
                }
              } else channelsList.push(channel);

              channelsList.forEach(element => {
                item.SnapShot.push({
                  Channel: element,
                  Time: imageTime,
                  FileName: '',
                  ChannelName: 'Channel ' + (element + 1),
                });
              });
            }

            const alarm = AlarmData.create({
              kAlertEvent: item.KAlertEvent,
              kAlertTypeVA: item.KAlertTypeVA,
              cmsUser: item.CMSUser,
              status: item.Status,
              updateTime: item.UpdateTime,
              rate: item.Rate,
              note: item.Note,
              image: item.Image,
              imageTime: item.ImageTime,
              thumbnail: item.Thumbnail,
              severity: item.Severity,
              serverID: item.ServerID,
              site: item.Site,
              siteName: item.SiteName,
              serverIP: item.ServerIP,
              dtUpdateTime: item.dtUpdateTime,
              snapshot: item.SnapShot.map(ss =>
                AlarmSnapshot.create({
                  channel: ss.Channel,
                  time: ss.Time,
                  fileName: ss.FileName,
                  channelName: ss.ChannelName,
                })
              ),
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
                  ? item.Extra.map(ex =>
                      ExtraData.create({key: ex.Key, value: ex.Value})
                    )
                  : [],
              temperatureImage: item.TemperatureImage,
              kAlertType: item.KAlertType,
              kDVR: item.KDVR,
              timezone: item.TimeZone,
              dVRUser: item.DVRUser,
              description: item.Description,
              time: item.Time,
              channel: item.Channel,
              alertType: item.AlertType,
              chanMask: item.ChanMask,
            });

            return alarm;
          });
        }
      } catch (err) {
        __DEV__ && console.log('GOND get getAlarms error: ', err);
      }
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
    cleanUp() {
      applySnapshot(self, storeDefault);
    },
  }));

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
