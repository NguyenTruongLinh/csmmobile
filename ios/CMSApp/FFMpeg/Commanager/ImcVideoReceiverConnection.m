//
//  ImcVideoRecieveConnection.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/17/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ImcVideoReceiverConnection.h"
#import "../Imcbase.h"
#import "../MobileBase.h"

#import "ImcRemoteConnection.h"
#import <malloc/malloc.h>

#define MAX_BUFFER_SIZE (16 * MOBILE_MAX_PACKET_LENGTH)
#define MAX_VIDEO_FRAME_BUFFER_SIZE (1024*1024)
#define RELAY_HEADER_SIZE (68)

__volatile BOOL isRLRunning = NO;

@interface ImcVideoReceiverConnection(PrivateMethod)
- (BOOL)processData;
- (BOOL)processCmd;
- (BOOL)processHeader;
@end

@implementation ImcVideoReceiverConnection
@synthesize delegate, parent,disconnected, videoTimer, timerCounter, streamingRL, streamQueue, waitForRelayHandshake;

- (id)init
{
  
  self = [super init];
  if( self )
  {
    streamingRL = nil;
    receivedDataStream = nil;
    sentDataStream = nil;
    receiverBuffer = [[NSMutableData alloc] initWithCapacity:MAX_BUFFER_SIZE];
    receiverBufferLength = 0;
    connectionIndex = -1;
    parent = nil;
    disconnected = FALSE;
    sizeWillRead = 2;
    streamLock = [[NSCondition alloc] init];
    serverAddress = nil;
    timerCounter = 0;
    currentCmd = 0;
    currentData = [[NSMutableData alloc] initWithLength:MAX_VIDEO_FRAME_BUFFER_SIZE];
    frameHeader = nil;
    rawVideo = nil;
    encodedVideo = nil;
    current_state = get_cmd;
    NSLog(@"1008 assign current_state = get_cmd");
    relayLenRemained = 0;
    streamQueue = nil;
    isRLRunning = NO;
    loopCount = 0;
    dataCount = 0;
    lastStreamTimePoint = (long)([[NSDate date] timeIntervalSince1970] * 1000.0);
  }
  return self;
}

- (id)initWithConnectionIndex:(NSInteger)index
{
  
  
  self = [super init];
  if( self )
  {
    streamingRL = nil;
    receivedDataStream = nil;
    sentDataStream = nil;
    receiverBuffer = [[NSMutableData alloc] initWithCapacity:MAX_BUFFER_SIZE];
    receiverBufferLength = 0;
    connectionIndex = index;
    parent = nil;
    disconnected = FALSE;
    sizeWillRead = 2;
    streamLock = [[NSCondition alloc] init];
    currentCmd = 0;
    currentData = [[NSMutableData alloc] initWithLength:MAX_VIDEO_FRAME_BUFFER_SIZE];
    frameHeader = nil;
    rawVideo = nil;
    encodedVideo = nil;
    current_state = get_cmd;
    NSLog(@"1008 assign current_state = get_cmd");
    relayLenRemained = 0;
    streamQueue = nil;
    isRLRunning = NO;
    streamCount = 0;
    dataUsage = 0;
    lastDataUsageSentTimePoint = CFAbsoluteTimeGetCurrent();
  }
  return self;
}

- (void) dealloc
{
  
  // NSLog(@"---------- videoReceiver dealloc 1");
  if(!disconnected)
  {
    [self disconnectToServer];
    // NSLog(@"---------- videoReceiver dealloc ----------");
    NSLog(@"1008 0509 disconnectToServer 1");
  }

  receiverBuffer = nil;
  currentData = nil;
  streamQueue = nil;
  parent = nil;
  isRLRunning = NO;
  // if (streamingRL)
  //   streamingRL = nil;
}

- (BOOL) connectToServer:(NSString *)address :(NSInteger)port :(NSData*)handshakeRequest
{
  
  __block BOOL success = TRUE;
  serverAddress = address;
  serverPort = port;
  CFStringRef adddress = (__bridge CFStringRef)serverAddress;
  UInt32 connectPort = (UInt32)serverPort;
  
  // NSLog(@"<<<<<<<<<< videoReceiver connect server before >>>>>>>>>>");
//  if(!streamQueue)
//  {
//    NSString* queueName = [NSString stringWithFormat:@"com.i3international.videostream.%@", [[NSProcessInfo processInfo] globallyUniqueString]];
//    streamQueue = dispatch_queue_create([queueName UTF8String], DISPATCH_QUEUE_CONCURRENT);
//  }
  if (isRLRunning)
    return NO;
//  isRLRunning = YES;
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
//  dispatch_async(streamQueue, ^{
    // NSLog(@"<<<<<<<<<< videoReceiver connect server block >>>>>>>>>>");
//    if (!self->isRLRunning)
//      return;
    
    CFReadStreamRef readStream;
    CFWriteStreamRef writeStream;
    CFStreamCreatePairWithSocketToHost(kCFAllocatorDefault, adddress, connectPort, &readStream, &writeStream);
    if( readStream && writeStream )
    {
      CFReadStreamSetProperty(readStream,
                              kCFStreamPropertyShouldCloseNativeSocket,
                              kCFBooleanTrue);
      
      CFWriteStreamSetProperty(writeStream,
                               kCFStreamPropertyShouldCloseNativeSocket,
                               kCFBooleanTrue);
      
      self->receivedDataStream = (__bridge_transfer NSInputStream *)readStream;
      [self->receivedDataStream setDelegate:self];
      self->streamingRL = [NSRunLoop currentRunLoop];
      [self->receivedDataStream scheduleInRunLoop:self->streamingRL
                                    forMode:NSDefaultRunLoopMode];
      [self->receivedDataStream open];
      
      
      self->sentDataStream = (__bridge_transfer NSOutputStream *)writeStream;
      [self->sentDataStream setDelegate:self];
      [self->sentDataStream scheduleInRunLoop:self->streamingRL forMode:NSDefaultRunLoopMode];
      [self->sentDataStream open];
      
      self->disconnected = FALSE;
      success = TRUE;
      if(handshakeRequest != NULL) {
        NSData* modifiedData = [self notifyAddRelayHeader: handshakeRequest];
        NSLog(@"0908 write handshakeRequest handshakeRequest.length = %lu", (unsigned long)handshakeRequest.length);
        [self->sentDataStream write:(uint8_t*)[modifiedData bytes] maxLength:modifiedData.length];
//        [self sendData:handshakeRequest];
        self->waitForRelayHandshake = TRUE;
        self->isRelay = TRUE;
        sizeWillRead = 68;
      }else{
        NSLog(@"1008 write self->connectionIndex = %lu", self->connectionIndex);
        [self->sentDataStream write:(uint8_t*)(&self->connectionIndex) maxLength:sizeof(self->connectionIndex)];//1008
      }
      
      isRLRunning = YES;
      while (/*isRLRunning == YES &&*/ [self->streamingRL runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]]);
//      [self->streamingRL run];
      isRLRunning = NO;
      self->streamingRL = nil;
    }
    else
    {
      NSLog(@"<<<<<<<<<< videoReceiver could not create socket stream !!! >>>>>>>>>>");
    }
    NSLog(@"<<<<<<<<<< videoReceiver connect server end >>>>>>>>>>");
  });
  
  //lvtx todo: sync return value
  return success;
}

