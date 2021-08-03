//
//  ImcRemoteConnection.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/20/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import <Foundation/Foundation.h>
#import "../NSDate+Utils.h"
#import "../Imcbase.h"
#import "../MobileBase.h"
#import "ImcRemoteConnection.h"
#import "../GDataXMLNode.h"
#import "../NSData+AESCrypt.h"
#import "ImcMobileCommand.h"
#import "ImcVideoReceiverConnection.h"
#import "../ImcServerSetting.h"
#import "../ImcCameraList.h"
#import "../VideoFrame.h"
#import "AppDelegate.h"

#define KEEP_ALIVE_CHECKING_INTERVAL 5 // 15 seconds
#define MAX_KEEP_ALIVE_COUNTING 10

@implementation ImcRemoteConnection

@synthesize delegate,deviceSetting,deviceCameraList,serverInfo,serverVersion,snapshotChannel, waitForAccept, loginTimer, dataQueue, streamingRL;

- (id)init:(ImcConnectionServer *)server
{
  self = [super init];
  if( self )
  {
    serverInfo              = [[ImcConnectionServer alloc] init];
    [serverInfo updateServerInfo:server];
    waitForAccept           = FALSE;
    getLoginStatus          = FALSE;
    key                     = [Global generateEASKey];
    receivedBuffer          = nil;//malloc(MAX_RECEIVE_BUFFER_SIZE);
    //currentData             = [[NSMutableData alloc] initWithLength:MAX_RECEIVE_CONNECTION_DATA_BUFFER_SIZE];
    receivedBufferLength    = 0;
    videoConnection         = nil;
    receivedDataStream      = nil;
    sentDataStream          = nil;
    deviceSetting           = [[ImcServerSetting alloc] init];
    deviceCameraList        = [[ImcCameraList alloc] init];
    connectionLock          = [[NSLock alloc] init];
    isConnected            = FALSE;
    serverVersion           = VERSION_CURRENT;
    keepAliveCounter                   = 0;
    waitToRead              = [[NSCondition alloc] init];
    keepAliveTimer          = nil;
    streamingRL             = nil;
    dataQueue               = nil;
    queueName               = nil;
    movedBytes              = 0;
    connectionError         = FALSE;
    firstConnect            = YES;
  }
  return self;
}

- (void)dealloc
{
  
  videoConnection = nil;
  receivedBuffer = nil;
  currentData = nil;
}

- (BOOL)setupConnection
{
  CFStringRef adddress;
  if(firstConnect)
    adddress = (__bridge CFStringRef)serverInfo.server_address;
  else
    adddress = (__bridge CFStringRef)serverInfo.public_address;
  unsigned int port = (unsigned int)serverInfo.server_port;
  queueName = [NSString stringWithFormat:@"com.i3international.mobilesocket.%@:%d",serverInfo.server_address,port];
  keepAliveCounter = 0;
  if( adddress == nil || port > 65535 )
  {
    return FALSE;
  }
  
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    if(!dataQueue)
      dataQueue = dispatch_queue_create([queueName UTF8String], DISPATCH_QUEUE_SERIAL);
    CFReadStreamRef readStream;
    CFWriteStreamRef writeStream;
    
    readStream = NULL;
    writeStream = NULL;
    
    CFStreamCreatePairWithSocketToHost(kCFAllocatorDefault, adddress, port, &readStream, &writeStream);
    
    
    if( readStream && writeStream )
    {
      waitForAccept = TRUE;
      isConnected = TRUE;
      
      CFReadStreamSetProperty(readStream,
                              kCFStreamPropertyShouldCloseNativeSocket,
                              kCFBooleanTrue);
      CFWriteStreamSetProperty(writeStream,
                               kCFStreamPropertyShouldCloseNativeSocket,
                               kCFBooleanTrue);
      
      receivedDataStream = (__bridge NSInputStream *)readStream;
      sentDataStream = (__bridge NSOutputStream *)writeStream;
      
      [receivedDataStream setDelegate:self];
      [sentDataStream setDelegate:self];
      
      
      streamingRL = [NSRunLoop currentRunLoop];
      loginTimer = [NSTimer timerWithTimeInterval:10 target:self selector:@selector(onLoginTimeout) userInfo:nil repeats:YES];
      [streamingRL addTimer:loginTimer forMode:NSDefaultRunLoopMode];
      
      [receivedDataStream scheduleInRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
      [sentDataStream scheduleInRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
      
      [receivedDataStream open];
      [sentDataStream open];
      
      [streamingRL run];
    }
    
  });
  
  return TRUE;
}

- (void)onLoginTimeout
{
  NSLog(@"******** onLoginTimeout: %ld ******", (long)keepAliveCounter);
  if( keepAliveCounter > MAX_KEEP_ALIVE_COUNTING )
  {
    keepAliveCounter = 0;
    [loginTimer invalidate];
    loginTimer = nil;
    
    if(firstConnect&&serverInfo.public_address.length > 0 &&
       ![serverInfo.public_address isEqualToString:serverInfo.server_address]) // first connected, try other IP Address
    {
      firstConnect = NO;
      isConnected = NO;
      [self closeStreams];
      [self setupConnection];
      return;
    }
    
    // time out
    ImcConnectionStatus* status = [[ImcConnectionStatus alloc] initWithParam:self:(int32_t)-1 : (int32_t)MOBILE_LOGIN_MESSAGE_CANNOT_CONNECT];
    if(self.delegate)
    {
      waitForAccept = FALSE;
      [delegate handleCommand:IMC_CMD_CONNECTION_CONNECT_RESPONSE :status];
      isConnected = FALSE;
      delegate = nil;
    }
  }
  keepAliveCounter++;
}

- (void)onKeepAlive : (NSTimer*)targetTimer
{
  keepAliveCounter++;
  NSLog(@"******** OnKeepAlive: %ld ******", (long)keepAliveCounter);
  if(keepAliveCounter >= MAX_KEEP_ALIVE_COUNTING)
  {
    [keepAliveTimer invalidate];
    keepAliveTimer = nil;
    [connectionLock lock];
    //[NSThread detachNewThreadSelector:@selector(onDisconnect:) toTarget:self withObject:nil];
    [self closeStreams];
    [connectionLock unlock];
    [self onDisconnect:nil];
  }
}

- (void)destroyTimers
{
  keepAliveCounter = 0;
  if( loginTimer )
  {
    [loginTimer invalidate];
    loginTimer = nil;
  }
  
  if(keepAliveTimer)
  {
    [keepAliveTimer invalidate];
    keepAliveTimer = nil;
  }
}

