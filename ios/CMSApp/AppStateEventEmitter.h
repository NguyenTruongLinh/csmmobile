//
//  AppStateEventEmitter.h
//  CMSApp
//
//  Created by i3admin on 4/17/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
//#import <React/RCTComponent.h>
#import "RCTEventEmitter.h"
#import "RCTBridgeModule.h"

//@class RCTEventDispatcher;

@interface AppStateEventEmitter : RCTEventEmitter <RCTBridgeModule> //UIView

//Property react native
@property (nonatomic, copy) NSNumber *state;
@property (nonatomic, copy) NSString *deviceToken;
//@property (nonatomic, copy) RCTDirectEventBlock onAppStateChange;

//- (instancetype)initWithEventDispatcher: (RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;
+ (void)emitEventWithName:(NSString *)name andPayload:(NSDictionary *)payload;

- (void)onChangeAppState:(NSNumber *)state;
- (void)updatedDeviceToken:(NSString *)deviceToken;

@end

