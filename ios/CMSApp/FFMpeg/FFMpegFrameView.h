//
//  FFMpegFrameView.h
//  CMSApp
//
//  Created by I3DVR on 9/14/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import <React/RCTComponent.h>
#import "ImcGUIBase.h"
#import "ImcDecodeThread.h"

@class ImcMainDisplayVideoView;
@class RCTEventDispatcher;
@class ImcControllerThread;
@class i3DisconnectWarningInfo;
@class i3ResumeDataInfo;

typedef enum
{
  STATE_PLAY = 0,
  STATE_STOP = 1,
  STATE_PAUSE = 2,
  
} VIDEO_PLAYER_STATUS;

typedef enum
{
  NORMAL = 0,
  BEGIN_DAYLIGHT,
  END_DAYLIGHT
}DAY_TYPE;

typedef enum
{
  ZOOM_LEVEL_24H = 0,
  ZOOM_LEVEL_6H = 1,
  ZOOM_LEVEL_1H = 2,
  ZOOM_LEVEL_15M = 3
} ZOOM_LEVEL;

@interface FFMpegFrameView : UIView {
  ImcControllerThread* controllerThread;
  ImcDecodeThread* decoderThread;
  i3DisconnectWarningInfo* disconnectWarning;
  NSMutableArray* connectedServerList;
  i3ResumeDataInfo* resumeDataInfo;
  NSCondition* viewMaskLock;
  UIView* videoView;
  BOOL viewMaskArray[IMC_MAX_CHANNEL];
  NSMutableArray* channelsMapping;
  uint32_t m_numHoursPerDay;
  double   m_minutesPerLayer;
  BOOL m_delayPlayback;
  UIImage* defaultImg;
  CALayer* m_videoLayer;
  // CMS added
//  NSString* m_channel;
  BOOL needToClearScreen;
}

@property (nonatomic) UIDeviceOrientation currentDeviceOrientation;
@property (nonatomic) UIInterfaceOrientation currentInterfaceOrientation;
@property (nonatomic, strong) ImcMainDisplayVideoView* mainDisplayVideo;
@property VIDEO_PLAYER_STATUS videoPlayerStatus;
@property NSInteger currentSelectedFullScreenChannel;
@property NSMutableArray* connectedServers;
@property NSTimer* timer;
@property DAY_TYPE m_dayType;
@property BOOL isRotate;
//@property CGRect mainViewFullRect;
//@property CGRect mainViewRect;
@property ImcConnectedServer* currentServer;
@property NSInteger chosenServerIndex;
@property long lastFrameInterval;
@property NSInteger zoomLevel;
@property long lastResumeTime;
@property NSDate* chosenDay;
@property int hourSpecialDST;
@property BOOL firstRunAlarm;
@property NSMutableArray* dateIntervalList;
@property UIImage* searchFrameImage;
@property CGSize searchFrameRect;
@property BOOL doesTodayHasData;
@property NSArray* dataDateList;
@property NSInteger chosenChannelIndex;
@property NSMutableDictionary* channelsSearchDictionary;
@property NSMutableArray* searchingDateInterval;
@property (strong, nonatomic) NSTimeZone* calTimezone;
@property (strong, nonatomic) IBOutlet UICollectionView *channelListCollectonView;
//model
@property (strong, nonatomic) NSArray *rdvs;
@property (strong, nonatomic) NSDate *currentDate;
@property (strong, nonatomic) NSMutableDictionary *eventsGroupByDay;
@property (strong, nonatomic) NSCalendar *calendar;
@property (strong, nonatomic) NSDateComponents *timeComponents;
@property (strong, nonatomic) NSDate *fromFirstDayMonth;

//Property react native
@property(nonatomic, assign) NSArray *data;
@property(nonatomic, assign) NSNumber *width;
@property(nonatomic, assign) NSNumber *height;
@property(nonatomic, assign) NSDictionary *startplayback;
@property(nonatomic, assign) BOOL stop;
@property(nonatomic, assign) BOOL exit;
@property(nonatomic, assign) BOOL pause;
@property(nonatomic, assign) BOOL firstrun;
@property(nonatomic, assign) BOOL singlePlayer;
@property(nonatomic, assign) int fullscreen;
@property(nonatomic, assign) NSDictionary *seekpos;
@property(nonatomic, assign) NSString *src;
@property(nonatomic, assign) BOOL hd;
@property(nonatomic, assign) BOOL stretch;
@property(nonatomic, assign) BOOL refresh;
@property(nonatomic, assign) BOOL disconnect;
@property (nonatomic, copy) RCTDirectEventBlock onFFMPegFrameChange;

- (UIImage*)getScaledSearchImage;
- (instancetype)initWithEventDispatcher: (RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;
- (NSInteger)handleResponseMessage:(IMC_MSG_BASE)messageId fromView:(UIView *)sender withData:(NSObject *)responseData;
- (void)orientationChanged;
- (NSCalendar*)AgendaCalendar;
- (void)updateDataDateList:(NSTimeZone*)serverTimeZone;
- (void)fullScreenSearchMode:(NSInteger)channelIndex:(BOOL)checkRecordDataDayFlag;
@end


@interface i3DisconnectWarningInfo : NSObject
@property   NSString* message;
@property   ImcConnectedServer* server;

-(void)reset;

@end


@interface i3ResumeDataInfo : NSObject
typedef NS_ENUM(NSUInteger, RESUME_VIEW_MODE)
{
  CONNECTION_MODE = 0,
  LIVE_MODE,
  PLAYBACK_MODE
};

@property NSMutableArray* channelsMapping;
@property NSArray* connectedServerList;
@property NSInteger currentView;
@property BOOL didShowDivisionView;
@property BOOL mainStreamChannel;
@property NSArray* mainSubStreamList;
@property RESUME_VIEW_MODE current_mode;
@property i3PlaybackResumeInfo* playbackInfo;
@property NSInteger numProcessServer;

- (NSArray*) getChannelMappingOfConnectedServer:(ImcConnectedServer*)server;
@end
