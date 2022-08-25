//
//  ImcGUIBase.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/4/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ImcGUIBase.h"
#import "GDataXMLNode.h"
#import "ImcServerSetting.h"

@implementation Global

+ (NSString*)settingDirectory
{
  NSArray *myPathList =
  NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,NSUserDomainMask, YES);
  NSString *myPath = [myPathList  objectAtIndex:0];
  return myPath;
}

+ (NSString*)fullPathSettingFilename:(NSString *)filename
{
  NSString* fullFilename = [[Global settingDirectory] stringByAppendingPathComponent:filename];
  return fullFilename;
}

+ (NSString*)fullPathSnapshotFilename:(NSString*)filename
{
  NSString* fullFilename = [[Global settingDirectory] stringByAppendingPathComponent:[NSString stringWithFormat:@"/Snapshot/%@", filename]];
  return fullFilename;
}

+ (NSData*) generateEASKey
{
  uint32_t key1 = 0x38f8d54e;
  uint32_t key2 = 0x468b34b9;
  uint32_t key3 = 0x7bce055a;
  uint32_t key4 = 0x87dc398f;
  NSMutableData* data = [[NSMutableData alloc] initWithBytes:&key1 length:4];
  [data appendBytes:&key2 length:4];
  [data appendBytes:&key3 length:4];
  [data appendBytes:&key4 length:4];
  return data;
}

+ (NSData*) normalizeDataForUtf8Encoding : (NSData*)xmlData
{
  NSString* _string = [[NSString alloc] initWithData:xmlData encoding:NSASCIIStringEncoding];
  if(_string!=nil)
    return [_string dataUsingEncoding:NSUTF8StringEncoding allowLossyConversion:YES];
  return xmlData;
}

@end


@implementation i3SnapshotInfo

@synthesize snapshotImage,snapshotFilename;

-(id)init
{
  self = [super init];
  if( self )
  {
    snapshotImage = nil;
    snapshotFilename = nil;
  }
  return self;
}

@end

@implementation i3MobileLoginInfo

@synthesize firstName,lastName,email,password,rememberPassword;

- (id) init
{
  self = [super init];
  if( self )
  {
    firstName = nil;
    lastName = nil;
    email = nil;
    password = nil;
    rememberPassword = FALSE;
  }
  return self;
}

@end

@implementation ImcConnectionServer

@synthesize serverID,server_address,username,password,groupName,server_port,connected,serverName,fullAddress, groupNames, serverVersion, availableDataDateList, allDateInterval,serverTimezone,public_address, haspLicense, isRelay, relayConnectable, relayIp, relayPort, isRelayReconnecting;

+ (id)initWithServerInfo:(ImcConnectionServer *)server
{
  ImcConnectionServer* newServer = [[ImcConnectedServer alloc] init];
  [newServer updateServerInfo:server];
  return newServer;
}

-(id)init
{
  self = [super init];
  if( self )
  {
    serverName      = @"";
    server_address  = @"";
    serverID        = @"";
    server_port     = IMC_DEFAULT_SERVER_PORT;
    username        = @"";
    password        = @"";
    connected       = FALSE;
    groupName       = @"";
    public_address  = @"";
    groupNames = [NSMutableArray array];
    serverVersion = VERSION_2300;
    availableDataDateList = [NSMutableArray array];
    allDateInterval = nil;
    serverTimezone = [[NSTimeZone alloc] init];
    haspLicense      = @"";
    relayIp  = @"";
    isRelay       = FALSE;
    relayConnectable       = FALSE;
    relayPort     = IMC_DEFAULT_RELAY_SERVER_PORT;
    isRelayReconnecting = FALSE;
  }
  return self;
}

