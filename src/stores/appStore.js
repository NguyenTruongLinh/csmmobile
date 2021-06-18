import {types, flow} from 'mobx-state-tree';

import apiService from '../services/api';
import dbService from '../services/localdb';
import NavigationService from '../navigation/navigationService';
import {NavigationModel} from '../stores/navigation';
import snackbarUtil from '../util/snackbar';

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
    naviService: NavigationService,
    showSearchBar: types.boolean,
  })
  .views(self => ({
    get getDeviceInfo() {
      return self.deviceInfo;
    },
    get naviStore() {
      return self.naviService._navStore();
    },
  }))
  .actions(self => ({
    saveDeviceInfo(_device) {
      // if (!self.deviceInfo) self.deviceInfo = getDefaultDeviceInfo();
      self.deviceInfo = {...self.deviceInfo, ..._device};
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
      try {
        self.showIntro = yield dbService.isFirstLaunch();

        const _id = yield dbService.deviceId();
        //  __DEV__ && console.log('GOND get deviceId: ', _id);
        self.deviceInfo.deviceId = _id;
        apiService.updateDeviceId(_id);
      } catch (err) {
        snackbarUtil.handleReadLocalDataFailed(err);
      }
    }),
    setNavigator(ref) {
      self.naviService.setTopLevelNavigator(ref);
      // __DEV__ && console.log('GOND setNavigator then ', self.naviService);
    },
    enableSearchbar(value) {
      __DEV__ && console.log('GOND store.enableSearchbar ', value);
      self.showSearchBar = value;
    },
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
    naviService: NavigationService.create({
      _navigator: null,
      _navStore: NavigationModel.create({paramsMap: {}}),
    }),
    showSearchBar: false,
  });

export default appStore;
