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
  LOGIN_STATUS_UNKNOWN = 0,
  LOGIN_STATUS_SUCCEEDED,
  LOGIN_STATUS_CANNOT_CONNECT,
  LOGIN_STATUS_WRONG_USER_PASS,
  LOGIN_STATUS_WRONG_SERVERID,
  LOGIN_STATUS_VIDEO_PORT_ERROR,
  LOGIN_STATUS_WIFI_NOT_SUPPORTED,
  LOGIN_STATUSNETWORK_NOT_TURN_ON
};

typedef NS_ENUM(NSUInteger, I3_FAVORITE_MODE)
{
  NORMAL_MODE = 0,
  ADD_MODE,
  EDIT_MODE,
  DUPLICATED_MODE,
  CONNECT_MODE,
  VIEW_CONNECT_MODE,
  CONNECT_CHANNEL_MODE
};

typedef NS_ENUM(NSUInteger, IMC_MSG_BASE) {
  IMC_MSG_CONNECTION_BACK = 0,
  IMC_MSG_CONNECTION_CONNECT,
  IMC_MSG_CONNECTION_DISCONNECT,
  IMC_MSG_CONNECTION_CANCEL,
  IMC_MSG_GET_CONNECTION_NUMBER,
  IMC_MSG_GET_CONNECTION_NUMBER_RESPONSE,
  
  IMC_MSG_ABOUT = 10,
  IMC_MSG_ABOUT_BACK,
  
  IMC_MSG_SETTINGS_BACK = 20,
  IMC_MSG_SETTINGS_SAVE,
  
  IMC_MSG_ADD_SERVER_DONE = 30,
  IMC_MSG_ADD_SERVER_CANCEL,
  
  IMC_MSG_ALARM_SETTING_CANCEL = 40,
  IMC_MSG_ALARM_SETTING_SAVE,
  
  IMC_MSG_DISPLAY_UPDATE_LAYOUT = 50,
  IMC_MSG_DISPLAY_FULLSCREEN,
  IMC_MSG_DISPLAY_SHOW_PTZ_PANEL,
  IMC_MSG_DISPLAY_HIDE_PTZ_PANEL,
  
  IMC_MSG_CHANNEL_MAPPING_CANCEL = 60,
  IMC_MSG_CHANNEL_MAPPING_SAVE,
  IMC_MSG_CHANNEL_MAPPING_SNAPSHOT_SCREEN,
  IMC_MSG_CHANNEL_MAPPING_GET_SERVER_CHANNEL_INFO,
  IMC_MSG_CHANNEL_MAPPING_UPDATE_CHANNEL_MASK,
  
  
  IMC_MSG_MAIN_VIEW_ADD_SERVER = 100,
  IMC_MSG_MAIN_VIEW_REMOVE_SERVER,
  IMC_MSG_MAIN_VIEW_UPDATE_SERVER,
  IMC_MSG_MAIN_VIEW_UPDATE_SERVER_RESPONSE,
  IMC_MSG_MAIN_VIEW_ADD_GROUP,
  IMC_MSG_MAIN_VIEW_SELECT_GROUP,
  IMC_MSG_MAIN_VIEW_SELECT_GROUP_RESPONSE,
  IMC_MSG_MAIN_VIEW_RENAME_GROUP,
  IMC_MSG_MAIN_VIEW_DELETE_GROUP,
  IMC_MSG_MAIN_VIEW_SELECT_NEW_SERVER,
  IMC_MSG_MAIN_VIEW_SELECT_NEW_SERVER_RESPONSE,
  IMC_MSG_MAIN_VIEW_SELECT_CONNECTION,
  IMC_MSG_MAIN_VIEW_SELECT_CONNECTION_RESPONSE,
  IMC_MSG_MAIN_VIEW_WAIT_TO_LIVE_VIEW,
  IMC_MSG_MAIN_VIEW_TO_LIVE_VIEW,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS_RESPONSE,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS_ADD,
  IMC_MSG_MAIN_VIEW_FAVORITE_CHANNELS_ADD_RESPONSE,
  IMC_MSG_MAIN_VIEW_ADD_SERVER_TO_GROUP_BACK,
  IMC_MSG_MAIN_VIEW_SERVER_CHANGE_INFO,
  IMC_MSG_MAIN_VIEW_LIVE_VIEW_RESPONSE,
  IMC_MSG_MAIN_VIEW_CMS_CONNECTION,
  IMC_MSG_MAIN_VIEW_CMS_CONNECTION_CLOSE,
  IMC_MSG_MAIN_VIEW_DISABLE_CMS,
  IMC_MSG_MAIN_VIEW_SWITCH_FROM_CMS,
  
  IMC_MSG_LIVE_VIEW_SELECT_RATIO_VIEW = 200,
  IMC_MSG_LIVE_VIEW_SELECT_RATIO_VIEW_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_FPS,
  IMC_MSG_LIVE_VIEW_SELECT_FPS_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_VIDEO_QUALITY,
  IMC_MSG_LIVE_VIEW_SELECT_VIDEO_QUALITY_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_VIEW_ALARM,
  IMC_MSG_LIVE_VIEW_SELECT_VIEW_ALARM_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_FILTER,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_FILTER_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_CHANNEL_MAPPING,
  IMC_MSG_LIVE_VIEW_SELECT_CHANNEL_MAPPING_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_CHANNEL_DEFAULT,
  IMC_MSG_CHANNEL_MAPPING_SELECT_VIEW,
  IMC_MSG_CHANNEL_MAPPING_SELECT_VIEW_RESPONSE,
  IMC_MSG_LIVE_VIEW_DETAIL_SETTING_BACK,
  IMC_MSG_LIVE_VIEW_UPDATE_VIDEO_DISPLAY_MASK,
  IMC_MSG_LIVE_VIEW_SETTING_SELECT_SERVER,
  IMC_MSG_LIVE_VIEW_SETTING_SELECT_SERVER_BACK,
  IMC_MSG_LIVE_VIEW_SETTING_SAVE,
  IMC_MSG_LIVE_VIEW_REFRESH_SCREEN,
  IMC_MSG_LIVE_SETTING_BACK,
  IMC_MSG_LIVE_VIEW_CHANGE_MAINSUB_STATUS,
  IMC_MSG_LIVE_VIEW_DISABLE_TABBARITEM,
  
  IMC_MSG_LIVE_VIEW_PTZ_LEFT,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHT,
  IMC_MSG_LIVE_VIEW_PTZ_UP,
  IMC_MSG_LIVE_VIEW_PTZ_DOWN,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTUP,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTUP,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTDOWN,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTDOWN,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMIN,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMOUT,
  IMC_MSG_LIVE_VIEW_PTZ_LEFT_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHT_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_UP_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_DOWN_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTUP_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTUP_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_LEFTDOWN_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_RIGHTDOWN_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMIN_STOP,
  IMC_MSG_LIVE_VIEW_PTZ_ZOOMOUT_STOP,
  IMC_MSG_LIVE_VIEW_REQUEST_SNAPSHOT,
  IMC_MSG_LIVE_VIEW_CANCEL_SNAPSHOT,
  IMC_MSG_LIVE_VIEW_EMAIL_SNAPSHOT,
  IMC_MSG_LIVE_VIEW_STOP_VIDEO,
  IMC_MSG_LIVE_VIEW_START_VIDEO,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING_DEFAULT,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_SETTING_DEFAULT_RESPONSE,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_VOLUME,
  IMC_MSG_LIVE_VIEW_SELECT_ALARM_VOLUME_UPDATE,
  IMC_MSG_LIVE_VIEW_REMOVE_CHANNEL,
  IMC_MSG_LIVE_VIEW_STOP_RECORDING,
  IMC_MSG_LIVE_VIEW_HIDE_MENU_BAR,
  IMC_MSG_LIVE_REQUEST_MAIN_STREAM,
  IMC_MSG_LIVE_REQUEST_SUB_STREAM,
  IMC_MSG_LIVE_SWIPE_SCREEN,
  IMC_MSG_LIVE_UPDATE_CHANNEL_MASK,
  
  IMC_MSG_CREATE_ACCOUNT = 300,
  IMC_MSG_FORGOT_PASSWORD,
  IMC_MSG_ALARM_LIST_CUR_PAGE,
  IMC_MSG_ALARM_LIST_CUR_PAGE_RESPONSE,
  IMC_MSG_ALARM_LIST_NEXT_PAGE,
  IMC_MSG_ALARM_LIST_NEXT_PAGE_RESPONSE,
  IMC_MSG_ALARM_LIST_PREV_PAGE,
  IMC_MSG_ALARM_LIST_PREV_PAGE_RESPONSE,
  IMC_MSG_ALARM_LIST_EXIT,
  IMC_MSG_ALARM_PLAY_A_SOUND,
  IMC_MSG_ALARM_PLAY_A_SOUND_RESPONSE,
  IMC_MSG_ALARM_LIST_BACK,
  
  IMC_MSG_FAVORITE_ADD_GROUP = 400,
  IMC_MSG_FAVORITE_DELETE_GROUP,
  IMC_MSG_FAVORITE_EDIT_GROUP_NAME,
  IMC_MSG_FAVORITE_EDIT_GROUP_NAME_RESPONSE,
  IMC_MSG_FAVORITE_SAVE_FAVORITE_GROUP,
  IMC_MSG_FAVORITE_CHANNEL_ON_BACK,
  IMC_MSG_FAVORITE_CHANNEL_GET_CONNECTION_SERVER,
  IMC_MSG_FAVORITE_CHANNEL_ON_BACK_TO_FAVORITE_GROUP_VIEW,
  IMC_MSG_FAVORITE_CHANNEL_ON_ADD_CHANNELS,
  IMC_MSG_FAVORITE_CHANNEL_SAVE_CHANNELS,
  IMC_MSG_FAVORITE_DELETE_CHANNEL,
  IMC_MSG_FAVORITE_CONNECTION_CONNECT,
  IMC_MSG_FAVORITE_REQUEST_DISCONNECT_ALL,
  IMC_MSG_FAVORITE_CHANNEL_BACK,
  IMC_MSG_FAVORITE_CHANNEL_CONNECT_CHANNEL,
  IMC_MSG_FAVORITE_REQUEST_DISCONNECT_SERVER,
  IMC_MSG_FAVORITE_RESPONSE_SERVER_INFO,
  IMC_MSG_FAVORITE_RESPONSE_NO_CHANGE,
  IMC_MSG_FAVORITE_START_EDITING,
  IMC_MSG_ADD_FAVORITE_FROM_LIVE_BACK,
  IMC_MSG_MAIN_VIEW_SAVE_BEFORE_CLOSE,
  IMC_MSG_MAIN_DISPLAY_VIDEO_UPDATE_FRAME_RESOLUTION,
  
  IMC_MSG_SEARCH_GROUP = 500,
  IMC_MSG_SEARCH_REQUEST_TIME_ZONE,
  IMC_MSG_SEARCH_CHOSEN_DAY_RESPONSE,
  IMC_MSG_SEARCH_REQUEST_TIME_INTERVAL,
  IMC_MSG_SEARCH_UPDATE_TODAY_CELL,
  IMC_MSG_SEARCH_REQUEST_THUMBNAIL,
  IMC_MSG_SEARCH_REQUEST_PLAY_FW,
  IMC_MSG_SEARCH_REQUEST_STOP,
  IMC_MSG_SEARCH_REQUEST_SET_POS,
  IMC_MSG_SEARCH_REQUEST_STEP_BW,
  IMC_MSG_SEARCH_REQUEST_STEP_FW,
  IMC_MSG_SEARCH_RESET_DECODER_FOR_LIVE,
  IMC_MSG_SEARCH_RESET_DECODER_FOR_SEARCH,
  IMC_MSG_SEARCH_REQUEST_SNAPSHOT,
  IMC_MSG_SEARCH_REQUEST_REFRESH_CALENDAR,
  IMC_MSG_SEARCH_REQUEST_REFRESH_DECODER,
  IMC_MSG_SEARCH_REQUEST_MAIN_SUB,
};

