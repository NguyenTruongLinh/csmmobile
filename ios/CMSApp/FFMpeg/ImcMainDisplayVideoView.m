//
//  ImcMainDisplayVideoView.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/19/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ImcMainDisplayVideoView.h"
#import "ImcDisplayChannel.h"
#import "VideoFrame.h"
#import "ImcServerSetting.h"
#import "ImcImageView.h"
#import "AppDelegate.h"
#import "FFMpegFrameView.h"

const int TIME_REFRESH_IMAGE = 20; // if there is no video in 20 seconds, screen will display logo image

@interface ImcMainDisplayVideoView(PrivateMethod)
-(NSInteger)numOfDisplayChannel;
@end

@implementation ImcMainDisplayVideoView

@synthesize currentDiv,delegate,fullscreenView,playerWidth,playerHeight,scaleXY,translateX,translateY,displayMode,scaleValue,selectedView, singleTapScreenIndex, fullscreenIndex, alarmLoop, connectedServerList, logoImage, channelConfigBuffer;

- (id)init
{
  self = [super init];
  if( self )
  {
    // draw logo
    logoImage = nil; // [UIImage imageNamed:@"Mobile_Logo1"];
    // ptzIcon = [UIImage imageNamed:@"PtzIcon"];
    
    // Initialization code
    if( [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone )
      isIphone = true;
    else
      isIphone = false;
    if( isIphone )
    {
      maxDisplayChannels = IMC_MAX_DISPLAY_CHANNELS_IPHONE;
    }
    else
    {
      maxDisplayChannels = IMC_MAX_DISPLAY_CHANNELS_IPAD;
    }
    
    ImcViewDisplay* views[maxDisplayChannels];
    CALayer* layers[maxDisplayChannels];
    for( int index = 0; index < maxDisplayChannels; index++ )
    {
      views[index] = [[ImcViewDisplay alloc] initWithScreenIndex:index];
      layers[index] = [CALayer layer];
      layers[index].anchorPoint = CGPointMake(0, 0);
      layers[index].delegate = self;
    }
    
    displayViews = [[NSArray alloc] initWithObjects:views count:maxDisplayChannels];
    displayLayers = [[NSArray alloc] initWithObjects:layers count:maxDisplayChannels];
    alarmTriggerRetain = [[NSMutableArray alloc] init];
    
    ImcScreenDisplay* screens[IMC_MAX_DISPLAY_SCREEN];
    for( int index = 0; index < IMC_MAX_DISPLAY_SCREEN; index++ )
    {
      screens[index]              = [[ImcScreenDisplay alloc] init];
      screens[index].viewIndex    = index;
      screens[index].screenIndex  = index;
      screens[index].displayImage = logoImage;
      frameRates[index] = 0;
    }
    displayScreens = [[NSArray alloc] initWithObjects:screens count:IMC_MAX_DISPLAY_SCREEN];
    
    //Default Pro Remote on mobile MIC_DIV_4
    currentDiv = IMC_DIV_1;
    fullscreenView = -1;
    scaleXY = 1.f;
    translateX = 0;
    translateY = 0;
    touchedViewIndex = -1;
    needToClearScreen = false;
    rootLayer = nil;
    isDisplayAlarmTrigger = TRUE;
    selectedView = -1;
    isRotate = FALSE;
    singleTapScreenIndex = [NSMutableArray array];
    connectedServerList = [NSMutableArray array];
    
    alarmLoop = 0;
    displayString = nil;
    screenString = nil;
    serverAddressInfo = nil;
    frameRate = nil;
    _stretch = true;
    channelConfigBuffer = [NSMutableDictionary dictionary];
    
  }
  return self;
}

- (id)initWithFrame:(CGRect)_frame withRootLayer:(CALayer *)_rootLayer
{
  self = [super init];
  if (self) {
    if( [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone )
      isIphone = true;
    else
      isIphone = false;
    if( isIphone ){
      maxDisplayChannels = IMC_MAX_DISPLAY_CHANNELS_IPHONE;
    }
    else{
      maxDisplayChannels = IMC_MAX_DISPLAY_CHANNELS_IPAD;
    }
    
    ImcViewDisplay* views[maxDisplayChannels];
    CALayer* layers[maxDisplayChannels];
    for( int index = 0; index < maxDisplayChannels; index++ )
    {
      views[index] = [[ImcViewDisplay alloc] initWithScreenIndex:index];
      layers[index] = [CALayer layer];
      layers[index].anchorPoint = CGPointMake(0, 0);
      layers[index].delegate = self;
    }
    
    displayViews = [[NSArray alloc] initWithObjects:views count:maxDisplayChannels];
    displayLayers = [[NSArray alloc] initWithObjects:layers count:maxDisplayChannels];
    
    
    ImcScreenDisplay* screens[IMC_MAX_DISPLAY_SCREEN];
    for( int index = 0; index < IMC_MAX_DISPLAY_SCREEN; index++ )
    {
      screens[index]              = [[ImcScreenDisplay alloc] init];
      screens[index].viewIndex    = index;
      screens[index].displayImage = logoImage;
    }
    displayScreens = [[NSArray alloc] initWithObjects:screens count:IMC_MAX_DISPLAY_SCREEN];
    
    currentDiv = IMC_DIV_1;
    fullscreenView = -1;
    fullscreenIndex = -1;
    touchedViewIndex = -1;
    needToClearScreen = false;
    
    frame = _frame;
    rootLayer = _rootLayer;
  }
  return self;
}

- (void) setdisplayRect:(CGRect)_frame withRootLayer:(CALayer *)_rootLayer
{
  frame = _frame;
  rootLayer = _rootLayer;
  rootLayer.masksToBounds = YES;
}

- (void) initDisplayRectwithDiv:(IMC_DIVISION_MODE)div
{
  IMC_DIVISION_MODE maxDivSupport = IMC_DIV_64;
  if( isIphone )
    maxDivSupport = IMC_DIV_16;
  if( div > maxDivSupport )
    div = maxDivSupport;
  float stepWidth = frame.size.width/div;
  float stepHeight =frame.size.height/div;
  float margin_x = frame.origin.x;
  float margin_y = frame.origin.y;
  NSInteger index = 0;
  scaleValue = 1.0;
  translationPoint = CGPointZero;
  for( int i = 0; i < div; i++ )
    for( int j = 0; j < div; j++ )
    {
      ImcViewDisplay* displayView = [displayViews objectAtIndex:index];
      ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:displayView.screenIndex];
      scaleValue = displayScreen.scaleValue;
      NSLog(@"initDisplayRectwithDiv displayScreen.scaleValue: %f", displayScreen.scaleValue);
      
      CALayer* layer = [displayLayers objectAtIndex:index];
      displayView.frame = CGRectMake(margin_x + j*stepWidth, margin_y + i*stepHeight, stepWidth, stepHeight);
      CGFloat ptzHeight = displayView.frame.size.width > displayView.frame.size.height ? displayView.frame.size.height/10 : displayView.frame.size.width/10;
      CGPoint ptzPos = CGPointMake(displayView.frame.origin.x + displayView.frame.size.width - 1.5*ptzHeight, displayView.frame.origin.y + ptzHeight/2);
      displayView.ptzIconRect = CGRectMake(ptzPos.x, ptzPos.y, ptzHeight, ptzHeight);
      
      
      displayView.needDisplay = true;
      layer.bounds = displayView.frame;
      layer.position = CGPointMake(displayView.frame.origin.x + stepWidth/2, displayView.frame.origin.y + stepHeight/2);
      layer.anchorPoint = CGPointMake(0.5, 0.5);
      //layer.transform = CATransform3DMakeScale(scaleValue, scaleValue, 1.0);
      dispatch_async(dispatch_get_main_queue(), ^{
        [layer setNeedsDisplay];
      });
      [rootLayer addSublayer:layer];
      index++;
    }
}

- (void)remoteAllLayers
{
  for(CALayer* layer in displayLayers )
  {
    NSLog(@"GOND remove all layers");
    layer.sublayers = nil;
    [layer removeFromSuperlayer];
    
    if (selectedView == [displayLayers indexOfObject:layer]) {
      ImcViewDisplay* view = [displayViews objectAtIndex:selectedView];
      ImcScreenDisplay* screen = [displayScreens objectAtIndex:view.screenIndex];
      screen.isBordered = YES;
    }
    
    [layer setNeedsDisplayInRect:layer.frame];
  }
}

-(void) updateDivision:(IMC_DIVISION_MODE)div
{
  IMC_DIVISION_MODE maxDivSupport = IMC_DIV_64;
  if( isIphone )
    maxDivSupport = IMC_DIV_16;
  
  if( div > maxDivSupport )
    return;
  
  [self resetDisplayMapping];
  currentDiv = div;
  fullscreenView = -1;
  NSLog(@"============== GOND -1 updateDivision");
  [self remoteAllLayers];
  [self initDisplayRectwithDiv:div];
  needToClearScreen = TRUE;
}
- (void) loadLogo
{
  [self initDisplayRectwithDiv:currentDiv];
}

-(void)refreshLogo:(UIImage*)newLogo
{
  logoImage = newLogo;
}

- (CGRect)callDisplayRect:(CGRect)displayArea :(CGSize)imageSize : (BOOL)cropImage
{
  CGPoint origin = displayArea.origin;
  CGSize calDisplaySize = displayArea.size;
  CGRect returnRect;
  CGFloat srcRatio = displayArea.size.width*imageSize.height;
  CGFloat dstRatio = imageSize.width*displayArea.size.height;
  if( srcRatio >= dstRatio )
  {
    if( cropImage )
    {
      calDisplaySize.height = displayArea.size.width/imageSize.width*imageSize.height;
      origin.y = displayArea.origin.y + (displayArea.size.height-calDisplaySize.height)/2;
    }
    else
    {
      calDisplaySize.width = displayArea.size.height/imageSize.height*imageSize.width;
      origin.x = displayArea.origin.x + (displayArea.size.width-calDisplaySize.width)/2;
    }
  }
  else
  {
    if( cropImage )
    {
      calDisplaySize.width = displayArea.size.height/imageSize.height*imageSize.width;
      origin.x = displayArea.origin.x + (displayArea.size.width-calDisplaySize.width)/2;
    }
    else
    {
      calDisplaySize.height = displayArea.size.width/imageSize.width*imageSize.height;
      origin.y = displayArea.origin.y + (displayArea.size.height-calDisplaySize.height)/2;
    }
  }
  returnRect = CGRectMake(origin.x, origin.y, calDisplaySize.width, calDisplaySize.height);
  return returnRect;
}

- (CGSize) getChannelViewRes
{
  float stepWidth = frame.size.width/currentDiv;
  float stepHeight =frame.size.height/currentDiv;
  return CGSizeMake(stepWidth, stepHeight);
}

-(NSArray*)getDisplayScreens
{
  return displayScreens;
}

-(void)addVideoFrame:(id)videoFrame
{
  //@autoreleasepool
  {
    //[videoLock lock];
    DisplayedVideoFrame* displayFrame = (DisplayedVideoFrame*)videoFrame;
    
    if( fullscreenView >= 0 )
    {
      ImcViewDisplay* view = [displayViews objectAtIndex:fullscreenView];
      ImcScreenDisplay* screen = [displayScreens objectAtIndex: view.screenIndex];
      
      // CMS removed
      /*
      if([view isZooming])
      {
        [videoLock unlock];
        return;
      }
      
      NSMutableArray* channelListNeedToDisplay = [NSMutableArray array];
      NSInteger sourceIndex = -1;
      
      for (ImcConnectedServer* server in connectedServerList) {
        if ([server.server_address isEqualToString:displayFrame.serverAddress]) {
          for (ChannelSetting* channel in server.channelConfigs)
          {
            
            if (sourceIndex == -1)
            {
              {
                if (channel.channelID == displayFrame.channelIndex) {
                  
                  sourceIndex = channel.videoSourceInput;
                  break;
                }
              }
            }
          }
          
          if (sourceIndex != -1) {
            for (ChannelSetting* channel in server.channelConfigs) {
              if (channel.videoSourceInput == sourceIndex) {
                [channelListNeedToDisplay addObject:@(channel.channelID)];
              }
            }
          }
          
          break;
        }
      }
       */
      // CMS removed end
      
      //int _channelListNeedToDisplay = [connectedServerList count];
      
      //NSLog(@"Shark: channelListNeedToDisplay: %@, channelIndex: %zd", [channelListNeedToDisplay componentsJoinedByString:@","], screen.channelIndex);
      
      if( [screen.serverAddress isEqualToString:displayFrame.serverAddress] &&
         screen.serverPort == displayFrame.serverPort) //&&
         //[channelListNeedToDisplay containsObject:@(screen.channelIndex)] ) // CMS removed
      {
        //NSLog(@"Shark: IN");
        
        if (displayFrame.codecId == 0 && displayFrame.resolutionHeight == -1)
        {
          
          screen.resolutionWidth = -1;
          screen.resolutionHeight = -1;
          //screen.frameRate = -1;
        }
        else
        {
          screen.resolutionWidth = displayFrame.resolutionWidth;
          screen.resolutionHeight = displayFrame.resolutionHeight;
          if (displayFrame.codecId == 0 && !screen.hasSubStream) {
            screen.needMainStream = YES;
          }
          //screen.frameRate = displayFrame.frameRate;
        }
        
        //NSLog(@"Shark: resolutionWidth: %zd, resolutionHeight: %zd", screen.resolutionWidth, screen.resolutionHeight);
        
        if (displayFrame.videoFrame && (displayFrame.videoFrame.CGImage || displayFrame.videoFrame.CIImage))
        {
          if (displayFrame.videoFrame.CGImage) {
            //@autoreleasepool
            {
              //screen.displayImage = [UIImage imageWithCGImage:displayFrame.videoFrame.CGImage];
              //screen.displayImage = nil;
              // NSLog(@"GOND Fullscreen set displayImage");
              screen.displayImage = [[UIImage alloc] initWithCGImage:displayFrame.videoFrame.CGImage];
              //screen.frameRate = -1;
              //NSLog(@"1.Add Video Frame for Channel Index:", displayFrame.channelIndex);
            }
          }
          else if (displayFrame.videoFrame.CIImage)
          {
            //@autoreleasepool
            {
              //NSLog(@"Shark screen displayImage 22222");
              //screen.displayImage = nil;
              screen.displayImage = [[UIImage alloc] initWithCIImage:displayFrame.videoFrame.CIImage];
            }
            //NSLog(@"2.Add Video Frame for Channel Index:", displayFrame.channelIndex);
          }
          
          //CGImageRelease(displayFrame.videoFrame.CGImage);
          if (screen.channelIndex == displayFrame.channelIndex) {
            screen.cameraName = displayFrame.cameraName;
          }
          //screen.resolutionWidth = displayFrame.resolutionWidth;
          //screen.resolutionHeight = displayFrame.resolutionHeight;
          //screen.frameRate = displayFrame.frameRate;
          
        
          
          CALayer* layer11 = [displayLayers objectAtIndex:fullscreenView];
          view.needDisplay = true;
          
          //NSLog(@"Shark setNeedsDisplay");
          [layer11 setNeedsDisplay];
          
        }
        //        frameRates[screen.screenIndex]++;
      }
    }
    // CMS removed
    /*
    else
    {
      NSMutableArray* channelListNeedToDisplay = [NSMutableArray array];
      NSInteger sourceIndex = -1;
      
      for (ImcConnectedServer* server in connectedServerList) {
        if ([server.server_address isEqualToString:displayFrame.serverAddress]) {
          for (ChannelSetting* channel in server.channelConfigs) {
            
            if (sourceIndex == -1) {
              {
                if (channel.channelID == displayFrame.channelIndex) {
                  sourceIndex = channel.videoSourceInput;
                  break;
                }
              }
            }
          }
          
          if (sourceIndex != -1) {
            for (ChannelSetting* channel in server.channelConfigs) {
              if (channel.videoSourceInput == sourceIndex) {
                [channelListNeedToDisplay addObject:@(channel.channelID)];
              }
            }
          }
          
          break;
        }
      }
      
      for (NSNumber* channelIndex in channelListNeedToDisplay) {
        for( int index = 0; index < IMC_MAX_DISPLAY_SCREEN; index ++ )
        {
          ImcScreenDisplay* screen = [displayScreens objectAtIndex: index];
          if( [screen.serverAddress isEqualToString:displayFrame.serverAddress] &&
             screen.serverPort == displayFrame.serverPort &&
             screen.channelIndex == channelIndex.integerValue )
          {
            
            if (displayFrame.codecId == 0 && displayFrame.resolutionHeight == -1)
            {
              
              screen.resolutionWidth = -1;
              screen.resolutionHeight = -1;
              //screen.frameRate = -1;
            }
            else
            {
              screen.resolutionWidth = displayFrame.resolutionWidth;
              screen.resolutionHeight = displayFrame.resolutionHeight;
              
            }
            //screen.frameRate = -1;
            
            
            //CGImageRelease(displayFrame.videoFrame.CGImage);
            if (displayFrame.channelIndex == screen.channelIndex) {
              screen.cameraName = displayFrame.cameraName;
            }
            
            if( screen.viewIndex >= 0 && screen.viewIndex < currentDiv*currentDiv)
            {
              //screen.displayImage = nil;
              //screen.displayImage = displayFrame.videoFrame;
              
              if (displayFrame.videoFrame) {
                if (displayFrame.videoFrame.CGImage) {
                  //@autoreleasepool
                  {
                    screen.displayImage = [[UIImage alloc] initWithCGImage:displayFrame.videoFrame.CGImage];
                    // NSLog(@"GOND Add Video Frame for Channel Index: ", displayFrame.channelIndex);
                  }
                }
                else if (displayFrame.videoFrame.CIImage)
                {
                  //@autoreleasepool
                  {
                    //screen.displayImage = nil;
                    screen.displayImage = [[UIImage alloc] initWithCIImage:displayFrame.videoFrame.CIImage];
                    screen.frameRate = -1;
                    //NSLog(@"Add Video Frame for Channel Index:", displayFrame.channelIndex);
                  }
                }
                
              }
              
              ImcViewDisplay* view = [displayViews objectAtIndex:screen.viewIndex];
              CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
              view.needDisplay = true;
              
              //Show frameRates on video
              //frameRates[screen.screenIndex]++;
              //NSLog(@"Shark setNeedsDisplay");
              [layer setNeedsDisplay];
            }
            break;
          }
        }
      }
    }
     */
    //[videoLock unlock];
  }
}
- (void)drawLayer:(CALayer *)layer inContext:(CGContextRef)ctx
{
  if (fullscreenView < 0) return; // CMS added
  //@autoreleasepool
  {
    UIGraphicsPushContext(ctx);
    //    if (logoImage != [UIImage imageNamed:@"Mobile_Logo1"]) {
    //        logoImage = [UIImage imageNamed:@"Mobile_Logo1"];
    //    }
    
    if( needToClearScreen )
    {
      // NSLog(@"GOND CGContextClearRect");
      CGContextClearRect(ctx, layer.frame);
      //needToClearScreen = FALSE;
    }
    // NSLog(@"GOND drawLayer inCtx sublayers = ", layer.sublayers.count);
    
    NSInteger index = [displayLayers indexOfObject:layer];
//    NSLog(@"GOND drawLayer fullscreenView = %d, index = %d", fullscreenView, index);
    // if( index >= 0 && index < currentDiv*currentDiv) // CMS removed
    {
      UIFont* displayFont;
	  // dongpt: CMSMobile display only 1 screen per reactnative view anyway
      // if( fullscreenView >= 0 && fullscreenView == index )
      // if( fullscreenView >= 0) // CMS removed
      {
        // NSLog(@"GOND drawRect fullscreenView = %d", fullscreenView);
        ImcViewDisplay* view = [displayViews objectAtIndex:fullscreenView];
        ImcScreenDisplay* screen = [displayScreens objectAtIndex:fullscreenIndex];
        CGFloat fontSize = 15;
        if( !isIphone )
          fontSize += 3;
        
        //CALayer* fullScreenLayer = [displayLayers objectAtIndex:fullscreenView];
        
        CGFloat layerRatio = view.frame.size.width/view.frame.size.height;
        
        
        if (isRotate)
        {
          isRotate = FALSE;
          
        }
        
        /*
        UIImage* alarmImage;
        
        if (isIphone) {
          alarmImage = [UIImage imageNamed:@"alarm_160"];
        }
        else
        {
          alarmImage = [UIImage imageNamed:@"alarm_160"];
        }
        */
        
        
        
        CGRect frameRect;
        
        if (layerRatio >= 1) {
          frameRect= CGRectMake(view.frame.origin.x + view.frame.size.width - 40, view.frame.origin.y, 40, 40);
        }
        else
        {
          frameRect = CGRectMake((view.frame.origin.x + view.frame.size.width - 40), view.frame.origin.y, 40, 40);
        }
        
        // dongpt: remove alarm
        /*
        if (screen.hasAlarmIcon) {
          
          if (layer.sublayers == nil) {
            CALayer* sublayer = [CALayer layer];
            sublayer.contents = (__bridge id)(alarmImage.CGImage);
            sublayer.frame = frameRect;
            [sublayer setDelegate:layer];
            
            [layer addSublayer:sublayer];
          }
          else
          {
            for (CALayer* subLayer in layer.sublayers) {
              
              subLayer.contents = (__bridge id)(alarmImage.CGImage);
              subLayer.frame = frameRect;
            }
          }
          //[alarmImage drawInRect:frameRect];
        }
        else
        */
        {
          if (layer.sublayers != nil) {
            for (CALayer* subLayer in layer.sublayers) {
              subLayer.contents = nil;
            }
          }
          screen.hasAlarmIcon = FALSE;
        }
        
        // dongpt: remove alarm
        /*
        if (screen.isAlarmTrigger) {
          
          CALayer* sublayer = [CALayer layer];
          layer.sublayers = nil;
          
          
          
          NSLog(@"Full screen view ID: %ld", (long)screen.viewIndex);
          
          sublayer.contents=  (__bridge id)(alarmImage.CGImage);
          
          
          screen.isAlarmTrigger = FALSE;
          screen.hasAlarmIcon = YES;
          CAKeyframeAnimation *opacityAnimation = [CAKeyframeAnimation animationWithKeyPath:@"opacity"];
          
          opacityAnimation.values = [NSArray arrayWithObjects:@1, @0,@1, @0, @1,@0,@1,@0,@1,@0,@1,@0,@0,@1,@0,@1, nil];
          opacityAnimation.duration = 2.0f;
          opacityAnimation.repeatCount = 2.0f;
          opacityAnimation.calculationMode = kCAAnimationPaced;
          
          [sublayer removeAllAnimations];
          [sublayer addAnimation:opacityAnimation forKey:@"opacity"];
          
          
          if (layerRatio >= 1) {
            sublayer.frame = CGRectMake(view.frame.origin.x + view.frame.size.width - 40, view.frame.origin.y, 40, 40);
          }
          else
          {
            sublayer.frame = CGRectMake((view.frame.origin.x + view.frame.size.width- 40), view.frame.origin.y, 40, 40);
          }
          //[sublayer drawsAsynchronously];
          [layer addSublayer:sublayer];
          [sublayer display];
        }
        */
        
        
        displayFont = [UIFont systemFontOfSize:fontSize];
        
        NSString* _displayString = nil;
        if( screen.cameraName )
          _displayString = [NSString stringWithFormat:@"%@",screen.cameraName ];
        else if( screen.channelIndex >= 0 )
          _displayString = [NSString stringWithFormat:@"Channel %zd",screen.channelIndex+1 ];
        //[[UIColor whiteColor] set];
        CGPoint displayPos = CGPointMake(view.frame.origin.x + 5, view.frame.origin.y + view.frame.size.height - fontSize - 5);
        
        if( screen.displayImage )
        {
          CALayer* sublayer = [CALayer layer];
          CGRect displayRect;
          
          if( displayMode == IMC_DISPLAY_FIT || screen.displayImage == logoImage )
          {
            CGSize imageSize = screen.displayImage.size;
            if( imageSize.width/imageSize.height > 1.8 && imageSize.width <= 720)
              imageSize.height *= 2;
            displayRect = [self callDisplayRect:view.frame :imageSize :FALSE];
          }
          else if(_stretch) // STRETCH Mode
          {
            displayRect = view.frame;
            _responseResolution = true;
          }
          else
          {
            int originalWidth = screen.resolutionWidth;
            int originalHeight = screen.resolutionHeight;
            if(originalWidth > 0 && originalHeight > 0)
            {
              double hRatio = (double)view.frame.size.height / originalHeight;
              double wRatio = (double)view.frame.size.width / originalWidth;
              if (hRatio > wRatio)
              {
                  int height = (int)(wRatio * originalHeight);
                  int top = (view.frame.size.height - height) /2;
                  displayRect = CGRectMake(0, top, view.frame.size.width, height);
              }
              else if (hRatio < wRatio)
              {
                  int width = (int)(hRatio * originalWidth);
                  int left = (view.frame.size.width - width) / 2;
                  displayRect = CGRectMake(left, 0, width, view.frame.size.height);
              }
                            
              if(_responseResolution || originalWidth != _oldOriginWidth || originalHeight != _oldOriginHeight)
              {
                  NSArray *resolution = [NSArray arrayWithObjects: [NSNumber numberWithInt:originalWidth], [NSNumber numberWithInt:originalHeight],nil];
                  [self.delegate1 responseResolution : resolution];
                  _responseResolution = false;
                  _oldOriginWidth = originalWidth;
                  _oldOriginHeight = originalHeight;
              }
            }
          }
          if (screen.displayImage.CGImage) 
          {
            // NSLog(@"GOND draw frame in fullscreen: %f x %f", displayRect.size.width, displayRect.size.height);
            // NSLog(@"GOND draw frame in rect fullscreen");
            sublayer.contents = (__bridge id)([screen getScaledImage:playerWidth:playerHeight:scaleXY:translateX:translateY].CGImage); // (screen.displayImage.CGImage);
            sublayer.frame = displayRect;
            // layer.sublayers = nil;
			// dongpt: add nil
            for (CALayer* oldsublayer in layer.sublayers) {
              oldsublayer.contents = nil;
              [oldsublayer removeFromSuperlayer];
            }
            [layer addSublayer:sublayer];
            // [sublayer display];
            // NSLog(@"GOND drawLayer added sublayers = %lu", layer.sublayers.count);
          }
		  
	      if([screen needDrawScreen])
          {
            screen.lastDisplayImage = screen.displayImage;
            screen.lastUpdateTime = [NSDate date];
          }
          else if([screen timeFromLastUpdate] > TIME_REFRESH_IMAGE)
          {
            NSLog(@"GOND drawLayer timeout display logo ----------");
            // screen.displayImage = logoImage;
            // screen.lastUpdateTime = [NSDate date];
            // [delegate handleResponseMessage:IMC_MSG_CONNECTION_NEED_RESET fromView:nil withData:nil];
          }
          /*
          CGRect displayRect;
          
          if( displayMode == IMC_DISPLAY_FIT || screen.displayImage == logoImage )
          {
            CGSize imageSize = screen.displayImage.size;
            if( imageSize.width/imageSize.height > 1.8 && imageSize.width <= 720)
              imageSize.height *= 2;
            displayRect = [self callDisplayRect:view.frame :imageSize :FALSE];
          }
          else // STRETCH Mode
            displayRect = view.frame;
          
          //@autoreleasepool
          {
            if (screen.displayImage && (screen.displayImage.CGImage || screen.displayImage.CIImage) && screen.displayImage.size.width > 0 && screen.displayImage.size.height > 0)
            {
              //@autoreleasepool
              {
                UIImage* viewImage = [screen getScaledImage];
                // UIImageView *viewImage = [[UIImageView alloc]initWithFrame:displayRect];
                if (viewImage != nil && viewImage.size.width > 0 && viewImage.size.height > 0) {
                  //NSLog(@"---Draw Layer for channel: ",screen.channelIndex);
                  [viewImage drawInRect:displayRect];
                  // [viewImage setImage:[screen getScaledImage]];
                }
                //viewImage = nil;
              }
              if([screen needDrawScreen])
              {
                screen.lastDisplayImage = screen.displayImage;
                screen.lastUpdateTime = [NSDate date];
              }
              else if([screen timeFromLastUpdate] > TIME_REFRESS_IMAGE)
              {
                screen.displayImage = logoImage;
                screen.lastUpdateTime = [NSDate date];
              }
            }
          }
        */
        }
        
        // dongpt: remove text
        /*
        if( screen.serverAddress )
        {
          if (screen.resolutionHeight != -1 && screen.resolutionWidth != -1) {
            serverAddressInfo = [NSString stringWithFormat:@"%@ %zd x %zd", screen.serverAddress, screen.resolutionWidth, screen.resolutionHeight];
            //[serverAddressInfo drawAtPoint:displayPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
          }
          else
          {
            //[screen.serverAddress drawAtPoint:displayPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
          }
          
          displayPos.y -= fontSize + 5;
        }
        
        if( screen.serverName )
        {
          //[screen.serverName drawAtPoint:displayPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
          displayPos.y -= fontSize + 5;
        }
        
        if( _displayString )
        {
          //[_displayString drawAtPoint:displayPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
          //displayString = nil;
        }
        
        NSString* _screenString = [NSString stringWithFormat:@"Screen %zd", view.screenIndex+1];
        [[UIColor whiteColor] set];
        CGPoint displayScreenPos = CGPointMake(view.frame.origin.x + 5, view.frame.origin.y + 5);
        //[_screenString drawAtPoint:displayScreenPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];

#if DEBUG
        if (screen.frameRate != -1) {
          CGPoint displayFrameRatePos = CGPointMake(view.frame.origin.x + 5, view.frame.origin.y + view.frame.size.height/3);
          //frameRate = [NSString stringWithFormat:@"", screen.frameRate];
          
          //[[UIColor redColor] set];
          
          //[[NSString stringWithFormat:@"%zd", screen.frameRate] drawAtPoint:displayFrameRatePos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor redColor]}];
          
          //[[UIColor whiteColor] set];
          
        }
        else
        {
          NSLog(@"");
        }
#endif
*/
      }
      /*
      else
      {
        ImcScreenDisplay* screen = [displayScreens objectAtIndex:0];
        NSLog(@"+++++ CANNOT RENDER FULLSCREEN VIEW = %d, cam: %@, ch: %d +++++", fullscreenView, screen.cameraName, screen.channelIndex);
      }
       */
      // For CMSMobile now only display 1 channel per reactnative view
//       else if( fullscreenView == -1 )
//       {
//         CGFloat fontSize = 12 - currentDiv;
//         if( !isIphone )
//           fontSize += 2;
        
//         CGFloat height = fontSize + 2;
//         displayFont = [UIFont systemFontOfSize:fontSize];
//         ImcViewDisplay* view = [displayViews objectAtIndex:index];
        
//         ImcScreenDisplay* screen = [displayScreens objectAtIndex:view.screenIndex];
        
//         //Update ratio for this view
        
//         CGFloat layerRatio = layer.frame.size.width/layer.frame.size.height;
        
//         CGRect frameRect;
        
//         if( [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone )
//         {
//           if (layerRatio  >= 1) {
//             frameRect = CGRectMake(layer.frame.origin.x + layer.frame.size.width * 5/6, layer.frame.origin.y, layer.frame.size.width/layerRatio/3.5, layer.frame.size.height/3.5);
//           }
//           else
//           {
//             frameRect = CGRectMake(layer.frame.origin.x + layer.frame.size.width * 2/3 * (1.6 - layerRatio), layer.frame.origin.y, layer.frame.size.width/4.5, layer.frame.size.height/4.5*layerRatio);
//           }
//         }
//         else
//         {
//           if (layerRatio  >= 1) {
//             frameRect = CGRectMake(layer.frame.origin.x + layer.frame.size.width * 5/6, layer.frame.origin.y, layer.frame.size.width/layerRatio/5, layer.frame.size.height/5);
//           }
//           else
//           {
//             frameRect = CGRectMake(layer.frame.origin.x + layer.frame.size.width * 4/5 * (1.6 - layerRatio), layer.frame.origin.y, layer.frame.size.width/5, layer.frame.size.height/5 * layerRatio);
//           }
//         }
        
//         // dongpt: remove tapscreen
//         /*
//         if (singleTapScreenIndex.count > 0) {
//           NSInteger tapScreenIndex = ((NSNumber*)[singleTapScreenIndex lastObject]).integerValue;
//           if (tapScreenIndex >= 0 && tapScreenIndex < IMC_MAX_CHANNEL) {
//             ImcScreenDisplay* lastTapScreen = [displayScreens objectAtIndex:tapScreenIndex];
//             if (lastTapScreen.viewIndex >= 0 && lastTapScreen.viewIndex < maxDisplayChannels) {
//               CALayer* lastTapScreenLayer = [displayLayers objectAtIndex:lastTapScreen.viewIndex];
              
//               for (CALayer* allLayers in displayLayers) {
//                 allLayers.borderWidth = 0.0f;
//               }
//               lastTapScreenLayer.borderColor = [UIColor redColor].CGColor;
              
//               if (currentDiv > 0 && currentDiv < IMC_DIV_25) {
//                 lastTapScreenLayer.borderWidth = (4.0f/currentDiv);
//               }
//               else if (currentDiv > 0)
//               {
//                 lastTapScreenLayer.borderWidth = (4.0f/IMC_DIV_16);
//               }
              
//               [singleTapScreenIndex removeAllObjects];
//             }
//           }
//         }
//         */
        
        
//         if (layer.sublayers != nil) {
//           for (CALayer* subLayer in layer.sublayers) {
//             subLayer.frame = frameRect;
//           }
//         }
        
//         // dongpt: remove alarm
//         /*
//         UIImage* alarmImage;
        
//         if (isIphone) {
          
//           alarmImage = [UIImage imageNamed:@"mobile_alarm_icon_80"];
//         }
//         else
//         {
//           if (currentDiv > 0 && currentDiv < IMC_DIV_16) {
//             alarmImage = [UIImage imageNamed:@"mobile_alarm_icon_80"];
//           }
//           else if (currentDiv > 0 && currentDiv < IMC_DIV_49)
//           {
//             alarmImage = [UIImage imageNamed:@"alarm_40"];
//           }
//           else if (currentDiv > 0)
//           {
//             alarmImage = [UIImage imageNamed:@"alarm_20"];
//           }
          
//         }
        
//         if (screen.isAlarmTrigger)
//         {
          
//           CAKeyframeAnimation *opacityAnimation = [CAKeyframeAnimation animationWithKeyPath:@"opacity"];
          
//           opacityAnimation.values = [NSArray arrayWithObjects:@1.0, @0.0,@1.0, @0.0, @1.0,@0.0,@1.0,@0.0,@1.0,@0.0,@1.0,@0.0,@0.0,@1.0,@0.0,@1.0, nil];
//           opacityAnimation.duration = 2.0f;
//           opacityAnimation.repeatCount = 2.0f;
//           opacityAnimation.calculationMode = kCAAnimationPaced;
          
          
//           if (layer.sublayers == nil) {
//             CALayer* sublayer = [CALayer layer];
            
//             sublayer.frame = frameRect;
//             sublayer.contents = (__bridge id)(alarmImage.CGImage);
            
//             [sublayer removeAllAnimations];
//             [sublayer addAnimation:opacityAnimation forKey:@"opacity"];
//             //[alarmImage drawInRect:frameRect];
            
//             [layer addSublayer:sublayer];
//             [layer actionForKey:@"kCATransition"];
//             //[sublayer display];
//             //[sublayer.contents drawInRect:frameRect];
            
//           }
//           else
//           {
            
//             for (CALayer* subLayer in layer.sublayers) {
              
//               //subLayer.frame = frameRect;
              
//               [subLayer removeAllAnimations];
//               [subLayer addAnimation:opacityAnimation forKey:@"opacity"];
//               [layer actionForKey:@"kCATransition"];
//               //[subLayer display];
//               //[subLayer.contents drawInRect:frameRect];
//             }
            
//           }
          
//           screen.isAlarmTrigger = FALSE;
          
//           screen.hasAlarmIcon = YES;
          
//         }
//         else if (screen.hasAlarmIcon) {
//           if (layer.sublayers == nil) {
//             CALayer* sublayer = [CALayer layer];
//             sublayer.contents = (__bridge id)(alarmImage.CGImage);
//             sublayer.frame = frameRect;
            
//             [layer addSublayer:sublayer];
//           }
//           else
//           {
//             for (CALayer* subLayer in layer.sublayers) {
              
//               subLayer.contents = (__bridge id)(alarmImage.CGImage);
//               subLayer.frame = frameRect;
//             }
//           }
//         }
//         else
//         {
//           if (layer.sublayers != nil) {
//             for (CALayer* subLayer in layer.sublayers) {
//               subLayer.contents = nil;
//             }
//           }
//           screen.hasAlarmIcon = FALSE;
//         }
//         */
        
        
        
        
//         if( screen.displayImage  )
//         {
//           CALayer* sublayer = [CALayer layer];
//           CGRect displayRect;
//           if( displayMode == IMC_DISPLAY_FIT || screen.displayImage == logoImage )
//           {
//             BOOL cropImage = (screen.displayImage == logoImage) ? FALSE : TRUE;
//             CGSize imageSize = screen.displayImage.size;
//             if( cropImage && imageSize.width/imageSize.height > 1.8 &&imageSize.width <= 720)
//               imageSize.height *= 2;
//             displayRect = [self callDisplayRect:view.frame :imageSize :cropImage];
//           }
//           else // STRETCH mode
//             displayRect = view.frame;

//           // NSLog(@"GOND draw frame in rect 1");
//           // layer.sublayers = nil;
//           if (screen.displayImage.CGImage) {
//             NSLog(@"GOND draw frame in rect 2");
//             sublayer.contents = (__bridge id)(screen.displayImage.CGImage);
//             sublayer.frame = displayRect;
//             for (CALayer* oldsublayer in layer.sublayers) {
//               oldsublayer.contents = nil;
//               [oldsublayer removeFromSuperlayer];
//             }
//             [layer addSublayer:sublayer];
//             // [sublayer display];
//           }
          
//           // if(screen.displayImage && (screen.displayImage.CGImage || screen.displayImage.CIImage) && screen.displayImage.size.height > 0 && screen.displayImage.size.width > 0 && screen.displayImage.size.width < 4096 && screen.displayImage.size.height < 4096)
//           // {
//           //   UIImage* viewImage = [screen getScaledImage];
//           //   //NSLog(@"---Draw Layer for channel: ",screen.channelIndex);
//           //   [viewImage drawInRect:displayRect];

//           //   // UIImageView *viewImage = [[UIImageView alloc]initWithFrame:displayRect];
//           //   // [viewImage setImage:[screen getScaledImage ]];
//           // }
//           if([screen needDrawScreen])
//           {
//             screen.lastDisplayImage = screen.displayImage;
//             screen.lastUpdateTime = [NSDate date];
//           }
//           else if([screen timeFromLastUpdate] > TIME_REFRESS_IMAGE)
//           {
//             screen.displayImage = logoImage;
//             screen.lastUpdateTime = [NSDate date];
//           }
//         }
        
//         // if( screen.enablePtz && screen.showPtzIcon)
//         // {
//         //   [ptzIcon drawInRect:view.ptzIconRect];
//         // }
// /*
// #if DEBUG
//         if (screen.frameRate != -1) //&& screen.resolutionHeight != 0)
//         {
//           CGPoint displayFrameRatePos = CGPointMake(view.frame.origin.x + 2, view.frame.origin.y + view.frame.size.height/2);
//           NSString* rate = [NSString stringWithFormat:@"%zd", screen.frameRate];
          
//           //frameRate = [NSString stringWithFormat:@"", screen.frameRate];
          
//           //[[UIColor redColor] set];
//           UIFont* frameRatedisplayFont = nil;
//           if ([UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPhone) {
//             frameRatedisplayFont = [UIFont systemFontOfSize:15];
//           }
//           else
//           {
//             frameRatedisplayFont = [UIFont systemFontOfSize:18];
//           }
          
//           //[rate drawAtPoint:displayFrameRatePos withAttributes:@{NSFontAttributeName:frameRatedisplayFont,NSForegroundColorAttributeName:[UIColor redColor]}];
          
//           [[UIColor whiteColor] set];
//           //[layer performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:NO];
          
//         }
// #endif
// */
//         // dongpt: remove text
//         /*
//         NSString* _screenString = [NSString stringWithFormat:@"Screen %zd", view.screenIndex+1];
//         //[[UIColor whiteColor] set];
//         CGPoint displayScreenPos = CGPointMake(view.frame.origin.x + 5, view.frame.origin.y + 5);
//         //[_screenString drawAtPoint:displayScreenPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
        
//         CGPoint displayPos = CGPointMake(view.frame.origin.x + 5, view.frame.origin.y + view.frame.size.height - height);
        
//         //if( screen.serverAddress )
//         //    [screen.serverAddress drawAtPoint:displayPos withFont:displayFont];
//         //        if( screen.serverName )
//         //          [screen.serverName drawAtPoint:displayPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
//         //        else
//         //          [screen.serverAddress drawAtPoint:displayPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
        
//         if( screen.channelIndex >= 0 )
//         {
//           NSString* _displayString = nil;
//           if( screen.cameraName )
//             _displayString = [NSString stringWithFormat:@"%@",screen.cameraName ];
//           else if( screen.channelIndex >= 0 )
//             _displayString = [NSString stringWithFormat:@"Channel %zd",screen.channelIndex+1];
//           displayPos.y -= height;
//           if( _displayString )
//           {
//             //[_displayString drawAtPoint:displayPos withAttributes:@{NSFontAttributeName:displayFont,NSForegroundColorAttributeName:[UIColor whiteColor]}];
//             //displayString = nil;
//           }
//         }
//         */
        
//         CGContextSetStrokeColorWithColor(ctx, [[UIColor blackColor] CGColor]);
//         CGContextStrokeRectWithWidth(ctx, view.frame, 0.5);
//         view.needDisplay = false;
        
//       }
      
    }
    if(needToClearScreen)
      needToClearScreen = false;
    UIGraphicsPopContext();
  }
}

- (NSInteger)viewAtPoint:(CGPoint)point
{
  for( int i = 0; i < currentDiv*currentDiv; i++ )
  {
    ImcViewDisplay* view = [displayViews objectAtIndex:i];
    if( ![view hitTest:point] )
      continue;
    if( view.screenIndex < 0 || view.screenIndex >= IMC_MAX_DISPLAY_SCREEN )
      return -1;
    
    //if( screen.channelIndex >= 0 )
    return i;
  }
  return -1;
}

- (NSInteger)screenAtPoint:(CGPoint)point
{
  NSInteger screenIndex = -1;
  for( int i = 0; i < currentDiv*currentDiv; i++ )
  {
    ImcViewDisplay* view = [displayViews objectAtIndex:i];
    if( ![view hitTest:point] )
      continue;
    if( view.screenIndex < 0 || view.screenIndex >= IMC_MAX_DISPLAY_SCREEN )
      return -1;
    
    screenIndex = view.screenIndex;
    break;
  }
  return screenIndex;
}

-(void)makeViewFullscreen : (NSInteger)viewIndex
{
  if(viewIndex < 0 || viewIndex >= maxDisplayChannels )
    return;
  ImcViewDisplay* view = [displayViews objectAtIndex:viewIndex];
  view.frame = frame;
  
  
  
  CALayer* layer = [displayLayers objectAtIndex:viewIndex];
  
  //    BOOL hasAlarm = FALSE;
  if (layer.sublayers) {
    isRotate = TRUE;
  }
  ImcScreenDisplay* screen = [displayScreens objectAtIndex:view.screenIndex];
  
  [self remoteAllLayers];
  
  layer.bounds = view.frame;
  //layer.transform = CATransform3DMakeScale(scaleValue, scaleValue, 1.0);
  layer.position = CGPointMake(frame.size.width/2, frame.size.height/2);
  layer.anchorPoint = CGPointMake(0.5, 0.5);
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [layer setNeedsDisplay];
  });
  
  [rootLayer addSublayer:layer];
  
  CGFloat ptzHeight = view.frame.size.width > view.frame.size.height ? view.frame.size.height/10 : view.frame.size.width/10;
  CGPoint ptzPos = CGPointMake(view.frame.origin.x + view.frame.size.width - 1.5*ptzHeight, view.frame.origin.y + ptzHeight/2);
  view.ptzIconRect = CGRectMake(ptzPos.x, ptzPos.y, ptzHeight, ptzHeight);
  
  fullscreenIndex = view.screenIndex;
  
  if( screen.enablePtz )
  {
    ImcCommonHeader* serverHeader = [[ImcCommonHeader alloc] init];
    serverHeader.serverAddress = screen.serverAddress;
    serverHeader.serverPort = screen.serverPort;
    serverHeader.channelID = screen.channelIndex;
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_SHOW_PTZ_PANEL fromView:nil withData:serverHeader];
    screen.showPtzIcon = NO;
  }
}

