export const VSCCommand = {
  LIVE : 0,
  SEARCH:1,
  TIMELINE:2,
  DAYLIST:3,
  LIVEHD:4,
  SEARCHHD:5,
  TIMEZONE:6,
  RCTLIVE: 7,
  STOP :99
}

export const VIDEO_MESSAGE = {
  MSG_GET_CONNECTION: 'Getting connection.',
  MSG_GET_CONNECTION_ERROR: 'Cannot get info from CMS server. Error: ',
  MSG_GET_CONNECTION_FAILED: 'Cannot get info from CMS server.',
  MSG_GET_CONNECTION_CHANNEL_FAILED: 'Cannot get channel info from CMS server.',
  MSG_CONNECTING_NVR: 'Connecting to NVR.',
  MSG_CONNECTED_NVR: 'Connected.',
  MSG_CONNECTING_STREAM: 'Connecting to streaming service.',
  MSG_STREAM_CONNECTED: 'Connected.',
  MSG_STREAM_ERROR: 'Stream error.',
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
  MSG_NVR_CHANNEL_NOT_PERMISSION: 'You don\'t have permission.',
  MSG_GET_VIDEO_HLS: 'Connect HTTP Live Stream successfully',
  MSG_CONNECT_HLS: 'Connectting to HTTP Live Stream ...',
  MSG_TRYLOAD_VIDEO_HLS: 'Possible connection loss or connection is too slow',
  MSG_RECONNECT_NVR: 'Reconnect to NVR in ',
  STR_SECONDS: 'second(s).',
  STR_RECONNECT: 'Reconnect',
  MSG_NO_VIDEO_DATA: 'No video data.'
}

export const Video_State = { STOP: 0, PLAY: 1, PAUSE: 2 };

export const STREAMING_TYPES = {
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

export const STREAM_STATUS = {
  DONE:"",
  WAITING: "Waiting for connection...",
  CONNECTING : "Connecting...",
  CONNECTED :"Connected.",
  BUFFERING :"Buffering...",
  ERROR: "Network Error.",
  TIMEOUT: "Time out.",
  NOVIDEO: "No video.",
}

export const arrayof24HTime = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
export const arrayof12HTime = ['12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'];

export const STREAM_CONST = {
  DAY_INTERVAL: 86399,
  default24H: 24,
  startDST: 23,
  endDST: 25,
  Limit_Time_Allow_Change_Live_Search: 1,
  HoursOnScreen: 4,
}

export const APP_INFO = {
  Title:"Cloud Managed Services",
  Name : "CMS Mobile 2.5",
  Version: "2.5.1.19",
  BuiltDate: "Apr 08, 2021",
  CopyRight:"Copyright © 2021 i3 International Inc."
}

export const USE_TIMESTAMP = true;

export const RTC_VIDEO_STATES = {
  BEGIN: 0,
  GETTING_STREAM_INFO: 1,
  READY_INIT_CONNECTION: 2,
  INIT_CONNECTION: 3,
  READY_TO_OPEN_DATA_CHANNEL: 4,
  OPENING_DATA_CHANNEL: 5,
  GOT_STREAMURL: 6,
  READY_TO_PLAY: 7,
  GETTING_TIMEZONE: 8,
  END: 9,
};

export const IS_FORCE_TURN = true;
export const IS_OPEN_DATA_CHANNEL = true;
export const USE_TRICKLE_ICE = true;
export const STREAM_TIMEOUT = 30000;