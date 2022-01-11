//
//  FFMpegFrameViewManager.m
//  CMSApp
//
//  Created by I3DVR on 9/13/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "FFMpegFrameViewManager.h"
#import "FFMpegFrameView.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTConvert.h>
#import "RCTEventEmitter.h"

#if __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#elif __has_include("RCTBridge.h")
#import "RCTBridge.h"
#else
#import
#import "React/RCTBridge.h"
#endif

@implementation FFMpegFrameViewManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

#pragma mark - Lifecycle

- (UIView *)view
{
  return [[FFMpegFrameView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

- (dispatch_queue_t)methodQueue{
  return dispatch_get_main_queue();
}

#pragma mark - Props

RCT_EXPORT_VIEW_PROPERTY(width, NSNumber);

RCT_EXPORT_VIEW_PROPERTY(height, NSNumber);

RCT_EXPORT_VIEW_PROPERTY(src, NSString);

RCT_EXPORT_VIEW_PROPERTY(startplayback, NSDictionary);

RCT_EXPORT_VIEW_PROPERTY(fullscreen, int);

RCT_EXPORT_VIEW_PROPERTY(stop, BOOL);

RCT_EXPORT_VIEW_PROPERTY(pause, BOOL);

RCT_EXPORT_VIEW_PROPERTY(firstrun, BOOL);

RCT_EXPORT_VIEW_PROPERTY(singlePlayer, BOOL);

RCT_EXPORT_VIEW_PROPERTY(exit, BOOL);

RCT_EXPORT_VIEW_PROPERTY(hdmode, BOOL);

RCT_EXPORT_VIEW_PROPERTY(seekpos, NSDictionary);

RCT_EXPORT_VIEW_PROPERTY(refresh, BOOL);

RCT_EXPORT_VIEW_PROPERTY(disconnect, BOOL);

#pragma mark - Events

RCT_EXPORT_VIEW_PROPERTY(onFFMPegFrameChange, RCTDirectEventBlock);
@end

