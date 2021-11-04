import {types, flow, applySnapshot} from 'mobx-state-tree';
import {OAM} from '../consts/apiRoutes';
import apiService from '../services/api';
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
const oamData = types.model({
  kAlertEventDetail: types.maybeNull(types.number),
  dVRUser: types.maybeNull(types.string),
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
  dVRName: types.maybeNull(types.string),
  siteName: types.maybeNull(types.string),
  serverID: types.maybeNull(types.string),
});

// onSnapshot(oamData, snapshot => {
// });
const HIS_DATA = [
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
];
const FOR_DATA = [
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
];
function parseTimedValueList(values) {
  console.log('HAI parseTimedValueList values = ', values);
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

export const OAMModel = types
  .model({
    kdvr: types.number,
    data: types.maybeNull(oamData),
    // oamMap: types.map(oamData),
  })
  .views(self => ({
    // getData() {
    //   return self.data;
    // },
  }))
  .actions(self => ({
    setKdvr(kdvr) {
      self.kdvr = kdvr;
      self.data = null;
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
        let historycals = parseTimedValueList(newData.Historycals);
        __DEV__ && console.log('HAI get OAM data: historycals = ', historycals);
        let foreCasts = parseTimedValueList(newData.ForeCasts);
        __DEV__ && console.log('HAI get OAM data: foreCasts = ', foreCasts);
        self.data = oamData.create({
          kAlertEventDetail: newData.KAlertEventDetail,
          dVRUser: newData.DVRUser,
          occupancy: newData.Occupancy,
          occupancyTitle: newData.OccupancyTitle,
          capacity: newData.Capacity,
          capacityTitle: newData.CapacityTitle,
          untilCapacity: newData.UntilCapacity,
          aboveCapacity: newData.AboveCapacity,
          estWaitTime: newData.EstWaitTime,
          estWaitTimeReadable: newData.EstWaitTimeReadable,
          dataTrend: newData.DataTrend,
          foreColor: newData.ForeColor,
          backColor: newData.BackColor,
          channelNo: newData.ChannelNo,
          historycals: historycals, //HIS_DATA), //
          foreCasts: foreCasts, //FOR_DATA), //
          dataPoint: newData.DataPoint,
          offline: newData.Offline,
          kAlertEvent: newData.KAlertEvent,
          kAlertType: newData.KAlertType,
          kDVR: newData.KDVR,
          dVRName: newData.DVRName,
          siteName: newData.SiteName,
          serverID: newData.ServerID,
        });
      } catch (err) {
        __DEV__ && console.log('GOND Could not get sites data! ', err);
      }
    }),
    cleanUp() {},
  }));

const oamStore = OAMModel.create({
  kdvr: -1,
  data: null,
});

export default oamStore;
