//
//  ImcQueue.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 10/23/12.
//
//

#import "ImcQueue.h"

@implementation ImcQueue
@synthesize maxItem;

-(id)init:(NSInteger)_maxItem
{
    self = [super init];
    if( self )
    {
        queueItem   = [[NSMutableArray alloc] init];
        maxItem     = _maxItem;
        lockItem    = [[NSLock alloc] init];
    }
    return self;
}

- (bool) empty
{
    bool result = false;
    [lockItem lock];
    result = ( queueItem.count == 0 );
    [lockItem unlock];
    return result;
}

- (bool)full
{
    bool result = false;
    [lockItem lock];
    result = ( queueItem.count == maxItem );
    [lockItem unlock];
    return result;
}

- (bool) enqueue:(id)obj
{
    [lockItem lock];
    if( queueItem.count == maxItem )
    {
        [lockItem unlock];
        return false;
    }
    [queueItem addObject:obj];
    [lockItem unlock];
    return true;
}

- (id) dequeue
{
    [lockItem lock];
    if( queueItem.count == 0 )
    {
        [lockItem unlock];
        return nil;
    }
    id object = [queueItem objectAtIndex:0];
    if( object != nil )
        [queueItem removeObjectAtIndex:0];
    [lockItem unlock];
    return object;
}

- (void)clearQueue
{
    [lockItem lock];
    [queueItem removeAllObjects];
    [lockItem unlock];
}

- (void)removeFramesWithCondition : (BOOL (^)(id _Nonnull obj))_condition
{
    [lockItem lock];
    NSMutableIndexSet* indicesForObjectsToRemove = [[NSMutableIndexSet alloc] init];
    [queueItem enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
        if(_condition(obj))
           [indicesForObjectsToRemove addIndex:idx];
    }];
    [queueItem removeObjectsAtIndexes:indicesForObjectsToRemove];
    [lockItem unlock];
}


@end
