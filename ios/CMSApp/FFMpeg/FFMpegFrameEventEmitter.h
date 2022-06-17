//
//  FFMpegFrameEventEmitter.h
//  CMSApp
//
//  Created by Dong Phung on 6/30/20.
//

#ifndef FFMpegFrameEventEmitter_h
#define FFMpegFrameEventEmitter_h

#import "RCTEventEmitter.h"
#import "RCTBridgeModule.h"

@interface FFMpegFrameEventEmitter : RCTEventEmitter <RCTBridgeModule>

+ (void)emitEventWithName:(NSString *)name andPayload:(NSDictionary *)payload;

@end
#endif /* FFMpegFrameEventEmitter_h */
