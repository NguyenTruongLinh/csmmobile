import { types/*, onSnapshot*/ } from 'mobx-state-tree';

const oamData = types.model({
  kdvr: types.identifierNumber,
  dvrName: types.string,
  siteName: types.string,
  occupancy: types.string,
  occupancyTitle: types.string,
  capacity: types.string,
  capacityTitle: types.string,
  untilCapacity: types.string,
  estWaitTime: types.string,
  dataTrendCount: types.integer,
  foreColor: types.string,
  backColor: types.string,
  channelNo: types.string,
  historicalData: types.array(types.number),
  forecastData: types.array(types.number),
  KAlertEventDetail: types.string,
  KAlertType: types.string,
  serverID: types.string,
  isOffline: types.boolean,
});

// onSnapshot(oamData, snapshot => {
// });

const oamStore = types.model({
  currentDVR: types.reference(oamData), // types.integer,
  oamList: types.map(oamData),
}).actions(self => ({
  onDataUpdate(newData) {
    // Do we need to save last data?
    // let previousData = self.oamList[newData.dvr] ? Object.assign(self.oamList[newData.dvr]) : {};
    // self.oamList[newData.dvr] = {
    self.oamList.put({
      dvrName: newData.dvrName,
      siteName: newData.siteName,
      occupancy: newData.occupancy,
      occupancyTitle: newData.occupancyTitle,
      capacity: newData.capacity,
      capacityTitle: newData.capacityTitle,
      untilCapacity: newData.untilCapacity,
      estWaitTime: newData.estWaitTime,
      dataTrendCount: newData.dataTrendCount,
      foreColor: newData.foreColor,
      backColor: newData.backColor,
      channelNo: newData.channelNo,
      historicalData: newData.historicalData,
      forecastData: newData.forecastData,
      kAlertEventDetail: newData.KAlertEventDetail,
      kAlertType: newData.KAlertType,
      serverID: newData.serverID,
      isOffline: newData.isOffline,
      // lastData: previousData,
    });
  }
})).create({
  currentDVR: null,
  oamList: {},
});

export default oamStore;
