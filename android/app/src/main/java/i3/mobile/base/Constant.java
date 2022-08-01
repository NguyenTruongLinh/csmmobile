package i3.mobile.base;

import android.os.Environment;

public class Constant 
{

	//********************************FOR GENERAL -- BEGIN**********************************************//
	public static final String MAIN_PORT_DEFAULT = "13225";
	public static final String VIDEO_PORT_DEFAULT = "13226";
	public static final String SERVER_ID_DEFAULT = "100-001";
	
	public static final int MAX_VIDEO_INPUT					= 128;//Number of video inputs of 1 server
	public static int MAX_CHANNEL							= 16;
	public static final int MAX_VIRTUAL_CHANNEL					= 256; //Max mobile channels increase from 64 to 256
	public static final int MAX_SERVER_CHANNEL					= 64; //Number of channels of 1 server
	
	public static final int MAX_SERVER_CONNECTION			= 5;
	public static int[] serverVideoPort = new int[MAX_SERVER_CONNECTION];
	
	public static final int numConnectionDropList = 2;
	public static final int numLanguageDropList = 2;
	public static final int numRatioViewDropList = 2;
	public static final int numZoomModeDropList = 2;
	public static final int numLayoutDropList = 9;
	public static final int numFramePerSecondDropList = 30;
	
	public static final int connectionTmeout = 30000;  //in mili-seconds (30s)
	
	public static final int swipe_Min_Distance = 150;
	public static final int swipe_Min_Velocity = 1000;
	
	public static final int areaUnit = 120*90;
	
	public static final float factorScaleUnit	= 0.2f;
	public static final int maxResolutionPixelRequestZoom	= 2000000;	//2 MPixels

	public static final byte[] aesKey = {	(byte)0x4e, (byte)0xd5, (byte)0xf8, (byte)0x38,
											(byte)0xb9, (byte)0x34, (byte)0x8b, (byte)0x46,
											(byte)0x5a, (byte)0x05, (byte)0xce, (byte)0x7b,
											(byte)0x8f, (byte)0x39, (byte)0xdc, (byte)0x87
										};
	// public static final byte[] aesKey = {	(byte)0x87, (byte)0xdc, (byte)0x39, (byte)0x8f,
	// 										(byte)0x7b, (byte)0xce, (byte)0x05, (byte)0x5a,
	// 										(byte)0x46, (byte)0x8b, (byte)0x34, (byte)0xb9,
	// 										(byte)0x38, (byte)0xf8, (byte)0xd5, (byte)0x4e
	// 									};
	
	public static final int FIRST_VERSION_VALUE			= 1000;
	
	public static float topBottomLayoutPercentH = 0.1064f;
	public static float topBottomLayoutPercentV = 0.08f;
	public static final int BTN_TEXT_SIZE		= 15;
	//********************************FOR GENERAL -- END**********************************************//

	//_________________________________________________________________________________________________________//
	
	public static final int socketReadTimeOut = 100;//120000; //From 60000
	public static final int timeoutWatchDog   = 150000; //From 90000
	
	//********************************FOR CONFIG FILE -- BEGIN**********************************************//
	public static final int CONFIG_FILE_HEADER_SIZE			= 64;		// version,......
	public static final int unusedHeader = CONFIG_FILE_HEADER_SIZE - 4;  
	public static final String DirectoryOfData = Environment.getExternalStorageDirectory().getPath() + "/i3Data/";
	public static final String DirectoryOfConfigFiles = Environment.getExternalStorageDirectory().getPath() + "/i3config/";
	public static final String DirectoryOfImages = DirectoryOfData + "images/";
	public static final String DirectoryOfTempImages = DirectoryOfData + "TempImages/";
	public static final String FileNameLog = "exception_log.txt";
	public static final String FileNameKeepAlive = "keep_alive.txt";
	public static final String FileNameServerList = "serverList.cfg";
	public static final String FileNameServerGroupList = "serversGroupList.cfg";
	public static final String FileNameFavouriteFolderList = "favouriteFolderList.cfg";
	public static final String FileNameGlobalSettings = "global_settings.cfg";
	public static final String FileNameLocalSettings = "local_settings.cfg";
	public static final String FileNameChannelMapping = "channelMapping.cfg";
	public static final String FileNameAlarmSettings = "AlarmSetting.cfg";
	public static final String FileNameAccount = "account.cfg";
	public  static  final  String FFMPEG_EVENT = "FFMPegEvent";
	public static final long maxSizeLogFile = 1024*1024;
	//********************************FOR CONFIG FILE -- END*********************************************//
	
