import {types} from 'mobx-state-tree';

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
    rotatable: types.boolean,
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
    canRotate() {
      return self.rotatable;
    },
  }))
  .actions(self => ({
    saveDeviceInfo(_device) {
      // if (!self.deviceInfo) self.deviceInfo = getDefaultDeviceInfo();
      self.deviceInfo = {...self.deviceInfo, _device};
    },
    allowRotation(isAllow) {
      self.rotatable = isAllow || false;
    },
    skipIntro() {
      self.showIntro = false;
    },
    setLoading(val) {
      self.isLoading = val || false;
    },
  }))
  .create({
    nextScene: '',
    nextLogId: '',
    rotatable: true,
    domain: '',
    deviceInfo: DeviceInfo.create({
      deviceId: '',
      fcmToken: '',
      apnsToken: '',
      deviceModel: '',
    }),
    showIntro: true,
    isLoading: false,
  });

export default appStore;
