//
//  VideoFrame.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/20/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "Imcbase.h"
#import "VideoFrame.h"
#import "MobileBase.h"

@implementation FrameHeader

@synthesize codecType,resX,resY,sourceIndex,length;

- (uint32_t)bufferSize
{
  return FRAME_HEADER_SIZE;
}

- (id)init
{
  self = [super init];
  if( self )
  {
    codecType = -1;
    resX = resY = 0;
    sourceIndex = -1;
    length = 0;
  }
  return self;
}

- (id)initFromCopy:(const FrameHeader *)instance
{
  FrameHeader* newInstance = [[FrameHeader alloc] init];
  if( newInstance )
  {
    newInstance->codecType = instance->codecType;
    newInstance->resX = instance->resX;
    newInstance->resY = instance->resY;
    newInstance->sourceIndex = instance->sourceIndex;
    newInstance->length = instance->length;
  }
  return newInstance;
}

- (id)initFromBuffer:(uint8_t *)buffer :(NSInteger)bufferLength
{
  self = [super init];
  if( self )
  {
    if( bufferLength < FRAME_HEADER_SIZE )
      self = nil;
    else
    {
      codecType = *(int32_t*)buffer;
      resX = *(uint16_t*)(buffer+4);
      resY = *(uint16_t*)(buffer+6);
      sourceIndex = *(int32_t*)(buffer+8);
      length = *(uint32_t*)(buffer+12);
    }
  }
  return self;
}

- (id)initFromData:(NSData *)data
{
  FrameHeader* newInstance = [[FrameHeader alloc] initFromBuffer:(uint8_t*)[data bytes] :data.length];
  return newInstance;
}

- (BOOL)getBuffer:(uint8_t *)buffer
{
  uint8_t* ptr = buffer;
  
  memcpy(ptr,&codecType,sizeof(int32_t));
  ptr += sizeof(int32_t);
  
  memcpy(ptr,&resX,sizeof(uint16_t));
  ptr += sizeof(uint16_t);
  
  memcpy(ptr,&resY,sizeof(uint16_t));
  ptr += sizeof(uint16_t);
  
  memcpy(ptr,&sourceIndex,sizeof(sourceIndex));
  ptr += sizeof(sourceIndex);
  
  memcpy(ptr, &length, sizeof(length));
  //ptr += sizeof(uint16_t);
  
  return TRUE;
}

- (BOOL)getData:(NSData *)data
{
  uint8_t* bytes = (uint8_t*)[data bytes];
  return [self getBuffer:bytes];
}

- (uint32_t)getLength
{
  return length;
}

@end

@implementation FrameHeaderEx

@synthesize originalResX,originalResY, subMainStream, time, index,snapshotImage;

- (uint32_t)bufferSize
{
  return FRAME_HEADER_EX_SIZE_SERVER_3_3;
}

- (id)init
{
  self = [super init];
  if( self )
  {
    originalResX = originalResY = 0;
    subMainStream = 0;
    time = 0;
    index = -1;
    snapshotImage = FALSE;
  }
  return self;
}

- (id)initFromCopy:(const FrameHeaderEx *)instance
{
  FrameHeaderEx* newInstance = [[FrameHeaderEx alloc] init];
  if( newInstance )
  {
    newInstance.codecType = instance.codecType;
    newInstance.resX = instance.resX;
    newInstance.resY = instance.resY;
    newInstance.sourceIndex = instance.sourceIndex;
    newInstance.length = instance.length;
    newInstance.originalResX = instance.originalResX;
    newInstance.originalResY = instance.originalResY;
    newInstance.subMainStream = instance.subMainStream;
    newInstance.time = instance.time;
    newInstance.index = instance.index;
    newInstance.snapshotImage = instance.snapshotImage;
  }
  return newInstance;
}

- (uint32_t)getLength
{
  return length;
}

