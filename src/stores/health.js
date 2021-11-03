import {types, applySnapshot, flow} from 'mobx-state-tree';

import {DVRModel} from './sites';
import apiService from '../services/api';
import utils from '../util/general';
import snackbarUtil from '../util/snackbar';

import {Health as HealthRoute, Alert as AlertRoute} from '../consts/apiRoutes';
import {AlertTypes} from '../consts/misc';
import {No_Image} from '../consts/images';

const NonDismissableAlerts = [
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
  })
  .views(self => ({
    get lowerCaseName() {
      return self.siteName.toLowerCase();
    },
  }));

const SiteAlertTypeModel = types
  .model({
    alertId: types.identifierNumber,
    name: types.optional(types.string, 'Unknow alert'),
    total: types.number,
    sdate: types.string,
    edate: types.string,
  })
  .views(self => ({
    get canDismiss() {
      return !NonDismissableAlerts.includes(self.alertId);
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
    dvr: types.reference(DVRModel),
    // image: types.maybeNull(types.string),
    // imageInfo: types.maybeNull(types.string), // todo: define AlertImgInfoModel
  })
  .volatile(self => ({
    image: null,
    imageInfo: null,
  }))
  .views(self => ({
    get kDVR() {
      return self.dvr.kDVR;
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
    selectedSite: types.maybeNull(types.reference(SiteHealthModel)),
    selectedSiteAlertTypes: types.array(SiteAlertTypeModel),
    selectedAlertType: types.maybeNull(types.reference(SiteAlertTypeModel)),

    date: types.string, // should be Date or number?
    alertsListByType: types.array(AlertModel),
    alertFilter: types.optional(types.string, ''),
    //dvrAlerts: types.array(types.map),
    // healthDetail: types.maybeNull(HealthDetailModel),
    // activeDVRAlert: types.maybeNull(DVRAlertlModel),
    isLoading: types.boolean,
    isLiveVideo: types.optional(types.boolean, false),

    //
    dismissModalShown: types.optional(types.boolean, false),
    selectedAlert: types.maybeNull(types.reference(AlertModel)),
    actionsModalShown: types.optional(types.boolean, false),

    //
    needRefresh: types.optional(types.boolean, 'false'),
  })
  .volatile(self => ({
    alertTypesConfig: [],
    // alertsListByType: [],
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
      return self.alertsListByType.filter(alert =>
        alert.channelName.toLowerCase().includes(self.alertFilter.toLowerCase())
      );
    },
    // get filteredAlertsGridView() {
    //   return self.alertsListByType
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
      return self.alertsListByType.findIndex(
        alert => alert.id == self.selectedAlert.id
      );
    },
  }))
  .actions(self => ({
    // #region Setters
    selectSite(value) {
      self.selectedSite = value;
    },
    setSiteFilter(value) {
      self.siteFilter = value;
    },
    setAlertFilter(value) {
      self.alertFilter = value;
    },
    selectAlertType(value) {
      self.selectedAlertType = value;
    },
    selectAlert(value) {
      __DEV__ && console.log('GOND +++++++ select Alert: ', value);
      if (self.alertsListByType.length == 0 || value == null) {
        self.selectedAlert = null;
        return;
      }
      self.selectedAlert =
        value == undefined ? self.alertsListByType[0] : value;
    },
    showActionsModal(isShow) {
      self.actionsModalShown = isShow;
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
    getHealthData: flow(function* (alertTypes, sitesList) {
      if (!alertTypes || !Array.isArray(alertTypes)) {
        console.log('GOND getDataHealth - alert type not provided');
        return;
      }
      self.isLoading = true;
      const params = alertTypes.reduce((result, val) => {
        self.alertTypesConfig.push({id: val.id, name: val.name});
        return result + val.id;
      }, '');
      try {
        const res = yield apiService.get(
          HealthRoute.summaryController,
          null,
          null,
          params
        );
        __DEV__ && console.log('GOND get health data: ', res);

        if (res.summary.length > 0) {
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
                return SiteHealthModel.create({
                  id: siteData.Id,
                  name: siteData.Name,
                  total: siteData.Total,
                  sdate: siteData.sdate ?? '',
                  edate: siteData.edate ?? '',
                  isDismissAll: siteData.isDismissAll,
                  siteName: site.name,
                  // dvrs: site.dvrs.map(dvr => dvr),
                  dvrs: site.dvrs.map(dvr =>
                    DVRModel.create({kDVR: dvr.kDVR, name: dvr.name})
                  ),
                });
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
        __DEV__ && console.log('GOND get health data failed: ', error);
        snackbarUtil.handleRequestFailed();
      }
      self.isLoading = false;
    }),
    getHealthDetail: flow(function* (alertTypes, siteKey) {
      const site =
        siteKey == undefined
          ? self.selectedSite
          : self.siteHealthList.find(s => (s.id = siteKey));
      if (!site) {
        console.log('GOND site not existed: ', siteKey);
        snackbarUtil.onMessage('Site is not existed');
        return false;
      }
      self.isLoading = true;
      self.selectedSiteAlertTypes = [];
      if (self.selectedAlertType) self.selectedAlertType = null;
      const _alertTypes = alertTypes ?? self.alertTypesConfig;

      try {
        const res = yield apiService.get(
          HealthRoute.summaryController,
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
          const alertType = _alertTypes.find(type => type.id == alert.Id);
          return SiteAlertTypeModel.create({
            alertId: alert.Id,
            name: alertType ? alertType.name : 'Unknown alert',
            total: alert.Total ?? 0,
            sdate: alert.sdate,
            edate: alert.edate,
            // canDismiss: NonDismissableAlerts.includes(alert.Id),
          });
        });
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
      self.isLoading = true;
      if (self.selectedAlert) self.selectedAlert = null;
      self.alertsListByType = [];

      const _alertType = alertType ?? self.selectedAlertType.alertId;
      __DEV__ &&
        console.log('GOND get alert type data dvrs: ', self.selectedSite.dvrs);
      try {
        const res = yield apiService.get(
          AlertRoute.controller,
          String(_alertType),
          AlertRoute.getByDvr,
          {
            kdvrs: self.selectedSite.dvrs.map(dvr => dvr.kDVR).join(','),
            sdate: utils.toQueryStringUTCDateTime(self.selectedSite.sdate),
            edate: utils.toQueryStringUTCDateTime(self.selectedSite.edate),
            // page: 0,
            // size: 10,
          }
        );
        __DEV__ && console.log('GOND get alert type data: ', res);
        if (!res.Data || res.Data.length == 0) {
          console.log('GOND alert type ', _alertType, ' has no alert data');
          self.isLoading = false;
          return true;
        }

        let defaultId = 0;
        self.alertsListByType = res.Data.map(alert => {
          defaultId++;
          return AlertModel.create({
            alertId: alert.Id ?? defaultId,
            channelName: alert.ChannelName ?? '',
            // kDVR: alert.KDVR,
            kChannel: alert.KChannel ?? 0,
            channelNo: alert.ChannelNo ?? 0,
            time: alert.Time ?? '',
            timezone: alert.TimeZone ?? '',
            dvr: self.selectedSite.dvrs.find(dvr => dvr.kDVR == alert.KDVR),
            // dvr: DVRModel.create(
            //   alert.DVR
            //     ? {kDVR: alert.DVR.KDVR, name: alert.DVR.Name}
            //     : {kDVR: alert.KDVR, name: ''}
            // ),
          });
        });
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
    // #region Utilities:
    getAlertSnapShot(alert, alertType) {
      if (!alert) return;
      const _alertType = alertType ?? self.selectedAlertTypeId;

      if (_alertType == AlertTypes.DVR_Sensor_Triggered)
        return {
          controller: 'alert',
          action: 'imagetime',
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
        controller: 'channel',
        action: 'image',
        param: null,
        id: alert.kChannel,
        no_img: No_Image,
      };
    },
    // #endregion Utilities
    // #region Cleanup
    onExitHealthDetail() {
      self.selectedSite = null;
      self.selectedAlertType = null;
      self.selectedSiteAlertTypes = [];
    },
    onExitAlertsView() {
      self.selectedAlert = null;
      self.alertsListByType = [];
      self.selectedAlertType = null;
    },
    onExitAlertDetailView() {
      self.selectedAlert = null;
    },
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