- (void)updateServerInfo:(ImcConnectionServer *)server
{
  serverName      = server.serverName;
  server_address  = server.server_address;
  serverID        = server.serverID;
  server_port     = server.server_port;
  username        = server.username;
  password        = server.password;
  connected       = server.connected;
  groupName       = [server.groupName copy];
  fullAddress     = server.fullAddress;
  groupNames      = [NSMutableArray arrayWithArray:server.groupNames];
  serverVersion   = server.serverVersion;
  availableDataDateList = server.availableDataDateList;
  serverTimezone  = server.serverTimezone;
  public_address  = server.public_address;
  haspLicense      = server.haspLicense;
  relayIp       = server.relayIp;
  isRelay       = server.isRelay;
  relayConnectable     = server.relayConnectable;
  relayPort            = server.relayPort;
  isRelayReconnecting  = server.isRelayReconnecting;
}

-(BOOL)isEqual:(ImcConnectionServer *)object
{
//  NSLog(@"GOND compare server: %s, %s, %s, %s", [server_address isEqualToString:object.server_address] ? "Y" : "N", (server_port==object.server_port) ? "Y" : "N", [username isEqualToString:object.username] ? "Y" : "N", [password isEqualToString:object.password] ? "Y" : "N");
  return [server_address isEqualToString:object.server_address] && (server_port==object.server_port) && [username isEqualToString:object.username] && [password isEqualToString:object.password];
}

@end

@implementation ImcFavoriteChannel
@synthesize channelID, channelName, serverAddress, serverPort,groupID, serverName;
-(id)init
{
  self = [super init];
  if( self )
  {
    channelID = -1;
    channelName = @"";
    serverAddress = @"";
    serverPort = -1;
    groupID = -1.0f;
    serverName = @"";
  }
  return self;
}

@end


@implementation ImcFavoriteGroup
@synthesize groupID, groupName, channel;
-(id)init
{
  self = [super init];
  if( self )
  {
    groupID = -1.0f;
    groupName = @"";
    channel = [NSMutableArray array];
  }
  return self;
}

@end

@implementation ImcConnectedServer

@synthesize videoQuality,framePerSecond,durationViewAlarmList,filterAlarmBy,numListOfDurationViewAlarmList, firstChannelConfig, maxChannelSupport, currentAvailableChannel;

-(id)init
{
  self = [super init];
  if( self )
  {
    maxChannelSupport = 32;
    videoQuality = 80;
    framePerSecond = 16;
    durationViewAlarmList = 5*24;
    numListOfDurationViewAlarmList = 5;
    filterAlarmBy = ALARM_EVENT_TYPE_ALL;
    for( int index = 0; index < IMC_MAX_CHANNEL; index++)
    {
      channelConfig[index] = [[ChannelSetting alloc] init];
    }
    
    
    firstChannelConfig = [NSArray array];
    currentAvailableChannel = [NSMutableArray array];
    
  }
  return self;
}

-(ImcConnectionServer*)connectionServerInfo
{
  ImcConnectionServer* server = [[ImcConnectionServer alloc] init];
  server.serverName       = serverName;
  server.server_address   = server_address;
  server.serverID         = serverID;
  //server.serverID         = @"a&amp;&amp;&amp;";
  server.server_port      = server_port;
  server.username         = username;
  server.password         = password;
  server.groupName        = groupName;
  server.connected        = self.connected;
  server.fullAddress      = fullAddress;
  server.groupNames       = self.groupNames;
  server.public_address   = self.public_address;
  server.haspLicense      = haspLicense;
  server.relayIp       = relayIp;
  server.isRelay       = isRelay;
  server.relayConnectable     = relayConnectable;
  server.relayPort            = relayPort;
  server.isRelayReconnecting  = isRelayReconnecting;
  return  server;
}

-(BOOL)isEqual:(ImcConnectedServer *)object
{
  return [super isEqual:object.connectionServerInfo];
}

- (void)update:(ImcConnectedServer *)connectedServerInfo
{
  [self.connectionServerInfo updateServerInfo:[connectedServerInfo connectionServerInfo]];
  [self updateSetting:connectedServerInfo];
}

- (void)updateSetting:(ImcConnectedServer *)connectedServerInfo
{
  maxChannelSupport       = connectedServerInfo.maxChannelSupport;
  videoQuality            = connectedServerInfo.videoQuality;
  framePerSecond          = connectedServerInfo.framePerSecond;
  durationViewAlarmList   = connectedServerInfo.durationViewAlarmList;
  filterAlarmBy           = connectedServerInfo.filterAlarmBy;
  
}

