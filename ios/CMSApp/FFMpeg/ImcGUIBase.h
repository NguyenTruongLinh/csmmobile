//
//  ImcGUIBase.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/4/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#ifndef SRX_Pro_Mobile_Remote_ImcGUIBase_h
#define SRX_Pro_Mobile_Remote_ImcGUIBase_h

#define SUPPORT_ROTATION

#define IMC_MAX_DISPLAY_CHANNELS_IPAD 64
#define IMC_MAX_DISPLAY_CHANNELS_IPHONE 16
#define IMC_MAX_DISPLAY_SCREEN 64
#define IMC_MAX_CHANNEL 64

#define IMC_DEFAULT_SERVER_PORT 13225
#define IMC_DEFAULT_RELAY_SERVER_PORT 19900

#define IMC_TIME_OUT_SECOND 15
#define MAX_SERVER_CONNECTION 5

#define ROW_HEIGHT_IPHONE 35
#define ROW_HEIGHT_IPAD   44


#define IMC_CHANNEL_MAPPING_FILENAME @"ChannelMapping.cfg"
#define IMC_SETTING_DIRECTORY @"Settings"
#define IMC_ALARM_SETTING_FILENAME @"AlarmSettings.cfg"
#define IMC_CONNECTION_SERVER_LIST_FILENAME @"ConnectionServerList.cfg"
#define IMC_LOGIN_INFO_FILENAME @"LoginInfo.cfg"
#define IMC_GROUP_NAME_FILENAME @"Groups.cfg"
#define IMC_FAVORITE_GROUP_NAME_FILENAME @"FavoriteGroups.cfg"
#define IMC_FAVORITE_CHANNELS @"FavoriteChannels.cfg"

#define IS_MAIN_STREAM(frametype) (frametype < EVFT_SUBIFRAME)
#define IS_SUB_STREAM(frametype) (frametype >= EVFT_SUBIFRAME)

#define IS_I_FRAME(frametype)  ((frametype == EVFT_IFRAME) || (frametype == EVFT_SUBIFRAME))
#define IS_P_FRAME(frametype)  ((frametype == EVFT_PFRAME) || (frametype == EVFT_SUBPFRAME))

#define IPHONE_DATE_ICON_OFFSET_PORTRAIT 60
#define IPHONE_DATE_ICON_OFFSET_LANDSCAPE 90

#define IPAD_DATE_ICON_OFFSET_PORTRAIT 120

#define IS_HIGH_RES(w,h) (w*h>1228800)

@class ImcAllDateInterval;

// enum declare

typedef NS_ENUM(NSUInteger, LOGIN_STATUS)
{
  LOGIN_STATUS_UNKNOWN  = 0,
  LOGIN_STATUS_SUCCEEDED = 1,
  LOGIN_STATUS_CANNOT_CONNECT = 2,
  LOGIN_STATUS_WRONG_USER_PASS = 3,
  LOGIN_STATUS_WRONG_SERVERID = 4,
  LOGIN_STATUS_VIDEO_PORT_ERROR = 5,
  LOGIN_STATUS_WIFI_NOT_SUPPORTED = 6,
  LOGIN_STATUSNETWORK_NOT_TURN_ON = 7,
};

typedef NS_ENUM(NSUInteger, I3_FAVORITE_MODE)
{
  NORMAL_MODE  = 0,
  ADD_MODE = 1,
  EDIT_MODE = 2,
  DUPLICATED_MODE = 3,
  CONNECT_MODE = 4,
  VIEW_CONNECT_MODE = 5,
  CONNECT_CHANNEL_MODE = 6,
};

