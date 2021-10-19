import {types, applySnapshot, flow} from 'mobx-state-tree';

import apiService from '../services/api';
import utils from '../util/general';
import snackbarUtil from '../util/snackbar';

import {Health as HealthRoute, Alert as AlertRoute} from '../consts/apiRoutes';
import {AlertTypes} from '../consts/misc';

const NotDismissableAlerts = [
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
    dvrs: types.array(types.number),
  })
  .views(self => ({
    get lowerCaseName() {
      return self.siteName.toLowerCase();
    },
  }));

const SiteAlertModel = types.model({
  alertId: types.identifierNumber,
  name: types.optional(types.string, 'Unknow alert'),
  total: types.number,
  sdate: types.string,
  edate: types.string,
  canDismiss: types.boolean,
});

const DVRModel = types.model({
  kDVR: types.number, //types.identifierNumber
  name: types.string,
});

const DVRAlertlModel = types.model({
  channelName: types.maybeNull(types.string),
  kDVR: types.number,
  id: types.identifierNumber, //types.maybeNull(types.number),
  kChannel: types.maybeNull(types.number),
  channelNo: types.maybeNull(types.number),
  timezone: types.string,
  time: types.string,
  dvr: DVRModel,
  image: types.maybeNull(types.string),
  imageInfo: types.maybeNull(types.string), // todo: define AlertImgInfoModel
});

// const DVRAlertViewInfoModel = types.model({
//   page: types.number,
//   totalPages: types.number,
// });

const HealthDetailModel = types.model({
  dvrAlerts: types.array(DVRAlertlModel),
  fields: types.map(types.string),
  // info: DVRAlertViewInfoModel,
  page: types.number,
  totalPages: types.number,
});

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
    selectedSiteAlerts: types.array(SiteAlertModel),
    date: types.string, // should be Date or number?
    //dvrAlerts: types.array(types.map),
    // healthDetail: types.maybeNull(HealthDetailModel),
    activeDVRAlert: types.maybeNull(DVRAlertlModel),
    isLoading: types.boolean,
  })
  .volatile(self => ({
    alertTypes: [],
  }))
  .views(self => ({
    // Group alert by site
    get alertSiteList() {},
    get filteredSites() {
      return self.siteHealthList.filter(s =>
        s.siteName.toLowerCase().includes(self.siteFilter.toLowerCase())
      );
    },
    get showDismissAllButtonInHealthDetail() {
      for (let i = 0; i < self.selectedSiteAlerts.length; i++) {
        if (!NotDismissableAlerts.includes(self.selectedSiteAlerts[i].alertId))
          return true;
      }
      return false;
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
    // #endregion Setters
    // #region Get data
    getHealthData: flow(function* (alertTypes, sitesList) {
      if (!alertTypes || !Array.isArray(alertTypes)) {
        console.log('GOND getDataHealth - alert type not provided');
        return;
      }
      self.isLoading = true;
      const params = alertTypes.reduce((result, val) => {
        self.alertTypes.push({id: val.id, name: val.name});
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
              if (site) {
                return SiteHealthModel.create({
                  id: siteData.Id,
                  name: siteData.Name,
                  total: siteData.Total,
                  sdate: siteData.sdate ?? '',
                  edate: siteData.edate ?? '',
                  isDismissAll: siteData.isDismissAll,
                  siteName: site.name,
                  dvrs: site.dvrs.map(dvr => dvr.kDVR),
                });
              }
              return null;
            })
            .filter(s => s != null)
            .sort((s1, s2) => s1.lowerCaseName < s2.lowerCaseName);
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
      self.selectedSiteAlerts = [];
      const _alertTypes = alertTypes ?? self.alertTypes;

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

        self.selectedSiteAlerts = res.summary.map(alert => {
          const alertType = _alertTypes.find(type => type.id == alert.Id);
          return SiteAlertModel.create({
            alertId: alert.Id,
            name: alertType ? alertType.name : 'Unknown alert',
            total: alert.Total ?? 0,
            sdate: alert.sdate,
            edate: alert.edate,
            canDismiss: !NotDismissableAlerts.includes(alert.Id),
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
    refreshHealthDetail: flow(function* () {
      return yield self.getHealthDetail();
    }),
    // #endregion Get data
    // #region Dismiss (Delete) alerts
    dismissAlert(target, description) {
      self.isLoading = true;
      try {
        if (target) {
          apiService.delete(
            AlertRoute.controller,
            String(target.alertId),
            AlertRoute.ignoreMutiAlertType,
            {
              Kdvrs: self.selectedSite.dvrs,
              Kalerttype: target.alertId,
              Sites: self.selectedSite.id,
              Description: description,
              sdate: utils.toQueryStringUTCDateTime(target.sdate),
              edate: utils.toQueryStringUTCDateTime(target.edate),
            }
          );
        } else {
          // dismiss all site alerts
          apiService.delete(
            AlertRoute.controller,
            String(self.selectedSite.id),
            AlertRoute.ignoreMutiAlertSite,
            {
              Kdvrs: self.selectedSite.dvrs,
              Sites: self.selectedSite.id,
              Description: description,
            }
          );
        }
      } catch (error) {
        __DEV__ && console.log('GOND get health detail data failed: ', error);
        snackbarUtil.handleRequestFailed();
        self.isLoading = false;
        return false;
      }
      self.isLoading = false;
      // Dismiss successfully, reload page:
      self.refreshHealthDetail();
      return true;
    },
    // #endregion Dismiss alert
    // #region Cleanup
    onExitHealthDetail() {
      self.selectedSite = null;
      self.selectedSiteAlerts = [];
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
