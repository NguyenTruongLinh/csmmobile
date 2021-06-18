//
//  ImcConnectionServerList.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/7/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#ifndef _IMC_CONNECTION_SERVER_LIST_
#define _IMC_CONNECTION_SERVER_LIST_

#include <Foundation/Foundation.h>

@class ImcConnectionServer;

@interface ImcConnectionServerListXMLParser : NSObject <NSXMLParserDelegate> {
    NSMutableArray* listConnectionServer;
    ImcConnectionServer* aConnection;
    NSMutableString* currentElementValue;
}

@property (nonatomic, retain) NSMutableArray* listConnectionServer;

-(ImcConnectionServerListXMLParser*)initXMLParser;

@end

#endif  // _IMC_CONNECTION_SERVER_LIST_