typedef NS_ENUM(NSUInteger, IMC_MSG_BASE) {
  IMC_MSG_CONNECTION_BACK  = 0,
  IMC_MSG_CONNECTION_CONNECT = 1,
  IMC_MSG_CONNECTION_DISCONNECT = 2,
  IMC_MSG_CONNECTION_CANCEL = 3,
  IMC_MSG_GET_CONNECTION_NUMBER = 4,
  IMC_MSG_GET_CONNECTION_NUMBER_RESPONSE = 5,
  IMC_MSG_CONNECTION_NEED_RESET = 6,
  
  IMC_MSG_ABOUT  = 10,
  IMC_MSG_ABOUT_BACK = 11,
  
  IMC_MSG_SETTINGS_BACK  = 20,
  IMC_MSG_SETTINGS_SAVE = 21,
  
  IMC_MSG_ADD_SERVER_DONE  = 30,
  IMC_MSG_ADD_SERVER_CANCEL = 31,
        
  IMC_MSG_ALARM_SETTING_CANCEL  = 40,
  IMC_MSG_ALARM_SETTING_SAVE = 41,
  
  IMC_MSG_DISPLAY_UPDATE_LAYOUT  = 50,
  IMC_MSG_DISPLAY_FULLSCREEN = 51,
  IMC_MSG_DISPLAY_SHOW_PTZ_PANEL = 52,
  IMC_MSG_DISPLAY_HIDE_PTZ_PANEL = 53,
  
  IMC_MSG_CHANNEL_MAPPING_CANCEL  = 60,
  IMC_MSG_CHANNEL_MAPPING_SAVE = 61,
  IMC_MSG_CHANNEL_MAPPING_SNAPSHOT_SCREEN = 62,
  IMC_MSG_CHANNEL_MAPPING_GET_SERVER_CHANNEL_INFO = 63,
  IMC_MSG_CHANNEL_MAPPING_UPDATE_CHANNEL_MASK = 64,
  
  
  IMC_MSG_MAIN_VIEW_ADD_SERVER  = 100,
  IMC_MSG_MAIN_VIEW_REMOVE_SERVER = 101,
  IMC_MSG_MAIN_VIEW_UPDATE_SERVER = 102,
  IMC_MSG_MAIN_VIEW_UPDATE_SERVER_RESPONSE = 103,
  IMC_MSG_MAIN_VIEW_ADD_GROUP = 104,
  IMC_MSG_MAIN_VIEW_SELECT_GROUP = 105,
  IMC_MSG_MAIN_VIEW_SELECT_GROUP_RESPONSE = 106,
  IMC_MSG_MAIN_VIEW_RENAME_GROUP = 107,
  IMC_MSG_MAIN_VIEW_DELETE_GROUP = 108,
  IMC_MSG_MAIN_VIEW_SELECT_NEW_SERVER = 109,
  IMC_MSG_MAIN_VIEW_SELECT_NEW_SERVER_RESPONSE = 110,
  IMC_MSG_MAIN_VIEW_SELECT_CONNECTION = 111,
  IMC_MSG_MAIN_VIEW_SELECT_CONNECTION_RESPONSE = 112,
  IMC_MSG_MAIN_VIEW_WAIT_TO_LIVE_VIEW = 113,
  IMC_MSG_MAIN_VIEW_TO_LIVE_VIEW = 114,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS = 115,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS_RESPONSE = 116,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS_ADD = 117,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS_ADD_RESPONSE = 118,
  IMC_MSG_MAIN_VIEW_ADD_SERVER_TO_GROUP_BACK = 119,
  IMC_MSG_MAIN_VIEW_SERVER_CHANGE_INFO = 120,
  IMC_MSG_MAIN_VIEW_LIVE_VIEW_RESPONSE = 121,
  IMC_MSG_MAIN_VIEW_CMS_CONNECTION = 122,
  IMC_MSG_MAIN_VIEW_CMS_CONNECTION_CLOSE = 123,
  IMC_MSG_MAIN_VIEW_DISABLE_CMS = 124,
  IMC_MSG_MAIN_VIEW_SWITCH_FROM_CMS = 125,
  
  IMC_MSG_LIVE_VIEW_SELECT_RATIO_VIEW  = 200,
  IMC_MSG_LIVE_VIEW_SELECT_RATIO_VIEW_RESPONSE = 201,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING = 202,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING_RESPONSE = 203,
  IMC_MSG_LIVE_VIEW_SELECT_FPS = 204,
  IMC_MSG_LIVE_VIEW_SELECT_FPS_RESPONSE = 205,
  IMC_MSG_LIVE_VIEW_SELECT_VIDEO_QUALITY = 206,
  IMC_MSG_LIVE_VIEW_SELECT_VIDEO_QUALITY_RESPONSE = 207,
  IMC_MSG_LIVE_VIEW_SELECT_VIEW_ALARM = 208,
  IMC_MSG_LIVE_VIEW_SELECT_VIEW_ALARM_RESPONSE = 209,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_FILTER = 210,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_FILTER_RESPONSE = 211,
  IMC_MSG_LIVE_VIEW_SELECT_CHANNEL_MAPPING = 212,
  IMC_MSG_LIVE_VIEW_SELECT_CHANNEL_MAPPING_RESPONSE = 213,
  IMC_MSG_LIVE_VIEW_SELECT_CHANNEL_DEFAULT = 214,
  IMC_MSG_CHANNEL_MAPPING_SELECT_VIEW = 215,
  IMC_MSG_CHANNEL_MAPPING_SELECT_VIEW_RESPONSE = 216,
  IMC_MSG_LIVE_VIEW_DETAIL_SETTING_BACK = 217,
  IMC_MSG_LIVE_VIEW_UPDATE_VIDEO_DISPLAY_MASK = 218,
  IMC_MSG_LIVE_VIEW_SETTING_SELECT_SERVER = 219,
  IMC_MSG_LIVE_VIEW_SETTING_SELECT_SERVER_BACK = 220,
  IMC_MSG_LIVE_VIEW_SETTING_SAVE = 221,
  IMC_MSG_LIVE_VIEW_REFRESH_SCREEN = 222,
  IMC_MSG_LIVE_SETTING_BACK = 223,
  IMC_MSG_LIVE_VIEW_CHANGE_MAINSUB_STATUS = 224,
  IMC_MSG_LIVE_VIEW_DISABLE_TABBARITEM = 225,

  
  IMC_MSG_LIVE_VIEW_PTZ_LEFT = 226,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHT = 227,
  IMC_MSG_LIVE_VIEW_PTZ_UP = 228,
  IMC_MSG_LIVE_VIEW_PTZ_DOWN = 229,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTUP = 230,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTUP = 231,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTDOWN = 232,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTDOWN = 233,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMIN = 234,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMOUT = 235,
  IMC_MSG_LIVE_VIEW_PTZ_LEFT_STOP = 236,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHT_STOP = 237,
  IMC_MSG_LIVE_VIEW_PTZ_UP_STOP = 238,
  IMC_MSG_LIVE_VIEW_PTZ_DOWN_STOP = 239,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTUP_STOP = 240,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTUP_STOP = 241,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTDOWN_STOP = 242,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTDOWN_STOP = 243,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMIN_STOP = 244,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMOUT_STOP = 245,
  IMC_MSG_LIVE_VIEW_REQUEST_SNAPSHOT = 246,
  IMC_MSG_LIVE_VIEW_CANCEL_SNAPSHOT = 247,
  IMC_MSG_LIVE_VIEW_EMAIL_SNAPSHOT = 248,
  IMC_MSG_LIVE_VIEW_STOP_VIDEO = 249,
  IMC_MSG_LIVE_VIEW_START_VIDEO = 250,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING_DEFAULT = 251,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING_DEFAULT_RESPONSE = 252,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_VOLUME = 253,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_VOLUME_UPDATE = 254,
  IMC_MSG_LIVE_VIEW_REMOVE_CHANNEL = 255,
  IMC_MSG_LIVE_VIEW_STOP_RECORDING = 256,
  IMC_MSG_LIVE_VIEW_HIDE_MENU_BAR = 257,
  IMC_MSG_LIVE_REQUEST_MAIN_STREAM = 258,
  IMC_MSG_LIVE_REQUEST_SUB_STREAM = 259,
  IMC_MSG_LIVE_SWIPE_SCREEN = 260,
  IMC_MSG_LIVE_UPDATE_CHANNEL_MASK = 261,
  
  IMC_MSG_CREATE_ACCOUNT  = 300,
  IMC_MSG_FORGOT_PASSWORD = 301,
  IMC_MSG_ALARM_LIST_CUR_PAGE = 302,
  IMC_MSG_ALARM_LIST_CUR_PAGE_RESPONSE = 303,
  IMC_MSG_ALARM_LIST_NEXT_PAGE = 304,
  IMC_MSG_ALARM_LIST_NEXT_PAGE_RESPONSE = 305,
  IMC_MSG_ALARM_LIST_PREV_PAGE = 306,
  IMC_MSG_ALARM_LIST_PREV_PAGE_RESPONSE = 307,
  IMC_MSG_ALARM_LIST_EXIT = 308,
  IMC_MSG_ALARM_PLAY_A_SOUND = 309,
  IMC_MSG_ALARM_PLAY_A_SOUND_RESPONSE = 310,
  IMC_MSG_ALARM_LIST_BACK = 311,
  
  IMC_MSG_FAVORITE_ADD_GROUP  = 400,
  IMC_MSG_FAVORITE_DELETE_GROUP = 401,
  IMC_MSG_FAVORITE_EDIT_GROUP_NAME = 402,
  IMC_MSG_FAVORITE_EDIT_GROUP_NAME_RESPONSE = 403,
  IMC_MSG_FAVORITE_SAVE_FAVORITE_GROUP = 404,
  IMC_MSG_FAVORITE_CHANNEL_ON_BACK = 405,
  IMC_MSG_FAVORITE_CHANNEL_GET_CONNECTION_SERVER = 406,
  IMC_MSG_FAVORITE_CHANNEL_ON_BACK_TO_FAVORITE_GROUP_VIEW = 407,
  IMC_MSG_FAVORITE_CHANNEL_ON_ADD_CHANNELS = 408,
  IMC_MSG_FAVORITE_CHANNEL_SAVE_CHANNELS = 409,
  IMC_MSG_FAVORITE_DELETE_CHANNEL = 410,
  IMC_MSG_FAVORITE_CONNECTION_CONNECT = 411,
  IMC_MSG_FAVORITE_REQUEST_DISCONNECT_ALL = 412,
  IMC_MSG_FAVORITE_CHANNEL_BACK = 413,
  IMC_MSG_FAVORITE_CHANNEL_CONNECT_CHANNEL = 414,
  IMC_MSG_FAVORITE_REQUEST_DISCONNECT_SERVER = 415,
  IMC_MSG_FAVORITE_RESPONSE_SERVER_INFO = 416,
  IMC_MSG_FAVORITE_RESPONSE_NO_CHANGE = 417,
  IMC_MSG_FAVORITE_START_EDITING = 418,
  IMC_MSG_ADD_FAVORITE_FROM_LIVE_BACK = 419,
  IMC_MSG_MAIN_VIEW_SAVE_BEFORE_CLOSE = 420,
  IMC_MSG_MAIN_DISPLAY_VIDEO_UPDATE_FRAME_RESOLUTION = 421,
  
  IMC_MSG_SEARCH_GROUP  = 500,
  IMC_MSG_SEARCH_REQUEST_TIME_ZONE  = 501,
  IMC_MSG_SEARCH_CHOSEN_DAY_RESPONSE  = 502,
  IMC_MSG_SEARCH_REQUEST_TIME_INTERVAL  = 503,
  IMC_MSG_SEARCH_UPDATE_TODAY_CELL = 504,
  IMC_MSG_SEARCH_REQUEST_THUMBNAIL = 505,
  IMC_MSG_SEARCH_REQUEST_PLAY_FW = 506,
  IMC_MSG_SEARCH_REQUEST_STOP = 507,
  IMC_MSG_SEARCH_REQUEST_SET_POS = 508,
  IMC_MSG_SEARCH_REQUEST_STEP_BW = 509,
  IMC_MSG_SEARCH_REQUEST_STEP_FW = 510,
  IMC_MSG_SEARCH_RESET_DECODER_FOR_LIVE = 511,
  IMC_MSG_SEARCH_RESET_DECODER_FOR_SEARCH = 512,
  IMC_MSG_SEARCH_REQUEST_SNAPSHOT = 513,
  IMC_MSG_SEARCH_REQUEST_REFRESH_CALENDAR = 514,
  IMC_MSG_SEARCH_REQUEST_REFRESH_DECODER = 515,
  IMC_MSG_SEARCH_REQUEST_MAIN_SUB = 516,
};