- (void)closeStreams
{
  [sentDataStream close];
  [receivedDataStream close];
  [sentDataStream removeFromRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
  [receivedDataStream removeFromRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
  sentDataStream = nil;
  receivedDataStream = nil;
  
}


- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)eventCode
{
  if( stream != receivedDataStream && stream != sentDataStream )
    return;
  switch(eventCode)
  {
    case NSStreamEventHasBytesAvailable:
    {
      [connectionLock lock];
      
      uint8_t buffer[MAX_RECEIVE_CONNECTION_DATA_BUFFER_SIZE];
      long len = 0;
      
      len = [receivedDataStream read:buffer maxLength:MAX_RECEIVE_CONNECTION_DATA_BUFFER_SIZE];
      if( len > 0)
      {
        receivedBufferLength += len;
        NSLog(@"*** Received Buffer Size: %d", receivedBufferLength);
        if(currentData==nil)
        {
          currentData = [NSMutableData dataWithBytes:(const void *)buffer length:len];
        }
        else
        {
          [currentData appendBytes:(const void *)buffer length:len];
          
        }
      }
      else
      {
        NSLog(@"No Input Buffer : %@",stream.streamError);
      }
      
      
      
      receivedBuffer = (uint8_t*)[currentData bytes];
      
      while( receivedBufferLength > 0)
      {
        @autoreleasepool
        {
          BOOL result = FALSE;
          if( waitForAccept )
          {
            getLoginStatus = FALSE;
            result = [self readAcceptInfo:nil];
          }
          else
            result = [self processCommand];
          
          if( result == TRUE )
          {
            receivedBufferLength -= movedBytes;
            if( receivedBufferLength == 0)
            {
              currentData = nil;
            }
            else
            {
              receivedBuffer = receivedBuffer + movedBytes;
            }
          }
          else
          {
            if(currentData && ([currentData bytes] != receivedBuffer))
            {
              currentData = [NSMutableData dataWithBytes:receivedBuffer + movedBytes length:receivedBufferLength];
              
            }
            break;
          }
        }
      }
      
      [connectionLock unlock];
    }
      break;
    case NSStreamEventErrorOccurred:
    {
      [connectionLock lock];
      if(stream!=receivedDataStream&&stream!=sentDataStream)
      {
        [connectionLock unlock];
        break;
      }
      
      if( waitForAccept&&isConnected)
      {
        if(firstConnect&&serverInfo.public_address.length > 0 &&
           ![serverInfo.public_address isEqualToString:serverInfo.server_address]) // first connected, try other IP Address
        {
          firstConnect = NO;
          isConnected = NO;
          [self closeStreams];
          [self setupConnection];
          [connectionLock unlock];
          break;
        }
      }
      
      if( waitForAccept || getLoginStatus )
      {
        connectionError = TRUE;
        ImcConnectionStatus* status = [[ImcConnectionStatus alloc] initWithParam:self:(int32_t)-1 : (int32_t)MOBILE_LOGIN_MESSAGE_CANNOT_CONNECT];
        if( self.delegate )
        {
          if(getLoginStatus)
          {
            [self closeStreams];
            [self onDisconnect:nil];
          }
          else
            [self.delegate handleCommand:IMC_CMD_CONNECTION_CONNECT_ERROR :status];
          delegate = nil;
        }
      }
      NSLog(@"Connection Error");
      [connectionLock unlock];
    }
      break;
    case NSStreamEventEndEncountered:
    {
      [connectionLock lock];
      if(stream==receivedDataStream||stream==sentDataStream)
      {
        if (isConnected)
        {
          isConnected = FALSE;
          [self closeStreams];
          
          [self onDisconnect:nil];
        }
      }
      [connectionLock unlock];
      
    }
      break;
    default:
      break;
  }
}


-(ImcMobileCommand*)parserData:(NSData *)data
{
  uint8_t* bytes = (uint8_t*)[data bytes];
  uint32_t length = *((uint32_t*)(bytes+2));
  if( length + MOBILE_COMM_COMMAND_HEADER_SIZE > data.length )
    return nil;
  NSData* parserData = [[NSData alloc] initWithBytes:bytes length:length+MOBILE_COMM_COMMAND_HEADER_SIZE];
  ImcMobileCommand* packet = [[ImcMobileCommand alloc] initWithData:parserData];
  return packet;
}

- (BOOL)readAcceptInfo:(NSMutableData *)data
{
  if( receivedBufferLength <= 4 )
    return FALSE;
  uint32_t length = *((uint32_t*)receivedBuffer);
  if(length + 4 <= receivedBufferLength )
  {
    NSData* xmlData = [[NSData alloc] initWithBytes:(void*)(receivedBuffer + 4) length:length];
    GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:nil];
    if( doc )
    {
      if( [[doc.rootElement localName] isEqualToString:@"ACCEPT_INFO"] )
      {
        GDataXMLElement* serverVersionNode = (GDataXMLElement*)[doc.rootElement attributeForName:@"server_version"];
        serverVersion = [[serverVersionNode stringValue] integerValue];
        if( serverVersion > 0 )
        {
          waitForAccept = FALSE;
          NSData* sentData = [self constructLoginInfo];
          [self sendData:sentData];
        }
      }
    }
    movedBytes = length + 4;
    return TRUE;
  }
  return FALSE;
}

- (BOOL)getLoginStatus:(NSMutableData *)data
{
  return FALSE;
}


