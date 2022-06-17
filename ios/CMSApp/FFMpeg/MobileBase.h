#ifndef __MOBILE_BASE__
#define __MOBILE_BASE__

#include <inttypes.h>
#include <Foundation/Foundation.h>

#define MOBILE_DEFAULT_MAIN_PORT			13225
#define MOBILE_DEFAULT_VIDEO_PORT			13226
#define MOBILE_DEFAULT_SKIP_EVENT_LOG		5
#define MOBILE_MAX_CONNECTION		50
#define MOBILE_DATA_DIR							"MobileData"
#define MOBILE_HISTORY_ALARM_FILE_DIR			"MobileData\\AlarmEvent_"
#define MOBILE_HISTORY_ALARM_INFO_FILE_DIR		"MobileData\\AlarmEventInfo.cfg"
#define MOBILE_CONTROL_IMAGE_DIR				"MobileData\\Control\\" 
#define MOBILE_SENSOR_IMAGE_DIR					"MobileData\\Sensor\\"
#define MOBILE_MAX_PATH_LENGTH	256
#define MOBILE_MAX_XML_EVENT_LENGTH	100000
#define MOBILE_MAX_XML_ALL_EVENT_LENGTH 5242880  //5MB
#define MOBILE_MAX_XML_CAMERA_INFO_LENGTH	100000
#define MOBILE_MAX_XML_SERVER_SETTING_LENGTH	100000
#define MOBILE_MAX_HEADER_CONFIG_FILE_SIZE	64
#define MOBILE_MAX_PACKET_LENGTH	1024
#define MOBILE_MAX_ALARM_IMAGE_SIZE	10485760 //10MB
#define MOBILE_MAX_ALARM_EVENT 65535
#define MOBILE_SOCKET_TIMEOUT		30
#define STR_LEN_16 16
#define STR_LEN_32 32
#define STR_LEN_64 64
#define MAX_CHANNEL 64

//for testing
#define MOBILE_LOG_FILE_NAME @"logfile.dat"

//for snapshot alarm images
#define MOBILE_VIDEO_COMPRESS_QUALITY 100

//remote connection data
#define MAX_RECEIVE_BUFFER_SIZE (16*MOBILE_MAX_PACKET_LENGTH)//16k
#define MAX_RECEIVE_CONNECTION_DATA_BUFFER_SIZE (4*MOBILE_MAX_PACKET_LENGTH) // 2Mb

#define MOBILE_MSG_FAIL  0x81
#define MOBILE_MSG_SUCCESS 0x80

#define MOBILE_COMM_COMMAND_HEADER_SIZE 6

// -----------------------------------------------------------------------------------------------------
// region for define enum

typedef enum SOCKET_SEND_STATUS{
    SOCKET_SEND_ERROR = -1,
    SOCKET_SEND_SUCCESS = 0
}SOCKET_SEND_STATUS;

