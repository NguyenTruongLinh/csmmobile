//action types
// export const API_VERSION =''
// export const APP_Id = '89ab5a91edf94caeae6f5a38e1cc3c26'
export const ApiSetting = {
  // Version: '2.0.1',
  // AppId: '89ab5a91edf94caeae6f5a38e1cc3c26',
  AppId: '4d53bce03ec34c0a911182d4c228ee6c',
};

export const LocalDBName = {
  domain: 'domains',
  user: 'users',
  alertConfig: 'alertconfigs',
  device: 'deviceid',
};

export const AlarmStatus = {
  2: 'Pending',
  1: 'Process',
};
export const Orient = {
  LANDSCAPE: 'LANDSCAPE',
  PORTRAIT: 'PORTRAIT',
  PORTRAITUPSIDEDOWN: 'PORTRAITUPSIDEDOWN',
  UNKNOWN: 'UNKNOWN',
};
//region

//endregion
/*#region login API*/
export const LOAD_ALERT_CONFIG = 'LOAD_ALERT_CONFIG';
export const ADD_ALERT_CONFIG = 'ADD_ALERT_CONFIG';
export const DELETE_ALERT_CONFIG = 'DELETE_ALERT_CONFIG';
export const LOAD_CONFIGURATION = 'LOAD_CONFIGURATION';

export const ALERT_CONFIG = {
  LOAD_ALERT_CONFIG,
  ADD_ALERT_CONFIG,
  DELETE_ALERT_CONFIG,
};

const LOAD_DOMAIN_CONFIG = 'LOAD_DOMAIN_CONFIG';
const UPDATE_DOMAIN_CONFIG = 'UPDATE_DOMAIN_CONFIG';
const ADD_DOMAIN_CONFIG = 'ADD_DOMAIN_CONFIG';
const DELETE_DOMAIN_CONFIG = 'DELETE_DOMAIN_CONFIG';

export const DOMAIN_CONFIG = {
  LOAD_DOMAIN_CONFIG,
  UPDATE_DOMAIN_CONFIG,
  ADD_DOMAIN_CONFIG,
  DELETE_DOMAIN_CONFIG,
};

export const LOAD_USER_CONFIG = 'LOAD_USER_CONFIG';
export const UPDATE_USER_CONFIG = 'UPDATE_USER_CONFIG';
export const ADD_USER_CONFIG = 'ADD_USER_CONFIG';
export const DELETE_USER_CONFIG = 'DELETE_USER_CONFIG';

export const RERENDER = 'RERENDER';

export const APP = {
  RERENDER,
  BACK_HANDLER: 'BACK_HANDLER',
  SCENE_CHANGED: 'SCENE_CHANGED',
  PUSH_HANDLERS: 'PUSH_HANDLERS',
  ROTATABLE: 'ROTATABLE',
};

export const USER_CONFIG = {
  LOAD_USER_CONFIG,
  UPDATE_USER_CONFIG,
  ADD_USER_CONFIG,
  DELETE_USER_CONFIG,
};

export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_FAILED = 'LOGIN_FAILED';
export const LOGIN_SUCCESSFULLY = 'LOGIN_SUCCESSFULLY';

export const LOGIN_ACTIONS = {
  LOGIN_REQUEST,
  LOGIN_FAILED,
  LOGIN_SUCCESSFULLY,
  LOG_OUT: 'LOG_OUT',
  USER_UPDATE_PASSWORD: 'USER_UPDATE_PASSWORD',
  USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
  USER_SITES: 'USER_SITES',
  PRIVILEGE: 'PRIVILEGE',
  USER_SITES_EDIT: 'USER_SITES_EDIT',
  USER_SITES_DELETE: 'USER_SITES_DELETE',
  USER_SITES_ADD: 'USER_SITES_ADD',
  FCM_INFO: 'FCM_INFO',
  MODULE_CHANGE: 'MODULE_CHANGE',
  LAYOUT_CHANGE: 'LAYOUT_CHANGE',
  LOGIN_ERROR_SHOWED: 'ERROR_SHOWED',
};

