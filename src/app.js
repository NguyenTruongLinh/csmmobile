import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  StatusBar,
  BackHandler,
  Platform,
  Keyboard,
  NativeEventEmitter,
  NativeModules,
  AppState,
  Text,
  SafeAreaView,
} from 'react-native';
import {observer, inject} from 'mobx-react';
import Orientation from 'react-native-orientation-locker';

import Snackbar from 'react-native-snackbar';
import DeviceInfo from 'react-native-device-info';

import CMSIntroView from '../views/intro/cmsIntro';

import AppNavigator from './navigation/appNavigator';
// import navigationService from './navigation/navigationService';
// import navigationStore from './stores/navigation';

// import CMSAvatars from './components/CMSAvatars';
// import CMSModal from './components/CMSModal';
// import CMSBottomBar from './components/CMSBottomBar';
// import CMSNavBarCustom from './components/CMSNavBarCustom';
// import PushController from './PushController';
import {getwindow, isNullOrUndef} from './util/general';

// import styles from './styles/scenes/appnavigation.style';
import {ROUTERS, DateFormat, Store_Name} from './consts/misc';
import APP_INFO from './consts/appInfo';

import {STREAMING_TYPES} from './consts/video';
import CMSColors from './styles/cmscolors';

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
        console.log('GOND lock to orientation UNKNOWN');
        break;
      default:
        Orientation.lockToPortrait();
        break;
    }
  };

  // onFilter = () => {
  //   const state = store.getState();
  //   let sdate, edate;
  //   if (selectedSite.length == 0) {
  //     selectedSite = state.sites;
  //   }

  //   if (!selectedSite || selectedSite.length <= 0) {
  //     return;
  //   }

  //   let strDateNow = new Date();
  //   strDateNow.setDate(strDateNow.getDate() - 1);
  //   sdate = strDateNow;
  //   edate = strDateNow;
  //   if (state.posexception.Filter) {
  //     sdate = state.posexception.Filter.date_from
  //       ? state.posexception.Filter.date_from
  //       : sdate;
  //     edate = state.posexception.Filter.date_to
  //       ? state.posexception.Filter.date_to
  //       : edate;
  //   }
  //   let s = Actions.currentScene;
  //   let idSelect = _(selectedSite)
  //     .map(x => x.Key)
  //     .value();
  //   this.refs.cmsmodal.setState({
  //     data: state.sites,
  //     SitesSelected: idSelect,
  //     date_from: sdate,
  //     date_to: edate,
  //   });
  //   // this.modal.Open = true;
  //   this.modal.open();
  // };

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

  onTokenMessage = (msgid, value) => {
    let {user} = this.props;
    switch (msgid) {
      case 1: //updated app state
        // if(user != undefined || user != null || user.isAuth != false)
        // console.log('@GOND, onAppState event 1, value = ', value)
        if (user && user.isAuth)
          registoken(
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
        registoken(
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
  //         <CMSAvatars
  //           size={20}
  //           color={CMSColors.buttonRight}
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

  async componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
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
      const eventEmitter = new NativeEventEmitter(
        NativeModules.AppStateEventEmitter
      );
      this.appStateEventListener = eventEmitter.addListener(
        'onAppStateChange',
        this.onAPNSTokenRefreshed
      );
    }

    // autoLogin
    this.props.appStore.setLoading(true);
    await this.props.appStore.loadLocalData();
    // await this.props.userStore.loadLocalData();
    this.props.userStore.shouldAutoLogin();
    this.props.appStore.setLoading(false);
  }

  componentWillUnmount() {
    console.log('app componentWillUnmount');
    if (this.checkAutoRotateTimer) clearInterval(this.checkAutoRotateTimer);
    AppState.removeEventListener('change', this._handleAppStateChange);
    Orientation.removeDeviceOrientationListener(this._orientationDidChange);
    //Forgetting to remove the listener will cause pop executes multiple times
    // BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
    if (Platform.OS === 'ios') {
      this.appStateEventListener.remove();
    }
  }

  _handleAppStateChange = nextAppState => {
    console.log('GOND _handleAppStateChange nextAppState: ', nextAppState);
    if (nextAppState === 'active' && this.appState) {
      if (this.appState.match(/inactive|background/)) {
        console.log('App has come to the foreground!');
      } else {
        console.log('App launch');
        // if (this.props.user.Api)
        //   this.props.GetCloudType(this.props.user.Api, this.props.user.Api._ApiToken.devId);
        // else
        //   console.log('%c Warning! Cannot get cloud config user API not defined!', 'color: red; font-style: bold')
      }
    } else {
      let {user, app} = this.props;
      // setActivites(user, {
      //   LogID: app.nextLogId,
      //   ClientName: APP_INFO.Name,
      //   Version: APP_INFO.Version,
      //   ClientTime: new Date(),
      // });
      console.log(nextAppState);
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
    const user = this.props.user;
    if (!user) return;

    // console.log("GOND Token: " + token);
    let d_info = DeviceInfo.getModel();
    // user.Api.UpdateDeviceId(this.props.config.deviceid);
    this.setState({FCMToken: token, DeviceInfor: d_info});
    await registoken(
      user.Api,
      this.props.config.deviceid,
      token,
      d_info,
      null,
      0
    );
  };

  onLogIn = () => {
    console.log('GOND %%% ON LOGGED IN! user = ', nextProps.user);
    // if (nextProps.user.Api)
    //   this.props.GetCloudType(nextProps.user.Api, nextProps.user.Api._ApiToken.devId);
    // else
    //   console.log('%c Warning! Cannot get cloud config user API not defined!', 'color: red; font-style: bold')
  };

  onLogOut = () => {
    console.log('GOND %%% ON LOGGED OUT!');
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
  //     Actions.currentScene !== ROUTERS.TRAN_DETAIL
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

  /*
  render() {
    // let Bottombar = this.renderBottomBar();
    // dongpt: this StatusBar use for handling bunny ear screen in android platform, considering render only for android
    // let StatusBar = this.renderStatusBar();

    return (
      <>
        <View style={[styles.container]}>
          {_PushController}
          {StatusBar}

          <CMSModal
            ref="cmsmodal"
            title="Search conditions"
            type="filter"
            eventSubmit={param => this.inforSearch(param)}
            _modal={el => {
              this.modal = el;
            }}
            eventClose={this.closeModal}
          />
          {Bottombar}
        </View>
      </>
    );
  }
  */

  render() {
    const {showIntro, isLoading} = this.props.appStore;
    const {isLoggedIn} = this.props.userStore;
    return AppNavigator({
      showIntro,
      isLoading,
      isLoggedIn,
    });
  }
}

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

export default inject('appStore', 'userStore')(observer(App));
