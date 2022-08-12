//
//  FFMpegFrameView.m
//  CMSApp
//
//  Created by I3DVR on 9/14/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import "FFMpegFrameView.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import "ImcGUIBase.h"
#import <math.h>
#import "RCTBridgeModule.h"


#import "Commanager/ImcRemoteConnection.h"
#import "ImcControllerThread.h"
#import "GDataXMLNode.h"
#import "ImcServerSetting.h"
#import "ImcDisplayChannel.h"
#import "ImcMainDisplayVideoView.h"
#import "NSDate+Utils.h"
#import "NSDate+Agenda.h"
#import "FFMpegFrameEventEmitter.h"

void run_on_ui_thread(dispatch_block_t block)
{
  if([NSThread isMainThread])
  {
    block();
  }
  else
  {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

const uint32_t HoursPerDay = 24;
const uint32_t numLayers = 24;

@interface FFMpegFrameView(PrivateMethod)

@property (nonatomic,retain) UIView* childView;

-(NSString* )get_obj:(NSDictionary* )_dic for_key:(NSString* )_key;
-(NSInteger)verifyserverInfo:(ImcConnectedServer* )newServer;
- (uint64_t) getChannelMask;
@end

@implementation FFMpegFrameView : UIView
{
  RCTEventDispatcher* _eventDisplatcher;
  CATextLayer* _textOverLay;
  NSNumber* _w;
  NSNumber* _h;
  NSString* _channels;
  NSArray* channelList;
  BOOL _byChannel;
  BOOL _isSeacrh;
  BOOL _isFullScreen;
  BOOL _rotate;
  BOOL _isHD;
  BOOL seekToZeroBeforePlay;
  BOOL onChangeDateSearch;
  int _oldSeekpos;
  NSNumber* _interval;
  NSDate* _dateTimeSearch;
  NSDate* _dateTimeRulerDST;
  float RATIO;
  int mLastRotation;
  UIDeviceOrientation oldDeviceInterfaceHandel;
  BOOL _isSingle;
  
  //sending progressvideo event
  NSDate *_prevProgressUpdateTime;
  int _progressUpdateInterval;
}

@synthesize connectedServers, mainDisplayVideo, timer, isRotate, videoPlayerStatus, currentServer, chosenServerIndex, lastFrameInterval, mainViewRect, mainViewFullRect, currentSelectedFullScreenChannel, dateIntervalList, doesTodayHasData, chosenDay, chosenChannelIndex, channelsSearchDictionary, searchingDateInterval, channelListCollectonView, calTimezone, zoomLevel, calendar, searchFrameImage, lastResumeTime, m_dayType, hourSpecialDST, firstRunAlarm;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher{
	
  if((self = [super init])){
    _w = 0;
    _h = 0;
    firstRunAlarm = NO;
    _oldSeekpos = -1;
    _channels = nil;
    RATIO = 16.0f/9.0f;
    zoomLevel = ZOOM_LEVEL_24H;
    channelsMapping = [NSMutableArray array];
    mainDisplayVideo = [[ImcMainDisplayVideoView alloc] init];
    // mainDisplayVideo.fullscreenView = 0;
    connectedServerList = [[NSMutableArray alloc] init];
    viewMaskLock = [[NSCondition alloc] init];
    channelsSearchDictionary = [NSMutableDictionary dictionary];
    isRotate = NO;
    _rotate = NO;
    dateIntervalList = [NSMutableArray array];
    searchingDateInterval = [NSMutableArray array];
    currentServer = nil;
    currentSelectedFullScreenChannel = -1;
    videoPlayerStatus = STATE_PLAY;
    mainViewRect = CGRectMake(0.0, 0.0, 0.0, 0.0);
    mainViewFullRect = CGRectMake(0.0, 0.0, 0.0, 0.0);
    calendar = [NSDate gregorianCalendar];
    calTimezone = [NSTimeZone systemTimeZone];
    m_delayPlayback = NO;
    defaultImg = [[UIImage alloc] initWithCGImage: [UIImage imageNamed:@"CMS-video-losss.png"].CGImage];
    searchFrameImage = defaultImg;
    m_dayType = NORMAL;
    oldDeviceInterfaceHandel = UIInterfaceOrientationMaskPortrait;
    
    for (NSInteger i = 0; i < IMC_MAX_CHANNEL; i++) {
      viewMaskArray[i] = 0;
    }
    
    decoderThread = [[ImcDecodeThread alloc] init];
    decoderThread.delegate = self;
    [decoderThread startThread];
    
    // init controller thread
    controllerThread = [[ImcControllerThread alloc] init];
    controllerThread.delegate = self;
    
    // init controller thread
    controllerThread.decoderThread = decoderThread;
    [controllerThread startThread];
    
    _eventDisplatcher = eventDispatcher;
    resumeDataInfo = [[i3ResumeDataInfo alloc] init];
    
    //init frame video
    CGRect videoViewFrame = self.frame;
    videoViewFrame.origin = CGPointZero;
    videoView = [[UIView alloc] initWithFrame:videoViewFrame];
    
    [mainDisplayVideo setdisplayRect:self.bounds withRootLayer:videoView.layer];
    mainDisplayVideo.connectedServerList = connectedServerList;
    
    [videoView setFrame:self.bounds];
    [self addSubview:videoView];
    self.layer.contents = (id)[UIImage imageNamed:@"CMS-video-losss.png"].CGImage;
    
    AppDelegate* appdelegate = (AppDelegate* )[[UIApplication sharedApplication] delegate];
    appdelegate.video = self;
    self.currentDeviceOrientation = [[UIDevice currentDevice] orientation];
//    [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
//    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:UIDeviceOrientationDidChangeNotification object:nil];
  }
  
  return self;
}

#pragma React View Management

- (void)removeFromSuperview {
	
  [super removeFromSuperview];
  [mainDisplayVideo remoteAllLayers];
  //NSLog(@"Shark mainDisplayVideo remoteAllLayers");
}

- (void)setChannels:(NSString *)value{
	
  // NSLog(@"GOND_setter setChannels: %@", value);
  _channels = value;
  channelList = [_channels componentsSeparatedByString:@","];
  // NSString* channelStr = @"";
  // for(NSString* ch in channelList)
  // {
  //   channelStr = [NSString stringWithFormat:@"%@, %@", channelStr, ch];
  // }
  // NSLog(@"GOND_setter setChannels 2: %@", channelStr);
//  if (channelList.count == 1 && _isSingle)
//  {
//    mainDisplayVideo.fullscreenView = [[channelList objectAtIndex:0] intValue];
//  }
//  else
//  {
//    mainDisplayVideo.fullscreenView = -1;
//  }
}

-(void)setByChannel:(BOOL)value{
	
  _byChannel = value;
}

-(void)setIsSearch:(BOOL)value{
	
  _isSeacrh = value;
}

-(void)setIsHD:(BOOL)value{
	
  _isHD = value;
}

-(void)setOnChangeDateSearch:(BOOL)value{
	
  onChangeDateSearch = value;
}

-(void)setIsFullScreen:(BOOL)value{
	
  _isFullScreen = value;
}

-(void)setDateTimeSearch:(NSDate* )value{
	
  _dateTimeSearch = value;
}

-(void)setDateTimeRulerDST:(NSDate* )value{
	
  _dateTimeRulerDST = value;
}

-(void)setInterval:(NSNumber* )value{
	
  _interval = value;
}

-(void)checkIsSearch{
	
  AppDelegate* appdelegate = (AppDelegate* )[[UIApplication sharedApplication] delegate];
  appdelegate._isSeacrh = _isSeacrh;
}

- (void)reactSetFrame:(CGRect)frame{
	
  CGRect newFrame = frame;
  if(newFrame.size.height != [_h doubleValue])
    newFrame.size.height = [_h doubleValue];
  
  if(newFrame.size.width != [_w doubleValue])
    newFrame.size.width = [_w doubleValue];
  
  [super reactSetFrame:newFrame];
  [self.layer setFrame:self.bounds];
  [videoView setFrame:self.bounds];
  [mainDisplayVideo setFrame:self.bounds];
}

#pragma mark - Change resize GUI

-(CGRect)getScreenBoundsForOrientation:(UIInterfaceOrientation)_orientation
{
	
  UIScreen *screen = [UIScreen mainScreen];
  CGRect fullScreenRect = screen.bounds; //implicitly in Portrait orientation.
  
  if (UIInterfaceOrientationIsLandscape(_orientation))
  {
    CGRect temp;
    temp.size.width = fullScreenRect.size.height;
    temp.size.height = fullScreenRect.size.width;
    fullScreenRect = temp;
  }
  
  fullScreenRect = CGRectMake(CGRectZero.origin.x, CGRectZero.origin.y, fullScreenRect.size.width, fullScreenRect.size.height);
  return fullScreenRect;
}

- (CGRect) CGRectSetWidth:(CGRect) rect width:(CGFloat)width{
	
  return CGRectMake(rect.origin.x, rect.origin.y, width, rect.size.height);
}

- (CGRect) CGRectSetHeight:(CGRect) rect height:(CGFloat)height{
	
  return CGRectMake(rect.origin.x, rect.origin.y, rect.size.width, height);
}

- (CGRect) CGRectReset:(CGRect) rect width:(CGFloat)width height:(CGFloat)height{
	
  return CGRectMake(rect.origin.x, rect.origin.y, width, height);
}

#pragma mark - Native Props


-(void)setScaleXY:(NSNumber *) scale {
	
  if([scale floatValue] != mainDisplayVideo.scaleXY){
    mainDisplayVideo.scaleXY = [scale floatValue];
    [self reactSetFrame:self.frame];
    [self.layer setNeedsDisplay];
  }
}

-(void)setTranslateX:(NSNumber *)translatex {
	
  if([translatex intValue] != mainDisplayVideo.translateX){
    mainDisplayVideo.translateX = [translatex intValue];
    [self reactSetFrame:self.frame];
    [self.layer setNeedsDisplay];
  }
}

-(void)setTranslateY:(NSNumber *)translatey {
	
  if([translatey intValue] != mainDisplayVideo.translateY){
    mainDisplayVideo.translateY = [translatey intValue];
    [self reactSetFrame:self.frame];
    [self.layer setNeedsDisplay];
  }
}

-(void)setWidth:(NSNumber *)width {
	
  if(width != _w){
    _w = [width copy];
    mainDisplayVideo.playerWidth = [width intValue];
    [self reactSetFrame:self.frame];
    [self setNeedsLayout];
  }
}

-(void)setHeight:(NSNumber *)height {
	
  if(height != _h){
    _h = [height copy];
    mainDisplayVideo.playerHeight = [height intValue];
    [self reactSetFrame:self.frame];
    [self setNeedsLayout];
  }
}

-(void)setFirstrun:(BOOL)firstrun{
	
  NSLog(@"firstrun: %@",firstrun ? @"YES" : @"NO");
  if(firstRunAlarm != firstrun){
    firstRunAlarm = firstrun;
  }
}

-(void)setSinglePlayer:(BOOL)singlePlayer{
	
  // NSLog(@"GOND_setter singlePlayer: %@",singlePlayer ? @"YES" : @"NO");
  if(_isSingle != singlePlayer){
    _isSingle = singlePlayer;
    if (_isSingle)
    {
//      if (channelList.count == 1)
//        mainDisplayVideo.fullscreenView = [[channelList objectAtIndex:0] intValue];
//      else
        mainDisplayVideo.fullscreenView = 0;
    }
    else
    {
      mainDisplayVideo.fullscreenView = -1;
    }
  }
}

-(void)resetParam{
	
  [connectedServerList removeObject:currentServer];
  self.layer.contents = nil;
  //NSLog(@"Shark removeFromSuperview");
  [videoView removeFromSuperview];
  _dateTimeSearch = nil;
  currentSelectedFullScreenChannel = -1;
  chosenDay = nil;
  lastFrameInterval = 0;
  _isHD = NO;
  firstRunAlarm = NO;
  searchFrameImage = defaultImg;
  
  int hoursofDay = 24;
  int hourSpecial = 2;
  //Send daylight saving time
  NSString* daylightSavingTime = [NSString stringWithFormat:@"{\"hoursofDay\":%d,\"hourSpecial\":%d}",hoursofDay,hourSpecial];
  NSString* daylightSavingTimeJson = [NSString stringWithFormat:@"[%@]",daylightSavingTime];
  [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                          @"msgid": [NSNumber numberWithUnsignedInteger:22],
                                                                          @"value":[NSString stringWithString:daylightSavingTimeJson],
                                                                          @"target": self.reactTag
                                                                          }];
}

-(void)setStartplayback:(NSDictionary *)startplayback {
	
//  [self resetParam];
//  [self handleResponseMessage:IMC_MSG_LIVE_VIEW_STOP_VIDEO fromView:self withData:nil];
  if(startplayback.count == 0){
    // NSLog(@"GOND qqqqqqqqqq setStartplayback failed 1");
    return;
  }
  else {
    NSDateFormatter* formatTime = [[NSDateFormatter alloc] init];
    [formatTime setDateFormat:@"yyyy/MM/dd HH:mm:ss"];
    
    //Time for ruler DST
    NSDateFormatter* formatTimeDST = [[NSDateFormatter alloc] init];
    [formatTimeDST setDateFormat:@"yyyy/MM/dd HH:mm:ss"];
    [formatTimeDST setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
    
    ImcConnectedServer* selectedServer = [self setConnectionServer:startplayback];
//    NSLog(@"GOND setStartplayback: %d, %d", connectedServerList.count, connectedServers.count);
    
    NSString* channel = [self get_obj:startplayback for_key:@"channels"];
//    m_channel = channel;
    NSString* previousChannel = _channels;
    BOOL by_channel = [[self get_obj:startplayback for_key:@"byChannel"] boolValue];
    BOOL isSearch = [[self get_obj: startplayback for_key:@"searchMode"] boolValue];
    NSNumber* interval = [self get_obj:startplayback for_key:@"interval"];
    NSString* dt = [self get_obj:startplayback for_key:@"date"];
    NSDate*  dateTimeSearch = [formatTime dateFromString:dt];
    NSDate*  dateTimeSearchDST = [formatTimeDST dateFromString:dt];
    BOOL isHD = NO;
    BOOL isConnecting = NO;
    if([self get_obj:startplayback for_key:@"hd"]){
      @try{
        isHD = [[self get_obj:startplayback for_key:@"hd"] boolValue];
      }
      @catch (NSException* exception){
        isHD = NO;
      }
      @finally{
        
      }
    }
    // [self setIsHD:isHD];
    
    if(isSearch == YES){
      NSLog(@"GOND setStartplayback SEARCH");
      [self resetParam];
      [self handleResponseMessage:IMC_MSG_LIVE_VIEW_STOP_VIDEO fromView:self withData:nil];
      
      [self setDateTimeSearch:dateTimeSearch];
      [self setDateTimeRulerDST:dateTimeSearchDST];
      [self setInterval: interval];
    } else {
      [self addSubview:videoView];
      BOOL found = NO;
      if (_isSeacrh == isSearch)
      {
        for (ImcConnectedServer* server in connectedServerList)
        {
          // NSLog(@"GOND setStartplayback compare server: %@ vs %@, %ld vs %ld, %@ vs %@, %@ vs %@", server.server_address, selectedServer.server_address, (long)server.server_port, (long)selectedServer.server_port, server.username, selectedServer.username, server.password, selectedServer.password);
          if ([server isEqual:selectedServer])
          {
            selectedServer = server;
            found = YES;
            NSLog(@"GOND setStartplayback found server: %s", server.connected ? "YES" : "NO");
          }
        }
      }
//      if (!found) {
//        [self resetParam];
//        [self handleResponseMessage:IMC_MSG_LIVE_VIEW_STOP_VIDEO fromView:self withData:nil];
//      }
    }
//    m_channel = channel;
    [self setIsHD:isHD];
    
    if( selectedServer.connected )
    {
//      isConnecting = YES;
//      NSArray* buttonList = [NSArray arrayWithObjects:@"View channel list", @"Disconnect", nil];
      NSLog(@"GOND setStartplayback 2 server connected: updating channels list");
      [self setChannels:channel];
      if (![_channels isEqualToString:previousChannel] && previousChannel != nil)
      {
//        [controllerThread updateServerDisplayMask:selectedServer.server_address :selectedServer.server_port :[self getChannelMask]];
        [self handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:self withData:nil];
      }
    }
    else // if (connectedServers.count < MAX_SERVER_CONNECTION)
    {
      NSLog(@"GOND setStartplayback 2 start connection : %d", connectedServers.count);
      [connectedServerList addObject:selectedServer];
//      NSString* previousChannel = _channels;
      [self setChannels:channel];
      [self setByChannel:by_channel];
      [self setIsSearch:isSearch];
      /* Display the error to the user. */
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:3],
                                                                              @"target": self.reactTag
                                                                              }];
      [self handleResponseMessage:IMC_MSG_CONNECTION_CONNECT fromView:self withData:selectedServer];
    }
//    else
//    {
//      NSLog(@"GOND qqqqqqqqqq setStartplayback 3 server full, not handled");
//    }
    videoPlayerStatus = STATE_PLAY;
    
    [self checkIsSearch];
  }
}