- (void)updateDisplayViewInfo:(NSArray *)displayViewInfos
{
  
}


-(void)onDoubleTap:(CGPoint)tapPoint
{
  if( fullscreenView == -1 )
  {
    fullscreenView = [self viewAtPoint:tapPoint];
    if( fullscreenView >= 0 )
    {
      ImcViewDisplay* view = [displayViews objectAtIndex:fullscreenView];
      ImcScreenDisplay* screen = [displayScreens objectAtIndex:view.screenIndex];
      
      if (screen.channelIndex != -1 && screen.isEnable) {
        screen.isBordered = FALSE;
        screen.hasAlarmIcon = NO;
        
        //layer.borderWidth = 0;
        [self makeViewFullscreen : fullscreenView];
        [delegate handleResponseMessage:IMC_MSG_DISPLAY_FULLSCREEN fromView:nil withData:nil];
        isDisplayAlarmTrigger  = FALSE;
        
        if (selectedView != -1) {
          CALayer* lastSelectedView = [displayLayers objectAtIndex:selectedView];
          lastSelectedView.borderWidth = 0;
        }
        selectedView = fullscreenView;
      }
      else
      {
        fullscreenIndex = -1;
        fullscreenView = -1;
        NSLog(@"============== GOND -1 onDoubleTap 1");
      }
    }
  }
  else
  {
    ImcViewDisplay* currentFullScreenView = [displayViews objectAtIndex:fullscreenView];
    ImcScreenDisplay* currentFullScreen = [displayScreens objectAtIndex:currentFullScreenView.screenIndex];
    
    //[self resetDisplayMapping];
    [self refreshChannelMapping];
    
    CALayer* alarmLayer = [displayLayers objectAtIndex:currentFullScreen.viewIndex];
    
    BOOL needMainStream = NO;
    
    if (!currentFullScreen.hasSubStream)
    {
      needMainStream = YES;
    }
    
    
    if (currentFullScreen.channelIndex >= 0 && currentFullScreen.channelIndex < IMC_MAX_CHANNEL) {
      NSArray* viewResolution = [NSArray arrayWithObjects:currentFullScreen.serverAddress,@(currentFullScreen.channelIndex) ,@(needMainStream), nil];
      
      [delegate handleResponseMessage:IMC_MSG_MAIN_DISPLAY_VIDEO_UPDATE_FRAME_RESOLUTION fromView:nil withData:viewResolution];
    }
    
    currentFullScreen.showPtzIcon = YES;
    fullscreenView = -1;
    fullscreenIndex = -1;
    NSLog(@"============== GOND -1 onDoubleTap 2");
    //needToClearScreen = true;
    
    [self initDisplayRectwithDiv:currentDiv];
    
    //[self resetDisplayMapping];
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:nil withData:nil];
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_HIDE_PTZ_PANEL fromView:nil withData:nil];
    
    CGPoint currentViewPoint = alarmLayer.position;
    [self onSingleTap:currentViewPoint];
    isDisplayAlarmTrigger = TRUE;
    
    [self flashingIconForAlarm];
  }
}