export const WIDGET_COUNTS = {
  ALARM: '602',
  HEALTH: '603',
  SMART_ER: '604',
  OAM: '607',
};

export const MODULES = {
  MODULE_SITE: 'MODULE_SITE',
  MODULE_REBAR: 'MODULE_REBAR',
};

export const MODULE_PERMISSIONS = {
  SITE: 2, //normal 1, 3// ALARM // HEALTH + ALARM
  BAM: 3,
  DASHBOARD: 4,
  ADMINISTRATION: 8,
  INCIDENT_REPORTS: 9,
  REBAR: 12, //normal 2, 3 // SMART-ER
  VSC: 14, //normal 3 // VIDEO
  MENU_DASHBOARD_FD: 16,
  MENU_CUSTOMIZE_FD: 17,
  MENU_HEALTHSCREENING: 18,
  SUB_SD: 21,
  SUB_OCC: 22,
};

export const HEALTH = {
  LOAD_PAGE: 'LOAD_PAGE',
  ACTION_HEALTH_DETAIL: 'ACTION_HEALTH_DETAIL',
  LOAD_HEALTH_DETAIL: 'LOAD_HEALTH_DETAIL',
  LOAD_DVR_NOT_RECORDING: 'LOAD_DVR_NOT_RECORDING',
  LOAD_DVR_OFFLINE: 'LOAD_DVR_OFFLINE',
  LOAD_VIDEOLOSS: 'LOAD_VIDEOLOSS',
  FILTER_VIDEOLOSS: 'FILTER_VIDEOLOSS',
  LOAD_TYPE_ALERTS: 'LOAD_TYPE_ALERTS',
  LOAD_ALERT_DVRs: 'LOAD_ALERT_DVRs',
  IGNOREALERTS: 'IGNOREALERTS',
  IGNOREALERTTYPE: 'IGNOREALERTTYPE',
  IGNOREALERTSITE: 'IGNOREALERTSITE',
  CLEARMAINDATA_HEALTHDETAIL: 'CLEARMAINDATA_HEALTHDETAIL',
  CLEARMAINDATA_ALERTS: 'CLEARMAINDATA_ALERTS',
  CLEARMAINDATA_ALERTSDETAIL: 'CLEARMAINDATA_ALERTSDETAIL',
  LOAD_ALERT_DETAIL: 'LOAD_ALERT_DETAIL',
  INFODVRVIDEO: 'INFODVRVIDEO',
  LOAD_DVRCHANNELS: 'LOAD_DVRCHANNELS',
  CALLBACK_DONE: 'CALLBACK_DONE',
};

export const ALERTTYPES = {
  ALERTTYPES_LOADED: 'ALERTTYPES_LOADED',
};

export const SETTINGNOTIFY = {
  LOAD_SETTING_NOTIFY: 'LOAD_SETTING_NOTIFY',
};

export const PVM = {
  PVM_SITES_LOAD: 'PVM_SITES_LOAD',
};

export const SMART_ER = {
  EXCEPTION_GROUPSITES_LOAD: 'EXCEPTION_GROUPSITES_LOAD',
  EXCEPTION_GROUPEMPLOYEE_LOAD: 'EXCEPTION_GROUPEMPLOYEE_LOAD',
  EXCEPTION_EMPLOYEES_LOAD: 'EXCEPTION_EMPLOYEES_LOAD',
  EXCEPTION_EMPLOYEES_EXPAND: 'EXCEPTION_EMPLOYEES_EXPAND',
  SMART_ER_LOAD: 'SMART_ER_LOAD',
  EXCEPTION_TRANS_LIST: 'EXCEPTION_TRANS_LIST',
  EXCEPTION_TRANS_DETAIL: 'EXCEPTION_TRANS_DETAIL',
  EXCEPTION_TRANS_MEDIA_INFO: 'EXCEPTION_TRANS_MEDIA_INFO',
  APPLY_FILTER: 'EXCEPTION_APPLY_FILTER',
  EXCEPTION_VIEW_CHANGE: 'EXCEPTION_VIEW_CHANGE',
  STORETEXTSEARCHSITE: 'STORETEXTSEARCHSITE',
  APPLY_STATUS_BACK_FCM: 'APPLY_STATUS_BACK_FCM',
  TRANSACTION_TYPE: 'TRANSACTION_TYPE',
};