	public static final int MOBILE_VIDEO_COMPRESS_QUALITY = 100; // for snapshot
	//_________________________________________________________________________________________________________//
	
	//********************************FOR ENUM -- BEGIN**********************************************//
	public class EnumIntentCode 
	{
		//Request code
		public static final char WELCOME_SCREEN							= 0;
		public static final char ALARM_SETTING_SCREEN					= 1;
		public static final char CHANNEL_MAPPING_SCREEN					= 2;
		public static final char HOME_SCREEN							= 3;
		public static final char EDIT_SERVER_SCREEN						= 4;
		public static final char LIVE_VIEW_SCREEN						= 5;
		public static final char SETTING_SCREEN							= 6;
		public static final char VIEW_ALARM_LIST_SCREEN					= 7;
		public static final char DISPLAY_IMAGE_SCREEN					= 8;
		public static final char SEND_SNAPSHOT_EMAIL					= 9;
		//BBB - begin
		public static final char SEARCH_MODE							= 10;
		public static final char SEARCH_CALENDAR						= 11;
		public static final char SEARCH_SELECTCHANNEL_MODE			    = 12;
		public static final char SEARCH_PLAYBACK					    = 13;
		public static final char REPORT_MODE							= 14;
		public static final char SEARCH_SELECT_DATA						= 15;
		public static final char SEARCH_DATE_TIME_TIME_INTERVAL	 		= 16;
		public static final char SEARCH_SELECT_SERVER			        = 17;
		public static final char SEARCH_SELECT_SNAPSHOT	        		= 18;
		public static final char CAMERA_STREAMING_HOME					= 19;
		public static final char CAMERA_STREAMING_SETTINGS				= 20;
		public static final char ABOUT_DIALOG							= 21;
		//BBB - end
		
		//Result Code
		public static final char EXIT_APP								= 1000;
		public static final char LIVE_VIEW_SLIDE_RIGHT_TO_LFET			= 1001;
		public static final char LIVE_VIEW_SLIDE_LEFT_TO_RIGHT			= 1002;
		public static final char LIVE_VIEW_SLIDE_BOTTOM_TO_UP			= 1003;
		public static final char LIVE_VIEW_SLIDE_UP_TO_BOTTOM			= 1004;
		public static final char DISCONNECT								= 1005;
		public static final char LET_GO_TO_LIVE_MODE					= 1006;
		public static final char LET_GO_TO_SETTINGS_MODE				= 1007;
		public static final char LET_GO_TO_VIEW_ALARM_LIST_MODE			= 1008;
		public static final char LET_GO_TO_CHANNEL_MAPPING_MODE			= 1009;
		public static final char LET_GO_TO_SEARCH_MODE					= 1010;  
		public static final char LET_GO_TO_REPORT_MODE					= 1011;  
		public static final char RESULT_EXIT_CURRENT_ACTIVITY 			= 1012; 
		public static final char RESULT_BACK							= 1013;
		public static final char RESULT_SWITCH_MODE						= 1014;	
		public static final char RESULT_SNAPSHOT_DIALOG 				= 1015;
		public static final char RESULT_NEED_RESTART					= 1016;
		public static final char RESULT_DONT_NEED_RESTART					= 1017;
	}
	
	public class EnumCmdMsg 
	{
		public static final char MOBILE_MSG_GROUP_COMMUNICATION_BEGIN		= 0;
		public static final char MOBILE_MSG_LOGIN							= 1;
		public static final char MOBILE_MSG_DISCONNECT						= 2;
		public static final char MOBILE_MSG_EXIT							= 3;
		public static final char MOBILE_MSG_VIDEO_SOCKET_ERROR				= 4;
		public static final char MOBILE_MSG_KEEP_ALIVE						= 5;
		public static final char MOBILE_MSG_TEST							= 6;
		public static final char MOBILE_MSG_MINIMIZE						= 7; 
		public static final char MOBILE_MSG_SNAPSHOT						= 8; 
		public static final char MOBILE_MSG_CANCEL_SNAPSHOT					= 9; 
		public static final char MOBILE_MSG_GROUP_COMMUNICATION_END			= 499;