typedef enum
{ 
	MOBILE_MSG_GROUP_COMMUNICATION_BEGIN = 0,
	MOBILE_MSG_LOGIN,
	MOBILE_MSG_DISCONNECT,
	MOBILE_MSG_EXIT,
	MOBILE_MSG_VIDEO_SOCKET_ERROR,
	MOBILE_MSG_KEEP_ALIVE,
	MOBILE_MSG_TEST,
	MOBILE_MSG_MINIMIZE,
	MOBILE_MSG_SNAPSHOT,
	MOBILE_MSG_CANCEL_SNAPSHOT,
	MOBILE_MSG_GROUP_COMMUNICATION_END,

	MOBILE_MSG_GROUP_VIDEO_REQUEST_BEGIN = 500,
	MOBILE_MSG_START_SEND_VIDEO,
	MOBILE_MSG_STOP_SEND_VIDEO,
	MOBILE_MSG_PAUSE_SEND_VIDEO,
	MOBILE_MSG_RESUME_SEND_VIDEO,
	MOBILE_MSG_SEND_NEXT_FRAME,
    MOBILE_MSG_SEND_NEXT_ENCODE_FRAME,
	MOBILE_MSG_GROUP_VIDEO_REQUEST_END,

	MOBILE_MSG_GROUP_ALARM_BEGIN = 1000,
	MOBILE_MSG_NEW_ALARM_DETECTED,
	MOBILE_MSG_SEND_ALARM_LIST,
	MOBILE_MSG_VIEW_ALARM_IMAGES,
	MOBILE_MSG_NEXT_ALARM_IMAGE,
	MOBILE_MSG_NEXT_ALARM_LIST,
	MOBILE_MSG_PREVIOUS_ALARM_LIST,
	MOBILE_MSG_EXIT_ALARM_LIST,
	MOBILE_MSG_GROUP_ALARM_END,

	MOBILE_MSG_GROUP_PTZ_CONTROL_BEGIN = 1500,
	MOBILE_MSG_PTZ_CONTROL_LEFT	,
	MOBILE_MSG_PTZ_CONTROL_RIGHT,
	MOBILE_MSG_PTZ_CONTROL_UP,
	MOBILE_MSG_PTZ_CONTROL_DOWN,
	MOBILE_MSG_PTZ_CONTROL_ZOOM_IN,
	MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT,
	MOBILE_MSG_PTZ_CONTROL_LEFT_STOP,
	MOBILE_MSG_PTZ_CONTROL_RIGHT_STOP,
	MOBILE_MSG_PTZ_CONTROL_UP_STOP,
	MOBILE_MSG_PTZ_CONTROL_DOWN_STOP,
	MOBILE_MSG_PTZ_CONTROL_ZOOM_IN_STOP,
	MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT_STOP,
    MOBILE_MSG_PTZ_CONTROL_LEFTUP,
	MOBILE_MSG_PTZ_CONTROL_RIGHUP,
	MOBILE_MSG_PTZ_CONTROL_LEFTDOWN,
	MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN,
    MOBILE_MSG_PTZ_CONTROL_LEFTUP_STOP,
	MOBILE_MSG_PTZ_CONTROL_RIGHUP_STOP,
	MOBILE_MSG_PTZ_CONTROL_LEFTDOWN_STOP,
	MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN_STOP,
	MOBILE_MSG_GROUP_PTZ_CONTROL_END,

	MOBILE_MSG_GROUP_SETTING_BEGIN = 2000,
    MOBILE_MSG_SEND_CAMERA_LIST,
    MOBILE_MSG_MOBILE_SEND_SETTINGS,
    MOBILE_MSG_ADD_IP_CAMERAS,
    MOBILE_MSG_REMOVE_IP_CAMERAS,
    MOBILE_MSG_SERVER_CHANGED_PORTS,
    MOBILE_MSG_SERVER_SEND_SETTINGS,
    MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG,
    MOBILE_MSG_SERVER_CHANGED_CURRENT_USER,
    MOBILE_MSG_SERVER_CHANGED_SERVER_INFO,
    MOBILE_MSG_SEVER_SEND_HARDWARE_EXCONFIG, // Trang Nguyen, added new msg to get more information of ip cameras on hardware config, Sep 27, 2012.
    MOBILE_MSG_GROUP_SETTING_END,


	//Bao add to support search in mobile, Jan 02 2014 - begin
    MOBILE_MSG_SEARCH_BEGIN = 2100,
    MOBILE_MSG_SEARCH_UPDATE_SCREEN,
    MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL,
    MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL,
    MOBILE_MSG_SEARCH_REQUEST_SETPOS,
    MOBILE_MSG_SEARCH_RESPONSE_SETPOS,
    MOBILE_MSG_SEARCH_REQUEST_PLAY_FW,
    MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW,
    MOBILE_MSG_SEARCH_REQUEST_PLAY_BW,
    MOBILE_MSG_SEARCH_RESPONSE_PLAY_BW,
    MOBILE_MSG_SEARCH_REQUEST_STOP,
    MOBILE_MSG_SEARCH_RESPONSE_STOP,
    MOBILE_MSG_SEARCH_REQUEST_STEP_FW,
    MOBILE_MSG_SEARCH_RESPONSE_STEP_FW,
    MOBILE_MSG_SEARCH_REQUEST_STEP_BW,
    MOBILE_MSG_SEARCH_RESPONSE_STEP_BW,
    MOBILE_MSG_SEARCH_RAW_VIDEO,
    MOBILE_MSG_ENCODED_VIDEO,
    MOBILE_MSG_ENCODED_VIDEO_GROUP,
    MOBILE_MSG_SEARCH_SESSION_DESTROY,
    MOBILE_MSG_SEARCH_SESSION_DESTROY_ONE,
    MOBILE_MSG_SEARCH_REQUEST_DAY_LIST,
    MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST,
    MOBILE_MSG_SEARCH_REQUEST_SNAPSHOT,
    MOBILE_MSG_SEARCH_RESPONSE_SNAPSHOT,
    MOBILE_MSG_SERVER_SEND_TIMEZONE,
    MOBILE_MSG_SERVER_RECORDING_ONLY_CANT_PLAY_VIDEO,
    MOBILE_MSG_SEARCH_REQUEST_MAIN_SUB,
    MOBILE_MSG_SEARCH_END,
    //Bao add to support search in mobile, Jan 02 2014 - end
    
    // Thang Do, adds for i3DM, Aug 12, 2011, begin
    MOBILE_MSG_GROUP_I3DM_BEGIN = 2500,
    MOBILE_MSG_TIME_CHANGED,
    MOBILE_MSG_CHECK_DUMPDATA_PRESENCE,
    MOBILE_MSG_DUMPDATA_SESSION,
    MOBILE_MSG_DUMPDATA_START,
    MOBILE_MSG_DUMPDATA_STOP,
    MOBILE_MSG_DUMPDATA_CANCEL,
    MOBILE_MSG_DUMPDATA_FINISH,
    MOBILE_MSG_DUMPDATA_RESPONSE,
    MOBILE_MSG_DUMPDATA_SYNCH,
    MOBILE_MSG_DUMPDATA_ENDTIME_CHANGED,
    MOBILE_MSG_GROUP_I3DM_END,
    // Thang Do, adds for i3DM, Aug 12, 2011, end
    
    MOBILE_MSG_MAX_MSG_ENUM = 65535

} MOBILE_MSG;