typedef NS_ENUM(NSUInteger, IMC_DIVISION_MODE) {
  IMC_DIV_NONE  = 0,
  IMC_DIV_1 = 1,
  IMC_DIV_4 = 2,
  IMC_DIV_9 = 3,
  IMC_DIV_16 = 4,
  IMC_DIV_25 = 5,
  IMC_DIV_36 = 6,
  IMC_DIV_49 = 7,
  IMC_DIV_64 = 8,
};

typedef NS_ENUM(NSUInteger, IMC_DISPLAY_MODE) {
  IMC_DISPLAY_STRETCH  = 0,
  IMC_DISPLAY_FIT = 1,
  IMC_DISPLAY_ZOOM = 2,
};

typedef NS_ENUM(NSUInteger, IMC_MOBILE_COMMAND) {
  IMC_CMD_INIT_THREAD  = 0,
  IMC_CMD_CONNECTION_BEGIN  = 10,
  IMC_CMD_CONNECTION_CONNECT = 11,
  IMC_CMD_CONNECTION_CONNECT_RESPONSE = 12,
  IMC_CMD_CONNECTION_CONNECT_ERROR = 13,
  IMC_CMD_CONNECTION_DISCONNECT = 14,
  IMC_CMD_CONNECTION_DISCONNECT_RESPONSE = 15,
  IMC_CMD_START_TRANSFER_VIDEO = 16,
  IMC_CMD_STOP_TRANSFER_VIDEO = 17,
  IMC_CMD_PREPARE_FOR_MINIMIZE = 18,
  IMC_CMD_PREPARE_FOR_RESTORE = 19,
  IMC_CMD_CONNECTION_CONNECT_SUCCESSFULL = 20,
  IMC_CMD_MOBILE_SEND_SETTINGS = 21,
  IMC_CMD_START_TRANSFER_VIDEO_FOR_SERVER = 22,
  IMC_CMD_START_TRANSFER_VIDEO_FOR_SERVER_RESPONSE = 23,
  IMC_CMD_CONNECTION_END = 24,
  
  IMC_CMD_SETTING_BEGIN  = 100,
  IMC_CMD_SEND_CAMERA_LIST = 101,
  IMC_CMD_SETTING_SERVER_SEND = 102,
  IMC_CMD_ADD_IP_CAMERAS = 103,
  IMC_CMD_REMOVE_IP_CAMERAS = 104,
  IMC_CMD_SERVER_CHANGED_PORTS = 105,
  IMC_CMD_SERVER_SEND_SETTINGS = 106,
  IMC_CMD_server_SEND_HARDWARE_CONFIG = 107,
  IMC_CMD_SERVER_CHANGED_CURRENT_USER = 108,
  IMC_CMD_SERVER_CHANGED_SERVER_INFO = 109,
  IMC_CMD_UPDATE_SETTING_TO_GUI = 110,
  IMC_CMD_WAIT_UPDATE_CHANNEL_CONFIG = 111,
  IMC_CMD_UPDATE_CHANNEL_CONFIG = 112,
  IMC_CMD_SERVER_CHANGE_INFO = 113,
  IMC_CMD_SERVER_SEND_SETTINGS_SUCCESSFUL = 114,
  IMC_CMD_SETTING_END = 115,
  
  IMC_CMD_ALARM_BEGIN  = 200,
  IMC_CMD_NEW_ALARM_DETECTED = 201,
  IMC_CMD_SEND_ALARM_LIST = 202,
  IMC_CMD_SEND_ALARM_LIST_RESPONSE = 203,
  IMC_CMD_VIEW_ALARM_IMAGES = 204,
  IMC_CMD_NEXT_ALARM_IMAGE = 205,
  IMC_CMD_NEXT_ALARM_LIST = 206,
  IMC_CMD_NEXT_ALARM_LIST_RESPONSE = 207,
  IMC_CMD_PREVIOUS_ALARM_LIST = 208,
  IMC_CMD_PREVIOUS_ALARM_LIST_RESPONSE = 209,
  IMC_CMD_EXIT_ALARM_LIST = 210,
  IMC_CMD_ALARM_END = 211,
  
  IMC_CMD_DISPLAY_SETTING_BEGIN  = 300,
  IMC_CMD_DISPLAY_GET_CURRENT_LAYOUT = 301,
  IMC_CMD_DISPLAY_GET_VIEW_RESOLUTION = 302,
  IMC_CMD_DISPLAY_VIDEO = 303,
  IMC_CMD_DISPLAY_REQUEST_SNAPSHOT = 304,
  IMC_CMD_DISPLAY_RESPONSE_SNAPSHOT = 305,
  IMC_CMD_DISPLAY_CANCEL_SNAPSHOT = 306,
  IMC_CMD_DISPLAY_SETTING_END = 307,
  IMC_CMD_DECODE_FRAME = 308,
  IMC_CMD_DECODE_SEARCH_FRAME = 309,
  IMC_CMD_SEARCH_RAW_VIDEO = 310,
  IMC_CMD_POST_DECODED_FRAME = 311,
  IMC_CMD_FIRST_MAIN_STREAM_FRAME = 312,
  IMC_CMD_UPDATE_SUB_STREAM_STATUS = 313,
  IMC_CMD_DISCONNECT_VIDEO = 314,
  IMC_CMD_RESET_DECODER = 315,
  
  IMC_CMD_MOBILE_SEND_DATA_BEGIN  = 400,
  IMC_CMD_MOBILE_SEND_SYSTEM_INFO = 401,
  IMC_CMD_MOBILE_SEND_VIDEO_QUALITY = 402,
  IMC_CMD_MOBILE_SEND_FRAME_PER_SECOND = 403,
  IMC_CMD_MOBILE_SEND_SCREEN_LAYOUT = 404,
  IMC_CMD_MOBILE_SEND_CHANNEL_MAPPING = 405,
  IMC_CMD_MOBILE_SEND_ALARM_SETTING = 406,
  IMC_CMD_MOBILE_SEND_SCREEN_SIZE = 407,
  IMC_CMD_MOBILE_SEND_RATIO_VIEW = 408,
  IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK = 409,
  IMC_CMD_MOBILE_SEND_RESOLUTION_REQUEST = 410,
  IMC_CMD_MOBILE_SEND_IS_FULL_SCREEN = 411,
  IMC_CMD_MOBILE_SEND_DURATION_VIEW_ALARM_LIST = 412,
  IMC_CMD_MOBILE_SEND_FILTER_ALARM_BY = 413,
  IMC_CMD_MOBILE_SEND_ALL_SETTING = 414,
  IMC_CMD_MOBILE_GUI_SEND_ALL_SETTING = 415,
  IMC_CMD_MOBILE_SEND_DATA_END = 416,
  
  IMC_CMD_PTZ_OPERATION_BEGIN  = 500,
  IMC_CMD_PTZ_LEFT = 501,
  IMC_CMD_PTZ_RIGHT = 502,
  IMC_CMD_PTZ_UP = 503,
  IMC_CMD_PTZ_DOWN = 504,
  IMC_CMD_PTZ_LEFTUP = 505,
  IMC_CMD_PTZ_RIGHTUP = 506,
  IMC_CMD_PTZ_LEFTDOWN = 507,
  IMC_CMD_PTZ_RIGHTDOWN = 508,
  IMC_CMD_PTZ_ZOOMIN = 509,
  IMC_CMD_PTZ_ZOOMOUT = 510,
  IMC_CMD_PTZ_LEFT_STOP = 511,
  IMC_CMD_PTZ_RIGHT_STOP = 512,
  IMC_CMD_PTZ_UP_STOP = 513,
  IMC_CMD_PTZ_DOWN_STOP = 514,
  IMC_CMD_PTZ_LEFTUP_STOP = 515,
  IMC_CMD_PTZ_RIGHTUP_STOP = 516,
  IMC_CMD_PTZ_LEFTDOWN_STOP = 517,
  IMC_CMD_PTZ_RIGHTDOWN_STOP = 518,
  IMC_CMD_PTZ_ZOOMIN_STOP = 519,
  IMC_CMD_PTZ_ZOOMOUT_STOP = 520,
  IMC_CMD_PTZ_OPERATION_END = 521,
  
  IMC_CMD_SEARCH_OPERATION_BEGIN  = 600,
  IMC_CMD_SEARCH_UPDATE_DATA_DATE = 601,
  IMC_CMD_SEARCH_UPDATE_CHANNEL_LIST_IN_DATE = 602,
  IMC_CMD_SEARCH_STOP_RESPONSE = 603,
  IMC_CMD_UPDATE_SETTING_SERVER = 604,
  IMC_CMD_SEARCH_OPERATION_END = 605,
  
  
  IMC_CMD_RELAY_HANDSHAKE_FAILED = 700,
  IMC_CMD_RELAY_REMOTE_CONFIG_CHANGED = 701,
  IMC_CMD_RELAY_UPDATE_DATA_USAGE = 702,
  
  IMC_CMD_SERVER_REJECT_ACCEPT = 800,
  
};