-(ImcConnectionServer *)setConnectionServer: (NSDictionary *)server{
	
  
  ImcConnectedServer* _server = [[ImcConnectedServer alloc] init];
  NSString* _server_addr = [self get_obj:server for_key:@"serverIP"];
  NSString* _public_addr = [self get_obj:server for_key:@"publicIP"];
  _server.serverID = [self get_obj:server for_key:@"serverID"];
  if(_public_addr&&_public_addr.length>0) // WAN IP address has higer priority
  {
    _server.server_address = _public_addr;
    _server.public_address = _server_addr;
  }
  else
  {
    _server.server_address = _server_addr;
    _server.public_address = _public_addr;
  }
  _server.serverName = [self get_obj:server for_key:@"name"];
  _server.server_port = [[server objectForKey:@"port"] integerValue];
  if(_server.server_port == 0)
    _server.fullAddress = _server.server_address;
  else
    _server.fullAddress = [NSString stringWithFormat:@"%@:%ld",_server.server_address,(long)_server.server_port];
  
  _server.username = [self get_obj:server for_key:@"userName"];
  _server.password = [self get_obj:server for_key:@"password"];
  
  _server.groupName = @"CMS";
  [_server.groupNames addObject:@"All servers"];
  [_server.groupNames addObject:_server.groupName];
  
  
  _server.isRelay = [[self get_obj:server for_key:@"isRelay"] boolValue];
  if(_server.isRelay) {
    _server.haspLicense = [self get_obj:server for_key:@"haspLicense"];
    _server.relayIp = [self get_obj:server for_key:@"relayIp"];
    _server.relayPort = [[self get_obj:server for_key:@"relayPort"] integerValue];
    _server.relayConnectable = [self get_obj:server for_key:@"relayConnectable"];
    NSLog(@"0108 setConnectionServer haspLicense = %@, relayIp = %@, relayPort = %ld, isRelay = %s, relayConnectable = %s", _server.haspLicense, _server.relayIp, (long)_server.relayPort, _server.isRelay ? "T" : "F", _server.relayConnectable ? "T" : "F");
  }
  
  return _server;
}

-(void)invalidateIdleTimer
{
	
  if (timer) {
    [timer invalidate];
    timer = nil;
  }
}

- (void)disconnectServers:(NSArray*)serverList
{
	
  [controllerThread disconnectServers:serverList];
  
  NSMutableArray* deletedServer = [NSMutableArray array];
  
  for (NSString* serverAddress in serverList)
  {
    for (ImcConnectedServer* connectedServer in connectedServerList)
    {
      if ([serverAddress isEqualToString:connectedServer.server_address])
      {
        
        [self.mainDisplayVideo removeScreenForServer:connectedServer.server_address andPort:connectedServer.server_port];
        
        [deletedServer addObject:connectedServer];
        
        [connectedServer resetChannelConfigs];
        
        [self updateServerDisconnectState:connectedServer];
        
      }
    }
  }
  
  [connectedServerList removeObjectsInArray:deletedServer];
}

-(void)updateServerDisconnectState:(ImcConnectedServer *)server
{
	
  for(ImcConnectedServer* _server in connectedServerList)
  {
    if( [server.server_address isEqualToString:_server.server_address] &&
       server.server_port == _server.server_port )
    {
      _server.connected = FALSE;
      break;
    }
  }
}

-(void)setPause:(BOOL)pause{
	
  //Set background video by image last frame if not set after about 5 send keepalive background return no image content
  UIGraphicsBeginImageContext(self.bounds.size);
  [self.layer renderInContext:UIGraphicsGetCurrentContext()];
  UIImage* latImageOfFrame = UIGraphicsGetImageFromCurrentImageContext().CGImage;
  UIGraphicsEndImageContext();
  self.layer.contents = latImageOfFrame;

  if(pause){
    if(_isSeacrh == YES){
      uint64_t channelMask = 0;
      uint64_t mainStreamMask = 0;
      if (!(chosenChannelIndex >= 0 && chosenChannelIndex < dateIntervalList.count)) {
        return;
      }
      
      channelMask = ((uint64_t)0x01<<((ImcDateInterval*)[dateIntervalList firstObject]).channelIndex);
      
      if (channelMask <= 0) {
        return;
      }
      
      ImcDateInterval* chosenDateInterval = [dateIntervalList firstObject];
      
      long firstTimeInterval = 0;
      
      if (lastFrameInterval == 0) {
        firstTimeInterval = ((ImcTimeInterval*)[chosenDateInterval.timeInterval firstObject]).begin;
      }
      else
      {
        firstTimeInterval = lastFrameInterval;
      }

      if(_isHD == YES)
        mainStreamMask = channelMask;

      NSArray* data = [NSArray arrayWithObjects:currentServer,@(firstTimeInterval), @(channelMask), @(mainStreamMask), nil];
      if (videoPlayerStatus == STATE_PLAY) {
        [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_STOP fromView:self withData:data];
        videoPlayerStatus = STATE_PAUSE;
      }
      else if (videoPlayerStatus == STATE_STOP || videoPlayerStatus == STATE_PAUSE)
      {
        if (chosenChannelIndex < dateIntervalList.count && chosenChannelIndex >= 0) {
          if (!(chosenChannelIndex >= 0 && chosenChannelIndex < dateIntervalList.count)) {
            return;
          }
          
          long _time = 0;//[self getAvailableTimeToPlay];
          if(lastFrameInterval>=(_time - 60) && lastFrameInterval<(_time+60)){
            [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_PLAY_FW fromView:self withData:data];
            videoPlayerStatus = STATE_PLAY;
            return;
          }
          else if(_time != 0){
            NSArray* _data = [NSArray arrayWithObjects:currentServer,@(_time), @(channelMask), @(mainStreamMask), nil];
            [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_SET_POS fromView:self withData:_data];
            [NSThread sleepForTimeInterval:0.00001f];
            [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_PLAY_FW fromView:self withData:_data];
            videoPlayerStatus = STATE_PLAY;
            return;
          }
        }
      }
    } else {
      [self handleResponseMessage:IMC_MSG_LIVE_VIEW_STOP_VIDEO fromView:self withData:nil];
      [self invalidateIdleTimer];
      videoPlayerStatus = STATE_PAUSE;
    }
  }
  
  //NSLog(@"Shark: setNeedsDisplay on set Pause");
  [self setNeedsDisplay];
}

-(void)setDisconnect:(BOOL)disconnect {
	
  // NSLog(@"GOND: ******* on disconnect: %d", disconnect);
  // if(disconnect){
  NSLog(@"GOND: ******* on disconnect ******");
  videoPlayerStatus = STATE_STOP;
  [controllerThread disconnectAllServers];
    
  if(connectedServerList.count > 0)
  {
    for (ImcConnectedServer* connectedServer in connectedServerList)
    {
        // [self.mainDisplayVideo removeScreenForServer:connectedServer.server_address andPort:connectedServer.server_port];
        
        [connectedServer resetChannelConfigs];
        
        connectedServer.connected = FALSE;
    }
    for (NSInteger i = 0; i < IMC_MAX_DISPLAY_SCREEN; i++)
    {
      [self.mainDisplayVideo resetScreen:i];
    }
//    if (disconnect)
//    {
//      [self handleCommand:IMC_CMD_CONNECTION_DISCONNECT_RESPONSE :nil];
//    }
//    else
//    {
      [self handleResponseMessage:IMC_MSG_CONNECTION_DISCONNECT fromView:self withData:nil];
//    }
    [connectedServerList removeAllObjects];
  }
  [self.connectedServers removeAllObjects];
  if (disconnect)
  {
    [mainDisplayVideo remoteAllLayers];
    [controllerThread stopThread];
    controllerThread = nil;
    [decoderThread stopThread];
    decoderThread = nil;
  }
  [mainDisplayVideo resetDisplayMapping];
  // }
}

-(void)setRefresh:(BOOL)refresh {
	
  if(refresh){
    // NSLog(@"GOND: $$$$$$$ on refresh: %d", refresh);
    videoPlayerStatus = STATE_PAUSE;
    if(connectedServerList.count > 0)
    {
      for (NSInteger i = 0; i < IMC_MAX_DISPLAY_SCREEN; i++) {
        [self.mainDisplayVideo resetScreen:i];
      }
    }
    
//    [controllerThread stopTransferingVideo];
    // [mainDisplayVideo remoteAllLayers];
    [mainDisplayVideo resetDisplayMapping];
  }
}

-(void)setStop:(BOOL)stop{
	
  if(stop){
    videoPlayerStatus = STATE_STOP;
    if(connectedServerList.count > 0)
    {
      for (ImcConnectedServer* connectedServer in connectedServerList)
      {
        [self updateServerDisconnectState:connectedServer];
      }
      
      for (NSInteger i = 0; i < IMC_MAX_DISPLAY_SCREEN; i++) {
        [self.mainDisplayVideo resetScreen:i];
      }
      
      [self handleResponseMessage:IMC_MSG_CONNECTION_DISCONNECT fromView:self withData:nil];
      [connectedServerList removeAllObjects];
    }
    
    [mainDisplayVideo remoteAllLayers];
    [mainDisplayVideo resetDisplayMapping];
  }
}

-(void)setSeekpos:(NSDictionary *)seekpos{
	
  if(seekpos.count == 0){
    return;
  }
  else {
    NSNumber* interval = [self get_obj:seekpos for_key:@"pos"];
    BOOL isHD = NO;
    if([self get_obj:seekpos for_key:@"HD"]){
      @try{
        isHD = [[self get_obj:seekpos for_key:@"HD"] boolValue];
      }
      @catch (NSException* exception){
        isHD = NO;
      }
      @finally{
        
      }
    }
    
    [self setIsHD:isHD];
    dispatch_async(dispatch_get_main_queue(), ^{
      [self SeekPos:interval];
    });
  }
}
  
-(void)SeekPos:(NSNumber* )interval{
	
  if (chosenChannelIndex < dateIntervalList.count && chosenChannelIndex >= 0) {
    ImcDateInterval* chosenDayInterval = [dateIntervalList objectAtIndex:chosenChannelIndex];
    ImcTimeInterval* lastTi = [chosenDayInterval.timeInterval lastObject];
    NSDateComponents* beginLastComponents = [calendar components:NSCalendarUnitHour|NSCalendarUnitMinute fromDate:[NSDate dateWithTimeIntervalSince1970:lastTi.end]];
    [beginLastComponents setHour:beginLastComponents.hour + [currentServer.serverTimezone secondsFromGMT]/3600];
    NSDate* dateSearch = [NSDate dateWithTimeIntervalSince1970:[interval integerValue]];
    NSCalendar* calendaComp = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
    [calendaComp setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
    NSDateComponents* dateSearchComponents = [calendaComp components:NSCalendarUnitHour|NSCalendarUnitMinute fromDate:dateSearch];
    
    __block uint64_t channelMask = 0x00;
    uint64_t mainStreamMask = 0;
    
    // CMS fix out of bound crash
    if (self.mainDisplayVideo.fullscreenView < 0 || self.mainDisplayVideo.fullscreenView >= [self.mainDisplayVideo getDisplayView].count) {
      NSLog(@"GOND: get display View out of bound: %d", self.mainDisplayVideo.fullscreenView);
      return;
    }
    ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
    if (view.screenIndex < 0 || view.screenIndex >= [self.mainDisplayVideo getDisplayScreens].count)
    {
      NSLog(@"GOND: get display screen out of bound: %d", self.mainDisplayVideo.fullscreenView);
      return;
    }
    ImcScreenDisplay* screen = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
    
    [currentServer.channelConfigs enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
      if([(ChannelSetting*)obj isSearchable] && ((ChannelSetting*)obj).channelID == screen.channelIndex)
      {
        channelMask |= ((uint64_t)1 << idx);
      }
      
    }];
    
    if (!(chosenChannelIndex >= 0 && chosenChannelIndex < dateIntervalList.count)) {
      return;
    }
    
    if(_isHD == YES)
      mainStreamMask = channelMask;
    
    //      if (beginLastComponents.hour < [dateSearchComponents hour] || (beginLastComponents.hour == [dateSearchComponents hour] && beginLastComponents.minute < [dateSearchComponents minute]))
    //      {
    //        self.layer.contents = nil;
    //        [videoView removeFromSuperview];
    //        searchFrameImage = defaultImg;
    //        [self.layer setNeedsDisplay];
    //        [videoView setNeedsDisplay];
    //
    //        if (lastTi.end > 0 ) {
    //          long todayInterval = lastTi.end - 60;
    //          uint64_t mainStreamMask = 0x00;
    //          uint64_t channelMask = ((uint64_t)0x01<<currentSelectedFullScreenChannel);
    //          if(_isHD == YES)
    //            mainStreamMask = ((uint64_t)0x01<<currentSelectedFullScreenChannel);
    //
    //          NSArray* data = [NSArray arrayWithObjects:currentServer,@(todayInterval), @(channelMask), @(mainStreamMask), nil];
    //          [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_SET_POS fromView:self withData:data];
    //          [NSThread sleepForTimeInterval:0.2];
    //          [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_PLAY_FW fromView:self withData:data];
    //        }
    //      }
    //      else {
    NSArray* data = [NSArray arrayWithObjects:currentServer,@([interval integerValue]),@(channelMask), @(mainStreamMask), nil];
    [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_STOP fromView:self withData:data];
    [NSThread sleepForTimeInterval:0.0001f];
    
    NSDate* userChosenDay = chosenDay; //_dateTimeSearch;
    NSDateComponents* chosenDayComponents = nil;
    NSCalendar* calendar = self.AgendaCalendar;
    
    chosenDayComponents = [calendar components:NSCalendarUnitWeekday|NSCalendarUnitDay|NSCalendarUnitMonth|NSCalendarUnitYear | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond fromDate:userChosenDay];
    
    [chosenDayComponents setHour:0];
    [chosenDayComponents setMinute:0];
    [chosenDayComponents setSecond:0];
    
    NSCalendar* serverCalendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
    [serverCalendar setTimeZone:currentServer.serverTimezone];
    userChosenDay = [serverCalendar dateFromComponents:chosenDayComponents];
    
    int _interval = [interval integerValue];
    int diff = 0;
    if(_interval > HoursPerDay*3600){
      diff = 3600;
      _interval -= 3600;
    }
    
    NSDate* _dateInterval = [NSDate dateWithTimeIntervalSince1970:_interval];
    NSCalendar* calendarInterval = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
    [calendarInterval setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
    NSDateComponents *componentsInterval = [calendarInterval components:NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear| NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond fromDate:_dateInterval];
    
    int hour = [componentsInterval hour];
    int minute = [componentsInterval minute];
    int second = [componentsInterval second];
    
    if(firstRunAlarm == YES){
      [chosenDayComponents setHour:chosenDayComponents.hour + hour];
      [chosenDayComponents setMinute:chosenDayComponents.minute + minute];
      [chosenDayComponents setSecond:chosenDayComponents.second + second];
      
      if(m_dayType == BEGIN_DAYLIGHT && [currentServer.serverTimezone isDaylightSavingTimeForDate:[serverCalendar dateFromComponents:chosenDayComponents]]){
        hour -= 1;
      } else if(m_dayType == END_DAYLIGHT && [chosenDayComponents hour] >= hourSpecialDST){
        hour += 1;
      }
    } else {
      NSLog(@"khong");
    }

    int _offset = (hour * 3600) + (minute * 60) + second;
    int intervalDate = [chosenDay timeIntervalSince1970];
    long intervalSearch = intervalDate + _offset;
    
    if(m_dayType == END_DAYLIGHT && diff > 0)
      intervalSearch += 3600;
    
    if(m_dayType == BEGIN_DAYLIGHT && _offset > (HoursPerDay-1)*3600){
      intervalSearch -= 3600;
    }
    
    data = [NSArray arrayWithObjects:currentServer,@(intervalSearch), @(channelMask), @(mainStreamMask), nil];
    NSLog(@"interval: %d",intervalSearch);
    [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_SET_POS fromView:self withData:data];
    [NSThread sleepForTimeInterval:0.2];
    [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_PLAY_FW fromView:self withData:data];
  }
}

-(void)orientationChanged{
	
  if([[UIDevice currentDevice] orientation] != self.currentDeviceOrientation)
  {
    self.currentDeviceOrientation = [[UIDevice currentDevice] orientation];
    self.currentInterfaceOrientation = [UIApplication sharedApplication].statusBarOrientation;
    _rotate = YES;
    
    // Ignore changes in device orientation if unknown, face up, or face down.
    if (!UIDeviceOrientationIsValidInterfaceOrientation(self.currentDeviceOrientation)) {
      return;
    }
    
    int retVal;
    
    if(self.currentDeviceOrientation == UIDeviceOrientationUnknown){
      return;
    }
    else if(self.currentDeviceOrientation == UIDeviceOrientationPortraitUpsideDown)
    {
      retVal = 180;
    }
    else if (self.currentDeviceOrientation == UIDeviceOrientationLandscapeLeft)
    {
      retVal = 90;
    }
    else if (self.currentDeviceOrientation == UIDeviceOrientationLandscapeRight)
    {
      retVal = 270;
    }
    else
    {
      retVal = 0;
    }
    
    if(mLastRotation != retVal){
      mLastRotation = retVal;
      /* Display the error to the user. */
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:10],
                                                                              @"value": [NSNumber numberWithInt:mLastRotation],
                                                                              @"target": self.reactTag
                                                                              }];
    }
  }
}

