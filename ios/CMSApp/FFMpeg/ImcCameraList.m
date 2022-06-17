//
//  ImcCameraList.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/24/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ImcCameraList.h"
#import "GDataXMLNode.h"

@implementation ImcIpCamInfo

@synthesize ipAddress,fullmodelname,numInput,port;

-(id)init
{
    self = [super init];
    if( self )
    {
        ipAddress           = nil;
        fullmodelname       = nil;
        port                = 0;
        numInput            = 0;
        //inputID             = [[NSArray alloc] init];
        //videoSourceIndex    = [[NSArray alloc] init];
    }
    return self;
}

-(NSInteger)videoSourceAtIndex:(NSInteger)index
{
    assert(index >= 0 && index < MAX_IP_INPUT);
    return videoSourceIndex[index];
}

- (NSInteger)inputIDAtIndex:(NSInteger)index
{
    assert(index >= 0 && index < MAX_IP_INPUT);
    return inputID[index];
}

-(void)setVideoSourceWithValue:(NSInteger)value atIndex:(NSInteger)index
{
    assert(index >= 0 && index < MAX_IP_INPUT);
    videoSourceIndex[index] = value;
}

-(void)setInputIDWithValue:(NSInteger)value atIndex:(NSInteger)index
{
    assert(index >= 0 && index < MAX_IP_INPUT);
    inputID[index] = value;
}

@end

@implementation ImcCameraList

@synthesize countAllInput,countIpCamera,countAnalogCam,countAllIpInput,ipCamInfoList;

-(id)init
{
    self = [super init];
    if( self )
    {
        countAllInput = countAllIpInput = countAnalogCam = countIpCamera = 0;
        ipCamInfoList = [[NSMutableArray alloc] init];
    }
    return self;
}

- (void)importFromXMLData:(NSData *)xmlData
{
    GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithData:xmlData options:0 error:nil];
    if( doc )
    {
        NSArray* analogCams = [doc.rootElement elementsForName:@"ANALOG_CAMERA"];
        for (GDataXMLElement* analogCam in analogCams) {
             GDataXMLNode* node = [analogCam attributeForName:@"num"];
            if( node )
            {
                countAnalogCam = countAllInput = [[node stringValue] intValue];
            }
            break;
        }
        
        NSArray* ipCams = [doc.rootElement elementsForName:@"IP_CAMERA"];
        countIpCamera = ipCams.count;
        for( GDataXMLElement* ipCam in ipCams )
        {
            ImcIpCamInfo* ipInfo    = [[ImcIpCamInfo alloc] init];
            ipInfo.ipAddress        = [[ipCam attributeForName:@"ip_address"] stringValue];
            ipInfo.fullmodelname    = [[ipCam attributeForName:@"full_model_name"] stringValue];
            ipInfo.port             = [[[ipCam attributeForName:@"port"] stringValue] intValue];
            ipInfo.numInput         = [[[ipCam attributeForName:@"num_input"] stringValue] intValue];
            NSArray* inputIDs       = [[[ipCam attributeForName:@"input_id"] stringValue] componentsSeparatedByString:@"_"];
            int index = 0;
            for( NSString* inputID in inputIDs )
                [ipInfo setInputIDWithValue:[inputID intValue] atIndex:index++];
            NSArray* videoSources   = [[[ipCam attributeForName:@"video_source"] stringValue] componentsSeparatedByString:@"_"];
            index = 0;
            for( NSString* videoSource in videoSources )
                [ipInfo setVideoSourceWithValue:[videoSource intValue] atIndex:index++];
            [ipCamInfoList addObject:ipInfo];
        }
    }
}

@end