typedef enum
{
	MOBILE_LOGIN_MESSAGE_UNKNOWN = 0,
	MOBILE_LOGIN_MESSAGE_SUCCEEDED,
	MOBILE_LOGIN_MESSAGE_CANNOT_CONNECT,
	MOBILE_LOGIN_MESSAGE_WRONG_USER_PASS,
	MOBILE_LOGIN_MESSAGE_WRONG_SERVERID,
    MOBILE_LOGIN_MESSAGE_VIDEO_PORT_ERROR,
    WIFI_NOT_SUPPORTED,
    MOBILE_NETWORK_NOT_TURN_ON
} MOBILE_LOGIN_MESSAGE;

typedef enum
{
	UNKNOWN_NETWORK_TYPE = 0,
	WIFI,
	MOBILE_NETWORK,
	_3G,
	CDMA,
	GPRS
} MOBILE_NETWORK_TYPE;

typedef enum
{
	MOBILE_JPEG  = 0,
	MOBILE_BITMAP,
	MOBILE_PNG,

	MOBILE_OTHER_IMAGE_CODEC = 65000
} FRAME_CODEC_TYPE;

typedef enum
{
    DIVISION_1 	= 0,
    DIVISION_4,
    DIVISION_8,
    DIVISION_9,
    DIVISION_16,
    
    DIVISION_25,
    DIVISION_36,
    DIVISION_64, 
}LAYOUT;


typedef enum
{
    SYSTEM_INFO 				= 0,
    VIDEO_QUALITY,
    FRAME_PER_SECOND,
    SCREEN_LAYOUT,
    CHANNEL_MAPPING,
    ALARM_SETTING,
    SCREEN_SIZE,
    RATIO_VIEW,
    SOURCE_RESQUEST_MASK,
    RESOLUTION_REQUEST,
    IS_FULL_SCREEN,
    DURATION_VIEW_ALARM_LIST,
    FILTER_ALARM_BY,
    
    NUM_OF_SETTING,
}SETTING_TYPE;


// -----------------------------------------------------------------------------------------------------
// End Region

// -----------------------------------------------------------------------------------------------------
// region for define struct

typedef struct
{
	char				ipAddress[STR_LEN_64];		//ip address of this camera
	int					port;						//its working port
	char				fullmodelname[STR_LEN_64];	//full model name
	int					numInput;
	int					videoSourceIndex[STR_LEN_16];		//a ip camera can have multi-input
	int					inputID[STR_LEN_16];				//a ip camera can have multi-input
}  IpCamInfo;


typedef struct
{
	char username[STR_LEN_64];
	char pass[STR_LEN_64];
	char serverID[STR_LEN_32];
	int connectionIndex;
	//SOCKET socketID;
}MobileRequestLoginInfo;

typedef struct
{
	int loginStatus;
	int userId;
	uint64_t serverTime;
	//TIME_ZONE_INFORMATION tzInfo;
}MobileResponseLoginInfo;

typedef struct
{
	char ip[20];
	char port[6];
}MobileInfo;

