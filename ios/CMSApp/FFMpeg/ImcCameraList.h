//
//  ImcCameraList.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/24/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#ifndef __CAMERALIST_H__
#define __CAMERALIST_H__
#import <Foundation/Foundation.h>

#define MAX_IP_INPUT 64

@interface ImcIpCamInfo : NSObject{
    NSInteger		videoSourceIndex[MAX_IP_INPUT];		//a ip camera can have multi-input
    NSInteger		inputID[MAX_IP_INPUT];				//a ip camera can have multi-input
}

@property (retain)      NSString*		ipAddress;              //ip address of this camera
@property (readwrite)	NSUInteger		port;                   //its working port
@property (retain)      NSString*		fullmodelname;          //full model name
@property (readwrite)	NSUInteger		numInput;

- (NSInteger) videoSourceAtIndex : (NSInteger)index;
- (NSInteger) inputIDAtIndex : (NSInteger)index;
- (void) setVideoSourceWithValue : (NSInteger)value atIndex : (NSInteger)index;
- (void) setInputIDWithValue : (NSInteger)value atIndex : (NSInteger)index;

@end

@interface ImcCameraList : NSObject
@property (readwrite)   NSUInteger      countAnalogCam;         // number of analog camera
@property (readwrite)   NSUInteger      countIpCamera;          // number of ip camera
@property (readwrite)   NSUInteger      countAllInput;
@property (readwrite)   NSUInteger      countAllIpInput;
@property (retain)      NSMutableArray* ipCamInfoList;

-(void)importFromXMLData : (NSData*)xmlData;

@end
#endif //__CAMERALIST_H__
