//
//  ImcServerSetting.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/23/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "Imcbase.h"
#import "MobileBase.h"

@interface ChannelSetting : NSObject

@property (nonatomic)   int         channelID;
@property (nonatomic)   int         videoSourceInput;
@property (nonatomic)      NSString*   channelName;
@property (nonatomic)      NSString*   cameraInfo;
@property (nonatomic)   bool        isEnable;
@property (nonatomic)   bool        isLiveViewable;
@property (nonatomic)   bool        isSearchable;
@property (nonatomic)   bool        isPtzEnable;

@end

@interface ImcServerSetting : NSObject{
    uint8_t         videoQuality;
    uint8_t         framePerSecond;
    long             durationViewAlarmList;	// duration view time of event in hours (Local Setting)
    long             numListOfDurationViewAlarmList;  //will receive from server when connect to
    long             filterAlarmBy;
        
    ChannelSetting* channelsConfig[MAX_CHANNEL];	
    ChannelSetting* serverChannelsConfig[MAX_CHANNEL];
        
    bool            settingChangedMask[NUM_OF_SETTING];
    int             channelMapping[MAX_CHANNEL];
    bool            sourceResMask[MAX_VIDEOSOURCE];
    uint16_t        numOfSourceInputSend;
    float           cycleSendFrame;		//in milida-seconds
    //used for 8 division (BlackBerry)
    uint16_t        largeSourceIndex;		
    CGSize          largeFrameSize;	
    CGSize          smallFrameSize;
    uint16_t        maxChannelSupport;
    bool            isFullScreen;
    CGSize          screenSize;
    BOOL            requestFrameType[MAX_CHANNEL];
}

@property (nonatomic) uint8_t   videoQuality;
@property (nonatomic) uint8_t   framePerSecond;
@property (nonatomic) long  durationViewAlarmList;
@property (nonatomic) long  numListOfDurationViewAlarmList;
@property (nonatomic) long  filterAlarmBy;
@property (nonatomic) uint16_t  maxChannelSupport;
@property (nonatomic) uint16_t  layout;
@property (nonatomic) int16_t   fullscreenChannel;
@property (nonatomic) uint64_t  displayChannelMask;
@property (nonatomic) uint64_t  enableSearchChannelMask;
@property (nonatomic) CGSize    smallDivSize;
@property (nonatomic) CGSize    largeDivSize;
@property (nonatomic) BOOL      needUpdateSetting;
@property (nonatomic) BOOL      needUpdateConfig;
@property (nonatomic) NSTimeZone* timeZone;
@property (nonatomic) long timeZoneOffset;

-(void)resetSetting;
-(void)resetChannelSetting:(ChannelSetting*)_setting;
-(void)importSettingFromXML:(NSData*)xmlData;
-(void)importChannelConfigFromXML:(NSData*)xmlData;
-(NSInteger)importTimeZoneFromXML:(NSData *)xmlData;
-(CGSize)calcChannelRes;
-(void)resetSettingChangedMask:(bool)value;
-(void)updateSettingChannedMask:(SETTING_TYPE)setting :(bool)value;

-(id)exportVideoQualitytoXML;
-(id)exportFPStoXML;
-(id)exportResolutionRequestToXML: (BOOL) isRelay;
-(id)exportSourceRequestToXML;
-(id)exportDurationAlarmListToXML;
-(id)exportFilterAlarmToXML;
-(id)exportFullscreenChannelToXML;
-(id)exportMainSubStreamRequestToXML;
-(id)exportSearchFrameSizeToXML;

-(void)updateChannelMap:(int)channel :(int)value;
-(void)updateSourceMap;

-(id)channelConfigAtIndex:   (int)index;
-(int)viewFromChannelIndex:   (int)channel;
-(void)updateFullscreenChannel:     (int)channel;
-(void)updateMainSubRequestForFullScreen: (int)channelIndex;
-(NSArray*)exportChannelConfig;
-(NSInteger)videoSourceIndexforChannel : (NSInteger)channel;
-(void)setChannelMapping:(NSArray*)channel;
-(void)resetRequestFrameType;


@end
