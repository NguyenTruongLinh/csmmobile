//
//  ImcServerSetting.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/23/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import "AppDelegate.h"
#import "ImcServerSetting.h"
#import "ImcGUIBase.h"
#import "GDataXMLNode.h"

@implementation ChannelSetting

@synthesize videoSourceInput,isLiveViewable,isSearchable,isEnable,channelName,cameraInfo,isPtzEnable,channelID;

-(id)init
{
  self = [super init];
  if( self )
  {
    channelID = -1;
    videoSourceInput = -1;
    isLiveViewable = false;
    isSearchable = false;
    isEnable = false;
    channelName = nil;
    cameraInfo = nil;
    isPtzEnable = true;
  }
  return self;
}

@end

@implementation ImcServerSetting

@synthesize layout,fullscreenChannel,maxChannelSupport,framePerSecond,filterAlarmBy,videoQuality,durationViewAlarmList,numListOfDurationViewAlarmList,displayChannelMask,enableSearchChannelMask,smallDivSize,largeDivSize,needUpdateConfig,needUpdateSetting, timeZone, timeZoneOffset;

-(id)init
{
  self = [super init];
  if( self )
  {
    for (int index = 0; index < MAX_CHANNEL; index++) {
      channelsConfig[index] = [[ChannelSetting alloc] init];
      serverChannelsConfig[index] = [[ChannelSetting alloc] init];
      channelMapping[index] = -1;
      sourceResMask[index] = false;
      requestFrameType[index] = NO;
    }
    fullscreenChannel = -1;
    displayChannelMask = 0;
    enableSearchChannelMask = 0;
    smallDivSize = largeDivSize = screenSize = CGSizeMake(640, 960);
    [self resetSetting];
    needUpdateConfig = FALSE;
    needUpdateSetting = FALSE;
    
    timeZone = nil;
    timeZoneOffset = 0;
  }
  return self;
}

-(void)resetSetting
{
  layout            = DIVISION_4;
  videoQuality      = 80;
  framePerSecond    = 16;
  durationViewAlarmList = 120;
  numListOfDurationViewAlarmList = 5;
  filterAlarmBy     = 0;
  for (int i = 0; i < MAX_CHANNEL; i++) {
    [self resetChannelSetting:(channelsConfig[i])];
    [self resetChannelSetting:(serverChannelsConfig[i])];
  }
  timeZone = nil;
}

-(void)resetChannelSetting:(ChannelSetting*)_setting
{
  _setting.videoSourceInput   = -1;
  _setting.isLiveViewable     = false;
  _setting.isSearchable       = false;
  _setting.isEnable           = false;
  _setting.channelName        = @"";
  _setting.cameraInfo         = @"";
}

-(CGSize)calcChannelRes
{
  float stepWidth = screenSize.width/layout;
  float stepHeight =screenSize.height/layout;
  return CGSizeMake(stepWidth, stepHeight);
}

- (void)updateSettingChannedMask:(SETTING_TYPE)setting :(_Bool)value
{
  assert(setting > 0 && setting < NUM_OF_SETTING);
  settingChangedMask[setting] = value;
}

- (void)resetSettingChangedMask:(_Bool)value
{
  for (int index = 0; index < NUM_OF_SETTING; index++) {
    settingChangedMask[index] = value;
  }
}

-(void)updateChannelMap:(int)channel :(int)value
{
  channelMapping[channel] = value;
}

-(void)updateSourceMap
{
  if( fullscreenChannel >= 0 )
    return;
  for(int source = 0; source < MAX_VIDEOSOURCE; source++ )
    sourceResMask[source] = false;
  for( int channel = 0; channel < MAX_CHANNEL; channel++ )
  {
    if( (displayChannelMask & ((uint64_t)0x01<<channel)) != 0  && channelsConfig[channel].isLiveViewable/* && channelConfig[channel].isEnable*/ )
    {
      sourceResMask[channelsConfig[channel].videoSourceInput] = true;
    }
  }
}

-(id)channelConfigAtIndex:(int)index
{
  assert(index >= 0 && index < MAX_CHANNEL);
  return channelsConfig[index];
}

-(int)viewFromChannelIndex:(int)channel
{
  assert(channel >=0 && channel < MAX_CHANNEL );
  return channelMapping[channel];
}

