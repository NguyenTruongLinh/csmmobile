//
//  ImcDecodeThread.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 10/23/12.
//
//
#import <Foundation/Foundation.h>
#import "ImcGUIBase.h"
#import "Imcbase.h"
#import "ImcQueue.h"
#import "codecf/CodecfDecoder.h"
#import "VideoFrame.h"
#import "ImcServerSetting.h"

//For CPU analyzer
#include <sys/sysctl.h>
#include <sys/types.h>
#include <mach/mach.h>
#include <mach/processor_info.h>
#include <mach/mach_host.h>

#define MAX_INVALID_FRAMES 4

@class decoderMapping;

@interface ImcDecodeThread : NSThread {
    ImcQueue* encodedFrames;
    NSCondition* waitThread;
    bool isRunning;
    bool isSuspendedThread;
    CodecfDecoder* decoders[IMC_MAX_CHANNEL];
    NSMutableArray* newResolution;
    BOOL needIFrame;
    NSTimer *updateTimer;
    long newestTime;
    long currentTime;    
    NSMutableArray *decoderMappings;
    NSMutableIndexSet* indicesOfDecoders;
    
    //For CPU analyzer
    processor_info_array_t cpuInfo, prevCpuInfo;
    mach_msg_type_number_t numCpuInfo, numPrevCpuInfo;
    unsigned numCPUs;
    NSLock *CPUUsageLock;
    IMC_VIDEO_MODE videoMode;
    
}

@property (weak,nonatomic) id<ImcCommandControllerDelegate> delegate;
@property NSInteger needToResetDecoderForChannelIndex;

-(void)mainThreadProc:(id)object;
-(void)addCommand:(ImcCommand*)command;
//lvxt begin
-(BOOL)addEncodedFrame : (EncodedFrame*)encodedFrame;

- (void)clearEncodedFrameQueue:(BOOL)clear;
//lvxt end
-(void)startThread;
-(void)stopThread;
-(void)updateFrameResolutionWithServerAddress :(NSString*)serverAddress channelIndex :(NSInteger)channelIndex isFullScreen :(BOOL)isFulllScreen isMainStream:(BOOL)isMainStream;
-(void)updateFrameQueueWhenFullScreen;
-(void)setVideoMode:(IMC_VIDEO_MODE)mode;
-(void)resetDecoderForChannelIndex:(NSInteger)channelIndex andServerAddress:(NSString*)serverAddress;
-(void)releaseDecoders:(NSString*)serverAddress;
@end



@interface decoderMapping : NSObject
@property NSString* serverAddress;
@property NSInteger channelIndex;
@property NSInteger decoderIndex;
@property CodecfDecoder* decoder;
@property BOOL willDestroy;
@property NSInteger invalidFramesCount;
@end



