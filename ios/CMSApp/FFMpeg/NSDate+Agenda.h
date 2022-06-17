//
//  NSDate+Agenda.h
//  CMSApp
//
//  Created by I3DVR on 12/10/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface NSDate (Agenda)

- (NSDate *)firstDayOfTheMonth;

- (NSDate *)lastDayOfTheMonth;
- (NSInteger)weekDay;
- (NSInteger)dayComponents;
- (NSInteger)quartComponents;
- (NSInteger)monthComponents;

+ (NSCalendar *)gregorianCalendar;
+ (NSLocale *)locale;

+ (NSInteger)numberOfMonthFromDate:(NSDate *)fromDate toDate:(NSDate *)toDate;
+ (NSInteger)numberOfDaysInMonthForDate:(NSDate *)fromDate;

- (BOOL)isToday;


- (NSDate *)startingDate;
- (NSDate *)endingDate;
+ (NSArray *)weekdaySymbols;
+ (NSString *)monthSymbolAtIndex:(NSInteger)index;
+ (NSString *)monthShortSymbolAtIndex:(NSInteger)index;
@end