-(void)updateFullscreenChannel:(int)channel
{
  fullscreenChannel = channel;
  for( int source = 0; source < MAX_VIDEOSOURCE; source++ )
    sourceResMask[source] = false;
  if( fullscreenChannel >= 0 )
    sourceResMask[channelsConfig[fullscreenChannel].videoSourceInput] = true;
}

-(void)updateMainSubRequestForFullScreen: (int)channelIndex
{
  fullscreenChannel = channelIndex;
  
  for( int source = 0; source < MAX_CHANNEL; source++ )
    requestFrameType[source] = FALSE;
  
  if( fullscreenChannel >= 0 && channelsConfig[fullscreenChannel].videoSourceInput - MAX_CHANNEL >= 0 && channelsConfig[fullscreenChannel].videoSourceInput)
    requestFrameType[channelsConfig[fullscreenChannel].videoSourceInput - MAX_CHANNEL] = TRUE;
}

-(void)resetRequestFrameType
{
  for( int source = 0; source < MAX_CHANNEL; source++ )
    requestFrameType[source] = FALSE;
}



-(void)importSettingFromXML:(NSData *)xmlData
{
  //NSLog(@"%@", [[NSString alloc] initWithData:xmlData encoding:NSUTF8StringEncoding]);
  
  [self resetSettingChangedMask:false];
  GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:NULL];
  if( doc )
  {
    NSArray* sysElements = [doc.rootElement elementsForName:@"SystemConfig"];
    for ( GDataXMLElement* sysElement in sysElements )
    {
      GDataXMLNode* node = [sysElement attributeForName:@"max_channel_support"];
      if( node )
      {
        maxChannelSupport = (uint16_t)[[node stringValue] intValue];
      }
      break;
    }
    
    NSArray* mobileComs = [doc.rootElement elementsForName:@"MobileCommunicationSetup"];
    for( GDataXMLElement* mobileCom in mobileComs )
    {
      GDataXMLNode* node = [mobileCom attributeForName:@"keep_event_log"];
      if( node )
      {
        NSString* _value = [node stringValue];
        numListOfDurationViewAlarmList = [_value intValue];
      }
      break;
    }
    
    NSArray* userManagements = [doc.rootElement elementsForName:@"UserManagementSetup"];
    for( GDataXMLElement* userManagement in userManagements )
    {
      GDataXMLNode* node = nil;
      if((node = [userManagement attributeForName:@"channel_enable_mask"]))
      {
        NSString* channel_mask = [node stringValue];
        NSLog(@"channel_mask: %@",channel_mask);
        NSArray* listChannelMask = [channel_mask componentsSeparatedByString:@"_"];
        for( int index = 0; index < listChannelMask.count; index++ )
        {
          if( [((NSString*)[listChannelMask objectAtIndex:index]) intValue] == 1 )
            channelsConfig[index].isLiveViewable = true;
          else
            channelsConfig[index].isLiveViewable = false;
        }
        
      }
      
      if((node = [userManagement attributeForName:@"search_channel_enable_mask"]))
      {
        NSString* search_channel_mask = [node stringValue];
        NSLog(@"search_channel_mask: %@",search_channel_mask);
        NSArray* listSearchChannelMask = [search_channel_mask componentsSeparatedByString:@"_"];
        for(int index = 0; index < listSearchChannelMask.count; index++)
        {
          if( [((NSString*)[listSearchChannelMask objectAtIndex:index]) intValue] == 1 )
          {
            channelsConfig[index].isSearchable = true;
          }
          else
          {
            channelsConfig[index].isSearchable = false;
          }
        }
      }
    }
  }
}

