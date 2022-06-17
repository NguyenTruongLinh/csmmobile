//
//  AppStateViewManager.m
//  CMSApp
//
//  Created by i3admin on 4/17/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "AppStateView.h"
#import "AppStateViewManager.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTConvert.h>
#import "RCTEventEmitter.h"
#import <React/RCTViewManager.h>


#if __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#elif __has_include("RCTBridge.h")
#import "RCTBridge.h"
#else
#import
#import "React/RCTBridge.h"
#endif


@implementation AppStateViewManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

#pragma mark - Lifecycle

- (UIView *)view
{
//  return [[AppStateView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
  return [AppStateView alloc];
}

- (dispatch_queue_t)methodQueue{
  return dispatch_get_main_queue();
}

#pragma mark - Props

#pragma mark - Events

RCT_EXPORT_VIEW_PROPERTY(onAppStateChange, RCTDirectEventBlock);

@end