		public static final char MOBILE_MSG_GROUP_VIDEO_REQUEST_BEGIN 		= 500;
		public static final char MOBILE_MSG_START_SEND_VIDEO				= 501;
		public static final char MOBILE_MSG_STOP_SEND_VIDEO					= 502;
		public static final char MOBILE_MSG_PAUSE_SEND_VIDEO 				= 503;
		public static final char MOBILE_MSG_RESUME_SEND_VIDEO				= 504;
		public static final char MOBILE_MSG_SEND_NEXT_FRAME					= 505;
		public static final char MOBILE_MSG_SEND_NEXT_ENCODE_FRAME 			= 506;
		public static final char MOBILE_MSG_GROUP_VIDEO_REQUEST_END 		= 999;

		public static final char MOBILE_MSG_GROUP_ALARM_BEGIN				= 1000;
		public static final char MOBILE_MSG_NEW_ALARM_DETECTED				= 1001;
		public static final char MOBILE_MSG_SEND_ALARM_LIST					= 1002;
		public static final char MOBILE_MSG_VIEW_ALARM_IMAGES				= 1003;
		public static final char MOBILE_MSG_NEXT_ALARM_IMAGE				= 1004;
		public static final char MOBILE_MSG_NEXT_ALARM_LIST					= 1005;
		public static final char MOBILE_MSG_PREVIOUS_ALARM_LIST				= 1006;
		public static final char MOBILE_MSG_EXIT_ALARM_LIST					= 1007;
		public static final char MOBILE_MSG_GROUP_ALARM_END					= 1499;

		public static final char MOBILE_MSG_GROUP_PTZ_CONTROL_BEGIN			= 1500;
		public static final char MOBILE_MSG_PTZ_CONTROL_LEFT				= 1501;
		public static final char MOBILE_MSG_PTZ_CONTROL_RIGHT				= 1502;
		public static final char MOBILE_MSG_PTZ_CONTROL_UP					= 1503;
		public static final char MOBILE_MSG_PTZ_CONTROL_DOWN				= 1504;
		public static final char MOBILE_MSG_PTZ_CONTROL_ZOOM_IN				= 1505;
		public static final char MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT			= 1506;
		public static final char MOBILE_MSG_PTZ_CONTROL_LEFT_STOP			= 1507;
		public static final char MOBILE_MSG_PTZ_CONTROL_RIGHT_STOP			= 1508;
		public static final char MOBILE_MSG_PTZ_CONTROL_UP_STOP				= 1509;
		public static final char MOBILE_MSG_PTZ_CONTROL_DOWN_STOP			= 1510;
		public static final char MOBILE_MSG_PTZ_CONTROL_ZOOM_IN_STOP		= 1511;
		public static final char MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT_STOP		= 1512;
		public static final char MOBILE_MSG_PTZ_CONTROL_LEFTUP				= 1513;
		public static final char MOBILE_MSG_PTZ_CONTROL_RIGHTUP				= 1514;
		public static final char MOBILE_MSG_PTZ_CONTROL_LEFTDOWN			= 1515;
		public static final char MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN			= 1516;
		public static final char MOBILE_MSG_PTZ_CONTROL_LEFTUP_STOP			= 1517;
		public static final char MOBILE_MSG_PTZ_CONTROL_RIGHTUP_STOP		= 1518;
		public static final char MOBILE_MSG_PTZ_CONTROL_LEFTDOWN_STOP		= 1519;
		public static final char MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN_STOP		= 1520;
		public static final char MOBILE_MSG_GROUP_PTZ_CONTROL_END	 		= 1999;
		
