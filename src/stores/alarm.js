import {flow, types /*, onSnapshot*/, applySnapshot} from 'mobx-state-tree';
import apiService from '../services/api';
import BigNumber from 'bignumber.js';
import snackbarUtil from '../util/snackbar';
import util from '../util/general';

import {No_Image, No_Image_16_9} from '../consts/images';
import {AlertTypes, AlertType_Support, AlertNames} from '../consts/misc';
import {ACConfig, Alert, AlertType, CommonActions} from '../consts/apiRoutes';

const ID_Canned_Message = 5;
export const PAGE_LENGTH = 20;

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
    getImage: flow(function* (kDVR, kAlertEvent, isTempSDAlert) {
      if (self.channelNo < 0 || (!isTempSDAlert && self.time == 0)) {
        __DEV__ && console.log('GOND get snapshot no image');
        self.image = {url_thumnail: No_Image_16_9};
        return;
      }
      // __DEV__ &&
      //   console.log(
      //     'GOND get snapshot isTempSD: ',
      //     isTempSDAlert,
      //     ', kAlertEvent: ',
      //     kAlertEvent
      //   );
      self.isLoading = true;
      try {
        const res = yield apiService.getBase64Stream(
          Alert.controller,
          String(isTempSDAlert ? kAlertEvent : self.time),
          isTempSDAlert ? CommonActions.image : CommonActions.imageTime,
          {
            thumb: false,
            kdvr: kDVR,
            ch: self.channelNo,
            next: isTempSDAlert ? false : null,
            download: false,
            va: false,
            ti: null,
          }
        );

        if (res && res.status == 200) {
          // __DEV__ && console.log('GOND get snapshot image success: ', res);
          self.image = {base64_thumnail: res.data};
        } else {
          __DEV__ && console.log('GOND get snapshot image failed: ', res);
          self.image = {url_thumnail: No_Image_16_9};
        }
      } catch (err) {
        __DEV__ && console.log('GOND get snapshot image error: ', err);
        self.image = {url_thumnail: No_Image_16_9};
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
    id: types.optional(types.identifier, () => util.getRandomId()),
    kAlertEvent: types.number,
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
    dvrUser: types.maybeNull(types.string),
    description: types.string,
    channelNo: types.number,
    alertType: types.string,
    chanMask: types.maybeNull(types.frozen(BigNumber)),
  })
  .volatile(self => ({
    thumb: null,
  }))
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
    get customDescription() {
      switch (self.kAlertType) {
        case AlertTypes.DVR_Sensor_Triggered:
          return self.description;
        case AlertTypes.DVR_VA_detection:
          const desc = self.description;
          try {
            __DEV__ && console.log('GOND custom desciption VA: ', desc);
            // version old
            if (desc.includes(':')) {
              let lst = desc.split(' ');
              // Remove first element
              lst.shift();
              if (!lst || lst.length == 0) return '';
              lst[lst.length - 1] = util.getAlertTypeVA(self.kAlertTypeVA);
              return lst.map(s => s.trim()).join(' ');
            } else {
              let lst = desc.split('.');
              // Remove first 2 elements
              lst = lst.filter((val, idx) => idx > 1);
              if (!lst || lst.length == 0) return '';
              lst[lst.length - 1] = util.getAlertTypeVA(self.kAlertTypeVA);
              lst[lst.length - 2] = util.capitalize(lst[lst.length - 2], '&');
              lst[lst.length - 2] =
                ': ' + util.capitalize(lst[lst.length - 2], '/');
              return lst.map(s => s.trim()).join(' ');
            }
          } catch (err) {
            __DEV__ && console.log('GOND custom desciption failed: ', err);
            return desc;
          }

        case AlertTypes.TEMPERATURE_OUT_OF_RANGE:
        case AlertTypes.TEMPERATURE_NOT_WEAR_MASK:
        case AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY:
          return AlertNames[self.kAlertType.toString()];
        case AlertTypes.SOCIAL_DISTANCE:
          let areaName = self.description.split(',')[0];
          return areaName ? areaName + ': Social distance' : 'Social distance';
      }
    },
    get searchTime() {
      if (!self.timezone) return null;
      const date = new Date(self.timezone);
      date.setSeconds(date.getSeconds() - 1);
      return date.toISOString();
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
          self.isTempSDAlert ? CommonActions.image : CommonActions.imageTime,
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
    update({rateId, note, user}) {
      self.rate = rateId ?? self.rate;
      self.note = note ?? self.note;
      self.cmsUser = user ?? self.cmsUser;
      self.status = 1;
    },
  }));

