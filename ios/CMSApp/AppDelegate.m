#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import "Orientation.h"
#import "FFMpegFrameView.h"
#import "AppStateEventEmitter.h"

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  timezoneDictionary = [NSDictionary dictionaryWithObjectsAndKeys:
                        @"Australia/Darwin", @"AUS Central Standard Time",
                        @"Asia/Kabul", @"Afghanistan Standard Time",
                        @"America/Anchorage", @"Alaskan Standard Time",
                        @"Asia/Riyadh", @"Arab Standard Time",
                        @"Asia/Baghdad", @"Arabic Standard Time",
                        @"America/Buenos_Aires", @"Argentina Standard Time",
                        @"America/Halifax", @"Atlantic Standard Time",
                        @"Asia/Baku", @"Azerbaijan Standard Time",
                        @"Atlantic/Azores",@"Azores Standard Time",
                        @"America/Bahia", @"Bahia Standard Time",
                        @"Asia/Dhaka", @"Bangladesh Standard Time",
                        @"America/Regina", @"Canada Central Standard Time",
                        @"Atlantic/Cape_Verde", @"Cape Verde Standard Time",
                        @"Asia/Yerevan", @"Caucasus Standard Time",
                        @"Australia/Adelaide", @"Cen. Australia Standard Time",
                        @"America/Guatemala", @"Central America Standard Time",
                        @"Asia/Almaty", @"Central Asia Standard Time",
                        @"America/Cuiaba", @"Central Brazilian Standard Time",
                        @"Europe/Budapest", @"Central Europe Standard Time",
                        @"Europe/Warsaw", @"Central European Standard Time",
                        @"Pacific/Guadalcanal", @"Central Pacific Standard Time",
                        @"America/Chicago", @"Central Standard Time",
                        @"America/Mexico_City", @"Central Standard Time (Mexico)",
                        @"Asia/Shanghai", @"China Standard Time",
                        @"Etc/GMT+12", @"Dateline Standard Time",
                        @"Africa/Nairobi", @"E. Africa Standard Time",
                        @"Australia/Brisbane", @"E. Australia Standard Time",
                        @"Asia/Nicosia", @"E. Europe Standard Time",
                        @"America/Sao_Paulo", @"E. South America Standard Time",
                        @"America/New_York", @"Eastern Standard Time",
                        @"Africa/Cairo", @"Egypt Standard Time",
                        @"Asia/Yekaterinburg", @"Ekaterinburg Standard Time",
                        @"Europe/Kiev", @"FLE Standard Time",
                        @"Pacific/Fiji", @"Fiji Standard Time",
                        @"Europe/London", @"GMT Standard Time",
                        @"Europe/Bucharest", @"GTB Standard Time",
                        @"Asia/Tbilisi", @"Georgian Standard Time",
                        @"America/Godthab", @"Greenland Standard Time",
                        @"Atlantic/Reykjavik", @"Greenwich Standard Time",
                        @"Pacific/Honolulu", @"Hawaiian Standard Time",
                        @"Asia/Calcutta", @"India Standard Time",
                        @"Asia/Tehran", @"Iran Standard Time",
                        @"Asia/Jerusalem", @"Israel Standard Time",
                        @"Asia/Amman", @"Jordan Standard Time",
                        @"Europe/Kaliningrad", @"Kaliningrad Standard Time",
                        @"Asia/Seoul", @"Korea Standard Time",
                        @"Indian/Mauritius", @"Mauritius Standard Time",
                        @"Asia/Beirut", @"Middle East Standard Time",
                        @"America/Montevideo", @"Montevideo Standard Time",
                        @"Africa/Casablanca", @"Morocco Standard Time",
                        @"America/Denver", @"Mountain Standard Time",
                        @"America/Chihuahua", @"Mountain Standard Time (Mexico)",
                        @"Asia/Rangoon", @"Myanmar Standard Time",
                        @"Asia/Novosibirsk", @"N. Central Asia Standard Time",
                        @"Africa/Windhoek", @"Namibia Standard Time",
                        @"Asia/Katmandu", @"Nepal Standard Time",
                        @"Pacific/Auckland", @"New Zealand Standard Time",
                        @"America/St_Johns", @"Newfoundland Standard Time",
                        @"Asia/Irkutsk", @"North Asia East Standard Time",
                        @"Asia/Krasnoyarsk", @"North Asia Standard Time",
                        @"America/Santiago", @"Pacific SA Standard Time",
                        @"America/Los_Angeles", @"Pacific Standard Time",
                        @"America/Santa_Isabel", @"Pacific Standard Time (Mexico)",
                        @"Asia/Karachi", @"Pakistan Standard Time",
                        @"America/Asuncion", @"Paraguay Standard Time",
                        @"Europe/Paris", @"Romance Standard Time",
                        @"Europe/Moscow", @"Russian Standard Time",
                        @"America/Cayenne", @"SA Eastern Standard Time",
                        @"America/Bogota", @"SA Pacific Standard Time",
                        @"America/La_Paz", @"SA Western Standard Time",
                        @"Asia/Bangkok", @"SE Asia Standard Time",
                        @"Pacific/Apia", @"Samoa Standard Time",
                        @"Asia/Singapore", @"Singapore Standard Time",
                        @"Africa/Johannesburg", @"South Africa Standard Time",
                        @"Asia/Colombo", @"Sri Lanka Standard Time",
                        @"Asia/Damascus", @"Syria Standard Time",
                        @"Asia/Taipei", @"Taipei Standard Time",
                        @"Australia/Hobart", @"Tasmania Standard Time",
                        @"Asia/Tokyo", @"Tokyo Standard Time",
                        @"Pacific/Tongatapu", @"Tonga Standard Time",
                        @"Europe/Istanbul", @"Turkey Standard Time",
                        @"America/Indianapolis", @"US Eastern Standard Time",
                        @"America/Phoenix", @"US Mountain Standard Time",
                        @"Etc/GMT", @"UTC",
                        @"Etc/GMT-12", @"UTC+12",
                        @"Etc/GMT+2", @"UTC-02",
                        @"Etc/GMT+11", @"UTC-11",
                        @"Asia/Ulaanbaatar", @"Ulaanbaatar Standard Time",
                        @"America/Caracas", @"Venezuela Standard Time",
                        @"Asia/Vladivostok", @"Vladivostok Standard Time",
                        @"Australia/Perth", @"W. Australia Standard Time",
                        @"Africa/Lagos", @"W. Central Africa Standard Time",
                        @"Europe/Berlin", @"W. Europe Standard Time",
                        @"Asia/Tashkent", @"West Asia Standard Time",
                        @"Pacific/Port_Moresby", @"West Pacific Standard Time",
                        @"Asia/Yakutsk", @"Yakutsk Standard Time", nil];

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"CMSApp"
                                            initialProperties:nil];

  if (@available(iOS 13.0, *)) {
      rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
      rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window {
  return [Orientation getOrientation];
}

- (NSString*) translateFromWindowsTimezone: (NSString*) timezoneName
{
  return [timezoneDictionary objectForKey:timezoneName];
}

@end