- (id)initFromBuffer:(uint8_t *)buffer :(NSInteger)bufferLength
{
  self = [super init];
  if( self )
  {
    snapshotImage = FALSE;
    if( bufferLength < FRAME_HEADER_EX_SIZE_SERVER_3_2 )
    {
      codecType = *(int32_t*)buffer;
      resX = *(uint16_t*)(buffer+4);
      resY = *(uint16_t*)(buffer+6);
      sourceIndex = *(int32_t*)(buffer+8);
      length = *(uint32_t*)(buffer+12);
      
      originalResX = -1;
      originalResY = -1;
      subMainStream = NO;
      time = 0;
      index = -1;
    }
    
    else
    {
      codecType = *(int32_t*)buffer;
      resX = *(uint16_t*)(buffer+4);
      resY = *(uint16_t*)(buffer+6);
      sourceIndex = *(int32_t*)(buffer+8);
      length = *(uint32_t*)(buffer+12);
      
      originalResX = *(uint16_t*)(buffer+16);
      originalResY = *(uint16_t*)(buffer+18);
      
      if (bufferLength > FRAME_HEADER_EX_SIZE_SERVER_3_2) {
        subMainStream = *(int32_t*)(buffer + 20);
        time = *(uint32_t*)(buffer + 24);
        index = *(int*)(buffer + 28);
      }
      else
      {
        subMainStream = NO;
        time = 0;
        index = -1;
      }
      
    }
  }
  return self;
}

//- (id)initFromData:(NSData *)data
//{
//    FrameHeaderEx* newInstance = [[FrameHeaderEx alloc] initFromBuffer:(uint8_t*)[data bytes] :data.length];
//    return newInstance;
//}

- (BOOL)getBuffer:(uint8_t *)buffer
{
  uint8_t* ptr = buffer;
  
  memcpy(ptr,&codecType,sizeof(int32_t));
  ptr += sizeof(int32_t);
  
  memcpy(ptr,&resX,sizeof(uint16_t));
  ptr += sizeof(uint16_t);
  
  memcpy(ptr,&resY,sizeof(uint16_t));
  ptr += sizeof(uint16_t);
  
  memcpy(ptr,&sourceIndex,sizeof(sourceIndex));
  ptr += sizeof(sourceIndex);
  
  memcpy(ptr, &length, sizeof(length));
  ptr += sizeof(uint16_t);
  
  memcpy(ptr, &originalResX, sizeof(uint16_t));
  ptr += sizeof(uint16_t);
  
  memcpy(ptr, &originalResY, sizeof(uint16_t));
  ptr += sizeof(uint16_t);
  
  memcpy(ptr, &subMainStream, sizeof(int32_t));
  ptr += sizeof(int32_t);
  
  memcpy(ptr, &time, sizeof(uint32_t));
  ptr += sizeof(uint32_t);
  
  memcpy(ptr, &index, sizeof(int32_t));
  //ptr += sizeof(int32_t);
  
  return TRUE;
}

- (BOOL)getData:(NSData *)data
{
  uint8_t* bytes = (uint8_t*)[data bytes];
  return [self getBuffer:bytes];
}

@end

@implementation BitmapFrame

@synthesize header,image;

- (id) init
{
  self = [super init];
  if (self) {
    header = nil;
    image = nil;
  }
  return self;
}

- (id)initWithHeader:(FrameHeaderEx *)frameHeader withImage:(UIImage *)imageInstance
{
  self = [super init];
  if( self )
  {
    self->header = frameHeader;
    self->image = imageInstance;
  }
  return  self;
}

- (id)initWithHeader:(FrameHeaderEx *)frameHeader withImageBuffer:(uint8_t *)imageBuffer length:(NSInteger)bufferLength
{
  UIImage* newImage = [UIImage imageWithData:[NSData dataWithBytes:imageBuffer length:bufferLength]];
  BitmapFrame* newInstance = [[BitmapFrame alloc] initWithHeader:frameHeader withImage:newImage];
  return newInstance;
}

- (id)initWithHeader:(FrameHeader *)frameHeader withImageData:(NSData *)imageData
{
  UIImage* newImage = [UIImage imageWithData:imageData];
  BitmapFrame* newInstance = [[BitmapFrame alloc] initWithHeader:frameHeader withImage:newImage];
  return newInstance;
}

