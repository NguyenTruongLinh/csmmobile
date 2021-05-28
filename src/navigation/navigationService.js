import {CommonActions, StackActions} from '@react-navigation/native';
import {RouteParams, navigationStore} from '../stores/navigation';

let _navigator;
let _navStore = navigationStore;

function setTopLevelNavigator(navigatorRef) {
  console.log('GOND setTopNav ref = ', navigatorRef);
  _navigator = navigatorRef;
}

function setNavigationStore(store) {
  _navStore = store;
}

/**
 *
 * @param {string} routeName
 * @param {object = {params, key}} options
 */
function navigate(routeName, options) {
  const {params, key} = options || {params: undefined, key: undefined};
  if (params || key) {
    console.log('FFFFFFFFFF');
    const routeParams = RouteParams.create({routeKey: key, params: params});
    _navStore.setParamsForRoute(routeParams);
  }
  _navigator.dispatch(
    CommonActions.navigate({
      name: routeName,
      key,
      params,
    })
  );
}

function push(routeName, params) {
  // console.log("navigator", _navigator);
  _navigator._navigation.push(routeName, params);
}

function back() {
  console.log('-- NAVIGATE BACK -- ');
  _navigator.dispatch(CommonActions.goBack());
}

function dismiss() {
  _navigator.dispatch(CommonActions.back(null));
}

function popToTop(immediate = true) {
  _navigator.dispatch({
    type: StackActions.popToTop(),
    immediate,
  });
}

function reset({actions, index}) {
  _navigator.dispatch(
    CommonActions.reset({
      // key: null,
      index,
      // actions,
    })
  );
}

function getCurrentRouteName(navigationState) {
  if (!navigationState) {
    return null;
  }

  const route = navigationState.routes[navigationState.index];

  if (route.routes) {
    return getCurrentRouteName(route);
  }

  return route.routeName;
}

function showLoading() {
  // _navStore.setLoading(true);
}

function hideLoading() {
  // _navStore.setLoading(false);
}

function setSequenceNavigate(screenName) {
  subNavigations = screenName || '';
}

function sequenceNavigate() {
  if (subNavigations) {
    navigate(subNavigations);
  }

  subNavigations = '';
}

export default {
  navigate,
  setTopLevelNavigator,
  setNavigationStore,
  // generateUid,
  push,
  back,
  dismiss,
  popToTop,
  reset,
  getCurrentRouteName,
  // navigateToUserScreen,
  showLoading,
  hideLoading,
  setSequenceNavigate,
  sequenceNavigate,
};
