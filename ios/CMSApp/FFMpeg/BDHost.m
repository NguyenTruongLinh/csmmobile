//
//  BDHost.m
//  CMSApp
//
//  Created by I3DVR on 11/23/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "BDHost.h"

#import "BDHost.h"
#import <CFNetwork/CFNetwork.h>
#import <netinet/in.h>
#import <netdb.h>
#import <ifaddrs.h>
#import <arpa/inet.h>
#import <net/ethernet.h>
#import <net/if_dl.h>

@implementation BDHost

+ (NSString *)addressForHostname:(NSString *)hostname {
  
  NSArray *addresses = [BDHost addressesForHostname:hostname];
  if ([addresses count] > 0)
    return [addresses objectAtIndex:0];
  else
    return nil;
}

+ (NSArray *)addressesForHostname:(NSString *)hostname {
  // Convert the hostname into a StringRef
  
  
  BOOL isASCII = YES;
  for (NSInteger i = 0; i < hostname.length; i++) {
    if (!([hostname characterAtIndex:i] >= 0 && [hostname characterAtIndex:i] <= 127)) {
      isASCII = NO;
      break;
    }
  }
  
  CFStringRef hostNameRef;
  if (isASCII) {
    hostNameRef = CFStringCreateWithCString(kCFAllocatorDefault, [hostname cStringUsingEncoding:NSASCIIStringEncoding], kCFStringEncodingASCII);
  }
  else
  {
    hostNameRef = CFStringCreateWithCString(kCFAllocatorDefault, [hostname cStringUsingEncoding:NSUTF16StringEncoding], kCFStringEncodingUTF16);
  }
  
  
  // Get the addresses for the given hostname.
  CFHostRef hostRef = CFHostCreateWithName(kCFAllocatorDefault, hostNameRef);
  CFArrayRef addressesRef = CFHostGetAddressing(hostRef, nil);
  BOOL isSuccess = CFHostStartInfoResolution(hostRef, kCFHostAddresses, nil);
  
  if (!isSuccess)
  {
    CFRelease(hostRef);
    CFRelease(hostNameRef);
    return nil;
  }
  
  
  if (addressesRef == nil)
  {
    //CFRelease(hostRef);
    CFRelease(hostRef);
    CFRelease(hostNameRef);
    return nil;
  }
  
  // Convert these addresses into strings.
  char ipAddress[INET6_ADDRSTRLEN];
  ipAddress[0] = 0;
  
  NSMutableArray *addresses = [NSMutableArray array];
  CFIndex numAddresses = CFArrayGetCount(addressesRef);
  for (CFIndex currentIndex = 0; currentIndex < numAddresses; currentIndex++) {
    struct sockaddr *address = (struct sockaddr *)CFDataGetBytePtr(CFArrayGetValueAtIndex(addressesRef, currentIndex));
    if (address == nil) return nil;
    getnameinfo(address, address->sa_len, ipAddress, INET6_ADDRSTRLEN, nil, 0, NI_NUMERICHOST);
    if (strlen(ipAddress) == 0) return nil;
    [addresses addObject:[NSString stringWithCString:ipAddress encoding:NSASCIIStringEncoding]];
  }
  
  CFRelease(hostRef);
  CFRelease(hostNameRef);
  return addresses;
}

+ (NSString *)hostnameForAddress:(NSString *)address {
  NSArray *hostnames = [BDHost hostnamesForAddress:address];
  if ([hostnames count] > 0)
    return [hostnames objectAtIndex:0];
  else
    return nil;
}

+ (NSArray *)hostnamesForAddress:(NSString *)address {
  // Get the host reference for the given address.
  struct addrinfo      hints;
  struct addrinfo      *result = NULL;
  memset(&hints, 0, sizeof(hints));
  hints.ai_flags    = AI_NUMERICHOST;
  hints.ai_family   = PF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_protocol = 0;
  int errorStatus = getaddrinfo([address cStringUsingEncoding:NSASCIIStringEncoding], NULL, &hints, &result);
  if (errorStatus != 0)
    return nil;
  CFDataRef addressRef = CFDataCreate(NULL, (UInt8 *)result->ai_addr, result->ai_addrlen);
  if (addressRef == nil)
  {
    return nil;
  }
  freeaddrinfo(result);
  CFHostRef hostRef = CFHostCreateWithAddress(kCFAllocatorDefault, addressRef);
  if (hostRef == nil)
  {
    CFRelease(addressRef);
    return nil;
  }
  
  CFRelease(addressRef);
  BOOL isSuccess = CFHostStartInfoResolution(hostRef, kCFHostNames, NULL);
  if (!isSuccess)
  {
    CFRelease(hostRef);
    return nil;
  }
  
  // Get the hostnames for the host reference.
  CFArrayRef hostnamesRef = CFHostGetNames(hostRef, NULL);
  CFRelease(hostRef);
  
  NSMutableArray *hostnames = [NSMutableArray array];
  for (int currentIndex = 0; currentIndex < [(__bridge NSArray *)hostnamesRef count]; currentIndex++) {
    [hostnames addObject:[(__bridge NSArray *)hostnamesRef objectAtIndex:currentIndex]];
  }
  
  return hostnames;
}

+ (NSArray *)ipAddresses {
  NSMutableArray *addresses = [NSMutableArray array];
  struct ifaddrs *interfaces = NULL;
  struct ifaddrs *currentAddress = NULL;
  
  int success = getifaddrs(&interfaces);
  if (success == 0) {
    currentAddress = interfaces;
    while(currentAddress != NULL) {
      if(currentAddress->ifa_addr->sa_family == AF_INET) {
        NSString *address = [NSString stringWithUTF8String:inet_ntoa(((struct sockaddr_in *)currentAddress->ifa_addr)->sin_addr)];
        if (![address isEqual:@"127.0.0.1"]) {
          NSLog(@"%@ ip: %@", [NSString stringWithUTF8String:currentAddress->ifa_name], address);
          [addresses addObject:address];
        }
      }
      currentAddress = currentAddress->ifa_next;
    }
  }
  freeifaddrs(interfaces);
  return addresses;
}

+ (NSArray *)ethernetAddresses {
  NSMutableArray *addresses = [NSMutableArray array];
  struct ifaddrs *interfaces = NULL;
  struct ifaddrs *currentAddress = NULL;
  int success = getifaddrs(&interfaces);
  if (success == 0) {
    currentAddress = interfaces;
    while(currentAddress != NULL) {
      if(currentAddress->ifa_addr->sa_family == AF_LINK) {
        NSString *address = [NSString stringWithUTF8String:ether_ntoa((const struct ether_addr *)LLADDR((struct sockaddr_dl *)currentAddress->ifa_addr))];
        
        // ether_ntoa doesn't format the ethernet address with padding.
        char paddedAddress[80];
        int a,b,c,d,e,f;
        sscanf([address UTF8String], "%x:%x:%x:%x:%x:%x", &a, &b, &c, &d, &e, &f);
        sprintf(paddedAddress, "%02X:%02X:%02X:%02X:%02X:%02X",a,b,c,d,e,f);
        address = [NSString stringWithUTF8String:paddedAddress];
        
        if (![address isEqual:@"00:00:00:00:00:00"] && ![address isEqual:@"00:00:00:00:00:FF"]) {
          NSLog(@"%@ mac: %@", [NSString stringWithUTF8String:currentAddress->ifa_name], address);
          [addresses addObject:address];
        }
      }
      currentAddress = currentAddress->ifa_next;
    }
  }
  freeifaddrs(interfaces);
  return addresses;
}

@end