- (BOOL)processCommand
{
  if( receivedBufferLength < 2 )
    return FALSE;
  movedBytes = 0;
  uint16_t cmd = *(uint16_t*)receivedBuffer;
  BOOL onlyCmd = FALSE;
  if( cmd == MOBILE_MSG_KEEP_ALIVE )
  {
    NSLog(@"Server %@ keep alive",serverInfo.serverName);
    keepAliveCounter = 0;
    onlyCmd = TRUE;
  }
  else if (cmd == MOBILE_MSG_SERVER_CHANGED_CURRENT_USER)
  {
    NSLog(@"MOBILE_MSG_SERVER_CHANGED_CURRENT_USER");
    onlyCmd = TRUE;
    [delegate handleCommand:IMC_CMD_SERVER_CHANGED_CURRENT_USER :serverInfo];
  }
  
  else if ( cmd == MOBILE_MSG_SERVER_CHANGED_SERVER_INFO)
  {
    NSLog(@"MOBILE_MSG_SERVER_CHANGED_SERVER_INFO");
    onlyCmd = TRUE;
    [delegate handleCommand:IMC_CMD_SERVER_CHANGE_INFO:serverInfo];
  }
  else if (cmd == MOBILE_MSG_SERVER_CHANGED_PORTS)
  {
    NSLog(@"MOBILE_MSG_SERVER_CHANGED_PORTS");
    onlyCmd = TRUE;
    [delegate handleCommand:IMC_CMD_SERVER_CHANGED_PORTS:serverInfo];
  }
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_SNAPSHOT)
  {
    onlyCmd = TRUE;
  }
  else if( cmd == MOBILE_MSG_MOBILE_SEND_SETTINGS )
  {
    movedBytes = 3;
    NSLog(@"mobile send setting");
    return TRUE;
  }
  else if( cmd == MOBILE_MSG_START_SEND_VIDEO )
  {
    if(receivedBufferLength >=6)
    {
      int32_t videoPort = *(int32_t*)(receivedBuffer + 2);
      if(videoConnection)
        [videoConnection disconnectToServer];
      videoConnection = [[ImcVideoReceiverConnection alloc] initWithConnectionIndex:connectionIndex];
      NSString* address;
      if(firstConnect)
        address = serverInfo.server_address;
      else
        address = serverInfo.public_address;
      [videoConnection connectToServer:address :videoPort];
      videoConnection.parent = self;
      movedBytes = 6;
      connectingVideoPort = FALSE;
      NSLog(@"Start video Port");
      return TRUE;
    }
  }
  else if( cmd == MOBILE_MSG_SEND_ALARM_LIST ||
          cmd == MOBILE_MSG_NEXT_ALARM_LIST ||
          cmd == MOBILE_MSG_PREVIOUS_ALARM_LIST )
  {
    if( receivedBufferLength < 3 )
      return FALSE;
    uint8_t result = *(uint8_t*)(receivedBuffer+2);
    ImcAlarmEventList* alarmList = [[ImcAlarmEventList alloc] initFromServerAddress:serverInfo.server_address andPort:serverInfo.server_port];
    NSInteger sentCmd = 0;
    if( result == MOBILE_MSG_FAIL )
    {
      movedBytes = 3;
      alarmList.alarmViewStatus = 1;
    }
    else
    {
      uint32_t length;
      if( cmd != MOBILE_MSG_PREVIOUS_ALARM_LIST )
      {
        uint8_t status = *(uint8_t*)(receivedBuffer + 3);
        alarmList.alarmViewStatus = status;
        length = *(uint32_t*)(receivedBuffer + 4);
        if( receivedBufferLength >= length + 8 )
        {
          NSData* data = [[NSData alloc] initWithBytes:(receivedBuffer + 8) length:length];
          [alarmList parserXMLData:data];
          movedBytes = length + 8;
        }
        else
          return FALSE;
      }
      else
      {
        length = *(uint32_t*)(receivedBuffer + 3);
        if( receivedBufferLength >= length + 7 )
        {
          NSData* data = [[NSData alloc] initWithBytes:(receivedBuffer + 7) length:length];
          [alarmList parserXMLData:data];
          movedBytes = length + 7;
        }
        else
          return FALSE;
      }
      
    }
    
    switch (cmd ) {
      case MOBILE_MSG_SEND_ALARM_LIST:
        sentCmd = IMC_CMD_SEND_ALARM_LIST_RESPONSE;
        break;
      case MOBILE_MSG_NEXT_ALARM_LIST:
        sentCmd = IMC_CMD_NEXT_ALARM_LIST_RESPONSE;
        break;
      case MOBILE_MSG_PREVIOUS_ALARM_LIST:
        sentCmd = IMC_CMD_PREVIOUS_ALARM_LIST_RESPONSE;
        break;
      default:
        break;
    }
    [delegate handleCommand:sentCmd :alarmList];
    return TRUE;
  }
  else if (cmd == MOBILE_MSG_NEW_ALARM_DETECTED)
  {
    NSLog(@"---NEW ALRM---");
    
    if( receivedBufferLength < 3 )
    {
      NSLog(@"---Return FAIL 1---");
      return FALSE;
    }
    
    
    ImcAlarmEventList* alarmList = [[ImcAlarmEventList alloc] initFromServerAddress:serverInfo.server_address andPort:serverInfo.server_port];
    
    uint32_t length;
    
    length = *(uint32_t*)(receivedBuffer + 2);
    
    if (receivedBufferLength < length) {
      return FALSE;
    }
    
    NSData* data = [[NSData alloc] initWithBytes:(receivedBuffer + 6) length:length];
    
    ImcAlarmEventData* alarmEvent = [alarmList parserXMLElement:data];
    movedBytes = length + 6;
    [alarmList.listAlarmEvents addObject:alarmEvent];
    
    NSInteger sentCmd = IMC_CMD_NEW_ALARM_DETECTED;
    
    if (receivedBufferLength < movedBytes) {
      movedBytes = receivedBufferLength;
    }
    
    [delegate handleCommand:sentCmd :alarmList];
    return TRUE;
    
  }
  else if( cmd ==  MOBILE_MSG_SNAPSHOT )
  {
    if (receivedBufferLength < 3) {
      return  FALSE;
    }
    NSLog(@"---SnapShot Came");
    
    uint32_t headerSize;
    if( serverVersion < VERSION_2300 )
      headerSize = FRAME_HEADER_SIZE;
    else if (serverVersion < VERSION_3300) {
      headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_2;
    }
    else
    {
      headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_3;
    }
    
    if( receivedBufferLength > headerSize + 2 )
    {
      keepAliveCounter = 0;
      uint8_t* bytes = receivedBuffer + 2;
      FrameHeader* frameHeader = nil;
      if( serverVersion < VERSION_2300 )
        frameHeader = [[FrameHeader alloc] initFromBuffer:bytes :headerSize];
      else
        frameHeader = [[FrameHeaderEx alloc] initFromBuffer:bytes :headerSize];
      
      if( frameHeader )
      {
        bytes += headerSize;
        
        
        if (frameHeader.codecType == 3)
        {
          uint32_t headerSize = FRAME_HEADER_SIZE;
          if( serverVersion >= VERSION_2300 )
          {
            if (serverVersion < VERSION_3300) {
              headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_2;
            }
            else
            {
              headerSize = FRAME_HEADER_EX_SIZE_SERVER_3_3;
            }
          }
          if( receivedBufferLength > headerSize + 2 )
          {
            EncodedFrame* newFrame = [[EncodedFrame alloc] init];
            
            NSInteger result = [newFrame initwithRawData:receivedBuffer + 2 length:receivedBufferLength - 2 version:serverVersion];
            if (receivedBufferLength < newFrame.header.length) {
              return FALSE;
            }
            if( result != -1)
            {
              //if( self )
              {
                if (newFrame.header.codecType == 3) {
                  //if (self)
                  {
                    NSLog(@"---SnapShot Came");
                    //newFrame.header.snapshotImage = TRUE;
                    [self postSnapshotEncodedFrame:newFrame];
                  }
                }
              }
              movedBytes = [newFrame getFrameBufferSizeForServerVersion:serverVersion] + 2;
              return TRUE;
              
            }
            else
              return FALSE;
          }
          else
            return FALSE;
          
        }
        else
        {
          if( receivedBufferLength >= [frameHeader getLength] + headerSize )
          {
            if (serverVersion > VERSION_3200) {
              
              if (frameHeader.codecType < 3) {
                BitmapFrame* frame = [[BitmapFrame alloc] initWithHeader:frameHeader withImageBuffer:bytes length:[frameHeader getLength]];
                [self postSnapshotImage:frame];
                movedBytes = [frameHeader getLength] + headerSize + 2;
                return TRUE;
              }
              else
              {
                EncodedFrame* newFrame = [[EncodedFrame alloc] init];
                
                
                NSInteger result = [newFrame initwithRawData:receivedBuffer + 2 length:receivedBufferLength - 2 version:serverVersion];
                
                if (receivedBufferLength < newFrame.header.length) {
                  return FALSE;
                }
                if( result != -1)
                {
                  NSLog(@"---SnapShot Came");
                  //newFrame.header.snapshotImage = TRUE;
                  [self postSnapshotEncodedFrame:newFrame];
                  movedBytes = [newFrame getFrameBufferSizeForServerVersion:serverVersion] + 2;
                  return TRUE;
                }
                return FALSE;
              }
              
            }
            else
            {
              BitmapFrame* frame = [[BitmapFrame alloc] initWithHeader:frameHeader withImageBuffer:bytes length:[frameHeader getLength]];
              [self postSnapshotImage:frame];
              movedBytes = [frameHeader getLength] + headerSize + 2;
              return TRUE;
            }
          }
          else
            return FALSE;
        }
      }
    }
  }
  
  else if (cmd == MOBILE_MSG_ENCODED_VIDEO)
  {
    NSLog(@"Search Video Frame");
  }
  else if (cmd == MOBILE_MSG_ENCODED_VIDEO_GROUP)
  {
    NSLog(@"Search Video Frame");
  }
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_STOP)
  {
    onlyCmd = TRUE;
    NSLog(@"Respond Stop");
    [delegate handleCommand:IMC_CMD_SEARCH_STOP_RESPONSE :self];
    
  }
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW)
  {
    NSLog(@"Respond Play FW");
    onlyCmd = TRUE;
    
  }
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_SETPOS)
  {
    onlyCmd = TRUE;
  }
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_STEP_BW)
  {
    onlyCmd = TRUE;
  }
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_STEP_FW)
  {
    onlyCmd = TRUE;
  }
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL)
  {
    if( receivedBufferLength < 3 )
      return FALSE;
    uint32_t length = *(uint32_t*)(receivedBuffer + 2);
    keepAliveCounter = 0;
    if (receivedBufferLength < length ) {
      return FALSE;
    }
    
    NSData* data = [NSData dataWithBytes:receivedBuffer + 6 length:length];
    AllDayInterval* allDaysInterval = (AllDayInterval*)data.bytes;
    
    
    //DayInterval *di[MAX_CHANNEL];
    
    //for (NSInteger i = 0; i < IMC_MAX_CHANNEL; i++)
    //{
    //di[i] = nil;
    //}
    
    serverInfo.allDateInterval = [[ImcAllDateInterval alloc] init];
    serverInfo.allDateInterval.serverAddress = serverInfo.server_address;
    
    for (NSInteger i = 0; i < IMC_MAX_CHANNEL; i++)
    {
      if (((int32_t)allDaysInterval->di[i]) != -1 )
      {
        
        DayInterval* p_di = (DayInterval*)(data.bytes + (int32_t)allDaysInterval->di[i]);
        
        if (p_di && p_di->size > 0) {
          
          ImcDateInterval* dateInterval = [[ImcDateInterval alloc] initWithDateInterVal:p_di withTimeZoneOffset:deviceSetting.timeZoneOffset];
          dateInterval.channelIndex = i;
          [serverInfo.allDateInterval.dateInterval addObject:dateInterval];
        }
      }
    }
    
    movedBytes = 2 + 4 + length;
    
    [delegate handleCommand:IMC_CMD_SEARCH_UPDATE_CHANNEL_LIST_IN_DATE :serverInfo.allDateInterval];
    return TRUE;
    
  }
  
  else if (cmd == MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST)
  {
    if( receivedBufferLength < 3 )
    {
      return FALSE;
    }
    
    uint32_t length = *(uint32_t*)(receivedBuffer+2);
    
    if (receivedBufferLength < length) {
      return FALSE;
    }
    
    NSData* data = [NSData dataWithBytes:receivedBuffer + 6 length:length];
    
    
    [serverInfo.availableDataDateList removeAllObjects];
    
    NSMutableArray* dateList = [NSMutableArray array];
    
    DayInterval* dateInterval = (DayInterval*)data.bytes;
    
    for (NSInteger i = 0; i < dateInterval->size; i++) {
      
      long begin = /*dateInterval->time*/dateInterval->ti[i].begin - deviceSetting.timeZoneOffset;
      
      if (begin > 0 && [dateList indexOfObject:@(begin)]==NSNotFound)
      {
        [dateList addObject:@(begin)];
      }
    }
    
    //if (dateList && dateList.count > 0)
    {
      [dateList sortUsingComparator:^NSComparisonResult(id obj1, id obj2) {
        
        if ( [obj1 integerValue]  < [obj2 integerValue]) {
          return (NSComparisonResult)NSOrderedAscending;
        } else if ( [obj1 integerValue] > [obj2 integerValue]) {
          return (NSComparisonResult)NSOrderedDescending;
        }
        return (NSComparisonResult)NSOrderedSame;
      }];
      
      [serverInfo.availableDataDateList addObjectsFromArray:dateList];
      serverInfo.serverTimezone = deviceSetting.timeZone;
      [delegate handleCommand:IMC_CMD_SEARCH_UPDATE_DATA_DATE: serverInfo];
    }
    
    movedBytes = 6 + [data length];
    return YES;
  }
  
  if( onlyCmd )
  {
    movedBytes = 2;
    return TRUE;
  }
  
  if( receivedBufferLength < MOBILE_COMM_COMMAND_HEADER_SIZE )
    return FALSE;
  
  uint8_t _test[6];
  memcpy(_test, receivedBuffer, 6);
  uint32_t cmdLength = *(uint32_t*)(receivedBuffer+2);
  
  NSLog(@"Data length needed %d",cmdLength + MOBILE_COMM_COMMAND_HEADER_SIZE );
  if( cmdLength + MOBILE_COMM_COMMAND_HEADER_SIZE > receivedBufferLength )
    return FALSE;
  
  NSData* data = [[NSData alloc] initWithBytes:receivedBuffer length:cmdLength+MOBILE_COMM_COMMAND_HEADER_SIZE];
  
  ImcMobileCommand* mobileCommand = [self parserData:data];
  if( mobileCommand == nil )
    return FALSE;
  
  switch ([mobileCommand getCommand]) {
    case MOBILE_MSG_LOGIN:
    {
      GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:[mobileCommand dataForCommandContent] options:0 error:nil];
      if( doc )
      {
        if( [[doc.rootElement localName] isEqualToString:@"LoginInfo"] )
        {
          GDataXMLElement* serverVersionNode = (GDataXMLElement*)[doc.rootElement attributeForName:@"loginStatus"];
          NSInteger connectionStatus = [[serverVersionNode stringValue] integerValue];
          if( connectionStatus == MOBILE_LOGIN_MESSAGE_SUCCEEDED )
          {
            GDataXMLElement* connectionIndexNode = (GDataXMLElement*)[doc.rootElement attributeForName:@"connectionIndex"];
            connectionIndex = [[connectionIndexNode stringValue] integerValue];
            serverInfo.connected = TRUE;
            
            // connect successfull
            if(loginTimer)
            {
              [loginTimer invalidate];
              loginTimer = nil;
            }
            
            keepAliveCounter = 0;
            keepAliveTimer = [NSTimer scheduledTimerWithTimeInterval:KEEP_ALIVE_CHECKING_INTERVAL target:self selector:@selector(onKeepAlive:) userInfo:nil repeats:YES];
            [[NSRunLoop currentRunLoop] addTimer:keepAliveTimer forMode:NSDefaultRunLoopMode];
            
          }
          else
          {
            connectionIndex = -1;
            serverInfo.connected = FALSE;
          }
          getLoginStatus = (connectionStatus == MOBILE_LOGIN_MESSAGE_SUCCEEDED);
          ImcConnectionStatus* status = [[ImcConnectionStatus alloc] initWithParam:self:(int32_t)connectionIndex :(int32_t)connectionStatus];
          if(self.delegate)
          {
            [self.delegate handleCommand:IMC_CMD_CONNECTION_CONNECT_RESPONSE :status];
            if(!getLoginStatus)
              delegate = nil;
          }
          
        }
      }
      
    }
      break;
    case MOBILE_MSG_SERVER_SEND_SETTINGS:
    case MOBILE_MSG_VIEW_ALARM_IMAGES:
    case MOBILE_MSG_SEND_CAMERA_LIST:
    case MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG:
    case MOBILE_MSG_ADD_IP_CAMERAS:
    case MOBILE_MSG_REMOVE_IP_CAMERAS:
    case MOBILE_MSG_MOBILE_SEND_SETTINGS:
    {
      [self parseCommandData:mobileCommand];
    }
      break;
    case MOBILE_MSG_DISCONNECT:
    {
      [self parseCommandData:mobileCommand];
    }
      break;
    case MOBILE_MSG_SERVER_CHANGED_SERVER_INFO:
    {
      [self parseCommandData:mobileCommand];
    }
      break;
    case MOBILE_MSG_SERVER_SEND_TIMEZONE:
    {
      [self parseCommandData:mobileCommand];
    }
      break;
      
    case MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL:
    {
      
      [self parseCommandData:mobileCommand];
    }
      break;
      
    default:
      break;
  }
  
  movedBytes = cmdLength + MOBILE_COMM_COMMAND_HEADER_SIZE;
  return TRUE;
}

