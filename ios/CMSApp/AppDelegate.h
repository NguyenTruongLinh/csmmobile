#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import "FFMpegFrameView.h"
#import "AppStateEventEmitter.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, UNUserNotificationCenterDelegate>
{
  NSDictionary* timezoneDictionary;
}

@property (nonatomic, strong) UIWindow *window;
@property (weak, nonatomic) FFMpegFrameView *video;
@property (nonatomic) AppStateEventEmitter *appstate ;
@property BOOL _isSeacrh;
@property (nonatomic, retain) NSMutableArray* connectionServerList;

- (NSString*) translateFromWindowsTimezone: (NSString*) timezoneName;
@end