-(void)exitFullScreenMode
{
  if (fullscreenView != -1) {
    ImcViewDisplay* currentFullScreenView = [displayViews objectAtIndex:fullscreenView];
    ImcScreenDisplay* currentFullScreen = [displayScreens objectAtIndex:currentFullScreenView.screenIndex];
    currentFullScreen.showPtzIcon = YES;
    
    fullscreenView = -1;
    fullscreenIndex = -1;
    NSLog(@"============== GOND -1 exitFullscreenMode");
    needToClearScreen = true;
    [self initDisplayRectwithDiv:currentDiv];
    
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:nil withData:nil];
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_HIDE_PTZ_PANEL fromView:nil withData:nil];
  }
}

-(void)onSingleTap:(CGPoint)tapPoint
{
  if( fullscreenView == -1 )
  {
    NSInteger currentSelected = [self viewAtPoint:tapPoint];
    
    if (selectedView != -1) {
      CALayer* layer = [displayLayers objectAtIndex:selectedView];
      ImcViewDisplay* view = [displayViews objectAtIndex:selectedView];
      
      ImcScreenDisplay* screen = [displayScreens objectAtIndex:view.screenIndex];
      screen.isBordered = FALSE;
      
      //layer.borderWidth = 0;
      dispatch_async(dispatch_get_main_queue(), ^{
        [layer setNeedsDisplay];
      });
    }
    
    if (currentSelected >=0 && currentSelected < currentDiv*currentDiv)
    {
      selectedView = currentSelected;
      CALayer* layer = [displayLayers objectAtIndex:currentSelected];
      //            layer.borderColor = [UIColor redColor].CGColor;
      //            layer.borderWidth = (4.0f/currentDiv);
      
      
      ImcViewDisplay* view = [displayViews objectAtIndex:selectedView];
      ImcScreenDisplay* currentScreen = [displayScreens objectAtIndex:view.screenIndex];
      
      
      //            for (ImcScreenDisplay* screen in displayScreens) {
      //                if (screen.screenIndex != currentScreen.screenIndex) {
      //                    screen.isBordered = FALSE;
      //                }
      //                else
      //                {
      //                    screen.isBordered = YES;
      //                }
      //
      //            }
      
      // dongpt: remove tapscreen
      // [singleTapScreenIndex addObject:@(currentScreen.screenIndex)];
      
      
      currentScreen.hasAlarmIcon = FALSE;
      dispatch_async(dispatch_get_main_queue(), ^{
        [layer setNeedsDisplay];
      });
      //            [layer setNeedsDisplayInRect:layer.frame];
    }
  }
  else if (fullscreenView >= 0)
  {
    ImcScreenDisplay* currentScreen = [displayScreens objectAtIndex:fullscreenIndex];
    currentScreen.hasAlarmIcon = FALSE;
    currentScreen.isBordered = FALSE;
    selectedView = currentScreen.viewIndex;
    
  }
}

