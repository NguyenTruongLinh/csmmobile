import {types, flow} from 'mobx-state-tree';

import apiService from '../services/api';
import dbService from '../services/localdb';

const DeviceInfo = types.model({
  deviceId: types.string,
  fcmToken: types.string,
  apnsToken: types.string,
  deviceModel: types.string,
});

const getDefaultDeviceInfo = () =>
  DeviceInfo.create({
    deviceId: '',
    fcmToken: '',
    apnsToken: '',
    deviceModel: '',
  });

const appStore = types
  .model({
    nextScene: types.string,
    nextLogId: types.string,
    canRotate: types.boolean,
    // domains: types.array(types.string),
    domain: types.string,
    deviceInfo: DeviceInfo,
    showIntro: types.boolean,
    isLoading: types.boolean,
  })
  .views(self => ({
    getDeviceInfo() {
      return self.deviceInfo;
    },
  }))
  .actions(self => ({
    saveDeviceInfo(_device) {
      // if (!self.deviceInfo) self.deviceInfo = getDefaultDeviceInfo();
      self.deviceInfo = {...self.deviceInfo, _device};
    },
    allowRotation(isAllow) {
      self.canRotate = isAllow || false;
    },
    skipIntro() {
      self.showIntro = false;
    },
    setLoading(val) {
      self.isLoading = val || false;
    },
    loadLocalData: flow(function* loadLocalData() {
      const _id = yield dbService.deviceId();
      console.log('GOND get deviceId: ', _id);
      self.deviceInfo.deviceId = _id;
      apiService.updateDeviceId(_id);

      self.showIntro = yield dbService.isFirstLaunch();
    }),
  }))
  .create({
    nextScene: '',
    nextLogId: '',
    canRotate: false,
    domain: '',
    deviceInfo: DeviceInfo.create({
      deviceId: '',
      fcmToken: '',
      apnsToken: '',
      deviceModel: '',
    }),
    showIntro: false,
    isLoading: false,
  });

export default appStore;
