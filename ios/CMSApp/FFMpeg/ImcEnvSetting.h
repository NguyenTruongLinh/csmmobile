//
//  ImcEnvSetting.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/23/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import "Imcbase.h"
#import "MobileBase.h"

@class LinkedList;

@interface MobileSystemInfo : NSObject
//@property (readwrite)	uint16_t    networkType;		//network of mobile
@property (readwrite)	int         deviceID;			//PIN id of mobile
@property (retain)      NSString*   deviceType;         //Type of Mobile
@property (readwrite)	bool        isSimulator;		//This device is a simulator ?
@property (readwrite)	uint16_t    screenWidth;		//Mobile Screen width size
@property (readwrite)	uint16_t    screenHigh;			//Mobile Screen high size
@property (retain)      NSString*   osType;             //Type of Mobile OS
@property (retain)      NSString*   osVersion;			//Version of Mobile OS
@property (readwrite)	uint32_t    memorySize;			//size of mobile memory in KB
@property (readwrite)	uint32_t    processorFre;		//Frequency of mobile processor in MHz

-(id)exportInfoToXmlData;
-(id)exportScreenSizeToXmlData;

@end

@interface AlarmSetting : NSObject

@property (readwrite)   bool        enableAlarm;
@property (readwrite)   bool        fullscreenChannel;
@property (readwrite)   bool        playSound;
@property (retain)      NSString*   soundFilename;



@end

typedef enum{
    SENSOR_ALARM = 0,
    MOTION_ALARM,
    VIDEO_LOSS_ALARM,
    STOP_RECORD_ALARM,
    NUMBER_ALARM,
}ENUM_ALARM;

@interface MobileAlarmSetting : NSObject {
    AlarmSetting* alarmSettings[NUMBER_ALARM];
    uint8_t   volumeLevel;
}
@property (readwrite)    NSNumber* volume;

-(id)exportToXML;
-(void)setAlarmSetting:(NSMutableArray*) alarmArray;
-(void) setVolumeLevel: (NSNumber*)volume;


@end

@interface ImcEnvSetting : NSObject

@property (retain)      MobileSystemInfo* deviceSystemInfo;
@property (retain)      MobileAlarmSetting* deviceAlarmSetting;
@property (retain)      NSMutableArray* connectedServers;
@property (retain)      LinkedList* alarmEventList;
@property (retain)      NSArray* viewsInfo;
@property (readwrite)   int rationView;
@property (readwrite)   int layout;
@property (readwrite)   int fullscreenView;

-(int)convertToNumLayout : (int)_layout;
-(id)exportRationViewToXml;
-(id)exportLayoutToXml;

@end
