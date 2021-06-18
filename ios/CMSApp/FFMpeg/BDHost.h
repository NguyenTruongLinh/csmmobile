//
//  BDHost.h
//  CMSApp
//
//  Created by I3DVR on 11/23/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface BDHost : NSObject

+ (NSString *)addressForHostname:(NSString *)hostname;
+ (NSArray *)addressesForHostname:(NSString *)hostname;
+ (NSString *)hostnameForAddress:(NSString *)address;
+ (NSArray *)hostnamesForAddress:(NSString *)address;
+ (NSArray *)ipAddresses;
+ (NSArray *)ethernetAddresses;

@end