- (void)updateChannelConfigs:(NSArray *)guiChannelConfig
{
  NSInteger count = guiChannelConfig.count < MAX_CHANNEL ? guiChannelConfig.count : MAX_CHANNEL;
  
  for( int index = 0; index < count; index++ )
  {
    channelConfig[index] = [guiChannelConfig objectAtIndex:index];
  }
}

- (NSArray*)channelConfigs
{
  
  return [NSArray arrayWithObjects:channelConfig count:MAX_CHANNEL];
}

-(NSArray*)firstChannelConfigs
{
  return [[NSArray alloc] initWithArray:firstChannelConfig];
}

- (NSArray*)availableChannelConfigs
{
  NSMutableArray* channels = [[NSMutableArray alloc] init];
  for (int index = 0; index < MAX_CHANNEL; index++) {
    if( channelConfig[index].isLiveViewable && channelConfig[index].isEnable /* && channelConfig[index].videoSourceInput != -1*/)
    {
      [channels addObject:channelConfig[index]];
    }
  }
  return (NSArray*)channels;
}

-(BOOL)hasAvailableSearchChannels;
{
  for (int index = 0; index < MAX_CHANNEL; index++)
  {
    if(channelConfig[index].isSearchable && channelConfig[index].isEnable)
    {
      return TRUE;
    }
  }
  return FALSE;
}

- (void)setfirstChannelConfigs:(NSArray*)channel
{
  NSMutableArray* firstConfig = [[NSMutableArray alloc] init];
  for (int index = 0; index < MAX_CHANNEL; index++) {
    ChannelSetting* channelConfigs = [[ChannelSetting alloc] init];
    channelConfigs.channelID = ((ChannelSetting*)channel[index]).channelID;
    channelConfigs.isEnable = ((ChannelSetting*)channel[index]).isEnable;
    channelConfigs.isLiveViewable = ((ChannelSetting*)channel[index]).isLiveViewable;
    channelConfigs.isSearchable = ((ChannelSetting*)channel[index]).isSearchable;
    channelConfigs.videoSourceInput = ((ChannelSetting*)channel[index]).videoSourceInput;
    channelConfigs.channelName = ((ChannelSetting*)channel[index]).channelName;
    channelConfigs.isPtzEnable = ((ChannelSetting*)channel[index]).isPtzEnable;
    channelConfigs.cameraInfo = ((ChannelSetting*)channel[index]).cameraInfo;
    
    [firstConfig addObject:channelConfigs];
  }
  
  firstChannelConfig =  firstConfig;
  
  for (ChannelSetting* channelOldConfig in firstChannelConfig) {
    if (channelOldConfig.videoSourceInput != -1 && channelOldConfig.isEnable) {
      [currentAvailableChannel addObject:@(channelOldConfig.channelID)];
    }
  }
}

-(void)setChannelConfigs:(NSArray *)channelConfigs
{
  for (NSInteger index = 0; index < (channelConfigs.count <= IMC_MAX_CHANNEL? channelConfigs.count:IMC_MAX_CHANNEL); index++) {
    channelConfig[index] = channelConfigs[index];
  }
}

-(void)resetChannelConfigs
{
  for (NSInteger index = 0; index < IMC_MAX_CHANNEL; index++) {
    channelConfig[index] = [[ChannelSetting alloc] init];
    channelConfig[index].channelID = -1;
  }
}

@end

@implementation ImcChannelConfig

@synthesize serverAddress,serverPort,channelConfigs;

-(id)init
{
  self = [super init];
  if( self )
  {
    serverAddress = nil;
    serverPort = IMC_DEFAULT_SERVER_PORT; // default port;
    channelConfigs = nil;
  }
  return self;
}

-(id) initWithServerAddress:(NSString*)_serverAddress withPort:(NSInteger)_port andChannelConfig : (NSArray*)_channelConfig
{
  self = [super init];
  if(self )
  {
    serverAddress   = _serverAddress;
    serverPort      = _port;
    channelConfigs  = _channelConfig;
  }
  return self;
}

