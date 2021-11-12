import {types, flow, applySnapshot} from 'mobx-state-tree';
import Snackbar from 'react-native-snackbar';

import {OAM} from '../consts/apiRoutes';
import apiService from '../services/api';
import cmscolors from '../styles/cmscolors';

const PVM_SNACK_BAR_MESSAGES = {
  PVM_OFFLINE: 'NVR is offline.',
  PVM_NO_UPDATE: 'No new data for more than 2 hours.',
  PVM_NOT_ENABLE: 'Site has no PVM enabled.',
};

const MOCK_DATA = {
  KAlertEventDetail: null,
  DVRUser: null,
  Occupancy: 0,
  OccupancyTitle: 'OCCUPANCY',
  Capacity: 400,
  CapacityTitle: 'UNTIL CAPACITY',
  UntilCapacity: 400,
  AboveCapacity: 0,
  EstWaitTime: 0,
  EstWaitTimeReadable: '00:00',
  DataTrend: 0,
  ForeColor: '#FFFFFF',
  BackColor: '#449D43',
  ChannelNo: 5,
  Historycals: [
    {
      Value: 0,
      Time: '2021-11-03T05:00:00Z',
      HourLabel: '5A',
    },
    {
      Value: 0,
      Time: '2021-11-03T06:00:00Z',
      HourLabel: '6A',
    },
    {
      Value: 0,
      Time: '2021-11-03T07:00:00Z',
      HourLabel: '7A',
    },
  ],
  ForeCasts: [
    {
      Value: 0,
      Time: '2021-11-03T08:00:00Z',
      HourLabel: '8A',
    },
    {
      Value: 0,
      Time: '2021-11-03T09:00:00Z',
      HourLabel: '9A',
    },
    {
      Value: 0,
      Time: '2021-11-03T10:00:00Z',
      HourLabel: '10A',
    },
  ],
  DataPoint: 3,
  Offline: false,
  KAlertEvent: 224838,
  KAlertType: 1,
  KDVR: 1105,
  DVRName: null,
  SiteName: 'Nuong',
  ServerID: 'Nuong123',
};
const timedValue = types.model({
  value: types.number,
  time: types.maybeNull(types.string),
  hourLabel: types.maybeNull(types.string),
});
const oamDismissInfo = types.model({
  cMSUser: types.maybeNull(types.string),
  note: types.maybeNull(types.string),
  time: types.maybeNull(types.string),
  kAlertEvent: types.maybeNull(types.number),
  kAlertType: types.maybeNull(types.number),
  kDVR: types.maybeNull(types.number),
  dvrName: types.maybeNull(types.string),
  siteName: types.maybeNull(types.string),
  serverID: types.maybeNull(types.string),
});

const oamData = types.model({
  kAlertEventDetail: types.maybeNull(types.number),
  dvrUser: types.maybeNull(types.string),
  occupancy: types.number,
  occupancyTitle: types.maybeNull(types.string),
  capacity: types.number,
  capacityTitle: types.maybeNull(types.string),
  untilCapacity: types.number,
  aboveCapacity: types.number,
  estWaitTime: types.number,
  estWaitTimeReadable: types.maybeNull(types.string),
  dataTrend: types.number,
  foreColor: types.maybeNull(types.string),
  backColor: types.maybeNull(types.string),
  channelNo: types.number,
  historycals: types.array(timedValue),
  foreCasts: types.array(timedValue),
  dataPoint: types.number,
  offline: types.boolean,
  kAlertEvent: types.number,
  kAlertType: types.number,
  kDVR: types.number,
  dvrName: types.maybeNull(types.string),
  siteName: types.maybeNull(types.string),
  serverID: types.maybeNull(types.string),
});