- (void)swipeLeft
{
  NSInteger moveStep;
  if( fullscreenView >= 0 )
  {
    moveStep = 1;
    do
    {
      NSInteger screen_idx = ((ImcViewDisplay*)[displayViews objectAtIndex:fullscreenView]).screenIndex+moveStep;
      if(screen_idx >= IMC_MAX_DISPLAY_SCREEN)
        screen_idx -= IMC_MAX_DISPLAY_SCREEN;
      ImcScreenDisplay* checked_screen = [displayScreens objectAtIndex:screen_idx];
      if(checked_screen.isEnable)
        break;
      moveStep++;
    }while (moveStep < IMC_MAX_DISPLAY_SCREEN);
  }
  else
  {
    moveStep = currentDiv*currentDiv;
    if([self numOfDisplayChannel] <= moveStep)
      return;
    NSInteger checkedIndex = currentDiv*currentDiv - 1;
    ImcViewDisplay* checkedView = [displayViews objectAtIndex:checkedIndex];
    NSInteger diff = checkedView.screenIndex + 1 + moveStep - IMC_MAX_DISPLAY_SCREEN;
    if( diff >= 0 && diff < moveStep )
      moveStep -= diff;
    
    checkedView = [displayViews objectAtIndex:0];
    
    BOOL could_swipe = NO;
    for(NSInteger idx = 0; idx < moveStep && !could_swipe; idx++)
    {
      NSInteger checked_index = checkedView.screenIndex + moveStep + idx;
      if(checked_index >= IMC_MAX_DISPLAY_SCREEN)
        continue;
      ImcScreenDisplay* checked_screen = [displayScreens objectAtIndex:checked_index];
      could_swipe = checked_screen.isEnable;
    }
    if(!could_swipe) // swipe to begin
    {
      moveStep = IMC_MAX_DISPLAY_SCREEN - checkedView.screenIndex;
    }
  }
  
  if( fullscreenView >= 0 )
  {
    selectedView = fullscreenView;
    
    NSInteger nextScreen = fullscreenIndex + moveStep;
    
    if (nextScreen >= IMC_MAX_DISPLAY_SCREEN) {
      nextScreen -= IMC_MAX_DISPLAY_SCREEN;
    }
    
    ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:nextScreen];
    if(!screenDisplay.isEnable)
      return;
    fullscreenIndex = nextScreen;
    scaleValue = screenDisplay.scaleValue;
    screenDisplay.viewIndex = fullscreenView;
    ImcViewDisplay* view = [displayViews objectAtIndex:fullscreenView];
    view.screenIndex = screenDisplay.screenIndex;
    
    if (screenDisplay.hasAlarmIcon) {
      screenDisplay.hasAlarmIcon = NO;
    }
    
    if( fullscreenIndex >= IMC_MAX_DISPLAY_SCREEN )
      fullscreenIndex -= IMC_MAX_DISPLAY_SCREEN ;
    
    //screenDisplay.displayImage = [UIImage imageNamed:@"Mobile_Logo1"];
    if( screenDisplay.enablePtz )
    {
      ImcCommonHeader* serverHeader = [[ImcCommonHeader alloc] init];
      serverHeader.serverAddress = screenDisplay.serverAddress;
      serverHeader.serverPort = screenDisplay.serverPort;
      serverHeader.channelID = screenDisplay.channelIndex;
      [delegate handleResponseMessage:IMC_MSG_DISPLAY_SHOW_PTZ_PANEL fromView:nil withData:serverHeader];
      screenDisplay.showPtzIcon = NO;
    }
    else
      [delegate handleResponseMessage:IMC_MSG_DISPLAY_HIDE_PTZ_PANEL fromView:nil withData:nil];
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_FULLSCREEN fromView:nil withData:nil];
    
    //[delegate handleResponseMessage:IMC_MSG_LIVE_VIEW_CHANGE_MAINSUB_STATUS fromView:nil withData:@(screenDisplay.hasSubStream)];
    
    CALayer* layer = [displayLayers objectAtIndex:fullscreenView];
    
    if (screenDisplay.scaleValue > 1.0f) {
      [layer setTransform:CATransform3DMakeScale(screenDisplay.scaleValue,screenDisplay.scaleValue,1.0f)];
    }
    else
    {
      [layer setTransform:CATransform3DScale(CATransform3DIdentity, 1.0, 1.0, 1.0)];
    }
    NSLog(@"GOND swiper left");
    layer.sublayers = nil;
    dispatch_async(dispatch_get_main_queue(), ^{
      [layer setNeedsDisplay];
    });
    //[layer performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:YES];
    
    
  }
  else
  {
    for( int index = 0; index < IMC_MAX_DISPLAY_SCREEN; index++ )
    {
      scaleValue = 1.0f;
      ImcScreenDisplay* screen = [displayScreens objectAtIndex:index];
      screen.viewIndex -= moveStep;
      if( screen.viewIndex < 0 )
        screen.viewIndex += IMC_MAX_DISPLAY_SCREEN;
      
      if( screen.viewIndex >= 0 && screen.viewIndex < maxDisplayChannels)
      {
        ImcViewDisplay* view = [displayViews objectAtIndex:screen.viewIndex];
        view.screenIndex = index;
        if( screen.viewIndex < currentDiv*currentDiv )
        {
          //screen.displayImage = [UIImage imageNamed:@"Mobile_Logo1"];
          CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
          dispatch_async(dispatch_get_main_queue(), ^{
            [layer setNeedsDisplay];
          });
          //[layer performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:NO];
        }
      }
    }
    
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:nil withData:nil];
    
  }
}

- (void)swipeRight
{
  NSInteger moveStep;
  if( fullscreenView >= 0 )
  {
    moveStep = 1;
    do
    {
      NSInteger screen_idx = ((ImcViewDisplay*)[displayViews objectAtIndex:fullscreenView]).screenIndex-moveStep;
      if(screen_idx < 0)
        screen_idx += IMC_MAX_DISPLAY_SCREEN;
      ImcScreenDisplay* checked_screen = [displayScreens objectAtIndex:screen_idx];
      if(checked_screen.isEnable)
        break;
      moveStep++;
    }while (moveStep < IMC_MAX_DISPLAY_SCREEN);
  }
  else
  {
    moveStep = currentDiv*currentDiv;
    if([self numOfDisplayChannel] <= moveStep)
      return;
    NSInteger checkedIndex = currentDiv*currentDiv - 1;
    ImcViewDisplay* checkedView = [displayViews objectAtIndex:checkedIndex];
    NSInteger diff = checkedView.screenIndex + 1 - moveStep;
    if( diff > 0 && diff < moveStep)
      moveStep = diff;
    checkedView = [displayViews objectAtIndex:0];
    
    BOOL could_swipe = NO;
    for(NSInteger idx = 0; idx < moveStep && !could_swipe; idx++)
    {
      NSInteger checked_index = checkedView.screenIndex - moveStep + idx;
      if(checked_index < 0)
        continue;
      ImcScreenDisplay* checked_screen = [displayScreens objectAtIndex:checked_index];
      could_swipe = checked_screen.isEnable;
    }
    
    if(!could_swipe)
    {
      moveStep = 1;
      do
      {
        NSInteger screen_idx = checkedView.screenIndex-moveStep;
        if(screen_idx < 0)
          screen_idx += IMC_MAX_DISPLAY_SCREEN;
        ImcScreenDisplay* checked_screen = [displayScreens objectAtIndex:screen_idx];
        if(checked_screen.isEnable)
          break;
        moveStep++;
      }while (moveStep < IMC_MAX_DISPLAY_SCREEN);
      moveStep += currentDiv*currentDiv-1;
    }
  }
  
  if( fullscreenView >= 0 )
  {
    selectedView = fullscreenView;
    NSInteger nextScreen = fullscreenIndex - moveStep;
    
    if(nextScreen < 0)
    {
      nextScreen += IMC_MAX_DISPLAY_SCREEN;
    }
    
    ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:nextScreen];
    if(!screenDisplay.isEnable)
      return;
    fullscreenIndex = nextScreen;
    
    if (screenDisplay.hasAlarmIcon) {
      screenDisplay.hasAlarmIcon = NO;
    }
    
    //screenDisplay.displayImage = [UIImage imageNamed:@"Mobile_Logo1"];
    scaleValue = screenDisplay.scaleValue;
    screenDisplay.viewIndex = fullscreenView;
    ImcViewDisplay* view = [displayViews objectAtIndex:fullscreenView];
    view.screenIndex = screenDisplay.screenIndex;
    
    NSLog(@"Decreasing: %zd", fullscreenIndex);
    
    if( fullscreenIndex < 0 )
      fullscreenIndex += IMC_MAX_DISPLAY_SCREEN ;
    
    if( screenDisplay.enablePtz )
    {
      ImcCommonHeader* serverHeader = [[ImcCommonHeader alloc] init];
      serverHeader.serverAddress = screenDisplay.serverAddress;
      serverHeader.serverPort = screenDisplay.serverPort;
      serverHeader.channelID = screenDisplay.channelIndex;
      [delegate handleResponseMessage:IMC_MSG_DISPLAY_SHOW_PTZ_PANEL fromView:nil withData:serverHeader];
      screenDisplay.showPtzIcon = NO;
    }
    else
      [delegate handleResponseMessage:IMC_MSG_DISPLAY_HIDE_PTZ_PANEL fromView:nil withData:nil];
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_FULLSCREEN fromView:nil withData:nil];
    
    
    CALayer* layer = [displayLayers objectAtIndex:fullscreenView];
    
    if (screenDisplay.scaleValue > 1.0f) {
      [layer setTransform:CATransform3DMakeScale(screenDisplay.scaleValue,screenDisplay.scaleValue,1.0f)];
    }
    else
    {
      [layer setTransform:CATransform3DScale(CATransform3DIdentity, 1.0, 1.0, 1.0)];
    }
    NSLog(@"GOND swipe right");
    layer.sublayers = nil;
    dispatch_async(dispatch_get_main_queue(), ^{
      [layer setNeedsDisplay];
    });
    //[layer performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:YES];
    
    //[delegate handleResponseMessage:IMC_MSG_LIVE_VIEW_CHANGE_MAINSUB_STATUS fromView:nil withData:@(screenDisplay.hasSubStream)];
  }
  else
  {
    //scaleValue = 1.0f;
    //ImcViewDisplay* first_view = [displayViews objectAtIndex:0];
    
    for( int index = 0; index < IMC_MAX_DISPLAY_SCREEN; index++ )
    {
      ImcScreenDisplay* screen = [displayScreens objectAtIndex:index];
      screen.viewIndex += moveStep;
      if( screen.viewIndex >= IMC_MAX_DISPLAY_SCREEN )
        screen.viewIndex -= IMC_MAX_DISPLAY_SCREEN;
      //screen.viewIndex = screen.viewIndex % IMC_MAX_DISPLAY_SCREEN;
      if( screen.viewIndex >= 0 && screen.viewIndex < maxDisplayChannels )
      {
        ImcViewDisplay* view = [displayViews objectAtIndex:screen.viewIndex];
        view.screenIndex = index;
        if( screen.viewIndex < currentDiv*currentDiv )
        {
          //screen.displayImage = [UIImage imageNamed:@"Mobile_Logo1"];
          CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
          dispatch_async(dispatch_get_main_queue(), ^{
            [layer setNeedsDisplay];
          });
        }
      }
    }
    
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:nil withData:nil];
  }
}