typedef NS_ENUM(NSUInteger, ALARM_EVENT_TYPE)
{
  ALARM_EVENT_SENSOR_TRIGGERED  = 0,
  ALARM_EVENT_STOP_RECORDING = 1,
  ALARM_EVENT_VIDEO_LOST = 2,
  ALARM_EVENT_MOTION_DETECTION = 3,
  ALARM_EVENT_VIDEO_LOST_ALL = 4,
  ALARM_EVENT_TYPE_ALL = 65535
};

typedef NS_ENUM(NSUInteger, IMC_ALARM_EVENT_VIEW_STATUS)
{
  VIEW_STATUS_ONE_PAGE = 0,
  VIEW_STATUS_FIRST_PAGE = 1,
  VIEW_STATUS_MIDLE_PAGE = 2,
  VIEW_STATUS_LAST_PAGE = 3,
} ;


typedef NS_ENUM(NSUInteger, IMC_SEARCH_MODE)
{
  IMC_SEARCH_M_UNKNOWN   = 0,
  IMC_SEARCH_M_ALL = 1,
  IMC_SEARCH_M_ONE = 2,
  IMC_SEARCH_M_MIX = 3,
  IMC_SEARCH_M_PAC_HISTORY = 4,
  IMC_SEARCH_M_DUMP_PREVIEW = 5,
  
};

