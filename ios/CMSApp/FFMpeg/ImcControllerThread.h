//
//  ImcControllerThread.h
//  CMSApp
//
//  Created by I3DVR on 11/23/18.
//  Copyright © 2018 Facebook. All rights reserved.
//
#import "ImcGUIBase.h"
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <AudioToolbox/AudioToolbox.h>
#import "AppDelegate.h"
#import "ImcDecodeThread.h"

//#import "ImcEnvSetting.h"
//@class ImcConnectionManager;
//@class ImcCommand;
@class ImcEnvSetting;

@interface ImcControllerThread : NSThread<ImcCommandControllerDelegate>{
  //ImcConnectionManager* connectionManager;
  NSMutableArray* connectionList;
  NSMutableArray* commandList;
  NSLock* lockCommandList;
  NSCondition* lockThread;
  NSLock* lockServerList;
  BOOL isRunning;
  ImcEnvSetting* env;
//  BOOL isBusy;
  AVAudioPlayer *player;
  BOOL firstMainStreamFrame;
}

@property (weak,nonatomic) id<ImcCommandControllerDelegate> delegate;
@property (nonatomic, retain) ImcDecodeThread* decoderThread;
@property BOOL isRelay;

-(void)mainThreadProc:(id)object;
-(void)addCommand:(ImcCommand*)command;
-(ImcCommand*)getCurrentCommand;
-(void)clearAllCommands;
-(void)startThread;
-(void)stopThread;

-(void)updateLayout : (NSInteger)layout;
-(void)updateChannelMapping : (NSArray*)viewsInfo : (bool)sendToServer;
-(void)updateFullscreenChannel : (NSString*)serverAddress : (NSInteger)serverPort : (NSInteger)fullscreenChannel;
-(void)updateRatioView : (NSInteger)ratioView : (bool)sendToServer;
-(void)updateAlarmSetting : (NSString*)serverAddress : (NSInteger)serverPort :(id)alarmSetting;
-(void)updateVolumeLevel:(NSNumber*)volumeLevel;
-(void)playAnAlarmSound:(NSNumber*)volumeLevel;
-(void)updateServerDisplayMask : (NSString*)serverAddress : (NSInteger)serverPort : (uint64_t)channelMask;
-(void)updateDisplaySize : (CGSize)smallDivSize : (CGSize)largeDivSize;
-(void)updateSettingToServer : (ImcConnectedServer*)connectedServer;

-(void)processAlarmListCommand : (IMC_MOBILE_COMMAND)command : (id)parameter;
-(void)processPtzOperation : (NSInteger)messageID : (NSObject*)parameter;
-(void)processSnapshotRequest : (NSInteger)messageID : (NSObject*)parameter;

-(void)stopTransferingVideo;
-(void)startTransferingVideo;

-(void)prepareForMinimize;
-(void)prepareForRestore;
-(void)disconnectAllServers;
-(void)updateFavoriteServerDisplayMask : (NSString*)serverAddress : (NSInteger)serverPort : (uint64_t)channelMask;
-(void)disconnectServers:(NSArray*)serverList;
-(void)updateMainSubStream:(NSString *)serverAddress :(NSInteger)serverPort :(NSInteger)fullscreenChannel;
-(void)updateMainSubStreamResponse:(BOOL)needMainStream;
-(ImcServerSetting*)getMainSubStreamRequestForServer:(NSString*)serverAddress;
-(void)sendRequestTimeZoneToServer:(ImcConnectionServer*)connectionServer;
-(void)sendSearchCommonMessageToServer:(ImcConnectionServer*)connectionServer message:(MOBILE_MSG)message forTimeInterval:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask;
-(void)startTransferingVideoForServer:(NSArray*)data;

@end
