import {CommonActions, StackActions} from '@react-navigation/native';
import {types} from 'mobx-state-tree';

// import {
//   RouteParams,
//   navigationStore,
//   NavigationModel,
// } from '../stores/navigation';

// let this._navigator;
// let _navStore = navigationStore;

const NavigationService = types
  .model({
    _navigator: types.frozen(),
    isReady: types.boolean,
  })
  .volatile(self => ({
    state: null,
  }))
  .actions(self => ({
    setTopLevelNavigator(navigatorRef, route) {
      if (!navigatorRef) return;
      __DEV__ && console.log('GOND setTopNav ref = ', navigatorRef);
      self._navigator = navigatorRef;
    },
    onReady(isReady) {
      __DEV__ && console.log('GOND ON NAVIGATION READY!');
      self.isReady = isReady == undefined ? true : isReady;
    },
    onStateChange(newState) {
      self.state = newState;
    },

    // setNavigationStore(store) {
    //   self._navStore = store;
    // },

    /**
     *
     * @param {string} routeName
     * @param {object = {params, key}} options
     */
    navigate(routeName, options) {
      // const {params, key} = options || {params: undefined, key: undefined};
      // if (params || key) {
      //   const routeParams = RouteParams.create({routeKey: key, params: params});
      //   // self._navStore.setParamsForRoute(routeParams);
      // }
      // self._navigator.dispatch(
      //   CommonActions.navigate({
      //     name: routeName,
      //     key,
      //     params,
      //   })
      // );
      self._navigator.navigate(routeName, options);
    },

    push(routeName, params) {
      if (
        self._navigator._navigation &&
        typeof self._navigator._navigation.push == 'function'
      ) {
        self._navigator._navigation.push(routeName, params);
      } else if (typeof self._navigator.push == 'function') {
        self._navigator.push(routeName, params);
      } else {
        console.log(
          'GOND naviService cannot push new view, use navigate instead'
        );
        self._navigator.dispatch(
          CommonActions.navigate({
            name: routeName,
            params,
          })
        );
      }
    },

    goBack() {
      self.back();
    },

    back() {
      __DEV__ && console.log('-- NAVIGATE BACK -- ');
      self._navigator.dispatch(CommonActions.goBack());
    },

    dismiss() {
      self._navigator.dispatch(CommonActions.back(null));
    },

    popToTop(immediate = true) {
      self._navigator.dispatch({
        type: StackActions.popToTop(),
        immediate,
      });
    },

    reset({actions, index}) {
      self._navigator.dispatch(
        CommonActions.reset({
          // key: null,
          index,
          // actions,
        })
      );
    },

    getCurrentRouteName() {
      let _state = self.state;
      while (_state) {
        const currentRoute = _state.routes[_state.index];
        _state = currentRoute.state;
        if (!_state) return currentRoute.name;
      }

      return 'Not ready yet';
    },

    getTopRouteName() {
      const {state} = self;
      if (state) return state.routes[state.index].name;
      return 'Not ready yet';
    },
  }));

export default NavigationService;
