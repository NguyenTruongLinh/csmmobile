//
//  UncaughtExceptionHandler.h
//  CMSApp
//
//  Created by i3admin on 4/18/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface UncaughtExceptionHandler : NSObject {
  BOOL dismissed;
}

@end

void InstallUncaughtExceptionHandler();