- (void)zoomPinchDisplay:(CGFloat)ratio withTranslation:(CGPoint)translatePt
{
  if( fullscreenView < 0 )
    return;

  ImcScreenDisplay* fullScreen = [displayScreens objectAtIndex:fullscreenIndex];
  scaleValue = fullScreen.scaleValue;
  if(fullScreen.scaleValue > 1)
  {
    fullScreen.scaleValue = 1;
    return;
  }
  // max zoom ratio is 4 so minimum scale would be .25
  if(fullScreen.scaleValue < 0.25)
  {
    fullScreen.scaleValue = 0.25;
    return;
  }

  CGPoint ptAfterZoom = CGPointMake(translatePt.x*ratio, translatePt.y*ratio);
  CGPoint diffPT = CGPointMake(ptAfterZoom.x-translatePt.x, ptAfterZoom.y-translatePt.y);
  CGFloat scale = 1/ratio/*1 - (scaleValue - ratio)*/;
  [fullScreen applyTransValue:diffPT];
  fullScreen.scaleValue = fullScreen.scaleValue*scale;

  CALayer* fullscreenLayer = [self fullscreenLayer];
  dispatch_async(dispatch_get_main_queue(), ^{[fullscreenLayer setNeedsDisplay];});
}

- (void)handlePan:(CGPoint)translation
{
  if( fullscreenView < 0 )
    return;
  ImcScreenDisplay* fullScreen = [displayScreens objectAtIndex:fullscreenIndex];
  if( fullScreen.scaleValue >= 1.0f )
    return;
  NSLog(@"translation: x:%f,y:%f",translation.x,translation.y);
  translation = CGPointMake(translation.x*fullScreen.scaleValue,translation.y*fullScreen.scaleValue);
  [fullScreen applyTransValue:translation];
  CALayer* layer = [displayLayers objectAtIndex:fullscreenView];
  dispatch_async(dispatch_get_main_queue(), ^{
    [layer setNeedsDisplay];
  });
}

- (uint64_t)getDisplayChannelForServer:(NSString *)serverAddress andPort:(NSInteger)serverPort
{
  uint64_t displayChannelMask = 0;
  
  if( fullscreenView >= 0 )
  {
    //ImcViewDisplay* viewDisplay = [displayViews objectAtIndex:fullscreenView];
    ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:fullscreenIndex];
    if( [screenDisplay.serverAddress isEqualToString:serverAddress]  && screenDisplay.serverPort == serverPort && screenDisplay.channelIndex >= 0 )
      displayChannelMask |= ((uint64_t)0x01<<screenDisplay.channelIndex);
  }
  else
  {
    // TODO: CMS modified, optimize only viewable channels
//    for( int index = 0; index < currentDiv*currentDiv; index++ )
    for( int index = 0; index < displayScreens.count; index++ )
    {
//      ImcViewDisplay* viewDisplay = [displayViews objectAtIndex:index];
//      ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:viewDisplay.screenIndex];
      ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:index];
      if( /*[screenDisplay.serverAddress isEqualToString:serverAddress] && screenDisplay.serverPort == serverPort &&*/ screenDisplay.channelIndex >= 0 )
        displayChannelMask |= ((uint64_t)0x01<<screenDisplay.channelIndex);
    }
  }
  return displayChannelMask;
}

- (NSInteger)fullscreenChannelForServer:(NSString *)serverAddress andPort:(NSInteger)serverPort
{
  NSInteger result = -1;
  if( fullscreenView >= 0 )
  {
    //ImcViewDisplay* viewDisplay = [displayViews objectAtIndex:fullscreenView];
    ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:fullscreenIndex];
    if( [screenDisplay.serverAddress isEqualToString:serverAddress] && screenDisplay.serverPort == serverPort && screenDisplay.channelIndex >= 0 )
    {
      result = screenDisplay.channelIndex;
    }
  }
  return result;
}

- (void)updateDisplayChannel:(ImcChannelMapping *)serverChannelMapping
{
  for( int index = 0; index < serverChannelMapping.numChannel; index++ )
  {
    NSInteger screenIndex = serverChannelMapping.channelMapping[index];
    if( screenIndex >= 0 && screenIndex < IMC_MAX_DISPLAY_SCREEN )
    {
      ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:screenIndex];
      displayScreen.serverName    = serverChannelMapping.serverName;
      displayScreen.serverAddress = serverChannelMapping.serverAddress;
      displayScreen.serverPort = serverChannelMapping.serverPort;
      displayScreen.channelIndex = index;
      displayScreen.displayImage = logoImage;
    }
  }
}

- (BOOL)fillAndUpdateDisplayChannel:(ImcChannelMapping *)serverChannelMapping
{
  BOOL filled = FALSE;
  NSInteger channelIndex = 0;
  for( int index = 0; index < displayScreens.count; index++ )
  {
    ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:index];
    //ChannelSetting* channelConfig = channelConfigs[index];
    if( displayScreen.serverAddress == nil || displayScreen.serverPort == 0 || displayScreen.channelIndex == -1 )
    {
      displayScreen.serverName    = serverChannelMapping.serverName;
      displayScreen.serverAddress = serverChannelMapping.serverAddress;
      displayScreen.serverPort = serverChannelMapping.serverPort;
      serverChannelMapping.channelMapping[channelIndex] = index;
      displayScreen.channelIndex = -1;
      displayScreen.displayImage = logoImage;
      channelIndex++;
      filled = TRUE;
      if( channelIndex >= serverChannelMapping.numChannel )
        break;
    }
  }
  [self invalidate];
  return filled;
}

- (void) makeDefaultMappingforServer:(ImcChannelMapping *)serverChannelMapping withChannelConfig:(ImcChannelConfig *)serverChannelConfig fromScreenIndex:(NSInteger)screenIndex
{
  [self removeScreenForServer:serverChannelMapping.serverAddress andPort:serverChannelMapping.serverPort];
  NSInteger channelIndex = 0;
  for( NSInteger index = screenIndex; index < displayScreens.count; index++ )
  {
    ChannelSetting* channelSetting = nil;
    while (channelIndex < serverChannelMapping.numChannel)
    {
      channelSetting = [serverChannelConfig.channelConfigs objectAtIndex:channelIndex];
      if( !channelSetting.isLiveViewable || !channelSetting.isEnable )
      {
        serverChannelMapping.channelMapping[channelIndex] = -1;
        channelIndex++;
      }
      else
        break;
    }
    
    if( channelIndex >= serverChannelMapping.numChannel )
      break;
    
    ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:index];
    displayScreen.serverName    = serverChannelMapping.serverName;
    displayScreen.serverAddress = serverChannelMapping.serverAddress;
    displayScreen.serverPort = serverChannelMapping.serverPort;
    serverChannelMapping.channelMapping[channelIndex] = index;
    displayScreen.channelIndex = channelIndex;
    if( channelSetting )
    {
      displayScreen.cameraName = channelSetting.channelName;
      displayScreen.enablePtz = channelSetting.isPtzEnable;
    }
    else
    {
      displayScreen.cameraName = nil;
      displayScreen.enablePtz = FALSE;
    }
    displayScreen.displayImage = logoImage;
    
    channelIndex++;
    
    if( channelIndex >= serverChannelMapping.numChannel )
      break;
  }
  
  for (; channelIndex < serverChannelMapping.numChannel; channelIndex++) {
    serverChannelMapping.channelMapping[channelIndex] = -1;
  }
  for (int viewIndex = 0; viewIndex < currentDiv*currentDiv; viewIndex++) {
    CALayer* layer = [displayLayers objectAtIndex:viewIndex];
    dispatch_async(dispatch_get_main_queue(), ^{
      [layer setNeedsDisplay];
    });
  }
}

- (void) updateChannelMapping:(ImcChannelMapping *)serverChannelMapping channelConfigs: (NSArray*)channelConfigs
{
  ChannelSetting* channelConfig = nil;
  for( int channelIndex = 0; channelIndex < serverChannelMapping.numChannel; channelIndex++ )
  {
    serverChannelMapping.channelMapping[channelIndex] = -1;
  }
  NSInteger screenIndex = 0;
  for( int index = 0; index < IMC_MAX_DISPLAY_SCREEN; index++ )
  {
    ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:index];
    if (channelConfigs) {
      channelConfig = channelConfigs[index];
    }
    
    if( [displayScreen.serverAddress isEqualToString:serverChannelMapping.serverAddress] && displayScreen.serverPort == serverChannelMapping.serverPort )
    {
      NSInteger channelIndex = displayScreen.channelIndex;
      if (channelConfigs == nil) {
        
        if( channelIndex < 0 || channelIndex >= MAX_CHANNEL )
          continue;
        serverChannelMapping.channelMapping[channelIndex] = -1;
      }
      else if(channelConfig.videoSourceInput != -1 && channelConfig.isLiveViewable && channelConfig.isEnable)
      {
        //if (serverChannelMapping.channelMapping[screenIndex] == -1) {
        if( channelIndex < 0 || channelIndex >= MAX_CHANNEL )
          continue;
        serverChannelMapping.channelMapping[channelIndex] = screenIndex;
        screenIndex ++;
        
        //}
      }
      else
      {
        serverChannelMapping.channelMapping[channelIndex] = -1;
      }
      
    }
  }
  [self invalidate];
}

- (void)removeScreenForServer:(NSString *)serverAddress andPort:(NSInteger)serverPort
{
  AppDelegate* appDelegate = [[UIApplication sharedApplication] delegate];
  
  ImcConnectedServer* deletedServer = nil;
  
  
  for (ImcConnectedServer* server in appDelegate.connectionServerList) {
    if ([serverAddress isEqualToString:server.server_address] && serverPort == server.server_port) {
      deletedServer = server;
    }
  }
  
  NSArray* deletedServerList = nil;
  if (deletedServer != nil) {
    deletedServerList = [NSArray arrayWithObject:deletedServer];
  }
  for(NSInteger index = displayScreens.count -1; index >= 0; index-- )
  {
    ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:index];
    if( [displayScreen.serverAddress isEqualToString:serverAddress] &&
       displayScreen.serverPort == serverPort )
    {
      
      if( fullscreenView >= 0 && displayScreen.viewIndex == fullscreenView )
      {
        if( displayScreen.enablePtz )
          [delegate handleResponseMessage:IMC_MSG_DISPLAY_HIDE_PTZ_PANEL fromView:nil withData:nil];
        
        fullscreenView = -1;
        fullscreenIndex = -1;
        NSLog(@"============== GOND -1 removeScreenForServer");
        needToClearScreen = true;
        [self initDisplayRectwithDiv:currentDiv];
        [self resetDisplayMapping];
        [delegate handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:nil withData:nil];
      }
      displayScreen.enablePtz = FALSE;
      
      
      if (deletedServerList != nil && deletedServerList.count > 0 && displayScreen.viewIndex < IMC_MAX_CHANNEL)
      {
        [self removeScreenAtIndex:displayScreen.screenIndex withServerList:deletedServerList];
        [NSThread sleepForTimeInterval:0.0001f];
      }
    }
  }
}

- (void)getDisplayScreenArray:(NSArray *)displayScreenArray
{
  NSInteger maxItem = displayScreenArray.count > displayScreens.count ? displayScreens.count : displayScreenArray.count;
  for( int index = 0; index < maxItem; index++ )
  {
    ImcDisplayScreenItem* screenItem = [displayScreenArray objectAtIndex:index];
    ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:index];
    screenItem.serverAddress    = displayScreen.serverAddress;
    screenItem.serverPort       = displayScreen.serverPort;
    screenItem.channelIndex     = displayScreen.channelIndex;
    screenItem.viewIndex        = displayScreen.viewIndex;
  }
}

- (NSMutableArray*)getAvailableScreens
{
  NSMutableArray* availableScreens = [[NSMutableArray alloc] init];
  for( int index = 0; index < displayScreens.count; index++ )
  {
    ImcScreenDisplay* displayScreen = [displayScreens objectAtIndex:index];
    if( displayScreen.serverAddress == nil || displayScreen.serverPort == 0 || displayScreen.channelIndex == -1 )
    {
      [availableScreens addObject:displayScreen];
    }
  }
  return availableScreens;
}

- (void)getDisplaySize:(CGSize *)smallDivSize :(CGSize *)largeDivSize
{
  if( rootLayer == nil )
    return;
  *largeDivSize = frame.size;
  NSInteger viewIndex;
  if( fullscreenView >= 0 && fullscreenView < maxDisplayChannels)
    viewIndex = fullscreenView;
  else
    viewIndex = 0;
  ImcViewDisplay* displayView = [displayViews objectAtIndex:viewIndex];
  *smallDivSize = CGSizeMake(displayView.frame.size.width*1.5,displayView.frame.size.height*1.5);
}

- (void)setFrame:(CGRect)_frame
{
  frame = _frame;
  if( fullscreenView >= 0  && fullscreenIndex < IMC_MAX_CHANNEL && fullscreenIndex >= 0)
  {
    ImcScreenDisplay* fullScreen = [displayScreens objectAtIndex:fullscreenIndex];
    if (fullScreen.viewIndex >=0 && fullScreen.viewIndex < maxDisplayChannels) {
      fullscreenView = fullScreen.viewIndex;
    }
    else
    {
      fullscreenView = 0;
    }
    
    [self makeViewFullscreen:fullscreenView];
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_FULLSCREEN fromView:nil withData:nil];
  }
  else
  {
    [self initDisplayRectwithDiv:currentDiv];
    [delegate handleResponseMessage:IMC_MSG_DISPLAY_UPDATE_LAYOUT fromView:nil withData:nil];
  }
}

- (void)resetDisplayMapping
{
  for( int index = 0; index < IMC_MAX_DISPLAY_SCREEN; index++ )
  {
    ImcScreenDisplay* screen = [displayScreens objectAtIndex:index];
    screen.viewIndex = index;
    
    if( screen.viewIndex >= 0 && screen.viewIndex < maxDisplayChannels )
    {
      ImcViewDisplay* view = [displayViews objectAtIndex:screen.viewIndex];
      view.screenIndex = index;
    }
  }
}