typedef NS_ENUM(NSUInteger, IMC_VIDEO_MODE)
{
  NO_VIDEO = 0,
  LIVE_VIDEO = 1,
  SEARCH_VIDEO = 2,
};

//---------------------------------------------------------------------------
// region declare command parameter object
@interface ImcCommand : NSObject {
@private
  NSInteger   command;
  NSObject*   data;
}

- (id)initWithCommand:(NSInteger)_command andData:(NSObject*)_data;
- (NSInteger)getCommand;
- (NSObject*)getData;

@end

// Connection Server parameter
@interface ImcConnectionServer : NSObject{
  NSString*   serverName;
  NSString*   serverID;
  NSString*   server_address;
  NSInteger   server_port;
  NSString*   username;
  NSString*   password;
  NSString*   groupName;
  NSString*   fullAddress;
  NSString* haspLicense;
  BOOL isRelay;
  BOOL relayConnectable;
  NSString* relayIp;
  NSInteger relayPort;
}

@property (nonatomic, readwrite) NSInteger server_port;
@property (nonatomic, retain) NSString* serverName;
@property (nonatomic, retain) NSString* serverID;
@property (nonatomic, retain) NSString* server_address;
@property (nonatomic, retain) NSString* username;
@property (nonatomic, retain) NSString* password;
@property (nonatomic, retain) NSString* groupName;
@property (nonatomic, retain) NSString* favoriteGroupName;
@property (nonatomic, retain) NSString* fullAddress;
@property (nonatomic, retain) NSString* public_address;
@property (nonatomic, retain) NSString* haspLicense;
@property (nonatomic, readwrite)           BOOL    isRelay;
@property (nonatomic, readwrite)           BOOL    relayConnectable;
@property (nonatomic, readwrite)           BOOL    isRelayReconnecting;
@property (nonatomic, retain) NSString* relayIp;
@property (nonatomic, readwrite) NSInteger relayPort;