- (NSData*)constructLoginInfo
{
  NSString* xmlString = [NSString stringWithFormat:@"<LoginInfo user_name=\"%@\" password=\"%@\" server_id=\"%@\" remote_type=\"2\"/>",[self htmlEntityEncode:serverInfo.username],[self htmlEntityEncode:serverInfo.password],[self htmlEntityEncode:serverInfo.serverID]];
  
  NSData* sentData;
  NSData* loginData = [xmlString dataUsingEncoding:NSUTF8StringEncoding];
  
  if( serverVersion > VERSION_2200 )
    sentData = [loginData AES128EncryptWithKeyData:key];
  else
    sentData = loginData;
  
  uint16_t msg = MOBILE_MSG_LOGIN;
  uint64_t cmdLength = sentData.length + MOBILE_COMM_COMMAND_HEADER_SIZE;  // cmdLength = Command + Server version + xmlString
  uint32_t mobileVersion = MOBILE_VERSION_CURRENT;
  
  NSMutableData* loginStruct = [[NSMutableData alloc] initWithBytes:&cmdLength length:4];
  [loginStruct appendData:[[NSData alloc] initWithBytes:&msg length:2]];
  [loginStruct appendData:[[NSData alloc] initWithBytes:&mobileVersion length:4]];
  [loginStruct appendData:sentData];
  return loginStruct;
}

