//
//  ImcServerSettingAll.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 4/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ImcServerSettingAll.h"
//#import "ImcAlarmSetting.h"

@implementation ImcServerSettingAll

@synthesize serverInfo,alarmSettings,channelMapping;

-(void)initAlarmSettings
{
  /*
    ImcAlarmSetting* settings[ALARM_NUM];
    for( int index = 0; index < ALARM_NUM; index++ )
    {
        settings[index] = [[ImcAlarmSetting alloc] init];
    }
    alarmSettings = [NSArray arrayWithObjects:settings count:ALARM_NUM];
   */
}

- (id)init
{
    self = [super init];
    if( self )
    {
        channelMapping = nil;
        serverInfo = [[ImcConnectedServer alloc] init];
        [self initAlarmSettings];
    }
    return  self;
}

- (id)initWithServerInfo : (ImcConnectedServer*)_serverInfo
{
    self = [[ImcServerSettingAll alloc] init];
    if( self )
    {
        [self.serverInfo update:_serverInfo];
        channelMapping = malloc(serverInfo.maxChannelSupport*sizeof(NSInteger));
    }
    return self;
}

-(void)dealloc
{
    if( channelMapping )
        free(channelMapping);
    serverInfo      = nil;
    alarmSettings   = nil;
}

@end