- (int)sendData:(NSData *)data
{
  NSLog(@"1008 ImcRemoteConnection  (int)sendData:(NSData *)data");
  UIApplicationState state = [[UIApplication sharedApplication] applicationState];
  if (state == UIApplicationStateBackground || state == UIApplicationStateInactive)
  {
    return SOCKET_SEND_ERROR;
  }
  __block SOCKET_SEND_STATUS status =  SOCKET_SEND_SUCCESS;
  
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    
    NSData* modifiedData = [self notifyAddRelayHeader: data];
    
    NSInteger length = modifiedData.length;
    
    uint8_t* buffer = (uint8_t*)[modifiedData bytes];
    
    [self->sentDataStream write:(buffer) maxLength:length];
    
    NSLog(@"1008 sendData write buffer DONE");
  });
  
  return status;
}

- (NSData*)notifyAddRelayHeader : (NSData*)directData
{
  if(TRUE) {
    NSLog(@"0108 notifyAddRelayHeader if directData.length = %lu ipAddress = %@", directData.length, @"ipAddress");
    
    uint32_t totalLen = (uint32_t) directData.length + 68;//uint64_t
    NSMutableData* result = [[NSMutableData alloc] initWithBytes:&totalLen length:4];
    
    NSData *appNameData = [@"CMSMobile" dataUsingEncoding:NSUTF8StringEncoding];
    
    [result appendData:appNameData];
    
    [result increaseLengthBy:(20 - appNameData.length)];
    
    NSData *ipAddressData = [@"ipAddress" dataUsingEncoding:NSUTF8StringEncoding];
    
    [result appendData:ipAddressData];
    
    [result increaseLengthBy:(44 - ipAddressData.length)];
    
    [result appendData:directData];
    
      NSLog(@"0108 notifyAddRelayHeader if result.length = %lu", result.length);
    
    return result;
  }else{
    NSLog(@"0108 notifyAddRelayHeader else");
      return directData;
  }
}

-(void)onTimerChecking
{
  
  if (timerCounter > 0)
  {
    timerCounter = 0;
  }
  else
  {
//    [videoTimer invalidate];
    
    if (!disconnected) {
      [parent onDisconnect:nil:FALSE];
      // NSLog(@"++++++++++ onTimerChecking, disconected ...");
      [self disconnectToServer];
      NSLog(@"1008 0509 disconnectToServer 2");
      [parent disconnect];
    }
    
  }
  
  
}

-(void)startVideoTimer
{
  
  if (!videoTimer && ![videoTimer isValid])
  {
    videoTimer = [NSTimer scheduledTimerWithTimeInterval:2.0f target:self selector:@selector(onTimerChecking) userInfo:nil repeats:YES];
  }
}

