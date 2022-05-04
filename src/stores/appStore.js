import {types, flow} from 'mobx-state-tree';

import apiService from '../services/api';
import dbService from '../services/localdb';
import NavigationService from '../navigation/navigationService';
// import {NavigationModel} from '../stores/navigation';
import snackbarUtil from '../util/snackbar';
import SpInAppUpdates, {
  NeedsUpdateResponse,
  IAUUpdateKind,
  StartUpdateOptions,
  AndroidInstallStatus,
} from 'sp-react-native-in-app-updates';
import {getAppstoreAppMetadata} from 'react-native-appstore-version-checker';
import variables from '../styles/variables';
import compareVersions from 'compare-versions';
import RNExitApp from 'react-native-exit-app';
import {BackHandler} from 'react-native';

export const CHECK_UPDATE_FLAG = false;
const IOS_APP_ID = '1315944118';
const APP_STORE_LINK = `itms-apps://itunes.apple.com/us/app/apple-store/${IOS_APP_ID}?mt=8`;

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
    showTabbar: types.boolean,
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
    setLoading(val = true) {
      self.isLoading = val;
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
    hideBottomTabs(isHide) {
      self.showTabbar = !isHide;
    },
    checkUpdate(noUpdateCb) {
      if (Platform.OS === 'android') self.checkUpdateAndroid(noUpdateCb);
      else self.checkUpdateIOS(noUpdateCb);
    },
    checkUpdateIOS(noUpdateCb) {
      getAppstoreAppMetadata(IOS_APP_ID) //put any apps id here
        .then(appVersion => {
          console.log(
            'checkUpdateIOS curVersion = ',
            variables.appVersion,
            'checkUpdateIOS appStoreVersion = ',
            JSON.stringify(appVersion)
          );
          if (compareVersions(appVersion.version, variables.appVersion, '>')) {
            Alert.alert(
              'New Update Available',
              'There is a version of app available. Please update it now',
              [
                {
                  text: 'Update Now',
                  onPress: () => {
                    Linking.openURL(APP_STORE_LINK).catch(err => {
                      console.error('checkUpdateIOS An error occurred', err);
                      noUpdateCb();
                    });
                    setTimeout(() => {
                      RNExitApp.exitApp();
                    }, 1000);
                  },
                },
              ]
            );
          } else {
            noUpdateCb();
          }
        })
        .catch(err => {
          console.log('checkUpdateIOS error occurred', err);
          noUpdateCb();
        });
    },
    checkUpdateAndroid(noUpdateCb) {
      self.setLoading(true);
      const inAppUpdates = new SpInAppUpdates(false);
      inAppUpdates.checkNeedsUpdate().then(result => {
        //{curVersion: '0.0.8'}
        self.setLoading(false);
        __DEV__ &&
          console.log(
            `checkNeedsUpdate shouldUpdate = `,
            result.shouldUpdate,
            `| storeVersion = `,
            result.storeVersion,
            `| reason = `,
            result.reason
          );
        if (result.shouldUpdate) {
          __DEV__ && console.log(`checkNeedsUpdate IF`);
          inAppUpdates.addStatusUpdateListener(status => {
            __DEV__ &&
              console.log(
                ` checkNeedsUpdate addStatusUpdateListener status = `,
                JSON.stringify(status)
              );
            snackbarUtil.showToast(
              'statusUpdateListenerE' + status.status,
              'red'
            );
          });
          inAppUpdates.addIntentSelectionListener(result => {
            __DEV__ &&
              console.log(
                ` checkNeedsUpdate addIntentSelectionListener result = `,
                JSON.stringify(result)
              );
            snackbarUtil.showToast(
              'addIntentSelectionListener result = ' + JSON.stringify(result),
              'red'
            );
            if (result == 6) BackHandler.exitApp();
          });
          inAppUpdates.startUpdate({
            updateType: IAUUpdateKind.IMMEDIATE,
          });
        } else {
          noUpdateCb();
          __DEV__ && console.log(`checkNeedsUpdate ELSE`);
        }
      });
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
      isReady: false,
      // _navStore: NavigationModel.create({paramsMap: {}}),
      isReadyForPushShowing: false,
    }),
    showSearchBar: false,
    showTabbar: true,
  });

export default appStore;