export const NodeType = {
  Region: 0,
  Site: 1,
  DVR: 2,
  Channel: 3,
};

export const StatusComponet = {
  ERRORAPI: 'ERRORAPI',
  NODATA: 'NODATA',
};
export const DateFormat = {
  Alert_Date: 'MM/dd/yyyy HH:mm:ss',
  AlertDetail_Date: 'MM/dd/yyyy HH:mm:ss', //"MMM DD, YYYY HH:mm:ss"
  POS_Filter_Date: 'MM/dd/yyyy',
  TranDate: 'MM/dd/yyyy HH:mm:ss',
  QuerryDateTime: 'yyyyMMddHHmmss',
  CalendarDate: 'yyyy-MM-dd',
};

export const Domain = {
  urlI3care: 'https://i3care.i3international.com/',
};

export const AlertNames = {
  1: 'System Started',
  2: 'System Shutdown',
  3: 'Insufficient Disk Space Backup',
  4: 'CPU Temperature High',
  5: 'Video Loss',
  6: 'Backup Started',
  7: 'Backup Completed',
  8: 'Backup Stopped',
  9: 'IP: Sensor triggered',
  10: 'Control Activated',
  // '11':'HDD Format Started',
  // '12':'HDD Format Completed',
  11: 'HDD format',
  12: 'HDD format',
  13: 'User Added',
  14: 'User Removed',
  15: 'User Logged in',
  16: 'User Logged out',
  17: 'Disconnect from CMS server',
  18: 'Storage Setup Changed',
  19: 'Video Recycling Began',
  20: 'Not recording',
  21: 'Setup Configuration Changed',
  22: 'Partition dropped',
  23: 'CMS Registration Expire Soon',
  24: 'CMS Registration Expired',
  25: 'Other types',
  26: 'Partition Added',
  27: 'HASP Unplugged',
  28: 'HASP Expired',
  29: 'Frame Rate Changed',
  30: 'Resolution Changed',
  31: 'Time Manually Adjusted',
  32: 'NVR is off line',
  33: 'NVR connected CMS Server',
  34: 'Unstable Video Signal',
  35: 'Video returned to normal',
  36: 'Type VA',
  37: 'Record Less Than',
  101: 'CMS HASP Unplugged',
  102: 'CMS HASP Found',
  103: 'CMS HASP Removed',
  104: 'CMS HASP Expired',
  105: 'CMS Server HASP Limit Exceeded',
  106: 'CMSWEB Conversion rate above 100',
  107: 'CMSWEB Door count 0',
  108: 'CMSWEB POS data missing',
  109: 'CMSWEB CONV NO HIGHER',
  110: 'CMSWEB CONV NO LOWER',
  111: 'CMSWEB RISK NO HIGHER',
  112: 'CMSWEB RISK NO LOWER',
  113: 'Temperature out of range',
  114: 'Not wearing mask',
  115: 'Increasing temperature rate by day',
  116: 'Social distance',
  222: 'POS Exceptions',
};

