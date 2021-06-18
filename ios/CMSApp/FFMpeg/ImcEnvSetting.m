//
//  ImcEnvSetting.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/23/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
//#import <SystemConfiguration/SystemConfiguration.h>
#import "ImcEnvSetting.h"
#import "GDataXMLNode.h"
#import "AppDelegate.h"

@implementation AlarmSetting

@synthesize enableAlarm,fullscreenChannel,playSound,soundFilename;

-(id)init
{
    self = [super init];
    if( self )
    {
        enableAlarm = false;
        fullscreenChannel = false;
        playSound = false;
        soundFilename = @"";
    }
    return self;
}
@end

@implementation MobileAlarmSetting
        
-(id)init
{
    self = [super init];
    if( self )
    {
        for (int index = 0; index < NUMBER_ALARM; index++) {
            alarmSettings[index] = [[AlarmSetting alloc] init];

        }
        volumeLevel = 80; 
    }
    return self;
}

-(id)exportToXML
{
    GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"ALARM_SETTING"];
    if( rootNode )
    {
        NSString* value;
        if( alarmSettings[SENSOR_ALARM].enableAlarm )
            value = @"true";
        else
            value = @"false";
        GDataXMLNode* sensor_control = [GDataXMLNode elementWithName:@"sensor_control" stringValue:value];
        
        if( alarmSettings[MOTION_ALARM].enableAlarm )
            value = @"true";
        else
            value = @"false";
        GDataXMLNode* motion = [GDataXMLNode elementWithName:@"motion_detection" stringValue:value];
        
        if( alarmSettings[STOP_RECORD_ALARM].enableAlarm )
            value = @"true";
        else
            value = @"false";
        GDataXMLNode* stop_record = [GDataXMLNode elementWithName:@"stop_recording" stringValue:value];
        
        if( alarmSettings[VIDEO_LOSS_ALARM].enableAlarm )
            value = @"true";
        else
            value = @"false";
        GDataXMLNode* video_loss = [GDataXMLNode elementWithName:@"video_loss" stringValue:value];
        
        [rootNode addAttribute:sensor_control];
        [rootNode addAttribute:motion];
        [rootNode addAttribute:video_loss];
        [rootNode addAttribute:stop_record];
    }
    return rootNode;
}

-(void) setAlarmSetting: (NSMutableArray*) alarmArray
{
    for (int index = 0; index < NUMBER_ALARM; index++) {
        if (index < [alarmArray count]) {
            alarmSettings[index] = (AlarmSetting*) alarmArray[index];
        }

    }
}

-(void) setVolumeLevel: (NSNumber*)volume
{
    volumeLevel = ([volume intValue]);
    self.volume = volume;
    NSLog(@"Volume is %zd",[self.volume intValue]);
}

@end

@implementation MobileSystemInfo

@synthesize deviceID,deviceType,isSimulator,memorySize,osType,osVersion,processorFre,screenHigh,screenWidth;

-(id)init
{
    self = [super init];
    if( self )
    {
        UIDevice* device = [UIDevice currentDevice];
        deviceID = 111;
        isSimulator = false;
        if( [device userInterfaceIdiom] == UIUserInterfaceIdiomPhone )
            deviceType = @"IPHONE MODEL";
        else
            deviceType = @"IPAD MODEL";
        memorySize = 1024; // default is 1Gb
        osType = [device systemName];
        osVersion = [device systemVersion];
        processorFre = 0;
        UIScreen *MainScreen = [UIScreen mainScreen];
        UIScreenMode *ScreenMode = [MainScreen currentMode];
        CGSize Size = [ScreenMode size];
        screenHigh = Size.height;
        screenWidth = Size.width;
    }
    return self;
}