typedef struct
{
	int codecType;			//avoid size aliment => 16 bytes
	uint16_t resolutionX;
	uint16_t resolutionY;
	int sourceIndex;
	int length;				//length of frame
}MobileFrameHeader; //use between Server And Mobile

/*typedef struct 
{
	bool sensorControl;
	bool videoLoss;
	bool stopRecoding;
	int duration;   // duration exist time of event in hours
}MobileAlarmSetting;*/

typedef struct  {
    uint16_t cx;
    uint16_t cy;
}Size2D;

struct Other_Vars
{
	//	int connectionIndex;
	bool valid_login;									//for determine login is valid or no
	bool mobile_is_requesting_video;					//for server_cmm determine to transfer video to mobile
	bool isLockKeepAlive;
	int curSourceIndexCapture;
};

struct InputSnapshotNode
{
	int channelID;			//id of channel that relate to this alarm event
	int sourceIndex;		// index of input video source
	int alarmType;			// = 0 if it's sensor; == 1 if it's control
	double utcTimeMiliSec;	//time when snapshot => use for naming image files
};

typedef struct 
{
	uint64_t utcTime;			//time since January 1, 1970, in seconds
	int  timeZoneOffset;		//The current bias for local time, in minutes
}DateTime;

struct EventVideoLost
{
	int id;						//id of this event
	int eventType;			//type of this event
	int videoSourceID;		//index of video source that relate to this event
	DateTime time;				//time when this event occur
};
struct EventStopRecording
{

	int id;						//id of this event
	int eventType;			//type of this event
	DateTime time;				//time when this event occur
};
struct EventControlTriggerred
{
	int id;								//id of this event
	int eventType;					//type of this event
	int controlID;					//ID of this control
	int videoSourceID;				//index of video source that relate to this event
	char imagePath[MOBILE_MAX_PATH_LENGTH];	//the path of snapshot image
	DateTime time;						//time when this event occur
};

struct EventSensorTriggerred
{
	int id;							//id of this event
	int eventType;				//type of this event
	int sensorID;				//ID of this sensor
	int numVideoSource;			//amount of related video sources
	int* videoSourceID;			//index of video sources that relate to this event
	char* imagePath;				//the path of snapshot images 
	DateTime time;					//time when this event occurs
};

//New struct for 2.0 Phase 2
typedef struct
{
	uint32_t codec_id;		//codec id
	uint32_t format;			// Video data format (defined by RAW_VIDEO_DATA_FOURCC)
	uint16_t x_width;		//width of frame
	uint16_t y_height;		//height of frame
	uint8_t  frame_rate;		//frame rate
	uint8_t	coding_method;	// defined by VIDEO_CODING_METHOD enum
}VideoEncodeFormat;

/*This is the head of encoded video data, should change later*/
typedef struct
{
	uint8_t	frame_type;		//used for video , iframe, pframe or others (defined by FRAME_TYPE enum)
	//u_int8 coding_method;		// defined by VIDEO_CODING_METHOD enum
	uint8_t	index;			//index number of this frame within the specified time (in seconds)
	uint16_t time_offset;		//offset of the second in milliseconds
	int		position;		//the beginning position of data, usually the offset
	bool	watermark_corrupted;	// Lev: this flag will be set to true in case the crc value for the frame doesn't match
	int		size;			//size of data
}EncodedDataInfo;

typedef struct  __attribute__((packed))
{
	VideoEncodeFormat	ve_format;	//encode data format
	uint16_t			channel_id;
	bool				nopost;		//if true, this data should not be posted after decoding.
	uint8_t				record_type;	// Toan adds Dec 15 2005
	uint32_t				time;		//time when this data is generated from video source( including capture card and ip camera)
	int					array_size;	//size of array_item
	EncodedDataInfo		array_item[1];	//array of EncodedDataInfo
}VideoEncodeDataHeader;