-(NSString *)htmlEntityEncode:(NSString *)inputString
{
  NSString* newString = inputString;
  
  newString = [newString stringByReplacingOccurrencesOfString:@"\"" withString:@"&quot;"];
  newString = [newString stringByReplacingOccurrencesOfString:@"'" withString:@"&apos;"];
  newString = [newString stringByReplacingOccurrencesOfString:@"&" withString:@"&amp;"];
  newString = [newString stringByReplacingOccurrencesOfString:@"<" withString:@"&lt;"];
  newString = [newString stringByReplacingOccurrencesOfString:@">" withString:@"&gt;"];
  
  return newString;
}

-(BOOL)startVideoConnection
{
  
  BOOL result = FALSE;
  NSData* packet = [ImcMobileCommand constructSimpleMsgPacket:MOBILE_MSG_START_SEND_VIDEO];
  if( packet )
  {
    result = ([self sendData:packet] == SOCKET_SEND_SUCCESS );
  }
  connectingVideoPort = result;
  return result;
}

- (int)sendData:(NSData *)data
{
  __block SOCKET_SEND_STATUS status =  SOCKET_SEND_SUCCESS;
  dispatch_async(dataQueue, ^{
    int sentBytes = 0;
    NSInteger length = data.length;
    
    uint8_t* buffer = (uint8_t*)[data bytes];
    while (sentDataStream && sentBytes < length && status == SOCKET_SEND_SUCCESS)
    {
      
      NSInteger sentCount = -1;
      if( (sentCount = [sentDataStream write:(buffer + sentBytes) maxLength:length -sentBytes ]) <= 0)
      {
        status = SOCKET_SEND_ERROR;
        break;
      }
      sentBytes += sentCount;
    }
  });
  
  return status;
}

- (void) sendCommand:(uint16_t)command :(void *)buffer :(NSInteger)bufferLength
{
  NSData* commandData = nil;
  if( buffer == nil || bufferLength == 0)
  {
    commandData = [ImcMobileCommand constructSimpleMsgPacket:command];
  }
  else
  {
    commandData = [ImcMobileCommand constructSentPacketWithCmd:command Data:buffer DataLength:bufferLength];
  }
  
  [self sendData:commandData];

}

- (void)disconnect
{
  isConnected = FALSE;
  if( getLoginStatus )
  {
    NSData* packet = [ImcMobileCommand constructSimpleMsgPacket:MOBILE_MSG_DISCONNECT];
    [sentDataStream write:[packet bytes] maxLength:packet.length];
    //[self sendData:packet];
  }
  
  [self videoSocketHasDisconnected];
  
  NSLog(@"disconnect server\n");
  
  [connectionLock lock];
  [self closeStreams];
  [connectionLock unlock];
  
  [self destroyTimers];
  
  if(streamingRL)
    CFRunLoopStop([streamingRL getCFRunLoop]);
  
}


- (void)onDisconnect : (id)parameter
{
  [self destroyTimers];
  
  if(delegate)
  {
    [delegate handleCommand:IMC_CMD_CONNECTION_DISCONNECT_RESPONSE :self];
    delegate = nil;
  }
  //disconecting = YES;
  NSLog(@" ############  disconnect server: %@", serverInfo.server_address);
}