-(id)exportInfoToXmlData
{
    GDataXMLElement* systemInfo = [GDataXMLNode elementWithName:@"MOBILE_SYSTEM_INFO"];
    if( systemInfo )
    {
        GDataXMLElement* deviceIDNode = [GDataXMLNode elementWithName:@"device_id" stringValue:[NSString stringWithFormat:@"%zd",deviceID]];
        GDataXMLElement* deviceTypeNode = [GDataXMLNode elementWithName:@"device_type" stringValue:deviceType];
        GDataXMLElement* networkTypeNode = [GDataXMLNode elementWithName:@"network_type" stringValue:@"0"];
        GDataXMLElement* osTypeNode = [GDataXMLNode elementWithName:@"os_type" stringValue:osType];
        GDataXMLElement* osVersionNode = [GDataXMLNode elementWithName:@"os_version" stringValue:osVersion];
        GDataXMLElement* memorySizeNode = [GDataXMLNode elementWithName:@"memory_size" stringValue:[NSString stringWithFormat:@"%zd",memorySize]];
        GDataXMLElement* processorFreNode = [GDataXMLNode elementWithName:@"processor_prequency" stringValue:[NSString stringWithFormat:@"%zd",processorFre]];
        GDataXMLElement* isSimulatorNode = [GDataXMLNode elementWithName:@"is_simulator" stringValue:(isSimulator ? @"true" : @"false")];
        [systemInfo addAttribute:networkTypeNode];
        [systemInfo addAttribute:deviceIDNode];
        [systemInfo addAttribute:deviceTypeNode];
        [systemInfo addAttribute:osTypeNode];
        [systemInfo addAttribute:osVersionNode];
        [systemInfo addAttribute:memorySizeNode];
        [systemInfo addAttribute:processorFreNode];
        [systemInfo addAttribute:isSimulatorNode];
    }
    return systemInfo;
}

-(id)exportScreenSizeToXmlData
{
    GDataXMLElement* screenSize = [GDataXMLNode elementWithName:@"SCREEN_SIZE"];
    if(screenSize)
    {
        GDataXMLNode* width = [GDataXMLNode elementWithName:@"screen_width" stringValue:[NSString stringWithFormat:@"%zd",screenWidth]];
        GDataXMLNode* height = [GDataXMLNode elementWithName:@"screen_high" stringValue:[NSString stringWithFormat:@"%zd",screenHigh]];
        [screenSize addAttribute:width];
        [screenSize addAttribute:height];
    }
    return screenSize;
}

@end

@implementation ImcEnvSetting

@synthesize alarmEventList,connectedServers,deviceSystemInfo,deviceAlarmSetting,viewsInfo,rationView,layout,fullscreenView;

-(id)init
{
    self = [super init];
    if( self )
    {
        deviceSystemInfo = [[MobileSystemInfo alloc] init];
        deviceAlarmSetting = [[MobileAlarmSetting alloc] init];
        connectedServers = [[NSMutableArray alloc] init];
        rationView = 0;
        layout = DIVISION_16;
    }
    return self;
}

-(int)convertToNumLayout : (int)_layout
{
    switch (_layout) {
        case DIVISION_1:
            return 1;
        case DIVISION_4:
            return 4;
        case DIVISION_8:
            return 8;
        case DIVISION_9:
            return 9;
        case DIVISION_16:
            return 16;
        case DIVISION_25:
            return 25;
        case DIVISION_36:
            return 36;
        case DIVISION_64:
            return 64;
        default:
            break;
    }
    return 16;
}

-(id)exportRationViewToXml
{
    GDataXMLElement* ratioViewNode = [GDataXMLNode elementWithName:@"RATIO_VIEW"];
    if( ratioViewNode )
    {
        GDataXMLNode* attr = [GDataXMLNode elementWithName:@"value" stringValue:[NSString stringWithFormat:@"%zd",rationView]];
        [ratioViewNode addAttribute:attr];
    }
    return ratioViewNode;
}


-(id)exportLayoutToXml
{
    GDataXMLElement* layoutNode = [GDataXMLNode elementWithName:@"LAYOUT"];
    if( layoutNode )
    {
        GDataXMLNode* attr = [GDataXMLNode elementWithName:@"layout" stringValue:[NSString stringWithFormat:@"%zd",[self convertToNumLayout:layout]]];
        GDataXMLNode* large_source = [GDataXMLNode elementWithName:@"large_source_index" stringValue:@"-1"];
        [layoutNode addAttribute:attr];
        [layoutNode addAttribute:large_source];
    }
    return layoutNode;
}

@end
