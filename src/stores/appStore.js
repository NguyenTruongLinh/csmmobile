import {Alert, BackHandler, Linking} from 'react-native';
import {types, flow} from 'mobx-state-tree';

import apiService from '../services/api';
import dbService from '../services/localdb';
import NavigationService from '../navigation/navigationService';
import compareVersions from 'compare-versions';
import RNExitApp from 'react-native-exit-app';
import {getAppstoreAppMetadata} from 'react-native-appstore-version-checker';
// import {NavigationModel} from '../stores/navigation';
import snackbarUtil from '../util/snackbar';
import SpInAppUpdates, {
  NeedsUpdateResponse,
  IAUUpdateKind,
  StartUpdateOptions,
  AndroidInstallStatus,
} from 'sp-react-native-in-app-updates';

import {getStoreVersion} from '../consts/appInfo';
import {Login as LoginTxt} from '../localization/texts';
import variables from '../styles/variables';

export const CHECK_UPDATE_FLAG = true;
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
    showSearchBar: types.boolean,
    showTabbar: types.boolean,
  })
  .volatile(self => ({
    naviService: new NavigationService(),
    modalRef: null,
    appState: null, // 'active',
  }))
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
    setModalRef(value) {
      self.modalRef = value;
    },
    setCurrentAppState(value) {
      if (
        (!value && typeof value != 'string') ||
        !value.match(/active|inactive|background/)
      ) {
        __DEV__ && console.log('GOND invalid appState: ', value);
      }
      self.appState = value;
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
    checkUpdateIOS: flow(function* (noUpdateCb) {
      self.setLoading(true);
      const localVersion = getStoreVersion();

      try {
        const appVersion = getAppstoreAppMetadata(IOS_APP_ID); //put any apps id here
        console.log(
          'checkUpdateIOS curVersion = ',
          variables.appVersion,
          ', local version: ',
          localVersion,
          'checkUpdateIOS appStoreVersion = ',
          // JSON.stringify(appVersion)
          appVersion.version
        );
        if (compareVersions.compare(appVersion.version, localVersion, '>')) {
          Alert.alert(LoginTxt.ALERT_UPDATE_TITLE, LoginTxt.ALERT_UPDATE_BODY, [
            {
              text: LoginTxt.ALERT_UPDATE_BUTTON,
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
          ]);
        } else {
          noUpdateCb();
        }
      } catch (err) {
        console.log('checkUpdateIOS error occurred', err);
        noUpdateCb();
        self.setLoading(false);
        return;
      }
      self.setLoading(false);
    }),
    checkUpdateAndroid: flow(function* (noUpdateCb) {
      __DEV__ &&
        console.log(`checkNeedsUpdate checkUpdateAndroid: `, getStoreVersion());
      self.setLoading(true);
      try {
        const inAppUpdates = new SpInAppUpdates(false);
        const result = yield inAppUpdates.checkNeedsUpdate();
        self.setLoading(false);

        if (result.shouldUpdate) {
          __DEV__ && console.log(`checkNeedsUpdate IF`);
          inAppUpdates.addStatusUpdateListener(status => {
            __DEV__ &&
              console.log(
                ` checkNeedsUpdate addStatusUpdateListener status = `,
                JSON.stringify(status)
              );
          });
          inAppUpdates.addIntentSelectionListener(result => {
            __DEV__ &&
              console.log(
                ` checkNeedsUpdate addIntentSelectionListener result = `,
                JSON.stringify(result)
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
      } catch (error) {
        self.setLoading(false);
        noUpdateCb();
        __DEV__ &&
          console.log(
            '🚀 ~ file: appStore.js ~ inAppUpdates.checkNeedsUpdate ~ error',
            error
          );
      }
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
    // naviService: NavigationService.create({
    //   _navigator: null,
    //   isReady: false,
    //   // _navStore: NavigationModel.create({paramsMap: {}}),
    //   isReadyForPushShowing: false,
    // }),
    // naviService: new NavigationService(),
    showSearchBar: false,
    showTabbar: true,
  });

export default appStore;
