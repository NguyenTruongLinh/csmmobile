//
//  ImcMainDisplayVideoView.h
//  CMSApp
//
//  Created by I3DVR on 11/28/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ImcGUIBase.h"

@class ImcScreenDisplay;

@interface ImcMainDisplayVideoView : NSObject {
  
  int maxDisplayChannels;
  bool isIphone;
  
  int touchedViewIndex;
  bool needToClearScreen;
  NSArray* displayViews;
  NSArray* displayScreens;
  NSTimer* timerDisplay;
  NSArray* displayLayers;
  CGRect frame;
  CALayer* rootLayer;
  CGFloat scaleValue;
  // UIImage* ptzIcon;
  CGPoint translationPoint;
  
  NSMutableArray* alarmTriggerRetain;
  BOOL isDisplayAlarmTrigger;
  BOOL isRotate;
  NSLock* videoLock;
  
  NSTimer* updateFrameRateTimer;
  int frameRates[IMC_MAX_DISPLAY_SCREEN];
  NSString* displayString;
  NSString* screenString;
  NSString* serverAddressInfo;
  NSString* frameRate;
  
}

@property (readwrite) IMC_DIVISION_MODE currentDiv;
@property (readwrite) int fullscreenView;
@property (readwrite) int playerWidth;
@property (readwrite) int playerHeight;
@property (readwrite) float scaleXY;
@property (readwrite) int translateX;
@property (readwrite) int translateY;
@property (nonatomic, weak) id<i3ProcessConnectionDelegate> delegate;
@property IMC_DISPLAY_MODE displayMode;
@property (nonatomic, readwrite) CGFloat scaleValue;
@property (readwrite) int selectedView;
@property NSMutableArray* singleTapScreenIndex;
@property NSInteger fullscreenIndex;
@property NSInteger alarmLoop;
@property NSMutableArray* connectedServerList;
@property UIImage* logoImage;
@property NSMutableDictionary* channelConfigBuffer;

-(void)onDoubleTap:(CGPoint)tapPoint;
-(void)onSingleTap:(CGPoint)tapPoint;

- (id)init;
- (id)initWithFrame : (CGRect)_frame withRootLayer : (CALayer*)_rootLayer;
- (void) initDisplayRectwithDiv : (IMC_DIVISION_MODE)div;
- (void)setdisplayRect : (CGRect)_frame withRootLayer : (CALayer*)_rootLayer;

- (void)loadLogo;
- (CGRect)callDisplayRect : (CGRect)displayArea : (CGSize)imageSize : (BOOL)cropImage;
- (CGSize)getChannelViewRes;
- (void)addVideoFrame:(id)videoFrame;
- (void)updateDivision : (IMC_DIVISION_MODE)div;
- (NSInteger)viewAtPoint : (CGPoint)point;
- (NSInteger)screenAtPoint : (CGPoint)point;
- (void)makeViewFullscreen : (NSInteger)viewIndex;
- (void)updateDisplayViewInfo : (NSArray*)displayViewInfos;
- (void)swipeRight;
- (void)swipeLeft;
- (void)zoomPinchDisplay : (CGFloat)ratio withTranslation:(CGPoint)translatePt;
- (void)handlePan:(CGPoint)translation;
- (void)resetDisplayMapping;
- (void)remoteAllLayers;
- (uint64_t)getDisplayChannelForServer : (NSString*)serverAddress andPort : (NSInteger)serverPort;
- (NSInteger)fullscreenChannelForServer : (NSString*)serverAddress andPort : (NSInteger)serverPort;
- (void)updateDisplayChannel : (ImcChannelMapping*)serverChannelMapping;
- (BOOL)fillAndUpdateDisplayChannel : (ImcChannelMapping*)serverChannelMapping;
- (void)updateChannelMapping : (ImcChannelMapping*)serverChannelMapping channelConfigs:(NSArray*)channelConfigs;
- (void)makeDefaultMappingforServer : (ImcChannelMapping *)serverChannelMapping withChannelConfig:(ImcChannelConfig*)serverChannelConfig fromScreenIndex : (NSInteger)screenIndex;
- (void)getDisplaySize : (CGSize*)smallDivSize : (CGSize*)largeDivSize;
- (void)setFrame : (CGRect)_frame;
- (void)removeScreenForServer : (NSString*)serverAddress andPort : (NSInteger)serverPort;

- (void)getDisplayScreenArray : (NSArray*)displayScreenArray;
- (NSMutableArray*)getAvailableScreens;
- (ImcScreenDisplay*)screenItem : (NSInteger)screenIndex;
- (void)swapScreens : (NSInteger)screenIndex1 : (NSInteger)screenIndex2;
- (void)resetScreen : (NSInteger)screenIndex;
- (void)updateScreenWithChannelConfig : (ImcChannelConfig*)guiChannelConfig server:(ImcConnectedServer*)server favoriteChannel:(NSArray*)favoriteChannels;
- (ImcCommonHeader*)headerForFullscreenChannel;
- (NSInteger)screenIndexofServer : (NSString*)serverAddress withPort :(NSInteger)serverPort andChannel : (NSInteger)channelID;
- (CGRect)ptzIconFrame;
- (void)invalidate;
- (UIImage*)getFullscreenImage;
-(void)alarmPlayASound:(NSInteger) alarmType;
-(void)onRotation:(UIInterfaceOrientation)toInterfaceOrientation;
-(NSArray*) getDisplayScreens;
-(void)removeScreenAtIndex:(NSInteger)screenIndex withServerList:(NSArray*)serverList;
-(int)insertScreenAtScreenIndex:(NSInteger)screenIndex1 forChannelIndex:(NSInteger)channelIndex withServerList:(NSArray*)serverList andChannelMapping:(ImcConnectedServer*)connectedserver;
-(uint64_t)getSnapShotForChannel:(NSArray*)channelID inServer:(NSString*)serverAddress port:(NSInteger)serverPort;
-(NSInteger)flashingIconForAlarm;
-(NSArray*)getDisplayLayer;
-(NSArray*)getDisplayView;
-(void)setScreenDisplay:(NSArray*)screenDisplay;
-(void)refreshLogo:(UIImage*)newLogo;
-(void)exitFullScreenMode;
-(void)startUpdateFrameRateTimer;
-(void)stopUpdateFrameRateTimer;
-(void)updateChannelBufferWithDisconnectedServer:(NSString*)serverAddress;
-(void)updateScreenWithChannelConfig:(ImcChannelConfig *)guiChannelConfig server:(ImcConnectedServer *)server;
-(CALayer*)fullscreenLayer;
-(void)updateViewZoomingStatus:(BOOL)status; // TRUE: view is zooming status
-(void)showPtzIcon;

@end