-(void)setFullscreen:(int)fullscreen{
	
 
  switch (fullscreen) {
    case 270:
    {
      [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskLandscapeRight] forKey:@"orientation"];
    }
      break;
    case 180:
    {
      [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskPortraitUpsideDown] forKey:@"orientation"];
    }
      break;
    case 90:
    {
      [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskLandscapeLeft] forKey:@"orientation"];
    }
      break;
    case 0:
    {
      if(_rotate == NO){
        if([[UIDevice currentDevice] orientation] == UIDeviceOrientationLandscapeLeft){
          oldDeviceInterfaceHandel = UIDeviceOrientationLandscapeLeft;
          [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskLandscapeRight] forKey:@"orientation"];
        }
        else if([[UIDevice currentDevice] orientation] == UIDeviceOrientationLandscapeRight){
          oldDeviceInterfaceHandel = UIDeviceOrientationLandscapeRight;
          [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskLandscapeLeft] forKey:@"orientation"];
        } else {
          oldDeviceInterfaceHandel = UIDeviceOrientationPortrait;
          [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskPortrait] forKey:@"orientation"];
        }
      } else {
        [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskPortraitUpsideDown] forKey:@"orientation"];
      }
    }
      break;
    default:
    {
      [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:UIInterfaceOrientationMaskPortraitUpsideDown] forKey:@"orientation"];
    }
      break;
  }
   //NSLog(@"Shark set fulllllllllscreennnnnnnnnnnnnnnnnnnnn");
}

-(void)setHdmode:(BOOL)hdmode{
	
  NSLog(@"GOND HDMode start");
  if (mainDisplayVideo.fullscreenView >= 0 && mainDisplayVideo.fullscreenView < [mainDisplayVideo getDisplayView].count) {
    NSLog(@"GOND HDMode entered");
    ImcViewDisplay* view = [[mainDisplayVideo getDisplayView] objectAtIndex:mainDisplayVideo.fullscreenView];
    ImcScreenDisplay* screen = [[mainDisplayVideo getDisplayScreens]  objectAtIndex:view.screenIndex];
    
    //if (screen.needMainStream && screen.hasSubStream && hdmode == NO)
    if(hdmode == NO)
    {
      NSLog(@"GOND HDMode DISABLED");
      screen.needMainStream = NO;
      if(videoPlayerStatus == STATE_PAUSE){
        [self handleResponseMessage:IMC_MSG_MAIN_VIEW_TO_LIVE_VIEW fromView:self withData:nil];
        videoPlayerStatus = STATE_PLAY;
      }
      
      [self handleResponseMessage:IMC_MSG_LIVE_REQUEST_SUB_STREAM fromView:self withData:screen.serverAddress];
      
      dispatch_async(dispatch_get_main_queue(), ^{
        screen.isSubStream = YES;
      });
    }
    //else if ((screen.hasSubStream || screen.isSubStream) && hdmode == YES)
    else if (hdmode == YES)
    {
      NSLog(@"GOND HDMode ENABLED");
      screen.needMainStream = YES;
      if(videoPlayerStatus == STATE_PAUSE){
        [self handleResponseMessage:IMC_MSG_MAIN_VIEW_TO_LIVE_VIEW fromView:self withData:nil];
        videoPlayerStatus = STATE_PLAY;
      }
      
      [self handleResponseMessage:IMC_MSG_LIVE_REQUEST_MAIN_STREAM fromView:self withData:screen.serverAddress];
      dispatch_async(dispatch_get_main_queue(), ^{
        screen.isSubStream = NO;
      });
    }
  }
}

#pragma mark - Handle delegate
- (NSInteger)handleResponseMessage:(IMC_MSG_BASE)messageId fromView:(UIView *)sender withData:(NSObject *)responseData
{
	
  switch (messageId) {
    case IMC_MSG_LIVE_VIEW_START_VIDEO:
      [controllerThread startTransferingVideo];
      break;
    case IMC_MSG_LIVE_VIEW_STOP_VIDEO:
      [controllerThread stopTransferingVideo];
      break;
    case IMC_MSG_DISPLAY_FULLSCREEN:
    {
      CGSize smallSize,largeSize;
      [self.mainDisplayVideo getDisplaySize:&smallSize :&largeSize];
      [controllerThread updateDisplaySize:smallSize :largeSize];
      
      [decoderThread updateFrameQueueWhenFullScreen];
      
      for( ImcConnectedServer* server in connectedServerList )
      {
        uint64_t displayChannelMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:server.server_address andPort:server.server_port];
        NSInteger fullscreenChannel = [self.mainDisplayVideo fullscreenChannelForServer:server.server_address andPort:server.server_port];
        [controllerThread updateFullscreenChannel: server.server_address :server.server_port :fullscreenChannel];
        [controllerThread updateServerDisplayMask:server.server_address :server.server_port :displayChannelMask];
      }
    }
      break;
    case IMC_MSG_CONNECTION_CONNECT:
    case IMC_MSG_CONNECTION_DISCONNECT:
    {
      ImcConnectedServer* server = (ImcConnectedServer*)responseData;
      int command = 0;
      if( messageId == IMC_MSG_CONNECTION_DISCONNECT )
      {
        command = IMC_CMD_CONNECTION_DISCONNECT;
        //remove from connected server list
        ImcConnectedServer* foundServer = NULL;
        for (ImcConnectedServer* connectedServer in connectedServerList) {
          if( [server.server_address isEqualToString:connectedServer.server_address] &&
             server.server_port == connectedServer.server_port )
          {
            foundServer = connectedServer;
            break;
          }
        }
        
        if(foundServer!=NULL)
        {
          NSArray* deleted = [NSArray arrayWithObject:foundServer];
          NSArray* screenDisplay = [self.mainDisplayVideo getDisplayScreens];
          for (ImcScreenDisplay* screen in screenDisplay) {
            if ([screen.serverAddress isEqualToString:foundServer.server_address] && screen.serverPort == foundServer.server_port) {
              [self.mainDisplayVideo removeScreenAtIndex:screen.screenIndex withServerList:deleted ];
            }
          }
          
          [connectedServerList removeObject:foundServer];
          
          if (connectedServerList.count == 0 && self.mainDisplayVideo.fullscreenView != -1)
          {
            self.mainDisplayVideo.fullscreenView = -1; // 0;
            NSLog(@"============== GOND -1 msgDisconnect");
          }
          
          if (self.currentServer && [self.currentServer.server_address isEqualToString:foundServer.server_address]) {
            self.currentServer = nil;
          }
          
          if (connectedServerList.count == 0) {
            dispatch_async(dispatch_get_main_queue(), ^{
              //do something
            });
          }
          else
          {
            //Disable Search And Tab if neccessay
            BOOL hasSearchMode = NO;
            
            for (ImcConnectedServer* server in connectedServerList) {
              if (server.serverVersion >= VERSION_3300 && server.hasAvailableSearchChannels) {
                hasSearchMode = YES;
                break;
              }
            }
            
            if (!hasSearchMode) {
              dispatch_async(dispatch_get_main_queue(), ^{
                //do something
              });
            }
            else
            {
              dispatch_async(dispatch_get_main_queue(), ^{
                //do something
              });
            }
          }
          
          if (connectedServerList.count > 0) {
            [self.mainDisplayVideo updateChannelBufferWithDisconnectedServer:foundServer.server_address];
            [self handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:self withData:nil];
          }
        }
      }
      else
      {
        command = IMC_CMD_CONNECTION_CONNECT;
      }
      
      ImcCommand* cmd = [[ImcCommand alloc] initWithCommand:command andData:server];
      [controllerThread addCommand:cmd];
    }
      break;
    case IMC_MSG_GET_CONNECTION_NUMBER:
    {
      NSLog(@"GET_CONNECTION_NUMBER");
    }
      break;
    case IMC_MSG_CONNECTION_NEED_RESET:
    {
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:26],
                                                                              @"value": [NSString stringWithString:_channels],
                                                                              @"target": self.reactTag
                                                                              }];
    }
      break;
    case IMC_MSG_LIVE_REQUEST_MAIN_STREAM:
    {
      CGSize smallSize,largeSize;
      [self.mainDisplayVideo getDisplaySize:&smallSize :&largeSize];
      [controllerThread updateDisplaySize:smallSize :largeSize];
      
      for( ImcConnectedServer* server in connectedServerList )
      {
        if ([server.server_address isEqualToString:(NSString*)responseData]) {
          uint64_t displayChannelMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:server.server_address andPort:server.server_port];
          NSInteger fullscreenChannel = [self.mainDisplayVideo fullscreenChannelForServer:server.server_address andPort:server.server_port];
          
          [controllerThread updateMainSubStream:server.server_address :server.server_port :fullscreenChannel];
          
          [controllerThread updateServerDisplayMask:server.server_address :server.server_port :displayChannelMask];
          
          decoderThread.needToResetDecoderForChannelIndex = fullscreenChannel;
          break;
        }
      }
    }
      break;
    case IMC_MSG_LIVE_REQUEST_SUB_STREAM:
    {
      if (self.mainDisplayVideo.fullscreenView != -1 && self.mainDisplayVideo.fullscreenView < [self.mainDisplayVideo getDisplayView].count)
      {
        ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
        if (view.screenIndex >= 0 && view.screenIndex < [self.mainDisplayVideo getDisplayScreens].count)
        {
          ImcScreenDisplay* screen = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
          
          for (ImcConnectedServer* server in connectedServerList) {
            
            if ([server.server_address isEqualToString:(NSString*)responseData])
            {
              uint64_t displayChannelMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:server.server_address andPort:server.server_port];
              
              [controllerThread updateFullscreenChannel: server.server_address :server.server_port :-1];
              [controllerThread updateMainSubStream:server.server_address :server.server_port :-1];
              [controllerThread updateServerDisplayMask:server.server_address :server.server_port :displayChannelMask];
            }
          }
          decoderThread.needToResetDecoderForChannelIndex = screen.channelIndex;
        }
      }
    }
      break;
    case IMC_MSG_DISPLAY_UPDATE_LAYOUT:
    {
      CGSize smallSize,largeSize;
      [self.mainDisplayVideo getDisplaySize:&smallSize :&largeSize];
      [controllerThread updateDisplaySize:smallSize :largeSize];
      [controllerThread updateLayout:self.mainDisplayVideo.currentDiv];
      for( ImcConnectedServer* server in connectedServerList )
      {
        uint64_t displayChannelMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:server.server_address andPort:server.server_port];
        [controllerThread updateServerDisplayMask:server.server_address :server.server_port :displayChannelMask];
      }
    }
      break;
    case IMC_MSG_LIVE_UPDATE_CHANNEL_MASK:
    {
      NSArray* data = (NSArray*)responseData;
      
      if (data.count > 1) {
        ImcConnectedServer* server = (ImcConnectedServer*)[data firstObject];
        uint64_t displayChannelMask = [[data objectAtIndex:1] longLongValue];
        
        [controllerThread updateServerDisplayMask:server.server_address :server.server_port :displayChannelMask];
      }
    }
      break;
    case IMC_MSG_LIVE_VIEW_SETTING_SAVE:
    {
      ImcConnectedServer* activeServer = (ImcConnectedServer*)responseData;
      for(ImcConnectedServer* server in connectedServerList)
      {
        if( [activeServer.server_address isEqualToString:server.server_address] &&
           activeServer.server_port == server.server_port )
        {
          [server updateSetting:activeServer];
          break;
        }
      }
      [controllerThread updateSettingToServer:activeServer];
    }
      break;
    case IMC_MSG_MAIN_VIEW_TO_LIVE_VIEW:
    {
      __block BOOL hasSearchMode = FALSE;
      [connectedServerList enumerateObjectsUsingBlock: ^(id object, NSUInteger idx, BOOL* stop){
        
        if([(ImcConnectedServer*)object hasAvailableSearchChannels])
        {
          hasSearchMode = TRUE;
          *stop = YES;
        }
      }];
      
      if(!hasSearchMode)
      {
        //if live mode
        //Send onchange for event native hide ruler
      }
      
      if(resumeDataInfo.current_mode == PLAYBACK_MODE)
      {
        if(resumeDataInfo.numProcessServer==0)
        {
          if(connectedServerList.count==0) // no connected server
          {
            dispatch_async(dispatch_get_main_queue(), ^{
              
            });
          }
          else
          {
            __block ImcConnectedServer* found_server = nil;
            [connectedServerList enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
              ImcConnectedServer* server = (ImcConnectedServer*)obj;
              if([server.server_address isEqualToString:resumeDataInfo.playbackInfo.selectedSvrAddress] &&
                 server.server_port == resumeDataInfo.playbackInfo.selectedSvrPort )
              {
                found_server = server;
                *stop = true;
              }
            }];
            
            NSMutableArray* newServerList = [NSMutableArray array];
            for (ImcConnectedServer* server in connectedServerList) {
              if (server.serverVersion >= VERSION_3300)
              {
                [newServerList addObject:server];
              }
            }
            
            //Search Mode
            if (newServerList.count == 0)
            {
              [controllerThread startTransferingVideo];
              [self startVideo];
              [decoderThread setVideoMode:LIVE_VIDEO];
              
              return (-1);
            }
            
            self.connectedServers = newServerList;
            [decoderThread setVideoMode:SEARCH_VIDEO];
            self.lastResumeTime = 0;
            
            if(found_server)
            {
              self.currentServer = found_server;
              self.chosenServerIndex = [newServerList indexOfObject:found_server];
              [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_TIME_ZONE fromView:self withData:found_server];
              self.chosenDay = resumeDataInfo.playbackInfo.chosenDay;
              if(resumeDataInfo.playbackInfo.selectedChannelIdx>=0)
              {
                self.lastResumeTime = resumeDataInfo.playbackInfo.lastTimePlay;
                [self fullScreenSearchMode:resumeDataInfo.playbackInfo.selectedChannelIdx];
              }
              else
              {
                self.chosenDay = nil;
                if(resumeDataInfo.playbackInfo.currentTab == PLAYBACK_TAB)
                  [self updateViewForViewIndex];
                self.chosenDay = resumeDataInfo.playbackInfo.chosenDay;
              }
            }
            else
            {
              found_server = [newServerList firstObject];
              self.currentServer = found_server;
              self.chosenServerIndex = [newServerList indexOfObject:found_server];
              [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_TIME_ZONE fromView:self withData:found_server];
            }
          }
          resumeDataInfo.current_mode = CONNECTION_MODE;
        }
      }
      else
      {
        if(resumeDataInfo.currentView == -2 || resumeDataInfo.currentView == 0)
        {
          [self startVideo];
          NSLog(@"Start Video");
          [controllerThread startTransferingVideo];
          NSLog(@"Start Transfering");
        }
        
        if(resumeDataInfo.numProcessServer==0)
          [self performSelector:@selector(disableResumeMode) withObject:nil afterDelay:1.0f];
      }
    }
      break;
    case IMC_MSG_MAIN_VIEW_LIVE_VIEW_RESPONSE:
    {
      NSArray* serverList = (NSArray*)responseData;
      if (serverList.count == 0) {
        resumeDataInfo.currentView = -2;
      }
    }
      break;
    case IMC_MSG_SEARCH_REQUEST_TIME_ZONE:
    {
      ImcConnectedServer* server = (ImcConnectedServer*)responseData;
      [controllerThread sendRequestTimeZoneToServer:server.connectionServerInfo];
    }
      break;
      
    case IMC_MSG_SEARCH_REQUEST_THUMBNAIL:
    {
      NSArray* data = (NSArray*)responseData;
      [controllerThread startTransferingVideoForServer:data];
    }
      break;
      
    case IMC_MSG_SEARCH_REQUEST_TIME_INTERVAL:
    {
      NSArray* data = (NSArray*)responseData;
      
      if (data.count > 2) {
        ImcConnectedServer* server = [data objectAtIndex:0];
        NSDate* chosenDate = [data objectAtIndex:1];
        long timeInterval = [chosenDate timeIntervalSince1970];
        uint64_t channelMask = (uint64_t)[[data objectAtIndex:2] unsignedLongLongValue];
        
        [controllerThread sendSearchCommonMessageToServer:server message:MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL forTimeInterval:timeInterval andChannelMask:channelMask withMainStreamMask:0];
      }
    }
      break;
    case IMC_MSG_SEARCH_REQUEST_STOP:
    {
      NSArray* data = (NSArray*)responseData;
      
      if (data.count > 2) {
        ImcConnectedServer* server = [data objectAtIndex:0];
        long timeInterval = [[data objectAtIndex:1] longValue];
        
        uint64_t channelMask = [[data objectAtIndex:2] unsignedLongLongValue];
        
        if (timeInterval > 0 && channelMask > 0 && server)
        {
          NSLog(@"Request Stop Search Video With Channel Mask:%lld", channelMask);
          [controllerThread sendSearchCommonMessageToServer:server message:MOBILE_MSG_SEARCH_REQUEST_STOP forTimeInterval:timeInterval andChannelMask:channelMask withMainStreamMask:0];
        }
      }
    }
      break;
    case IMC_MSG_SEARCH_RESET_DECODER_FOR_SEARCH:
    {
      decoderThread.needToResetDecoderForChannelIndex = IMC_MAX_CHANNEL-1;
    }
      break;
    case IMC_MSG_SEARCH_REQUEST_SET_POS:
    case IMC_MSG_SEARCH_REQUEST_PLAY_FW:
    case IMC_MSG_SEARCH_REQUEST_STEP_BW:
    case IMC_MSG_SEARCH_REQUEST_STEP_FW:
    case IMC_MSG_SEARCH_REQUEST_SNAPSHOT:
    case IMC_MSG_SEARCH_REQUEST_MAIN_SUB:
    {
      NSArray* data = (NSArray*)responseData;
      
      if (data.count > 2) {
        ImcConnectedServer* server = [data objectAtIndex:0];
        long timeInterVal = [[data objectAtIndex:1] longValue];
        NSNumber* number = [data objectAtIndex:2];
        uint64_t channelMask = (uint64_t)[number unsignedLongLongValue];
        uint64_t mainStreamMask = 0;
        if(data.count > 3)
        {
          number = [data objectAtIndex:3];
          mainStreamMask = (uint64_t)[number unsignedLongLongValue];
        }
        MOBILE_MSG message = MOBILE_MSG_SEARCH_BEGIN;
        if (messageId == IMC_MSG_SEARCH_REQUEST_PLAY_FW)
        {
          message = MOBILE_MSG_SEARCH_REQUEST_PLAY_FW;
        }
        else if (messageId == IMC_MSG_SEARCH_REQUEST_SET_POS)
        {
          message = MOBILE_MSG_SEARCH_REQUEST_SETPOS;
        }
        else if (messageId == IMC_MSG_SEARCH_REQUEST_STEP_BW)
        {
          message = MOBILE_MSG_SEARCH_REQUEST_STEP_BW;
        }
        else if (messageId == IMC_MSG_SEARCH_REQUEST_STEP_FW)
        {
          message = MOBILE_MSG_SEARCH_REQUEST_STEP_FW;
        }
        else if (messageId == IMC_MSG_SEARCH_REQUEST_SNAPSHOT)
        {
          message = MOBILE_MSG_SEARCH_REQUEST_SNAPSHOT;
        }
        else if( messageId == IMC_MSG_SEARCH_REQUEST_MAIN_SUB)
        {
          message = MOBILE_MSG_SEARCH_REQUEST_MAIN_SUB;
        }
        
        [controllerThread sendSearchCommonMessageToServer:server message:message forTimeInterval:timeInterVal andChannelMask:channelMask withMainStreamMask:mainStreamMask];
      }
    }
      break;
      
    case IMC_MSG_SEARCH_CHOSEN_DAY_RESPONSE:
    {
      if(currentServer.serverTimezone==nil)
        [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_TIME_ZONE fromView:self withData:currentServer];
      NSDate* userChosenDay = (NSDate*)responseData;
      NSLog(@"%@", userChosenDay);
      
      lastFrameInterval = 0;
      
      NSDateComponents* chosenDayComponents = nil;
      NSCalendar* calendar = self.AgendaCalendar; //[NSCalendar currentCalendar];
      
      chosenDayComponents = [calendar components:NSCalendarUnitWeekday|NSCalendarUnitDay|NSCalendarUnitMonth|NSCalendarUnitYear | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond fromDate:userChosenDay];
      
      [chosenDayComponents setHour:0];
      [chosenDayComponents setMinute:0];
      [chosenDayComponents setSecond:0];
      
      NSCalendar* serverCalendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
      [serverCalendar setTimeZone:currentServer.serverTimezone];
      
      chosenDay = [serverCalendar dateFromComponents:chosenDayComponents];
      
      __block uint64_t channelMask = 0x00;
      ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
      ImcScreenDisplay* screen = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
      
      [currentServer.channelConfigs enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        if([(ChannelSetting*)obj isSearchable] && ((ChannelSetting*)obj).channelID == screen.channelIndex)
        {
          channelMask |= ((uint64_t)1 << idx);
        }
      }];
      
      NSArray* data = [NSArray arrayWithObjects:currentServer, chosenDay, @(channelMask), nil];
      
      [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_TIME_INTERVAL fromView:self withData:data];
    }
      break;
    case IMC_MSG_SEARCH_UPDATE_TODAY_CELL:
    {
      NSArray* data = (NSArray*)responseData;
    }
      break;
    case IMC_MSG_SEARCH_REQUEST_REFRESH_CALENDAR:
    {
      //do something
    }
      break;
    default:
      break;
  }
  return 1;
}