export const parseAlarmData = item =>
  AlarmData.create({
    // id: util.getRandomId(),
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
    siteName:
      item.SiteName && item.SiteName.length > 0
        ? item.SiteName
        : item.Site.split(':')[0],
    serverIP: item.ServerIP,
    dtUpdateTime: item.dtUpdateTime,
    snapshot:
      item.SnapShot && Array.isArray(item.SnapShot)
        ? item.SnapShot.map(ss =>
            ss
              ? AlarmSnapshot.create({
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
              : AlarmSnapshot.create({
                  ...defaultSnapshot,
                  channelNo: item.Channel,
                  channelName: 'Channel ' + (item.Channel + 1),
                })
          )
        : [
            AlarmSnapshot.create({
              ...defaultSnapshot,
              channelNo: item.Channel,
              channelName: 'Channel ' + (item.Channel + 1),
            }),
          ],
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
    dvrUser: item.DVRUser,
    description: item.Description,
    time: item.Time,
    channelNo: parseInt(item.Channel),
    alertType: item.AlertType,
    chanMask: item.ChanMask ? BigNumber(item.ChanMask) : null,
  });

const makeItemSnapshot = item => {
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
};

const AlarmTime = types.model({
  stime: types.string,
  etime: types.string,
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
    liveRawAlarms: types.frozen(),
    searchRawAlarms: types.frozen(),
    liveAlarms: types.array(AlarmData),
    searchAlarms: types.array(AlarmData),
    filterText: types.string,
    filterParams: types.maybeNull(AlarmFilterParams),
    searchPage: types.number,
    selectedAlarm: types.maybeNull(types.reference(AlarmData)),
    notifiedAlarm: types.maybeNull(AlarmData),
    isSearch: types.optional(types.boolean, false),
    liveCurrentPage: types.maybeNull(types.number),
    searchCurrentPage: types.maybeNull(types.number),
  })
  .volatile(self => ({
    lastParams: {aty: AlertType_Support},
  }))
  .views(self => ({
    get filteredLiveData() {
      if (!self.filterText) return self.liveAlarms;
      return self.liveAlarms.filter(
        item =>
          item.serverID.toLowerCase().includes(self.filterText) ||
          item.siteName.toLowerCase().includes(self.filterText) ||
          item.alertType.toLowerCase().includes(self.filterText) ||
          item.description.toLowerCase().includes(self.filterText) ||
          // AlertNames[item.kAlertType.toString()].includes(self.filterText)
          item.customDescription.toLowerCase().includes(self.filterText)
      );
    },
    get filteredSearchData() {
      if (!self.filterText) return self.searchAlarms;
      return self.searchAlarms.filter(
        item =>
          item.serverID.toLowerCase().includes(self.filterText) ||
          item.siteName.toLowerCase().includes(self.filterText) ||
          item.alertType.toLowerCase().includes(self.filterText) ||
          item.description.toLowerCase().includes(self.filterText) ||
          // AlertNames[item.kAlertType.toString()].includes(self.filterText)
          item.customDescription.toLowerCase().includes(self.filterText)
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
    selectAlarm(alarm, fromNotify) {
      // __DEV__ && console.log('GOND selectAlarm: ', kAlertEvent);
      if (!alarm || util.isNullOrUndef(alarm.kAlertEvent)) {
        __DEV__ && console.log('GOND selectAlarm failed');
        return false;
      }
      self.selectedAlarm = alarm.id;
      if (!fromNotify) self.notifiedAlarm = null;
      return true;
    },
    applySearchParams(params) {
      self.filterParams = AlarmFilterParams.create(params);
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
    getVAConfigs: flow(function* getVAConfigs() {
      try {
        const res = yield apiService.get(
          AlertType.controller,
          apiService.configToken.userId ?? 0,
          AlertType.getAlertTypeVA
        );
        __DEV__ && console.log('GOND get getVAConfigs: ', res);
        if (res.error) {
          __DEV__ && console.log('GOND get getVAConfigs failed: ', res.error);
        } else {
          self.vaConfig = res.map(item =>
            AlarmTypeVA.create({id: item.Id, name: item.Name})
          );
        }
      } catch (err) {
        __DEV__ && console.log('GOND get getVAConfigs error: ', err);
      }
    }),
    getAlarms: flow(function* (params, isSearch) {
      if (params) self.lastParams = params;
      self.isSearch = isSearch ?? self.isSearch;

      self.isLoading = true;
      if (self.isSearch) {
        self.searchAlarms = [];
        self.searchRawAlarms = [];
        self.searchCurrentPage = 0;
      } else {
        self.liveAlarms = [];
        self.liveRawAlarms = [];
        self.liveCurrentPage = 0;
      }
      try {
        const res = yield apiService.get(
          Alert.controller,
          null,
          null,
          params ?? self.lastParams
        );
        __DEV__ &&
          console.log(
            'GOND get getAlarms ',
            self.isSearch ? 'search: ' : 'live: ',
            res
          );

        if (res.error) {
          __DEV__ && console.log('GOND get getAlarms failed: ', res.error);
        } else {
          if (self.isSearch) {
            self.searchRawAlarms = res;
          } else {
            self.liveRawAlarms = res;
          }
          let pageRawData = res.slice(0, PAGE_LENGTH);
          const pageData = pageRawData.map((item, index) => {
            makeItemSnapshot(item);
            const alarm = parseAlarmData(item);
            return alarm;
          });
          if (self.isSearch) {
            self.searchAlarms.push(...pageData);
            self.searchCurrentPage = 1;
          } else {
            self.liveAlarms.push(...pageData);
            self.liveCurrentPage = 1;
          }
        }
      } catch (err) {
        __DEV__ && console.log('GOND get getAlarms error: ', err);
      }
      self.isLoading = false;
    }),
    loadMore() {
      if (
        (self.isSearch ? self.searchCurrentPage : self.liveCurrentPage) *
          PAGE_LENGTH <
        (self.isSearch ? self.searchRawAlarms : self.liveRawAlarms).length
      ) {
        let currentPage = self.isSearch
          ? self.searchCurrentPage
          : self.liveCurrentPage;
        let rawPageData = (
          self.isSearch ? self.searchRawAlarms : self.liveRawAlarms
        ).slice(currentPage * PAGE_LENGTH, (currentPage + 1) * PAGE_LENGTH);
        const pageData = rawPageData.map((item, index) => {
          makeItemSnapshot(item);
          const alarm = parseAlarmData(item);
          return alarm;
        });
        if (self.isSearch) {
          self.searchAlarms.push(...pageData);
          self.searchCurrentPage++;
        } else {
          self.liveAlarms.push(...pageData);
          self.liveCurrentPage++;
        }
      }
    },
    getLiveData: flow(function* (params) {
      self.isLoading = true;
      const [resConfig, resVAAlert, resAlarms] = yield Promise.all([
        self.getConfigs(),
        self.getVAConfigs(),
        self.getAlarms(params),
      ]);
      self.isLoading = false;
      return resConfig && resVAAlert && resAlarms;
    }),
    onNewSnapshot(alarm) {
      // __DEV__ && console.log('GOND onAlarm NewSnapshot: ', alarm);
      // TODO
    },
    updateSelectedAlarm: flow(function* ({rate, note, user}) {
      self.isLoading = true;
      const rateId = rate == -1 ? ID_Canned_Message : rate;
      try {
        const res = yield apiService.put(
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
        // __DEV__ && console.log('GOND updateSelectedAlarm: ', res);
        if (!res.error) self.selectedAlarm.update({rateId, note, user});

        snackbarUtil.handleSaveResult(res);
      } catch (err) {
        __DEV__ && console.log('GOND update alarm error: ', err);
        snackbarUtil.handleRequestFailed();
      }
      self.isLoading = false;
    }),
    // #region on notification events
    onAlarmNotification(data) {
      try {
        __DEV__ && console.log(` onAlarmNotification = `, JSON.stringify(data));
        self.notifiedAlarm = parseAlarmData(data);
        return self.selectAlarm(self.notifiedAlarm, true);
      } catch (ex) {
        __DEV__ &&
          console.log('GOND parse notification alarm data failed: ', ex);
      }
    },
    // #endregion on notification events
    onExitAlarmDetail() {
      if (self.notifiedAlarm == null) self.selectedAlarm = null;
    },
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
  searchAlarms: [],
  filter: null,
  searchPage: 0,
};

const alarmStore = AlarmModel.create(storeDefault);
export default alarmStore;