- (id)initwithRawData:(uint8_t *)data length:(NSInteger)dataLength version:(NSInteger)serverVersion
{
  uint8_t* bytes = data;
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
  
  if( dataLength < headerSize )
    return nil;
  
  FrameHeader* frameHeader = nil;
  if( serverVersion < VERSION_2300 )
    frameHeader = [[FrameHeader alloc] initFromBuffer:bytes :headerSize];
  else
    frameHeader = [[FrameHeaderEx alloc] initFromBuffer:bytes :headerSize];
  if( frameHeader )
  {
    bytes += headerSize;
    if( dataLength >= [frameHeader getLength] + headerSize )
    {
      BitmapFrame* newInstance = [[BitmapFrame alloc] initWithHeader:frameHeader withImageBuffer:bytes length:[frameHeader getLength]];
      return newInstance;
    }
  }
  return nil;
}

- (uint32_t)getFrameBufferSize
{
  return [header bufferSize] + [header getLength];
}

@end

@implementation DisplayedVideoFrame

@synthesize frameTime,channelIndex,sourceIndex,videoFrame,cameraName,serverAddress,serverPort, frameRate, resolutionHeight, resolutionWidth, timeOffset, frameIndex, codecId, frameMode,subMainStream;

-(id)init
{
  self = [super init];
  if( self )
  {
    frameTime = nil;
    channelIndex = -1;
    sourceIndex = -1;
    videoFrame = nil;
    cameraName = @"";
    serverAddress = @"";
    serverPort = 0;
    frameRate = -1;
    resolutionWidth = -1;
    resolutionHeight = -1;
    timeOffset = 0;
    codecId = 0;
    frameMode = LIVE_VIEW;
    subMainStream = 0;
    frameIndex = 0;
  }
  return self;
}
-(void) dealloc
{
  videoFrame = nil;
}

@end

@implementation EncodedFrame

@synthesize frameData, header, videoFrameInfo;

-(id)init
{
  self = [super init];
  if (self) {
    header = nil;
    frameData = nil;
    videoFrameInfo = nil;
  }
  
  return self;
}

-(void)dealloc
{
  frameData = nil;
  header = nil;
  videoFrameInfo = nil;
}

-(NSInteger)initwithRawData:(uint8_t *)data length:(NSInteger)dataLength version:(NSInteger)serverVersion
{
  uint8_t* bytes = data;
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
  
  FrameHeaderEx* frameHeader = nil;
  
  if( serverVersion < VERSION_2300 )
    frameHeader = [[FrameHeaderEx alloc] initFromBuffer:bytes :headerSize];
  else
    frameHeader = [[FrameHeaderEx alloc] initFromBuffer:bytes :headerSize];
  
  if (frameHeader.length > dataLength) {
    return -1;
  }
  
  if( frameHeader )
  {
    bytes += headerSize;
    //if( dataLength >= [frameHeader getLength])
    {
      //@autoreleasepool
      {
        id result = [self initWithHeader:frameHeader withBuffer:bytes length:[frameHeader getLength] forServerVersion:serverVersion];
        
        if (result) {
          return 0;
        }
        else
        {
          return -1;
        }
      }
    }
  }
  //free(data);
  return -1;
}


- (id)initWithHeader:(FrameHeader *)frameHeader withBuffer:(uint8_t *)buffer length:(NSInteger)bufferLength forServerVersion:(NSInteger)serverVersion
{
  self = [super init];
  if (self)
  {
    header = (FrameHeaderEx*)frameHeader;
    
    VideoEncodeDataHeader* vedHeader = (VideoEncodeDataHeader*)buffer;
    if (vedHeader->array_item[0].position + vedHeader->array_item[0].size > bufferLength) {
      return nil;
    }
    frameData = [NSData dataWithBytes:buffer length:bufferLength];
    videoFrameInfo = nil;
  }
  
  return self;
}

- (uint32_t)getFrameBufferSizeForServerVersion:(NSInteger)serverVersion
{
  if( serverVersion < VERSION_2300 )
    return [header bufferSize] + [header getLength];
  
  else if (serverVersion < VERSION_3300) {
    return FRAME_HEADER_EX_SIZE_SERVER_3_2 + [header getLength];
  }
  else
  {
    return FRAME_HEADER_EX_SIZE_SERVER_3_3 + [header getLength];
    
  }
  
}

@end