@end

@implementation ImcCommand

-(id)init
{
  self = [super init];
  if( self )
  {
    command = -1;
    data = nil;
  }
  return self;
}

-(id)initWithCommand:(NSInteger)_command andData:(NSObject *)_data
{
  self = [super init];
  if( self )
  {
    command = _command;
    data = _data;
  }
  return self;
}

- (NSInteger)getCommand
{
  return  command;
}

- (NSObject*)getData
{
  return data;
}

@end

@implementation ImcConnectionStatus

@synthesize connectionIndex,connectionStatus,remoteConnection;

-(id) init
{
  self = [super init];
  if( self )
  {
    remoteConnection = nil;
    connectionIndex = -1;
    connectionStatus = -1;
  }
  return self;
}

-(id) initWithParam:(id)remote : (long)index : (long)status
{
  self = [super init];
  if( self )
  {
    remoteConnection = remote;
    connectionIndex = index;
    connectionStatus = status;
  }
  return self;
}

@end

@implementation ImcDisplayScreenItem
@synthesize serverAddress,channelIndex,viewIndex,serverPort;

-(id)init
{
  self = [super init];
  if( self )
  {
    serverAddress = @"";
    channelIndex = -1;
    viewIndex = -1;
    serverPort = 0;
  }
  return self;
}

@end

@implementation ImcChannelMapping

@synthesize serverAddress,serverPort,numChannel,channelMapping,serverName;

-(id)init
{
  self = [super init];
  if( self )
  {
    numChannel = 0;
    serverAddress = nil;
    serverPort = 0;
    channelMapping = nil;
    serverName = nil;
  }
  return self;
}

-(id)initWithServerAddress:(NSString *)address withPort:(NSInteger)port andNumOfChannels:(NSUInteger)num
{
  self = [super init];
  if( self )
  {
    serverAddress = address;
    serverPort = port;
    numChannel = num;
    channelMapping = malloc(numChannel*sizeof(NSInteger));
    for (int index = 0; index < numChannel; index++) {
      channelMapping[index] = -1;
    }
  }
  return self;
}

-(void)dealloc
{
  if( channelMapping )
    free(channelMapping);
}

- (void)updateMappingWithChannelConfig:(NSArray *)channelConfigs
{
  NSInteger numChannelConfig = channelConfigs.count;
  if( numChannelConfig != numChannel )
  {
    // initialize new channel mapping
    NSInteger* newChannelMapping = malloc(numChannelConfig*sizeof(NSInteger));
    NSInteger maxChannel = numChannelConfig > numChannel ? numChannel : numChannelConfig;
    for( int channelIndex = 0; channelIndex < maxChannel; channelIndex++ )
    {
      ChannelSetting* channelSetting = [channelConfigs objectAtIndex:channelIndex];
      if( channelSetting.isLiveViewable == false || channelSetting.isEnable == false )
        newChannelMapping[channelIndex] = -1;
      else
        newChannelMapping[channelIndex] = channelMapping[channelIndex];
    }
    for( long channelIndex = maxChannel; channelIndex < numChannelConfig; channelIndex++ )
      newChannelMapping[channelIndex] = -1;
    
    // delete old channel mapping
    free(channelMapping);
    // assign to new one
    channelMapping = newChannelMapping;
  }
  else
  {
    for( int channelIndex = 0; channelIndex < numChannel; channelIndex++ )
    {
      ChannelSetting* channelSetting = [channelConfigs objectAtIndex:channelIndex];
      if( channelSetting.isLiveViewable == false || channelSetting.isEnable == false )
        channelMapping[channelIndex] = -1;
    }
  }
}

- (void) updateNumberOfChannel:(NSInteger)newNumChannel
{
  // initialize new channel mapping
  NSInteger* newChannelMapping = malloc(newNumChannel*sizeof(NSInteger));
  NSInteger maxChannel = newNumChannel > numChannel ? numChannel : newNumChannel;
  for( int channelIndex = 0; channelIndex < maxChannel; channelIndex++ )
    newChannelMapping[channelIndex] = channelMapping[channelIndex];
  
  for( long channelIndex = maxChannel; channelIndex < newNumChannel; channelIndex++ )
    newChannelMapping[channelIndex] = -1;
  
  // delete old channel mapping
  free(channelMapping);
  // assign to new one
  channelMapping = newChannelMapping;
  numChannel = newNumChannel;
}