-(NSInteger)importTimeZoneFromXML:(NSData *)xmlData
{
  xmlData = [Global normalizeDataForUtf8Encoding:xmlData];
  GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:NULL];
  
  if(doc)
  {
    NSInteger dayLightBias = [[[doc.rootElement attributeForName:@"DaylightBias"] stringValue] integerValue] * 60;
    NSString* timeZoneStdName = [[doc.rootElement attributeForName:@"StandardName"] stringValue];
    NSString* timeZoneBiasString = [[doc.rootElement attributeForName:@"Bias"] stringValue];
    NSInteger timeZoneBias = [timeZoneBiasString integerValue] * 60;
    NSArray* dayLightSavingInfo = [doc.rootElement elementsForName:@"DaylightDate"];
    
    NSInteger year = 0;
    NSInteger month = -1;
    NSInteger day = -1;
    NSInteger hour = -1;
    NSInteger minutue = -1;
    NSInteger second = -1;
    
    for (GDataXMLElement* element in dayLightSavingInfo) {
      
      year = [[[element attributeForName:@"wYear"] stringValue] integerValue];
      month = [[[element attributeForName:@"wMonth"] stringValue] integerValue];
      day = [[[element attributeForName:@"wDay"] stringValue] integerValue];
      
      hour = [[[element attributeForName:@"wHour"] stringValue] integerValue];
      minutue = [[[element attributeForName:@"wMinute"] stringValue] integerValue];
      second = [[[element attributeForName:@"wSecond"] stringValue] integerValue];
    }
    
    AppDelegate* appDelegate = [UIApplication sharedApplication].delegate;
    NSString* translatedName = [appDelegate translateFromWindowsTimezone:timeZoneStdName];
    timeZone = [NSTimeZone timeZoneWithName:translatedName];
    if(timeZone==nil)
    {
      NSDateComponents* dayLightSavingComponents = [[NSDateComponents alloc] init];
      dayLightSavingComponents.month = month;
      dayLightSavingComponents.year = year;
      dayLightSavingComponents.day = day;
      dayLightSavingComponents.hour = hour;
      dayLightSavingComponents.minute = minutue;
      dayLightSavingComponents.second = second;
      
      NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
      long currentBias = [currentTimeZone secondsFromGMT] * -1;
      
      for (NSString* knownTimeZoneName in [NSTimeZone knownTimeZoneNames]) {
        NSLog(@"%@/n",knownTimeZoneName);
        NSTimeZone* knownTimeZone = [NSTimeZone timeZoneWithName:knownTimeZoneName];
        if (knownTimeZone.secondsFromGMT == timeZoneBias) {
          
          if (knownTimeZone.daylightSavingTimeOffset == [[dayLightSavingComponents date] timeIntervalSinceReferenceDate])
          {
            timeZone = knownTimeZone;
          }
        }
      }
      if (timeZone)
      {
        //NSInteger tmp = timeZone.daylightSavingTimeOffset;
        timeZoneOffset = (timeZoneBias + dayLightBias) - currentBias;
        return 0;
      }
      else
      {
        timeZoneOffset = currentBias - timeZoneBias - currentTimeZone.daylightSavingTimeOffset;
      }
      return (-1);
    }
  }
  
  return 0;
}

-(void)importChannelConfigFromXML:(NSData *)xmlData
{
  xmlData = [Global normalizeDataForUtf8Encoding:xmlData];
  GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:nil];
  if( doc )
  {
    NSArray* channelConfigs = [doc.rootElement elementsForName:@"CHANNEL_CONFIG"];
    for(GDataXMLElement* channelCfg in channelConfigs )
    {
      for( int index = 0; index < maxChannelSupport; index++ )
      {
        NSString* videoInput = [NSString stringWithFormat:@"video_input_%zd",index];
        GDataXMLNode* node = [channelCfg attributeForName:videoInput];
        if( node )
        {
          channelsConfig[index].channelID = index;
          channelsConfig[index].videoSourceInput = [[node stringValue] intValue];
          NSString* channelNameAtrr = [NSString stringWithFormat:@"channel_name_%zd",index];
          channelsConfig[index].channelName = [[channelCfg attributeForName:channelNameAtrr] stringValue];
          if( channelsConfig[index].videoSourceInput != -1 )
          {
            NSString* camInfoAtrr = [NSString stringWithFormat:@"camera_info_%zd",index];
            channelsConfig[index].cameraInfo = [[channelCfg attributeForName:camInfoAtrr] stringValue];
          }
          
          NSString* ptzInfoAttr = [NSString stringWithFormat:@"is_ptz_%zd",index];
          GDataXMLNode* ptzInfo = [channelCfg attributeForName:ptzInfoAttr];
          if( ptzInfo )
          {
            if( [[ptzInfo stringValue] isEqualToString:@"true"] )
              channelsConfig[index].isPtzEnable = true;
            else
              channelsConfig[index].isPtzEnable = false;
          }
        }
      }
      
      GDataXMLNode* node = [channelCfg attributeForName:@"channel_enable_mask"];
      if( node )
      {
        NSString* channel_mask = [node stringValue];
        NSLog(@"channels enable: %@", channel_mask);
        NSArray* listChannelMask = [channel_mask componentsSeparatedByString:@"_"];
        for( int index = 0; index < listChannelMask.count; index++ )
        {
          if( [((NSString*)[listChannelMask objectAtIndex:index]) intValue] == 1 )
            channelsConfig[index].isEnable = true;
          else
            channelsConfig[index].isEnable = false;
        }
      }
      
      
      needUpdateConfig = TRUE;
      
      break;
    }
  }
}