@property (readwrite)           BOOL    connected;
@property NSMutableArray* groupNames;
@property NSInteger serverVersion;
@property NSMutableArray* availableDataDateList;
@property ImcAllDateInterval* allDateInterval;
@property NSTimeZone* serverTimezone;

+ (id) initWithServerInfo : (ImcConnectionServer*)server;
- (void)updateServerInfo:(ImcConnectionServer*)server;
-(BOOL) isEqual:(ImcConnectionServer*)object;
@end

@class ChannelSetting;

@interface ImcConnectedServer : ImcConnectionServer{
  int maxChannelSupport;
  uint8_t videoQuality;
  uint8_t framePerSecond;
  long durationViewAlarmList;
  long numListOfDurationViewAlarmList;
  long filterAlarmBy;
  ChannelSetting* channelConfig[IMC_MAX_CHANNEL];
}

@property int maxChannelSupport;
@property uint8_t videoQuality;
@property uint8_t framePerSecond;
@property long durationViewAlarmList;
@property long numListOfDurationViewAlarmList;
@property long filterAlarmBy;
@property NSArray* firstChannelConfig;
@property NSMutableArray* currentAvailableChannel;


-(ImcConnectionServer*)connectionServerInfo;
-(void)update : (ImcConnectedServer*)connectedServerInfo;
-(void)updateChannelConfigs : (NSArray*)guiChannelConfig;
-(void)updateSetting : (ImcConnectedServer*)connectedServerInfo;
-(NSArray*)channelConfigs;
-(NSArray*)availableChannelConfigs;
-(BOOL)hasAvailableSearchChannels;
-(void)setfirstChannelConfigs:(NSArray*)channelConfigs;
-(NSArray*)firstChannelConfigs;
-(void)setChannelConfigs:(NSArray*)channelConfigs;
-(void)resetChannelConfigs;