- (void)refreshChannelMapping
{
  ImcViewDisplay* currentFullScreenView = [displayViews objectAtIndex:fullscreenView];
  if (currentFullScreenView.screenIndex >= 0 && currentFullScreenView.screenIndex < IMC_MAX_CHANNEL) {
    NSInteger viewIndex = currentFullScreenView.screenIndex%(currentDiv*currentDiv);
    
    NSInteger screenIndexMapToFirstView = currentFullScreenView.screenIndex - viewIndex;
    
    if (screenIndexMapToFirstView >= 0 && screenIndexMapToFirstView < IMC_MAX_CHANNEL) {
      for (NSInteger i = screenIndexMapToFirstView; i < displayScreens.count; i++) {
        ImcScreenDisplay* screen = [displayScreens objectAtIndex:i];
        
        screen.viewIndex = (i - screenIndexMapToFirstView);
        
        if (screen.viewIndex >= 0 && screen.viewIndex < displayViews.count) {
          ImcViewDisplay* view = [displayViews objectAtIndex:screen.viewIndex];
          view.screenIndex = screen.screenIndex;
        }
      }
      
      
      if (screenIndexMapToFirstView > 0) {
        for (NSInteger j = screenIndexMapToFirstView - 1; j >= 0; j--) {
          ImcScreenDisplay* screen = [displayScreens objectAtIndex:j];
          screen.viewIndex = (IMC_MAX_CHANNEL - 1 - (screenIndexMapToFirstView - 1 - j));
        }
      }
    }
  }
  
}

- (void)updateScreenWithChannelConfig:(ImcChannelConfig *)guiChannelConfig server:(ImcConnectedServer*)server favoriteChannel:(NSArray*)favoriteChannels
{
  if (server.channelConfigs == nil
      ||((ChannelSetting*)[server.channelConfigs objectAtIndex:0]).channelID == -1)
  {
    
    ChannelSetting* channelNeedsToAdd = nil;
    for (ChannelSetting* channelConfig in guiChannelConfig.channelConfigs) {
      
      channelNeedsToAdd = nil;
      if (favoriteChannels.count > 0) {
        
        for (ImcFavoriteChannel* channel in favoriteChannels) {
          if ([server.server_address isEqualToString:channel.serverAddress] && server.server_port == channel.serverPort && channelConfig.channelID == channel.channelID) {
            
            channelNeedsToAdd = channelConfig;
            break;
          }
        }
      }
      
      
      if (channelConfig.isLiveViewable && channelConfig.isEnable && channelConfig.videoSourceInput != -1) {
        for( ImcScreenDisplay* screen in displayScreens )
        {
          NSInteger viewIndex = screen.viewIndex;
          
          if (screen.channelIndex == -1)
          {
            if (channelNeedsToAdd != nil && favoriteChannels != nil) {
              screen.enablePtz = channelNeedsToAdd.isPtzEnable;
              screen.cameraName = channelNeedsToAdd.channelName;
              screen.serverAddress = guiChannelConfig.serverAddress;
              screen.serverPort = guiChannelConfig.serverPort;
              screen.channelIndex = channelNeedsToAdd.channelID;
              screen.serverName = server.serverName;
              screen.isEnable = channelConfig.isEnable;
              
              if( viewIndex >= 0 && viewIndex < currentDiv*currentDiv )
              {
                CALayer* layer = [displayLayers objectAtIndex:viewIndex];
                dispatch_async(dispatch_get_main_queue(), ^{
                  [layer setNeedsDisplay];
                });
              }
              //[server.currentAvailableChannel addObject:@(screen.channelIndex)];
              break;
            }
            else if (favoriteChannels == nil)
            {
              screen.enablePtz = channelConfig.isPtzEnable;
              screen.cameraName = channelConfig.channelName;
              screen.serverAddress = guiChannelConfig.serverAddress;
              screen.serverPort = guiChannelConfig.serverPort;
              screen.channelIndex = channelConfig.channelID;
              screen.serverName = server.serverName;
              screen.isEnable = channelConfig.isEnable;
              
              
              if( viewIndex >= 0 && viewIndex < currentDiv*currentDiv )
              {
                CALayer* layer = [displayLayers objectAtIndex:viewIndex];
                dispatch_async(dispatch_get_main_queue(), ^{
                  [layer setNeedsDisplay];
                });
              }
              //[server.currentAvailableChannel addObject:@(screen.channelIndex)];
              break;
            }
          }
          
        }
      }
      else if (!channelConfig.isLiveViewable || !channelConfig.isEnable)
      {
        for( ImcScreenDisplay* screen in displayScreens )
        {
          if ([screen.serverName isEqualToString:server.server_address] && screen.serverPort == server.server_port && channelConfig.channelID == screen.channelIndex) {
            
            //                        screen.displayImage = logoImage;
            
            [self removeScreenAtIndex:screen.screenIndex withServerList:[NSArray arrayWithObject:server]];
            
            break;
          }
        }
      }
    }
    
    for (ImcScreenDisplay* screen in displayScreens) {
      if (screen.channelIndex == -1) {
        [self resetScreen:screen.screenIndex];
      }
    }
    
  }
  else
  {
    
    NSMutableArray* newAvailableChannel = [[NSMutableArray alloc] init];
    
    //ChannelSetting* channelNeedsToAdd = [[ChannelSetting alloc] init];
    
    for (ChannelSetting* channelConfig in guiChannelConfig.channelConfigs) {
      if (channelConfig.videoSourceInput != -1 && channelConfig.isLiveViewable && channelConfig.isEnable) {
        [newAvailableChannel addObject:@(channelConfig.channelID)];
      }
      else if (!channelConfig.isLiveViewable || !channelConfig.isEnable)
      {
        for (ImcScreenDisplay* screen in displayScreens) {
          if ([screen.serverAddress isEqualToString:server.server_address] && screen.serverPort == server.server_port && channelConfig.channelID == screen.channelIndex) {
            //                        screen.displayImage = logoImage;
            //                        if (screen.viewIndex < maxDisplayChannels) {
            //                            CALayer* screenLayer = [displayLayers objectAtIndex:screen.viewIndex];
            //                            [screenLayer setNeedsDisplay];
            //                        }
            //                        [newAvailableChannel addObject:@(channelConfig.channelID)];
            
            [self removeScreenAtIndex:screen.screenIndex withServerList:[NSArray arrayWithObject:server]];
            [NSThread sleepForTimeInterval:0.00000000000001];
            break;
          }
        }
      }
    }
    
    
    
    NSMutableArray* additiveChannel = [[NSMutableArray alloc] init];
    
    for (NSNumber *channelID in newAvailableChannel) {
      if (![server.currentAvailableChannel containsObject:channelID]) {
        [additiveChannel addObject:channelID];
      }
    }
    
    
    NSMutableArray* deletedChannel = [[NSMutableArray alloc] init];
    if (![server.currentAvailableChannel isEqualToArray:newAvailableChannel]) {
      for (NSNumber *channelID in server.currentAvailableChannel) {
        if (![newAvailableChannel containsObject:channelID]) {
          [deletedChannel addObject:channelID];
        }
      }
    }
    
    if (deletedChannel.count > 0) {
      
      for (NSNumber* channelID in deletedChannel) {
        for (ImcScreenDisplay* screen in displayScreens) {
          if (screen.channelIndex == channelID.integerValue) {
            NSArray* serverList = [NSArray arrayWithObject:server];
            [self removeScreenAtIndex:screen.screenIndex withServerList:serverList];
            break;
          }
        }
      }
    }
    
    //Update channel config for Favorite Channels
    if (favoriteChannels.count > 0)
    {
      ChannelSetting* channelNeedToAdd = nil;
      for (ChannelSetting* channelSetting in guiChannelConfig.channelConfigs) {
        
        channelNeedToAdd = nil;
        
        for (ImcFavoriteChannel* channel in favoriteChannels) {
          
          if ([guiChannelConfig.serverAddress isEqualToString:channel.serverAddress] && guiChannelConfig.serverPort == channel.serverPort && channelSetting.channelID == channel.channelID) {
            channelNeedToAdd = channelSetting;
            break;
          }
        }
        
        if (channelNeedToAdd != nil) {
          
          for (ImcScreenDisplay* screen in displayScreens) {
            if (screen.channelIndex == -1) {
              
              screen.enablePtz = channelNeedToAdd.isPtzEnable;
              screen.cameraName = channelNeedToAdd.channelName;
              screen.serverAddress = guiChannelConfig.serverAddress;
              screen.serverPort = guiChannelConfig.serverPort;
              screen.channelIndex = channelNeedToAdd.channelID;
              screen.serverName = server.serverName;
              screen.isEnable = channelNeedToAdd.isEnable;
              break;
            }
          }
        }
        
        
      }
    }
    
    for (ImcScreenDisplay* screen in displayScreens)
    {
      if( [screen.serverAddress isEqualToString:guiChannelConfig.serverAddress] &&
         screen.serverPort == guiChannelConfig.serverPort )
      {
        if (screen.channelIndex >= 0) {
          ChannelSetting* channelConfig = [guiChannelConfig.channelConfigs objectAtIndex:screen.channelIndex];
          
          //Update for channels has video data
          screen.enablePtz = channelConfig.isPtzEnable;
          screen.cameraName = channelConfig.channelName;
          screen.isEnable = channelConfig.isEnable;
        }
        else
        {
          //Reset channel has no video
          screen.serverName       = nil;
          screen.serverAddress    = nil;
          screen.serverPort       = -1;
          screen.channelIndex     = -1;
          screen.displayImage     = logoImage;
          screen.enablePtz        = FALSE;
          screen.cameraName       = nil;
          screen.isEnable         = FALSE;
          
        }
        NSInteger viewIndex = screen.viewIndex;
        if( viewIndex >= 0 && viewIndex < currentDiv*currentDiv )
        {
          CALayer* layer = [displayLayers objectAtIndex:viewIndex];
          dispatch_async(dispatch_get_main_queue(), ^{
            [layer setNeedsDisplay];
          });
        }
        
      }
    }
  }
  
  
  //Push channel configs to buffer if needed
  if (!favoriteChannels && (server.channelConfigs || ((ChannelSetting*)[server.channelConfigs objectAtIndex:0]).channelID == -1))
  {
    ImcScreenDisplay* lastScreen = [displayScreens lastObject];
    if (lastScreen.channelIndex != -1)
    {
      if ([lastScreen.serverAddress isEqualToString:guiChannelConfig.serverAddress])
      {
        NSInteger lastIndex = -1;
        for (ChannelSetting* channel in guiChannelConfig.channelConfigs)
        {
          //Find last channel config
          if (channel.channelID == lastScreen.channelIndex) {
            lastIndex = channel.channelID;
          }
          
          //Add channel config to buffer
          if (channel.channelID > lastIndex && lastIndex != -1) {
            if (channel.videoSourceInput != -1 && channel.isLiveViewable && channel.isEnable)
            {
              NSString* key = [NSString stringWithFormat:@"%@-%zd",guiChannelConfig.serverAddress, channel.channelID];
              [channelConfigBuffer setObject:channel forKey:key];
            }
          }
        }
      }
      else
      {
        //64 screens have video data, add new channel config
        for (ChannelSetting* channel in guiChannelConfig.channelConfigs) {
          if (channel.videoSourceInput != -1 && channel.isLiveViewable && channel.isEnable)
          {
            NSString* key = [NSString stringWithFormat:@"%@-%zd",guiChannelConfig.serverAddress, channel.channelID];
            [channelConfigBuffer setObject:channel forKey:key];
          }
        }
      }
    }
  }
}

-(void)updateScreenWithChannelConfig:(ImcChannelConfig *)guiChannelConfig server:(ImcConnectedServer *)server
{
  if (guiChannelConfig && guiChannelConfig.channelConfigs.count > 0)
  {
    
    NSMutableArray* deleteKeys = [NSMutableArray array];
    
    for (ChannelSetting* channelConfig in guiChannelConfig.channelConfigs)
    {
      for (ImcScreenDisplay* screen in displayScreens)
      {
        if (screen.channelIndex == -1)
        {
          [self resetScreen:screen.screenIndex];
          
          screen.enablePtz = channelConfig.isPtzEnable;
          screen.cameraName = channelConfig.channelName;
          screen.serverAddress = guiChannelConfig.serverAddress;
          screen.serverPort = guiChannelConfig.serverPort;
          screen.channelIndex = channelConfig.channelID;
          screen.serverName = server.serverName;
          screen.isEnable = channelConfig.isEnable;
          
          if (screen.viewIndex >= 0 && screen.viewIndex < currentDiv*currentDiv)
          {
            CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
            dispatch_async(dispatch_get_main_queue(), ^{
              [layer setNeedsDisplay];
            });
            //[layer performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:NO];
          }
          
          NSString* deleteKey = [NSString stringWithFormat:@"%@-%zd", screen.serverAddress, screen.channelIndex];
          [deleteKeys addObject:deleteKey];
          
          break;
        }
      }
    }
    
    if (deleteKeys.count > 0) {
      [channelConfigBuffer removeObjectsForKeys:deleteKeys];
    }
  }
}

-(ImcScreenDisplay*)screenItem:(NSInteger)screenIndex
{
  if( screenIndex < 0 || screenIndex >= IMC_MAX_DISPLAY_SCREEN )
    return nil;
  ImcScreenDisplay* item = [displayScreens objectAtIndex:screenIndex];
  return item;
}

-(void)swapScreens:(NSInteger)screenIndex1 :(NSInteger)screenIndex2
{
  ImcScreenDisplay* screen1 = [displayScreens objectAtIndex:screenIndex1];
  ImcScreenDisplay* screen2 = [displayScreens objectAtIndex:screenIndex2];
  
  NSString* tmpAddress        = screen1.serverAddress;
  NSInteger tmpPort           = screen1.serverPort;
  BOOL      tmpEnablePtz      = screen1.enablePtz;
  NSInteger tmpChannelIndex   = screen1.channelIndex;
  UIImage*  tmpImage          = screen1.displayImage;
  NSString* tmpCameraName     = screen1.cameraName;
  NSString* tmpServerName     = screen1.serverName;
  BOOL    isEnable            = screen1.isEnable;
  
  screen1.serverName      = screen2.serverName;
  screen1.serverAddress   = screen2.serverAddress;
  screen1.serverPort      = screen2.serverPort;
  screen1.enablePtz       = screen2.enablePtz;
  screen1.channelIndex    = screen2.channelIndex;
  screen1.displayImage    = screen2.displayImage;
  screen1.cameraName      = screen2.cameraName;
  screen1.isEnable        = screen2.isEnable;
  
  screen2.serverName      = tmpServerName;
  screen2.serverAddress   = tmpAddress;
  screen2.serverPort      = tmpPort;
  screen2.enablePtz       = tmpEnablePtz;
  screen2.channelIndex    = tmpChannelIndex;
  screen2.displayImage    = tmpImage;
  screen2.cameraName      = tmpCameraName;
  screen2.isEnable        = isEnable;
  
  if( screen1.viewIndex >= 0 && screen1.viewIndex < currentDiv*currentDiv )
  {
    CALayer* layer1 = [displayLayers objectAtIndex:screen1.viewIndex];
    [layer1 setNeedsDisplay];
  }
  
  if( screen2.viewIndex >= 0 && screen2.viewIndex < currentDiv*currentDiv )
  {
    
    CALayer* layer2 = [displayLayers objectAtIndex:screen2.viewIndex];
    CALayer* layer1 = [displayLayers objectAtIndex:screen1.viewIndex];
    CALayer* layerTemp = [CALayer layer];
    if (layer1) {
      layerTemp.sublayers = layer1.sublayers;
      layer1.sublayers = layer2.sublayers;
      layer2.sublayers = layerTemp.sublayers;
      [layer1 setNeedsDisplay];
    }
    [layer2 setNeedsDisplay];
  }
}