-(id)exportVideoQualitytoXML
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"VIDEO_QUALITY"];
  if( rootNode )
  {
    GDataXMLNode* atrr = [GDataXMLNode elementWithName:@"value" stringValue:[NSString stringWithFormat:@"%zd",videoQuality]];
    [rootNode addAttribute:atrr];
    return rootNode;
  }
  return nil;
}

-(id)exportFPStoXML
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"FRAME_PER_SECOND"];
  if( rootNode )
  {
    GDataXMLNode* atrr = [GDataXMLNode elementWithName:@"value" stringValue:[NSString stringWithFormat:@"%zd",framePerSecond]];
    [rootNode addAttribute:atrr];
    return rootNode;
  }
  return nil;
}

-(id)exportResolutionRequestToXML: (BOOL) isRelay
{
  NSLog(@"0609 exportResolutionRequestToXML isRelay = %d", isRelay);
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"RESOLUTION_REQUEST"];
  if( rootNode )
  {
    if( fullscreenChannel >= 0 )
    {
      int resolutionX = isRelay ? 585 : (int)smallDivSize.width;
      int resolutionY = isRelay ? 329 : (int)smallDivSize.height;
      sourceResMask[fullscreenChannel] = true;
      GDataXMLNode* source = [GDataXMLNode elementWithName:@"source_0" stringValue:[NSString stringWithFormat:@"%zd",channelsConfig[fullscreenChannel].videoSourceInput ]];
      GDataXMLNode* res_X = [GDataXMLNode elementWithName:@"resolutionX_0" stringValue:[NSString stringWithFormat:@"%zd", resolutionX]];
      GDataXMLNode* res_Y = [GDataXMLNode elementWithName:@"resolutionY_0" stringValue:[NSString stringWithFormat:@"%zd",resolutionY]];
      [rootNode addAttribute:source];
      [rootNode addAttribute:res_X];
      [rootNode addAttribute:res_Y];
      NSLog(@"0609 exportResolutionRequestToXML if resolutionX_0 = %d", resolutionX);
      NSLog(@"0609 exportResolutionRequestToXML if resolutionY_0 = %d", resolutionY);
    }
    else
    {
      CGSize size = smallDivSize;// [self calcChannelRes];
      NSString* strWidth = [NSString stringWithFormat:@"%zd",(int)size.width];
      NSString* strHeight = [NSString stringWithFormat:@"%zd",(int)size.height];
      GDataXMLNode* source = [GDataXMLNode elementWithName:@"source_0" stringValue:@"*"];
      GDataXMLNode* res_X = [GDataXMLNode elementWithName:@"resolutionX_0" stringValue:strWidth];
      GDataXMLNode* res_Y = [GDataXMLNode elementWithName:@"resolutionY_0" stringValue:strHeight];
      [rootNode addAttribute:source];
      [rootNode addAttribute:res_X];
      [rootNode addAttribute:res_Y];
    }
    int count = 0;
    for( int index = 0; index < MAX_VIDEOSOURCE; index++ )
      if( sourceResMask[index] == true )
        count++;
    GDataXMLNode* countAttr = [GDataXMLNode elementWithName:@"count" stringValue:[NSString stringWithFormat:@"%zd",count]];
    [rootNode addAttribute:countAttr];
    
    return rootNode;
  }
  return nil;
}