@end

@implementation ImcAlarmEventData
@synthesize index,channelID,type,utcTime,serverTime,svrTimeZone,trackerIDMask,numImageRelated,sensorControlID,numTracker, sensorTriggerChannelID, isEnableFullScreen, fullScreenChannelIndex;

-(id)init
{
  self = [super init];
  if( self )
  {
    index = channelID = -1;
    utcTime = svrTimeZone = 0;
    trackerIDMask = nil;
    numImageRelated = 0;
    sensorControlID = -1;
    sensorTriggerChannelID = [NSMutableArray array];
    isEnableFullScreen = NO;
    fullScreenChannelIndex = -1;
    
  }
  return self;
}

-(void)dealloc
{
  if( trackerIDMask )
    free(trackerIDMask);
}

@end

@implementation ImcAlarmEventList
@synthesize serverAddress,serverPort,alarmViewStatus,listAlarmEvents;

-(id)init
{
  self = [super init];
  if( self )
  {
    serverAddress = @"";
    serverPort = 0;
    listAlarmEvents = [[NSMutableArray alloc] init];
    alarmViewStatus = 0;
  }
  return self;
}

-(id)initFromServerAddress:(NSString *)address andPort:(NSInteger)port
{
  self = [super init];
  if( self )
  {
    serverAddress = address;
    serverPort = port;
    listAlarmEvents = [[NSMutableArray alloc] init];
    alarmViewStatus = 0;
  }
  return self;
}

-(void)parserXMLData:(NSData *)xmlData
{
  GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:nil];
  if( doc )
  {
    if( listAlarmEvents == nil )
      listAlarmEvents = [[NSMutableArray alloc] init];
    
    NSArray* eventNodes = [doc.rootElement elementsForName:@"Event"];
    
    for( GDataXMLElement* eventNode in eventNodes )
    {
      ImcAlarmEventData* alarmEvent = [[ImcAlarmEventData alloc] init];
      
      alarmEvent.type = [[[eventNode attributeForName:@"type"] stringValue] integerValue];
      alarmEvent.index = [[[eventNode attributeForName:@"id"] stringValue] integerValue];
      alarmEvent.utcTime = [[[eventNode attributeForName:@"utc_time"] stringValue] integerValue];
      alarmEvent.serverTime = [[eventNode attributeForName:@"server_time"] stringValue];
      alarmEvent.svrTimeZone = [[[eventNode attributeForName:@"time_zone_offset"] stringValue] integerValue];
      switch (alarmEvent.type) {
        case ALARM_EVENT_SENSOR_TRIGGERED:
        {
          alarmEvent.sensorControlID = [[[eventNode attributeForName:@"sensor_id"] stringValue] integerValue];
          alarmEvent.numImageRelated = [[[eventNode attributeForName:@"num_video_source"] stringValue] integerValue];
        }
          break;
        case ALARM_EVENT_MOTION_DETECTION:
        {
          alarmEvent.channelID = [[[eventNode attributeForName:@"channel_id"] stringValue] integerValue];
          NSString* trackerIDMask = [[eventNode attributeForName:@"tracker_id_mask"] stringValue];
          NSArray* trackerIDs = [trackerIDMask componentsSeparatedByString:@"_"];
          if( trackerIDs.count > 0 )
          {
            alarmEvent.trackerIDMask = malloc(trackerIDs.count*sizeof(BOOL));
            alarmEvent.numTracker = trackerIDs.count;
            for( int index = 0; index < trackerIDs.count; index++ )
            {
              alarmEvent.trackerIDMask[index] = [(NSString*)[trackerIDs objectAtIndex:index] isEqualToString:@"1"];
            }
          }
        }
          break;
        case ALARM_EVENT_STOP_RECORDING:
        {
          
        }
          break;
        case ALARM_EVENT_VIDEO_LOST:
        {
          alarmEvent.channelID = [[[eventNode attributeForName:@"channel_id"] stringValue] integerValue];
        }
          break;
        default:
          break;
      }
      [listAlarmEvents addObject:alarmEvent];
    }
  }
}