-(void)disableResumeMode
{
	
  if (connectedServerList.count == 0) {
    for (ImcScreenDisplay* screen in [self.mainDisplayVideo getDisplayScreens]) {
      [self.mainDisplayVideo resetScreen:screen.screenIndex];
    }
  }
  resumeDataInfo.currentView = -2;
  
  
  if (self.mainDisplayVideo.fullscreenView != -1 && self.mainDisplayVideo.fullscreenView < [self.mainDisplayVideo getDisplayView].count && resumeDataInfo.mainStreamChannel)
  {
    ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
    
    if (view.screenIndex >= 0 && view.screenIndex < [self.mainDisplayVideo getDisplayScreens].count) {
      ImcScreenDisplay* screen = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
      
      
      [controllerThread updateMainSubStream:screen.serverAddress :screen.serverPort :screen.channelIndex];
      
      uint64_t displayChannelMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:screen.serverAddress andPort:screen.serverPort];
      
      decoderThread.needToResetDecoderForChannelIndex = screen.channelIndex;
      
      [controllerThread updateServerDisplayMask:screen.serverAddress :screen.serverPort :displayChannelMask];
      
      resumeDataInfo.mainStreamChannel = NO;
    }
  }
}

-(void)updateDataDateList:(NSTimeZone*)serverTimeZone
{
	
  if (currentServer)
  {
    m_numHoursPerDay = HoursPerDay;
    NSArray* dayListInterval = [NSArray arrayWithArray:currentServer.availableDataDateList];
    NSMutableArray* dateList = [NSMutableArray array];
    currentServer.serverTimezone = serverTimeZone;
    
    if (dayListInterval && dayListInterval.count > 0)
    {
      NSCalendar* calendar = [NSCalendar currentCalendar];
      NSCalendar* serverCalendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
      [serverCalendar setTimeZone:currentServer.serverTimezone];
      for (NSNumber* dateInterval in dayListInterval)
      {
        NSDate* date = [NSDate dateWithTimeIntervalSince1970:dateInterval.integerValue];
        NSLog(@"%@",date);
        NSDateComponents* dateComponents = [serverCalendar components:NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay fromDate:date];
        NSDateComponents* todayComponents = [calendar components:NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay fromDate:[NSDate date]];
        
        if (dateComponents.year == todayComponents.year && dateComponents.month == todayComponents.month &&  dateComponents.day == todayComponents.day)
        {
          doesTodayHasData = YES;
        }
        
        NSString* clientDate = [NSString stringWithFormat:@"%zd-%02zd-%02zd",dateComponents.year, dateComponents.month, dateComponents.day];
        //        NSDateFormatter* dateFormat = [[NSDateFormatter alloc] init];
        //        [dateFormat setDateFormat:@"yyyy-MM-dd"];
        //        [dateFormat setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:[currentServer.serverTimezone secondsFromGMT]]];
        //        NSDate* clientDate = [self.AgendaCalendar dateFromComponents:dateComponents];
        //        NSLog(@"ClientDate: %@",clientDate);
        //          [dateList addObject:[dateFormat stringFromDate:clientDate]];
        [dateList addObject:clientDate];
        
      }
      self.dataDateList = [NSArray arrayWithArray:dateList];
    }
    else
    {
      self.dataDateList = nil;
    }
    
    
    if(currentSelectedFullScreenChannel != -1)
    {
      [self fullScreenSearchMode:currentSelectedFullScreenChannel];
      return;
    }
    else
    {
      //[self startStopSpinner:NO];
      //Do something
    }
  }
  
  for (ImcDateInterval* dateInterval in dateIntervalList)
  {
    if (dateInterval.channelIndex == currentSelectedFullScreenChannel && currentSelectedFullScreenChannel >= 0 && chosenChannelIndex < IMC_MAX_CHANNEL)
    {
      chosenChannelIndex = [dateIntervalList indexOfObject:dateInterval];
      return;
    }
  }
  
  run_on_ui_thread(^{
    [self buildRulerDST:_dateTimeRulerDST];
    [self sendDataToReact];
  });
}

- (void)updateViewForViewIndex{
	
  dispatch_async(dispatch_get_main_queue(), ^{
    //NSLog(@"Shark setNeedsDisplay on updateViewForView");
    [m_videoLayer setNeedsDisplay];
  });
  
  if (currentSelectedFullScreenChannel != -1)
  {
    chosenChannelIndex = 0;
    for (ImcDateInterval* di in dateIntervalList) {
      if (di.channelIndex == currentSelectedFullScreenChannel) {
        ImcTimeInterval* ti = [di.timeInterval lastObject];
        if (ti.end > 0 ) {
          long todayInterval = ti.end - 60;
          if(lastResumeTime > 0)
          {
            todayInterval = lastResumeTime;
            lastResumeTime = 0;
          }
          
          uint64_t mainStreamMask = 0x00;
          uint64_t channelMask = ((uint64_t)0x01<<currentSelectedFullScreenChannel);
          if(_isHD == YES)
            mainStreamMask = ((uint64_t)0x01<<currentSelectedFullScreenChannel);
          
          NSArray* data = [NSArray arrayWithObjects:currentServer,@(todayInterval), @(channelMask), @(mainStreamMask), nil];
          
          //[NSThread sleepForTimeInterval:0.01f];
          //[self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_SET_POS fromView:self withData:data];
          [NSThread sleepForTimeInterval:0.0001f];
          [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_PLAY_FW fromView:self withData:data];
          videoPlayerStatus = STATE_PAUSE;
        }
        break;
      }
      chosenChannelIndex++;
    }
  }
  else if (dateIntervalList.count > 0)
  {
    m_delayPlayback = NO;
    uint64_t channelMask = 0;
    long timeInterval = 0;
    
    if (chosenChannelIndex == -1) {
      ImcDateInterval* firstChannel = [dateIntervalList firstObject];
      
      channelMask = ((uint64_t)0x01<<firstChannel.channelIndex);
      ImcTimeInterval* ti = [firstChannel.timeInterval firstObject];
      
      timeInterval = ti.begin;
      chosenChannelIndex = 0;
      videoPlayerStatus = STATE_PAUSE;
    }
    else if (chosenChannelIndex >= 0 && chosenChannelIndex < dateIntervalList.count)
    {
      ImcDateInterval* chosenDayInterval = [dateIntervalList objectAtIndex:chosenChannelIndex];
      
      channelMask = ((uint64_t)0x01<<chosenDayInterval.channelIndex);
      timeInterval = ((ImcTimeInterval*)[chosenDayInterval.timeInterval firstObject]).begin;
      videoPlayerStatus = STATE_PAUSE;
    }
    uint64_t mainStreamMask = channelMask;
    NSArray* data = [NSArray arrayWithObjects:currentServer,@(timeInterval), @(channelMask), @(mainStreamMask),nil];
    
    [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_SET_POS fromView:self withData:data];
    [NSThread sleepForTimeInterval:0.0001f];
    [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_PLAY_FW fromView:self withData:data];
  }
}

-(void)addThumbnailImage:(DisplayedVideoFrame*)videoFrame
{
	
  NSArray*allKeys = [channelsSearchDictionary allKeys];
  NSMutableArray* channelListNeedToDisplay = [NSMutableArray array];
  NSInteger sourceIndex = -1;
  
  if ([currentServer.server_address isEqualToString:videoFrame.serverAddress]) {
    
    for (ChannelSetting* channel in currentServer.channelConfigs) {
      
      if (sourceIndex == -1)
      {
        if (channel.channelID == videoFrame.channelIndex) {
          sourceIndex = channel.videoSourceInput;
          break;
        }
      }
    }
    
    if (sourceIndex != -1) {
      for (ChannelSetting* channel in currentServer.channelConfigs) {
        if (channel.videoSourceInput == sourceIndex) {
          [channelListNeedToDisplay addObject:@(channel.channelID)];
        }
      }
    }
  }
  
  if([channelListNeedToDisplay count] == 0)
    return;
  
  
  BOOL thumbnailAdded = NO;
  for (NSString*key in allKeys)
  {
    NSArray* data = [channelsSearchDictionary valueForKey:key];
    
    if (data.count > 0) {
      NSInteger channelIndex = [[data objectAtIndex:0] integerValue];
      
      for (NSNumber* videoChannelIndex in channelListNeedToDisplay) {
        
        if (channelIndex == videoChannelIndex.integerValue && [currentServer.server_address isEqualToString:videoFrame.serverAddress])
        {
          NSArray* newData = [NSArray arrayWithObjects:@(channelIndex), videoFrame.videoFrame, nil];
          [channelsSearchDictionary setValue:newData forKey:key];
          thumbnailAdded = YES;
        }
      }
    }
  }
  if(thumbnailAdded)
  {
    run_on_ui_thread(^{
      [channelListCollectonView reloadData];
    });
  }
}

-(void)SearchMode{
	
  [controllerThread stopTransferingVideo];
  [self invalidateIdleTimer];
  [decoderThread setVideoMode:NO_VIDEO];
  
  NSMutableArray* newServerList = [NSMutableArray array];
  for (ImcConnectedServer* server in connectedServerList) {
    if (server.serverVersion >= VERSION_3300)
    {
      [newServerList addObject:server];
    }
  }
  
  self.connectedServers = newServerList;
  
  //Search Mode
  if (self.connectedServers.count == 0)
  {
    [controllerThread startTransferingVideo];
    [self startVideo];
    [decoderThread setVideoMode:LIVE_VIDEO];
  }
  
  [decoderThread setVideoMode:SEARCH_VIDEO];
  if (self.mainDisplayVideo.fullscreenView != -1 && self.mainDisplayVideo.fullscreenView < self.mainDisplayVideo.getDisplayScreens.count)
  {
    ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
    ImcScreenDisplay* screen = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
    NSString* serverAddress = screen.serverAddress;
    
    if (connectedServers && connectedServers.count > 0)
    {
      BOOL isExistedServer = NO;
      __block BOOL displayFullscreen = NO;
      for (ImcConnectedServer* server in newServerList) {
        if ([server.server_address isEqualToString:serverAddress])
        {
          self.currentServer = server;
          self.chosenServerIndex = [connectedServerList indexOfObject:server];
          
          [server.channelConfigs enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
            if([(ChannelSetting*)obj isSearchable] && ((ChannelSetting*)obj).channelID == screen.channelIndex)
            {
              [self fullScreenSearchMode:screen.channelIndex];
              displayFullscreen = YES;
              *stop = TRUE;
            }
          }];
          break;
        }
      }
      
      if (isExistedServer) {
        if (!currentServer) {
          currentServer = [connectedServers lastObject];
          chosenServerIndex = connectedServers.count - 1;
        }
        else
        {
          currentServer = [connectedServers lastObject];
          chosenServerIndex = connectedServers.count - 1;
        }
      }
    }
    
    if (currentServer)
    {
      [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_TIME_ZONE fromView:self withData:currentServer];
    }
  }
}

