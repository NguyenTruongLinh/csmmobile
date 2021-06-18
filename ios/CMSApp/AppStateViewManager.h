//
//  AppStateViewManager.h
//  CMSApp
//
//  Created by i3admin on 4/17/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#if __has_include(<React/RCTViewManager.h>)
#import <React/RCTViewManager.h>
#elif __has_include("RCTViewManager.h")
#import "RCTViewManager.h"
#else
#import
#import "React/RCTViewManager.h"
#endif


@interface AppStateViewManager : RCTViewManager

@end

