//
//  ImcConnectionServerList.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 1/7/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ImcConnectionServerList.h"
#import "ImcGUIBase.h"

@implementation ImcConnectionServerListXMLParser

@synthesize listConnectionServer;

- (ImcConnectionServerListXMLParser*)initXMLParser
{
    return  self;
}

- (void)parser:(NSXMLParser *)parser didStartElement:(NSString *)elementName namespaceURI:(NSString *)namespaceURI qualifiedName:(NSString *)qualifiedName
    attributes:(NSDictionary *)attributeDict
{
    if ( [elementName isEqualToString:@"ConnectionServers"] )
        listConnectionServer = [[NSMutableArray alloc] init];
    else if ( [elementName isEqualToString:@"ConnectionServer"] ){
        aConnection = [[ImcConnectionServer alloc] init];
        aConnection.server_port = [[attributeDict objectForKey:@"ServerPort"] integerValue];
        
    }
    NSLog(@"Processing Value: %@", elementName);
}

- (void)parser:(NSXMLParser *)parser foundCharacters:(NSString *)string {
    
    if(!currentElementValue)
        currentElementValue = [[NSMutableString alloc] initWithString:string];
    else
        [currentElementValue appendString:string];
    
    NSLog(@"Processing Value: %@", currentElementValue);
    
}

- (void)parser:(NSXMLParser *)parser didEndElement:(NSString *)elementName
  namespaceURI:(NSString *)namespaceURI qualifiedName:(NSString *)qName
{
    if ( [elementName isEqualToString:@"ConnectionServers"] )
        return;
    if( [elementName isEqualToString:@"ConnectionServer"] ){
        [listConnectionServer addObject:aConnection];
        aConnection = nil; 
    } else
        [aConnection setValue:currentElementValue forKey:elementName];
    currentElementValue = nil;
}

@end