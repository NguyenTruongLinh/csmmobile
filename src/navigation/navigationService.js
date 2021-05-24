import {NavigationActions} from 'react-navigation';
import {RouteParams, RouteParam} from '../stores/NavigationStore';
let _navigator, _navStore;

function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

function setNavigationStore(navigationStore) {
  _navStore = navigationStore;
}

function navigate(routeName, {params, key}) {
  const routeParams = RouteParams.create({routeKey: key, params});
  _navStore.setParamsForRoute(routeParams);
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      key,
    })
  );
}

function navigateToUserScreen(user) {
  navigate('UserScreen', {
    params: {user},
    key: 'UserScreen',
  });
}

export default {
  navigate,
  setTopLevelNavigator,
  setNavigationStore,
  generateUid,
  navigateToUserScreen,
};