export const AlertTypes = {
  NONE: 0, // dongpt added
  DVR_System_Started: 1,
  DVR_System_Shutdown: 2,
  DVR_Insufficient_Disk_Space_Backup: 3,
  DVR_CPU_Temperature_High: 4,
  DVR_Video_Loss: 5,
  DVR_Backup_Started: 6,
  DVR_Backup_Completed: 7,
  DVR_Backup_Stopped: 8,
  DVR_Sensor_Triggered: 9,
  DVR_Control_Activated: 10,
  DVR_HDD_Format_Started: 11,
  DVR_HDD_Format_Completed: 12,
  DVR_User_Added: 13,
  DVR_User_Removed: 14,
  DVR_User_Logged_in: 15,
  DVR_User_Logged_out: 16,
  DVR_disconnect_from_CMS_server: 17,
  DVR_Storage_Setup_Changed: 18,
  DVR_Video_Recycling_Began: 19,
  DVR_Not_recording: 20,
  Setup_Configuration_Changed: 21,
  DVR_Partition_Dropped: 22,
  CMS_Registration_Expire_Soon: 23,
  CMS_Registration_Expired: 24,
  Other_types: 25,
  DVR_Partition_Added: 26,
  DVR_HASP_Unplugged: 27,
  DVR_HASP_Expired: 28,
  DVR_Frame_Rate_Changed: 29,
  DVR_Resolution_Changed: 30,
  DVR_Time_Manually_Adjusted: 31,
  DVR_is_off_line: 32,
  DVR_connected_CMS_Server: 33,
  DVR_Unstable_Video_Signal: 34,
  DVR_Video_returned_to_normal: 35,
  DVR_VA_detection: 36,
  DVR_Record_Less_Than: 37,
  //new DVR alert type here
  CMS_HASP_Unplugged: 101,
  CMS_HASP_Found: 102,
  CMS_HASP_Removed: 103,
  CMS_HASP_Expired: 104,
  CMS_Server_HASP_Limit_Exceeded: 105,
  CMSWEB_Conversion_rate_above_100: 106,
  CMSWEB_Door_count_0: 107,
  CMSWEB_POS_data_missing: 108,
  CMSWEB_CONV_NO_HIGHER: 109,
  CMSWEB_CONV_NO_LOWER: 110,
  CMSWEB_RISK_NO_HIGHER: 111,
  CMSWEB_RISK_NO_LOWER: 112,
  // Temperature Alarm (Ax19)
  TEMPERATURE_OUT_OF_RANGE: 113,
  TEMPERATURE_NOT_WEAR_MASK: 114,
  TEMPERATURE_INCREASE_RATE_BY_DAY: 115,
  SOCIAL_DISTANCE: 116,
  //CMS web report alert.
  CMSWEB_Report_Begin: 200,
  CMSWEB_Report_Main_DashBoard: 201,
  CMSWEB_Report_Day_At_AGlance: 202,
  CMSWEB_Report_Daily_Performance_Indicators: 203,
  CMSWEB_Report_What_If_Conversion_Rate: 204,
  CMSWEB_Report_Opportunity_By_Hour_Report: 205,
  CMSWEB_Report_Year_to_dateToll_up: 206,
  CMSWEB_Report_Conversion_Comparison: 207,
  CMSWEB_Report_Hourly_Performance_Measurements: 208,
  CMSWEB_Report_Location_Detail_Hour: 209,
  CMSWEB_Report_Cross_Metric_Comparison: 210,
  CMSWEB_Report_Traffic_Insights_Report: 211,
  CMSWEB_Report_Key_Performance_Indicators: 212,
  CMSWEB_Report_Alerts_Chart: 213,
  CMSWEB_Report_Conversion_Rate_by_Site_Chart: 214,
  CMSWEB_Report_Conversion_Rate_by_Region_Chart: 215,
  CMSWEB_Report_NVR_with_Most_Alert_Chart: 216,
  CMSWEB_Report_Overall_Statistic_Chart: 217,
  CMSWEB_Report_Traffic_Statistics_Chart: 218,
  POS_Exceptions: 222,
  Alarm_Temperature: 999, // dongpt: use a represent id for temperature alert (for notification settings menu)
};

export const TEMPERATURE_ALARMS_TYPES = [
  AlertTypes.TEMPERATURE_OUT_OF_RANGE,
  AlertTypes.TEMPERATURE_NOT_WEAR_MASK,
  AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY,
];

export const AlertType_Support = [
  AlertTypes.DVR_Sensor_Triggered,
  AlertTypes.DVR_VA_detection,
  AlertTypes.TEMPERATURE_OUT_OF_RANGE,
  AlertTypes.TEMPERATURE_NOT_WEAR_MASK,
  AlertTypes.TEMPERATURE_INCREASE_RATE_BY_DAY,
  AlertTypes.SOCIAL_DISTANCE,
].join(',');

