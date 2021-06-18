//
//  NSDate+Utils.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 3/11/15.
//
//

#import <Foundation/Foundation.h>

@interface NSDate (Utils)
-(NSDate *) toLocalTime;
-(NSDate *) toGlobalTime;
-(NSDate *) toTimeForTimeZone:(NSTimeZone*)timezone;
-(NSDate *) toGlobalTimeFromTimeZone:(NSTimeZone*)timezone;
-(NSDate *) nextDayWithTimeZone:(NSTimeZone*)timezone;
@end
