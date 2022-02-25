export const VSCCommand = {
  LIVE: 0,
  SEARCH: 1,
  TIMELINE: 2,
  DAYLIST: 3,
  LIVEHD: 4,
  SEARCHHD: 5,
  TIMEZONE: 6,
  RCTLIVE: 7,
  STOP: 99,
};

export const VSCCommandString = {
  LIVE: 'LIVE',
  SEARCH: 'SEARCH',
  TIMELINE: 'TIMELINE',
  DAYLIST: 'DAYLIST',
  LIVEHD: 'LIVEHD',
  SEARCHHD: 'SEARCHHD',
  TIMEZONE: 'TIMEZONE',
  RCTLIVE: 'RCTLIVE',
  STOP: 'STOP',
};

export const VIDEO_MESSAGE = {
  MSG_GET_CONNECTION: 'Getting connection.',
  MSG_GET_CONNECTION_ERROR: 'Cannot get info from CMS server. Error: ',
  MSG_GET_CONNECTION_FAILED: 'Cannot get info from CMS server.',
  MSG_GET_CONNECTION_CHANNEL_FAILED: 'Cannot get channel info from CMS server.',
  MSG_CONNECTING_NVR: 'Connecting to NVR.',
  MSG_CONNECTED_NVR: 'Connected.',
  MSG_CONNECTING_STREAM: 'Connecting to streaming service.',
  MSG_STREAM_CONNECTED: 'Connected.',
  MSG_STREAM_ERROR: 'Stream data error.',
  MSG_STREAM_TIMEOUT: 'Timeout.',
  MSG_NETWORK_FAILED: 'Network connection failed.',
  MSG_LOW_BUFFER: 'Buffer amount is low.',
  MSG_AUTH_BEGIN: 'Login...',
  MSG_LOGIN_FAILED: 'Incorect NVR Username or Password.',
  MSG_LOGIN_SUCCESS: 'Login successfully.',
  MSG_SERVER_REJECT: 'NVR rejected connection.',
  MSG_WRONG_SERVER_ID: 'Server ID is incorrect.',
  MSG_VIDEO_PORT_ERROR: 'Video socket error.',
  MSG_CANNOT_CONNECT_NVR: 'Failed to connect NVR.',
  MSG_NVR_USER_CHANGED: 'NVR user has changed.',
  MSG_NVR_INFO_CHANGED: 'NVR info has changed.',
  MSG_NVR_COMMUNATION_PORT_CHANGED: 'NVR communincation port has changed.',
  MSG_NVR_RECORDING_ONLY: 'NVR is recording only. Cannot play back.',
  MSG_NVR_CHANNEL_NOT_PERMISSION: "You don't have permission.",
  MSG_GET_VIDEO_HLS: 'Connect HTTP Live Stream successfully',
  MSG_CONNECT_HLS: 'Connectting to HTTP Live Stream ...',
  MSG_TRYLOAD_VIDEO_HLS: 'Possible connection loss or connection is too slow',
  MSG_RECONNECT_NVR: 'Reconnect to NVR in ',
  STR_SECONDS: 'second(s).',
  STR_RECONNECT: 'Reconnect',
  MSG_NO_VIDEO_DATA: 'No video data.',
};

export const Video_State = {STOP: 0, PLAY: 1, PAUSE: 2};

export const CLOUD_TYPE = {
  UNKNOWN: -2,
  DEFAULT: -1,
  DIRECTION: 0,
  HLS: 1,
  RTC: 2,
  TOTAL: 3,
};

export const RTC_COMMANDS = {
  LIVE: 'live',
  SEARCH: 'search',
  TIMELINE: 'timeline',
  TIMEZONE: 'timezone',
  DAYLIST: 'daylist',
  PAUSE: 'pause',
  // on response from datachannel
  TIMESTAMP: 'Timestamp',
  TEXTOVERLAY: 'TO',
};

// export const STREAM_STATUS = {
//   DONE: '',
//   WAITING: 'Waiting for connection...',
//   CONNECTING: 'Connecting...',
//   CONNECTED: 'Connected.',
//   BUFFERING: 'Buffering...',
//   ERROR: 'Network Error.',
//   TIMEOUT: 'Time out.',
//   NOVIDEO: 'No video.',
//   DISCONNECTED: 'Disconnected.',
// };

export const NATIVE_MESSAGE = {
  FRAME_DATA: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  LOGIN_MESSAGE: 3,
  LOGIN_FAILED: 4,
  LOGIN_SUCCCESS: 5,
  SVR_REJECT_ACCEPT: 6,
  LOGIN_MESSAGE_WRONG_SERVERID: 7,
  LOGIN_MESSAGE_VIDEO_PORT_ERROR: 8,
  CANNOT_CONNECT_SERVER: 9,
  ORIENTATION_CHANGED: 10,
  VIEW_CLICK: 11,
  SEARCH_NO_DATA: 12,
  SEARCH_FRAME_TIME: 13,
  SERVER_CHANGED_CURRENT_USER: 14,
  SERVER_CHANGED_SERVER_INFO: 15,
  SERVER_CHANGED_PORTS: 16,
  SERVER_RECORDING_ONLY: 17,
  SERVER_CHANNEL_DISABLE: 18,
  PERMISSION_CHANNEL_DISABLE: 19,
  RECORDING_DATE: 20,
  TIME_DATA: 21,
  HOUR_DATA: 22,
  RULER_DST: 23,
  UNKNOWN: 24,
  SERVER_MESSAGE: 25,
  SHOULD_RECONNECT: 26,
  SERVER_DISCONNECTED: 27,
};

export const arrayof24HTime = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];
export const arrayof12HTime = [
  '12:00 AM',
  '01:00 AM',
  '02:00 AM',
  '03:00 AM',
  '04:00 AM',
  '05:00 AM',
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
  '11:00 PM',
];
export const BEGIN_OF_DAY_STRING = '00:00:00';
export const END_OF_DAY_STRING = '23:59:59';
export const HOURS_ON_SCREEN = 4;
export const MINUTE_PER_HOUR = 60;
export const SECONDS_PER_MINUTE = 60;

export const USE_TIMESTAMP = true;

export const DAY_INTERVAL = 86399;
export const default24H = 24;
export const startDST = 23;
export const endDST = 25;
export const Limit_Time_Allow_Change_Live_Search = 1;
export const HoursOnScreen = 4;

export const DEFAULT_REGION = 'us-east-1';
export const IS_FORCE_TURN = true;
export const IS_OPEN_DATA_CHANNEL = true;
export const USE_TRICKLE_ICE = true;
export const STREAM_TIMEOUT = 60000;
export const BUFFER_TIMEOUT = 10000;
export const RECONNECT_TIMEOUT = 5000;
export const NATURAL_RATIO = 16 / 9;
export const HLS_MIN_EXPIRE_TIME = 300;
export const HLS_MAX_EXPIRE_TIME = 43200;
export const HLS_DATA_REQUEST_TIMEOUT = 10000;
export const HLS_GET_DATA_DIRECTLY_TIMEOUT = 3000;
export const HLS_MAX_RETRY = 5;
export const VIDEO_INACTIVE_TIMEOUT = 120000;

export const CONTROLLER_TIMEOUT = 3000; // 3 seconds

export const LAYOUT_DATA = [
  {
    key: 'layout_2x2',
    value: 2,
    icon: 'grid-view-4',
  },
  {
    key: 'layout_3x33',
    value: 3,
    icon: 'grid-view-9',
  },
  {
    key: 'layout_4x4',
    value: 4,
    icon: 'grid-view-16',
  },
];