		public static final char MOBILE_MSG_GROUP_SETTING_BEGIN				= 2000;
		public static final char MOBILE_MSG_SEND_CAMERA_LIST				= 2001;
		public static final char MOBILE_MSG_MOBILE_SEND_SETTINGS			= 2002; 
		public static final char MOBILE_MSG_ADD_IP_CAMERAS					= 2003;
		public static final char MOBILE_MSG_REMOVE_IP_CAMERAS				= 2004;
		public static final char MOBILE_MSG_SERVER_CHANGED_PORTS			= 2005;
		public static final char MOBILE_MSG_SERVER_SEND_SETTINGS			= 2006;
		public static final char MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG		= 2007;
		public static final char MOBILE_MSG_SERVER_CHANGED_CURRENT_USER		= 2008;
		public static final char MOBILE_MSG_SERVER_CHANGED_SERVER_INFO		= 2009;
		public static final char MOBILE_MSG_GROUP_SETTING_END				= 2099;
		
		//BBB - begin
		public static final char MOBILE_MSG_SEARCH_BEGIN 					= 2100;
		public static final char MOBILE_MSG_SEARCH_UPDATE_SCREEN			= 2101;
		public static final char MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL    = 2102;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL   = 2103;
		public static final char MOBILE_MSG_SEARCH_REQUEST_SETPOS			= 2104;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_SETPOS			= 2105;
		public static final char MOBILE_MSG_SEARCH_REQUEST_PLAY_FW			= 2106;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW			= 2107;
		public static final char MOBILE_MSG_SEARCH_REQUEST_PLAY_BW			= 2108;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_PLAY_BW			= 2109;
		public static final char MOBILE_MSG_SEARCH_REQUEST_STOP				= 2110;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_STOP			= 2111;
		public static final char MOBILE_MSG_SEARCH_REQUEST_STEP_FW  		= 2112;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_STEP_FW		 	= 2113;
		public static final char MOBILE_MSG_SEARCH_REQUEST_STEP_BW 			= 2114;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_STEP_BW 		= 2115;
		public static final char MOBILE_MSG_SEARCH_RAW_VIDEO 				= 2116;
		public static final char MOBILE_MSG_ENCODED_VIDEO 					= 2117;
		public static final char MOBILE_MSG_ENCODED_VIDEO_GROUP 			= 2118;
		public static final char MOBILE_MSG_SEARCH_SESSION_DESTROY			= 2119;
		public static final char MOBILE_MSG_SEARCH_SESSION_DESTROY_ONE		= 2120;
		public static final char MOBILE_MSG_SEARCH_REQUEST_DAY_LIST         = 2121;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST  		= 2122;
		public static final char MOBILE_MSG_SEARCH_REQUEST_SNAPSHOT 		= 2123;
		public static final char MOBILE_MSG_SEARCH_RESPONSE_SNAPSHOT 		= 2124;
		public static final char MOBILE_MSG_SERVER_SEND_TIMEZONE 			= 2125;
		public static final char MOBILE_MSG_SERVER_RECORDING_ONLY_CANT_PLAY_VIDEO = 2126;
		public static final char MOBILE_MSG_SEARCH_END 						= 2220;
		//BBB - end
		public static final char MOBILE_MSG_MAX_VALUE_FOR_MOBILE			= 2500;
	}

	public class EnumAlarmEventType 
	{
		public static final char MOBILE_MSG_SENSOR_TRIGGERED 				= 0;
		public static final char MOBILE_MSG_STOP_RECORDING					= 1;
		public static final char MOBILE_MSG_VIDEO_LOSS						= 2;
		public static final char MOBILE_MSG_MOTION_DETECTION				= 3;
		public static final char MOBILE_MSG_VIDEO_LOSS_ALL					= 4;
		//only added more event constants when you really want to use it
		
		public static final char MOBILE_MSG_MAX_EVENT_ENUM					= 65535;
	}
	public static final int numOfEventTypesSupport					= 4;
	public class EnumStatusMsg 
	{
		public static final byte MOBILE_MSG_SUCCESS = -128;
		public static final byte MOBILE_MSG_FAIL = -127;
	}
	
	public class EnumStatusViewAlarmList
	{
		public static final byte HAVE_ONLY_ONE_PAGE		= -1;
		public static final byte IS_IN_FRIST_PAGE 		=  0;
		public static final byte IS_IN_MIDDLE_PAGE 		=  1;
		public static final byte IS_IN_LAST_PAGE 		=  2;
	}
		
	public class EnumThread
	{
		public static final byte RECEIVE_MSG_THREAD 					= 0;
		public static final byte RECEIVE_AND_PROCESS_VIDEO_THREAD		= 1;
		
