import {types, applySnapshot, flow, getSnapshot} from 'mobx-state-tree';

import {DVRModel, parseDVR} from './sites';
import apiService from '../services/api';
import utils from '../util/general';
import snackbarUtil from '../util/snackbar';

import {
  Health as HealthRoute,
  Alert as AlertRoute,
  Channel as ChannelRoute,
  CommonActions,
} from '../consts/apiRoutes';
import {AlertTypes, AlertNames} from '../consts/misc';
import {No_Image} from '../consts/images';
import ROUTERS from '../consts/routes';
import {DateTime} from 'luxon';

export const NonDismissableAlerts = [
  AlertTypes.DVR_is_off_line,
  AlertTypes.DVR_Record_Less_Than,
  AlertTypes.CMSWEB_POS_data_missing,
  AlertTypes.CMSWEB_Door_count_0,
];

const SiteHealthModel = types
  .model({
    id: types.identifierNumber,
    name: types.maybeNull(types.string),
    total: types.number,
    sdate: types.string, // should be Date or number?
    edate: types.string, // should be Date or number?
    isDismissAll: types.boolean,
    siteName: types.string,
    // dvrs: types.array(types.number),
    dvrs: types.array(DVRModel),

    //
    computedTotalFromChildren: types.maybeNull(types.number),
  })
  .views(self => ({
    get lowerCaseName() {
      return self.siteName.toLowerCase();
    },
  }))
  .actions(self => ({
    update(model) {
      self.name = model.name;
      self.total = model.total ?? 0;
      self.sdate = model.sdate ?? '';
      self.edate = model.edate ?? '';
      self.isDismissAll = model.isDismissAll;
      self.siteName = model.siteName;
      self.dvrs = model.dvrs.map(dvr => DVRModel.create(dvr));
    },
    notifyUpdate(site) {
      if (self.id == site.Key) {
        let dvrs = Array.isArray(site.Childs)
          ? site.Childs.map(item => parseDVR(item))
          : [];
        self.siteName = site.Name;
        self.dvrs = dvrs;
      }
    },
    computeTotalFromSubChidlren(subOriginal, subUpdated) {
      __DEV__ &&
        console.log(
          `computeTotalFromChidlren subOriginal = `,
          subOriginal,
          'subUpdated = ',
          subUpdated,
          'self.total = ',
          self.total
        );
      const newTotal = self.total - subOriginal + subUpdated;
      if (newTotal >= 0) self.computedTotalFromChildren = newTotal;
    },
    computeTotalFromChidlren(newTotal) {
      __DEV__ && console.log(`computeTotalFromChidlren newTotal = `, newTotal);
      if (newTotal >= 0) self.computedTotalFromChildren = newTotal;
    },
  }));

const SiteAlertTypeModel = types
  .model({
    alertId: types.identifierNumber,
    name: types.optional(types.string, 'Unknow alert'),
    total: types.number,
    sdate: types.string,
    edate: types.string,
    computedTotalFromChildren: types.maybeNull(types.number),
  })
  .views(self => ({
    get canDismiss() {
      return !NonDismissableAlerts.includes(self.alertId);
    },
  }))
  .actions(self => ({
    computeTotalFromChidlren(count) {
      __DEV__ && console.log(`computeTotalFromChidlren count = `, count);
      if (count >= 0) self.computedTotalFromChildren = count;
    },
  }));

// const DVRModel = types.model({
//   kDVR: types.number, //types.identifierNumber
//   name: types.string,
// });

const AlertModel = types
  .model({
    channelName: types.maybeNull(types.string),
    // kDVR: types.number,
    id: types.optional(types.identifier, () => utils.getRandomId()), // Consider using kChannel instead
    alertId: types.number,
    kChannel: types.maybeNull(types.number),
    channelNo: types.maybeNull(types.number),
    timezone: types.string,
    time: types.string,
    pinned: types.optional(types.boolean, false),
    dvr: types.frozen(),
    // image: types.maybeNull(types.string),
    // imageInfo: types.maybeNull(types.string), // todo: define AlertImgInfoModel
  })
  .volatile(self => ({
    image: null,
    imageInfo: null,
  }))
  .views(self => ({
    get kDVR() {
      return self.dvr ? self.dvr.kDVR : 0;
    },
    get canDismiss() {
      return !NonDismissableAlerts.includes(self.id);
    },
  }))
  .actions(self => ({
    pin(value) {
      self.pinned = value === undefined ? !self.pinned : value;
    },
    saveImage(image, imageInfo) {
      self.image = image;
      if (imageInfo != undefined) self.imageInfo = imageInfo;
    },
  }));

