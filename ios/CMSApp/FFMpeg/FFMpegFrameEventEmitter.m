//
//  FFMpegFrameEventEmitter.m
//  CMSApp
//
//  Created by i3admin on 6/30/20.
//

#import <Foundation/Foundation.h>
#import "RCTBridgeModule.h"
#import "FFMpegFrameEventEmitter.h"

@implementation FFMpegFrameEventEmitter

RCT_EXPORT_MODULE();


- (NSArray<NSString *> *)supportedEvents {
  return @[@"onFFMPegFrameChange"];
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

@end