function parseTimedValueList(values) {
  __DEV__ && console.log('HAI parseTimedValueList values = ', values);
  let result = [];
  if (Array.isArray(values)) {
    values.forEach(item => {
      result.push(
        timedValue.create({
          value: item.Value,
          time: item.Time,
          hourLabel: item.HourLabel,
        })
      );
    });
  }
  console.log('HAI parseTimedValueList result = ', result);
  return result;
}
function parseOAMDismissInfo(dismissInfo) {
  return {
    cMSUser: dismissInfo.CMSUser,
    note: dismissInfo.Note,
    time: dismissInfo.Time,
    kAlertEvent: dismissInfo.KAlertEvent,
    kAlertType: dismissInfo.KAlertType,
    kDVR: dismissInfo.KDVR,
    dvrName: dismissInfo.DVRName,
    siteName: dismissInfo.SiteName,
    serverID: dismissInfo.ServerID,
  };
}
function parseOAMData(data) {
  let historycals = parseTimedValueList(data.Historycals);
  __DEV__ && console.log('HAI get OAM data: historycals = ', historycals);
  let foreCasts = parseTimedValueList(data.ForeCasts);
  __DEV__ && console.log('HAI get OAM data: foreCasts = ', foreCasts);
  return {
    kAlertEventDetail: data.KAlertEventDetail,
    dvrUser: data.DVRUser,
    occupancy: data.Occupancy,
    occupancyTitle: data.OccupancyTitle,
    capacity: data.Capacity,
    capacityTitle: data.CapacityTitle,
    untilCapacity: data.UntilCapacity,
    aboveCapacity: data.AboveCapacity,
    estWaitTime: data.EstWaitTime,
    estWaitTimeReadable: data.EstWaitTimeReadable,
    dataTrend: data.DataTrend,
    foreColor: data.ForeColor,
    backColor: data.BackColor,
    channelNo: data.ChannelNo,
    historycals: historycals,
    foreCasts: foreCasts,
    dataPoint: data.DataPoint,
    offline: data.Offline,
    kAlertEvent: data.KAlertEvent,
    kAlertType: data.KAlertType,
    kDVR: data.KDVR,
    dvrName: data.DVRName,
    siteName: data.SiteName,
    serverID: data.ServerID,
  };
}
export const OAMModel = types
  .model({
    title: types.maybeNull(types.string),
    isBottomTabShown: types.boolean,
    kdvr: types.number,
    data: types.maybeNull(oamData),
    isAckPopupVisible: types.boolean,
    // oamMap: types.map(oamData),
  })
  .views(self => ({
    // getData() {
    //   return self.data;
    // },
  }))
  .actions(self => ({
    setTitle(title) {
      self.title = title;
    },
    setKdvr(kdvr) {
      self.kdvr = kdvr;
      self.data = null;
      self.fetchData();
    },
    setIsBottomTabShown(isBottomTabShown) {
      self.isBottomTabShown = isBottomTabShown;
    },
    fetchData: flow(function* fetchData() {
      try {
        let newData = yield apiService.get(
          OAM.controller,
          self.kdvr,
          OAM.getLastDoorCountData
        );
        // newData = MOCK_DATA;
        __DEV__ && console.log('HAI get OAM data: ', JSON.stringify(newData));
        self.data = oamData.create(parseOAMData(newData));
        self.notifyShowSnackBarMessage();
      } catch (err) {
        __DEV__ && console.log('GOND Could not get sites data! ', err);
      }
    }),
    notifyShowSnackBarMessage() {
      if (!self.data.kDVR)
        Snackbar.show({
          text: self.data.offline
            ? PVM_SNACK_BAR_MESSAGES.PVM_OFFLINE
            : PVM_SNACK_BAR_MESSAGES.PVM_NO_UPDATE,
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: cmscolors.Danger,
        });
    },
    notifyRefeshFromPN(pnData) {
      if (self.data) {
        if (pnData.Note) {
          if (self.data.kAlertEventDetail == pnData.KAlertEvent)
            self.data.kAlertEventDetail = null;
        } else if (pnData.KDVR == self.data.kDVR || pnData.KDVR == self.kdvr)
          self.data = oamData.create(parseOAMData(pnData));
      }
    },
    postAcknowledge: flow(function* postAcknowledge(model, successCb, errorCb) {
      __DEV__ &&
        console.log(
          'HAI postAcknowledge successCb: ',
          JSON.stringify(successCb),
          ' errorCb',
          JSON.stringify(errorCb)
        );
      let error = false;
      let tempKAlertEventDetail = self.data.kAlertEventDetail;
      self.isAckPopupVisible = false;
      self.data.kAlertEventDetail = null;
      try {
        let res = yield apiService.post(
          OAM.controller,
          model.id || -1,
          OAM.acknowledgePVMAlert,
          model
        );
        __DEV__ &&
          console.log('HAI postAcknowledge data: ', JSON.stringify(res));
        error = !!res.error;
      } catch (err) {
        error = true;
        __DEV__ && console.log('HAI Could not postAcknowledge! ', err);
      }
      if (error) {
        Snackbar.show({
          text:
            'Failed to acknowledge (' +
            result.error +
            '), please try again later',
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: CMSColors.Danger,
        });
        self.isAckPopupVisible = true;
        self.data.kAlertEventDetail = tempKAlertEventDetail;
      }
    }),
    setAckPopupVisibility(visible) {
      self.isAckPopupVisible = visible;
    },
    cleanUp() {},
  }));

const oamStore = OAMModel.create({
  title: null,
  isBottomTabShown: true,
  kdvr: -1,
  data: null,
  dismissInfo: null,
  isAckPopupVisible: false,
});

export default oamStore;