export const GroupByException = {
  SITE: 0,
  EMPL: 1,
  DATE: 2,
};

export const ConditionFilterPOS = {
  DATE: 0,
  SITE: 1,
};

export const ConditionFilterException = {
  EXCEPTION: 0,
};

export const ExceptionSortField = {
  Employee: 0,
  RiskFactor: 1,
  TotalAmount: 2,
  RatioToSale: 3,
  Count: 4,
};

export const ExceptionSortFieldName = [
  'EMPLOYEE',
  'RISK FACTOR',
  'TOTAL AMOUNT',
  'RATIO TO SALE',
];

export const ChannelStatus = {
  DISABLE: 0,
  NOT_RECORDING: 1,
  RECORDING: 2,
  VIDEOLOSS: 3,
  RESDISABLE: 4,
};

export const AlertTypeVA = {
  Unknown: 0,
  Area: 1,
  Idle: 2,
  Stop: 3,
  CrossWire: 4,
  MissAlarm: 5,
  Direction: 6,
  ManyHuman: 7,
  AIDetection: 8,
  AICamera: 9,
  AICrossWire: 10,
};

export const FilterMore = {
  AlertSeverity: 0,
  Status: 1,
  Sites: 2,
  Time: 3,
  AlertType: 4,
  Rating: 5,
  Note: 6,
  VA: 7,
  ProcessOp: 8,
};

export const FilterParamNames = [
  '', // AlertSeverity: 0,
  'sta', // Status: 1,
  'sid', // Sites: 2,
  'time', // Time: 3,
  'aty', // AlertType: 4,
  'ara', // Rating: 5,
  'ano', // Note: 6,
  'vty', // VA: 7,
  '', // ProcessOp: 8,
];