- (void)parseCommandData:(id)data
{
  ImcMobileCommand* command = (ImcMobileCommand*)data;
  switch ([command getCommand]) {
    case MOBILE_MSG_SERVER_SEND_SETTINGS:
    {
      NSLog(@"-------receive server setting----------");
      [deviceSetting importSettingFromXML:[command dataForCommandContent]];
      if( delegate )
      {
        [delegate handleCommand:IMC_CMD_UPDATE_SETTING_TO_GUI :self];
        if( deviceSetting.needUpdateConfig )
        {
          [delegate handleCommand:IMC_CMD_UPDATE_CHANNEL_CONFIG :self ];
        }
        [delegate handleCommand:IMC_CMD_SERVER_SEND_SETTINGS_SUCCESSFUL :nil];
      }
    }
      break;
    case MOBILE_MSG_SERVER_CHANGED_SERVER_INFO:
    {
      if (delegate) {
        [delegate handleCommand:IMC_CMD_SERVER_CHANGE_INFO :serverInfo];
      }
    }
      break;
    case MOBILE_MSG_NEXT_ALARM_LIST:
    case MOBILE_MSG_SEND_ALARM_LIST:
    case MOBILE_MSG_PREVIOUS_ALARM_LIST:
    {
      NSInteger cmd = 0;
      switch ([command getCommand]) {
        case MOBILE_MSG_NEXT_ALARM_LIST:
          cmd = IMC_CMD_NEXT_ALARM_LIST_RESPONSE;
          break;
        case MOBILE_MSG_SEND_ALARM_LIST:
          cmd = IMC_CMD_SEND_ALARM_LIST_RESPONSE;
          break;
        case MOBILE_MSG_PREVIOUS_ALARM_LIST:
          cmd = IMC_CMD_PREVIOUS_ALARM_LIST_RESPONSE;
          break;
      }
      
      if( delegate )
        [delegate handleCommand:cmd : [command dataForCommandContent]];
    }
      break;
    case MOBILE_MSG_VIEW_ALARM_IMAGES:
      break;
    case MOBILE_MSG_NEW_ALARM_DETECTED:
    {
      //NSLog(@"-----ALARM RECEIVED----");
      
    }
      break;
      
    case MOBILE_MSG_SEND_CAMERA_LIST:
    {
      //NSLog(@"Parse Camera List");
      [deviceCameraList importFromXMLData:[command dataForCommandContent]];
      [self sendCommand: MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG  :nil :0];
    }
      break;
    case MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG:
    {
      NSLog(@"receive server hardware setting");
      [deviceSetting importChannelConfigFromXML:[command dataForCommandContent]];
      if( delegate )
      {
        [delegate handleCommand:IMC_CMD_UPDATE_CHANNEL_CONFIG :self];
        [delegate handleCommand:IMC_CMD_MOBILE_SEND_ALL_SETTING :self];
      }
    }
      break;
    case MOBILE_MSG_ADD_IP_CAMERAS:
      break;
    case MOBILE_MSG_REMOVE_IP_CAMERAS:
      break;
    case MOBILE_MSG_MOBILE_SEND_SETTINGS:
      break;
    case MOBILE_MSG_SNAPSHOT:
      break;
    case MOBILE_MSG_SERVER_SEND_TIMEZONE:
    {
      if ([deviceSetting importTimeZoneFromXML:[command dataForCommandContent]] == 0) {
        AppDelegate* _appDelegate = (AppDelegate*)[[UIApplication sharedApplication] delegate];
        if([_appDelegate _isSeacrh]){
          GDataXMLElement* rootNode = [self buildReQuestDayListMsg];
          if (rootNode) {
            GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithRootElement:rootNode];
            [self sendCommand:MOBILE_MSG_SEARCH_REQUEST_DAY_LIST :(int8_t*)doc.XMLData.bytes :doc.XMLData.length];
          }
        } else {
          [delegate handleCommand:IMC_CMD_UPDATE_SETTING_SERVER :self];
        }
      }
    }
      break;
    case MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST:
    {
      [serverInfo.availableDataDateList removeAllObjects];
      
      NSMutableArray* dateList = [NSMutableArray array];
      
      NSData* data = (NSData*)[command dataForCommandContent];
      DayInterval* dateInterval = (DayInterval*)data.bytes;
      
      for (NSInteger i = 0; i < dateInterval->size; i++) {
        
        TimeInterval* ti = dateInterval->ti + i*sizeof(TimeInterval);
        long begin = ti->begin - deviceSetting.timeZoneOffset;
        
        [dateList addObject:@(begin)];
      }
      
      if (dateList) {
        serverInfo.serverTimezone = deviceSetting.timeZone;
        [serverInfo.availableDataDateList addObjectsFromArray:dateList];
      }
      [delegate handleCommand:IMC_CMD_SEARCH_UPDATE_DATA_DATE :deviceSetting.timeZone];
    }
      break;
      
    default:
      break;
  }
}

-(NSArray*)parseXMLDataForDataDateList:(NSData *)xmlData
{
  GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:NULL];
  
  if(doc)
  {
    NSArray* elements = [doc.rootElement elementsForName:@"Day"];
    NSInteger size = [[[doc.rootElement attributeForName:@"size"] stringValue] integerValue];
    if (size == elements.count) {
      
      NSMutableArray* availableDataDateList = [NSMutableArray array];
      
      for (GDataXMLElement* element in elements) {
        NSInteger UTCDate = [[[element attributeForName:@"begin"] stringValue] integerValue];
        [availableDataDateList addObject:@(UTCDate)];
      }
      
      return availableDataDateList;
    }
  }
  
  return nil;
}

-(id)buildReQuestDayListMsg
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"Search_Request"];
  if( rootNode )
  {
    NSString* channelID = @"";
    long searchTimeUTC = [[NSDate date] timeIntervalSince1970];
    NSInteger timeInterval = 23*3600 + 59*60 + 59*60;
    
    GDataXMLNode* channelIDNode = [GDataXMLNode elementWithName:@"channelID" stringValue:channelID];
    GDataXMLNode* searchTimeUTCNode = [GDataXMLNode elementWithName:@"searchTimeUTC" stringValue:[NSString stringWithFormat:@"%ld",searchTimeUTC]];
    GDataXMLNode* timeIntervalNode = [GDataXMLNode elementWithName:@"timeInterval" stringValue:[NSString stringWithFormat:@"%zd",timeInterval]];
    
    //NSLog(@"%@",sourceMaskString);
    [rootNode addAttribute:channelIDNode];
    [rootNode addAttribute:searchTimeUTCNode];
    [rootNode addAttribute:timeIntervalNode];
  }
  return rootNode;
}

