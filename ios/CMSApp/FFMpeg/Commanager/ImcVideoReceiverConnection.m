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

@interface ImcVideoReceiverConnection(PrivateMethod)
- (BOOL)processData;
- (BOOL)processCmd;
- (BOOL)processHeader;
@end

@implementation ImcVideoReceiverConnection
@synthesize parent,disconnected, videoTimer, timerCounter, streamingRL;

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
  }
  return self;
}

- (void) dealloc
{
  if(!disconnected)
    [self disconnectToServer];
  
  receiverBuffer = nil;
  currentData = nil;
}

- (BOOL) connectToServer:(NSString *)address :(NSInteger)port
{
  __block BOOL success = TRUE;
  serverAddress = address;
  serverPort = port;
  CFStringRef adddress = (__bridge CFStringRef)serverAddress;
  UInt32 connectPort = (UInt32)serverPort;
  
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    
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
      
      receivedDataStream = (__bridge NSInputStream *)readStream;
      [receivedDataStream setDelegate:self];
      streamingRL = [NSRunLoop currentRunLoop];
      [receivedDataStream scheduleInRunLoop:[NSRunLoop currentRunLoop]
                                    forMode:NSDefaultRunLoopMode];
      [receivedDataStream open];
      
      
      sentDataStream = (__bridge NSOutputStream *)writeStream;
      [sentDataStream setDelegate:self];
      [sentDataStream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
      [sentDataStream open];
      
      disconnected = FALSE;
      success = TRUE;
      
      [sentDataStream write:(uint8_t*)(&connectionIndex) maxLength:sizeof(connectionIndex)];
      [[NSRunLoop currentRunLoop] run];
      
    }
    
  });
  
  //lvtx todo: sync return value
  return success;
}

-(void)onTimerChecking
{
  if (timerCounter > 0)
  {
    timerCounter = 0;
  }
  else
  {
    [videoTimer invalidate];
    
    if (!disconnected) {
      [parent onDisconnect:nil];
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
  if( sentDataStream == nil || receivedDataStream == nil )
  {
    [streamLock unlock];
    return;
  }
  
  [sentDataStream removeFromRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
  [receivedDataStream removeFromRunLoop:streamingRL forMode:NSDefaultRunLoopMode];
  [sentDataStream close];
  [receivedDataStream close];
  
  sentDataStream = nil;
  receivedDataStream = nil;
  
  [streamLock unlock];
  
  CFRunLoopStop([streamingRL getCFRunLoop]);
}

- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)eventCode
{
  if( stream != receivedDataStream && stream != sentDataStream )
    return;
  
  switch(eventCode)
  {
    case NSStreamEventHasBytesAvailable:
    {
      [streamLock lock];
      if(disconnected)
      {
        [streamLock unlock];
        break;
      }
      
      if(current_state==get_cmd)
      {
        uint8_t _buffer[2];
        sizeWillRead = 2;
        long len = [(NSInputStream *)stream read:(_buffer) maxLength:sizeWillRead];
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
      NSLog(@"Error: Video Strean");
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
      }
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