typedef NS_ENUM(NSUInteger, IMC_DIVISION_MODE) {
  IMC_DIV_NONE = 0,
  IMC_DIV_1,
  IMC_DIV_4,
  IMC_DIV_9,
  IMC_DIV_16,
  IMC_DIV_25,
  IMC_DIV_36,
  IMC_DIV_49,
  IMC_DIV_64
};

typedef NS_ENUM(NSUInteger, IMC_DISPLAY_MODE) {
  IMC_DISPLAY_STRETCH = 0,
  IMC_DISPLAY_FIT,
  IMC_DISPLAY_ZOOM
};

typedef NS_ENUM(NSUInteger, IMC_MOBILE_COMMAND) {
  IMC_CMD_INIT_THREAD = 0,
  IMC_CMD_CONNECTION_BEGIN = 10,
  IMC_CMD_CONNECTION_CONNECT,
  IMC_CMD_CONNECTION_CONNECT_RESPONSE,
  IMC_CMD_CONNECTION_CONNECT_ERROR,
  IMC_CMD_CONNECTION_DISCONNECT,
  IMC_CMD_CONNECTION_DISCONNECT_RESPONSE,
  IMC_CMD_START_TRANSFER_VIDEO,
  IMC_CMD_STOP_TRANSFER_VIDEO,
  IMC_CMD_PREPARE_FOR_MINIMIZE,
  IMC_CMD_PREPARE_FOR_RESTORE,
  IMC_CMD_CONNECTION_CONNECT_SUCCESSFULL,
  IMC_CMD_MOBILE_SEND_SETTINGS,
  IMC_CMD_START_TRANSFER_VIDEO_FOR_SERVER,
  IMC_CMD_START_TRANSFER_VIDEO_FOR_SERVER_RESPONSE,
  IMC_CMD_CONNECTION_END,
  
  IMC_CMD_SETTING_BEGIN = 100,
  IMC_CMD_SEND_CAMERA_LIST,
  IMC_CMD_SETTING_SERVER_SEND,
  IMC_CMD_ADD_IP_CAMERAS,
  IMC_CMD_REMOVE_IP_CAMERAS,
  IMC_CMD_SERVER_CHANGED_PORTS,
  IMC_CMD_SERVER_SEND_SETTINGS,
  IMC_CMD_server_SEND_HARDWARE_CONFIG,
  IMC_CMD_SERVER_CHANGED_CURRENT_USER,
  IMC_CMD_SERVER_CHANGED_SERVER_INFO,
  IMC_CMD_UPDATE_SETTING_TO_GUI,
  IMC_CMD_WAIT_UPDATE_CHANNEL_CONFIG,
  IMC_CMD_UPDATE_CHANNEL_CONFIG,
  IMC_CMD_SERVER_CHANGE_INFO,
  IMC_CMD_SERVER_SEND_SETTINGS_SUCCESSFUL,
  IMC_CMD_SETTING_END,
  
  IMC_CMD_ALARM_BEGIN = 200,
  IMC_CMD_NEW_ALARM_DETECTED,
  IMC_CMD_SEND_ALARM_LIST,
  IMC_CMD_SEND_ALARM_LIST_RESPONSE,
  IMC_CMD_VIEW_ALARM_IMAGES,
  IMC_CMD_NEXT_ALARM_IMAGE,
  IMC_CMD_NEXT_ALARM_LIST,
  IMC_CMD_NEXT_ALARM_LIST_RESPONSE,
  IMC_CMD_PREVIOUS_ALARM_LIST,
  IMC_CMD_PREVIOUS_ALARM_LIST_RESPONSE,
  IMC_CMD_EXIT_ALARM_LIST,
  IMC_CMD_ALARM_END,
  
  IMC_CMD_DISPLAY_SETTING_BEGIN = 300,
  IMC_CMD_DISPLAY_GET_CURRENT_LAYOUT,
  IMC_CMD_DISPLAY_GET_VIEW_RESOLUTION,
  IMC_CMD_DISPLAY_VIDEO,
  IMC_CMD_DISPLAY_REQUEST_SNAPSHOT,
  IMC_CMD_DISPLAY_RESPONSE_SNAPSHOT,
  IMC_CMD_DISPLAY_CANCEL_SNAPSHOT,
  IMC_CMD_DISPLAY_SETTING_END,
  IMC_CMD_DECODE_FRAME,
  IMC_CMD_DECODE_SEARCH_FRAME,
  IMC_CMD_SEARCH_RAW_VIDEO,
  IMC_CMD_POST_DECODED_FRAME,
  IMC_CMD_FIRST_MAIN_STREAM_FRAME,
  IMC_CMD_UPDATE_SUB_STREAM_STATUS,
  IMC_CMD_DISCONNECT_VIDEO,
  IMC_CMD_RESET_DECODER,
  
  IMC_CMD_MOBILE_SEND_DATA_BEGIN = 400,
  IMC_CMD_MOBILE_SEND_SYSTEM_INFO,
  IMC_CMD_MOBILE_SEND_VIDEO_QUALITY,
  IMC_CMD_MOBILE_SEND_FRAME_PER_SECOND,
  IMC_CMD_MOBILE_SEND_SCREEN_LAYOUT,
  IMC_CMD_MOBILE_SEND_CHANNEL_MAPPING,
  IMC_CMD_MOBILE_SEND_ALARM_SETTING,
  IMC_CMD_MOBILE_SEND_SCREEN_SIZE,
  IMC_CMD_MOBILE_SEND_RATIO_VIEW,
  IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK,
  IMC_CMD_MOBILE_SEND_RESOLUTION_REQUEST,
  IMC_CMD_MOBILE_SEND_IS_FULL_SCREEN,
  IMC_CMD_MOBILE_SEND_DURATION_VIEW_ALARM_LIST,
  IMC_CMD_MOBILE_SEND_FILTER_ALARM_BY,
  IMC_CMD_MOBILE_SEND_ALL_SETTING,
  IMC_CMD_MOBILE_GUI_SEND_ALL_SETTING,
  IMC_CMD_MOBILE_SEND_DATA_END,
  
  IMC_CMD_PTZ_OPERATION_BEGIN = 500,
  IMC_CMD_PTZ_LEFT,
  IMC_CMD_PTZ_RIGHT,
  IMC_CMD_PTZ_UP,
  IMC_CMD_PTZ_DOWN,
  IMC_CMD_PTZ_LEFTUP,
  IMC_CMD_PTZ_RIGHTUP,
  IMC_CMD_PTZ_LEFTDOWN,
  IMC_CMD_PTZ_RIGHTDOWN,
  IMC_CMD_PTZ_ZOOMIN,
  IMC_CMD_PTZ_ZOOMOUT,
  IMC_CMD_PTZ_LEFT_STOP,
  IMC_CMD_PTZ_RIGHT_STOP,
  IMC_CMD_PTZ_UP_STOP,
  IMC_CMD_PTZ_DOWN_STOP,
  IMC_CMD_PTZ_LEFTUP_STOP,
  IMC_CMD_PTZ_RIGHTUP_STOP,
  IMC_CMD_PTZ_LEFTDOWN_STOP,
  IMC_CMD_PTZ_RIGHTDOWN_STOP,
  IMC_CMD_PTZ_ZOOMIN_STOP,
  IMC_CMD_PTZ_ZOOMOUT_STOP,
  IMC_CMD_PTZ_OPERATION_END,
  
  IMC_CMD_SEARCH_OPERATION_BEGIN = 600,
  IMC_CMD_SEARCH_UPDATE_DATA_DATE,
  IMC_CMD_SEARCH_UPDATE_CHANNEL_LIST_IN_DATE,
  IMC_CMD_SEARCH_STOP_RESPONSE,
  IMC_CMD_UPDATE_SETTING_SERVER,
  IMC_CMD_SEARCH_OPERATION_END
  
};