-(ImcAlarmEventData*)parserXMLElement:(NSData *) xmlData
{
  GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:nil];
  if( doc )
  {
    
    GDataXMLElement* eventNode = doc.rootElement;
    //for( GDataXMLElement* eventNode in eventNodes )
    //{
    
    ImcAlarmEventData* alarmEvent = [[ImcAlarmEventData alloc] init];
    
    alarmEvent.type = [[[eventNode attributeForName:@"type"] stringValue] integerValue];
    alarmEvent.index = [[[eventNode attributeForName:@"id"] stringValue] integerValue];
    alarmEvent.utcTime = [[[eventNode attributeForName:@"utc_time"] stringValue] integerValue];
    alarmEvent.serverTime = [[eventNode attributeForName:@"server_time"] stringValue];
    alarmEvent.svrTimeZone = [[[eventNode attributeForName:@"time_zone_offset"] stringValue] integerValue];
    switch (alarmEvent.type) {
      case ALARM_EVENT_SENSOR_TRIGGERED:
      {
        alarmEvent.sensorControlID = [[[eventNode attributeForName:@"sensor_id"] stringValue] integerValue];
        alarmEvent.numImageRelated = [[[eventNode attributeForName:@"num_channel"] stringValue] integerValue];
        
        for (NSInteger i = 0; i < alarmEvent.numImageRelated; i++) {
          NSString* channelName = [NSString stringWithFormat:@"channel_%ld", (long)i];
          NSInteger channelID = [[[eventNode attributeForName:channelName] stringValue] integerValue];
          [alarmEvent.sensorTriggerChannelID addObject:@(channelID)];
        }
        if(alarmEvent.numImageRelated>0)
          alarmEvent.fullScreenChannelIndex = [[alarmEvent.sensorTriggerChannelID firstObject] integerValue];
      }
        break;
      case ALARM_EVENT_MOTION_DETECTION:
      {
        alarmEvent.channelID = [[[eventNode attributeForName:@"channel_id"] stringValue] integerValue];
        NSString* trackerIDMask = [[eventNode attributeForName:@"tracker_id_mask"] stringValue];
        NSArray* trackerIDs = [trackerIDMask componentsSeparatedByString:@"_"];
        if( trackerIDs.count > 0 )
        {
          alarmEvent.trackerIDMask = malloc(trackerIDs.count*sizeof(BOOL));
          alarmEvent.numTracker = trackerIDs.count;
          for( int index = 0; index < trackerIDs.count; index++ )
          {
            alarmEvent.trackerIDMask[index] = [(NSString*)[trackerIDs objectAtIndex:index] isEqualToString:@"1"];
          }
        }
        
        NSString* isEnableFullScreenMask  = [[eventNode attributeForName:@"enable_fullscreen"] stringValue];
        NSArray* enableFullScreenArray = [isEnableFullScreenMask componentsSeparatedByString:@"_"];
        
        alarmEvent.isEnableFullScreen = (BOOL)([[enableFullScreenArray objectAtIndex:0] integerValue]);
        
        NSString* channelIdFullScreenMask  = [[eventNode attributeForName:@"channel_id_fullscreen"] stringValue];
        NSArray* channelIdFullScreenArray = [channelIdFullScreenMask componentsSeparatedByString:@"_"];
        
        alarmEvent.fullScreenChannelIndex = [((NSString*)[channelIdFullScreenArray objectAtIndex:0]) integerValue];
        
      }
        break;
      case ALARM_EVENT_STOP_RECORDING:
      {
        
      }
        break;
      case ALARM_EVENT_VIDEO_LOST:
      {
        alarmEvent.channelID = [[[eventNode attributeForName:@"channel_id"] stringValue] integerValue];
      }
        break;
      case ALARM_EVENT_VIDEO_LOST_ALL:
      {
        alarmEvent.numImageRelated = [[[eventNode attributeForName:@"num_channel"] stringValue] integerValue];
        NSString* channelIDs = [[eventNode attributeForName:@"channel_ids"] stringValue];
        NSArray* ch_ids = [channelIDs componentsSeparatedByString:@","];
        if(ch_ids.count==alarmEvent.numImageRelated) {
          [ch_ids enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
            [alarmEvent.sensorTriggerChannelID addObject:[NSNumber numberWithInteger:[obj integerValue]]];
          }];
          alarmEvent.channelID = [[alarmEvent.sensorTriggerChannelID firstObject] integerValue];
        }
      }
      default:
        break;
    }
    
    //}
    return alarmEvent;
  }
  return nil;
}