// const DVRAlertViewInfoModel = types.model({
//   page: types.number,
//   totalPages: types.number,
// });

// const HealthDetailModel = types.model({
//   dvrAlerts: types.array(DVRAlertlModel),
//   fields: types.map(types.string),
//   // info: DVRAlertViewInfoModel,
//   page: types.number,
//   totalPages: types.number,
// });

// const AlertTypeModel = types.model({
//   id: types.identifierNumber,
//   kAlertSeverity: types.number,
//   name: types.string,
//   cmsWebType: types.number,
//   cmsWebGroup: types.number,
//   displayStatus: types.number,
// });

export const HealthModel = types
  .model({
    siteHealthList: types.array(SiteHealthModel),
    siteFilter: types.optional(types.string, ''),
    selectedSite: types.safeReference(SiteHealthModel),
    selectedSiteAlertTypes: types.array(SiteAlertTypeModel),
    selectedAlertType: types.safeReference(SiteAlertTypeModel),

    date: types.string, // should be Date or number?
    alertsList: types.array(AlertModel),
    alertFilter: types.optional(types.string, ''),
    //dvrAlerts: types.array(types.map),
    // healthDetail: types.maybeNull(HealthDetailModel),
    // activeDVRAlert: types.maybeNull(DVRAlertlModel),
    isLoading: types.boolean,
    isLiveVideo: types.optional(types.boolean, false),

    //
    dismissModalShown: types.optional(types.boolean, false),
    selectedAlert: types.safeReference(AlertModel),
    actionsModalShown: types.optional(types.boolean, false),

    //
    needRefresh: types.optional(types.boolean, false),
    isFromNotification: types.optional(types.boolean, false),
  })
  .volatile(self => ({
    alertTypesConfig: [],
    currentSiteName: null,
    // alertsList: [],
  }))
  .views(self => ({
    // Group alert by site
    // get alertSiteList() {},
    get filteredSites() {
      return self.siteHealthList.filter(s =>
        s.siteName.toLowerCase().includes(self.siteFilter.toLowerCase())
      );
    },
    get filteredAlerts() {
      return self.alertsList.filter(
        alert =>
          (alert.channelName &&
            alert.channelName
              .toLowerCase()
              .includes(self.alertFilter.toLowerCase())) ||
          (alert.dvr &&
            alert.dvr.name
              .toLowerCase()
              .includes(self.alertFilter.toLowerCase()))
      );
    },
    // get filteredAlertsGridView() {
    //   return self.alertsList
    //     .filter(alert =>
    //       alert.channelName
    //         .toLowerCase()
    //         .includes(self.alertFilter.toLowerCase())
    //     )
    //     .reduce((result, alert, index) => {
    //       if (index % ALERTS_GRID_LAYOUT == 0) {
    //         result.push([]);
    //       }
    //       result[result.length - 1].push(alert);
    //     }, []);
    // },
    get showDismissAllButtonInHealthDetail() {
      for (let i = 0; i < self.selectedSiteAlertTypes.length; i++) {
        if (
          !NonDismissableAlerts.includes(self.selectedSiteAlertTypes[i].alertId)
        )
          return true;
      }
      return false;
    },
    get selectedAlertTypeId() {
      if (!self.selectedAlertType) return 0;
      return self.selectedAlertType.alertId;
    },
    get selectedAlertIndex() {
      if (!self.selectedAlert) return -1;
      return self.alertsList.findIndex(
        alert => alert.id == self.selectedAlert.id
      );
    },
  }))
  .actions(self => ({
    // #region Setters
    saveAlertTypesConfig(configs) {
      self.alertTypesConfig = configs;
    },
    selectSite(value) {
      self.selectedSite = value;
    },
    deselectSite() {
      self.selectedSite = undefined;
    },
    setSiteFilter(value) {
      self.siteFilter = value;
    },
    setAlertFilter(value) {
      self.alertFilter = value;
    },
    selectAlertType(value) {
      __DEV__ && console.log(`selectAlertType value = `, JSON.stringify(value));
      self.selectedAlertType = value;
    },
    selectAlert(value) {
      __DEV__ && console.log('GOND +++++++ select Alert: ', value);
      if (self.alertsList.length == 0 || value == null) {
        self.selectedAlert = undefined;
        return;
      }
      self.selectedAlert = value == undefined ? self.alertsList[0] : value;
    },
    showActionsModal(isShow) {
      self.actionsModalShown = isShow;
    },
    nextAlert() {
      let selectedIndex = self.selectedAlertIndex;
      if (selectedIndex < self.alertsList.length - 1)
        self.selectAlert(self.alertsList[selectedIndex + 1]);
    },
    previousAlert() {
      let selectedIndex = self.selectedAlertIndex;
      if (selectedIndex > 0)
        self.selectAlert(self.alertsList[selectedIndex - 1]);
    },
    showDismissModal(isShow) {
      self.dismissModalShown = isShow;
    },
    setVideoMode(isLive) {
      self.isLiveVideo = isLive;
    },
    refresh(value) {
      self.needRefresh = value;
    },
    // #endregion Setters
    // #region Get data
    getHealthData: flow(function* (sitesList) {
      __DEV__ && console.log(`getHealthData sitesList = `, sitesList);
      // if (!alertTypes || !Array.isArray(alertTypes)) {
      //   console.log('GOND getDataHealth - alert type not provided');
      //   return;
      // }
      self.isLoading = true;
      const params = self.alertTypesConfig.reduce((result, val) => {
        return result + val.id;
      }, '');
      try {
        const res = yield apiService.get(
          HealthRoute.summary,
          null,
          null,
          params
        );
        __DEV__ && console.log('GOND getHealthData get health data: ', res);
        if (res.summary.length > 0) {
          // self.selectedSite && (self.selectedSite = null);
          self.siteHealthList = res.summary
            .map(siteData => {
              let site = sitesList.find(s => s.key == siteData.Id);
              // __DEV__ &&
              //   console.log(
              //     'GOND get health data ',
              //     site.name,
              //     'dvrs :',
              //     site.dvrs
              //   );
              if (site) {
                const snapShot = {
                  id: siteData.Id,
                  name: siteData.Name,
                  total: siteData.Total,
                  sdate: siteData.sdate ?? '',
                  edate: siteData.edate ?? '',
                  isDismissAll: siteData.isDismissAll,
                  siteName: site.name,
                  dvrs: site.dvrs.map(dvr =>
                    DVRModel.create({kDVR: dvr.kDVR, name: dvr.name})
                  ),
                };
                if (self.selectedSite && self.selectedSite.id == siteData.Id) {
                  applySnapshot(self.selectedSite, snapShot);
                  return self.selectedSite;
                } else return SiteHealthModel.create(snapShot);
              }
              return null;
            })
            .filter(s => s != null)
            .sort((s1, s2) =>
              s1.siteName.toLowerCase().localeCompare(s2.siteName.toLowerCase())
            );
          // __DEV__ && console.log('GOND Health data: ', self.siteHealthList);
        }
      } catch (error) {
        __DEV__ &&
          console.log('GOND getHealthData get health data failed: ', error);
        snackbarUtil.handleRequestFailed();
      }
      self.isLoading = false;
    }),
    getHealthDetail: flow(function* (siteKey) {
      // __DEV__ && console.log('GOND getHealthDetail alertTypes: ', alertTypes);
      const site =
        siteKey == undefined
          ? self.selectedSite
          : self.siteHealthList.find(s => s.id == siteKey);
      if (!site) {
        console.log('GOND site not existed: ', siteKey);
        snackbarUtil.onMessage('Site is not existed');
        return false;
      }
      self.isLoading = true;
      self.selectedSiteAlertTypes = [];
      // if (self.selectedAlertType) self.selectedAlertType = undefined;
      // const _alertTypes = self.alertTypesConfig;

      try {
        const res = yield apiService.get(
          HealthRoute.summary,
          '' + site.id,
          undefined,
          site ? {sdate: site.sdate, edate: site.edate} : {}
        );
        __DEV__ && console.log('GOND get health detail data: ', res);
        if (!res.summary || res.summary.length == 0) {
          console.log('GOND site ', site.id, ' has not alert');
          self.isLoading = false;
          return true;
        }

        self.selectedSiteAlertTypes = res.summary.map(alert => {
          // const alertType = _alertTypes.find(type => type.id == alert.Id);
          // __DEV__ && console.log('GOND matching alertTyoe: ', alert, alertType);
          if (
            self.selectedAlertType &&
            self.selectedAlertType.alertId == alert.id
          ) {
            applySnapshot(self.selectedAlertType, {
              alertId: alert.Id,
              // name: alertType ? alertType.name : 'Unknown alert',
              name: self.getAlertName(alert.Id),
              total: alert.Total ?? 0,
              sdate: alert.sdate,
              edate: alert.edate,
            });
            return self.selectedAlertType;
          }

          return SiteAlertTypeModel.create({
            alertId: alert.Id,
            name: self.getAlertName(alert.Id), // self.alertType ? self.alertType.name : 'Unknown alert',
            total: alert.Total ?? 0,
            sdate: alert.sdate,
            edate: alert.edate,
            // canDismiss: NonDismissableAlerts.includes(alert.Id),
          });
        });
        const computedTotalFromChidlren = self.selectedSiteAlertTypes.reduce(
          (acc, type) => {
            __DEV__ &&
              console.log(
                ` computeTotalFromChidlren reduce type.total = `,
                type.total
              );
            return type.total + acc;
          },
          0
        );
        self.selectedSite.computeTotalFromChidlren(computedTotalFromChidlren);
      } catch (error) {
        __DEV__ && console.log('GOND get health detail data failed: ', error);
        snackbarUtil.handleRequestFailed();
        self.isLoading = false;
        return false;
      }
      self.isLoading = false;
      return true;
    }),
    getAlertsByType: flow(function* (alertType) {
      __DEV__ && console.log(`getAlertsByType alertType = `, alertType);
      self.isLoading = true;
      if (self.selectedAlert) self.selectedAlert = undefined;
      self.alertsList = [];

      const _alertType = alertType ?? self.selectedAlertType.alertId;
      __DEV__ &&
        console.log(
          'GOND get alert type data dvrs: ',
          getSnapshot(self.selectedSite.dvrs)
        );
      // const params = {
      //   kdvrs: self.selectedSite.dvrs.map(dvr => dvr.kDVR).join(','),
      //   sdate: utils.toQueryStringUTCDateTime(self.selectedSite.sdate),
      //   edate: utils.toQueryStringUTCDateTime(self.selectedSite.edate),
      //   page: 1,
      //   size: self.selectedSite.dvrs.length,
      // };
      // __DEV__ &&
      //   console.log(
      //     `getAlertsByType _alertType = `,
      //     _alertType,
      //     `| params = `,
      //     params
      //   );
      try {
        const res = yield apiService.get(
          AlertRoute.controller,
          String(_alertType),
          AlertRoute.getByDvr,
          {
            kdvrs: self.selectedSite.dvrs.map(dvr => dvr.kDVR).join(','),
            sdate: utils.toQueryStringUTCDateTime(self.selectedSite.sdate),
            edate: utils.toQueryStringUTCDateTime(self.selectedSite.edate),
            page: 1,
            size: self.selectedSite.dvrs.length,
          }
        );

        let newTotal = !res.Data
          ? 0
          : res.Data.reduce((acc, alert) => {
              return acc.includes(alert.KDVR) ? acc : [...acc, alert.KDVR];
            }, []).length;

        self.selectedAlertType.computeTotalFromChidlren(newTotal);

        self.selectedSite.computeTotalFromSubChidlren(
          self.selectedAlertType.total,
          newTotal
        );

        __DEV__ &&
          console.log('GOND get alert type data: ', JSON.stringify(res));
        if (!res.Data || res.Data.length == 0) {
          console.log('GOND alert type ', _alertType, ' has no alert data');
          self.isLoading = false;
          return true;
        }

        let defaultId = 0;
        self.alertsList = res.Data.map(alert => {
          defaultId++;
          const foundDVR = getSnapshot(
            self.selectedSite.dvrs.find(dvr => dvr.kDVR == alert.KDVR)
          ) ?? {
            kDVR: alert.KDVR,
            name: 'KDVR ' + alert.KDVR,
          };
          __DEV__ && console.log('GOND map kdvr found:', foundDVR);
          __DEV__ &&
            console.log(
              `GOND get alert type data alert.TimeZone = `,
              alert.TimeZone
            );
          return AlertModel.create({
            alertId: alert.Id ?? defaultId,
            channelName: alert.ChannelName ?? '',
            // kDVR: alert.KDVR,
            kChannel: alert.KChannel ?? 0,
            channelNo: alert.ChannelNo ?? 0,
            time: alert.Time ?? '',
            timezone: alert.TimeZone ?? '',
            dvr: foundDVR,
            // dvr: DVRModel.create(
            //   alert.DVR
            //     ? {kDVR: alert.DVR.KDVR, name: alert.DVR.Name}
            //     : {kDVR: alert.KDVR, name: ''}
            // ),
          });
        });
        self.alertsList.sort((a, b) => {
          const secsA = DateTime.fromISO(a.timezone).toSeconds();
          const secsB = DateTime.fromISO(b.timezone).toSeconds();
          return secsB - secsA;
        });
        if (!self.selectedAlert) self.selectAlert(self.alertsList[0]);
        __DEV__ &&
          console.log(
            'GOND get site alert type data: ',
            getSnapshot(self.alertsList)
          );
      } catch (error) {
        __DEV__ && console.log('GOND get site alert type data failed: ', error);
        snackbarUtil.handleRequestFailed();
        self.isLoading = false;
        return false;
      }
      self.isLoading = false;
      return true;
    }),
    refreshHealthDetail: flow(function* () {
      return yield self.getHealthDetail();
    }),
    refreshAlertsByType: flow(function* () {
      return yield self.getAlertsByType();
    }),
    // #endregion Get data
    // #region Dismiss (Delete) alerts
    dismissAlertsByType: flow(function* (target, description) {
      self.isLoading = true;
      try {
        if (target) {
          const res = apiService.delete(
            AlertRoute.controller,
            String(target.alertId),
            AlertRoute.ignoreMutiAlertType,
            {
              Kdvrs: self.selectedSite.dvrs.map(dvr => dvr.kDVR),
              Kalerttype: target.alertId,
              Sites: self.selectedSite.id,
              Description: description,
              sdate: utils.toQueryStringUTCDateTime(target.sdate),
              edate: utils.toQueryStringUTCDateTime(target.edate),
            }
          );
          __DEV__ &&
            console.log(
              'GOND dismiss all alerts of type: ',
              target.alertId,
              res
            );
          if (res.error) snackbarUtil.handleRequestFailed();
        } else {
          // dismiss all site alerts
          const res = apiService.delete(
            AlertRoute.controller,
            String(self.selectedSite.id),
            AlertRoute.ignoreMutiAlertSite,
            {
              Kdvrs: self.selectedSite.dvrs.map(dvr => dvr.kDVR),
              Sites: self.selectedSite.id,
              Description: description,
            }
          );

          __DEV__ &&
            console.log(
              'GOND dismiss all alerts of site: ',
              self.selectedSite.id,
              res
            );
          if (res.error) snackbarUtil.handleRequestFailed();
        }
      } catch (error) {
        __DEV__ && console.log('GOND get health detail data failed: ', error);
        snackbarUtil.handleRequestFailed();
        self.isLoading = false;
        return false;
      }
      self.isLoading = false;
      snackbarUtil.onSuccess();
      // Dismiss successfully, reload page:
      self.refreshHealthDetail();
      return true;
    }),
    dismissAlert: flow(function* (target, description) {
      self.isLoading = true;
      __DEV__ &&
        console.log(
          'GOND dismiss single alert: ',
          target,
          ', des: ',
          description
        );
      try {
        if (target) {
          const res = yield apiService.delete(
            AlertRoute.controller,
            String(target.alertId),
            '',
            {
              Kdvr: target.kDVR,
              Sites: self.selectedSite ? self.selectedSite.id : undefined,
              Kchannel: target.kChannel,
              KAlert: target.alertId,
              Description: description,
            }
          );
          __DEV__ && console.log('GOND dismiss single alert result: ', res);
          if (res.error) snackbarUtil.handleRequestFailed();
        }
      } catch (error) {
        __DEV__ && console.log('GOND dismiss single alert failed: ', error);
        snackbarUtil.handleRequestFailed();
        self.isLoading = false;
        return false;
      }

      self.isLoading = false;
      snackbarUtil.onSuccess();
      // Dismiss successfully, reload page:
      self.refreshAlertsByType();
      return true;
    }),
    // #endregion Dismiss alert
    // #region Alert notifications
    onNVRStatusNotification: flow(function* (alert, nvrs, site) {
      __DEV__ &&
        console.log(
          `onNVRStatusNotification alert = `,
          JSON.stringify(alert),
          `| nvrs = `,
          JSON.stringify(nvrs),
          `| site = `,
          JSON.stringify(site)
        );
      // const kDVR = alert.NVRs[0].Key;
      // const dvr =
      //   site && site.dvrs
      //     ? site.dvrs.find(d => d.kDVR == kDVR)
      //     : {kDVR, name: 'KDVR: ', kDVR};
      // const timezone = alert.NVRs[alert.NVRs.length - 1].Value;

      self.isFromNotification = true;
      let targetSite = self.siteHealthList.find(s => s.id == site.key);
      if (!targetSite) {
        targetSite = SiteHealthModel.create({
          id: site.key,
          total: 1,
          sdate: alert.sdate ?? alert.Timezone ?? '',
          edate: alert.edate ?? alert.Timezone ?? '',
          isDismissAll: false,
          siteName: site.name,
          // dvrs: site.dvrs.map(dvr => dvr),
          dvrs: site.dvrs.map(dvr =>
            DVRModel.create({kDVR: dvr.kDVR, name: dvr.name})
          ),
        });
        self.siteHealthList.push(targetSite);
      }
      self.selectedSite = targetSite.id;
      self.currentSiteName = site ? site.name : '';
      // self.alertsList.push(
      //   AlertModel.create({
      //     id: utils.getRandomId(),
      //     alertId: alert.AlertType,
      //     timezone,
      //     time: timezone,
      //     dvr,
      //   })
      // );

      // self.alertsList = nvrs.map(nvr =>
      //   AlertModel.create({
      //     id: utils.getRandomId(),
      //     alertId: alert.AlertType,
      //     timezone: nvr.timezone,
      //     time: nvr.timezone,
      //     dvr: {kDVR: nvr.kDVR, name: nvr.name},
      //   })
      // );

      __DEV__ &&
        console.log('GOND onAlertNotification NVRStatus ', self.alertsList);

      let result = yield self.getHealthDetail(site.key);
      if (!result) return null;

      self.selectedAlertType = self.selectedSiteAlertTypes.find(
        item => item.alertId == alert.AlertType
      );
    }),
    onAlertNotification: flow(function* (alert, site, alertTypeConfigs) {
      __DEV__ &&
        console.log(
          `onAlertNotification alert = `,
          JSON.stringify(alert),
          `| site = `,
          JSON.stringify(site),
          `| alertTypeConfigs = `,
          JSON.stringify(alertTypeConfigs)
        );
      let targetSite = self.siteHealthList.find(s => s.id == site.key);
      if (!targetSite) {
        targetSite = SiteHealthModel.create({
          id: site.key,
          total: 1,
          sdate: alert.sdate ?? alert.Timezone ?? '',
          edate: alert.edate ?? alert.Timezone ?? '',
          isDismissAll: false,
          siteName: site.name,
          // dvrs: site.dvrs.map(dvr => dvr),
          dvrs: site.dvrs.map(dvr =>
            DVRModel.create({kDVR: dvr.kDVR, name: dvr.name})
          ),
        });
        self.siteHealthList.push(targetSite);
      }
      self.selectedSite = targetSite.id;
      __DEV__ &&
        console.log(
          'GOND onAlertNotification selectedSite ',
          self.selectedSite
        );
      self.isFromNotification = true;
      self.currentSiteName = site ? site.name : 'Unknown site';

      if (!self.alertTypesConfig || self.alertTypesConfig.length == 0) {
        self.alertTypesConfig = alertTypeConfigs;
      }

      let result = yield self.getHealthDetail(site.key);
      if (!result) return null;

      // __DEV__ &&
      //   console.log('GOND onAlertNotification 5 ', self.selectedSiteAlertTypes);

      // self.selectedAlertType = undefined;
      self.selectedAlertType = self.selectedSiteAlertTypes.find(
        item => item.alertId == alert.AlertType
      );

      if (self.selectedAlertType) {
        self.getAlertsByType(self.selectedAlertType.alertId);
        return {
          screen: ROUTERS.HEALTH_ALERTS,
          initial: false,
          // screen: ROUTERS.HEALTH_DETAIL,
          // params: {screen: ROUTERS.HEALTH_ALERTS},
        };
      }
      return {screen: ROUTERS.HEALTH_DETAIL, initial: false};
    }),
    // #endregion Alert notifications
    // #region Utilities:
    getAlertName(alertId) {
      if (self.alertTypesConfig && self.alertTypesConfig.length > 0) {
        const result = self.alertTypesConfig.find(type => type.id == alertId);
        if (result) return result.name;
      }
      return AlertNames[alertId] ?? 'Unknow alert: ' + alertId;
    },
    getAlertSnapShot(alert, alertType) {
      if (!alert) return;
      const _alertType = alertType ?? self.selectedAlertTypeId;

      if (_alertType == AlertTypes.DVR_Sensor_Triggered)
        return {
          controller: AlertRoute.controller,
          action: CommonActions.imageTime,
          id: alert.timezone,
          param: {
            thumb: true,
            download: false,
            next: false,
            kdvr: alert.KDVR,
            ch: alert.ChannelNo,
          },
          no_img: No_Image,
        };
      return {
        controller: ChannelRoute.controller,
        action: CommonActions.image,
        param: null,
        id: alert.kChannel,
        no_img: No_Image,
      };
    },
    // #endregion Utilities
    // #region Cleanup
    onExitHealthDetail() {
      self.selectedSiteAlertTypes = [];
      self.selectedAlertType = undefined;
      self.selectedSite = undefined;
      if (self.isFromNotification) {
        self.isFromNotification = false;
        self.currentSiteName = null;
      }
    },
    onExitAlertsView() {
      self.selectedAlert = undefined;
      self.alertsList = [];
      self.selectedAlertType = undefined;
      if (self.isFromNotification) {
        self.isFromNotification = false;
        self.currentSiteName = null;
      }
    },
    onExitAlertDetailView() {
      self.selectedAlert = undefined;
    },
    updateSite(_site) {
      self.siteHealthList.map(healthSite => healthSite.notifyUpdate(_site));
    },
    notifyRefeshFromNotif: flow(function* (naviService, alert) {
      if (self.selectedSite && self.selectedSite.siteName == alert.SiteName) {
        if (naviService.getCurrentRouteName() == ROUTERS.HEALTH_DETAIL) {
          self.getHealthDetail();
        } else if (naviService.getCurrentRouteName() == ROUTERS.HEALTH_ALERTS) {
          self.getAlertsByType();
        }
      }
    }),
    cleanUp() {
      applySnapshot(self, storeDefault);
    },
    // #endregion Cleanup
  }));

const storeDefault = {
  siteHealthList: [],
  date: '',
  alertDetailView: null,
  activeDVRAlert: null,
  isLoading: false,
};

const healthStore = HealthModel.create(storeDefault);

export default healthStore;