		public static final byte NUM_OF_THREAD							= 2;
	}
	
	public class EnumLayout
	{
		public static final byte DIVISION_1 	= 0;
		public static final byte DIVISION_4 	= 1;
		public static final byte DIVISION_8 	= 2;
		public static final byte DIVISION_9 	= 3;
		public static final byte DIVISION_16 	= 4;
		
		public static final byte DIVISION_25 	= 5;
		public static final byte DIVISION_36 	= 6;
		public static final byte DIVISION_49 	= 7;
		public static final byte DIVISION_64 	= 8;
	}
	public static byte NUM_OF_LAYOUT 	= 5;  //default
	public static byte NUM_OF_LAYOUT_REAL = 5; //For version 1.1
	
	public class EnumSettingType
	{
		public static final char SYSTEM_INFO 				= 0;
		public static final char VIDEO_QUALITY 				= 1;
		public static final char FRAME_PER_SECOND 			= 2;
		public static final char LAYOUT 					= 3;
		public static final char CHANNEL_MAPPING 			= 4;
		public static final char ALARM_SETTING 				= 5;
		public static final char SCREEN_SIZE 				= 6;
		public static final char RATIO_VIEW			 		= 7;
		public static final char SOURCE_RESQUEST_MASK 		= 8;
		public static final char RESOLUTION_REQUEST 		= 9;
		public static final char IS_FULL_SCREEN		 		= 10;
		public static final char DURATION_VIEW_ALARM_LIST 	= 11;
		public static final char FILTER_ALARM_BY		 	= 12;
		//BBB - begin
		public static final char MAIN_SUB_REQUEST			= 13;
		public static final char SEARCH_SCREEN_SIZE			= 14;
		public static final char NUM_OF_SETTING 			= 15;
		//BBB - end
	}
	
	public class EnumGeneric
	{
		//**** for connection, BEGIN**//////////
		public static final char MOBILE_LOGIN_MESSAGE_UNKNOWN				= 0;
		public static final char MOBILE_LOGIN_MESSAGE_SUCCEEDED				= 1;
		public static final char SVR_DONT_ACCPET_ERR 						= 2;
		public static final char MOBILE_LOGIN_MESSAGE_WRONG_USER_PASS		= 3;
		public static final char MOBILE_LOGIN_MESSAGE_WRONG_SERVERID		= 4;
		public static final char MOBILE_LOGIN_MESSAGE_VIDEO_PORT_ERROR		= 5;
		public static final char WIFI_NOT_SUPPORTED 						= 6;
		public static final char WIFI_NOT_TURN_ON							= 7;
		public static final char MOBILE_NETWORK_NOT_TURN_ON 				= 8;
		//**** for connection, END**//////////
		
		///****for LabelField, BEGIN***/////////
		public static final char SERVER_LIST 	= 100;
		public static final char ALARM_LIST 	= 101;
		///****for LabelField, END***/////////
		
		///****for Sort alarm events, BEGIN***/////////
		public static final char ALARM_EVENT_SORT_BY_TIME = 200;
		public static final char ALARM_EVENT_SORT_BY_TYPE = 201;
		///****for Sort alarm events, END***/////////
	}
	/*public class EnumMobileOSType 
	{
		public static final char RIM_BLACKBERRY 			= 0;
		public static final char GOOGLE_ANDROID				= 1;
		public static final char APPLE_IPHONE			 	= 2;
		public static final char MICROSOFT_WINDOWS_MOBILE 	= 3;
		public static final char NOKIA_S60_3RD_EDITION 		= 4;
	}*/
	
	public class EnumMobileNetworkType 
	{
		public static final byte UNKNOWN_NETWORK_TYPE	= 0;
		public static final byte WIFI 					= 1;
		public static final byte MOBILE_NETWORK			= 2;
		
		public static final byte _3G					= 3;
		public static final byte CDMA	 				= 4;
		public static final byte GPRS 					= 5; 
	}
	
	public class EnumLanguage
	{
		public static final char ENGLISH	= 0;
		public static final char FRENCH 	= 1;
	}
	
	public class EnumRatioview
	{
		public static final byte STRETCH			= 0;
		public static final byte KEEP_ORIGIN_RATIO	= 1;
	}
	
