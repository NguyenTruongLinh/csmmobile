//
//  ImcDisplayChannel.h
//  CMSApp
//
//  Created by I3DVR on 11/23/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#ifndef _IMC_DISPLAY_CHANNEL_
#define _IMC_DISPLAY_CHANNEL_

@interface ImcScreenDisplay : NSObject{
  NSString* serverName;
  NSString* serverAddress;	
  NSInteger serverPort;
  NSInteger channelIndex;
  NSInteger viewIndex;
  NSString* cameraName;
  NSInteger screenIndex;
  BOOL      enablePtz;
  BOOL      isEnable;
  BOOL      showPtzIcon;
}

@property (nonatomic)               NSString* serverName;
@property (nonatomic)               NSString* serverAddress;
@property (nonatomic, readwrite)    NSInteger serverPort;
@property (nonatomic, readwrite)    NSInteger channelIndex;
@property (nonatomic, readwrite)    NSInteger viewIndex;
@property (nonatomic, strong)       UIImage*  displayImage;
@property (nonatomic, weak)         UIImage*  lastDisplayImage;
@property (nonatomic)               NSString* cameraName;
@property (nonatomic, readwrite)    NSInteger screenIndex;
@property (nonatomic, readwrite)    BOOL      enablePtz;
@property (nonatomic, readwrite)    BOOL      hasAlarmIcon;
@property (nonatomic, readwrite)    BOOL      isAlarmTrigger;
@property (nonatomic, readwrite)    BOOL      isBordered;
@property (nonatomic, readwrite)    BOOL      isEnable;
//transform information
@property                           float     scaleValue;
@property (nonatomic)               CGPoint   transValue;
@property                           NSInteger frameRate;
@property                           NSInteger resolutionHeight;
@property                           NSInteger resolutionWidth;
@property (atomic)                  NSDate*   lastUpdateTime;
@property                           BOOL      hasSubStream;
@property                           BOOL      isSubStream;
@property                           BOOL      needMainStream;
@property                           BOOL      showPtzIcon;

-(UIImage*)getScaledImage:(int)playerWidth :(int)playerHeight :(float)scaleXY :(int)translateX :(int)translateY;
-(void)applyTransValue:(CGPoint)_transValue;
-(NSTimeInterval)timeFromLastUpdate;
-(BOOL)needDrawScreen;
@end

@interface ImcViewDisplay : NSObject

@property (nonatomic, readwrite)    NSInteger   screenIndex;

@property (nonatomic, readwrite)    CGRect      frame;
@property (readwrite)               bool        needDisplay;
@property (readwrite)               NSInteger   displayMode;
@property (readwrite)               bool        isTouched;
@property (readwrite)               bool        enable;
@property (nonatomic, readwrite)    CGRect      ptzIconRect;
@property                           BOOL        isZooming;

- (id)initWithScreenIndex : (NSInteger)_index andFrame : (CGRect)_frame;
- (id)initWithScreenIndex : (NSInteger)_index;

- (CGRect)callDisplayRect:(CGRect)displayArea :(CGSize)imageSize;

- (bool) hitTest : (CGPoint)point;

@end

#endif  // _IMC_DISPLAY_CHANNEL_