-(id)buildSearchCommonMessageWithTimeInterval:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask
{
  
  //NSDate* chosenDate = (NSDate*)date;
  //NSDate* destinationDate = [[NSDate alloc] initWithTimeInterval:deviceSetting.timeZoneOffset sinceDate:date];
  
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"Search_Request"];
  if( rootNode )
  {
    if (ti > 0) {
      NSString* channelID = [NSString stringWithFormat:@"%llu",channelMask];
      long searchTimeUTC = ti + deviceSetting.timeZoneOffset;
      NSDate* requestDate = [NSDate dateWithTimeIntervalSince1970:searchTimeUTC];
      NSDate* nextDate = [requestDate nextDayWithTimeZone:deviceSetting.timeZone];
      NSInteger timeInterval = [nextDate timeIntervalSinceDate:requestDate] - 1;//86399;
      
      GDataXMLNode* channelIDNode = [GDataXMLNode elementWithName:@"channelID" stringValue:channelID];
      GDataXMLNode* searchTimeUTCNode = [GDataXMLNode elementWithName:@"searchTimeUTC" stringValue:[NSString stringWithFormat:@"%ld",searchTimeUTC]];
      GDataXMLNode* timeIntervalNode = [GDataXMLNode elementWithName:@"timeInterval" stringValue:[NSString stringWithFormat:@"%zd",timeInterval]];
      GDataXMLNode* mainStreamMaskNode = [GDataXMLNode elementWithName:@"mainStreamMask" stringValue:[NSString stringWithFormat:@"%llu",mainStreamMask]];
      
      [rootNode addAttribute:channelIDNode];
      [rootNode addAttribute:searchTimeUTCNode];
      [rootNode addAttribute:timeIntervalNode];
      [rootNode addAttribute:mainStreamMaskNode];
    }
  }
  return rootNode;
}

-(id)buildSearchCommonMessageWithTimeInterval2:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"Search_Request"];
  if( rootNode )
  {
    
    if (ti > 0) {
      NSString* channelID = [NSString stringWithFormat:@"%llu",channelMask];
      long searchTimeUTC = ti + deviceSetting.timeZoneOffset;
      NSDate* requestDate = [NSDate dateWithTimeIntervalSince1970:searchTimeUTC];
      NSDate* nextDate = [requestDate nextDayWithTimeZone:deviceSetting.timeZone];
      NSInteger timeInterval = [nextDate timeIntervalSinceDate:requestDate] - 1;//86399;
      
      GDataXMLNode* channelIDNode = [GDataXMLNode elementWithName:@"channelID" stringValue:channelID];
      GDataXMLNode* searchTimeUTCNode = [GDataXMLNode elementWithName:@"searchTimeUTC" stringValue:[NSString stringWithFormat:@"%ld",searchTimeUTC]];
      GDataXMLNode* timeIntervalNode = [GDataXMLNode elementWithName:@"timeInterval" stringValue:[NSString stringWithFormat:@"%zd",timeInterval]];
      GDataXMLNode* mainStreamMaskNode = [GDataXMLNode elementWithName:@"mainStreamMask" stringValue:[NSString stringWithFormat:@"%llu",mainStreamMask]];
      
      //NSLog(@"%@",sourceMaskString);
      [rootNode addAttribute:channelIDNode];
      [rootNode addAttribute:searchTimeUTCNode];
      [rootNode addAttribute:timeIntervalNode];
      [rootNode addAttribute:mainStreamMaskNode];
      
    }
  }
  return rootNode;
}


-(id)buildSearchCommonMessageWithTimeInterval3:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask
{
  GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"Search_Request"];
  if( rootNode )
  {
    if (ti > 0) {
      
      NSString* channelID = [NSString stringWithFormat:@"%llu",channelMask];
      long searchTimeUTC = ti + deviceSetting.timeZoneOffset;
      
      NSInteger timeInterval = 1000;
      
      GDataXMLNode* channelIDNode = [GDataXMLNode elementWithName:@"channelID" stringValue:channelID];
      GDataXMLNode* searchTimeUTCNode = [GDataXMLNode elementWithName:@"searchTimeUTC" stringValue:[NSString stringWithFormat:@"%ld",searchTimeUTC]];
      GDataXMLNode* timeIntervalNode = [GDataXMLNode elementWithName:@"timeInterval" stringValue:[NSString stringWithFormat:@"%zd",timeInterval]];
      GDataXMLNode* mainStreamMaskNode = [GDataXMLNode elementWithName:@"mainStreamMask" stringValue:[NSString stringWithFormat:@"%llu",mainStreamMask]];
      
      //NSLog(@"%@",sourceMaskString);
      [rootNode addAttribute:channelIDNode];
      [rootNode addAttribute:searchTimeUTCNode];
      [rootNode addAttribute:timeIntervalNode];
      [rootNode addAttribute:mainStreamMaskNode];
    }
  }
  return rootNode;
}


- (void)updateLayout:(uint16_t)layout
{
  deviceSetting.layout = layout;
  deviceSetting.fullscreenChannel = -1;
}

- (void)videoSocketHasDisconnected
{
  if( videoConnection )
  {
    [videoConnection disconnectToServer];
    videoConnection = nil;
  }
}

- (BOOL)videoDisconnected
{
  if( connectingVideoPort )
    return FALSE;
  
  if (waitForAccept && videoConnection == nil) {
    return FALSE;
  }
  
  return (videoConnection == nil || videoConnection.disconnected );
}

-(void)postVideoFrame:(BitmapFrame *)frame
{
  
  int videoSourceIndex = frame.header.sourceIndex;
  
  if (frame.header.codecType == 3) {
    DisplayedVideoFrame* videoFrame = [[DisplayedVideoFrame alloc] init];
    
    videoFrame.channelIndex    = IMC_MAX_CHANNEL - 1;
    videoFrame.cameraName       = @"IMC Search Channel";
    videoFrame.videoFrame       = frame.image;
    videoFrame.serverAddress    = serverInfo.server_address;
    videoFrame.serverPort       = serverInfo.server_port;
    if( serverVersion >= VERSION_2300 )
      videoFrame.subMainStream    = ((FrameHeaderEx*)frame.header).subMainStream;
    
    if( delegate )
      [delegate handleCommand:IMC_CMD_DISPLAY_VIDEO :videoFrame];
  }
  else
  {
    for(int index = 0; index < MAX_CHANNEL; index++ )
    {
      ChannelSetting* setting = (ChannelSetting*)[self.deviceSetting channelConfigAtIndex:index];
      if( setting.videoSourceInput == videoSourceIndex)
      {
        DisplayedVideoFrame* videoFrame = [[DisplayedVideoFrame alloc] init];
        
        videoFrame.channelIndex    = setting.channelID;
        videoFrame.cameraName       = setting.channelName;
        videoFrame.videoFrame       = frame.image;
        videoFrame.serverAddress    = serverInfo.server_address;
        videoFrame.serverPort       = serverInfo.server_port;
        if( serverVersion >= VERSION_2300 )
        {
          videoFrame.subMainStream    = ((FrameHeaderEx*)frame.header).subMainStream;
          if (frame.header.sourceIndex > IMC_MAX_CHANNEL) {
            //Digital Camera
            videoFrame.resolutionHeight = ((FrameHeaderEx*)frame.header).originalResY;
            videoFrame.resolutionWidth  = ((FrameHeaderEx*)frame.header).originalResX;
            
            videoFrame.frameTime        = [NSDate dateWithTimeIntervalSince1970:((FrameHeaderEx*)frame.header).time];
          }
        }
        if( delegate )
          [delegate handleCommand:IMC_CMD_DISPLAY_VIDEO :videoFrame];
        return;
      }
      //else if (videoSourceIndex)
    }
    
    DisplayedVideoFrame* videoFrame = [[DisplayedVideoFrame alloc] init];
    
    videoFrame.channelIndex    = videoSourceIndex;
    videoFrame.cameraName       =  @"IMC Search Channel";;
    videoFrame.videoFrame       = frame.image;
    videoFrame.serverAddress    = serverInfo.server_address;
    videoFrame.serverPort       = serverInfo.server_port;
    videoFrame.frameMode        = SEARCH_VIEW;
    if( serverVersion >= VERSION_2300 )
    {
      videoFrame.frameTime        = [NSDate dateWithTimeIntervalSince1970:((FrameHeaderEx*)frame.header).time - deviceSetting.timeZoneOffset];
      videoFrame.resolutionHeight = ((FrameHeaderEx*)frame.header).originalResY;
      videoFrame.resolutionWidth  = ((FrameHeaderEx*)frame.header).originalResX;
      videoFrame.frameIndex = ((FrameHeaderEx*)frame.header).index;
      videoFrame.subMainStream    = ((FrameHeaderEx*)frame.header).subMainStream;
    }
    if( delegate )
      [delegate handleCommand:IMC_CMD_DISPLAY_VIDEO :videoFrame];
  }
  
}