export const MSG_CMD = {
  MOBILE_MSG_GROUP_COMMUNICATION_BEGIN: 0,
  MOBILE_MSG_LOGIN: 1,
  MOBILE_MSG_DISCONNECT: 2,
  MOBILE_MSG_EXIT: 3,
  MOBILE_MSG_VIDEO_SOCKET_ERROR: 4,
  MOBILE_MSG_KEEP_ALIVE: 5,
  MOBILE_MSG_TEST: 6,
  MOBILE_MSG_MINIMIZE: 7,
  MOBILE_MSG_SNAPSHOT: 8,
  MOBILE_MSG_CANCEL_SNAPSHOT: 9,
  MOBILE_MSG_GROUP_COMMUNICATION_END: 10,

  MOBILE_MSG_GROUP_VIDEO_REQUEST_BEGIN: 500,
  MOBILE_MSG_START_SEND_VIDEO: 501,
  MOBILE_MSG_STOP_SEND_VIDEO: 502,
  MOBILE_MSG_PAUSE_SEND_VIDEO: 503,
  MOBILE_MSG_RESUME_SEND_VIDEO: 504,
  MOBILE_MSG_SEND_NEXT_FRAME: 505,
  MOBILE_MSG_SEND_NEXT_ENCODE_FRAME: 506,
  MOBILE_MSG_GROUP_VIDEO_REQUEST_END: 507,

  MOBILE_MSG_GROUP_ALARM_BEGIN: 1000,
  MOBILE_MSG_NEW_ALARM_DETECTED: 1001,
  MOBILE_MSG_SEND_ALARM_LIST: 1002,
  MOBILE_MSG_VIEW_ALARM_IMAGES: 1003,
  MOBILE_MSG_NEXT_ALARM_IMAGE: 1004,
  MOBILE_MSG_NEXT_ALARM_LIST: 1005,
  MOBILE_MSG_PREVIOUS_ALARM_LIST: 1006,
  MOBILE_MSG_EXIT_ALARM_LIST: 1007,
  MOBILE_MSG_GROUP_ALARM_END: 1008,

  MOBILE_MSG_GROUP_PTZ_CONTROL_BEGIN: 1500,
  MOBILE_MSG_PTZ_CONTROL_LEFT: 1501,
  MOBILE_MSG_PTZ_CONTROL_RIGHT: 1502,
  MOBILE_MSG_PTZ_CONTROL_UP: 1503,
  MOBILE_MSG_PTZ_CONTROL_DOWN: 1504,
  MOBILE_MSG_PTZ_CONTROL_ZOOM_IN: 1505,
  MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT: 1506,
  MOBILE_MSG_PTZ_CONTROL_LEFT_STOP: 1507,
  MOBILE_MSG_PTZ_CONTROL_RIGHT_STOP: 1508,
  MOBILE_MSG_PTZ_CONTROL_UP_STOP: 1509,
  MOBILE_MSG_PTZ_CONTROL_DOWN_STOP: 1510,
  MOBILE_MSG_PTZ_CONTROL_ZOOM_IN_STOP: 1511,
  MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT_STOP: 1512,
  MOBILE_MSG_PTZ_CONTROL_LEFTUP: 1513,
  MOBILE_MSG_PTZ_CONTROL_RIGHUP: 1514,
  MOBILE_MSG_PTZ_CONTROL_LEFTDOWN: 1515,
  MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN: 1516,
  MOBILE_MSG_PTZ_CONTROL_LEFTUP_STOP: 1517,
  MOBILE_MSG_PTZ_CONTROL_RIGHUP_STOP: 1518,
  MOBILE_MSG_PTZ_CONTROL_LEFTDOWN_STOP: 1519,
  MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN_STOP: 1520,
  MOBILE_MSG_GROUP_PTZ_CONTROL_END: 1521,

  MOBILE_MSG_GROUP_SETTING_BEGIN: 2000,
  MOBILE_MSG_SEND_CAMERA_LIST: 2001,
  MOBILE_MSG_MOBILE_SEND_SETTINGS: 2002,
  MOBILE_MSG_ADD_IP_CAMERAS: 2003,
  MOBILE_MSG_REMOVE_IP_CAMERAS: 2004,
  MOBILE_MSG_SERVER_CHANGED_PORTS: 2005,
  MOBILE_MSG_SERVER_SEND_SETTINGS: 2006,
  MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG: 2007,
  MOBILE_MSG_SERVER_CHANGED_CURRENT_USER: 2008,
  MOBILE_MSG_SERVER_CHANGED_SERVER_INFO: 2009,
  MOBILE_MSG_SEVER_SEND_HARDWARE_EXCONFIG: 2010, // Trang Nguyen, added new msg to get more information of ip cameras on hardware config, Sep 27, 2012.
  MOBILE_MSG_GROUP_SETTING_END: 2011,

  //Bao add to support search in mobile, Jan 02 2014 - begin
  MOBILE_MSG_SEARCH_BEGIN: 2100,
  MOBILE_MSG_SEARCH_UPDATE_SCREEN: 2101,
  MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL: 2102,
  MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL: 2103,
  MOBILE_MSG_SEARCH_REQUEST_SETPOS: 2104,
  MOBILE_MSG_SEARCH_RESPONSE_SETPOS: 2105,
  MOBILE_MSG_SEARCH_REQUEST_PLAY_FW: 2106,
  MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW: 2107,
  MOBILE_MSG_SEARCH_REQUEST_PLAY_BW: 2108,
  MOBILE_MSG_SEARCH_RESPONSE_PLAY_BW: 2109,
  MOBILE_MSG_SEARCH_REQUEST_STOP: 2110,
  MOBILE_MSG_SEARCH_RESPONSE_STOP: 2111,
  MOBILE_MSG_SEARCH_REQUEST_STEP_FW: 2112,
  MOBILE_MSG_SEARCH_RESPONSE_STEP_FW: 2113,
  MOBILE_MSG_SEARCH_REQUEST_STEP_BW: 2114,
  MOBILE_MSG_SEARCH_RESPONSE_STEP_BW: 2115,
  MOBILE_MSG_SEARCH_RAW_VIDEO: 2116,
  MOBILE_MSG_ENCODED_VIDEO: 2117,
  MOBILE_MSG_ENCODED_VIDEO_GROUP: 2118,
  MOBILE_MSG_SEARCH_SESSION_DESTROY: 2119,
  MOBILE_MSG_SEARCH_SESSION_DESTROY_ONE: 2120,
  MOBILE_MSG_SEARCH_REQUEST_DAY_LIST: 2121,
  MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST: 2122,
  MOBILE_MSG_SEARCH_REQUEST_SNAPSHOT: 2123,
  MOBILE_MSG_SEARCH_RESPONSE_SNAPSHOT: 2124,
  MOBILE_MSG_SERVER_SEND_TIMEZONE: 2125,
  MOBILE_MSG_SERVER_RECORDING_ONLY_CANT_PLAY_VIDEO: 2126,
  MOBILE_MSG_SEARCH_REQUEST_MAIN_SUB: 2127,
  MOBILE_MSG_SEARCH_END: 2128,
  //Bao add to support search in mobile, Jan 02 2014 - end

  // Thang Do, adds for i3DM, Aug 12, 2011, begin
  MOBILE_MSG_GROUP_I3DM_BEGIN: 2500,
  MOBILE_MSG_TIME_CHANGED: 2501,
  MOBILE_MSG_CHECK_DUMPDATA_PRESENCE: 2502,
  MOBILE_MSG_DUMPDATA_SESSION: 2503,
  MOBILE_MSG_DUMPDATA_START: 2504,
  MOBILE_MSG_DUMPDATA_STOP: 2505,
  MOBILE_MSG_DUMPDATA_CANCEL: 2506,
  MOBILE_MSG_DUMPDATA_FINISH: 2507,
  MOBILE_MSG_DUMPDATA_RESPONSE: 2508,
  MOBILE_MSG_DUMPDATA_SYNCH: 2509,
  MOBILE_MSG_DUMPDATA_ENDTIME_CHANGED: 2510,
  MOBILE_MSG_GROUP_I3DM_END: 2511,
  // Thang Do, adds for i3DM, Aug 12, 2011, end

  MOBILE_MSG_MAX_MSG_ENUM: 65535,
};

