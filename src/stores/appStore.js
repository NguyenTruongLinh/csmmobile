import {types} from 'mobx-state-tree';

const DeviceInfo = types.model({
  deviceId: types.string,
  fcmToken: types.string,
  apnsToken: types.string,
  deviceModel: types.string,
});

const appStore = types
  .model({
    nextScene: types.string,
    nextLogId: types.string,
    rotatable: types.boolean,
    // domains: types.array(types.string),
    domain: types.string,
    deviceInfo: DeviceInfo,
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
      // if (!self.deviceInfo) self.deviceInfo.create();
      self.deviceInfo = {...self.deviceInfo, _device};
    },
    allowRotation(isAllow) {
      self.rotatable = isAllow;
    },
  }))
  .create({
    nextScene: '',
    nextLogId: '',
    rotatable: true,
    domain: '',
    deviceInfo: DeviceInfo.create(),
  });

export default appStore;