- (void)resetScreen:(NSInteger)screenIndex
{
  /*if (logoImage != [UIImage imageNamed:@"Mobile_Logo1"]) {
   logoImage = [UIImage imageNamed:@"Mobile_Logo1"];
   }*/
  
  ImcScreenDisplay* screen = [displayScreens objectAtIndex:screenIndex];
  screen.serverName       = nil;
  screen.serverAddress    = nil;
  screen.serverPort       = -1;
  screen.channelIndex     = -1;
  //screen.viewIndex        = screenIndex;
  screen.screenIndex      = screenIndex;
  screen.displayImage     = logoImage;
  screen.enablePtz        = FALSE;
  screen.isEnable         = FALSE;
  screen.hasAlarmIcon     = NO;
  screen.isSubStream = YES;
  screen.needMainStream = NO;
  screen.hasSubStream = NO;
}

-(ImcCommonHeader*)headerForFullscreenChannel
{
  if( fullscreenView < 0 || fullscreenIndex < 0)
    return nil;
  //ImcViewDisplay* viewDisplay = [displayViews objectAtIndex:fullscreenView];
  ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:fullscreenIndex];
  ImcCommonHeader* header = [[ImcCommonHeader alloc] init];
  header.serverAddress = screenDisplay.serverAddress;
  header.serverPort = screenDisplay.serverPort;
  header.channelID = screenDisplay.channelIndex;
  
  return header;
}

- (NSInteger)screenIndexofServer:(NSString *)serverAddress withPort:(NSInteger)serverPort andChannel:(NSInteger)channelID
{
  NSInteger screenIndex = -1;
  for( int index = 0; index < displayScreens.count; index++ )
  {
    ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:index];
    if( [screenDisplay.serverAddress isEqualToString:serverAddress] &&
       screenDisplay.serverPort == serverPort &&
       screenDisplay.channelIndex == channelID )
    {
      screenIndex = index;
      break;
    }
  }
  return screenIndex;
}

-(CGRect)ptzIconFrame
{
  if( fullscreenView < 0 )
    return CGRectZero;
  ImcViewDisplay* displayView = [displayViews objectAtIndex:fullscreenView];
  ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:displayView.screenIndex];
  if(screenDisplay.enablePtz)
    return displayView.ptzIconRect;
  return CGRectZero;
}

-(void)showPtzIcon
{
  if( fullscreenView >= 0 )
  {
    ImcViewDisplay* displayView = [displayViews objectAtIndex:fullscreenView];
    ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:displayView.screenIndex];
    screenDisplay.showPtzIcon = YES;
  }
}

- (void)invalidate
{
  if( fullscreenView >= 0 )
  {
    CALayer* layer = [displayLayers objectAtIndex:fullscreenView];
    dispatch_async(dispatch_get_main_queue(), ^{
      [layer setNeedsDisplay];
    });
    return;
  }
  
  for( int i = 0; i < currentDiv*currentDiv; i++ )
  {
    CALayer* layer = [displayLayers objectAtIndex:i];
    dispatch_async(dispatch_get_main_queue(), ^{
      [layer setNeedsDisplay];
    });
  }
}

- (void)clearScreen
{
  needToClearScreen = true;
}

- (UIImage*)getFullscreenImage
{
  if( fullscreenView < 0 || fullscreenIndex < 0)
    return nil;
  ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:fullscreenIndex];
  if( screenDisplay.displayImage == logoImage )
    return nil;
  return screenDisplay.displayImage;
}

-(void)alarmPlayASound:(NSInteger) alarmType
{
  
}

-(void)onRotation:(UIInterfaceOrientation)toInterfaceOrientation
{
  switch (toInterfaceOrientation) {
    case UIInterfaceOrientationLandscapeLeft:
    case UIInterfaceOrientationLandscapeRight:
    {
      //isRotate = TRUE;
    }
      break;
      
    case UIInterfaceOrientationPortrait:
    {
      //isRotate = TRUE;
    }
      break;
      
    case UIInterfaceOrientationPortraitUpsideDown:
    {
      
    }
      break;
      
    default:
      break;
  }
  //selectedView = -1;
}


-(NSInteger)alarmFlashingView:(ImcAlarmEventList*)alarmList isRetainedView:(BOOL)isRetainedView
{
  //Config view border color and width
  
  
  
  for( int index = 0; index < currentDiv*currentDiv; index++ )
  {
    ImcViewDisplay* viewDisplay = [displayViews objectAtIndex:index];
    ImcScreenDisplay* screenDisplay = [displayScreens objectAtIndex:viewDisplay.screenIndex];
    
    if (fullscreenView != -1 && ((ImcAlarmEventData*)alarmList.listAlarmEvents[0]).channelID == screenDisplay.channelIndex && [alarmList.serverAddress isEqualToString:screenDisplay.serverAddress] && alarmList.serverPort == screenDisplay.serverPort && screenDisplay.viewIndex < (currentDiv*currentDiv))
    {
      NSLog(@"Channel Index: %zd",screenDisplay.channelIndex);
      NSLog(@"View Index: %zd",screenDisplay.viewIndex);
      
      BOOL isNeedReturn = FALSE;
      
      for (ImcAlarmEventList* alarmTrigger in alarmTriggerRetain)
      {
        if (((ImcAlarmEventData*) alarmTrigger.listAlarmEvents[0]).channelID == screenDisplay.channelIndex)
        {
          isNeedReturn = TRUE;
          break;
        }
      }
      
      if (!isNeedReturn) {
        ((ImcAlarmEventData*)alarmList.listAlarmEvents[0]).index = index;
        [alarmTriggerRetain addObject:alarmList];
      }
      
      return screenDisplay.viewIndex;
    }
    
    else if(((ImcAlarmEventData*)alarmList.listAlarmEvents[0]).channelID == screenDisplay.channelIndex && screenDisplay.viewIndex < (currentDiv*currentDiv) && [alarmList.serverAddress isEqualToString:screenDisplay.serverAddress] && alarmList.serverPort == screenDisplay.serverPort)
    {
      NSLog(@"Channel Index: %zd",screenDisplay.channelIndex);
      NSLog(@"View Index: %zd",screenDisplay.viewIndex);
      
      
      //layerDelegate = [[layerDelegate alloc] init];
      
      CALayer* layer = [displayLayers objectAtIndex:screenDisplay.viewIndex];
      //alarmTriggerMapping[screenDisplay.viewIndex] = TRUE;
      //alarmTriggerMappingCount[screenDisplay.viewIndex] = 5;
      
      //liveViewController.mainView;
      // NSLog(@"GOND alarm flashing");
      layer.sublayers = nil;
      
      CALayer* sublayer = [[CALayer alloc] init];
      
      CGRect alarmRect = CGRectMake(layer.frame.origin.x, layer.frame.origin.y, layer.frame.size.width/2, layer.frame.size.height/3.4);
      
      sublayer.bounds = alarmRect;
      //sublayer.borderWidth = 7.0f;
      //sublayer.borderColor = [UIColor redColor].CGColor;
      
      //sublayer.contents = (id)[UIImage imageNamed:@"volume"];
      
      
      if (!isRetainedView) {
        ((ImcAlarmEventData*)alarmList.listAlarmEvents[0]).index = index;
        [alarmTriggerRetain addObject:alarmList];
      }
      
      CAKeyframeAnimation *opacityAnimation = [CAKeyframeAnimation animationWithKeyPath:@"opacity"];
      
      opacityAnimation.values = [NSArray arrayWithObjects:@1.0, @0.0,@1.0, @0.0, @1.0,@0.0,@1.0,@0.0,@1.0,@0.0,@1.0,@0.0,@0.0,@1.0,@0.0,@1.0, nil];
      opacityAnimation.duration = 2.0f;
      opacityAnimation.repeatCount = 2.0f;
      opacityAnimation.calculationMode = kCAAnimationPaced;
      
      //[CATransaction begin];
      //[sublayer addAnimation:opacityAnimation forKey:@"opacity"];
      [layer addSublayer:sublayer];
      
      //AppDelegate* appDelegate = [[UIApplication sharedApplication] delegate];
      
      [layer setDelegate:self];
      [sublayer setDelegate:layer];
      
      id layerContent = layer.contents;
      id subLayerContent = sublayer.contents;
      
      
      layer.contents= nil;
      
      sublayer.contents= nil;
      layer.contents= layerContent;
      sublayer.contents = subLayerContent;
      
      //[CATransaction commit];
      //[sublayer display];
      
      sublayer.opacity = 1.0f;
      
      dispatch_async(dispatch_get_main_queue(), ^{
        [layer setNeedsDisplay];
        [sublayer setNeedsDisplay];
      });
      
      
      if (isRetainedView) {
        return -1;
      }
      else
      {
        return screenDisplay.viewIndex;
      }
      
    }
  }
  return -1;
}

-(void)removeScreenAtIndex:(NSInteger)screenIndex withServerList:(NSArray*)serverList
{
  [videoLock lock];
  
  if (screenIndex >= 0 && screenIndex < IMC_MAX_CHANNEL) {
    ImcScreenDisplay* removedScreen = [displayScreens objectAtIndex:screenIndex];
    NSInteger channelID = removedScreen.channelIndex;
    
    NSMutableArray* tempDisplayScreen = [[NSMutableArray alloc] initWithArray:displayScreens];
    
    for (ImcConnectedServer* server in serverList) {
      if ([server.server_address isEqualToString:removedScreen.serverAddress] && server.server_port == removedScreen.serverPort)
      {
        
        if ([server.currentAvailableChannel containsObject:@(channelID)]) {
          [server.currentAvailableChannel removeObject:@(channelID)];
        }
        
        ImcScreenDisplay* lastScreen = [[ImcScreenDisplay alloc] init];
        if (removedScreen.screenIndex == IMC_MAX_CHANNEL - 1) {
          lastScreen.viewIndex    =  removedScreen.viewIndex;
          lastScreen.screenIndex  =  IMC_MAX_CHANNEL -1;
          lastScreen.displayImage = logoImage;
          lastScreen.channelIndex = -1;
          lastScreen.serverAddress = @"";
          lastScreen.serverName = @"";
          lastScreen.serverPort = -1;
          lastScreen.hasAlarmIcon = NO;
          lastScreen.hasSubStream = NO;
        }
        for (NSInteger i = removedScreen.screenIndex + 1; i < IMC_MAX_CHANNEL; i++)
        {
          
          
          ImcScreenDisplay* shiftedScreen = [tempDisplayScreen objectAtIndex:i];
          if (shiftedScreen.screenIndex == IMC_MAX_CHANNEL -1) {
            
            lastScreen.viewIndex    =  shiftedScreen.viewIndex;
            lastScreen.screenIndex  =  IMC_MAX_CHANNEL -1;
            lastScreen.displayImage = logoImage;
            lastScreen.channelIndex = -1;
            
          }
          if (fullscreenView == shiftedScreen.viewIndex) {
            fullscreenView--;
          }
          if (fullscreenIndex == shiftedScreen.screenIndex) {
            fullscreenIndex--;
          }
          shiftedScreen.screenIndex--;
          shiftedScreen.viewIndex--;
          
          if (shiftedScreen.viewIndex >= 0 && shiftedScreen.viewIndex < maxDisplayChannels - 1) {
            CALayer* nextLayer = [displayLayers objectAtIndex:shiftedScreen.viewIndex + 1];
            
            CALayer* layer = [displayLayers objectAtIndex:shiftedScreen.viewIndex];
            layer.sublayers = nextLayer.sublayers;
            // NSLog(@"GOND remove screen at idx %ld", screenIndex);
            nextLayer.sublayers = nil;
            dispatch_async(dispatch_get_main_queue(),^{
              [layer setNeedsDisplay];
              [nextLayer setNeedsDisplay];
            });
          }
        }
        
        [tempDisplayScreen removeObject:removedScreen];
        
        [tempDisplayScreen addObject:lastScreen];
        displayScreens = tempDisplayScreen;
        break;
      }
    }
  }
  [videoLock unlock];
}

-(void)updateChannelBufferWithDisconnectedServer:(NSString*)serverAddress
{
  NSString* searchTextForDeletedServer = [NSString stringWithFormat:@"%@-",serverAddress];
  NSPredicate* predicateForDeletedServer = [NSPredicate predicateWithFormat:@"SELF CONTAINS[cd] %@", searchTextForDeletedServer];
  NSArray *deletedKey = [[channelConfigBuffer allKeys] filteredArrayUsingPredicate:predicateForDeletedServer];
  [channelConfigBuffer removeObjectsForKeys:deletedKey];
  
  for (ImcConnectedServer* server in connectedServerList)
  {
    ImcChannelConfig* channelConfig = [[ImcChannelConfig alloc] init];
    channelConfig.serverAddress = server.server_address;
    channelConfig.serverPort = server.server_port;
    
    NSString* searchText = [NSString stringWithFormat:@"%@-",server.server_address];
    NSPredicate* predicate = [NSPredicate predicateWithFormat:@"SELF CONTAINS[cd] %@", searchText];
    
    NSArray *filteredKeys = [[channelConfigBuffer allKeys] filteredArrayUsingPredicate:predicate];
    
    filteredKeys = [filteredKeys sortedArrayUsingComparator:^NSComparisonResult(id obj1, id obj2)
                    {
                      NSString* name1 = (NSString*)obj1;
                      NSString* name2 = (NSString*)obj2;
                      
                      NSInteger newKey1 = [[name1 stringByReplacingOccurrencesOfString:[NSString stringWithFormat:@"%@-",server.server_address] withString:@""] integerValue];
                      NSInteger newKey2 = [[name2 stringByReplacingOccurrencesOfString:[NSString stringWithFormat:@"%@-",server.server_address] withString:@""] integerValue];
                      
                      if (newKey1 < newKey2)
                      {
                        return (NSComparisonResult)NSOrderedAscending;
                      }
                      else
                      {
                        return (NSComparisonResult)NSOrderedDescending;
                      }
                    }];
    
    NSMutableArray* channelList = [NSMutableArray array];
    
    if (filteredKeys && filteredKeys.count > 0)
    {
      for (NSString* key in filteredKeys)
      {
        ChannelSetting* channel = [channelConfigBuffer objectForKey:key];
        [channelList addObject:channel];
      }
    }
    
    channelConfig.channelConfigs = [NSArray arrayWithArray:channelList];
    [self updateScreenWithChannelConfig:channelConfig server:server];
  }
}