- (void)disconnectToServer
{
  
  if (!serverAddress) {
    return;
  }
  
  [streamLock lock];
  disconnected = TRUE;
  NSLog(@"1008 0509 (void)disconnectToServer MOBILE_MSG_DISCONNECT 3");
  [parent postDisconnectVideoMsg:serverAddress];

  if( sentDataStream != nil)
  {
    if (streamingRL != nil)
      [sentDataStream removeFromRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
    [sentDataStream close];
    [sentDataStream setDelegate:nil];
    sentDataStream = nil;
  }
  
  if( receivedDataStream != nil)
  {
    if (streamingRL != nil)
      [receivedDataStream removeFromRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
    [receivedDataStream close];
    [receivedDataStream setDelegate:nil];
    receivedDataStream = nil;
  }
  
  [streamLock unlock];
  
  NSLog(@"<<<<<<<<<< video connection closed! >>>>>>>>>>");
  if (streamingRL)
    CFRunLoopStop([streamingRL getCFRunLoop]);
  NSLog(@"GOND !!!!!!! STOP VIDEO RUNLOOP");
//  if (streamingRL) {
//    streamingRL = nil;
//  }
}

- (void)notifyUpdateDataUsage: (long) newBlockLen
{
//  if(isRelay) {
    dataUsage += newBlockLen;
    dataCount += newBlockLen;
//    if(loopCount < 5000)
//      NSLog(@"0509 notifyUpdateDataUsage dataCount = %ld loopCount =%d", dataCount, loopCount++);
    long newTimePoint = CFAbsoluteTimeGetCurrent();
    long deltaTime = newTimePoint - lastDataUsageSentTimePoint;
    if (deltaTime >= 3) {
//      NSLog(@"1PM 1708 notifyUpdateDataUsage deltaTime = %ld", deltaTime);
      lastDataUsageSentTimePoint = newTimePoint;
      [delegate handleCommand: IMC_CMD_RELAY_UPDATE_DATA_USAGE : [NSNumber numberWithInteger: dataUsage]];
      dataUsage = 0;
    }
//  }
}

- (BOOL)readRelayHandshakeInfo: (NSInputStream *)stream
{
  uint8_t buffer[MAX_RECEIVE_CONNECTION_DATA_BUFFER_SIZE];
  long len = 0;
  len = [(NSInputStream *)stream read:buffer maxLength:MAX_RECEIVE_CONNECTION_DATA_BUFFER_SIZE];
  NSLog(@"0908 ImcVideoReceiverConnection readRelayHandshakeInfo len = %ld", len);
  uint32_t relayTotalLen = *((uint32_t*)buffer);
  
  NSLog(@"0908 ImcVideoReceiverConnection readRelayHandshakeInfo relayTotalLen = %d", relayTotalLen);
//  if(relayTotalLen <= receivedBufferLength )
  {
    NSData* jsonData = [[NSData alloc] initWithBytes:(void*)(buffer + 68) length:relayTotalLen - 68];
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    NSLog(@"0908 ImcVideoReceiverConnection readRelayHandshakeInfo jsonString = %@", jsonString);
    if([jsonString rangeOfString:@"session_id"].location != NSNotFound) {
      waitForRelayHandshake = FALSE;
      int intConId = (int) self->connectionIndex;
      [self sendData: [NSData dataWithBytes: (uint8_t*)(&intConId) length: sizeof(intConId)]];
      return TRUE;
    }else{
      NSLog(@"2408 IMC_CMD_RELAY_HANDSHAKE_FAILED video");
      [delegate handleCommand: IMC_CMD_RELAY_HANDSHAKE_FAILED : nil];
    }
  }
  return FALSE;
}

-(NSString*) mobileMsgIdToString: (uint16_t) mid
{
  switch (mid) {
  case MOBILE_MSG_GROUP_COMMUNICATION_BEGIN: return @"MOBILE_MSG_GROUP_COMMUNICATION_BEGIN";
  case MOBILE_MSG_LOGIN: return @"MOBILE_MSG_LOGIN";
  case MOBILE_MSG_DISCONNECT: return @"MOBILE_MSG_DISCONNECT";
  case MOBILE_MSG_EXIT: return @"MOBILE_MSG_EXIT";
  case MOBILE_MSG_VIDEO_SOCKET_ERROR: return @"MOBILE_MSG_VIDEO_SOCKET_ERROR";
  case MOBILE_MSG_KEEP_ALIVE: return @"MOBILE_MSG_KEEP_ALIVE";
  case MOBILE_MSG_TEST: return @"MOBILE_MSG_TEST";
  case MOBILE_MSG_MINIMIZE: return @"MOBILE_MSG_MINIMIZE";
  case MOBILE_MSG_SNAPSHOT: return @"MOBILE_MSG_SNAPSHOT";
  case MOBILE_MSG_CANCEL_SNAPSHOT: return @"MOBILE_MSG_CANCEL_SNAPSHOT";
  case MOBILE_MSG_GROUP_COMMUNICATION_END: return @"MOBILE_MSG_GROUP_COMMUNICATION_END";
  case MOBILE_MSG_GROUP_VIDEO_REQUEST_BEGIN: return @"MOBILE_MSG_GROUP_VIDEO_REQUEST_BEGIN";
  case MOBILE_MSG_START_SEND_VIDEO: return @"MOBILE_MSG_START_SEND_VIDEO";
  case MOBILE_MSG_STOP_SEND_VIDEO: return @"MOBILE_MSG_STOP_SEND_VIDEO";
  case MOBILE_MSG_PAUSE_SEND_VIDEO: return @"MOBILE_MSG_PAUSE_SEND_VIDEO";
  case MOBILE_MSG_RESUME_SEND_VIDEO: return @"MOBILE_MSG_RESUME_SEND_VIDEO";
  case MOBILE_MSG_SEND_NEXT_FRAME: return @"MOBILE_MSG_SEND_NEXT_FRAME";
  case MOBILE_MSG_SEND_NEXT_ENCODE_FRAME: return @"MOBILE_MSG_SEND_NEXT_ENCODE_FRAME";
  case MOBILE_MSG_GROUP_VIDEO_REQUEST_END: return @"MOBILE_MSG_GROUP_VIDEO_REQUEST_END";
  case MOBILE_MSG_GROUP_ALARM_BEGIN: return @"MOBILE_MSG_GROUP_ALARM_BEGIN";
  case MOBILE_MSG_NEW_ALARM_DETECTED: return @"MOBILE_MSG_NEW_ALARM_DETECTED";
  case MOBILE_MSG_SEND_ALARM_LIST: return @"MOBILE_MSG_SEND_ALARM_LIST";
  case MOBILE_MSG_VIEW_ALARM_IMAGES: return @"MOBILE_MSG_VIEW_ALARM_IMAGES";
  case MOBILE_MSG_NEXT_ALARM_IMAGE: return @"MOBILE_MSG_NEXT_ALARM_IMAGE";
  case MOBILE_MSG_NEXT_ALARM_LIST: return @"MOBILE_MSG_NEXT_ALARM_LIST";
  case MOBILE_MSG_PREVIOUS_ALARM_LIST: return @"MOBILE_MSG_PREVIOUS_ALARM_LIST";
  case MOBILE_MSG_EXIT_ALARM_LIST: return @"MOBILE_MSG_EXIT_ALARM_LIST";
  case MOBILE_MSG_GROUP_ALARM_END: return @"MOBILE_MSG_GROUP_ALARM_END";
  case MOBILE_MSG_GROUP_PTZ_CONTROL_BEGIN: return @"MOBILE_MSG_GROUP_PTZ_CONTROL_BEGIN";
  case MOBILE_MSG_PTZ_CONTROL_LEFT: return @"MOBILE_MSG_PTZ_CONTROL_LEFT";
  case MOBILE_MSG_PTZ_CONTROL_RIGHT: return @"MOBILE_MSG_PTZ_CONTROL_RIGHT";
  case MOBILE_MSG_PTZ_CONTROL_UP: return @"MOBILE_MSG_PTZ_CONTROL_UP";
  case MOBILE_MSG_PTZ_CONTROL_DOWN: return @"MOBILE_MSG_PTZ_CONTROL_DOWN";
  case MOBILE_MSG_PTZ_CONTROL_ZOOM_IN: return @"MOBILE_MSG_PTZ_CONTROL_ZOOM_IN";
  case MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT: return @"MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT";
  case MOBILE_MSG_PTZ_CONTROL_LEFT_STOP: return @"MOBILE_MSG_PTZ_CONTROL_LEFT_STOP";
  case MOBILE_MSG_PTZ_CONTROL_RIGHT_STOP: return @"MOBILE_MSG_PTZ_CONTROL_RIGHT_STOP";
  case MOBILE_MSG_PTZ_CONTROL_UP_STOP: return @"MOBILE_MSG_PTZ_CONTROL_UP_STOP";
  case MOBILE_MSG_PTZ_CONTROL_DOWN_STOP: return @"MOBILE_MSG_PTZ_CONTROL_DOWN_STOP";
  case MOBILE_MSG_PTZ_CONTROL_ZOOM_IN_STOP: return @"MOBILE_MSG_PTZ_CONTROL_ZOOM_IN_STOP";
  case MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT_STOP: return @"MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT_STOP";
  case MOBILE_MSG_PTZ_CONTROL_LEFTUP: return @"MOBILE_MSG_PTZ_CONTROL_LEFTUP";
  case MOBILE_MSG_PTZ_CONTROL_RIGHUP: return @"MOBILE_MSG_PTZ_CONTROL_RIGHUP";
  case MOBILE_MSG_PTZ_CONTROL_LEFTDOWN: return @"MOBILE_MSG_PTZ_CONTROL_LEFTDOWN";
  case MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN: return @"MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN";
  case MOBILE_MSG_PTZ_CONTROL_LEFTUP_STOP: return @"MOBILE_MSG_PTZ_CONTROL_LEFTUP_STOP";
  case MOBILE_MSG_PTZ_CONTROL_RIGHUP_STOP: return @"MOBILE_MSG_PTZ_CONTROL_RIGHUP_STOP";
  case MOBILE_MSG_PTZ_CONTROL_LEFTDOWN_STOP: return @"MOBILE_MSG_PTZ_CONTROL_LEFTDOWN_STOP";
  case MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN_STOP: return @"MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN_STOP";
  case MOBILE_MSG_GROUP_PTZ_CONTROL_END: return @"MOBILE_MSG_GROUP_PTZ_CONTROL_END";
  case MOBILE_MSG_GROUP_SETTING_BEGIN: return @"MOBILE_MSG_GROUP_SETTING_BEGIN";
  case MOBILE_MSG_SEND_CAMERA_LIST: return @"MOBILE_MSG_SEND_CAMERA_LIST";
  case MOBILE_MSG_MOBILE_SEND_SETTINGS: return @"MOBILE_MSG_MOBILE_SEND_SETTINGS";
  case MOBILE_MSG_ADD_IP_CAMERAS: return @"MOBILE_MSG_ADD_IP_CAMERAS";
  case MOBILE_MSG_REMOVE_IP_CAMERAS: return @"MOBILE_MSG_REMOVE_IP_CAMERAS";
  case MOBILE_MSG_SERVER_CHANGED_PORTS: return @"MOBILE_MSG_SERVER_CHANGED_PORTS";
  case MOBILE_MSG_SERVER_SEND_SETTINGS: return @"MOBILE_MSG_SERVER_SEND_SETTINGS";
  case MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG: return @"MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG";
  case MOBILE_MSG_SERVER_CHANGED_CURRENT_USER: return @"MOBILE_MSG_SERVER_CHANGED_CURRENT_USER";
  case MOBILE_MSG_SERVER_CHANGED_SERVER_INFO: return @"MOBILE_MSG_SERVER_CHANGED_SERVER_INFO";
  case MOBILE_MSG_SEVER_SEND_HARDWARE_EXCONFIG: return @"MOBILE_MSG_SEVER_SEND_HARDWARE_EXCONFIG";
  case MOBILE_MSG_GROUP_SETTING_END: return @"MOBILE_MSG_GROUP_SETTING_END";
  case MOBILE_MSG_SEARCH_BEGIN: return @"MOBILE_MSG_SEARCH_BEGIN";
  case MOBILE_MSG_SEARCH_UPDATE_SCREEN: return @"MOBILE_MSG_SEARCH_UPDATE_SCREEN";
  case MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL: return @"MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL";
  case MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL: return @"MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL";
  case MOBILE_MSG_SEARCH_REQUEST_SETPOS: return @"MOBILE_MSG_SEARCH_REQUEST_SETPOS";
  case MOBILE_MSG_SEARCH_RESPONSE_SETPOS: return @"MOBILE_MSG_SEARCH_RESPONSE_SETPOS";
  case MOBILE_MSG_SEARCH_REQUEST_PLAY_FW: return @"MOBILE_MSG_SEARCH_REQUEST_PLAY_FW";
  case MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW: return @"MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW";
  case MOBILE_MSG_SEARCH_REQUEST_PLAY_BW: return @"MOBILE_MSG_SEARCH_REQUEST_PLAY_BW";
  case MOBILE_MSG_SEARCH_RESPONSE_PLAY_BW: return @"MOBILE_MSG_SEARCH_RESPONSE_PLAY_BW";
  case MOBILE_MSG_SEARCH_REQUEST_STOP: return @"MOBILE_MSG_SEARCH_REQUEST_STOP";
  case MOBILE_MSG_SEARCH_RESPONSE_STOP: return @"MOBILE_MSG_SEARCH_RESPONSE_STOP";
  case MOBILE_MSG_SEARCH_REQUEST_STEP_FW: return @"MOBILE_MSG_SEARCH_REQUEST_STEP_FW";
  case MOBILE_MSG_SEARCH_RESPONSE_STEP_FW: return @"MOBILE_MSG_SEARCH_RESPONSE_STEP_FW";
  case MOBILE_MSG_SEARCH_REQUEST_STEP_BW: return @"MOBILE_MSG_SEARCH_REQUEST_STEP_BW";
  case MOBILE_MSG_SEARCH_RESPONSE_STEP_BW: return @"MOBILE_MSG_SEARCH_RESPONSE_STEP_BW";
  case MOBILE_MSG_SEARCH_RAW_VIDEO: return @"MOBILE_MSG_SEARCH_RAW_VIDEO";
  case MOBILE_MSG_ENCODED_VIDEO: return @"MOBILE_MSG_ENCODED_VIDEO";
  case MOBILE_MSG_ENCODED_VIDEO_GROUP: return @"MOBILE_MSG_ENCODED_VIDEO_GROUP";
  case MOBILE_MSG_SEARCH_SESSION_DESTROY: return @"MOBILE_MSG_SEARCH_SESSION_DESTROY";
  case MOBILE_MSG_SEARCH_SESSION_DESTROY_ONE: return @"MOBILE_MSG_SEARCH_SESSION_DESTROY_ONE";
  case MOBILE_MSG_SEARCH_REQUEST_DAY_LIST: return @"MOBILE_MSG_SEARCH_REQUEST_DAY_LIST";
  case MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST: return @"MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST";
  case MOBILE_MSG_SEARCH_REQUEST_SNAPSHOT: return @"MOBILE_MSG_SEARCH_REQUEST_SNAPSHOT";
  case MOBILE_MSG_SEARCH_RESPONSE_SNAPSHOT: return @"MOBILE_MSG_SEARCH_RESPONSE_SNAPSHOT";
  case MOBILE_MSG_SERVER_SEND_TIMEZONE: return @"MOBILE_MSG_SERVER_SEND_TIMEZONE";
  case MOBILE_MSG_SERVER_RECORDING_ONLY_CANT_PLAY_VIDEO: return @"MOBILE_MSG_SERVER_RECORDING_ONLY_CANT_PLAY_VIDEO";
  case MOBILE_MSG_SEARCH_REQUEST_MAIN_SUB: return @"MOBILE_MSG_SEARCH_REQUEST_MAIN_SUB";
  case MOBILE_MSG_SEARCH_END: return @"MOBILE_MSG_SEARCH_END";
  case MOBILE_MSG_GROUP_I3DM_BEGIN: return @"MOBILE_MSG_GROUP_I3DM_BEGIN";
  case MOBILE_MSG_TIME_CHANGED: return @"MOBILE_MSG_TIME_CHANGED";
  case MOBILE_MSG_CHECK_DUMPDATA_PRESENCE: return @"MOBILE_MSG_CHECK_DUMPDATA_PRESENCE";
  case MOBILE_MSG_DUMPDATA_SESSION: return @"MOBILE_MSG_DUMPDATA_SESSION";
  case MOBILE_MSG_DUMPDATA_START: return @"MOBILE_MSG_DUMPDATA_START";
  case MOBILE_MSG_DUMPDATA_STOP: return @"MOBILE_MSG_DUMPDATA_STOP";
  case MOBILE_MSG_DUMPDATA_CANCEL: return @"MOBILE_MSG_DUMPDATA_CANCEL";
  case MOBILE_MSG_DUMPDATA_FINISH: return @"MOBILE_MSG_DUMPDATA_FINISH";
  case MOBILE_MSG_DUMPDATA_RESPONSE: return @"MOBILE_MSG_DUMPDATA_RESPONSE";
  case MOBILE_MSG_DUMPDATA_SYNCH: return @"MOBILE_MSG_DUMPDATA_SYNCH";
  case MOBILE_MSG_DUMPDATA_ENDTIME_CHANGED: return @"MOBILE_MSG_DUMPDATA_ENDTIME_CHANGED";
  case MOBILE_MSG_GROUP_I3DM_END: return @"MOBILE_MSG_GROUP_I3DM_END";
  case MOBILE_MSG_MAX_MSG_ENUM: return @"MOBILE_MSG_MAX_MSG_ENUM";
  default: return @"MOBILE_MSG_ELSEEEEEEEEEEEEEe";
  }
}
- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)eventCode
{
  long currentStreamTimePoint = (long)([[NSDate date] timeIntervalSince1970] * 1000.0);
  long deltaTime = currentStreamTimePoint - lastStreamTimePoint;
  if( stream != receivedDataStream && stream != sentDataStream )
    return;
  switch(eventCode)
  {
    case NSStreamEventOpenCompleted:
    {
      NSLog(@"1008 NSStreamEventOpenCompleted--------------------------111 deltaTime = %ld", deltaTime);
      if(loopCount < 5000)
        NSLog(@"0509 stream eventCode = NSStreamEventOpenCompleted");

    }
    break;
    case NSStreamEventHasBytesAvailable:
    {
//      if(loopCount < 5000)
//      NSLog(@"1008 NSStreamEventHasBytesAvailable-------------------------000");// deltaTime = %ld", deltaTime);
      NSLog(@"1008");
      NSLog(@"1008 >>> ImcVideoReceiverConnection case NSStreamEventHasBytesAvailable current_state = %d", current_state);
      [streamLock lock];
      if(disconnected)
      {
        NSLog(@"1008 disconnected BREAK!!!!!!!");
        [streamLock unlock];
        break;
      }

      if(waitForRelayHandshake) {
        NSLog(@"0509 waitForRelayHandshake BREAK!!!!!!!");
        [self readRelayHandshakeInfo: (NSInputStream *)stream];
        [streamLock unlock];
        break;
      }
      if(isRelay && current_state==get_cmd && relayLenRemained==0) {
        sizeWillRead = RELAY_HEADER_SIZE;
        long byteRead = sizeWillRead - receiverBufferLength;
        if(byteRead > MAX_BUFFER_SIZE)
          byteRead = MAX_BUFFER_SIZE;

        long len = [(NSInputStream *)stream read:[receiverBuffer mutableBytes]  maxLength:byteRead];
        [self notifyUpdateDataUsage: len];
        if(len > 0)
        {
          NSRange range = {receiverBufferLength, len};
          [currentData replaceBytesInRange:range withBytes:[receiverBuffer mutableBytes]];
          receiverBufferLength += len;
          if(receiverBufferLength == sizeWillRead)
          {
            current_state = get_cmd;
            uint32_t totalLen = *(uint32_t*) [currentData bytes];
            NSLog(@"1008 ImcVideoReceiverConnection NSStreamEventHasBytesAvailable RELAY_HEADER relayHeaderlen = 68 totalLen = %u", totalLen);
            relayLenRemained = totalLen - RELAY_HEADER_SIZE;
            receiverBufferLength = 0;
          }
        }
      }
      else if(current_state==get_cmd)
      {
        sizeWillRead = 2;
        long byteRead = sizeWillRead - receiverBufferLength;
        if(byteRead > MAX_BUFFER_SIZE)
          byteRead = MAX_BUFFER_SIZE;

        long len = [(NSInputStream *)stream read:[receiverBuffer mutableBytes]  maxLength:byteRead];
        NSLog(@"1008 ImcVideoReceiverConnection NSStreamEventHasBytesAvailable get_cmd len = %ld", len);
        [self notifyUpdateDataUsage: len];
        if(len > 0)
        {
          NSRange range = {receiverBufferLength, len};
          [currentData replaceBytesInRange:range withBytes:[receiverBuffer mutableBytes]];
          receiverBufferLength += len;
          if(receiverBufferLength == sizeWillRead)
          {
            currentCmd = *(uint16_t*)([currentData bytes]);
            BOOL readCmdNext = [self processCmd];
            receiverBufferLength = 0;
            if(isRelay)
              relayLenRemained = readCmdNext ? 0 : relayLenRemained - sizeWillRead;
          }
        }
      }
      else if(current_state==get_header)
      {
        long byteRead = sizeWillRead - receiverBufferLength;
        if(byteRead > MAX_BUFFER_SIZE)
          byteRead = MAX_BUFFER_SIZE;

        long len = [(NSInputStream *)stream read:[receiverBuffer mutableBytes]  maxLength:byteRead];
        [self notifyUpdateDataUsage: len];
        NSLog(@"1008 ImcVideoReceiverConnection NSStreamEventHasBytesAvailable get_header len = %ld", len);
        if(len > 0)
        {
          NSRange range = {receiverBufferLength, len};
          [currentData replaceBytesInRange:range withBytes:[receiverBuffer mutableBytes]];
          receiverBufferLength += len;
          if(receiverBufferLength == sizeWillRead)
          {
            BOOL readCmdNext = [self processHeader];
            receiverBufferLength = 0;
            if(isRelay)
              relayLenRemained = readCmdNext ? 0 : relayLenRemained - sizeWillRead;
          }
        }
      }
      else if(current_state==get_data)
      {
        long byteRead = sizeWillRead - receiverBufferLength;
        if(byteRead > MAX_BUFFER_SIZE)
          byteRead = MAX_BUFFER_SIZE;

        long len = [(NSInputStream *)stream read:[receiverBuffer mutableBytes] maxLength:byteRead];
        [self notifyUpdateDataUsage: len];
        NSLog(@"1008 ImcVideoReceiverConnection NSStreamEventHasBytesAvailable get_data len = %ld", len);
        if(len > 0)
        {
          NSRange range = {receiverBufferLength, len};
          [currentData replaceBytesInRange:range withBytes:[receiverBuffer mutableBytes]];
          receiverBufferLength += len;
          if(receiverBufferLength == sizeWillRead)
          {
            BOOL readCmdNext = [self processData];
            receiverBufferLength = 0;
            if(isRelay)
              relayLenRemained = readCmdNext ? 0 : relayLenRemained - sizeWillRead;
          }
        }
      }

      [streamLock unlock];

    }
      break;
    case NSStreamEventErrorOccurred:
    {
      NSLog(@"1008 NSStreamEventErrorOccurred-------------------------222 deltaTime = %ld", deltaTime);
      //disconnected = TRUE;
      if( self ){
        [self disconnectToServer];
        NSLog(@"1008 0509 disconnectToServer 4");
      }
    }
      break;
    case NSStreamEventEndEncountered:
    {
      NSLog(@"1008 NSStreamEventEndEncountered-------------------------333 deltaTime = %ld", deltaTime);
      NSLog(@"Close: Video Stream");
      if( self ) {
        [self disconnectToServer];
        NSLog(@"1008 0509 disconnectToServer 3");
      }
    }
      break;
    default:
      break;
  }
  lastStreamTimePoint = currentStreamTimePoint;
//  NSLog(@"1008 stream lastStreamTimePoint = %ld", lastStreamTimePoint);
}

-(BOOL)processCmd
{
  NSLog(@"1008 processCmd %@", [self mobileMsgIdToString: currentCmd]);
  switch( currentCmd )
  {
    case MOBILE_MSG_DISCONNECT:
//      if(!isRelay)
        disconnected = TRUE;
      NSLog(@"0509 MOBILE_MSG_DISCONNECT 1");
      sizeWillRead = 2;
      break;
    case MOBILE_MSG_MINIMIZE:
      sizeWillRead = 2;
      break;
    case MOBILE_MSG_KEEP_ALIVE:
      sizeWillRead = 2;
      NSLog(@"Video - Keep Alive");
      break;
    case MOBILE_MSG_SEND_NEXT_FRAME:
    case MOBILE_MSG_ENCODED_VIDEO:
    case MOBILE_MSG_ENCODED_VIDEO_GROUP:
    case MOBILE_MSG_SEND_NEXT_ENCODE_FRAME:
    {
      uint32_t headerSize = FRAME_HEADER_SIZE;
      if( parent.serverVersion >= VERSION_2300 )
      {
        if (parent.serverVersion < VERSION_3300) {
          headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_2;
        }
        else
        {
          headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_3;
        }
      }
      sizeWillRead = headerSize;
      current_state = get_header;
    }
      break;
    default:
    {
      sizeWillRead = 2;
      current_state = get_cmd;
      NSLog(@"1008 assign current_state = get_cmd processCmd default");
      return YES;
    }
      break;
  }
  return NO;
}

-(BOOL)processHeader
{
  NSLog(@"1008 processHeader %@", [self mobileMsgIdToString: currentCmd]);
  
  switch( currentCmd )
  {
    case MOBILE_MSG_SEND_NEXT_FRAME:
    {
      uint8_t* data = (uint8_t*)[currentData bytes];
      NSUInteger size = receiverBufferLength;
      NSInteger frameLength = 0;
      if( parent.serverVersion < VERSION_2300 )
      {
        frameHeader = [[FrameHeader alloc] initFromBuffer:data:size];
        frameLength = ((FrameHeader*)frameHeader).length;
      }
      
      else
      {
        frameHeader = [[FrameHeaderEx alloc] initFromBuffer:data:size];
        frameLength = ((FrameHeaderEx*)frameHeader).length;
      }
      sizeWillRead = frameLength;
      current_state = get_data;
    }
      break;
    case MOBILE_MSG_ENCODED_VIDEO:
    case MOBILE_MSG_ENCODED_VIDEO_GROUP:
    case MOBILE_MSG_SEND_NEXT_ENCODE_FRAME:
    {
      uint8_t* data = (uint8_t*)[currentData bytes];
      NSUInteger size = receiverBufferLength;
      frameHeader = [[FrameHeaderEx alloc] initFromBuffer:data :size];
      sizeWillRead = frameHeader.length;
      current_state = get_data;
    }
      break;
    default:
    {
      sizeWillRead = 2;
      current_state = get_cmd;
      NSLog(@"1008 assign current_state = get_cmd processHeader default");
      return YES;
    }
      break;
  }
  return NO;
}

- (BOOL)processData
{
  NSLog(@"1008 processData1 %@", [self mobileMsgIdToString: currentCmd]);
  
  switch( currentCmd )
  {
    case MOBILE_MSG_SEND_NEXT_FRAME:
    {
      if (frameHeader)
      {
        uint8_t* data = (uint8_t*)[currentData bytes];
        NSUInteger size = receiverBufferLength;
        BitmapFrame* frame = [[BitmapFrame alloc] initWithHeader:frameHeader withImageBuffer:data length:size];
        if( frame && parent )
        {
          [parent postVideoFrame:frame];
        }
      }
      current_state = get_cmd;
      NSLog(@"1008 assign current_state = get_cmd processData MOBILE_MSG_SEND_NEXT_FRAME");
      sizeWillRead = 2;
      return YES;
    }
      break;
    case MOBILE_MSG_ENCODED_VIDEO:
    case MOBILE_MSG_ENCODED_VIDEO_GROUP:
    {
      uint8_t* data = (uint8_t*)[currentData bytes];
      NSUInteger size = receiverBufferLength;
      EncodedFrame* newFrame = [[EncodedFrame alloc] initWithHeader:frameHeader withBuffer: data length:size forServerVersion:parent.serverVersion];
      if( newFrame)
      {
        if( parent )
        {
          if (newFrame.header.codecType == 3)
          {
            [parent postSearchEncodedFrame:newFrame];
            sizeWillRead = 2;
          }
          else if (newFrame.header.codecType < 3 && newFrame.header.codecType >= 0)
          {
            BitmapFrame* frame = [[BitmapFrame alloc] initwithRawData:data length:size version:parent.serverVersion];
            if( frame )
            {
              [parent postVideoFrame:frame];
            }
          }
        }
      }
      // free(data);
      current_state = get_cmd;
      NSLog(@"1008 assign current_state = get_cmd processData MOBILE_MSG_ENCODED_VIDEO MOBILE_MSG_ENCODED_VIDEO_GROUP");
      sizeWillRead = 2;
      return YES;
    }
      break;
    case MOBILE_MSG_SEND_NEXT_ENCODE_FRAME:
    {
      uint8_t* data = (uint8_t*)[currentData bytes];
      NSUInteger size = receiverBufferLength;
      EncodedFrame* newFrame = [[EncodedFrame alloc] initWithHeader:frameHeader withBuffer:data length:size forServerVersion:parent.serverVersion];
      if( newFrame && parent)
      {
        [parent postEncodedFrame:newFrame];
    // dongpt: add nil
        newFrame = nil;
      }
    // dongpt: add nil
      data = nil;
      current_state = get_cmd;
      NSLog(@"1008 assign current_state = get_cmd processData MOBILE_MSG_SEND_NEXT_ENCODE_FRAME");
      sizeWillRead = 2;
      return YES;
    }
      break;
    default:
    {
      sizeWillRead = 2;
      current_state = get_cmd;
      NSLog(@"1008 assign current_state = get_cmd processData default");
      return YES;
    }
      break;
  }
  return NO;
}

#if false
- (BOOL)processData
{
  
  uint16_t cmd = *(uint16_t*)receiverBuffer;
  
  NSLog(@"1008 processData2 %@", [self mobileMsgIdToString: cmd]);
  uint32_t movedBytes = 0;
  switch( cmd )
  {
    case MOBILE_MSG_DISCONNECT:
    {
      movedBytes = 2;
      disconnected = TRUE;
      //[self disconnectToServer];
      NSLog(@"0509 MOBILE_MSG_DISCONNECT 2");
      sizeWillRead = 2;
    }
      break;
    case MOBILE_MSG_MINIMIZE:
      movedBytes = 2;
      sizeWillRead = 2;
      break;
    case MOBILE_MSG_KEEP_ALIVE:
      movedBytes = 2;
      sizeWillRead = 2;
      NSLog(@"Video - Keep Alive");
      break;
    case MOBILE_MSG_SEND_NEXT_FRAME:
    {
      //@autoreleasepool
      {
        //NSLog(@"Analog Frame Came");
        if (receiverBufferLength < 2) {
          sizeWillRead = 2;
          return NO;
        }
        
        uint32_t headerSize = FRAME_HEADER_SIZE;
        if( parent.serverVersion < VERSION_2300 )
          headerSize = FRAME_HEADER_SIZE;
        else if (parent.serverVersion < VERSION_3300) {
          headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_2;
        }
        else
        {
          headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_3;
        }
        
        if( receiverBufferLength >= headerSize + 2 )
        {
          
          id frameHeader = nil;
          NSInteger frameLength = 0;
          if( parent.serverVersion < VERSION_2300 )
          {
            frameHeader = [[FrameHeader alloc] initFromBuffer:receiverBuffer + 2 :headerSize];
            frameLength = ((FrameHeader*)frameHeader).length;
          }
          
          else
          {
            frameHeader = [[FrameHeaderEx alloc] initFromBuffer:receiverBuffer + 2 :headerSize];
            frameLength = ((FrameHeaderEx*)frameHeader).length;
          }
          
          
          //BitmapFrame* frame = [[BitmapFrame alloc] initwithRawData:receiverBuffer + 2 length:receiverBufferLength - 2 version:parent.serverVersion];
          if (receiverBufferLength < headerSize + frameLength + 2)
          {
            sizeWillRead = frameLength;
            return NO;
          }
          
          if (frameHeader) {
            BitmapFrame* frame = [[BitmapFrame alloc] initWithHeader:frameHeader withImageBuffer:receiverBuffer + 2 + headerSize length:frameLength];
            if( frame )
            {
              if( parent )
                [parent postVideoFrame:frame];
              
              movedBytes = frameLength + headerSize + 2;
              sizeWillRead = 2;
              return YES;
            }
            else
            {
              NSLog(@"");
            }
          }
          else
          {
            NSLog(@"");
          }
          
        }
        else
        {
          sizeWillRead = headerSize;
          return NO;
        }
      }
    }
      break;
      
    case MOBILE_MSG_ENCODED_VIDEO:
    case MOBILE_MSG_ENCODED_VIDEO_GROUP:
    {
      //NSLog(@"AAAAAA");
      // @autoreleasepool
      {
        if (receiverBufferLength < 2) {
          sizeWillRead = 2;
          return NO;
        }
        
        uint32_t headerSize = FRAME_HEADER_SIZE;
        if( parent.serverVersion >= VERSION_2300 )
        {
          if (parent.serverVersion < VERSION_3300) {
            headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_2;
          }
          else
          {
            headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_3;
          }
        }
        
        if( receiverBufferLength >= headerSize + 2 )
        {
          //encodedFrame* newFrame = [[encodedFrame alloc] init];
          
          FrameHeaderEx* frameHeader = nil;
          
          uint8_t* _buffer = (receiverBuffer + 2);
          if( parent.serverVersion < VERSION_2300 )
            frameHeader = [[FrameHeaderEx alloc] initFromBuffer:_buffer :receiverBufferLength - 2];
          else
            frameHeader = [[FrameHeaderEx alloc] initFromBuffer:_buffer :receiverBufferLength - 2];
          
          if (frameHeader.length > receiverBufferLength - 2 - headerSize) {
            sizeWillRead = frameHeader.length;
            return NO;
          }
          
          uint8_t* _frame_buffer = (_buffer + headerSize);
          encodedFrame* newFrame = [[encodedFrame alloc] initWithHeader:frameHeader withBuffer: _frame_buffer length:frameHeader.length forServerVersion:parent.serverVersion];
          sizeWillRead = 2;
          //frameHeader = nil;
          if( newFrame)
          {
            if( parent )
            {
              if (newFrame.header.codecType == 3)
              {
                [parent postSearchEncodedFrame:newFrame];
                movedBytes = [newFrame getFrameBufferSizeForServerVersion:parent.serverVersion] + 2;
                sizeWillRead = 2;
              }
              else if (newFrame.header.codecType < 3 && newFrame.header.codecType >= 0)
              {
                BitmapFrame* frame = [[BitmapFrame alloc] initwithRawData:receiverBuffer + 2 length:receiverBufferLength - 2 version:parent.serverVersion];
                if( frame )
                {
                  if( parent )
                    [parent postVideoFrame:frame];
                  
                  movedBytes = headerSize + frame.header.length + 2;
                  
                  sizeWillRead = 2;
                  break;
                }
                
              }
            }
          }
          else
          {
            sizeWillRead = 2;
            return YES;
          }
        }
        else
        {
          sizeWillRead = headerSize;
          return NO;
        }
      }
      
    }
      break;
    case MOBILE_MSG_SEND_NEXT_ENCODE_FRAME:
    {
      if (receiverBufferLength < 2) {
        sizeWillRead = 2;
        return NO;
      }
      uint32_t headerSize = FRAME_HEADER_SIZE;
      if( parent.serverVersion >= VERSION_2300 )
      {
        if (parent.serverVersion < VERSION_3300) {
          headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_2;
        }
        else
        {
          headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_3;
        }
      }
      
      if( receiverBufferLength >= headerSize + 2 )
      {
        FrameHeaderEx* frameHeader = nil;
        uint8_t* _buffer = (receiverBuffer + 2);
        if( parent.serverVersion < VERSION_2300 )
          frameHeader = [[FrameHeaderEx alloc] initFromBuffer: _buffer :receiverBufferLength - 2];
        else
          frameHeader = [[FrameHeaderEx alloc] initFromBuffer: _buffer :receiverBufferLength - 2];
        
        if (frameHeader.length > receiverBufferLength - 2 - headerSize) {
          sizeWillRead = frameHeader.length;
          return NO;
        }
        
        uint8_t* _frame_buffer = (_buffer + headerSize);
        encodedFrame* newFrame = [[encodedFrame alloc] initWithHeader:frameHeader withBuffer:_frame_buffer length:frameHeader.length forServerVersion:parent.serverVersion];
        //frameHeader = nil;
        if( newFrame )
        {
          if( parent )
            [parent postEncodedFrame:newFrame];
          newFrame = nil;
          movedBytes = headerSize + frameHeader.length + 2;
          sizeWillRead = 2;
        }
        else
        {
          sizeWillRead = 2;
          return YES;
        }
      }
      else
      {
        sizeWillRead = headerSize;
        return NO;
      }
    }
      break;
      
    default:
    {
      sizeWillRead = 2;
    }
      break;
  }
  return YES;
}
#endif

@end