@end

@implementation ImcCommonHeader

@synthesize serverAddress,serverPort,channelID;

-(id)init
{
  self = [super init];
  if( self )
  {
    channelID = -1;
    serverAddress = nil;
    serverPort = IMC_DEFAULT_SERVER_PORT;
  }
  return self;
}

@end

@implementation ImcTimeInterval

@synthesize begin, end, deviceID, time, type;

-(id)init
{
  self = [super init];
  if (self) {
    begin = -1;
    end = -1;
    deviceID = -1;
    time = -1;
    type = 0;
  }
  return self;
}

-(id)initWithTimeInterval:(TimeInterval)ti
{
  self = [super init];
  if (self) {
    begin = ti.begin;
    end = ti.end;
    deviceID = ti.id;
    time = ti.time;
    type = ti.type;
  }
  return self;
}

@end

@implementation ImcDateInterval

@synthesize time, size, timeInterval,channelIndex;

-(id)init
{
  self = [super init];
  if (self)
  {
    time = -1;
    size = 0;
    channelIndex = -1;
    timeInterval = [NSMutableArray array];
  }
  return self;
}

-(id)initWithDateInterVal:(void*)di withTimeZoneOffset:(long)timeZoneOffset
{
  self = [super init];
  
  if (self) {
    
    DayInterval* dayInterval = (DayInterval*)di;
    time = dayInterval->time/* - timeZoneOffset*/;
    size = dayInterval->size;
    timeInterval = [NSMutableArray array];
    //NSData * timeIntervalArray = [NSData dataWithBytes:dayInterval->ti length:sizeof(TimeInterval)*size];
    for (NSInteger i = 0; i < size; i++) {
      ImcTimeInterval* ImcTi = [[ImcTimeInterval alloc] init];
      ImcTi.begin = dayInterval->ti[i].begin - timeZoneOffset;
      ImcTi.end = dayInterval->ti[i].end - timeZoneOffset;
      ImcTi.type = dayInterval->ti[i].type;
      [timeInterval addObject:ImcTi];
    }
    [timeInterval sortUsingComparator:^NSComparisonResult(id obj1, id obj2) {
      ImcTimeInterval* ti1 = (ImcTimeInterval*)obj1;
      ImcTimeInterval* ti2 = (ImcTimeInterval*)obj2;
      
      if (ti1.begin < ti2.begin) {
        return (NSComparisonResult)NSOrderedAscending;
      }
      else
      {
        return (NSComparisonResult)NSOrderedDescending;
      }
    }];
  }
  
  return self;
}

@end


@implementation ImcAllDateInterval

@synthesize channel_mask, dateInterval, mode, serverAddress;

-(id)init
{
  self = [super init];
  
  if (self) {
    channel_mask = 0xFFFFFFFFFFFFFFFF;
    dateInterval = [NSMutableArray array];
    mode = -1;
    serverAddress = nil;
  }
  return self;
}

@end

@implementation i3PlaybackResumeInfo
@synthesize selectedSvrAddress,selectedSvrPort,lastTimePlay,chosenDay,selectedChannelIdx,currentTab;
-(i3PlaybackResumeInfo*)init
{
  self = [super init];
  if(self)
  {
    selectedSvrAddress = nil;
    lastTimePlay = 0;
    chosenDay = [NSDate date];
    selectedChannelIdx = -1;
    currentTab = CALENDAR_TAB;
  }
  return self;
}
@end

