//
//  ImcServerSettingAll.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 4/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import "ImcGUIBase.h"

@interface ImcServerSettingAll : NSObject{
    ImcConnectedServer* serverInfo;
    NSInteger* channelMapping;
}

@property (retain) ImcConnectedServer* serverInfo;
@property (retain) NSArray* alarmSettings;
@property (readonly) NSInteger* channelMapping;

- (id)init;
- (id)initWithServerInfo : (ImcConnectedServer*)_serverInfo;

@end