	public class EnumZoomMode
	{
		public static final byte DIGITAL_ZOOM		= 0;
		public static final byte OPTICAL_ZOOM		= 1;
	}
	
	public class EnumImageCodecType
	{
		public static final int JPEG			= 0;
		public static final int BITMAP 		= 1;
		public static final int PNG			= 2;
		public static final int MOBILE_ENCODE 	= 3; //Bao add for ffmpeg
		public static final int OTHER 		= 65000;
	}
	
	public class EnumServerVersion
	{
		public static final int VERSION_1000 			= 0;
		public static final int VERSION_1070			= 1;
		public static final int VERSION_1103			= 2;
		public static final int VERSION_1270			= 3;
		public static final int VERSION_1300			= 4;
		public static final int VERSION_1400			= 5;
		public static final int VERSION_1500			= 6;
		public static final int VERSION_1511			= 7;
		public static final int VERSION_1512			= 8;
		public static final int VERSION_1520			= 9;
		public static final int VERSION_1530			= 10;
		public static final int VERSION_1531			= 11;
		public static final int VERSION_1600			= 12;
		// Thang Do, adds for Ax32 + Ax41 + Ax51, Jun 25, 2010, begin
		public static final int VERSION_1601			= 13;
		public static final int VERSION_1610			= 14;
		// Thang Do, adds for Ax32 + Ax41 + Ax51, Jun 25, 2010, end
		public static final int VERSION_1820			= 15;	//Quan - Compatible for Pro and Pro VA CMS, Jun 22 2010
		public static final int VERSION_2000			= 16;
		public static final int VERSION_2100			= 17;	//ND Nghia, adds for compatible 2.1.0, May 06 2011
		public static final int VERSION_2200			= 18;	//H Nghia, added for compatible 2.2, June 27, 2011
		public static final int VERSION_2300			= 19;
		public static final int VERSION_3000			= 20;
		public static final int VERSION_3100			= 21;
		public static final int VERSION_3200			= 22;
		public static final int VERSION_3210			= 23;
		public static final int VERSION_3300			= 24;
		public static final int VERSION_1500_CMS = VERSION_1500 + 1000;
		public static final int VERSION_1512_CMS = VERSION_1512 + 1000;
		public static final int VERSION_1520_CMS = VERSION_1520 + 1000;

		public static final int VERSION_UNKNOWN_HIGHER = VERSION_3300 + 1; 
		public static final int VERSION_SUPPORT_SEARCHING = VERSION_3300; 
	}

	public class EnumMobileVersion
	{
		public static final int MOBILE_VERSION_1000 = 0;
		public static final int MOBILE_VERSION_1100 = 1;
		public static final int MOBILE_VERSION_1110 = 2;
		public static final int MOBILE_VERSION_2000 = 3;
		public static final int MOBILE_VERSION_CURRENT = MOBILE_VERSION_2000;

		public static final int MOBILE_VERSION_UNKNOWN_HIGHER = MOBILE_VERSION_CURRENT + 1;
	} 
	
	public class EnumChannelMappingMode
	{
		public static final byte LIST 			= 0;
		public static final byte THUMBNAIL		= 1;
	} 
	
	public static final int MAX_CHANNELS_IN_FAVOURITE_FOLDER			= 25;
	public static final int MAX_SERVERS_IN_FAVOURITE_FOLDER				= 5;
	public class EnumAddChannelToFavouriteErr
	{
		public static final byte SUCCESSFUL 			= 0;
		public static final byte MAX_SERVER_ADDED		= 1;
		public static final byte MAX_CHANNEL_ADDED		= 2;
		public static final byte CHANNEL_EXISTED		= 4;
	} 
	//********************************FOR ENUM -- END**********************************************//
	
	//Bao add for update new GUI - Begin
	public class EnumBaseScreen
	{
		public static final int RESHEIGHT_BASE = 1024;
		public static final int RESWIDTH_BASE = 600;
		public static final int ITEMSIZE_BASE= 45;
		public static final int TEXTSIZE_BASE = 25;
		public static final int ITEMBTNINFO_BASE = 30;
		//Bao add for changed GUI - Begin
		 public final static float ratioBtnIconWidth  = 1.4f/3f;
		 public final static float ratioBtnIconHeight = 0.7f;
		 public final static int buttonTextSize = 20; //Bao add April 13 2013
		//Bao add for changed GUI - End
	    public static final int TEXTSIZE_ABOVE_LARGE = 24;
	    public static final int TEXTSIZE_ABOVE_SMALL = 20;
	    