- (void)postSnapshotImage:(BitmapFrame *)frame
{
  //int videoSourceIndex = frame.header.sourceIndex;
  for(int index = 0; index < MAX_CHANNEL; index++ )
  {
    ChannelSetting* setting = (ChannelSetting*)[self.deviceSetting channelConfigAtIndex:index];
    if( /*setting.videoSourceInput == videoSourceIndex && */snapshotChannel == index )
    {
      i3SnapshotInfo* snapshotInfo = [[i3SnapshotInfo alloc] init];
      
      snapshotInfo.snapshotFilename = [NSString stringWithFormat:@"%@_%@_%zd_%zd.jpg",serverInfo.serverName,setting.channelName,frame.header.resX,frame.header.resY];
      snapshotInfo.snapshotFilename = [snapshotInfo.snapshotFilename stringByReplacingOccurrencesOfString:@" " withString:@"_"];
      snapshotInfo.snapshotImage = frame.image;
      
      if( delegate )
        [delegate handleCommand:IMC_CMD_DISPLAY_RESPONSE_SNAPSHOT :snapshotInfo];
    }
  }
  
}

-(void)postSearchEncodedFrame:(EncodedFrame*)frame
{
  EncodedFrame* newFrame = frame;
  //int videoSourceIndex = frame.header.sourceIndex;
  if (newFrame.header.codecType == 3) {
    if (newFrame.videoFrameInfo == nil)
    {
      newFrame.videoFrameInfo = [[DisplayedVideoFrame alloc] init];
      newFrame.videoFrameInfo.channelIndex     = IMC_MAX_CHANNEL-1;
      newFrame.videoFrameInfo.cameraName       = @"IMC Search Channel";
      newFrame.videoFrameInfo.videoFrame       = nil;
      newFrame.videoFrameInfo.serverAddress    = serverInfo.server_address;
      newFrame.videoFrameInfo.serverPort       = serverInfo.server_port;
      newFrame.videoFrameInfo.frameMode        = SEARCH_VIEW;
      VideoEncodeDataHeader* vedHeader = (VideoEncodeDataHeader*)(newFrame.frameData.bytes);
      vedHeader->time -= deviceSetting.timeZoneOffset;
    }
    if( delegate )
      //@autoreleasepool
    {
      [delegate handleCommand:IMC_CMD_DECODE_FRAME :newFrame];
      
    }
  }
}

-(void)postSnapshotEncodedFrame:(EncodedFrame*)frame
{
  @autoreleasepool
  {
    EncodedFrame* newFrame = frame;
    newFrame.header.snapshotImage = TRUE;
    //int videoSourceIndex = frame.header.sourceIndex;
    if (newFrame.header.codecType == 3)
    {
      if (newFrame.videoFrameInfo == nil)
      {
        newFrame.videoFrameInfo = [[DisplayedVideoFrame alloc] init];
        newFrame.videoFrameInfo.channelIndex     = IMC_MAX_CHANNEL-1;
        newFrame.videoFrameInfo.cameraName       = @"IMC Search Channel";
        newFrame.videoFrameInfo.videoFrame       = nil;
        newFrame.videoFrameInfo.serverAddress    = serverInfo.server_address;
        newFrame.videoFrameInfo.serverPort       = serverInfo.server_port;
        newFrame.videoFrameInfo.frameMode        = SNAPSHOT;
      }
      //Call decode function to decode received frame
      int videoSourceIndex = newFrame.header.sourceIndex;
      for(int index = 0; index < MAX_CHANNEL; index++ )
      {
        ChannelSetting* setting = (ChannelSetting*)[self.deviceSetting channelConfigAtIndex:index];
        if( setting.videoSourceInput == videoSourceIndex )
        {
          VideoEncodeDataHeader* vedHeader = (VideoEncodeDataHeader*)newFrame.frameData.bytes;
          vedHeader->channel_id = setting.channelID;
          newFrame.videoFrameInfo.cameraName = setting.channelName;
          break;
        }
      }
      
      if( delegate )
      {
        [delegate handleCommand:IMC_CMD_RESET_DECODER :nil];
        [delegate handleCommand:IMC_CMD_DECODE_FRAME :newFrame];
      }
    }
  }
}

-(void)postEncodedFrame:(EncodedFrame*)frame
{
  @autoreleasepool
  {
    EncodedFrame* newFrame = frame;
    if (newFrame.header.codecType == 3)
    {
      //Call decode function to decode received frame
      int videoSourceIndex = newFrame.header.sourceIndex;
      for(int index = 0; index < MAX_CHANNEL; index++ )
      {
        ChannelSetting* setting = (ChannelSetting*)[self.deviceSetting channelConfigAtIndex:index];
        if( setting.videoSourceInput == videoSourceIndex )
        {
          if (newFrame.videoFrameInfo == nil)
          {
            newFrame.videoFrameInfo = [[DisplayedVideoFrame alloc] init];
            newFrame.videoFrameInfo.channelIndex    = setting.channelID;
            newFrame.videoFrameInfo.cameraName       = setting.channelName;
            newFrame.videoFrameInfo.videoFrame       = nil;
            newFrame.videoFrameInfo.serverAddress    = serverInfo.server_address;
            newFrame.videoFrameInfo.serverPort       = serverInfo.server_port;
          }
          if( delegate )
            [delegate handleCommand:IMC_CMD_DECODE_FRAME :newFrame];
          break;
        }
      }
    }
    else
    {
      NSLog(@"Error");
    }
    
  }
}

-(void)postDisconnectVideoMsg:(NSString*)serverAddress
{
  [delegate handleCommand:IMC_CMD_DISCONNECT_VIDEO :serverAddress];
}

@end

