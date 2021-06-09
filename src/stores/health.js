import {types} from 'mobx-state-tree';

const AlertModel = types.model({
  id: types.identifierNumber,
  name: types.maybeNull(types.string),
  total: types.number,
  sdate: types.string, // should be Date or number?
  edate: types.string, // should be Date or number?
  isDismissAll: types.boolean,
  siteName: types.string,
  lowerCaseName: types.string,
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

const DVRAlertViewInfoModel = types.model({
  page: types.number,
  totalPages: types.number,
});

const DVRAlertViewModel = types.model({
  dvrAlerts: types.array(DVRAlertlModel),
  fields: types.map(types.string),
  info: DVRAlertViewInfoModel,
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
    // selectedHealthRow: types.maybeNull(AlertModel),
    alertsList: types.array(AlertModel),
    // alertTypes: types.array(AlertTypeModel),
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

const healthStore = HealthModel.create({
  alertsList: [],
  alertTypes: [],
  date: '',
  alertDetailView: null,
  activeDVRAlert: null,
});

export default healthStore;
