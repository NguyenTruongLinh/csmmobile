//
//  ImcRemoteConnection.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/20/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#ifndef _IMC_REMOTE_CONNECTION_
#define _IMC_REMOTE_CONNECTION_

#import "../ImcGUIBase.h"

@class ImcConnectionServer;
@class ImcMobileCommand;
@class ImcVideoReceiverConnection;
@class ImcServerSetting;
@class ImcCameraList;
@class BitmapFrame;
@class EncodedFrame;

@interface ImcRemoteConnection : NSObject<NSStreamDelegate>{
  NSInputStream* receivedDataStream;
  NSOutputStream* sentDataStream;
  NSMutableData* dataBuffer;
  BOOL getLoginStatus;
  NSInteger connectionIndex;
  NSData* key;
  uint8_t* receivedBuffer;
  uint32_t receivedBufferLength;
  uint32_t sizeWillRead;
  uint32_t movedBytes;
  uint16_t currentCmd;
  BOOL     getting_cmd;
  NSMutableData* currentData;
  ImcVideoReceiverConnection* videoConnection;
  NSLock* connectionLock;
  NSLock* dataLock;
  BOOL isConnected;
  NSInteger serverVersion;
  NSInteger keepAliveCounter;
  NSCondition* waitToRead;
  BOOL connectingVideoPort;
  NSTimer* keepAliveTimer;
  BOOL connectionError;
  NSString* queueName;
  BOOL    firstConnect;
}

@property (strong) ImcServerSetting* deviceSetting;
@property (strong) ImcCameraList* deviceCameraList;
@property (strong) ImcConnectionServer* serverInfo;
@property (weak,nonatomic) id<ImcCommandControllerDelegate> delegate;
@property (readonly) NSInteger serverVersion;
@property (nonatomic, readwrite) NSInteger snapshotChannel;
@property (nonatomic) BOOL waitForAccept;
@property NSTimer* loginTimer;
@property (nonatomic, weak) NSRunLoop* streamingRL;
@property (nonatomic, strong) dispatch_queue_t dataQueue;


- (void)dealloc;
- (id)init :(ImcConnectionServer*)server;
- (BOOL) setupConnection;
- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)eventCode;
- (BOOL)processCommand;
- (BOOL)readAcceptInfo : (NSMutableData*)data;
- (BOOL)getLoginStatus : (NSMutableData*)data;
- (NSMutableData*)constructLoginInfo;
- (int)sendData:(NSData*)data;
- (ImcMobileCommand*)parserData:(NSData*)data;
- (BOOL)startVideoConnection;
- (void)disconnect;
- (void)sendCommand : (uint16_t)command : (void*)buffer : (NSInteger)bufferLength;
- (void)updateLayout : (uint16_t)layout;
- (void)parseCommandData:(id)data;
- (void)postVideoFrame:(BitmapFrame*)frame;
- (void)postSnapshotImage : (BitmapFrame*)frame;
- (void)videoSocketHasDisconnected;
- (BOOL)videoDisconnected;
- (void)postEncodedFrame:(EncodedFrame*)frame;
- (void)postSearchEncodedFrame:(EncodedFrame*)frame;
- (id)buildReQuestDayListMsg;
- (id)buildSearchCommonMessageWithTimeInterval:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask;
- (id)buildSearchCommonMessageWithTimeInterval2:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask;
- (id)buildSearchCommonMessageWithTimeInterval3:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask;
- (void)postDisconnectVideoMsg:(NSString*)serverAddress;
- (void)onDisconnect : (id)parameter;

@end
#endif  // _IMC_REMOTE_CONNECTION_