-(BOOL)noRecordDataDay
{
	
  bool noRecordedData = (currentServer == nil || currentServer.availableDataDateList.count ==0);// (dayListInterval==NULL || dayListInterval.count==0);
  if(noRecordedData)
  {
    /* Display the error to the user. */
    [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                            @"msgid": [NSNumber numberWithUnsignedInteger:12],
                                                                            @"target": self.reactTag
                                                                            }];
    return YES;
  }
  return NO;
}

-(void)onChangeSearchDate{
	
  NSDate* chosenDay = _dateTimeSearch;
  NSCalendar* serverCalendar = [[NSCalendar currentCalendar] copy];
  
  NSDateComponents *components = [serverCalendar components:NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear| NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond fromDate:chosenDay];
  
  [components setHour:0];
  [components setMinute:0];
  [components setSecond:0];
  
  chosenDay = [self.AgendaCalendar dateFromComponents:components];

  [self handleResponseMessage:IMC_MSG_SEARCH_CHOSEN_DAY_RESPONSE fromView:self withData:chosenDay];
}

-(void)fullScreenSearchMode:(NSInteger)channelIndex
{
	
  if(currentSelectedFullScreenChannel == -1)
  {
    [self handleResponseMessage:IMC_MSG_SEARCH_RESET_DECODER_FOR_SEARCH fromView:self withData:nil];
    currentSelectedFullScreenChannel = channelIndex;
    [dateIntervalList removeAllObjects];
    return;
  }
  
  if([self noRecordDataDay])
  {
    return;
  }
  
  if (channelIndex >= 0 && channelIndex < IMC_MAX_CHANNEL)
  {
    if(chosenDay!=nil)
    {
      __block uint64_t channelMask = 0x00;
      ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
      ImcScreenDisplay* screen = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
      
      [currentServer.channelConfigs enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        if([(ChannelSetting*)obj isSearchable] && ((ChannelSetting*)obj).channelID == screen.channelIndex)
        {
          channelMask |= ((uint64_t)1 << idx);
        }
      }];
      
      NSArray* data = [NSArray arrayWithObjects:currentServer, chosenDay, @(channelMask), nil];
      [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_TIME_INTERVAL fromView:self withData:data];
    }
    else
    {
      NSDate* userChosenDay = _dateTimeSearch;
      NSCalendar* serverCalendar = [[NSCalendar currentCalendar] copy];
      
      NSDateComponents *components = [serverCalendar components:NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear| NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond fromDate:userChosenDay];
      
      [components setHour:0];
      [components setMinute:0];
      [components setSecond:0];
      
      userChosenDay = [self.AgendaCalendar dateFromComponents:components];
//      BOOL hasRecordData = false;
      
//      if(!hasRecordData)
//      {
//        // get last day had data
//        NSArray* dayListInterval = [NSArray arrayWithArray:currentServer.availableDataDateList];
//
//        if (dayListInterval && dayListInterval.count > 0)
//        {
//          NSNumber* dateInterval = (NSNumber*)[dayListInterval objectAtIndex:dayListInterval.count-1];
//          userChosenDay = [NSDate dateWithTimeIntervalSince1970:dateInterval.integerValue];
//        }
//
//        NSCalendar* serverCalendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
//        [serverCalendar setTimeZone:currentServer.serverTimezone];
//
//        NSDateComponents *components = [serverCalendar components:NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear| NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond fromDate:userChosenDay];
//
//        [components setHour:0];
//        [components setMinute:0];
//        [components setSecond:0];
//        userChosenDay = [self.AgendaCalendar dateFromComponents:components];
//      }
      
      if (userChosenDay) {
//        [self setDateTimeSearch:userChosenDay];
        [self handleResponseMessage:IMC_MSG_SEARCH_CHOSEN_DAY_RESPONSE fromView:self withData:userChosenDay];
      }
    }
  }
}

-(void)startVideo
{
	
  [mainDisplayVideo startUpdateFrameRateTimer];
}

- (int)handleCommand:(NSInteger)command :(id)parameter
{
	
  switch (command) {
    case IMC_CMD_CONNECTION_CONNECT_SUCCESSFULL:
      NSLog(@"GOND IMC_CMD_CONNECTION_CONNECT_SUCCESSFULL");
//      for( ImcConnectedServer* server in connectedServerList )
//        [controllerThread updateServerDisplayMask:server.server_address :server.server_port :[self getChannelMask]];
      break;
    case IMC_CMD_CONNECTION_CONNECT_RESPONSE :
    {
      ImcConnectionStatus* status = (ImcConnectionStatus*)parameter;
      ImcConnectedServer* server = (ImcConnectedServer*)status.remoteConnection;
      if(resumeDataInfo.numProcessServer>0)
        resumeDataInfo.numProcessServer--;
      if( status.connectionStatus == LOGIN_STATUS_SUCCEEDED )
      {
        BOOL needToAdd = TRUE;
        for (ImcConnectedServer* connectedServer in connectedServerList) {
          if ([connectedServer.server_address isEqualToString:server.server_address]) {
            //Update server version from parse header
            connectedServer.serverVersion = server.serverVersion;
            connectedServer.connected = TRUE;
            needToAdd = FALSE;
            break;
          }
        }
        
        if (needToAdd) {
          [connectedServerList addObject:server];
        }
        
        [self responseConnectingServer:server :status.connectionStatus];
        [controllerThread sendRequestTimeZoneToServer:server];
      }
      else
      {
        NSString* serverAddress = @"";
        
        if ([server isMemberOfClass:[ImcRemoteConnection class]])
        {
          serverAddress = ((ImcRemoteConnection*)server).serverInfo.server_address;
        }
        else
        {
          serverAddress = server.server_address;
        }
        
        for (ImcConnectedServer* connectedServer in connectedServerList) {
          if ([serverAddress isEqualToString:connectedServer.server_address]) {
            
            [connectedServerList removeObject:connectedServer];
            //needToRemove = YES;
            break;
          }
        }
        if (resumeDataInfo.currentView != -2) {
          resumeDataInfo.currentView = -2;
        }
        
        if(server)
          [resumeDataInfo getChannelMappingOfConnectedServer:server];
        
        [self responseConnectingServer:server :status.connectionStatus];
      }
      
    }
      break;
    case IMC_CMD_CONNECTION_CONNECT_ERROR:
    {
      [self handleResponseMessage:IMC_MSG_CONNECTION_NEED_RESET fromView:nil withData:nil];
    }
      break;
    case IMC_CMD_START_TRANSFER_VIDEO_FOR_SERVER_RESPONSE:
    {
      NSArray* data = (NSArray*)parameter;
      
      if (data.count > 1) {
        ImcConnectedServer* server = [data objectAtIndex:0];
        uint64_t displayChannelMask = [[data objectAtIndex:1] unsignedLongLongValue];
        
        [controllerThread updateServerDisplayMask:server.server_address :server.server_port :displayChannelMask];
      }
    }
      break;
    case IMC_CMD_UPDATE_SETTING_TO_GUI:
    {
      ImcConnectedServer* updatedServer = parameter;
      
      for(ImcConnectedServer* server in connectedServerList )
      {
        if( [server.server_address isEqualToString:updatedServer.server_address] && (server.server_port == updatedServer.server_port) )
        {
          currentServer = server;
        }
      }
      // channel mapping
      ImcChannelMapping* newChannelMapping = nil;
      
      // create default channel mapping for new server
      if( newChannelMapping == nil )
      {
        newChannelMapping = [[ImcChannelMapping alloc] initWithServerAddress:updatedServer.server_address withPort:updatedServer.server_port andNumOfChannels:updatedServer.maxChannelSupport];
        newChannelMapping.serverName = updatedServer.serverName;
        
        if( [self.mainDisplayVideo fillAndUpdateDisplayChannel:newChannelMapping])
          [channelsMapping addObject:newChannelMapping];
      }
      else
        [self.mainDisplayVideo updateDisplayChannel:newChannelMapping];
      
      NSUInteger index = 0;
//      NSArray* channelList = [_channels componentsSeparatedByString:@","];
      for (ImcScreenDisplay* screen in  [self.mainDisplayVideo getDisplayScreens]) {
        if([screen.serverAddress isEqualToString:updatedServer.server_address] &&
           (screen.serverPort == updatedServer.server_port) && index < channelList.count)
//          screen.channelIndex = [_channels intValue];
          screen.channelIndex = [[channelList objectAtIndex:index] intValue];
      }
      
      uint64_t channelDisplayMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:updatedServer.server_address andPort:updatedServer.server_port];
//      for(NSString* ch in channelList)
//      {
//        channelDisplayMask |= ((uint64_t)0x01<<[ch intValue]);
//      }
      
      CGSize smallSize,largeSize;

      [self.mainDisplayVideo getDisplaySize:&smallSize :&largeSize];
      [controllerThread updateDisplaySize:smallSize :largeSize];
      [controllerThread updateServerDisplayMask:updatedServer.server_address :updatedServer.server_port :channelDisplayMask];
    }
      break;
    case IMC_CMD_UPDATE_CHANNEL_CONFIG:
    {
      ImcChannelConfig* guiChannelConfig = (ImcChannelConfig*)parameter;
      
      for(ImcConnectedServer* server in connectedServerList )
      {
        if( [server.server_address isEqualToString:guiChannelConfig.serverAddress] &&
           (server.server_port == guiChannelConfig.serverPort) )
        {
          
          if (((ChannelSetting*)[server.channelConfigs objectAtIndex:0]).channelID == -1) {
            [server setfirstChannelConfigs:guiChannelConfig.channelConfigs];
          }
          
          [server updateChannelConfigs:guiChannelConfig.channelConfigs];
          
          //Check Permission
          [self responseCheckPermission:server];
          
          uint64_t channelDisplayMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:server.server_address andPort:server.server_port];
          
          [controllerThread updateServerDisplayMask:server.server_address :server.server_port :channelDisplayMask];
          
          break;
        }
      }
      
      for( ImcChannelMapping* channelMapping in channelsMapping )
      {
        if( [channelMapping.serverAddress isEqualToString:guiChannelConfig.serverAddress] &&
           channelMapping.serverPort == guiChannelConfig.serverPort )
        {
          [self.mainDisplayVideo updateChannelMapping:channelMapping channelConfigs:nil];
          
          break;
        }
      }
      
      if(_isSeacrh == NO){
        if (connectedServerList.count > 0) {
          [controllerThread startTransferingVideo];
          [self startVideo];
          [decoderThread setVideoMode:LIVE_VIDEO];
        }
        else
        {
          return NO;
        }
      }
      else {
        dispatch_async(dispatch_get_main_queue(), ^{
          self.layer.contents = searchFrameImage;
          //NSLog(@"Shark setNeedsDisplay on handle command channel config");
          [self.layer setNeedsDisplay];
          [videoView setNeedsDisplay];
          [self SearchMode];
        });
      }
      
      //lvxt
      [self handleResponseMessage:IMC_MSG_MAIN_VIEW_TO_LIVE_VIEW fromView:self withData:nil];
      [self handleResponseMessage:IMC_MSG_LIVE_REQUEST_SUB_STREAM fromView:self withData:guiChannelConfig.serverAddress];
    }
      break;
    case IMC_CMD_SERVER_SEND_SETTINGS_SUCCESSFUL:
      NSLog(@"Send setting successful");
      break;
    case IMC_CMD_CONNECTION_DISCONNECT_RESPONSE:
    {
      ImcConnectedServer* disconnectedServer = parameter;
      ImcConnectedServer* foundServer = nil;
      for ( int index = 0; index < connectedServerList.count; index++ )
      {
        ImcConnectedServer* server = [connectedServerList objectAtIndex:index];
        if( [server.server_address isEqualToString:disconnectedServer.server_address] &&
           server.server_port == disconnectedServer.server_port )
        {
          foundServer = server;
          break;
        }
      }
      
      if( foundServer)
      {
        
        [self.mainDisplayVideo removeScreenForServer:foundServer.server_address andPort:foundServer.server_port];
        [connectedServerList removeObject:foundServer];
        dispatch_async(dispatch_get_main_queue(), ^{
          [self onShowDisconnectedMsg:foundServer];
        });
        
        
        if (connectedServerList.count == 0) {
          dispatch_async(dispatch_get_main_queue(), ^{
            //do something
          });
        }
        else
        {
          //Disable Search And Tab if neccessay
          BOOL hasSearchMode = NO;
          
          for (ImcConnectedServer* server in connectedServerList) {
            if (server.serverVersion >= VERSION_3300) {
              hasSearchMode = YES;
              break;
            }
          }
          
          if (!hasSearchMode) {
            dispatch_async(dispatch_get_main_queue(), ^{
              //do something
            });
          }
          else
          {
            dispatch_async(dispatch_get_main_queue(), ^{
              //do something
            });
          }
          
        }
      }
      else
      {
        BOOL didConnect = NO;
        for (ImcScreenDisplay* screen in [self.mainDisplayVideo getDisplayScreens]) {
          if ([screen.serverAddress isEqualToString:disconnectedServer.server_address]) {
            didConnect = YES;
            break;
          }
        }
        
        if (didConnect) {
          
          [self.mainDisplayVideo removeScreenForServer:disconnectedServer.server_address andPort:disconnectedServer.server_port];
          [connectedServerList removeObject:disconnectedServer];
          [self onShowDisconnectedMsg:disconnectedServer];
          
          //Change to MainView Tab
          if (connectedServerList.count == 0)
          {
            dispatch_async(dispatch_get_main_queue(), ^{
              /* Display the error to the user. */
              [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                      @"msgid": [NSNumber numberWithUnsignedInteger:9],
                                                                                      @"target": self.reactTag
                                                                                      }];
              //do something
            });
          }
          else
          {
            //Disable Search And Tab if neccessay
            BOOL hasSearchMode = NO;
            
            for (ImcConnectedServer* server in connectedServerList) {
              if (server.serverVersion >= VERSION_3300) {
                hasSearchMode = YES;
                break;
              }
            }
            
            if (!hasSearchMode) {
              dispatch_async(dispatch_get_main_queue(), ^{
                //do something
              });
            }
            else
            {
              dispatch_async(dispatch_get_main_queue(), ^{
                //do something
              });
            }
          }
        }
        else
        {
          [self responseConnectingServer:disconnectedServer :LOGIN_STATUS_CANNOT_CONNECT];
          if (connectedServerList.count == 0) {
            dispatch_async(dispatch_get_main_queue(), ^{
              //do something
            });
          }
        }
      }
    }
      break;
    case IMC_CMD_DISPLAY_GET_CURRENT_LAYOUT:
      break;
    case IMC_CMD_DISPLAY_GET_VIEW_RESOLUTION:
      break;
    case IMC_CMD_MOBILE_SEND_SETTINGS:
      break;
    case IMC_CMD_DISPLAY_VIDEO:
    {
      //@autoreleasepool
      {
        DisplayedVideoFrame* videoFrame = (DisplayedVideoFrame*)parameter;
        
        if (_isSeacrh == YES)
        {
          if (videoFrame.frameMode == SEARCH_VIEW){
            @autoreleasepool
            {
              //NSLog(@"Shark start search");
              [self addSearchVideoFrame:videoFrame];
            }
          }
        }
        else
        {
          if (videoFrame.frameMode == SNAPSHOT) {
            
            for (ImcConnectedServer* server in connectedServerList) {
              if ([server.server_address isEqualToString:videoFrame.serverAddress]) {
                if (videoFrame.channelIndex >= 0 && videoFrame.channelIndex < server.channelConfigs.count) {
                  ChannelSetting* setting = (ChannelSetting*)[server.channelConfigs objectAtIndex:videoFrame.channelIndex];
                  
                  i3SnapshotInfo* snapshotInfo = [[i3SnapshotInfo alloc] init];
                  
                  snapshotInfo.snapshotFilename = [NSString stringWithFormat:@"%@_%@_%ld_%ld",server.serverName,setting.channelName,(long)videoFrame.resolutionWidth,(long)videoFrame.resolutionHeight];
                  snapshotInfo.snapshotImage = videoFrame.videoFrame;
                  
                  [self handleCommand:IMC_CMD_DISPLAY_RESPONSE_SNAPSHOT:snapshotInfo];
                }
              }
            }
          }
          else if (videoFrame.frameMode == LIVE_VIEW)
          {
            //NSLog(@"Shark start live");
            [self addVideoFrame:videoFrame];
          }
        }
      }
      
    }
      break;
      
    case IMC_CMD_DECODE_FRAME:
    {
      NSArray* frameInfo = (NSArray*)parameter;
      if (frameInfo && frameInfo.count > 4)
      {
        
        NSString* serverAddress = [frameInfo objectAtIndex:0];
        NSInteger channelIndex = [(NSNumber*)[frameInfo objectAtIndex:1] integerValue];
        NSInteger subMainStream = [(NSNumber*)[frameInfo objectAtIndex:2] integerValue];
        NSInteger resolutionHeight = [(NSNumber*)[frameInfo objectAtIndex:3] integerValue];
        NSInteger resolutionWidth = [(NSNumber*)[frameInfo objectAtIndex:4] integerValue];
        
        //NSMutableArray* channelList = [NSMutableArray array];
        NSMutableArray* channelListNeedToDisplay = [NSMutableArray array];
        NSInteger sourceIndex = -1;
        
        for (ImcConnectedServer* server in connectedServerList) {
          if ([server.server_address isEqualToString:serverAddress]) {
            
            for (ChannelSetting* channel in server.channelConfigs) {
              
              if (sourceIndex == -1)
              {
                if (channel.channelID == channelIndex)
                {
                  sourceIndex = channel.videoSourceInput;
                  break;
                }
              }
            }
            
            if (sourceIndex != -1) {
              for (ChannelSetting* channel in server.channelConfigs) {
                if (channel.videoSourceInput == sourceIndex) {
                  [channelListNeedToDisplay addObject:@(channel.channelID)];
                }
              }
            }
            break;
          }
        }
        
        if (self.mainDisplayVideo.fullscreenView == -1)
        {
          for (ImcScreenDisplay* screen in [self.mainDisplayVideo getDisplayScreens])
          {
            if (screen.channelIndex != -1 && [screen.serverAddress isEqualToString:serverAddress] && [channelListNeedToDisplay containsObject:@(screen.channelIndex)])
            {
              
              if (resolutionHeight > -1 && resolutionWidth > -1) {
                screen.resolutionHeight = resolutionHeight;
                screen.resolutionWidth = resolutionWidth;
              }
              
              if (subMainStream == 1)
              {
                //screen.hasSubStream = NO;
                screen.isSubStream = NO;
                
                if (self.mainDisplayVideo.fullscreenView > -1 && !screen.needMainStream)
                {
                  screen.needMainStream = YES;
                }
              }
              else
              {
                screen.hasSubStream = YES;
                screen.isSubStream = YES;
              }
            }
          }
        }
        else if (self.mainDisplayVideo.fullscreenView >= 0 && self.mainDisplayVideo.fullscreenView < [self.mainDisplayVideo getDisplayView].count)
        {
          //Fullscreen Mode
          ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
          if (view.screenIndex >= 0 && view.screenIndex < [self.mainDisplayVideo getDisplayScreens].count)
          {
            ImcScreenDisplay* screen = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
            
            if (screen.channelIndex != -1 && [screen.serverAddress isEqualToString:serverAddress] && [channelListNeedToDisplay containsObject:@(screen.channelIndex)])
            {
              
              if (resolutionHeight > -1 && resolutionWidth > -1) {
                screen.resolutionHeight = resolutionHeight;
                screen.resolutionWidth = resolutionWidth;
              }
              
              if (subMainStream == 1)
              {
                //screen.hasSubStream = NO;
                screen.isSubStream = NO;
                
                if (self.mainDisplayVideo.fullscreenView > -1 && !screen.needMainStream && view.screenIndex == screen.screenIndex && !screen.hasSubStream)
                {
                  screen.needMainStream = YES;
                }
              }
              else
              {
                screen.hasSubStream = YES;
                screen.isSubStream = YES;
              }
            }
          }
        }
      }
    }
      break;
    case IMC_CMD_SERVER_CHANGE_INFO:
    {
      /* Display the error to the user. */
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:15],
                                                                              @"target": self.reactTag
                                                                              }];
    }
      break;
    case IMC_CMD_SERVER_CHANGED_CURRENT_USER:
    {
      /* Display the error to the user. */
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:14],
                                                                              @"target": self.reactTag
                                                                              }];
    }
      break;
    case IMC_CMD_SERVER_CHANGED_PORTS:
    {
      disconnectWarning.message = [NSString stringWithFormat:NSLocalizedString(@"Message.ModifiedServerInfo.Content", nil), ((ImcConnectedServer*)parameter).serverName];
      disconnectWarning.server = ((ImcConnectedServer*)parameter);
      
      /* Display the error to the user. */
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:16],
                                                                              @"target": self.reactTag
                                                                              }];
    }
      break;
    case IMC_CMD_SEARCH_UPDATE_DATA_DATE:
    {
      ImcConnectedServer* updatedServer = parameter;
      for (ImcConnectedServer* server in connectedServerList) {
        if ([server.server_address isEqualToString:updatedServer.server_address]) {
          server.serverTimezone = updatedServer.serverTimezone;
          server.availableDataDateList = updatedServer.availableDataDateList;
          currentServer = server;
        }
      }
      [self updateDataDateList:(NSTimeZone*)updatedServer.serverTimezone];
      /* Display the error to the user. */
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:20],
                                                                              @"value":[NSArray arrayWithArray:self.dataDateList],
                                                                              @"target": self.reactTag
                                                                              }];
      //do something
    }
      break;
    case IMC_CMD_SEARCH_UPDATE_CHANNEL_LIST_IN_DATE:
    {
      ImcAllDateInterval* allDateInterval = (ImcAllDateInterval*)parameter;
      [self updateChannelsInDate:allDateInterval];
      //do something
    }
      break;
    case IMC_CMD_SEARCH_STOP_RESPONSE:
    {
      ImcRemoteConnection* server = (ImcRemoteConnection*)parameter;
      if ([server.serverInfo.server_address isEqualToString:self.currentServer.server_address]) {
        if (videoPlayerStatus == STATE_PLAY) {
          //do something
        }
      }
    }
      break;
    case IMC_CMD_UPDATE_SETTING_SERVER:
    {
      ImcConnectedServer* updatedServer = parameter;
      for (ImcConnectedServer* server in connectedServerList) {
        if ([server.server_address isEqualToString:updatedServer.server_address]) {
          server.serverTimezone = updatedServer.serverTimezone;
          currentServer = server;
        }
      }
    }
      break;
    case IMC_CMD_UPDATE_SUB_STREAM_STATUS:
    {
      NSArray* channelInfo = (NSArray*)parameter;
      
      if (channelInfo.count > 1) {
        NSString* serverAddress = (NSString*)[channelInfo objectAtIndex:0];
        NSInteger channelIndex = (NSInteger)[channelInfo objectAtIndex:1];
        
        
        //NSMutableArray* channelList = [NSMutableArray array];
        NSMutableArray* channelListNeedToDisplay = [NSMutableArray array];
        NSInteger sourceIndex = -1;
        
        for (ImcConnectedServer* server in connectedServerList) {
          if ([server.server_address isEqualToString:serverAddress]) {
            
            //channelList = [NSMutableArray arrayWithArray:server.channelConfigs];
            
            for (ChannelSetting* channel in server.channelConfigs) {
              
              if (sourceIndex == -1) {
                {
                  if (channel.channelID == channelIndex) {
                    sourceIndex = channel.videoSourceInput;
                    break;
                  }
                }
              }
            }
            
            if (sourceIndex != -1) {
              for (ChannelSetting* channel in server.channelConfigs) {
                if (channel.videoSourceInput == sourceIndex) {
                  [channelListNeedToDisplay addObject:@(channel.channelID)];
                }
              }
            }
            
            break;
          }
        }
        
        for (ImcScreenDisplay* screen in [self.mainDisplayVideo getDisplayScreens])
        {
          if ([screen.serverAddress isEqualToString: serverAddress] && [channelListNeedToDisplay containsObject:@(screen.channelIndex)]) {
            screen.hasSubStream = YES;
          }
        }
      }
    }
      break;
    case IMC_CMD_DISCONNECT_VIDEO:
    {
      NSString* serverAddress = (NSString*)parameter;
      
      if (_isSeacrh == YES) {
        if ([self.currentServer.server_address isEqualToString:serverAddress] && videoPlayerStatus == STATE_PLAY)
        {
          videoPlayerStatus = STATE_STOP;
        }
      }
    }
      break;
    case IMC_CMD_FIRST_MAIN_STREAM_FRAME:
    {
      if (self.mainDisplayVideo.fullscreenView >= 0 && self.mainDisplayVideo.fullscreenView < [self.mainDisplayVideo getDisplayView].count)
      {
        ImcViewDisplay* view = [[self.mainDisplayVideo getDisplayView] objectAtIndex:self.mainDisplayVideo.fullscreenView];
        if (view.screenIndex >= 0 && view.screenIndex < [self.mainDisplayVideo getDisplayScreens].count && ((NSArray*)parameter).count > 1)
        {
          
          ImcScreenDisplay* screen  = [[self.mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
          
          NSString* serverAddress = [(NSArray*)parameter objectAtIndex:0];
          NSInteger channelIndex  = [(NSNumber*)[(NSArray*)parameter objectAtIndex:1] integerValue];
          
          //NSMutableArray* channelList = [NSMutableArray array];
          NSMutableArray* channelListNeedToDisplay = [NSMutableArray array];
          NSInteger sourceIndex = -1;
          
          for (ImcConnectedServer* server in connectedServerList) {
            if ([server.server_address isEqualToString:serverAddress]) {
              
              //channelList = [NSMutableArray arrayWithArray:server.channelConfigs];
              
              for (ChannelSetting* channel in server.channelConfigs) {
                
                if (sourceIndex == -1) {
                  {
                    if (channel.channelID == channelIndex) {
                      sourceIndex = channel.videoSourceInput;
                      break;
                    }
                  }
                }
              }
              
              if (sourceIndex != -1) {
                for (ChannelSetting* channel in server.channelConfigs) {
                  if (channel.videoSourceInput == sourceIndex) {
                    [channelListNeedToDisplay addObject:@(channel.channelID)];
                  }
                }
              }
              
              break;
            }
          }
          
          if (((NSArray*)parameter).count > 2)
          {
            //do something
          }
          else if ([screen.serverAddress isEqualToString:serverAddress] && [channelListNeedToDisplay containsObject:@(screen.channelIndex)] && channelIndex != -1 && (!screen.hasSubStream))
          {
            //            [liveViewController changeSubToMainStreamStatus];
            [controllerThread updateMainSubStreamResponse:YES];
            
            uint64_t displayChannelMask = [self getChannelMask]; // [self.mainDisplayVideo getDisplayChannelForServer:screen.serverAddress andPort:screen.serverPort];
            [controllerThread updateServerDisplayMask:screen.serverAddress :screen.serverPort :displayChannelMask];
          }
        }
      }
      
    }
      break;
    default:
      break;
      
  }
  return 1;
}

