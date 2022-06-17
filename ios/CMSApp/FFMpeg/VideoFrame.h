//
//  VideoFrame.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/20/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import "codecf/CodecWrapper.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#define FRAME_HEADER_SIZE 16
#define FRAME_HEADER_EX_SIZE_SERVER_3_2 20
#define FRAME_HEADER_EX_SIZE_SERVER_3_3 32

@interface FrameHeader : NSObject{
  int32_t codecType;
  uint16_t resX;
  uint16_t resY;
  int32_t sourceIndex;
  uint32_t length;
}

typedef enum
{
  LIVE_VIEW = 0,
  SEARCH_VIEW = 1,
  SNAPSHOT
} FRAME_MODE;

@property (readwrite)    int32_t codecType;
@property (readwrite)    uint16_t resX;
@property (readwrite)    uint16_t resY;
@property (readwrite)    int32_t sourceIndex;
@property (readwrite)    uint32_t length;

- (uint32_t)bufferSize;
- (id) initFromCopy : (const FrameHeader*)instance;
- (id) initFromBuffer : (uint8_t*)buffer : (NSInteger)bufferLength;
- (id) initFromData : (NSData*)data;
- (BOOL) getBuffer : (uint8_t*)buffer;
- (BOOL) getData : (NSData*)data;
- (uint32_t) getLength;

@end

@interface FrameHeaderEx : FrameHeader{
  
  //New information for MR version 2.0
  uint16_t originalResX;
  uint16_t originalResY;
  int32_t subMainStream;
  uint32_t time ;
  int32_t  index;
}

@property (readwrite)    uint16_t originalResX;
@property (readwrite)    uint16_t originalResY;
@property int32_t subMainStream;
@property uint32_t time ;
@property int32_t  index;
@property BOOL   snapshotImage;

- (uint32_t)bufferSize;
- (id) initFromCopy : (const FrameHeaderEx*)instance;
- (id) initFromBuffer : (uint8_t*)buffer : (NSInteger)bufferLength;
//- (id) initFromData : (NSData*)data;
- (BOOL) getBuffer : (uint8_t*)buffer;
- (BOOL) getData : (NSData*)data;
- (uint32_t) getLength;

@end

@interface MobileSearchFrameHeader : NSObject{
  int codecType;
  int channelID;
  int frameTime;
}

@end

@interface BitmapFrame : NSObject{
  FrameHeaderEx* header;
  UIImage* image;
}

@property (nonatomic, readonly) FrameHeaderEx* header;
@property (nonatomic, readonly) UIImage* image;

- (id)initWithHeader : (FrameHeader*)frameHeader withImage:(UIImage*)imageInstance;
- (id)initWithHeader:(FrameHeader *)frameHeader withImageBuffer :(uint8_t *)imageBuffer length:(NSInteger)bufferLength;
- (id)initWithHeader:(FrameHeaderEx *)frameHeader withImageData:(NSData *)imageData;
- (id)initwithRawData : (uint8_t*)data length:(NSInteger)dataLength version:(NSInteger)serverVersion;

- (uint32_t)getFrameBufferSize;
@end


@interface DisplayedVideoFrame : NSObject{
  NSString* serverAddress;
  NSInteger serverPort;
  NSInteger channelIndex;
  NSInteger sourceIndex;
  NSString* cameraName;
  NSDate* frameTime;
  UIImage* videoFrame;
  NSCondition* streamLock;
}
@property (retain) NSString* serverAddress;
@property (readwrite) NSInteger serverPort;
@property (readwrite) NSInteger channelIndex;
@property (readwrite) NSInteger sourceIndex;
@property (retain) NSString* cameraName;
@property (retain) NSDate* frameTime;
@property (nonatomic, strong) UIImage* videoFrame;
@property NSInteger frameRate;
@property NSInteger resolutionHeight;
@property NSInteger resolutionWidth;
@property NSInteger timeOffset;
@property NSInteger frameIndex;
@property uint32_t codecId;
@property FRAME_MODE frameMode;
@property int32_t subMainStream;

@end
@interface EncodedFrame : NSObject

@property (nonatomic) FrameHeaderEx* header;
@property (nonatomic) NSData* frameData;
@property (nonatomic) DisplayedVideoFrame* videoFrameInfo;

- (NSInteger)initwithRawData : (uint8_t*)data length:(NSInteger)dataLength version:(NSInteger)serverVersion;
- (id)initWithHeader:(FrameHeader *)frameHeader withBuffer:(uint8_t *)buffer length:(NSInteger)bufferLength forServerVersion:(NSInteger)serverVersion;
- (uint32_t)getFrameBufferSizeForServerVersion:(NSInteger)serverVersion;

@end

@interface i3StreamHeader : NSObject

@property uint8_t  version; //version
@property uint8_t  flag;  //bit0 : 1 iframe
//   0 pframe
//bit1 : 1 end
//   0 not end
//bit2&3: 0 null
//   1 video
//   2 audio
//   3 video&audio
//bit 4&5: 0 live encoded
//   1 search encoded
//   2 search group
//   3 preserve
//other bits preserve now
@property uint8_t  xor;
@property uint64_t  channel; //channel No. or channel mask
//JK Bin Add Feb. 28, 2006 _Begin
@property uint32_t  framelength;//frame length
@property uint32_t  offset; // offset in this frame, starts from 0 to frame length - 1
@property uint8_t  coding_method; // encode/decode method is IP mode or PP mode, defined by VIDEO_CODING_METHOD enum
//JK Bin Add Feb. 28, 2006 _End
@property uint32_t  length;  //length of this packet
@property uint8_t  psequence; //packet no.
@property uint16_t  fSequence; //frame no.
@property uint16_t  iframe;  //the iframe no. that it depends
@property uint32_t  time;  //the time of this frame
@property uint16_t  audio_position;   //start position of video, the offset from beginning, if 0 means no audio data.
@property uint16_t  video_position;   //ditto
@end

@interface searchEncodedFrame : NSObject

@property i3StreamHeader* header;
@property NSData* frameData;
@end


