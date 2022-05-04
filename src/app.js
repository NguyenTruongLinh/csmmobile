import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StatusBar,
  BackHandler,
  Platform,
  Keyboard,
  NativeEventEmitter,
  // NativeModules,
  AppState,
  Text,
  SafeAreaView,
  LogBox,
} from 'react-native';
import {observer, inject} from 'mobx-react';
import Orientation from 'react-native-orientation-locker';
import DeviceInfo from 'react-native-device-info';

import CMSIntroView from '../views/intro/cmsIntro';

import AppNavigator from './navigation/appNavigator';
import NotificationController from './notification/notificationController';
// import navigationService from './navigation/navigationService';
// import navigationStore from './stores/navigation';

// import CMSTouchableIcon from './components/CMSTouchableIcon';
// import CMSModal from './components/CMSModal';
// import CMSBottomBar from './components/CMSBottomBar';
// import CMSNavBarCustom from './components/CMSNavBarCustom';
// import PushController from './PushController';
import {getwindow, isNullOrUndef} from './util/general';

// import styles from './styles/scenes/appnavigation.style';
import {ROUTERS, DateFormat, MODULE_PERMISSIONS} from './consts/misc';
import APP_INFO from './consts/appInfo';

import {CLOUD_TYPE} from './consts/video';
import CMSColors from './styles/cmscolors';
import {clientLogID} from './stores/user';
import {CHECK_UPDATE_FLAG} from './stores/appStore';

const {height, width} = getwindow(); //Dimensions.get('window')

// let selectedSite = [];
let LogActivityCMS = {
  UserID: 0,
  AccessTime: new Date(),
  PageURL: '',
  ReportID: 0,
  EnterTime: new Date(),
  LeaveTime: new Date(),
  ClientIP: '',
  ClientID: 0,
  OldState: '',
  NewState: '',
  PathApi: '',
  ClientTime: new Date(),
};
// <!-- END CONSTS -->
// ----------------------------------------------------

class App extends React.Component {
  // static propTypes = {
  // };

  constructor(props) {
    super(props);
    this.appState = AppState.currentState;
    this.allowRotation = true;
    this.locked = false;

    // this.pushController = undefined;
    this.appStateEventListener = null;
    // this.props.appStore.setLoading(true);
  }

  async componentDidMount() {
    const {appStore} = this.props;
    __DEV__ && console.log('GOND APP did mount');
    LogBox.ignoreLogs(['Trying to load empty source.']);
    this.appStateEvtListener = AppState.addEventListener(
      'change',
      this._handleAppStateChange
    );
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this.keyboardDidShow
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardDidHide
    );
    this.allowRotation = await this.getAutoRotateState();
    // this.props.publishRotationState(this.allowRotation);
    if (Platform.OS === 'android')
      this.checkAutoRotateTimer = setInterval(this.onCheckAutoRotateState, 100);

    Orientation.addDeviceOrientationListener(this._orientationDidChange);
    Orientation.lockToPortrait();
    // BackHandler.addEventListener('hardwareBackPress', this.handleBack);
    // let config = this.props.config;
    // if (!config || !config.isLoaded) this.props.LoadConfig();

