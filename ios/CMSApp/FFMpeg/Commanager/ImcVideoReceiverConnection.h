//
//  ImcVideoRecieveConnection.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/17/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import "../VideoFrame.h"

@class ImcRemoteConnection;

@interface ImcVideoReceiverConnection : NSObject<NSStreamDelegate>{
  NSInputStream* receivedDataStream;
  NSOutputStream* sentDataStream;
  NSString* serverAddress;
  NSInteger serverPort;
  NSInteger connectionIndex;
  NSMutableData* receiverBuffer;
  uint32_t receiverBufferLength;
  NSCondition *streamLock;
  NSInteger sizeWillRead;
  uint16_t currentCmd;
  NSMutableData* currentData;
  FrameHeader* frameHeader;
  BitmapFrame* rawVideo;
  EncodedFrame* encodedVideo;
  enum state{
    get_cmd = 0,
    get_header,
    get_data
  };
  enum state current_state;
//  __volatile BOOL isRLRunning;
}

@property (nonatomic, weak) ImcRemoteConnection* parent;
@property (nonatomic, readonly) BOOL disconnected;
@property (nonatomic, weak)  NSRunLoop* streamingRL;
@property (nonatomic, strong) dispatch_queue_t streamQueue;
@property NSTimer* videoTimer;
// @property NSTimer* stopThreadTimer;
@property NSInteger timerCounter;
// @property (nonatomic) __volatile BOOL isRLRunning;


- (id) initWithConnectionIndex : (NSInteger)index;

- (BOOL)connectToServer : (NSString*)address : (NSInteger)port;
- (BOOL)processData;
- (void)disconnectToServer;
-(void)startVideoTimer;

@end