-(id)exportMainSubStreamRequestToXML
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"MAIN_SUB_REQUEST"];
  if( rootNode )
  {
    uint64_t channelMask = 0;
    char mainSubMask[MAX_CHANNEL];
    for (NSInteger i = 0; i < MAX_CHANNEL; i++) {
      if (requestFrameType[i] == TRUE) {
        mainSubMask[i] = '1';
        channelMask = ((uint64_t)0x01<<i);
      }
      else
      {
        mainSubMask[i] = '0';
      }
    }
    
    GDataXMLNode* atrr = [GDataXMLNode elementWithName:@"mainsub_mask" stringValue:[NSString stringWithFormat:@"%lld",channelMask]];
    [rootNode addAttribute:atrr];
    return rootNode;
  }
  return nil;
}

-(id)exportSearchFrameSizeToXML
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"SEARCH_FRAMESIZE_REQUEST"];
  if( rootNode )
  {
    GDataXMLNode* frame_width = [GDataXMLNode elementWithName:@"search_frame_width" stringValue:[NSString stringWithFormat:@"%f",[UIScreen mainScreen].bounds.size.width]];
    GDataXMLNode* frame_height = [GDataXMLNode elementWithName:@"search_frame_height" stringValue:[NSString stringWithFormat:@"%f",[UIScreen mainScreen].bounds.size.height]];
    [rootNode addAttribute:frame_width];
    [rootNode addAttribute:frame_height];
    
    return rootNode;
    
  }
  return nil;
}

-(id)exportSourceRequestToXML
{
  [self updateSourceMap];
  
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"SOURCE_RESQUEST_MASK"];
  if( rootNode )
  {
    char sourceMask[MAX_VIDEOSOURCE];
    for( int index = 0; index < MAX_VIDEOSOURCE; index++ )
    {
      if( sourceResMask[index] == true )
        sourceMask[index] = '1';
      else
        sourceMask[index] = '0';
    }
    
    
    NSString* sourceMaskString = [[NSString alloc] initWithBytes:sourceMask length:MAX_VIDEOSOURCE encoding:NSUTF8StringEncoding];
    GDataXMLNode* node = [GDataXMLNode elementWithName:@"value" stringValue:sourceMaskString];
    //NSLog(@"%@",sourceMaskString);
    [rootNode addAttribute:node];
  }
  return rootNode;
}

-(id)exportDurationAlarmListToXML
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"DURAION_VIEW_ALARM_LIST"];
  if( rootNode )
  {
    GDataXMLNode* attr = [GDataXMLNode elementWithName:@"value" stringValue:[NSString stringWithFormat:@"%zd",durationViewAlarmList]];
    [rootNode addAttribute:attr];
  }
  return rootNode;
}

-(id)exportFilterAlarmToXML
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"FILTER_ALARM_BY"];
  if( rootNode )
  {
    GDataXMLNode* attr = [GDataXMLNode elementWithName:@"value" stringValue:[NSString stringWithFormat:@"%zd",filterAlarmBy]];
    [rootNode addAttribute:attr];
  }
  return rootNode;
}

-(id)exportFullscreenChannelToXML
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"IS_FULL_SCREEN"];
  if( rootNode )
  {
    NSString* isFullscreen = (fullscreenChannel >= 0) ? @"true" : @"false";
    GDataXMLNode* attr = [GDataXMLNode elementWithName:@"value" stringValue:isFullscreen];
    [rootNode addAttribute:attr];
  }
  return rootNode;
}

-(NSArray*)exportChannelConfig
{
  NSArray* channelConfigs = [NSArray arrayWithObjects:channelsConfig count:MAX_CHANNEL];
  return channelConfigs;
}

-(NSInteger)videoSourceIndexforChannel:(NSInteger)channel
{
  if( channel < 0 || channel >= MAX_CHANNEL )
    return -1;
  return channelsConfig[channel].videoSourceInput;
}

-(void)setChannelMapping:(NSArray *)channel
{
  for (NSInteger index = 0; index < (channel.count <= IMC_MAX_CHANNEL ? channel.count:IMC_MAX_CHANNEL); index++) {
    channelMapping[index] = (int)channel[index];
  }
}

@end

