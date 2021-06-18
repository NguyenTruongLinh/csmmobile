//
//  AppStateEventEmitter.m
//  CMSApp
//
//  Created by i3admin on 4/17/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "AppStateEventEmitter.h"
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
//#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import "RCTBridgeModule.h"
#import "AppDelegate.h"

@implementation AppStateEventEmitter // : UIView {
//   RCTEventDispatcher* _eventDispatcher;
//}

@synthesize state,deviceToken;

RCT_EXPORT_MODULE()

//- (instancetype)init {
//  if((self = [super init])){
//    state = [NSNumber numberWithInteger:0];
//    deviceToken = nil;
//    AppDelegate* appdelegate = (AppDelegate* )[[UIApplication sharedApplication] delegate];
//    appdelegate.appstate = self;
//  }
//
//  return self;
//}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onAppStateChange"];
}

- (void)startObserving {
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  for (NSString *notifName in [self supportedEvents]) {
    [center addObserver:self
               selector:@selector(emitEventInternal:)
                   name:notifName object:nil];
  }
}

- (void)stopObserving {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}


- (void)emitEventInternal:(NSNotification*)notif {
  [self sendEventWithName:notif.name body:notif.userInfo];
}

+ (void)emitEventWithName:(NSString *)name andPayload:(NSDictionary *)payload {
  [[NSNotificationCenter defaultCenter] postNotificationName:name
                                                      object:self userInfo:payload];
}

- (void)onChangeAppState: (NSNumber *)state{
  if(state != [self state]){
    self.state = [state copy];
    [AppStateEventEmitter emitEventWithName:@"onAppStateChange" andPayload:@{
                                                                     @"Id": [NSNumber numberWithUnsignedInteger:1],
                                                                     @"Value": [NSNumber numberWithUnsignedInteger:[state integerValue]]}];
  }
}


- (void)updatedDeviceToken:(NSString *)deviceToken{
  if(![[self deviceToken] isEqualToString:deviceToken]){
    self.deviceToken = [deviceToken copy];
    [AppStateEventEmitter emitEventWithName:@"onAppStateChange" andPayload:@{
                                                                     @"Id": [NSNumber numberWithUnsignedInteger:2],
                                                                     @"Value": [NSString stringWithFormat:@"%@", deviceToken]}];
  }
}

/*
- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher{
  if((self = [super init])){
    _eventDispatcher = eventDispatcher;
    state = [NSNumber numberWithInteger:0];
    deviceToken = nil;
    AppDelegate* appdelegate = (AppDelegate* )[[UIApplication sharedApplication] delegate];
    appdelegate.appstate = self;
  }
  
  return self;
}

- (void)onChangeAppState: (NSNumber *)state{
  if(state != [self state]){
    self.state = [state copy];
  [_eventDispatcher sendEventWithName:@"onAppStateChange" body:@{
                                                                        @"Id": [NSNumber numberWithUnsignedInteger:1],
                                                                        @"Value": [NSNumber numberWithUnsignedInteger:[state integerValue]],
                                                                        @"target": self.reactTag
                                                                      }];
}
}
  

- (void)updatedDeviceToken:(NSString *)deviceToken{
  if(![[self deviceToken] isEqualToString:deviceToken]){
    self.deviceToken = [deviceToken copy];
  [_eventDispatcher sendInputEventWithName:@"onAppStateChange" body:@{
                                                                       @"Id": [NSNumber numberWithUnsignedInteger:2],
                                                                       @"Value": [NSString stringWithFormat:deviceToken],
                                                                       @"target": self.reactTag
                                                                       }];
}
}

#pragma React View Management

- (void)removeFromSuperview {
  [super removeFromSuperview];
}
*/

@end