typedef  struct __attribute__((packed))
{
    char  server[STR_LEN_64];   //server ip if necessary
    int   user_id;     //user id
    uint16_t  type;      //type of message
    uint8_t  mode;      //defined by SEARCH_MODE enum
    int   channel_id;     //used in smartsearch
    uint64_t  channel_mask;    //channel mask
    uint64_t  audio_mask;     //channel mask selecte  d for audio playback
    //currently only one audio channel is supported
    uint64_t  server_channel_mask;  //server channel mask
    uint8_t  server_channel_id[MAX_CHANNEL]; //stores its corresponding server channel
    uint8_t  frame_rate;     //frame rate used in play
    uint16_t  frame_delay;    //frame delay in milliseconds
    uint8_t  frames_to_skip;    //how many frames to skip for every channel
    bool  only_iframe;    //if true - only deal with i frame
    //if false - deal with all kinds of frame
    bool  real_time;    // Lev: tells if we should playback at the true recording speed
    // (in this case we will ignore frame_delay value)
    uint8_t  precise_position;   //1 - precise; 0 - imprecise
    long  begin_position;    //begin or current position
    long  end_position;    //end position
    uint8_t  index;      //index number of this frame within the specified time(in second)
    uint16_t  millisecond_offset;   //millisecond offset of this frame within the specified time(in seconds)
    long  reserve;
    bool  forceToStartSmartSearch; // Toan adds for smart Search 122706, when server need to close remote smartSearch
    //bool  onlyMainStream;    // Thang Do, adds for dual stream, June 14, 2012
    uint64_t  onlyMainStreamMask;
    
}SearchCommonMsg;


typedef enum
{
    SEARCH_M_UNKNOWN  = 0,
    SEARCH_M_ALL   = 1 << 0,
    SEARCH_M_ONE   = 1 << 1,
    SEARCH_M_MIX   = 1 << 2,
    SEARCH_M_PAC_HISTORY = 1 << 3,
    SEARCH_M_DUMP_PREVIEW = 1 << 4,
    
} SEARCH_MODE;

typedef enum
{
    EMPTY  = 0,
    CONTINUOUS = 1 << 0,
    SENSOR  = 1 << 1,
    MOTION  = 1 << 2,
    PREALARM = 1 << 3,
    WATERMARK = 1 << 4,
    AUDIO  = 1 << 5,
    VIDEOLOGIX = 1 << 6, // Hung Mai - VL-Recording Project - added - 071709
    // Thang Do adds for Emergency frame rate 050807 - start
    EMERGENCY_S = CONTINUOUS | SENSOR,
    EMERGENCY_M = CONTINUOUS | MOTION,
    // Thang Do adds for Emergency frame rate 050807 - end
    EMERGENCY_V = CONTINUOUS | VIDEOLOGIX, // Hung Mai - VL-Recording Project - added - 071709
    
}RECORD_TYPE;

typedef struct __attribute__((packed)) TimeInterval
{
    int  id;  //id of sensor or motion in case of searching sensor or motion.
    uint32_t time;  //active time of sensor or motion
    uint32_t begin;  //begin time in seconds
    uint32_t end;  //end time in seconds
    int  type;  //RecordType
}TimeInterval;

typedef struct __attribute__((packed)) DayInterval
{
    uint32_t time;  // time which represents the begining of the day in UTC seconds
    int  size;
    TimeInterval ti[1];
}DayInterval;

typedef struct __attribute__((packed)) AllDayInterval
{
    uint64_t  channel_mask;
    SEARCH_MODE mode;
    int32_t di[MAX_CHANNEL]; // should cast to (DayInterval*)
}AllDayInterval;

typedef struct __attribute__((packed)) {
    uint8_t  version; //version
    uint8_t  flag;  //bit0 : 1 iframe
    //   0 pframe
    //bit1 : 1 end
    //   0 not end
    //bit2&3: 0 null
    //   1 video
    //   2 audio
    //   3 video&audio
    //bit 4&5: 0 live encoded
    //   1 search encoded
    //   2 search group
    //   3 preserve
    //other bits preserve now
    uint8_t  xor;
    uint64_t  channel; //channel No. or channel mask
    //JK Bin Add Feb. 28, 2006 _Begin
    uint32_t  framelength;//frame length
    uint32_t  offset; // offset in this frame, starts from 0 to frame length - 1
    uint8_t  coding_method; // encode/decode method is IP mode or PP mode, defined by VIDEO_CODING_METHOD enum
    //JK Bin Add Feb. 28, 2006 _End
    uint32_t  length;  //length of this packet
    uint8_t  psequence; //packet no.
    uint16_t  fSequence; //frame no.
    uint16_t  iframe;  //the iframe no. that it depends
    uint32_t  time;  //the time of this frame
    uint16_t  audio_position;   //start position of video, the offset from beginning, if 0 means no audio data.
    uint16_t  video_position;   //ditto
    
}I3_STREAM_PHeader;


// -----------------------------------------------------------------------------------------------------
// End Region

#endif	//__MOBILE_BASE__
