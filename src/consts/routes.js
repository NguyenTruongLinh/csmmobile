import {
  // NavigationContainer,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';

const ROUTERS = {
  // SPLASH: 'splash',
  INTRO_CMS: 'introcms',
  INTRO_HEALTH: 'introhealth',
  INTRO_VIDEO: 'introvideo',
  INTRO_SMARTER: 'introsmarter',
  INTRO_OAM: 'introoam',
  INTRO_WELCOME: 'welcome',

  LOGIN: 'login',

  HOME_TAB: 'hometab',
  HOME_NAVIGATOR: 'homenavi',
  HOME: 'home',

  HEALTH: 'health',
  HEALTH_STACK: 'healthstack',
  HEALTH_SITES: 'healthsites',
  HEALTH_DETAIL: 'healthdetail',
  HEALTH_ALERTS: 'healthalerts',
  HEALTH_ALERT_DETAIL: 'healthalertsdetail',
  HEALTH_CHANNELS: 'healthchannels',

  VIDEO: 'video',
  VIDEO_STACK: 'videostack',
  VIDEO_REGIONS: 'videoregions',
  VIDEO_SITES: 'videosites',
  VIDEO_NVRS: 'videonvr',
  VIDEO_CHANNELS: 'videochannels',
  VIDEO_CHANNELS_SETTING: 'videochannelssetting',
  VIDEO_PLAYER: 'videoplayer',
  // VIDEO_LIVE: 'videolive',
  // VIDEO_SEARCH: 'videosearch',

  ALARM: 'alarm',
  ALARM_STACK: 'alarmstack',
  ALARM_LIVE_STACK: 'alarmlivestack',
  ALARM_LIVE: 'alarmlive',
  ALARM_SEARCH: 'alarmsearch',
  ALARM_DETAIL: 'alarmdetail',
  ALARM_SEARCH_DETAIL: 'alarmsearchdetail',

  OAM: 'oam',
  OAM_STACK: 'oamstack',
  OAM_SITES: 'oam',
  OAM_DETAIL: 'oamdetail',

  POS: 'pos',
  POS_STACK: 'posstack',
  TRANSACTIONS: 'trans',
  TRAN_DETAIL: 'trandetail',
  TRAN_DETAIL_FCM: 'trandetailFCM',

  OPTIONS: 'options',
  OPTIONS_NAVIGATOR: 'optionsnavi',
  OPTIONS_PROFILE: 'optionsprofile',
  OPTIONS_ABOUT: 'optionsabout',
  OPTIONS_NOTIFY: 'optionsnotify',
  OPTIONS_VIDEO: 'optionsvideo',
  // OPTIONS_LOGOUT: 'optionslogout',
};

export default ROUTERS;

export const getHeaderTitle = route => {
  // If the focused route is not found, we need to assume it's the initial screen
  // This can happen during if there hasn't been any navigation inside the screen
  // In our case, it's "Feed" as that's the first screen inside the navigator
  const routeName = route.name ?? getFocusedRouteNameFromRoute(route) ?? '';
  // __DEV__ &&
  //   console.log('GOND getHeaderTitle routeName = ', routeName, '\n++', route);

  switch (routeName) {
    case ROUTERS.HEALTH_SITES:
      return 'Health Monitor';
    case ROUTERS.HEALTH_DETAIL:
      return 'Site Health'; // TODO: site name get from store
    case ROUTERS.HEALTH_ALERTS:
      return 'Alerts'; // TODO: get from store
    case ROUTERS.HEALTH_ALERT_DETAIL:
      return 'Alert Detail'; // TODO: get from store

    case ROUTERS.VIDEO_REGIONS:
      return 'All Regions';
    case ROUTERS.VIDEO_SITES:
      return 'All Sites';
    case ROUTERS.VIDEO_NVRS:
      return 'NVRS';
    case ROUTERS.VIDEO_CHANNELS:
      return 'Channels';
    case ROUTERS.VIDEO_CHANNELS_SETTING:
      return 'Add Channel';
    // case ROUTERS.VIDEO_PLAYER:

    case ROUTERS.ALARM_LIVE:
      return 'Live';
    case ROUTERS.ALARM_SEARCH:
      return 'Search';
    case ROUTERS.ALARM_DETAIL:
    case ROUTERS.ALARM_SEARCH_DETAIL:
      return ''; // TODO: get from store

    case ROUTERS.OAM_SITES:
      return 'OAM';
    case ROUTERS.OAM_DETAIL:
      return 'OAM';

    case ROUTERS.POS:
      return 'POS';
    case ROUTERS.TRANSACTIONS:
      return 'Transactions';
    case ROUTERS.TRAN_DETAIL:
    case ROUTERS.TRAN_DETAIL_FCM:
      return 'Transaction detail';

    case ROUTERS.OPTIONS:
      return 'Settings';
    case ROUTERS.OPTIONS_PROFILE:
      return 'EDIT PROFILE';
    case ROUTERS.OPTIONS_ABOUT:
      return 'About';
    case ROUTERS.OPTIONS_NOTIFY:
      return 'Notification Settings';
    case ROUTERS.OPTIONS_VIDEO:
      return 'Video Settings';
  }
  return routeName;
};