	    public static final int TEXTSIZE_HEADER = 20; //SP
	     
	}
	//Bao add for update new GUI - End
	//BBB - Begin
	public class EnumMainSub
	{
		public static final int MOBILE_REQUEST_SUB  = 0;
		public static final int MOBILE_REQUEST_MAIN = 1;
	} 
	//BBB - End
	
	//BBB- search - begin
	public class SearchId
	{
		public static final int SEARCH_PLAY_BACK_CAMERALIST = 1;
		public static final int SEARCH_PLAY_BACK_CAPTURE    = 2;
		public static final int SEARCH_PLAY_DATE_TIME       = 3;
	}
	//BBB- search - end
	
	public static final String XML_SERVER_ENCODEDING = "ISO-8859-1";
	public static final String XML_LOCAL_ENCODEDING = "UTF-16";
	public final class EnumBufferState
	{
		public static final byte COMMAND_GET = 0;
		public static final byte COMMAND_HEADER = 1;
		public static final byte COMMAND_DATA = 2;
	}
	public  final  class EnumPlaybackSatus
	{
		public final  static  byte VIDEO_STOP = 0;
		public final  static  byte VIDEO_PLAY = 1;
		public final  static  byte VIDEO_PAUSE = 2;
	}
	public  final  class EnumVideoPlaybackSatus
	{
		public static final int  MOBILE_JS_FRAME_DATA 								= 0;
		public final  static int MOBILE_CONNECTTING										= 1;
		public final  static int MOBILE_CONNECTTED 										= 2;
		public static final int MOBILE_LOGIN_MESSAGE									= 3;
		public static final int MOBILE_LOGIN_FAILED										= 4;
		public static final int MOBILE_LOGIN_SUCCCESS									= 5;
		public static final int SVR_REJECT_ACCEPT											= 6;
		public static final int MOBILE_LOGIN_MESSAGE_WRONG_SERVERID		= 7;
		public static final int MOBILE_VIDEO_PORT_ERROR		= 8;
		public static final int MOBILE_CANNOT_CONNECT_SERVER		= 9;
		public static final int MOBILE_ORIENTATION		= 10;
		public static final int MOBILE_VIEW_CLICK		= 11;
		public static final int MOBILE_SEARCH_NO_DATA		= 12;
		public static final int MOBILE_SEARCH_FRAME_TIME		= 13;
		public static final int MOBILE_SERVER_CHANGED_CURRENT_USER		= 14;
		public static final int MOBILE_SERVER_CHANGED_SERVER_INFO		= 15;
		public static final int MOBILE_SERVER_CHANGED_PORTS		= 16;
		public static final int MOBILE_SERVER_RECORDING_ONLY		= 17;
		public static final int MOBILE_SERVER_CHANNEL_DISABLE		= 18;
		public static final int MOBILE_PERMISSION_CHANNEL_DISABLE		= 19;
		public static final int  MOBILE_RESPONSE_DAYLIST = 20;
		public static final int  MOBILE_RESPONSE_TIMEINTERVAL = 21;
		public static final int  MOBILE_RESPONSE_DAYLIGHT = 22;
		public static final int  MOBILE_RESPONSE_RULES_DST = 23;
		public static final int  MOBILE_UNKNOWN = 24;
		public static final int  MOBILE_SERVER_MESSAGE = 25;
		public static final int  MOBILE_SHOULD_RECONNECT = 26;
		public static final int  MOBILE_SERVER_DISCONNECTED = 27;
		public static final int  MOBILE_RELAY_HANDSHAKE_FAILED = 28;
		public static final int  MOBILE_RELAY_DISCONNECTED = 29;
		public static final int  MOBILE_RELAY_UPDATE_DATA_USAGE = 30;

		public static final int MOBILE_FRAME_BUFFER		= 1000;
		//public static final char WIFI_NOT_SUPPORTED 						= 6;
		//public static final char WIFI_NOT_TURN_ON							= 7;
		//public static final char MOBILE_NETWORK_NOT_TURN_ON 				= 8;

	}
}