typedef NS_ENUM(NSUInteger, ALARM_EVENT_TYPE)
{
  ALARM_EVENT_SENSOR_TRIGGERED = 0,
  ALARM_EVENT_STOP_RECORDING,
  ALARM_EVENT_VIDEO_LOST,
  ALARM_EVENT_MOTION_DETECTION,
  ALARM_EVENT_VIDEO_LOST_ALL,
  ALARM_EVENT_TYPE_ALL = 65535
};

typedef NS_ENUM(NSUInteger, IMC_ALARM_EVENT_VIEW_STATUS)
{
  VIEW_STATUS_ONE_PAGE = 0,
  VIEW_STATUS_FIRST_PAGE,
  VIEW_STATUS_MIDLE_PAGE,
  VIEW_STATUS_LAST_PAGE
} ;


typedef NS_ENUM(NSUInteger, IMC_SEARCH_MODE)
{
  IMC_SEARCH_M_UNKNOWN  = 0,
  IMC_SEARCH_M_ALL,
  IMC_SEARCH_M_ONE,
  IMC_SEARCH_M_MIX,
  IMC_SEARCH_M_PAC_HISTORY,
  IMC_SEARCH_M_DUMP_PREVIEW,
  
};

typedef NS_ENUM(NSUInteger, IMC_VIDEO_MODE)
{
  NO_VIDEO = 0,
  LIVE_VIDEO = 1,
  SEARCH_VIDEO = 2,
};

typedef NS_ENUM(NSUInteger, IMC_STATUS)
{
  DISCONNECTED = 0,
  CONNECTING,
  CONNECTED
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
// @property (readwrite)           BOOL    connected;
@property (readwrite)           IMC_STATUS    connected;
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

