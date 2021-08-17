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
    // _navStore: NavigationModel,
  })
  .actions(self => ({
    setTopLevelNavigator(navigatorRef, route) {
      if (!navigatorRef) return;
      __DEV__ && console.log('GOND setTopNav ref = ', navigatorRef);
      self._navigator = navigatorRef;
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
      __DEV__ && console.log('GOND getCurrentRouteName ', self._navigator);
      const {getCurrentRoute} = self._navigator;
      if (!getCurrentRoute || typeof getCurrentRoute != 'function') {
        __DEV__ &&
          console.log(
            'GOND getCurrentRouteName failed, not available ',
            self._navigator
          );
        return null;
      }
      const currentRoute = getCurrentRoute();
      __DEV__ && console.log('GOND getCurrentRouteName = ', currentRoute);
      return currentRoute ? currentRoute.name : '';
    },

    // showLoading() {
    //   // self._navStore.setLoading(true);
    // },

    // hideLoading() {
    //   // self._navStore.setLoading(false);
    // },

    // setSequenceNavigate(screenName) {
    //   subNavigations = screenName || '';
    // },

    // sequenceNavigate() {
    //   if (subNavigations) {
    //     navigate(subNavigations);
    //   }

    //   subNavigations = '';
    // },
  }));

// const naviService = new NavigationService();
// export default naviService;

export default NavigationService;

// export default {
//   navigate,
//   setTopLevelNavigator,
//   setNavigationStore,
//   // generateUid,
//   push,
//   back,
//   dismiss,
//   popToTop,
//   reset,
//   getCurrentRouteName,
//   // navigateToUserScreen,
//   showLoading,
//   hideLoading,
//   setSequenceNavigate,
//   sequenceNavigate,
// };
