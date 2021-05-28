import {types} from 'mobx-state-tree';

const AlertModel = types.model({
  id: types.identifierNumber,
  name: types.maybeNull(types.string),
  total: types.integer,
  sdate: types.string, // should be Date or number?
  edate: types.string, // should be Date or number?
  isDismissAll: types.boolean,
  siteName: types.string,
  lowerCaseName: types.string,
});

const DVRModel = types.model({
  kDVR: types.integer, //types.identifierNumber
  name: types.string,
});

const DVRAlertlModel = types.model({
  channelName: types.maybeNull(types.string),
  kDVR: types.integer,
  id: types.identifierNumber, //types.maybeNull(types.number),
  kChannel: types.maybeNull(types.integer),
  channelNo: types.maybeNull(types.integer),
  timezone: types.string,
  time: types.string,
  dvr: DVRModel,
  image: types.maybeNull(types.string),
  imageInfo: types.maybeNull(types.string), // todo: define AlertImgInfoModel
});

const DVRAlertViewInfoModel = types.model({
  page: types.integer,
  totalPages: types.integer,
});

const DVRAlertViewModel = types.model({
  dvrAlerts: types.array(DVRAlertlModel),
  fields: types.map(types.string),
  info: DVRAlertViewInfoModel,
});

const AlertTypeModel = types.model({
  id: types.identifierNumber,
  kAlertSeverity: types.integer,
  name: types.string,
  cmsWebType: types.integer,
  cmsWebGroup: types.integer,
  displayStatus: types.integer,
});

export const HealthModel = types
  .model({
    // selectedHealthRow: types.maybeNull(AlertModel),
    alertsList: types.array(AlertModel),
    alertTypes: types.array(AlertTypeModel),
    date: types.string, // should be Date or number?
    //dvrAlerts: types.array(types.map),
    alertDetailView: types.maybeNull(DVRAlertViewModel),
    activeDVRAlert: types.maybeNull(DVRAlertlModel),
  })
  .views(self => ({
    // Group alert by site
    get alertSiteList() {},
  }))
  .actions(self => ({}));

export const healthStore = HealthModel.create({
  alertsList: [],
  alertTypes: [],
  date: '',
  alertDetailView: null,
  activeDVRAlert: null,
});

// export const HealthModel = {};
// export default healthStore;
