//
//  ImcMobileCommand.h
//  CMSApp
//
//  Created by I3DVR on 11/23/18.
//  Copyright � 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ImcMobileCommand : NSObject{
  uint32_t cmdLength;
  uint16_t command;
  uint32_t contentLength;
  uint8_t* cmdContent;
  NSData* contentData;
}

//@property (readwrite) uint32_t cmdLength;

+(NSData*)constructSentPacket:(uint32_t)_cmdLength : (uint16_t)_command : (uint32_t)_version : (NSData*)_cmdContent;
+(NSData*)constructSimpleMsgPacket:(uint16_t)_command;
+(NSData*)constructSentPacketWithCmd:(uint16_t)command Data: (void*)buffer DataLength: (uint32_t)bufferLength;

- (id)initWithData:(NSData*)data;
- (uint16_t)getCommand;
//- (void*)getContent;
//- (void)dealloc;
- (uint32_t)cmdLength;
- (NSData*)dataForCommandContent;

@end

