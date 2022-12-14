//
//  UncaughtExceptionHandler.m
//  CMSApp
//
//  Created by i3admin on 4/18/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "UncaughtExceptionHandler.h"
#include <libkern/OSAtomic.h>
#include <execinfo.h>

NSString * const UncaughtExceptionHandlerSignalExceptionName = @"UncaughtExceptionHandlerSignalExceptionName";
NSString * const UncaughtExceptionHandlerSignalKey = @"UncaughtExceptionHandlerSignalKey";
NSString * const UncaughtExceptionHandlerAddressesKey = @"UncaughtExceptionHandlerAddressesKey";

volatile int32_t UncaughtExceptionCount = 0;
const int32_t UncaughtExceptionMaximum = 10;

const NSInteger UncaughtExceptionHandlerSkipAddressCount = 4;
const NSInteger UncaughtExceptionHandlerReportAddressCount = 5;

@implementation UncaughtExceptionHandler

+ (NSArray *)backtrace
{
  void* callstack[128];
  int frames = backtrace(callstack, 128);
  char **strs = backtrace_symbols(callstack, frames);
  
  int i;
  NSMutableArray *backtrace = [NSMutableArray arrayWithCapacity:frames];
  for (
       i = UncaughtExceptionHandlerSkipAddressCount;
       i < UncaughtExceptionHandlerSkipAddressCount +
       UncaughtExceptionHandlerReportAddressCount;
       i++)
  {
    [backtrace addObject:[NSString stringWithUTF8String:strs[i]]];
  }
  free(strs);
  
  return backtrace;
}

- (void)handleException:(NSException *)exception
{
    NSLog(@"%@",[NSString stringWithFormat:NSLocalizedString(@"You can try to continue but the application may be unstable.\n\n"@"Debug details follow:\n%@\n%@", nil),
                 [exception reason],
                 [[exception userInfo] objectForKey:UncaughtExceptionHandlerAddressesKey]]);

  CFRunLoopRef runLoop = CFRunLoopGetCurrent();
  CFArrayRef allModes = CFRunLoopCopyAllModes(runLoop);
  CFRelease(allModes);
  
  NSSetUncaughtExceptionHandler(NULL);
  signal(SIGABRT, SIG_DFL);
  signal(SIGILL, SIG_DFL);
  signal(SIGKILL, SIG_DFL);
  signal(SIGSEGV, SIG_DFL);
  signal(SIGFPE, SIG_DFL);
  signal(SIGBUS, SIG_DFL);
  signal(SIGPIPE, SIG_DFL);
  
  if ([[exception name] isEqual:UncaughtExceptionHandlerSignalExceptionName])
  {
    kill(getpid(), [[[exception userInfo] objectForKey:UncaughtExceptionHandlerSignalKey] intValue]);
  }
  else
  {
    [exception raise];
  }
}

@end

void HandleException(NSException *exception)
{
  int32_t exceptionCount = OSAtomicIncrement32(&UncaughtExceptionCount);
  if (exceptionCount > UncaughtExceptionMaximum)
  {
    return;
  }
  
  NSArray *callStack = [UncaughtExceptionHandler backtrace];
  NSMutableDictionary *userInfo =
  [NSMutableDictionary dictionaryWithDictionary:[exception userInfo]];
  [userInfo
   setObject:callStack
   forKey:UncaughtExceptionHandlerAddressesKey];
  
  @autoreleasepool {
    [[[UncaughtExceptionHandler alloc] init] performSelectorOnMainThread:@selector(handleException:)
     withObject:
     [NSException
      exceptionWithName:[exception name]
      reason:[exception reason]
      userInfo:userInfo]
     waitUntilDone:YES];
  }
}

void SignalHandler(int signal)
{
  NSLog(@"11111");
  int32_t exceptionCount = OSAtomicIncrement32(&UncaughtExceptionCount);
  if (exceptionCount > UncaughtExceptionMaximum)
  {
    return;
  }
  
  NSMutableDictionary *userInfo =
  [NSMutableDictionary
   dictionaryWithObject:[NSNumber numberWithInt:signal]
   forKey:UncaughtExceptionHandlerSignalKey];
  
  NSArray *callStack = [UncaughtExceptionHandler backtrace];
  [userInfo
   setObject:callStack
   forKey:UncaughtExceptionHandlerAddressesKey];
  @autoreleasepool {
    [[[UncaughtExceptionHandler alloc] init]
     performSelectorOnMainThread:@selector(handleException:)
     withObject:
     [NSException
      exceptionWithName:UncaughtExceptionHandlerSignalExceptionName
      reason:
      [NSString stringWithFormat:
       NSLocalizedString(@"Signal %d was raised.", nil),
       signal]
      userInfo:
      [NSDictionary
       dictionaryWithObject:[NSNumber numberWithInt:signal]
       forKey:UncaughtExceptionHandlerSignalKey]]
     waitUntilDone:YES];
  }
}

void InstallUncaughtExceptionHandler()
{
  NSSetUncaughtExceptionHandler(&HandleException);
  signal(SIGABRT, SignalHandler);
  signal(SIGILL, SignalHandler);
  signal(SIGKILL, SignalHandler);
  signal(SIGSEGV, SignalHandler);
  signal(SIGFPE, SignalHandler);
  signal(SIGBUS, SignalHandler);
  signal(SIGPIPE, SignalHandler);
}