-(BOOL)isEqual:(ImcConnectedServer*)object;
@end

@interface ImcChannelConfig : NSObject

@property (nonatomic, strong) NSString* serverAddress;
@property (nonatomic, readwrite) NSInteger serverPort;
@property (nonatomic, strong) NSArray* channelConfigs;

-(id) initWithServerAddress:(NSString*)_serverAddress withPort:(NSInteger)_port andChannelConfig : (NSArray*)_channelConfig;

@end

// Connection status parameter
@interface ImcConnectionStatus : NSObject {
  long connectionStatus;
  long connectionIndex;
}

@property (nonatomic, strong) id remoteConnection;
@property (readonly) long connectionStatus;
@property (readonly) long connectionIndex;

-(id) initWithParam:(id)remote :(long)index : (long)status;

@end

@interface ImcDisplayScreenItem : NSObject

@property (nonatomic, strong) NSString* serverAddress;
@property (nonatomic, readwrite) NSInteger serverPort;
@property (nonatomic, readwrite) NSInteger channelIndex;
@property (nonatomic, readwrite) NSInteger viewIndex;

@end

@interface ImcChannelMapping : NSObject {
  NSUInteger numChannel;
  NSString* serverAddress;
  NSInteger serverPort;
  NSInteger* channelMapping;
  NSString* serverName;
}

@property (nonatomic, readwrite)    NSUInteger numChannel;
@property (nonatomic, strong)       NSString* serverAddress;
@property (nonatomic, readwrite)    NSInteger serverPort;
@property (nonatomic, readonly)     NSInteger* channelMapping;
@property (nonatomic, strong)       NSString* serverName;

-(id)initWithServerAddress:(NSString*)address withPort:(NSInteger)port andNumOfChannels:(NSUInteger)num;

-(void)updateMappingWithChannelConfig : (NSArray*)channelConfigs;
-(void)updateNumberOfChannel : (NSInteger)newNumChannel;
@end

@interface ImcAlarmEventData : NSObject {
@private
  NSInteger   index;
  NSInteger   type;
  NSInteger   utcTime;
  NSInteger   svrTimeZone;
  NSString*   serverTime;
  NSInteger   sensorControlID;
  NSInteger   numImageRelated;
  NSInteger   channelID;
  BOOL*       trackerIDMask;
  NSInteger   numTracker;
}