//-(UIImage*)getScaledImage
-(UIImage*)geScaledSearchImage
{
	
  float scaleXY = mainDisplayVideo.scaleXY;
  int translateX = mainDisplayVideo.translateX;
  int translateY = mainDisplayVideo.translateY;
  int playerWidth = mainDisplayVideo.playerWidth;
  int playerHeight = mainDisplayVideo.playerHeight;
  
  CGRect fullScaled = CGRectMake(0, 0, searchFrameImage.size.width, searchFrameImage.size.height);
  
  //apply zoom
  CGRect cropScaled = CGRectInset(fullScaled, searchFrameImage.size.width/2 - searchFrameImage.size.width/scaleXY/2, searchFrameImage.size.height/2 - searchFrameImage.size.height/scaleXY/2);
  
  NSLog(@"translate %d %d - %d %d", translateX, translateY, playerWidth, playerHeight);
  
  //apply translate
  cropScaled.origin.x = -translateX*searchFrameImage.size.width/scaleXY/playerWidth;
  cropScaled.origin.y = -translateY*searchFrameImage.size.height/scaleXY/playerHeight;
  
  CGImageRef drawImg = CGImageCreateWithImageInRect(searchFrameImage.CGImage, cropScaled);
  
  UIImage *imageOut = [UIImage imageWithCGImage:drawImg];
  return imageOut;
}

-(void)drawLayer:(CALayer *)layer inContext:(CGContextRef)ctx
{
	
  NSLog(@"GOND drawLayer -1");
  //NSLog(@"Shark drawLayer Search searchFrameImage");
  UIGraphicsPushContext(ctx);
  if (searchFrameImage && (searchFrameImage.CIImage || searchFrameImage.CGImage) )
  {
//    [searchFrameImage drawInRect:videoView.bounds];
    UIImage *scaledImage = [self geScaledSearchImage];
    [scaledImage drawInRect:videoView.bounds];
  }
  UIGraphicsPopContext();
}

//lvxt note: double check the synchronization of video frame fetching and display
-(void)addSearchVideoFrame:(DisplayedVideoFrame*)frame
{
	
  DisplayedVideoFrame* displayFrame = (DisplayedVideoFrame*)frame;
  if (displayFrame.videoFrame && (displayFrame.videoFrame.CGImage || displayFrame.videoFrame.CIImage))
  {
    if (videoPlayerStatus == STATE_STOP)
    {
      //NSLog(@"Shark Wrong status");
      return;
    }
    if (chosenChannelIndex != -1 && displayFrame.frameTime)
    {
      NSCalendar* calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
      [calendar setTimeZone:currentServer.serverTimezone];
      unsigned unitFlags = NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear| NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
      NSDateComponents *components = [calendar components:unitFlags fromDate:displayFrame.frameTime];
      NSString* timeTextLabel = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",components.year, components.month, components.day, components.hour, components.minute, components.second];

      if(m_dayType==BEGIN_DAYLIGHT&&[currentServer.serverTimezone isDaylightSavingTimeForDate:displayFrame.frameTime])
      {
         components.hour = [components hour] - 1;
      }
      else if(m_dayType==END_DAYLIGHT&&![currentServer.serverTimezone isDaylightSavingTimeForDate:displayFrame.frameTime])
      {
         components.hour = [components hour] + 1;
      }
      
      NSDateComponents *chosenDayComponents = [calendar components:unitFlags fromDate:chosenDay];
      if (!(components.year == chosenDayComponents.year && components.month == chosenDayComponents.month && components.day == chosenDayComponents.day))
      {
        NSLog(@"frameDay: %zd-%zd-%zd %zd:%zd:%zd",components.day,components.month,components.year,components.hour,components.minute,components.second);
        NSLog(@"choseDay: %zd-%zd-%zd %zd:%zd:%zd",chosenDayComponents.day,chosenDayComponents.month,chosenDayComponents.year,chosenDayComponents.hour,chosenDayComponents.minute,chosenDayComponents.second);
        return;
      }
      
      if (!(chosenChannelIndex >= 0 && chosenChannelIndex < dateIntervalList.count)) {
        return;
      }
      
      ImcDateInterval* dateInterval = [dateIntervalList objectAtIndex:chosenChannelIndex];
      
      if (displayFrame.channelIndex == dateInterval.channelIndex)
      {
        if (videoPlayerStatus == STATE_PAUSE) {
          videoPlayerStatus = STATE_PLAY;
        }
        
        long time = 0;
//        if(m_dayType == BEGIN_DAYLIGHT || m_dayType == END_DAYLIGHT){
          NSDateFormatter* formatTimeDST = [[NSDateFormatter alloc] init];
          [formatTimeDST setDateFormat:@"yyyy/MM/dd HH:mm:ss"];
          [formatTimeDST setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];

          NSString* Date = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",components.year, components.month, components.day, components.hour, components.minute, components.second];
          NSTimeInterval tmp_Date = [[formatTimeDST dateFromString:Date] timeIntervalSince1970];
//          if(m_dayType == END_DAYLIGHT){
//            tmp_Date -= 3600;
//          }

          time = [currentServer.serverTimezone secondsFromGMT] > 0 ?  tmp_Date + [currentServer.serverTimezone secondsFromGMT]:
                                                                      tmp_Date - [currentServer.serverTimezone secondsFromGMT];
          //time = [displayFrame.frameTime timeIntervalSince1970];
//        }
//        else {
//          NSDateFormatter* formatTimeDST = [[NSDateFormatter alloc] init];
//          [formatTimeDST setDateFormat:@"yyyy/MM/dd HH:mm:ss"];
//          [formatTimeDST setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
//          NSString* sDate = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",components.year, components.month, components.day, components.hour, components.minute, components.second];
//
//          time = [[formatTimeDST dateFromString:sDate] timeIntervalSince1970];
//        }
        
        NSString* str_min = [NSString stringWithFormat:@"{\"timestamp\":\"%ld\",\"value\":\"%@\",\"channel\":\"%@\"}", time, timeTextLabel, _channels];
        NSString* res = [NSString stringWithFormat:@"[%@]",str_min];
        NSLog(@"GOND add Search frame: %ld", time);
        
        //@autoreleasepool
        {
          dispatch_async(dispatch_get_main_queue(), ^{
            //NSLog(@"Shark setNeedsDisplay Search");
            searchFrameImage = displayFrame.videoFrame;
            self.layer.contents = searchFrameImage;
            [self.layer setNeedsDisplay];
            [videoView setNeedsDisplay];
            
            if (videoPlayerStatus == STATE_PLAY) {
              //do something
            }
            
            NSString* old = nil;
            if (![old isEqualToString:timeTextLabel]) {
              [UIView setAnimationsEnabled:NO];
              [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                      @"msgid": [NSNumber numberWithUnsignedInteger:13],
                                                                                      @"value": [NSString stringWithString: res],
                                                                                      @"target": self.reactTag
                                                                                      }];
              old = timeTextLabel;
              [UIView setAnimationsEnabled:YES];
            }
          });
        }
      }
    }
  }
}


