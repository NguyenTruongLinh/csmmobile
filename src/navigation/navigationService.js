import {CommonActions, StackActions} from '@react-navigation/native';
import ROUTERS from '../consts/routes';

class NavigationService {
  constructor() {
    this.isReady = false;
    this.isReadyForPushShowing = false;
    this._navigator = null;
    this.state = null;
  }

  setTopLevelNavigator = navigatorRef => {
    if (!navigatorRef) return;
    __DEV__ && console.log('GOND setTopNav ref = ', navigatorRef);
    this._navigator = navigatorRef;
  };

  onReady = isReady => {
    __DEV__ && console.log('GOND ON NAVIGATION READY!');
    this.isReady = isReady == undefined ? true : isReady;
  };

  onStateChange = newState => {
    this.state = newState;
    if (!this.isReadyForPushShowing)
      this.isReadyForPushShowing =
        newState &&
        newState.routeNames &&
        JSON.stringify(newState.routeNames) ==
          JSON.stringify([
            ROUTERS.HOME_NAVIGATOR,
            ROUTERS.VIDEO_STACK,
            ROUTERS.ALARM_STACK,
            ROUTERS.OPTIONS_NAVIGATOR,
          ]);
  };

  /**
   *
   * @param {string} routeName
   * @param {object = {params, key}} options
   */
  navigate = (routeName, options) => {
    __DEV__ && console.log(`navigate routeName`, routeName, `options`, options);
    this._navigator.navigate(routeName, options);
  };

  replace = (routeName, options) => {
    this.back();
    setTimeout(() => {
      this.navigate(routeName, options);
    }, 200);
  };

  push = (routeName, params) => {
    if (
      this._navigator._navigation &&
      typeof this._navigator._navigation.push == 'function'
    ) {
      this._navigator._navigation.push(routeName, params);
    } else if (typeof this._navigator.push == 'function') {
      this._navigator.push(routeName, params);
    } else {
      console.log(
        'GOND naviService cannot push new view, use navigate instead'
      );
      this._navigator.dispatch(
        CommonActions.navigate({
          name: routeName,
          params,
        })
      );
    }
  };

  goBack = () => {
    this.back();
  };

  back = () => {
    __DEV__ && console.log('-- NAVIGATE BACK -- ');
    this._navigator.dispatch(CommonActions.goBack());
  };

  dismiss = () => {
    this._navigator.dispatch(CommonActions.back(null));
  };

  popToTop = (immediate = true) => {
    this._navigator.dispatch(StackActions.popToTop());
  };

  reset = ({actions, index}) => {
    this._navigator.dispatch(
      CommonActions.reset({
        // key: null,
        index,
        // actions,
      })
    );
  };

  getCurrentRouteName = () => {
    let _state = this.state;
    while (_state) {
      const currentRoute = _state.routes[_state.index];
      _state = currentRoute.state;
      if (!_state) {
        __DEV__ && console.log('GOND getCurrentRouteName ', currentRoute);
        return currentRoute.name;
      }
    }
    return 'Not ready yet';
  };

  getPreviousRouteName = () => {
    __DEV__ && console.log(`getPreviousRouteName`);
    let _state = this.state;
    while (_state) {
      const currentRoute = _state.routes[_state.index];
      let _nextState = currentRoute.state;
      if (!_nextState) {
        return _state.routes[_state.index - 1].name;
      } else {
        _state = _nextState;
      }
    }
    return 'Not ready yet';
  };

  getTopRouteName = () => {
    const {state} = this;
    if (state) return state.routes[state.index].name;
    return 'Not ready yet';
  };
}

// const naviService = new NavigationService();

// export default naviService;
export default NavigationService;