@property (readwrite)   NSInteger   index;
@property (readwrite)   NSInteger   type;
@property (readwrite)   NSInteger   utcTime;
@property (readwrite)   NSInteger   svrTimeZone;
@property (nonatomic, strong)      NSString*   serverTime;
@property (readwrite)   NSInteger   sensorControlID;
@property (readwrite)   NSInteger   numImageRelated;
@property (readwrite)   NSInteger   channelID;
@property (readwrite)   BOOL*       trackerIDMask;
@property (readwrite)   NSInteger   numTracker;
@property     NSMutableArray*    sensorTriggerChannelID;
@property   BOOL isEnableFullScreen;
@property   NSInteger fullScreenChannelIndex;

@end

@interface ImcAlarmEventList : NSObject {
@private
  NSString*           serverAddress;
  NSInteger           serverPort;
  NSMutableArray*     listAlarmEvents;
  NSInteger           alarmViewStatus;
}

@property (strong)      NSString*           serverAddress;
@property (readwrite)   NSInteger           serverPort;
@property (strong)      NSMutableArray*     listAlarmEvents;
@property (readwrite)   NSInteger           alarmViewStatus;

-(id)initFromServerAddress : (NSString*)address andPort : (NSInteger)port;
-(void)parserXMLData : (NSData*)xmlData;
-(ImcAlarmEventData*)parserXMLElement:(NSData *)xmlData;

@end

@interface ImcCommonHeader : NSObject

@property (nonatomic, strong) NSString* serverAddress;
@property (nonatomic, readwrite) NSInteger serverPort;
@property (nonatomic, readwrite) NSInteger channelID;

@end


@interface i3MobileLoginInfo : NSObject {
@private
  NSString*   firstName;
  NSString*   lastName;
  NSString*   email;
  NSString*   password;
  BOOL        rememberPassword;
}

@property (nonatomic, retain) NSString* firstName;
@property (nonatomic, retain) NSString* lastName;
@property (nonatomic, retain) NSString* email;
@property (nonatomic, retain) NSString* password;
@property (nonatomic, readwrite) BOOL rememberPassword;

@end

@interface i3SnapshotInfo : NSObject

@property (nonatomic, retain) NSString* snapshotFilename;
@property (nonatomic, retain) UIImage* snapshotImage;

@end

@interface Global: NSObject

+ (NSString*)settingDirectory;
+ (NSString*)fullPathSettingFilename : (NSString*)filename;
+ (NSString*)fullPathSnapshotFilename: (NSString*)filename;
+ (NSData*) generateEASKey;
+ (NSData*) normalizeDataForUtf8Encoding : (NSData*)xmlData;
@end

@interface ImcFavoriteChannel : NSObject

@property NSInteger channelID;
@property NSString* channelName;
@property NSString* serverAddress;
@property NSInteger serverPort;
@property NSString* serverName;
@property double groupID;

@end

@interface ImcFavoriteGroup : NSObject

@property NSString* groupName;
@property double groupID;
@property NSMutableArray* channel;

@end

@interface ImcTimeInterval : NSObject

@property int  deviceID;  //id of sensor or motion in case of searching sensor or motion.
@property long time;  //active time of sensor or motion
@property long begin;  //begin time in seconds
@property long end;  //end time in seconds
@property int  type;  //RecordType

@end

@interface ImcDateInterval : NSObject

@property long time;  // time which represents the begining of the day in UTC seconds
@property int  size;
@property NSInteger channelIndex;
@property NSMutableArray* timeInterval;

-(id)initWithDateInterVal:(void*)di withTimeZoneOffset:(long)timeZoneOffset;
@end

@interface ImcAllDateInterval : NSObject

@property NSString* serverAddress;
@property uint64_t  channel_mask;
@property IMC_SEARCH_MODE mode;
@property NSMutableArray* dateInterval;

@end

typedef NS_ENUM(NSInteger, SEARCH_CURRENT_TAB)
{
  CALENDAR_TAB = 0,
  CHANNELS_TAB,
  PLAYBACK_TAB
};

@interface i3PlaybackResumeInfo : NSObject
@property NSString* selectedSvrAddress;
@property NSInteger selectedSvrPort;
@property NSInteger lastTimePlay;
@property NSDate* chosenDay;
@property NSInteger selectedChannelIdx;
@property SEARCH_CURRENT_TAB currentTab;
@end

// ----------------------------------------------------------------------------
// protocol declare

typedef NS_ENUM(NSUInteger, i3ResponseMessage)
{
  I3_ADD_NEW_SERVER = 0,
  I3_ADD_NEW_GROUP,
  I3_COUNT
};

@protocol i3ProcessConnectionDelegate <NSObject>

-(NSInteger)handleResponseMessage :(IMC_MSG_BASE)messageId fromView:(UIViewController*)viewController withData : (NSObject*)responseData;

@end


@protocol ImcCommandControllerDelegate
- (int) handleCommand : (NSInteger)command : (id)parameter;

@end

#endif

