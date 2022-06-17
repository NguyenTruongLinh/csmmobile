//
//  NSDate+Agenda.m
//  CMSApp
//
//  Created by I3DVR on 12/10/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "NSDate+Agenda.h"
#import <objc/runtime.h>

const char * const JmoCalendarStoreKey = "jmo.calendar";
const char * const JmoLocaleStoreKey = "jmo.locale";

@implementation NSDate (Agenda)

#pragma mark - Getter and Setter

+ (void)setGregorianCalendar:(NSCalendar *)gregorianCalendar
{
  objc_setAssociatedObject(self, JmoCalendarStoreKey, gregorianCalendar, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

+ (NSCalendar *)gregorianCalendar
{
  NSCalendar* cal = objc_getAssociatedObject(self, JmoCalendarStoreKey);
  if (nil == cal) {
    cal = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
    [cal setTimeZone:[NSTimeZone timeZoneWithAbbreviation:@"GMT"]];
    [cal setLocale:[self locale]];
    [self setGregorianCalendar:cal];
    
  }
  return cal;
}

+ (void)setLocal:(NSLocale *)locale
{
  objc_setAssociatedObject(self, JmoLocaleStoreKey, locale, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

+ (NSLocale *)locale
{
  NSLocale *locale  = objc_getAssociatedObject(self, JmoLocaleStoreKey);
  if (nil == locale) {
    locale = [[NSLocale alloc] initWithLocaleIdentifier:@"fr_FR"];
    [self setLocal:locale];
  }
  return locale;
}

#pragma mark -

- (NSDate *)firstDayOfTheMonth
{
  NSCalendar *gregorian = [self.class gregorianCalendar];
  NSDateComponents *comps = [gregorian components:(NSCalendarUnitDay | NSCalendarUnitMonth | NSCalendarUnitYear ) fromDate:self];
  [comps setDay:1];
  NSDate *firstDayOfMonthDate = [gregorian dateFromComponents:comps];
  return firstDayOfMonthDate;
}

- (NSDate *)lastDayOfTheMonth
{
  NSCalendar *gregorian = [self.class gregorianCalendar];
  NSDateComponents* comps = [gregorian components:NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitWeekOfYear|NSCalendarUnitWeekday fromDate:self];
  
  // set last of month
  [comps setMonth:[comps month]+1];
  [comps setDay:0];
  NSDate *lastDayOfMonthDate = [gregorian dateFromComponents:comps];
  return lastDayOfMonthDate;
}

+ (NSInteger)numberOfMonthFromDate:(NSDate *)fromDate toDate:(NSDate *)toDate
{
  NSCalendar *gregorian = [self gregorianCalendar];
  return [gregorian components:NSCalendarUnitMonth fromDate:fromDate toDate:toDate options:0].month+1;
}

+ (NSInteger)numberOfDaysInMonthForDate:(NSDate *)fromDate
{
  NSCalendar *gregorian = [self gregorianCalendar];
  NSRange range = [gregorian rangeOfUnit:NSCalendarUnitDay inUnit:NSCalendarUnitMonth forDate:fromDate];
  return range.length;
}

- (NSInteger)weekDay
{
  NSCalendar *gregorian = [self.class gregorianCalendar];
  NSDateComponents *comps = [gregorian components:NSCalendarUnitWeekday fromDate:self];
  long weekday = [comps weekday];
  return weekday ;
}

- (BOOL)isToday
{
  NSCalendar *calendar = [self.class gregorianCalendar];
  NSDateComponents *otherDay = [calendar components:NSCalendarUnitEra|NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay fromDate:self];
  NSDateComponents *today = [[NSCalendar currentCalendar] components:NSCalendarUnitEra|NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay fromDate:[NSDate date]];
  if([today day] == [otherDay day] &&
     [today month] == [otherDay month] &&
     [today year] == [otherDay year] &&
     [today era] == [otherDay era]) {
    return YES;
  }
  return NO;
}

- (NSInteger)quartComponents
{
  NSCalendar *calendar = [self.class gregorianCalendar];
  NSDateComponents *comps = [calendar components:NSCalendarUnitHour|NSCalendarUnitMinute fromDate:self];
  return comps.hour*4+(comps.minute/15);
}

- (NSInteger)dayComponents
{
  NSCalendar *calendar = [self.class gregorianCalendar];
  NSDateComponents *comps = [calendar components: NSCalendarUnitDay fromDate:self];
  return comps.day;
}


- (NSInteger)monthComponents
{
  NSCalendar *calendar = [self.class gregorianCalendar];
  NSDateComponents *comps = [calendar components: NSCalendarUnitDay fromDate:self];
  return comps.month;
}

- (NSDate *)startingDate
{
  NSDateComponents *components = [[NSDate gregorianCalendar] components:(NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond) fromDate:self];
  components.hour = 0;
  components.minute = 0;
  components.second = 0;
  return [[NSDate gregorianCalendar] dateFromComponents:components];
}

- (NSDate *)endingDate
{
  NSDateComponents *components = [[NSDate gregorianCalendar] components:(NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond) fromDate:self];
  components.hour = 23;
  components.minute = 59;
  components.second = 59;
  return [[NSDate gregorianCalendar] dateFromComponents:components];
}

+ (NSArray *)weekdaySymbols
{
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  NSMutableArray *upper = [NSMutableArray new];
  for (NSString *day in [dateFormatter shortWeekdaySymbols]) {
    [upper addObject:day.uppercaseString];
  }
  return  upper;
}

+ (NSString *)monthSymbolAtIndex:(NSInteger)index
{
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  NSArray *months = [dateFormatter monthSymbols];
  return months[index - 1];
}

+ (NSString *)monthShortSymbolAtIndex:(NSInteger)index
{
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  NSArray *months = [dateFormatter shortMonthSymbols];
  return months[index - 1];
}

@end