-(void)updateChannelsInDate:(ImcAllDateInterval*)data
{
	
  ImcAllDateInterval* allDateInterVal = data;
  
  if ([currentServer.server_address isEqualToString:allDateInterVal.serverAddress]) {
    [channelsSearchDictionary removeAllObjects];
    dateIntervalList = [NSMutableArray arrayWithArray:allDateInterVal.dateInterval];
    searchingDateInterval = [NSMutableArray arrayWithArray:allDateInterVal.dateInterval];
    
    run_on_ui_thread(^{
      [channelListCollectonView reloadData];
    });
    
    NSLog(@"FullscreenChannel %zd",currentSelectedFullScreenChannel);
    if (currentSelectedFullScreenChannel >= 0 && currentSelectedFullScreenChannel < IMC_MAX_CHANNEL)
    {
      [dateIntervalList enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        ImcDateInterval* dateInterval = (ImcDateInterval*)obj;
        if (dateInterval.channelIndex >= 0 && dateInterval.channelIndex == currentSelectedFullScreenChannel) {
          chosenChannelIndex = idx;
          *stop = YES;
        }
      }];
      
      zoomLevel = ZOOM_LEVEL_24H;
      run_on_ui_thread(^{
        [self buildRulerDST:_dateTimeRulerDST];
        [self sendDataToReact];
        [self updateViewForViewIndex];
      });
    }
    else if(m_delayPlayback)
    {
      m_delayPlayback = NO;
      uint64_t channelMask = 0;
      long timeInterval = 0;
      
      if (chosenChannelIndex == -1) {
        ImcDateInterval* firstChannel = [dateIntervalList firstObject];
        channelMask = ((uint64_t)0x01<<firstChannel.channelIndex);
        ImcTimeInterval* ti = [firstChannel.timeInterval firstObject];
        timeInterval = ti.begin;
        chosenChannelIndex = 0;
        videoPlayerStatus = STATE_PAUSE;
      }
      else if (chosenChannelIndex >= 0 && chosenChannelIndex < dateIntervalList.count)
      {
        ImcDateInterval* chosenDayInterval = [dateIntervalList objectAtIndex:chosenChannelIndex];
        channelMask = ((uint64_t)0x01<<chosenDayInterval.channelIndex);
        timeInterval = ((ImcTimeInterval*)[chosenDayInterval.timeInterval firstObject]).begin;
        videoPlayerStatus = STATE_PAUSE;
      }
      uint64_t mainStreamMask = channelMask;
      NSArray* data = [NSArray arrayWithObjects:currentServer,@(timeInterval), @(channelMask), @(mainStreamMask),nil];
      
      [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_SET_POS fromView:self withData:data];
      [NSThread sleepForTimeInterval:0.0001f];
      [self handleResponseMessage:IMC_MSG_SEARCH_REQUEST_PLAY_FW fromView:self withData:data];
    }
  }
}

-(void)sendDataToReact{
	
  if(chosenDay==nil)
    return;
  
  if (chosenChannelIndex < dateIntervalList.count && chosenChannelIndex >= 0) {
    if (!(chosenChannelIndex >= 0 && chosenChannelIndex < dateIntervalList.count)) {
      return;
    }
    
    ImcDateInterval* chosenDayInterval = [dateIntervalList objectAtIndex:chosenChannelIndex];
    NSDate* selectedDate = [NSDate dateWithTimeIntervalSince1970:chosenDayInterval.time];
    NSDate* nextDaylight = [currentServer.serverTimezone nextDaylightSavingTimeTransitionAfterDate:selectedDate];

    /*if(nextDaylight==nil)
    {*/
      m_dayType = NORMAL;
    /*}
    else
    {
      NSTimeInterval offset = [nextDaylight timeIntervalSinceDate:selectedDate];
      if(offset < HoursPerDay*60*60 )
      {
        if([currentServer.serverTimezone isDaylightSavingTimeForDate:selectedDate])// end daylight
        {
          m_dayType = END_DAYLIGHT;
        }
        else // begin daylight
        {
          m_dayType = BEGIN_DAYLIGHT;
        }
      }
      else
      {
        m_dayType = NORMAL;
      }
    }*/
    
    NSCalendar* calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
    [calendar setTimeZone:currentServer.serverTimezone];
    unsigned unitFlags = NSCalendarUnitTimeZone|NSCalendarUnitSecond|NSCalendarUnitMinute|NSCalendarUnitHour|NSCalendarUnitDay|NSCalendarUnitMonth|NSCalendarUnitYear;
    NSDateComponents* chosenDayComponents = [calendar components:unitFlags fromDate:chosenDay];
    NSInteger currentDay = chosenDayComponents.day;
    NSMutableArray* timeArr = [[NSMutableArray alloc] init];
    NSLog(@"GOND build Ruler %d", m_dayType);
    
    for (ImcTimeInterval* ti in chosenDayInterval.timeInterval) {
      ti.deviceID = ti.deviceID != -1 ? ti.deviceID : 0;
      ti.time = ti.time != -1 ? ti.time : 0;
      NSInteger numOfMin = (ti.end-ti.begin + 1)/60;
      NSDate* timeStart;
      NSDate* timeEnd;
      
//      if(m_dayType == BEGIN_DAYLIGHT || m_dayType == END_DAYLIGHT){
        NSLog(@"GOND 11111111111");
        NSDate* begin = [NSDate dateWithTimeIntervalSince1970:ti.begin];
        NSDate* end = [NSDate dateWithTimeIntervalSince1970:ti.end];
        NSDateComponents* chosenSDayComponents = [calendar components:unitFlags fromDate:begin];
        NSDateComponents* chosenEDayComponents = [calendar components:unitFlags fromDate:end];
        
        if(m_dayType==BEGIN_DAYLIGHT&&[currentServer.serverTimezone isDaylightSavingTimeForDate:begin])
        {
          chosenSDayComponents.hour = [chosenSDayComponents hour] - 1;
        }
        else if(m_dayType==END_DAYLIGHT&&![currentServer.serverTimezone isDaylightSavingTimeForDate:begin])
        {
          chosenSDayComponents.hour = [chosenSDayComponents hour] +1 ;
        }
        
        if(m_dayType==BEGIN_DAYLIGHT&&[currentServer.serverTimezone isDaylightSavingTimeForDate:end])
        {
           chosenEDayComponents.hour = [chosenEDayComponents hour] - 1;
        }
        else if(m_dayType==END_DAYLIGHT&&![currentServer.serverTimezone isDaylightSavingTimeForDate:end])
        {
          chosenEDayComponents.hour = [chosenEDayComponents hour] + 1;
        }
        
        NSDateFormatter* formatTimeDST = [[NSDateFormatter alloc] init];
        [formatTimeDST setDateFormat:@"yyyy/MM/dd HH:mm:ss"];
        [formatTimeDST setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
        
        NSString* sDate = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",chosenSDayComponents.year, chosenSDayComponents.month, chosenSDayComponents.day, chosenSDayComponents.hour, chosenSDayComponents.minute, chosenSDayComponents.second];
        NSString* eDate = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",chosenEDayComponents.year, chosenEDayComponents.month, chosenEDayComponents.day, chosenEDayComponents.hour, chosenEDayComponents.minute, chosenEDayComponents.second];
        
        NSTimeInterval tmp_S = [[formatTimeDST dateFromString:sDate] timeIntervalSince1970];
        NSTimeInterval tmp_E = [[formatTimeDST dateFromString:eDate] timeIntervalSince1970];
        
        if(m_dayType == END_DAYLIGHT)
        {
          tmp_S -= 3600;
          tmp_E -= 3600;
        }
        NSLog(@"GOND builRuler offset: %ld, %ld", [currentServer.serverTimezone secondsFromGMTForDate:begin], tmp_S);
//        tmp_S = [currentServer.serverTimezone secondsFromGMTForDate:begin] > 0 ? tmp_S + [currentServer.serverTimezone secondsFromGMTForDate:begin]:
//        tmp_S - [currentServer.serverTimezone secondsFromGMTForDate:begin];
//        tmp_E = [currentServer.serverTimezone secondsFromGMTForDate:end] > 0 ? tmp_E + [currentServer.serverTimezone secondsFromGMTForDate:end]:
//        tmp_E - [currentServer.serverTimezone secondsFromGMTForDate:end];
        tmp_S = tmp_S - [currentServer.serverTimezone secondsFromGMTForDate:begin];
        tmp_E = tmp_E - [currentServer.serverTimezone secondsFromGMTForDate:end];
        
        timeStart = [NSDate dateWithTimeIntervalSince1970:tmp_S];
        timeEnd = [NSDate dateWithTimeIntervalSince1970:tmp_E];
//      }
//      else
//      {
//        NSLog(@"GOND 2222222222");
//        NSDateFormatter* formatTimeDST = [[NSDateFormatter alloc] init];
//        [formatTimeDST setDateFormat:@"yyyy/MM/dd HH:mm:ss"];
//        [formatTimeDST setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
//
//        NSDateComponents* sChosenDayComponents = [calendar components:unitFlags fromDate:[NSDate dateWithTimeIntervalSince1970:ti.begin]];
//        NSString* sDate = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",sChosenDayComponents.year, sChosenDayComponents.month, sChosenDayComponents.day, sChosenDayComponents.hour, sChosenDayComponents.minute, sChosenDayComponents.second];
//
//        NSDateComponents* eChosenDayComponents = [calendar components:unitFlags fromDate:[NSDate dateWithTimeIntervalSince1970:ti.end]];
//        NSString* eDate = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",eChosenDayComponents.year, eChosenDayComponents.month, eChosenDayComponents.day, eChosenDayComponents.hour, eChosenDayComponents.minute, eChosenDayComponents.second];
//
//        timeStart = [formatTimeDST dateFromString:sDate];
//        timeEnd = [formatTimeDST dateFromString:eDate];
//      }
      
      NSDate* tmpBegin = timeStart;
      NSDate* tmpEnd = timeStart;
      NSDateComponents* diff = [[NSDateComponents alloc] init];
      [diff setSecond:0];
      while ([tmpBegin laterDate:timeEnd] == timeEnd) {
        [diff setSecond:[diff second] + 59];
        tmpEnd = [calendar dateByAddingComponents:diff toDate:timeStart options:0];
        long begin = round([tmpBegin timeIntervalSince1970]);
        long end = round([tmpEnd timeIntervalSince1970]);
        NSString* strData = [NSString stringWithFormat:@"{\"id\":\"%d\",\"begin\":\"%ld\",\"end\":\"%ld\",\"time\":\"%ld\",\"type\":\"%d\",\"timezone\":\"%ld\"}",
                             ti.deviceID,begin,end,ti.time,ti.type,[currentServer.serverTimezone secondsFromGMT]];
        
        //Add json object to array
        [timeArr addObject:strData];
        [diff setSecond:[diff second] + 1];
        tmpBegin = [calendar dateByAddingComponents:diff toDate:timeStart options:0];
      }
    }
    
    NSString* contentJson = [NSString stringWithFormat:@"[%@]",[timeArr componentsJoinedByString:@","]];
    /* Display the error to the user. */
    [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                            @"msgid": [NSNumber numberWithUnsignedInteger:21],
                                                                            @"value":[NSString stringWithString:contentJson],
                                                                            @"target": self.reactTag
                                                                            }];
  }
  else {
    NSString* contentJson = [NSString stringWithFormat:@"[]"];
    /* Display the error to the user. */
    [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                            @"msgid": [NSNumber numberWithUnsignedInteger:21],
                                                                            @"value":[NSString stringWithString:contentJson],
                                                                            @"target": self.reactTag
                                                                            }];
    [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                            @"msgid": [NSNumber numberWithUnsignedInteger:12],
                                                                            @"target": self.reactTag
                                                                            }];
  }
}

//Build interval 1 day
-(void)buildRulerDST: (NSDate* )chosenDay {
	
  NSLog(@"GOND buildRulerDST ");
  if([dateIntervalList count] > 0){
    ImcDateInterval* chosenDayInterval = [dateIntervalList objectAtIndex:chosenChannelIndex];
    NSDate* selectedDate = [NSDate dateWithTimeIntervalSince1970:chosenDayInterval.time];
    NSDate* nextDaylight = [currentServer.serverTimezone nextDaylightSavingTimeTransitionAfterDate:selectedDate];
    
    int hoursofDay = 24;
    int hourSpecial = 2;
    int hourSpecialFirst = 2;
    NSMutableArray* daylightSavingTime = [[NSMutableArray alloc] init];
    
    if(nextDaylight != nil)
    {
      NSLog(@"GOND buildRulerDST 11111");
      NSTimeInterval offset = [nextDaylight timeIntervalSinceDate:selectedDate];
      /*if(offset < HoursPerDay*60*60 )
      {
        NSLog(@"GOND buildRulerDST 22222");
        NSCalendar* calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
        [calendar setTimeZone:currentServer.serverTimezone];
        unsigned unitFlags = NSCalendarUnitTimeZone | NSCalendarUnitSecond | NSCalendarUnitMinute | NSCalendarUnitHour | NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear;
        NSDateComponents *component = [calendar components:unitFlags fromDate:nextDaylight];
        if([currentServer.serverTimezone isDaylightSavingTimeForDate:selectedDate])// end daylight
        {
//          m_dayType = END_DAYLIGHT;
          hoursofDay = 25;
          hourSpecial = component.hour;
          hourSpecialFirst = component.hour;
          hourSpecialDST = component.hour;
        }
        else // begin daylight
        {
//          m_dayType = BEGIN_DAYLIGHT;
          hoursofDay = 23;
          hourSpecial = component.hour - 1;
          hourSpecialFirst = component.hour - 1;
          hourSpecialDST = component.hour - 1;
        }
      }
      else*/
      {
        m_dayType = NORMAL;
        hoursofDay = 24;
        return;
      }
      
      NSArray* arr_Hour = @[@"00:00",@"01:00",@"02:00",@"03:00",@"04:00",@"05:00",@"06:00",@"07:00",@"08:00",@"09:00",@"10:00",@"11:00",@"12:00",@"13:00",@"14:00",
                            @"15:00",@"16:00",@"17:00",@"18:00",@"19:00",@"20:00",@"21:00", @"22:00",@"23:00"];
      
      NSTimeInterval intervalChosenDay = [chosenDay timeIntervalSince1970];
      
//      if(m_dayType == END_DAYLIGHT){
//        intervalChosenDay -= 3600;
//      }
      
      intervalChosenDay = [currentServer.serverTimezone secondsFromGMT] > 0 ? intervalChosenDay + [currentServer.serverTimezone secondsFromGMT]:
      intervalChosenDay - [currentServer.serverTimezone secondsFromGMT];
      
      if(m_dayType == BEGIN_DAYLIGHT || m_dayType == END_DAYLIGHT){
        NSLog(@"GOND buildRulerDST 33333");
        int minValue = 1;
        NSString* color = [NSString stringWithString:@"#FFFFFF"];
        NSMutableArray* arrHour = [[NSMutableArray alloc] init];
        int displayH = 0;
        for (int i=0; i<hoursofDay; i++) {
          NSMutableArray* arrTime = [[NSMutableArray alloc] init];
          for (int j=0; j<60; j++) {
            long long_start = intervalChosenDay + (i * 3600) + (j * minValue * 60); //00
            long long_end = long_start + (minValue * 60) - 1; //59
            
            NSString* str_min = [NSString stringWithFormat:@"{\"id\":%d,\"begin\":%d,\"end\":%d}",-1, long_start, long_end];
            [arrTime addObject:str_min];
          }
          
          NSString* content_minData = [NSString stringWithFormat:@"%@",[arrTime componentsJoinedByString:@","]];
          if(m_dayType == BEGIN_DAYLIGHT && displayH == hourSpecialFirst){
            color = @"#27AEE3";
            displayH++;
            hourSpecialFirst = 999;
          } else if(m_dayType == END_DAYLIGHT && displayH == (hourSpecialFirst + 1)){
            color = @"#27AEE3";
            displayH--;
            hourSpecialFirst = 999;
          }
          
          content_minData = [NSString stringWithFormat:@"[%@]",content_minData];
          NSString* res = [NSString stringWithFormat:@"{\"key\":\"%@\",\"visible\":true,\"color\":\"%@\",\"value\":%d,\"minData\":%@}",
                           arr_Hour[displayH],color, i, content_minData];
          displayH++;
          [arrHour addObject:res];
        }
        
        NSString* contentJson = [NSString stringWithFormat:@"[%@]",[arrHour componentsJoinedByString:@","]];
        /* Display the error to the user. */
        [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                @"msgid": [NSNumber numberWithUnsignedInteger:23],
                                                                                @"value":[NSString stringWithString:contentJson],
                                                                                @"target": self.reactTag
                                                                                }];
      }
      
      //Send daylight saving time
      NSString* daylightSavingTime = [NSString stringWithFormat:@"{\"hoursofDay\":%d,\"hourSpecial\":%d}",hoursofDay,hourSpecial];
      NSString* daylightSavingTimeJson = [NSString stringWithFormat:@"[%@]",daylightSavingTime];
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:22],
                                                                              @"value":[NSString stringWithString:daylightSavingTimeJson],
                                                                              @"target": self.reactTag
                                                                              }];
    }
  }
}