export const NOTIFY_ACTION = {
  ADD: 'ADD',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  REFRESH: 'REFRESH',
  USER_PERMISSION_REFRESH: 'USER_PERMISSION_REFRESH',
  LOG_OUT: 'LOG_OUT',
  DIMISS: 'DIMISS',
  DISMISS_BLOCK: 'DISMISS_BLOCK',
  NVR_STATUS: 'NVR_STATUS',
  PWD_CHANGE: 'PWD_CHANGE',
  NEWIMAGE: 'NEWIMAGE',
  STREAM_CREATED: 'STREAM_CREATED', // dongpt: for livestreaming
  STREAM_NEW: 'STREAM_NEW', // dongpt: for HLS
  WARNING: 'WARNING', // dongpt: for PVM (OAM)
};

export const NOTIFY_TYPE = {
  SITE: 'SITE',
  USER: 'USER',
  DVR: 'DVR',
  ALERT_TYPE: 'ALERT_TYPE',
  ALERT: 'ALERT',
  ALARM: 'ALARM',
  EXCEPTION: 'EXCEPTION',
  STREAMING: 'STREAMING',
  PVM: 'PVM',
};

export const CALENDAR_DATE_FORMAT = 'yyyy-MM-dd';
export const NVRPlayerConfig = {
  HLSRequestDateFormat: 'MMddyyyy',
  HLSRequestTimeFormat: 'HH:mm:ss',
  RequestDateFormat: 'yyyy/MM/dd',
  RequestTimeFormat: 'yyyy/MM/dd HH:mm:ss',
  ResponseTimeFormat: 'yyyy/MM/dd HH:mm:ss.SSS',
  TimeFormat: 'HH:mm',
  FrameFormat: 'MM/dd/yyyy - HH:mm:ss',
  LiveFrameFormat: 'HH:mm:ss',
  QueryStringUTCDateTimeFormat: 'yyyyMMddHHmmss',
  QueryStringUTCDateFormat: 'yyyyMMdd',
  Search_Duration: 10 * 60,
};

export const DataPageSize = 30;
