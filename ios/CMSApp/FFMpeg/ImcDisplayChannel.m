//
//  ImcDisplayChannel.m
//  CMSApp
//
//  Created by I3DVR on 11/23/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "ImcDisplayChannel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>


#define LEFT_MARGIN 1
#define TOP_MARGIN 1

@implementation ImcScreenDisplay

@synthesize serverAddress,serverPort,channelIndex,viewIndex,displayImage,cameraName,screenIndex,enablePtz,serverName, hasAlarmIcon, isAlarmTrigger, isBordered, isEnable, scaleValue, frameRate, resolutionHeight, resolutionWidth, hasSubStream, isSubStream, needMainStream,transValue,lastDisplayImage,lastUpdateTime,showPtzIcon;

-(id)init
{
  self = [super init];
  if( self )
  {
    serverName      = nil;
    serverAddress   = nil;
    serverPort      = 0;
    channelIndex    = -1;
    viewIndex       = -1;
    screenIndex     = -1;
    displayImage    = [UIImage imageNamed:@"Mobile_Logo1"];
    cameraName      = nil;
    enablePtz       = FALSE;
    hasAlarmIcon    = FALSE;
    isAlarmTrigger  = FALSE;
    isBordered      = FALSE;
    isEnable        = FALSE;
    scaleValue      = 1.0f;
    transValue      = CGPointZero;
    resolutionHeight = -1;
    resolutionWidth = -1;
    hasSubStream = NO;
    isSubStream = YES;
    needMainStream = NO;
    lastDisplayImage = nil;
    lastUpdateTime = [NSDate date];
    showPtzIcon     = YES;
  }
  return self;
}

-(void)applyTransValue:(CGPoint)_transValue
{
  transValue.x += _transValue.x;
  transValue.y += _transValue.y;
  
  // verify
  if(transValue.x - scaleValue/2 < -0.5)
    transValue.x = -.5 + scaleValue/2;
  if(transValue.y - scaleValue/2 < -0.5)
    transValue.y = -.5 + scaleValue/2;
  if(transValue.x + scaleValue/2 > 0.5)
    transValue.x = 0.5 - scaleValue/2;
  if(transValue.y + scaleValue/2 > 0.5)
    transValue.y = 0.5 - scaleValue/2;
}

-(UIImage*)getScaledImage
{
  //NSLog(@"Shark scaled image");
  if(scaleValue>=1.0)
    {
      //NSLog(@"Shark scaleValue>=1.0");
      return displayImage;
    }
  
  //NSLog(@"Shark scaleValue else");
  CGRect imgRect = CGRectMake(0, 0, displayImage.size.width, displayImage.size.height);
  CGFloat dx = imgRect.size.width*(1-scaleValue)/2;
  CGFloat dy = imgRect.size.height*(1-scaleValue)/2;
  CGRect scaledImgRect = CGRectInset(imgRect, dx, dy);
  CGFloat trans_x = transValue.x*displayImage.size.width;
  CGFloat trans_y = transValue.y*displayImage.size.height;
  scaledImgRect = CGRectOffset(scaledImgRect, trans_x, trans_y);
  scaledImgRect = CGRectIntersection(scaledImgRect, imgRect);
  CGImageRef drawImg = CGImageCreateWithImageInRect(displayImage.CGImage,scaledImgRect);
  
  UIImage *imageOut = [UIImage imageWithCGImage:drawImg];
  return imageOut;
}

-(NSTimeInterval)timeFromLastUpdate
{
  NSTimeInterval diff = [[NSDate date] timeIntervalSinceDate:lastUpdateTime];
  return diff;
}

-(BOOL)needDrawScreen
{
  return (lastDisplayImage != displayImage);
}

@end

@implementation ImcViewDisplay
@synthesize needDisplay,displayMode,isTouched,enable,screenIndex,frame,ptzIconRect,isZooming;

- (id)init
{
  self = [super init];
  if( self)
  {
    screenIndex = -1;
    needDisplay = false;
    displayMode = 1;
    isTouched = false;
    enable = false;
    frame = CGRectMake(0, 0, 0, 0);
    ptzIconRect = CGRectMake(0, 0, 0, 0);
  }
  return self;
}

- (id)initWithScreenIndex:(NSInteger)_index
{
  self = [super init];
  if( self)
  {
    screenIndex = _index;
    needDisplay = false;
    displayMode = 1;
    isTouched = false;
    enable = false;
    frame = CGRectMake(0, 0, 0, 0);
    ptzIconRect = CGRectMake(0, 0, 0, 0);
  }
  return self;
}

- (id)initWithScreenIndex:(NSInteger)_index andFrame:(CGRect)_frame
{
  self = [super init];
  if( self)
  {
    screenIndex = _index;
    needDisplay = false;
    displayMode = 1;
    isTouched = false;
    enable = false;
    frame = _frame;
  }
  return self;
}

- (CGRect)callDisplayRect:(CGRect)displayArea :(CGSize)imageSize
{
  CGPoint origin = displayArea.origin;
  CGSize calDisplaySize = displayArea.size;
  CGRect returnRect;
  CGFloat srcRatio = displayArea.size.width*imageSize.height;
  CGFloat dstRatio = imageSize.width*displayArea.size.height;
  if( srcRatio >= dstRatio )
  {
    calDisplaySize.width = displayArea.size.height/imageSize.height*imageSize.width;
    origin.x = displayArea.origin.x + (displayArea.size.width-calDisplaySize.width)/2;
  }
  else
  {
    calDisplaySize.height = displayArea.size.width/imageSize.width*imageSize.height;
    origin.y = displayArea.origin.y + (displayArea.size.height-calDisplaySize.height)/2;
  }
  returnRect = CGRectMake(origin.x, origin.y, calDisplaySize.width, calDisplaySize.height);
  return returnRect;
}

- (bool)hitTest:(CGPoint)point
{
  return CGRectContainsPoint(frame, point);
}

@end