-(void)addVideoFrame:(id)videoFrame
{
	
  DisplayedVideoFrame* displayFrame = (DisplayedVideoFrame*)videoFrame;
  BOOL found = NO;
  
  for (ImcConnectedServer* server in connectedServerList) {
    // NSLog(@"GOND compare server connected %@, frame %@", server.server_address, displayFrame.serverAddress);
    if ([server.server_address isEqualToString:displayFrame.serverAddress]) {
      found = YES;
    }
  }
  if (!found)
    return;
  
  if (_isSingle)
  {
    // NSLog(@"GOND send frame to draw context, channel %@, ch idx %ld", _channels, displayFrame.channelIndex);
    if ((NSInteger)[_channels intValue] == displayFrame.channelIndex)
    {
      dispatch_async(dispatch_get_main_queue(), ^{
        [mainDisplayVideo addVideoFrame:displayFrame];
      });
      
//      for (ImcScreenDisplay* screen in [mainDisplayVideo getDisplayScreens])
//      {
//        if ([screen.serverAddress isEqualToString:displayFrame.serverAddress] && screen.channelIndex == displayFrame.channelIndex)
//        {
//          if (screen.viewIndex >= 0 && screen.viewIndex < mainDisplayVideo.currentDiv * mainDisplayVideo.currentDiv)
//          {
//            [viewMaskLock lock];
//            viewMaskArray[screen.screenIndex] = YES;
            /* Display the error to the user. */
            NSCalendar* calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
            [calendar setTimeZone: currentServer.serverTimezone];
            unsigned unitFlags = NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear| NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
            NSDateComponents *components = [calendar components:unitFlags fromDate:displayFrame.frameTime];
            NSString* timeText = [NSString stringWithFormat:@"%zd/%02zd/%02zd %02zd:%02zd:%02zd",components.year, components.month, components.day, components.hour, components.minute, components.second];
            
            long time = 0;
//            if(m_dayType == BEGIN_DAYLIGHT || m_dayType == END_DAYLIGHT){
              time = [displayFrame.frameTime timeIntervalSince1970];
//            }
//            else {
//              time = [currentServer.serverTimezone secondsFromGMT] > 0 ? [displayFrame.frameTime timeIntervalSince1970] - [currentServer.serverTimezone secondsFromGMT]
//              : [displayFrame.frameTime timeIntervalSince1970] + [currentServer.serverTimezone secondsFromGMT];
//
//            }
            
            NSString* str_min = [NSString stringWithFormat:@"{\"timestamp\":\"%ld\",\"value\":\"%@\",\"channel\":\"%@\"}", time, timeText, _channels];
            NSString* res = [NSString stringWithFormat:@"[%@]",str_min];
            NSLog(@"GOND add Search frame: %ld", time);
            
            // NSLog(@"GOND send time frame to JS %@", str_min);
            [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
              @"msgid": [NSNumber numberWithUnsignedInteger:13],
              @"value": [NSString stringWithString: res],
              @"channel": [NSNumber numberWithInteger: displayFrame.channelIndex],
              @"target": self.reactTag
              }];
//            [viewMaskLock unlock];
//          }
//          break;
//        }
//      }
    }
//    else
//    {
//      for( ImcConnectedServer* server in connectedServerList )
//        [controllerThread updateServerDisplayMask:server.server_address :server.server_port :[self getChannelMask]];
//    }
  }
  else
  {
    // send base64 frame to JS
    NSString* encodedFrame = [UIImagePNGRepresentation(displayFrame.videoFrame) base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed];
    // NSLog(@"GOND send base64 frame to JS, channel %ld", (long)displayFrame.channelIndex);
    [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
      @"msgid": [NSNumber numberWithUnsignedInteger: 0],
      @"value": [NSString stringWithString: encodedFrame],
      @"channel": [NSNumber numberWithInteger: displayFrame.sourceIndex],
      @"target": self.reactTag
      }];
    
    displayFrame.videoFrame = nil;
  }
  
  /*
  if (mainDisplayVideo.fullscreenView >= 0 && mainDisplayVideo.fullscreenView < [mainDisplayVideo getDisplayView].count)
  {
    ImcViewDisplay* view = [[mainDisplayVideo getDisplayView] objectAtIndex:mainDisplayVideo.fullscreenView];
    if (view.screenIndex < 0 || view.screenIndex >= [mainDisplayVideo getDisplayScreens].count) {
      return;
    }
    
    ImcScreenDisplay* screen = [[mainDisplayVideo getDisplayScreens] objectAtIndex:view.screenIndex];
    if ([screen.serverAddress isEqualToString:displayFrame.serverAddress] && screen.channelIndex!= -1 && displayFrame.channelIndex == screen.channelIndex)
    {
      // NSLog(@"Shark test live 2");
      //do something
      //[self showMainSubBtnIfNeeded];
    }
  }
  */
  
  
}

-(void)onShowDisconnectedMsg : (ImcConnectedServer*)server
{
	
  self.connectedServers = connectedServerList;
  
  NSString* message = [NSString stringWithFormat:@"Disconnect from server %@",server.serverName];
  
  if (disconnectWarning.message != nil && [server.serverName isEqualToString:server.serverName] && server.server_port == disconnectWarning.server.server_port)
  {
    message = disconnectWarning.message;
    [disconnectWarning reset];
  }
  
  [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                          @"msgid": [NSNumber numberWithUnsignedInteger:27],
                                                                          @"value": [NSString stringWithString:message],
                                                                          @"target": self.reactTag
                                                                          }];
  
  if (connectedServerList.count > 0) {
    [self.mainDisplayVideo updateChannelBufferWithDisconnectedServer:server.server_address];
    [self handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:self withData:nil];
  }
}

- (void)responseCheckPermission:(ImcConnectedServer *)server
{
	
  
  [self performSelectorOnMainThread:@selector(onresponseCheckPermission:) withObject:server waitUntilDone:NO];
}

-(void)onresponseCheckPermission : (ImcConnectedServer *)server
{
	
    ChannelSetting* setting = (ChannelSetting*)[server.channelConfigs objectAtIndex:[_channels intValue]];
    if (_isSeacrh == YES)
    {
      if(setting.isSearchable == false){
        [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                @"msgid": [NSNumber numberWithUnsignedInteger:19],
                                                                                @"target": self.reactTag
                                                                                }];
      }
    }
    else {
    
      //NSInteger channelIndex = [_channels intValue];
      
      if(setting.isLiveViewable == false){
        [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                @"msgid": [NSNumber numberWithUnsignedInteger:19],
                                                                                @"target": self.reactTag
                                                                                }];
      }
    }
  
  
}

- (void)responseConnectingServer:(ImcConnectedServer *)server :(LOGIN_STATUS)status
{
	
  NSArray* data = [NSArray arrayWithObjects:@(status),server, nil];
  [self performSelectorOnMainThread:@selector(onResponseConnectingServer:) withObject:data waitUntilDone:NO];
}

-(void)onResponseConnectingServer : (NSObject*)data
{
	
  NSArray* inputData = (NSArray*)data;
  if (inputData && inputData.count > 1) {
    LOGIN_STATUS status = (LOGIN_STATUS)[[inputData objectAtIndex:0] integerValue];
    ImcConnectedServer* server = (ImcConnectedServer*)([inputData objectAtIndex:1]);
    
    if (server && status)
    {
      if( status == LOGIN_STATUS_SUCCEEDED )
      {
        [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                @"msgid": [NSNumber numberWithUnsignedInteger:5],
                                                                                @"target": self.reactTag
                                                                                }];
      }
      else
      {
        NSString* msg = nil;
        BOOL bShow = TRUE;
        switch (status) {
          case LOGIN_STATUS_CANNOT_CONNECT:
            msg = [NSString stringWithFormat:@"Cannot connect to server %@", server.serverName];
            bShow = FALSE;
            [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                    @"msgid": [NSNumber numberWithUnsignedInteger:9],
                                                                                    @"target": self.reactTag
                                                                                    }];
            break;
          case LOGIN_STATUS_WRONG_USER_PASS:
            //msg = @"Wrong username or password";
            bShow = FALSE;
            [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                    @"msgid": [NSNumber numberWithUnsignedInteger:4],
                                                                                    @"target": self.reactTag
                                                                                    }];
            break;
          case LOGIN_STATUS_WRONG_SERVERID:
            bShow = FALSE;
            [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                    @"msgid": [NSNumber numberWithUnsignedInteger:7],
                                                                                    @"target": self.reactTag
                                                                                    }];
            break;
          case LOGIN_STATUS_VIDEO_PORT_ERROR:
            bShow = FALSE;
            [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                    @"msgid": [NSNumber numberWithUnsignedInteger:8],
                                                                                    @"target": self.reactTag
                                                                                    }];
            break;
          default:
            bShow = FALSE;
            break;
        }
        
        if( bShow )
        {
          //Display the error to the user.
          [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                                  @"msgid": [NSNumber numberWithUnsignedInteger:25],
                                                                                  @"value": [NSString stringWithString:msg],
                                                                                  @"target": self.reactTag
                                                                                  }];
        }
      }
      
    }
  }
}

-(NSCalendar*)AgendaCalendar
{
	
  return self.calendar;
}

@end

#pragma mark - Private Method
@implementation FFMpegFrameView (PrivateMethod)

-(NSString*)get_obj:(NSDictionary *)_dic for_key:(NSString *)_key
{
	
  const id nul = [NSNull null];
  const NSString *blank = @"";
  id _obj = [_dic objectForKey:_key];
  if(_obj == nul)
    _obj = blank;
  
  return _obj;
}

-(NSInteger)verifyserverInfo:(ImcConnectedServer*)newServer
{
	
  NSCharacterSet *invalidCharSet = [NSCharacterSet characterSetWithCharactersInString:@"%*\\+?><|/\""];
  NSArray* fieldNameList = [NSArray arrayWithObjects:@"Server name", @"Server id", @"Username", @"Password", nil];
  NSArray* fieldList = [NSArray arrayWithObjects:newServer.serverName, newServer.serverID, newServer.username, newServer.password, nil];
  
  for (NSInteger i = 0; i < fieldList.count; i++) {
    
    NSString* fieldNeedToVerify = [fieldList objectAtIndex:i];
    NSString* fieldName = [fieldNameList objectAtIndex:i];
    NSString* invalidCharacters = nil;
    
    for (NSInteger j = 0; j < fieldNeedToVerify.length; j++) {
      unichar c = [fieldNeedToVerify characterAtIndex:j];
      if ([invalidCharSet characterIsMember:c])
      {
        
        if (invalidCharacters != nil) {
          invalidCharacters = [NSString stringWithFormat:@"%@,%c", invalidCharacters, c];
        }
        else
        {
          invalidCharacters = [NSString stringWithFormat:@"%c", c];
        }
        
      }
    }
    if (invalidCharacters != nil) {
      
      NSString* message = [NSString stringWithFormat:@"%@ contains special character(s): \"%@\"\nPlease re-enter", fieldName, invalidCharacters];
      
      /* Display the error to the user. */
      [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                              @"msgid": [NSNumber numberWithUnsignedInteger:25],
                                                                              @"value": [NSString stringWithString:message],
                                                                              @"target": self.reactTag
                                                                              }];
      return -1;
    }
    
  }
  
  if (newServer.serverID.length > 32) {
    NSString* message = @"Server id has more than 32 charaters";
    
    /* Display the error to the user. */
    [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                            @"msgid": [NSNumber numberWithUnsignedInteger:25],
                                                                            @"value": [NSString stringWithString:message],
                                                                            @"target": self.reactTag
                                                                            }];
    return -1;
  }
  
  if (newServer.username.length > 64) {
    NSString* message = @"Username has more than 64 charaters";
    
    /* Display the error to the user. */
    [FFMpegFrameEventEmitter emitEventWithName:@"onFFMPegFrameChange" andPayload:@{
                                                                            @"msgid": [NSNumber numberWithUnsignedInteger:25],
                                                                            @"value": [NSString stringWithString:message],
                                                                            @"target": self.reactTag
                                                                            }];
    return -1;
  }
  
  return 0;
}

- (uint64_t) getChannelMask
{
	
  uint64_t channelDisplayMask = 0;
  NSString* channelStr = @"";
  for(NSString* ch in channelList)
  {
    channelDisplayMask |= ((uint64_t)0x01<<[ch intValue]);
    channelStr = [NSString stringWithFormat:@"%@, %@", channelStr, ch];
  }
  NSLog(@"GOND channelMask: %llu, %@", channelDisplayMask, channelStr);
  return channelDisplayMask;
}

@end

@implementation i3DisconnectWarningInfo

@synthesize message, server;

-(i3DisconnectWarningInfo*)init
{
	
  self = [super init];
  
  if (self) {
    message = nil;
    server = nil;
  }
  return self;
}

-(void)reset
{
	
  if (self) {
    message = nil;
    server = nil;
  }
}

@end

@implementation i3ResumeDataInfo

@synthesize channelsMapping, connectedServerList, currentView, didShowDivisionView, mainSubStreamList, mainStreamChannel,current_mode,playbackInfo,numProcessServer;

-(i3ResumeDataInfo*)init
{
	
  self = [super init];
  
  if (self) {
    channelsMapping = [NSMutableArray array];
    connectedServerList = nil;
    currentView = -2;
    didShowDivisionView = NO;
    mainSubStreamList = [NSArray array];
    mainStreamChannel = NO;
    current_mode = CONNECTION_MODE;
    playbackInfo = nil;
  }
  return self;
}

-(NSArray*) getChannelMappingOfConnectedServer:(ImcConnectedServer *)server
{
	
  if(channelsMapping.count==0)
    return nil;
  NSMutableArray* _return = [[NSMutableArray alloc] initWithCapacity:channelsMapping.count];
  for (ImcScreenDisplay* screen in channelsMapping) {
    if([screen.serverAddress isEqualToString:server.server_address] &&
       (screen.serverPort == server.server_port) )
      [_return addObject:screen];
  }
  [channelsMapping removeObjectsInArray:_return];
  return _return;
}

@end