-(int)insertScreenAtScreenIndex:(NSInteger)screenIndex1 forChannelIndex:(NSInteger)channelIndex withServerList:(NSArray *)serverList andChannelMapping:(ImcConnectedServer *)connectedserver
{
  if (screenIndex1 >=0 && screenIndex1 < IMC_MAX_CHANNEL && channelIndex >= 0 && channelIndex < IMC_MAX_CHANNEL)
  {
    ImcScreenDisplay* sourceScreen = [displayScreens objectAtIndex:screenIndex1];
    
    //ImcViewDisplay* sourceView = [displayViews objectAtIndex:sourceScreen.viewIndex];
    
    BOOL hasAvailableChannel = NO;
    
    for (ImcScreenDisplay* screen in displayScreens) {
      if (screen.channelIndex == -1) {
        hasAvailableChannel = YES;
        break;
      }
    }
    
    if (hasAvailableChannel)
    {
      for (ImcConnectedServer* server in serverList) {
        if ([server.server_address isEqualToString:sourceScreen.serverAddress] && server.server_port == sourceScreen.serverPort)
        {
          
          if (![server.currentAvailableChannel containsObject:@(channelIndex)]) {
            [server.currentAvailableChannel addObject:@(channelIndex)];
          }
          
          if (![server.currentAvailableChannel containsObject:@(sourceScreen.channelIndex)]) {
            [server.currentAvailableChannel addObject:@(sourceScreen.channelIndex)];
          }
          break;
        }
      }
      
      
      ImcScreenDisplay* shiftedScreen = [[ImcScreenDisplay alloc] init];
      CALayer* shiftScreenLayer = [CALayer layer];
      
      shiftedScreen.serverAddress = sourceScreen.serverAddress;
      shiftedScreen.serverName = sourceScreen.serverName;
      shiftedScreen.serverPort = sourceScreen.serverPort;
      shiftedScreen.channelIndex = sourceScreen.channelIndex;
      shiftedScreen.displayImage = sourceScreen.displayImage;
      shiftedScreen.cameraName = sourceScreen.cameraName;
      shiftedScreen.enablePtz = sourceScreen.enablePtz;
      shiftedScreen.screenIndex = sourceScreen.screenIndex;
      shiftedScreen.viewIndex = sourceScreen.viewIndex;
      shiftedScreen.hasAlarmIcon = sourceScreen.hasAlarmIcon;
      shiftedScreen.isEnable     = sourceScreen.isEnable;
      shiftedScreen.hasSubStream = sourceScreen.hasSubStream;
      
      if (sourceScreen.viewIndex >=0 && sourceScreen.viewIndex < maxDisplayChannels) {
        CALayer* sourceScreenLayer = [displayLayers objectAtIndex:sourceScreen.viewIndex];
        // NSLog(@"GOND insertscreen at index 1");
        shiftScreenLayer.sublayers = sourceScreenLayer.sublayers;
      }
      
      
      
      
      [self resetScreen:screenIndex1];
      ChannelSetting* channelSetting = [connectedserver.channelConfigs objectAtIndex: channelIndex];
      sourceScreen.serverName    = connectedserver.serverName;
      sourceScreen.serverAddress = connectedserver.server_address;
      sourceScreen.serverPort = connectedserver.server_port;
      sourceScreen.cameraName = channelSetting.channelName;
      sourceScreen.enablePtz = channelSetting.isPtzEnable;
      sourceScreen.channelIndex = channelIndex;
      sourceScreen.isEnable     = channelSetting.isEnable;
      sourceScreen.hasAlarmIcon = NO;
      sourceScreen.hasSubStream = NO;
      
      
      NSArray* tempDisplayScreen = [[NSArray alloc] initWithArray:displayScreens];
      if (sourceScreen.screenIndex == IMC_MAX_CHANNEL - 1) {
        if (sourceScreen.channelIndex == -1) {
          return 1;
        }
        else
        {
          return 0;
        }
      }
      
      
      for (NSInteger index = sourceScreen.screenIndex + 1; index < IMC_MAX_CHANNEL; index++) {
        
        ImcScreenDisplay* screen = [tempDisplayScreen objectAtIndex:index];
        CALayer* layer = [CALayer layer];
        
        if (screen.viewIndex >= 0 && screen.viewIndex < maxDisplayChannels) {
          layer = [displayLayers objectAtIndex:screen.viewIndex];
        }
        
        ImcScreenDisplay* tmpScreen = [[ImcScreenDisplay alloc] init];
        CALayer* tmpLayer = [CALayer layer];
        
        tmpScreen.serverAddress = screen.serverAddress;
        tmpScreen.serverName = screen.serverName;
        tmpScreen.serverPort = screen.serverPort;
        tmpScreen.channelIndex = screen.channelIndex;
        tmpScreen.displayImage = screen.displayImage;
        tmpScreen.cameraName = screen.cameraName;
        tmpScreen.enablePtz = screen.enablePtz;
        tmpScreen.screenIndex = screen.screenIndex;
        tmpScreen.viewIndex = screen.viewIndex;
        tmpScreen.hasAlarmIcon = screen.hasAlarmIcon;
        tmpScreen.isEnable = screen.isEnable;
        tmpLayer.sublayers = layer.sublayers;
        tmpScreen.hasSubStream = screen.hasSubStream;
        
        screen.serverAddress = shiftedScreen.serverAddress;
        screen.serverName = shiftedScreen.serverName;
        screen.serverPort = shiftedScreen.serverPort;
        screen.channelIndex = shiftedScreen.channelIndex;
        screen.displayImage = shiftedScreen.displayImage;
        screen.cameraName = shiftedScreen.cameraName;
        screen.enablePtz = shiftedScreen.enablePtz;
        screen.hasAlarmIcon = shiftedScreen.hasAlarmIcon;
        screen.isEnable = shiftedScreen.isEnable;
        screen.hasSubStream = shiftedScreen.hasSubStream;
        
        // NSLog(@"GOND insertscreen at index 2");
        layer.sublayers = shiftScreenLayer.sublayers;
        
        if (screen.screenIndex != IMC_MAX_CHANNEL - 1) {
          shiftedScreen.serverAddress = tmpScreen.serverAddress;
          shiftedScreen.serverName = tmpScreen.serverName;
          shiftedScreen.serverPort = tmpScreen.serverPort;
          shiftedScreen.channelIndex = tmpScreen.channelIndex;
          shiftedScreen.displayImage = tmpScreen.displayImage;
          shiftedScreen.cameraName = tmpScreen.cameraName;
          shiftedScreen.enablePtz = tmpScreen.enablePtz;
          shiftedScreen.screenIndex = tmpScreen.screenIndex;
          shiftedScreen.viewIndex = tmpScreen.viewIndex;
          shiftedScreen.hasAlarmIcon = tmpScreen.hasAlarmIcon;
          shiftedScreen.isEnable = tmpScreen.isEnable;
          shiftScreenLayer.sublayers = tmpLayer.sublayers;
          shiftedScreen.hasSubStream = tmpScreen.hasSubStream;
        }
        
        if (screen.viewIndex >= 0 && screen.viewIndex < maxDisplayChannels) {
          CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
          dispatch_async(dispatch_get_main_queue(),^{
            [layer setNeedsDisplay];
          });
        }
        
      }
      displayScreens = tempDisplayScreen;
      return 1;
    }
  }
  else
  {
    return -1;
  }
  return 0;
}

-(uint64_t) getSnapShotForChannel:(NSArray*)channelID inServer:(NSString *)serverAddress port:(NSInteger)serverPort
{
  uint64_t displayChannelMask = 0;
  
  for (ChannelSetting* channel in channelID) {
    if (channel.channelID >= 0 && channel.channelID < IMC_MAX_CHANNEL) {
      displayChannelMask |= ((uint64_t)0x01<<channel.channelID);
    }
  }
  return displayChannelMask;
}

-(NSInteger)addAlarmTrigger:(ImcAlarmEventList*)alarmList
{
  ImcAlarmEventData* alarmEven = [alarmList.listAlarmEvents objectAtIndex:0];
  
  if ((alarmEven.channelID >= 0 && alarmEven.channelID < IMC_MAX_CHANNEL) || alarmEven.type == ALARM_EVENT_STOP_RECORDING || alarmEven.type == ALARM_EVENT_SENSOR_TRIGGERED) {
    [alarmTriggerRetain addObject:alarmList];
  }
  
  return fullscreenView;
}

-(NSInteger)flashingIconForAlarm
{
  NSInteger result = -1;
  NSMutableArray* needToDeleteChannel = [[NSMutableArray alloc] init];
  for (ImcAlarmEventList* alarmList in alarmTriggerRetain) {
    ImcAlarmEventData* alarmEven = [alarmList.listAlarmEvents objectAtIndex:0];
    
    if (alarmEven.type == ALARM_EVENT_STOP_RECORDING) {
      return -2;
    }
    
    else
    {
      for (ImcScreenDisplay* screen in displayScreens) {
        if (alarmEven.type == ALARM_EVENT_SENSOR_TRIGGERED ||
            alarmEven.type == ALARM_EVENT_VIDEO_LOST_ALL ) {
          for (NSNumber* channelID in alarmEven.sensorTriggerChannelID) {
            if ([screen.serverAddress isEqualToString:alarmList.serverAddress] && screen.serverPort == alarmList.serverPort && screen.channelIndex == (NSInteger)channelID.integerValue) {
              screen.isAlarmTrigger = YES;
              screen.hasAlarmIcon = FALSE;
              //                            if (screen.displayImage == [UIImage imageNamed:@"Mobile_Logo1"]) {
              //                                screen.displayImage = [UIImage imageNamed:@"Mobile_Logo"];
              //                            }
              NSLog(@"Screen index: %zd Channel ID: %zd", screen.screenIndex, channelID.integerValue);
              [needToDeleteChannel addObject:alarmList];
              if (screen.viewIndex >= 0 && screen.viewIndex < maxDisplayChannels) {
                CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
                layer.contents = nil;
                dispatch_async(dispatch_get_main_queue(),^{
                  [layer setNeedsDisplay];
                });
                //[self setFrame:frame];
                
                //                                if (screen.displayImage == [UIImage imageNamed:@"Mobile_Logo"]) {
                //                                    screen.displayImage = [UIImage imageNamed:@"Mobile_Logo1"];
                //                                    [layer setNeedsDisplay];
                //                                }
              }
              
              if (fullscreenView != -1) {
                if (screen.viewIndex != fullscreenView) {
                  result = 1;
                }
                else
                {
                  result = 1;
                }
              }
              else
              {
                result = 1;
              }
            }
          }
        }
        else if ([screen.serverAddress isEqualToString:alarmList.serverAddress] && screen.serverPort == alarmList.serverPort && screen.channelIndex == alarmEven.channelID) {
          
          //                    if (screen.viewIndex >= 0 && screen.viewIndex < maxDisplayChannels) {
          
          if (alarmEven.type == ALARM_EVENT_VIDEO_LOST) {
            screen.displayImage = logoImage;
          }
          
          if (!screen.isAlarmTrigger) {
            screen.isAlarmTrigger = YES;
            screen.hasAlarmIcon = FALSE;
            [needToDeleteChannel addObject:alarmList];
            
            //[delegate handleResponseMessage:IMC_MSG_LIVE_VIEW_REFRESH_SCREEN fromView:nil withData:@(alarmEven.type)];
            if (screen.viewIndex < displayLayers.count) {
              CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
              
              [layer performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:FALSE];
            }
            
            if (fullscreenView != -1) {
              if (screen.viewIndex != fullscreenView) {
                result = 1;
              }
              else
              {
                result = 1;
              }
            }
            else
            {
              result = 1;
            }
            
          }
          else if (alarmEven.fullScreenChannelIndex != -1 && alarmEven.isEnableFullScreen)
          {
            if (alarmEven.fullScreenChannelIndex == screen.channelIndex && screen.viewIndex == fullscreenView) {
              screen.isAlarmTrigger = YES;
              screen.hasAlarmIcon = NO;
            }
            else
            {
              screen.isAlarmTrigger = NO;
              screen.hasAlarmIcon = YES;
            }
            
            [needToDeleteChannel addObject:alarmList];
            result = 1;
          }
          break;
          //                    }
          //                    else
          //                    {
          //                        if (!screen.hasAlarmIcon) {
          //                            screen.hasAlarmIcon = YES;
          //                            [needToDeleteChannel addObject:alarmList];
          //                            result = -1;
          //                        }
          //                        break;
          //                    }
        }
      }
      
      //            if (alarmEven.type == ALARM_EVENT_VIDEO_LOST) {
      //                for (CALayer* layer in displayLayers) {
      //                    [layer setNeedsDisplay];
      //                }
      //            }
    }
  }
  
  if (needToDeleteChannel.count > 0) {
    [alarmTriggerRetain removeObjectsInArray:needToDeleteChannel];
  }
  if (alarmTriggerRetain.count > 0) {
    [alarmTriggerRetain removeAllObjects];
  }
  return result;
}

-(NSArray*)getDisplayLayer
{
  return displayLayers;
}

-(NSArray*)getDisplayView
{
  return displayViews;
}

-(void)setScreenDisplay:(NSArray*)screenDisplay
{
  for (ImcScreenDisplay* screen in displayScreens) {
    for (ImcScreenDisplay* resumeScreen in screenDisplay) {
      if (resumeScreen.screenIndex == screen.screenIndex) {
        screen.serverName = resumeScreen.serverName;
        screen.serverAddress = resumeScreen.serverAddress;
        screen.serverPort = resumeScreen.serverPort;
        screen.channelIndex = resumeScreen.channelIndex;
        screen.viewIndex = resumeScreen.viewIndex;
        
        screen.cameraName = resumeScreen.cameraName;
        
        screen.enablePtz = resumeScreen.enablePtz;
        screen.isEnable = resumeScreen.isEnable;
        screen.hasAlarmIcon = resumeScreen.hasAlarmIcon;
        
        if (resumeScreen.channelIndex == -1) {
          screen.displayImage = logoImage;
        }
        
        //screen.displayImage = [UIImage imageNamed:@"Mobile_Logo1"];
        break;
      }
    }
    
    if (screen.viewIndex < currentDiv*currentDiv) {
      CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
      dispatch_async(dispatch_get_main_queue(),^{
        [layer setNeedsDisplay];
      });
    }
    
  }
}

-(void)updateFrameRate
{
#if DEBUG
  for (NSInteger i = 0; i < IMC_MAX_DISPLAY_SCREEN; i++) {
    ImcScreenDisplay* screen = [displayScreens objectAtIndex:i];
    if (screen.channelIndex >= 0 && screen.channelIndex < IMC_MAX_CHANNEL) {
      screen.frameRate = frameRates[i];
      frameRates[i] = 0;
      
      if (screen.viewIndex >= 0 && screen.viewIndex < currentDiv*currentDiv)
      {
        CALayer* layer = [displayLayers objectAtIndex:screen.viewIndex];
        dispatch_async(dispatch_get_main_queue(),^{
          [layer setNeedsDisplay];
        });
        //[layer performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:NO];
      }
    }
  }
#endif
}

-(void)startUpdateFrameRateTimer
{
  
  if (!updateFrameRateTimer.isValid) {
    updateFrameRateTimer = [NSTimer scheduledTimerWithTimeInterval:1
                                                            target:self
                                                          selector:@selector(updateFrameRate)
                                                          userInfo:nil
                                                           repeats:YES];
  }
  
}
-(void)stopUpdateFrameRateTimer
{
  if (updateFrameRateTimer.isValid) {
    [updateFrameRateTimer invalidate];
  }
}


-(CALayer*)fullscreenLayer
{
  if( fullscreenView < 0 )
    return nil;
  
  CALayer* layer = [displayLayers objectAtIndex:fullscreenView];
  return layer;
}

-(void)updateViewZoomingStatus:(BOOL)status
{
  if(fullscreenView < 0)
    return;
  ImcViewDisplay* displayView = [displayViews objectAtIndex:fullscreenView];
  displayView.isZooming = status;
}

-(NSInteger)numOfDisplayChannel
{
  __block NSInteger count = 0;
  [displayScreens enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    ImcScreenDisplay* checked_screen =(ImcScreenDisplay*)obj;
    if(checked_screen.isEnable)
      count++;
  }];
  return count;
}
@end

