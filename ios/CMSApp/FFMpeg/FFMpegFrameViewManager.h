//
//  FFMpegFrameViewManager.h
//  CMSApp
//
//  Created by I3DVR on 9/13/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#if __has_include(<React/RCTViewManager.h>)
#import <React/RCTViewManager.h>
#elif __has_include("RCTViewManager.h")
#import "RCTViewManager.h"
#else
#import
#import "React/RCTViewManager.h"
#endif

@interface FFMpegFrameViewManager : RCTViewManager

@end
