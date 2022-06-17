//
//  NSDate+Utils.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 3/11/15.
//
//

#import "NSDate+Utils.h"

@implementation NSDate (Utils)

-(NSDate *) toLocalTime
{
    NSTimeZone *tz = [NSTimeZone localTimeZone];
    NSInteger seconds = [tz secondsFromGMTForDate: self];
    return [NSDate dateWithTimeInterval: seconds sinceDate: self];
}

-(NSDate *) toGlobalTime
{
    NSTimeZone *tz = [NSTimeZone localTimeZone];
    NSInteger seconds = -[tz secondsFromGMTForDate: self];
    return [NSDate dateWithTimeInterval: seconds sinceDate: self];
}

-(NSDate *) toTimeForTimeZone:(NSTimeZone*)timezone
{
    NSInteger seconds = [timezone secondsFromGMTForDate: self];
    return [NSDate dateWithTimeInterval: seconds sinceDate: self];
}

-(NSDate *) toGlobalTimeFromTimeZone:(NSTimeZone*)timezone
{
    NSInteger seconds = -[timezone secondsFromGMTForDate: self];
    return [NSDate dateWithTimeInterval: seconds sinceDate: self];
}

-(NSDate *) nextDayWithTimeZone:(NSTimeZone *)timezone
{
    NSCalendar* calendar = [NSCalendar currentCalendar];
    [calendar setTimeZone:timezone];
    unsigned flagUnit = NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;
    NSDateComponents* components = [calendar components:flagUnit fromDate:self];
    [components setDay:components.day + 1];
    [components setHour:0];
    [components setMinute:0];
    [components setSecond:0];
    return [calendar dateFromComponents:components];
}

@end
