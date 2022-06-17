//
//  ImcQueue.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 10/23/12.
//
//

#import <Foundation/Foundation.h>

@interface ImcQueue : NSObject{
    NSInteger maxItem;
    NSLock* lockItem;
    NSMutableArray* queueItem;
}

@property (readonly) NSInteger maxItem;

- (id _Nonnull) init : (NSInteger)_maxItem;
- (id _Nullable) dequeue;
- (bool) enqueue : (id _Nullable)obj;
- (bool) empty;
- (bool) full;
- (void) clearQueue;
- (void)removeFramesWithCondition : (BOOL (^ _Nonnull)(id _Nonnull obj))_condition;
@end
