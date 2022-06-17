//
//  ImcMobileCommand.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/14/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import "../Imcbase.h"
#import "../MobileBase.h"
#import "ImcMobileCommand.h"

@implementation ImcMobileCommand

//@synthesize cmdLength = _cmdLength;

+(NSData*)constructSentPacket:(uint32_t)_cmdLength :(uint16_t)_command :(uint32_t)_version :(NSData *)_cmdContent
{
  uint32_t packetLength = _cmdLength + 4;
  NSMutableData* packet = [[NSMutableData alloc] initWithBytes:&packetLength length:4];
  [packet appendBytes:&_cmdLength length:4];
  [packet appendBytes:&_command length:2];
  [packet appendBytes:&_version length:4];
  [packet appendData:_cmdContent];
  return packet;
}

+(NSData*)constructSimpleMsgPacket:(uint16_t)_command
{
  uint32_t cmdLength = 2;
  NSMutableData* packet = [[NSMutableData alloc] initWithBytes:&cmdLength length:sizeof(cmdLength)];
  [packet appendBytes:&_command length:sizeof(_command)];
  return packet;
}

+(NSData*)constructSentPacketWithCmd:(uint16_t)command Data:(void *)buffer DataLength:(uint32_t)bufferLength
{
  uint32_t dataLength = bufferLength + 2; // bufferLength + command
  NSMutableData* packet = [[NSMutableData alloc] initWithBytes:&dataLength length:4];
  [packet appendBytes:(void*)&command length:sizeof(uint16_t)];
  [packet appendBytes:buffer length:bufferLength];
  return packet;
}

-(id)init
{
  self = [super init];
  if( self )
  {
    //cmdContent = nil;
    cmdLength = 0;
    contentData = nil;
  }
  return self;
}

-(id)initWithData:(NSData *)data
{
  cmdContent = nil;
  self = [super init];
  if( self )
  {
    int32_t dataLength = (int32_t)data.length;
    if( dataLength < MOBILE_COMM_COMMAND_HEADER_SIZE)
      return nil;
    cmdLength = dataLength;
    uint8_t* bytes = (uint8_t*)[data bytes];
    command = *(uint16_t*)bytes;
    //bytes += 2;
    contentLength = *((uint32_t*)(bytes+2));
    if( dataLength < contentLength + MOBILE_COMM_COMMAND_HEADER_SIZE )
      return nil;
    
    contentData = [[NSData alloc] initWithBytes:(bytes + MOBILE_COMM_COMMAND_HEADER_SIZE)length:contentLength];
    //[data getBytes:cmdContent range:NSMakeRange(MOBILE_COMM_COMMAND_HEADER_SIZE, contentLength)];
    //free(cmdContent);
  }
  return self;
}

-(uint16_t)getCommand
{
  
  return command;
}

/*-(void*)getContent
 {
 return (void*)cmdContent;
 }
 */
-(uint32_t)cmdLength
{
  return cmdLength;
}

- (NSData*) dataForCommandContent
{
  return contentData;
}

@end