    if (Platform.OS === 'ios') {
      try {
        const eventEmitter = new NativeEventEmitter(
          NativeModules.AppStateEventEmitter
        );
        this.appStateEventListener = eventEmitter.addListener(
          'onAppStateChange',
          this.onAPNSTokenRefreshed
        );
      } catch (error) {
        __DEV__ &&
          console.log(
            'GOND could not load native module: AppStateEventEmitter'
          );
      }
    }
    if (CHECK_UPDATE_FLAG) appStore.checkUpdate(this.autoLogin);
    else this.autoLogin();
    __DEV__ &&
      console.log(
        `checkNeedsUpdate DeviceInfo.getVersion = `,
        DeviceInfo.getVersion()
      );
  }

  autoLogin = async () => {
    // autoLogin
    // if (isLoggedIn) this.props.videoStore.getCloudSetting();
    const {appStore, userStore, videoStore, healthStore} = this.props;
    userStore.addAuthenticationEventListeners({
      onLogin: this.onLogin,
      onLogout: this.onLogout,
    });

    appStore.setLoading(true);
    await appStore.loadLocalData();
    // await this.props.userStore.loadLocalData();
    const isLoggedIn = await userStore.shouldAutoLogin();
    // setTimeout(() => {
    //   this.props.appStore.setLoading(false);
    //   this.setState({notificationController: <NotificationController />});
    // }, 100);
  };

  componentWillUnmount() {
    __DEV__ && console.log('app componentWillUnmount');
    if (this.checkAutoRotateTimer) clearInterval(this.checkAutoRotateTimer);
    AppState.removeEventListener('change', this._handleAppStateChange);
    // this.appStateEvtListener && this.appStateEvtListener.remove();
    Orientation.removeDeviceOrientationListener(this._orientationDidChange);
    //Forgetting to remove the listener will cause pop executes multiple times
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    this.keyboardDidShowListener && this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener && this.keyboardDidHideListener.remove();
    if (Platform.OS === 'ios' && this.appStateEventListener) {
      this.appStateEventListener.remove();
    }
  }

  getAutoRotateState = async () => {
    if (Platform.OS === 'android') {
      return new Promise(resolve =>
        Orientation.getAutoRotateState(state => resolve(state))
      );
    }
    return Promise.resolve(true);
  };

  lockOrientation = orientation => {
    switch (orientation) {
      case 'PORTRAIT':
      case 'FACE-UP':
        Orientation.lockToPortrait();
        break;
      case 'LANDSCAPE-LEFT':
        Orientation.lockToLandscapeLeft();
        break;
      case 'LANDSCAPE-RIGHT':
        Orientation.lockToLandscapeRight();
        break;
      case 'PORTRAIT-UPSIDEDOWN':
      case 'FACE-DOWN':
        Orientation.lockToPortraitUpsideDown();
        break;
      case 'UNKNOWN':
        __DEV__ && console.log('GOND lock to orientation UNKNOWN');
        break;
      default:
        Orientation.lockToPortrait();
        break;
    }
  };

  onAPNSTokenRefreshed = event => {
    // console.log('@GOND, onAppState event = ', event)
    if (!event) return;
    let {Id, Value} = event;
    if (isNullOrUndef(Id) && isNullOrUndef(Value)) {
      if (event.nativeEvent) {
        Id = event.nativeEvent.Id;
        Value = event.nativeEvent.Value;
      } else {
        return;
      }
    }

    this.onTokenMessage(Id, Value);
  };

  onTokenMessage = async (msgid, value) => {
    let {user, userStore} = this.props;
    switch (msgid) {
      case 1: //updated app state
        // if(user != undefined || user != null || user.isAuth != false)
        // console.log('@GOND, onAppState event 1, value = ', value)
        if (user && user.isAuth)
          await userStore.registerToken(
            user.Api,
            this.props.config.deviceid,
            this.state.FCMToken,
            this.state.DeviceInfor,
            this.state.APNSToken,
            value
          );
        break;
      case 2: //updated APNS
        this.setState({APNSToken: value});
        // console.log('@GOND, onAppState event 2')
        await userStore.registerToken(
          user.Api,
          this.props.config.deviceid,
          this.state.FCMToken,
          this.state.DeviceInfor,
          this.state.APNSToken,
          0
        );
        break;
      default:
        break;
    }
  };

  closeModal = () => {
    this.modal.close();
  };

  // inforSearch = data => {
  //   this.modal.close();
  //   // this.modal.Open = true;
  //   let sites = store.getState().sites;

  //   if (!sites || sites.length <= 0) {
  //     return;
  //   }

  //   let selected = _.filter(sites, i => {
  //     return _.includes(data.SitesSelected, i.Key);
  //   });
  //   selectedSite = selected;
  //   this.props.applyFilter(data);
  // };

  // renderRightButton = () => {
  //   let {user} = this.props;
  //   if (user && user.isAuth) {
  //     if (Actions.currentScene === ROUTERS.POS) {
  //       return (
  //         <CMSTouchableIcon
  //           size={20}
  //           color={CMSColors.ButtonRight}
  //           styles={styles.contentIcon_filter}
  //           onPress={this.onFilter.bind(this)}
  //           iconCustom="searching-magnifying-glass"
  //         />
  //       );
  //     } else {
  //       return <View />;
  //     }
  //   }
  // };

  onCheckAutoRotateState = async event => {
    return;
    if (
      this.checkAutoRotateLocked ||
      Actions.currentScene === ROUTERS.SPLASHPAGE ||
      Actions.currentScene === ROUTERS.LIVEVIDEOIOS ||
      Actions.currentScene === ROUTERS.LIVESTREAMING ||
      Actions.currentScene === ROUTERS.RTCSTREAMING
    )
      return;
    this.checkAutoRotateLocked = true;
    const canRotate = await this.getAutoRotateState();
    // console.log('GOND onCheckAutoRotateState, autoRotateState = ', canRotate, ', allowRotation = ', this.allowRotation) //, ', last orientation: ', this.lastOrientation)
    if (
      this.allowRotation !== canRotate ||
      canRotate === Orientation.isLocked()
    ) {
      this.allowRotation = canRotate;
      // this.props.publishRotationState(this.allowRotation);

      if (this.allowRotation) {
        Orientation.unlockAllOrientations();
        // Orientation.getDeviceOrientation(ort => this.lastOrientation = ort);
      } else {
        Orientation.getOrientation(ort => this.lockOrientation(ort));
      }
    }
    this.checkAutoRotateLocked = false;
  };

  _orientationDidChange = async orientation => {
    /*
    if (orientation && this.allowRotation) {
      let screen = {width: width, height: height, orient: orientation};
      let layout = GetStore('layout');
      let old_screen = layout.screen;

      if (
        !old_screen ||
        old_screen.width != screen.width ||
        old_screen.height != screen.height ||
        old_screen.orient
      ) {
        this.props.onFullScreen({...layout, screen: screen});
      }
      if (this.locked) {
        Orientation.unlockAllOrientations();
        this.locked = false;
      }
    }
    */
  };

  _handleAppStateChange = async nextAppState => {
    if (this.appState) {
      let {userStore} = this.props;
      __DEV__ &&
        console.log('GOND _handleAppStateChange nextAppState: ', nextAppState);
      if (nextAppState === 'active') {
        if (this.appState.match(/inactive|background/)) {
          console.log('App has come to the foreground!');
        } else {
          console.log('App launch');
        }
        userStore.setActivites(clientLogID.APP_TO_FOREGROUND);
      } else if (Platform.OS === 'android' || nextAppState === 'inactive') {
        userStore.setActivites(clientLogID.APP_TO_BACKGROUND);
      }
    }
    this.appState = nextAppState;
  };

  keyboardDidShow = () => {
    __DEV__ && console.log('GOND on keyboard showed');
  };

  keyboardDidHide = () => {
    __DEV__ && console.log('GOND on keyboard hidden');
  };

  onChangeToken = async token => {
    const {user, userStore} = this.props;
    if (!user) return;

    // console.log("GOND Token: " + token);
    let d_info = DeviceInfo.getModel();
    // user.Api.UpdateDeviceId(this.props.config.deviceid);
    this.setState({FCMToken: token, DeviceInfor: d_info});
    await userStore.registerToken(
      user.Api,
      this.props.config.deviceid,
      token,
      d_info,
      null,
      0
    );
  };

  onLogin = () => {
    const {videoStore, userStore, healthStore} = this.props;

    __DEV__ && console.log('GOND %%% ON LOGGED IN!');
    const isStreamingAvailable = userStore.hasPermission(
      MODULE_PERMISSIONS.VSC
    );
    videoStore.getCloudSetting(isStreamingAvailable);
    if (userStore.settings.alertTypes.length > 0)
      healthStore.saveAlertTypesConfig(userStore.settings.alertTypes);
  };

  onLogout = () => {
    __DEV__ && console.log('GOND %%% ON LOGGED OUT!');
    this.notifController && this.notifController.clearAllNotifications();
  };

  // renderBottomBar = () => {
  //   let user = this.props.user;
  //   if (user === undefined || user == null || user.isAuth === false) {
  //     console.log('GONDx renderBottomBar unknow user');
  //     return undefined;
  //   }

  //   // console.log('GONDx renderBottomBar scene: ', Actions.currentScene)
  //   if (
  //     Actions.currentScene !== ROUTERS.LOGIN &&
  //     Actions.currentScene !== ROUTERS.SPLASHPAGE &&
  //     // && Actions.currentScene !== ROUTERS.HOME
  //     Actions.currentScene !== ROUTERS.TRANS_DETAIL
  //   ) {
  //     return (
  //       <CMSBottomBar
  //         forwardRef={bar => (this.Bottombar = bar)}
  //         avtiveModules={this.props.user.Routes}
  //         OnChange={this.OnChangeModule}
  //       />
  //     );
  //   } else {
  //     console.log('GONDx renderBottomBar no-bar scene: ', Actions.currentScene);
  //   }
  //   return undefined;
  // };

  setNavigator = ref => {
    __DEV__ && console.log('GOND set top navigator: ', ref);
    this.props.appStore.setNavigator(ref);
  };

  render() {
    const {appStore} = this.props;
    const notificationController = (
      <NotificationController ref={r => (this.notifController = r)} />
    );
    // showIntro = true; // testing
    const {isLoggedIn} = this.props.userStore;

    return AppNavigator({
      isLoggedIn,
      notificationController,
      appStore,
    });
  }
}

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

export default inject(
  'appStore',
  'userStore',
  'videoStore',
  'healthStore'
)(observer(App));
