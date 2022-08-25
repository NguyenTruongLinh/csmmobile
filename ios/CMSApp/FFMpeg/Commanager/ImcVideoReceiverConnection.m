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
    streamQueue = nil;
    isRLRunning = NO;
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
  if(isRelay) {
    dataUsage += newBlockLen;
    long newTimePoint = CFAbsoluteTimeGetCurrent();
    long deltaTime = newTimePoint - lastDataUsageSentTimePoint;
    if (deltaTime >= 3) {
      NSLog(@"1PM 1708 notifyUpdateDataUsage deltaTime = %ld", deltaTime);
      lastDataUsageSentTimePoint = newTimePoint;
      [delegate handleCommand: IMC_CMD_RELAY_UPDATE_DATA_USAGE : [NSNumber numberWithInteger: dataUsage]];
      dataUsage = 0;
    }
  }
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

- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)eventCode
{
  NSLog(@">>>>>>>>>>>>> 1008 ImcVideoReceiverConnection (void)stream streamCount = %d eventCode = %lul", streamCount++, (unsigned long)eventCode);

  if( stream != receivedDataStream && stream != sentDataStream )
    return;
  switch(eventCode)
  {
    case NSStreamEventOpenCompleted:
    {

    }
    break;
    case NSStreamEventHasBytesAvailable:
    {
      NSLog(@"1008 ImcVideoReceiverConnection case NSStreamEventHasBytesAvailable current_state = %d", current_state);
      [streamLock lock];
      if(disconnected)
      {
        NSLog(@"1008 ImcVideoReceiverConnection SStreamEventHasBytesAvailable disconnected");
        [streamLock unlock];
        break;
      }

      if(waitForRelayHandshake) {
        NSLog(@"1008 ImcVideoReceiverConnection NSStreamEventHasBytesAvailable waitForRelayHandshake");
        [self readRelayHandshakeInfo: (NSInputStream *)stream];
        [streamLock unlock];
        break;
      }
//      if(isRelay) {
//        uint8_t _buffer[68];
//        sizeWillRead = 68;
//        long len = [(NSInputStream *)stream read:(_buffer) maxLength:sizeWillRead];
//        NSLog(@"1008 ImcVideoReceiverConnection NSStreamEventHasBytesAvailable RELAY_HEADER len = %ld", len);
//      }
      if(current_state==get_cmd)
      {
        uint8_t _buffer[2];
        sizeWillRead = 2;
        long len = [(NSInputStream *)stream read:(_buffer) maxLength:sizeWillRead];
        [self notifyUpdateDataUsage: len];
        NSLog(@"1008 ImcVideoReceiverConnection NSStreamEventHasBytesAvailable get_cmd len = %ld", len);
        if( len == sizeWillRead )
        {
          currentCmd = *(uint16_t*)(_buffer);
          [self processCmd];
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
            [self processHeader];
            receiverBufferLength = 0;
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
            //NSLog(@"*** Received Buffer Size: %d", receiverBufferLength);
            [self processData];
            receiverBufferLength = 0;
          }
        }
      }

      [streamLock unlock];

    }
      break;
    case NSStreamEventErrorOccurred:
    {
      //disconnected = TRUE;
      if( self )
        [self disconnectToServer];
    }
      break;
    case NSStreamEventEndEncountered:
    {
      NSLog(@"Close: Video Stream");
      if( self )
        [self disconnectToServer];
    }
      break;
    default:
      break;
  }
}

-(BOOL)processCmd
{
	
  switch( currentCmd )
  {
    case MOBILE_MSG_DISCONNECT:
      disconnected = TRUE;
      NSLog(@"Video-Disconnected");
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
    }
      break;
  }
  return YES;
}

-(BOOL)processHeader
{
	
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
    }
      break;
  }
  return YES;
}

- (BOOL)processData
{
	
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
      sizeWillRead = 2;
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
      sizeWillRead = 2;
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
      sizeWillRead = 2;
    }
      break;
    default:
    {
      sizeWillRead = 2;
      current_state = get_cmd;
    }
      break;
  }
  return YES;
}

#if false
- (BOOL)processData
{
	
  uint16_t cmd = *(uint16_t*)receiverBuffer;
  uint32_t movedBytes = 0;
  switch( cmd )
  {
    case MOBILE_MSG_DISCONNECT:
    {
      movedBytes = 2;
      disconnected = TRUE;
      //[self disconnectToServer];
      NSLog(@"Video-Disconnected");
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

