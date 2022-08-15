//
//  ImcControllerThread.m
//  CMSApp
//
//  Created by I3DVR on 11/23/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "ImcControllerThread.h"
#import "Imcbase.h"
#import "MobileBase.h"
#import "Commanager/ImcRemoteConnection.h"
#import "ImcEnvSetting.h"
#import "GDataXMLNode.h"
#import "ImcServerSetting.h"
#import "ImcDisplayChannel.h"
#import "BDHost.h"

//@class AVAudioPlayer;
const NSUInteger kMaxCommand = 50;
@implementation ImcControllerThread

@synthesize delegate;

-(id)init
{
	
  self = [super init];
  if( self )
  {
    //connectionManager = [[ImcConnectionManager alloc] init];
    connectionList = [[NSMutableArray alloc] init];
    commandList = [[NSMutableArray alloc] initWithCapacity:kMaxCommand];
    lockCommandList = [[NSLock alloc] init];
    lockThread = [[NSCondition alloc] init];
    lockServerList = [[NSLock alloc] init];
    env = [[ImcEnvSetting alloc] init];
    firstMainStreamFrame =  NO;
  }
  return self;
}

- (void)mainThreadProc:(id)object
{
	
  ImcCommand* cmd = nil;
  
  while (isRunning) {
    
    [lockThread lock];
    [lockThread wait];
    [lockThread unlock];
    
    while ( (cmd = [self getCurrentCommand]) != nil ) {
      switch ([cmd getCommand] ) {
        case IMC_CMD_CONNECTION_CONNECT:
        {
          ImcConnectedServer* server = (ImcConnectedServer*)[cmd getData];
          ImcRemoteConnection*  remoteConnection = [[ImcRemoteConnection alloc] init:[server connectionServerInfo]];
          
          if( remoteConnection != nil )
          {
            remoteConnection.delegate = self;
            BOOL bResult = [remoteConnection setupConnection];
            if( bResult )
            {
              if(delegate)
              {
                LAYOUT curdiv = [delegate handleCommand:IMC_CMD_DISPLAY_GET_CURRENT_LAYOUT : nil];
                [remoteConnection updateLayout:curdiv];
              }
              
              remoteConnection.deviceSetting.framePerSecond= server.framePerSecond;
              remoteConnection.deviceSetting.videoQuality = server.videoQuality;
              remoteConnection.deviceSetting.filterAlarmBy = server.filterAlarmBy;
              
              remoteConnection.deviceSetting.durationViewAlarmList = server.durationViewAlarmList;
              remoteConnection.deviceSetting.numListOfDurationViewAlarmList = server.numListOfDurationViewAlarmList;
              [lockServerList lock];
              [env.connectedServers addObject:remoteConnection];
              [lockServerList unlock];
              
              [delegate handleCommand:IMC_CMD_CONNECTION_CONNECT_SUCCESSFULL :server];
            }
          }
          else
          {
            ImcConnectionStatus* newStatus = [[ImcConnectionStatus alloc] initWithParam:server: -1  : MOBILE_LOGIN_MESSAGE_CANNOT_CONNECT];
            
            [delegate handleCommand:[cmd getCommand] :newStatus];
          }
          
        }
          break;
        case IMC_CMD_CONNECTION_CONNECT_RESPONSE:
        {
          ImcConnectionStatus* status = (ImcConnectionStatus*)[cmd getData];
          ImcRemoteConnection* remoteConnection = (ImcRemoteConnection*)status.remoteConnection;
          ImcConnectedServer* server = [ImcConnectionServer initWithServerInfo:remoteConnection.serverInfo];
          
          if( status.connectionStatus != MOBILE_LOGIN_MESSAGE_SUCCEEDED )
          {
            
            if( status.connectionStatus != MOBILE_LOGIN_MESSAGE_CANNOT_CONNECT )
              [remoteConnection disconnect];
            [lockServerList lock];
            [env.connectedServers removeObject:status.remoteConnection];
            [lockServerList unlock];
            ImcConnectionStatus* newStatus = [[ImcConnectionStatus alloc] initWithParam:server:status.connectionIndex :status.connectionStatus];
            [delegate handleCommand:IMC_CMD_CONNECTION_CONNECT_RESPONSE :newStatus];
          }
          else
          {
            
            
            if( delegate )
            {
              server.framePerSecond = remoteConnection.deviceSetting.framePerSecond;
              server.videoQuality = remoteConnection.deviceSetting.videoQuality;
              server.filterAlarmBy = remoteConnection.deviceSetting.filterAlarmBy;
              server.maxChannelSupport = remoteConnection.deviceSetting.maxChannelSupport;
              server.durationViewAlarmList = remoteConnection.deviceSetting.durationViewAlarmList;
              server.numListOfDurationViewAlarmList = remoteConnection.deviceSetting.numListOfDurationViewAlarmList;
              server.serverVersion = remoteConnection.serverVersion;
              
              ImcConnectionStatus* newStatus = [[ImcConnectionStatus alloc] initWithParam:server:status.connectionIndex :status.connectionStatus];
              
              NSString* ipaddress = [BDHost addressForHostname:server.server_address];
              if( ipaddress )
                server.fullAddress = [NSString stringWithFormat:@"%@:%ld",ipaddress,(long)server.server_port];
              if (status.connectionStatus == MOBILE_LOGIN_MESSAGE_SUCCEEDED)
              {
                [delegate handleCommand:[cmd getCommand] :newStatus];
              }
              
            }
            
            //[lockServerList lock];
            [remoteConnection startVideoConnection];
            
            [remoteConnection sendCommand:MOBILE_MSG_SERVER_SEND_SETTINGS :nil :0];
            [remoteConnection sendCommand:MOBILE_MSG_SEND_CAMERA_LIST :nil :0];
            
            [delegate handleCommand:IMC_CMD_MOBILE_SEND_SETTINGS :nil];
            //[lockServerList unlock];
            
            
          }
          
        }
          break;
          
        case IMC_CMD_CONNECTION_CONNECT_ERROR:
        {
          ImcConnectionStatus* status = (ImcConnectionStatus*)[cmd getData];
          ImcRemoteConnection* remoteConnection = (ImcRemoteConnection*)status.remoteConnection;
          if(remoteConnection)
            [remoteConnection disconnect];
          if( delegate )
          {
            ImcConnectedServer* server = [ImcConnectionServer initWithServerInfo:remoteConnection.serverInfo];
            
            server.framePerSecond = remoteConnection.deviceSetting.framePerSecond;
            server.videoQuality = remoteConnection.deviceSetting.videoQuality;
            server.filterAlarmBy = remoteConnection.deviceSetting.filterAlarmBy;
            server.maxChannelSupport = remoteConnection.deviceSetting.maxChannelSupport;
            server.durationViewAlarmList = remoteConnection.deviceSetting.durationViewAlarmList;
            server.numListOfDurationViewAlarmList = remoteConnection.deviceSetting.numListOfDurationViewAlarmList;
            server.serverVersion = remoteConnection.serverVersion;
            
            NSString* ipaddress = [BDHost addressForHostname:server.server_address];
            if( ipaddress )
              server.fullAddress = [NSString stringWithFormat:@"%@:%zd",ipaddress,server.server_port];
            
            [lockServerList lock];
            [env.connectedServers removeObject:status.remoteConnection];
            [lockServerList unlock];
            remoteConnection = nil;
            ImcConnectionStatus* newStatus = [[ImcConnectionStatus alloc] initWithParam:server:status.connectionIndex :status.connectionStatus];
            [delegate handleCommand:IMC_CMD_CONNECTION_CONNECT_RESPONSE :newStatus];
          }
        }
          break;
          
        case IMC_CMD_SETTING_SERVER_SEND:
        {
          
        }
          break;
        case IMC_CMD_CONNECTION_DISCONNECT:
        {
          ImcConnectionServer* server = (ImcConnectionServer*)[cmd getData];
          [lockServerList lock];
          ImcRemoteConnection* found = NULL;
          for (ImcRemoteConnection* remote in env.connectedServers ) {
            if( [remote.serverInfo.server_address isEqualToString:server.server_address] )
            {
              found = remote;
              break;
            }
          }
          
          if(found!=NULL)
          {
            [found disconnect];
            [env.connectedServers removeObject:found];
            found = nil;
          }
          
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_START_TRANSFER_VIDEO:
        {
          
          for(ImcRemoteConnection* connection in env.connectedServers)
          {
            [lockServerList lock];
            [connection sendCommand:MOBILE_MSG_RESUME_SEND_VIDEO :nil:0];
            [lockServerList unlock];
          }
          
        }
          break;
        case IMC_CMD_START_TRANSFER_VIDEO_FOR_SERVER:
        {
          NSArray* data = (NSArray*)[cmd getData];
          if (data.count > 0) {
            ImcConnectedServer* server = [data objectAtIndex:0];
            
            for(ImcRemoteConnection* connection in env.connectedServers)
            {
              if ([connection.serverInfo.server_address isEqualToString:server.server_address]) {
                [lockServerList lock];
                [connection sendCommand:MOBILE_MSG_RESUME_SEND_VIDEO :nil:0];
                [lockServerList unlock];
                if (data.count > 1) {
                  //ImcConnectedServer* server = [data objectAtIndex:0];
                  uint64_t displayChannelMask = [[data objectAtIndex:1] unsignedLongLongValue];
                  connection.deviceSetting.fullscreenChannel = -1;
                  connection.deviceSetting.displayChannelMask = displayChannelMask;
                  [lockServerList lock];
                  [self handleCommand:IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK :connection];
                  [lockServerList unlock];
                  NSLog(@"Channel Mask: %llu", displayChannelMask);
                  break;
                }
              }
            }
          }
        }
          break;
        case IMC_CMD_STOP_TRANSFER_VIDEO:
        {
          [lockServerList lock];
          for(ImcRemoteConnection* connection in env.connectedServers)
          {
            [connection sendCommand:MOBILE_MSG_PAUSE_SEND_VIDEO :nil:0];
          }
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_PREPARE_FOR_MINIMIZE:
        {
          [lockServerList lock];
          for(ImcRemoteConnection* remote in env.connectedServers)
          {
            [remote sendCommand:MOBILE_MSG_STOP_SEND_VIDEO :nil :0 ];
            [remote sendCommand:MOBILE_MSG_MINIMIZE :nil :0 ];
          }
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_PREPARE_FOR_RESTORE:
        {
          [lockServerList lock];
          for(ImcRemoteConnection* remote in env.connectedServers)
          {
            //[lockServerList lock];
            [remote startVideoConnection];
            //[lockServerList unlock];
            
          }
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_MOBILE_SEND_RATIO_VIEW:
        {
          GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"ALL_SETTINGS"];
          GDataXMLElement* childNode1 = [env exportRationViewToXml];
          if( childNode1 )
          {
            [rootNode addChild:childNode1];
            GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithRootElement:rootNode];
            if( doc )
            {
              NSData* data = doc.XMLData;
              [lockServerList lock];
              for(ImcRemoteConnection* remoteConnection in env.connectedServers )
                [remoteConnection sendCommand:MOBILE_MSG_MOBILE_SEND_SETTINGS :(void*)data.bytes :data.length];
              [lockServerList unlock];
            }
          }
          
        }
          break;
          
          //case IMC_CMD_MOBILE_SEND_ALARM_SETTING:
          //{
          /*
           ImcRemoteConnection* remoteConnection = (ImcRemoteConnection*)[cmd getData];
           
           GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"ALL_SETTINGS"];
           GDataXMLElement* childNode1 = [env.deviceAlarmSetting exportToXML];
           
           if( childNode1 )
           {
           [rootNode addChild:childNode1];
           
           }
           
           GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithRootElement:rootNode];
           if( doc )
           {
           NSData* data = doc.XMLData;
           [remoteConnection sendCommand:MOBILE_MSG_MOBILE_SEND_SETTINGS :(void*)data.bytes :data.length];
           NSLog(@"Sent Alarm Setting");
           }
           */
          
          // }
          //break;
          
          /*
           case IMC_CMD_NEW_ALARM_DETECTED:
           {
           NSLog(@"+++ALARM PROCESS+++");
           }
           break;
           
           */
        case IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK:
        {
          //NSLog(@"INSIDE 409");
          ImcRemoteConnection* remoteConnection = (ImcRemoteConnection*)[cmd getData];
          
          if( [remoteConnection videoDisconnected] )
          {
            //[lockServerList lock];
            [remoteConnection startVideoConnection];
            //[lockServerList unlock];
            
          }
          GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"ALL_SETTINGS"];
          GDataXMLElement* childNode1 = [remoteConnection.deviceSetting exportSourceRequestToXML];
          GDataXMLElement* childNode2 = [remoteConnection.deviceSetting exportResolutionRequestToXML];
          GDataXMLElement* childNode3 = [remoteConnection.deviceSetting exportMainSubStreamRequestToXML];
          GDataXMLElement* childNode4 = [remoteConnection.deviceSetting exportSearchFrameSizeToXML];
          GDataXMLElement* childNode5 = [env.deviceSystemInfo exportScreenSizeToXmlData];
          
          if( childNode1 && childNode2 && childNode3)
          {
            //NSLog(@"IDSIE CHILD");
            [rootNode addChild:childNode1];
            [rootNode addChild:childNode2];
            [rootNode addChild:childNode3];
            [rootNode addChild:childNode4];
            [rootNode addChild:childNode5];
            
            GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithRootElement:rootNode];
            if( doc )
            {
              //[lockServerList lock];
              //NSLog(@"INSIDE DOC");
              NSData* data = doc.XMLData;
              [remoteConnection sendCommand:MOBILE_MSG_MOBILE_SEND_SETTINGS :(void*)data.bytes :data.length];
              NSLog(@"Sent request source mask");
              //[lockServerList unlock];
            }
          }
          
        }
          break;
          
        case IMC_CMD_MOBILE_SEND_ALL_SETTING:
        {
          ImcRemoteConnection* remoteConnection = (ImcRemoteConnection*)[cmd getData];
          GDataXMLElement* rootNode = [GDataXMLNode elementWithName:@"ALL_SETTINGS"];
          GDataXMLElement* childNode1 = [env.deviceSystemInfo exportInfoToXmlData];
          if( childNode1 )
            [rootNode addChild:childNode1];
          GDataXMLElement* childNode2 = [env.deviceSystemInfo exportScreenSizeToXmlData];
          if( childNode2 )
            [rootNode addChild:childNode2];
          GDataXMLElement* childNode3 = [env exportRationViewToXml];
          if( childNode3 )
            [rootNode addChild:childNode3];
          GDataXMLElement* childNode4 = [env exportLayoutToXml];
          if( childNode4 )
            [rootNode addChild:childNode4];
          GDataXMLElement* childNode5 = [remoteConnection.deviceSetting exportFullscreenChannelToXML];
          if( childNode5 )
            [rootNode addChild:childNode5];
          GDataXMLElement* childNode6 = [remoteConnection.deviceSetting exportSourceRequestToXML];
          if( childNode6 )
            [rootNode addChild:childNode6];
          GDataXMLElement* childNode7 = [remoteConnection.deviceSetting exportResolutionRequestToXML];
          if( childNode7 )
            [rootNode addChild:childNode7];
          GDataXMLElement* childNode8 = [env.deviceAlarmSetting exportToXML];
          if( childNode8 )
            [rootNode addChild:childNode8];
          GDataXMLElement* childNode9 = [remoteConnection.deviceSetting exportFPStoXML];
          if( childNode9 )
            [rootNode addChild:childNode9];
          GDataXMLElement* childNode10 = [remoteConnection.deviceSetting exportVideoQualitytoXML];
          if( childNode10 )
            [rootNode addChild:childNode10];
          GDataXMLElement* childNode11 = [remoteConnection.deviceSetting exportDurationAlarmListToXML];
          if( childNode11 )
            [rootNode addChild:childNode11];
          GDataXMLElement* childNode12 = [remoteConnection.deviceSetting exportFilterAlarmToXML];
          if( childNode12 )
            [rootNode addChild:childNode12];
          GDataXMLElement* childNode13 = [remoteConnection.deviceSetting exportMainSubStreamRequestToXML];
          if( childNode13 )
            [rootNode addChild:childNode13];
          GDataXMLElement* childNode14 = [remoteConnection.deviceSetting exportSearchFrameSizeToXML];
          if( childNode14 )
            [rootNode addChild:childNode14];
          
          GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithRootElement:rootNode];
          if( doc )
          {
            NSData* data = doc.XMLData;
            [remoteConnection sendCommand:MOBILE_MSG_MOBILE_SEND_SETTINGS :(void*)data.bytes :data.length];
          }
          
        }
          break;
        case IMC_CMD_SEND_ALARM_LIST:
        case IMC_CMD_NEXT_ALARM_LIST:
        case IMC_CMD_PREVIOUS_ALARM_LIST:
        case IMC_CMD_EXIT_ALARM_LIST:
        {
          ImcConnectedServer* serverInfo = (ImcConnectedServer*)[cmd getData];
          [lockServerList lock];
          for(ImcRemoteConnection* connection in env.connectedServers)
          {
            if( [serverInfo.server_address isEqualToString:connection.serverInfo.server_address] &&
               serverInfo.server_port == connection.serverInfo.server_port )
            {
              NSInteger sentCmd = 0;
              switch ([cmd getCommand]) {
                case IMC_CMD_SEND_ALARM_LIST:
                  sentCmd = MOBILE_MSG_SEND_ALARM_LIST;
                  break;
                case IMC_CMD_NEXT_ALARM_LIST:
                  sentCmd = MOBILE_MSG_NEXT_ALARM_LIST;
                  break;
                case IMC_CMD_PREVIOUS_ALARM_LIST:
                  sentCmd = MOBILE_MSG_PREVIOUS_ALARM_LIST;
                  break;
                case IMC_CMD_EXIT_ALARM_LIST:
                  sentCmd = MOBILE_MSG_EXIT_ALARM_LIST;
                  break;
                default:
                  break;
              }
              [connection sendCommand:sentCmd :nil :0];
            }
          }
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_SEND_ALARM_LIST_RESPONSE:
        case IMC_CMD_NEXT_ALARM_LIST_RESPONSE:
        case IMC_CMD_PREVIOUS_ALARM_LIST_RESPONSE:
        case IMC_CMD_NEW_ALARM_DETECTED:
        {
          //NSLog(@"---IN CONTROLLER---");
          [delegate handleCommand:[cmd getCommand] :[cmd getData]];
        }
          break;
        case IMC_CMD_PTZ_LEFT:
        case IMC_CMD_PTZ_RIGHT:
        case IMC_CMD_PTZ_UP:
        case IMC_CMD_PTZ_DOWN:
        case IMC_CMD_PTZ_LEFTUP:
        case IMC_CMD_PTZ_RIGHTUP:
        case IMC_CMD_PTZ_LEFTDOWN:
        case IMC_CMD_PTZ_RIGHTDOWN:
        case IMC_CMD_PTZ_ZOOMIN:
        case IMC_CMD_PTZ_ZOOMOUT:
        case IMC_CMD_PTZ_LEFT_STOP:
        case IMC_CMD_PTZ_RIGHT_STOP:
        case IMC_CMD_PTZ_UP_STOP:
        case IMC_CMD_PTZ_DOWN_STOP:
        case IMC_CMD_PTZ_LEFTUP_STOP:
        case IMC_CMD_PTZ_RIGHTUP_STOP:
        case IMC_CMD_PTZ_LEFTDOWN_STOP:
        case IMC_CMD_PTZ_RIGHTDOWN_STOP:
        case IMC_CMD_PTZ_ZOOMIN_STOP:
        case IMC_CMD_PTZ_ZOOMOUT_STOP:
        {
          ImcCommonHeader* ptzHeader = (ImcCommonHeader*)[cmd getData];
          [lockServerList lock];
          for(ImcRemoteConnection* connection in env.connectedServers)
          {
            if( [ptzHeader.serverAddress isEqualToString:connection.serverInfo.server_address] &&
               ptzHeader.serverPort == connection.serverInfo.server_port )
            {
              NSInteger sentCmd = 0;
              switch ([cmd getCommand]) {
                case IMC_CMD_PTZ_LEFT:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_LEFT;
                  break;
                case IMC_CMD_PTZ_RIGHT:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_RIGHT;
                  break;
                case IMC_CMD_PTZ_UP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_UP;
                  break;
                case IMC_CMD_PTZ_DOWN:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_DOWN;
                  break;
                case IMC_CMD_PTZ_LEFTUP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_LEFTUP;
                  break;
                case IMC_CMD_PTZ_RIGHTUP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_RIGHUP;
                  break;
                case IMC_CMD_PTZ_LEFTDOWN:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_LEFTDOWN;
                  break;
                case IMC_CMD_PTZ_RIGHTDOWN:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN;
                  break;
                case IMC_CMD_PTZ_ZOOMIN:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_ZOOM_IN;
                  break;
                case IMC_CMD_PTZ_ZOOMOUT:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT;
                  break;
                case IMC_CMD_PTZ_LEFT_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_LEFT_STOP;
                  break;
                case IMC_CMD_PTZ_RIGHT_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_RIGHT_STOP;
                  break;
                case IMC_CMD_PTZ_UP_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_UP_STOP;
                  break;
                case IMC_CMD_PTZ_DOWN_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_DOWN_STOP;
                  break;
                case IMC_CMD_PTZ_LEFTUP_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_LEFTUP_STOP;
                  break;
                case IMC_CMD_PTZ_RIGHTUP_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_RIGHUP_STOP;
                  break;
                case IMC_CMD_PTZ_LEFTDOWN_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_LEFTDOWN_STOP;
                  break;
                case IMC_CMD_PTZ_RIGHTDOWN_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_RIGHTDOWN_STOP;
                  break;
                case IMC_CMD_PTZ_ZOOMIN_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_ZOOM_IN_STOP;
                  break;
                case IMC_CMD_PTZ_ZOOMOUT_STOP:
                  sentCmd = MOBILE_MSG_PTZ_CONTROL_ZOOM_OUT_STOP;
                  break;
              }
              int32_t videoSourceIndex = [connection.deviceSetting videoSourceIndexforChannel:ptzHeader.channelID];
              if( videoSourceIndex < 0 )
                break;
              [connection sendCommand:sentCmd :&videoSourceIndex :4];
              break;
            }
          }
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_UPDATE_SETTING_TO_GUI:
        {
          if( delegate )
          {
            ImcRemoteConnection* remoteConnection = (ImcRemoteConnection*)[cmd getData];
            ImcConnectedServer* server = [[ImcConnectedServer alloc] init];
            
            [server updateServerInfo:remoteConnection.serverInfo];
            
            server.framePerSecond = remoteConnection.deviceSetting.framePerSecond;
            server.videoQuality = remoteConnection.deviceSetting.videoQuality;
            server.filterAlarmBy = remoteConnection.deviceSetting.filterAlarmBy;
            server.maxChannelSupport = remoteConnection.deviceSetting.maxChannelSupport;
            server.durationViewAlarmList = remoteConnection.deviceSetting.durationViewAlarmList;
            server.numListOfDurationViewAlarmList = remoteConnection.deviceSetting.numListOfDurationViewAlarmList;
            
            [delegate handleCommand:IMC_CMD_UPDATE_SETTING_TO_GUI :server];
          }
        }
          break;
        case IMC_CMD_UPDATE_CHANNEL_CONFIG:
        {
          ImcRemoteConnection* remoteConnection = (ImcRemoteConnection*)[cmd getData];;
          NSArray* channelConfig = [remoteConnection.deviceSetting exportChannelConfig];
          ImcChannelConfig* guiChannelConfig = [[ImcChannelConfig alloc] initWithServerAddress:remoteConnection.serverInfo.server_address withPort:remoteConnection.serverInfo.server_port andChannelConfig:channelConfig];
          
          [delegate handleCommand:IMC_CMD_UPDATE_CHANNEL_CONFIG :guiChannelConfig];
        }
          break;
        case IMC_CMD_DISPLAY_REQUEST_SNAPSHOT:
        case IMC_CMD_DISPLAY_CANCEL_SNAPSHOT:
        {
          ImcCommonHeader* snapshotHeader = (ImcCommonHeader*)[cmd getData];
          [lockServerList lock];
          for(ImcRemoteConnection* connection in env.connectedServers)
          {
            if( [snapshotHeader.serverAddress isEqualToString:connection.serverInfo.server_address] &&
               snapshotHeader.serverPort == connection.serverInfo.server_port )
            {
              NSInteger sentCmd = 0;
              switch ([cmd getCommand]) {
                case IMC_CMD_DISPLAY_REQUEST_SNAPSHOT:
                  sentCmd = MOBILE_MSG_SNAPSHOT;
                  break;
                case IMC_CMD_DISPLAY_CANCEL_SNAPSHOT:
                  sentCmd = MOBILE_MSG_CANCEL_SNAPSHOT;
                default:
                  break;
              }
              int32_t videoSourceIndex = [connection.deviceSetting videoSourceIndexforChannel:snapshotHeader.channelID];
              if( videoSourceIndex < 0 )
                break;
              connection.snapshotChannel = snapshotHeader.channelID;
              [connection sendCommand:sentCmd :&videoSourceIndex :4];
              break;
            }
          }
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_SERVER_CHANGE_INFO:
        {
          [lockServerList lock];
          [delegate handleCommand: IMC_CMD_SERVER_CHANGE_INFO:[cmd getData]];
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_SERVER_CHANGED_CURRENT_USER:
        {
          [lockServerList lock];
          [delegate handleCommand: IMC_CMD_SERVER_CHANGED_CURRENT_USER:[cmd getData]];
          [lockServerList unlock];
        }
          break;
          
        case IMC_CMD_SERVER_CHANGED_PORTS:
        {
          [lockServerList lock];
          [delegate handleCommand: IMC_CMD_SERVER_CHANGED_PORTS:[cmd getData]];
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_SEARCH_UPDATE_DATA_DATE:
        {
          [lockServerList lock];
          [delegate handleCommand:IMC_CMD_SEARCH_UPDATE_DATA_DATE :[cmd getData]];
          [lockServerList unlock];
        }
          break;
        case IMC_CMD_SEARCH_UPDATE_CHANNEL_LIST_IN_DATE:
        {
          [lockServerList lock];
          [delegate handleCommand: IMC_CMD_SEARCH_UPDATE_CHANNEL_LIST_IN_DATE:[cmd getData]];
          [lockServerList unlock];
        }
          break;
          
        case IMC_CMD_SEARCH_STOP_RESPONSE:
        {
          [lockServerList lock];
          [delegate handleCommand: IMC_CMD_SEARCH_STOP_RESPONSE:[cmd getData]];
          [lockServerList unlock];
        }
          break;
          
        default:
          break;
      }
    }
  }
  NSLog(@"STOP MAIN THREAD");
}

- (void)addCommand:(ImcCommand *)command
{
	
  [lockCommandList lock];
  [commandList addObject:command];
  [lockCommandList unlock];
//  isBusy = FALSE;
  
  [lockThread lock];
  [lockThread signal];
  [lockThread unlock];
  
}

- (ImcCommand*)getCurrentCommand
{
	
  
  ImcCommand* cmd = nil;
  [lockCommandList lock];
  if( commandList.count > 0 )
  {
    cmd = (ImcCommand*)[commandList objectAtIndex:0];
    [commandList removeObjectAtIndex:0];
  }
  [lockCommandList unlock];
  return cmd;
}

- (void)clearAllCommands
{
	
  [lockCommandList lock];
  [commandList removeAllObjects];
  [lockCommandList unlock];
}

-(void)startThread
{
	
  self->isRunning = TRUE;
//  isBusy = YES;
  [NSThread detachNewThreadSelector:@selector(mainThreadProc:) toTarget:self withObject:nil];
  [self start];
}

-(void)stopThread
{
	
  [self clearAllCommands];
  self->isRunning = FALSE;
  [lockThread lock];
  [lockThread signal];
  [lockThread unlock];
}

-(void)updateLayout:(NSInteger)layout
{
	
  env.layout = layout;
  
  for(ImcRemoteConnection* server in env.connectedServers)
  {
    [server updateLayout:layout];
    [lockServerList lock];
    [self handleCommand:IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK :server];
    [lockServerList unlock];
  }
  
}

-(void)updateChannelMapping:(NSArray *)viewsInfo : (bool)sendToServer
{
	
  env.viewsInfo = viewsInfo;
  
  for(int serverIndex = 0; serverIndex < env.connectedServers.count; serverIndex++ )
  {
    ImcRemoteConnection* server = (ImcRemoteConnection*)[env.connectedServers objectAtIndex:serverIndex];
    [lockServerList lock];
    if( sendToServer )
      [self handleCommand:IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK :server];
    [lockServerList unlock];
  }
  
}

- (void)updateServerDisplayMask:(NSString *)serverAddress :(NSInteger)serverPort :(uint64_t)channelMask
{
	
  
  for(int serverIndex = 0; serverIndex < env.connectedServers.count; serverIndex++ )
  {
    ImcRemoteConnection* server = (ImcRemoteConnection*)[env.connectedServers objectAtIndex:serverIndex];
    if( [server.serverInfo.server_address isEqualToString:serverAddress] &&
       server.serverInfo.server_port == serverPort )
    {
      server.deviceSetting.displayChannelMask = channelMask;
      [lockServerList lock];
      [self handleCommand:IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK :server];
      [lockServerList unlock];
      NSLog(@"Channel Mask: %llu", channelMask);
      break;
    }
  }
  
}

-(void)updateFavoriteServerDisplayMask : (NSString*)serverAddress : (NSInteger)serverPort : (uint64_t)channelMask
{
	
//  [lockServerList lock];
//  AppDelegate* appDelegate = (AppDelegate*)[[UIApplication sharedApplication] delegate];
//  for(ImcConnectedServer* serverInfo in appDelegate.connectionServerList )
//  {
//
//    ImcRemoteConnection* server = [[ImcRemoteConnection alloc] init];
//    server.serverInfo = serverInfo;
//
//    NSLog(@"server address: %@", serverInfo.server_address);
//    NSLog(@"server address: %@", server.serverInfo.server_address);
//
//    if( [server.serverInfo.server_address isEqualToString:serverAddress] &&
//       server.serverInfo.server_port == serverPort )
//    {
//      server.deviceSetting.displayChannelMask = channelMask;
//      [lockCommandList lock];
//      [self handleCommand:IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK :server];
//      NSLog(@"Channel Mask for Favorite Channel: %llu", channelMask);
//      [lockCommandList unlock];
//      break;
//    }
//  }
//  [lockServerList unlock];
}

-(void)updateRatioView:(NSInteger)ratioView :(_Bool)sendToServer
{
	
  env.rationView = ratioView;
  if( sendToServer )
  {
    [self handleCommand:IMC_CMD_MOBILE_SEND_RATIO_VIEW :nil];
  }
}

-(void)updateAlarmSetting:(NSString *)serverAddress :(NSInteger)serverPort :(id) alarmSetting
{
	
  [env.deviceAlarmSetting setAlarmSetting:alarmSetting];
}

-(void)updateVolumeLevel:(NSNumber*)volumeLevel
{
	
  
  [env.deviceAlarmSetting setVolumeLevel:volumeLevel];
  env.deviceAlarmSetting.volume = volumeLevel;
}

-(void)playAnAlarmSound:(NSNumber*)volumeLevel
{
	
  
  /*
   SystemSoundID completeSound;
   NSURL *audioPath = [[NSBundle mainBundle] URLForResource:@"Alert Sounds" withExtension:@"wav"];
   AudioServicesCreateSystemSoundID((__bridge CFURLRef)audioPath, &completeSound);
   //AudioServicesPlaySystemSound (completeSound);
   */
  
  NSString* path =[[NSBundle mainBundle] pathForResource:@"AlertSound" ofType:@"wav"];
  NSURL *url;
  url = [[NSURL alloc]initFileURLWithPath:path];
  
  player = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:nil];
  [player setVolume:((volumeLevel.floatValue/100))];
  [player play];
}

- (void)updateDisplaySize:(CGSize)smallDivSize :(CGSize)largeDivSize
{
	
  [lockServerList lock];
  for(int serverIndex = 0; serverIndex < env.connectedServers.count; serverIndex++ )
  {
    ImcRemoteConnection* server = (ImcRemoteConnection*)[env.connectedServers objectAtIndex:serverIndex];
    server.deviceSetting.smallDivSize = smallDivSize;
    server.deviceSetting.largeDivSize = largeDivSize;
  }
  [lockServerList unlock];
}

-(void)updateFullscreenChannel:(NSString *)serverAddress :(NSInteger)serverPort :(NSInteger)fullscreenChannel
{
	
  [lockServerList lock];
  NSLog(@"Update Full Screen");
  for(int serverIndex = 0; serverIndex < env.connectedServers.count; serverIndex++ )
  {
    ImcRemoteConnection* server = (ImcRemoteConnection*)[env.connectedServers objectAtIndex:serverIndex];
    if( [server.serverInfo.server_address isEqualToString:serverAddress] &&
       server.serverInfo.server_port == serverPort )
    {
      [server.deviceSetting updateFullscreenChannel:fullscreenChannel];
      //[server.deviceSetting updateMainSubRequestForFullScreen:fullscreenChannel];
      //[self handleCommand:IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK :server];
      break;
    }
  }
  [lockServerList unlock];
}

-(void)updateMainSubStream:(NSString *)serverAddress :(NSInteger)serverPort :(NSInteger)fullscreenChannel
{
	
  [lockServerList lock];
  NSLog(@"Update Full Screen");
  for(int serverIndex = 0; serverIndex < env.connectedServers.count; serverIndex++ )
  {
    ImcRemoteConnection* server = (ImcRemoteConnection*)[env.connectedServers objectAtIndex:serverIndex];
    if( [server.serverInfo.server_address isEqualToString:serverAddress] &&
       server.serverInfo.server_port == serverPort )
    {
      [server.deviceSetting updateMainSubRequestForFullScreen:fullscreenChannel];
      [self handleCommand:IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK :server];
      break;
    }
  }
  [lockServerList unlock];
}

-(void)updateMainSubStreamResponse:(BOOL)needMainStream
{
	
  firstMainStreamFrame = needMainStream;
}

-(void)processAlarmListCommand:(IMC_MOBILE_COMMAND)command : (id)parameter
{
	
  ImcCommand* imcCmd = [[ImcCommand alloc] initWithCommand:command andData:parameter];
  
  [self addCommand:imcCmd];
}

-(ImcServerSetting*)getMainSubStreamRequestForServer:(NSString *)serverAddress
{
	
  for (ImcRemoteConnection* server in env.connectedServers) {
    if ([server.serverInfo.server_address isEqualToString:serverAddress]) {
      return server.deviceSetting;
    }
  }
  
  return nil;
}

-(void)processPtzOperation:(NSInteger)messageID :(NSObject *)parameter
{
	
  IMC_MOBILE_COMMAND command = 0;
  switch (messageID) {
    case IMC_MSG_LIVE_VIEW_PTZ_LEFT:
      command = IMC_CMD_PTZ_LEFT;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_RIGHT:
      command = IMC_CMD_PTZ_RIGHT;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_UP:
      command = IMC_CMD_PTZ_UP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_DOWN:
      command = IMC_CMD_PTZ_DOWN;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_LEFTUP:
      command = IMC_CMD_PTZ_LEFTUP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_RIGHTUP:
      command = IMC_CMD_PTZ_RIGHTUP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_LEFTDOWN:
      command = IMC_CMD_PTZ_LEFTDOWN;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_RIGHTDOWN:
      command = IMC_CMD_PTZ_RIGHTDOWN;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_ZOOMIN:
      command = IMC_CMD_PTZ_ZOOMIN;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_ZOOMOUT:
      command = IMC_CMD_PTZ_ZOOMOUT;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_LEFT_STOP:
      command = IMC_CMD_PTZ_LEFT_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_RIGHT_STOP:
      command = IMC_CMD_PTZ_RIGHT_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_UP_STOP:
      command = IMC_CMD_PTZ_UP_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_DOWN_STOP:
      command = IMC_CMD_PTZ_DOWN_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_LEFTUP_STOP:
      command = IMC_CMD_PTZ_LEFTUP_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_RIGHTUP_STOP:
      command = IMC_CMD_PTZ_RIGHTUP_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_LEFTDOWN_STOP:
      command = IMC_CMD_PTZ_LEFTDOWN_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_RIGHTDOWN_STOP:
      command = IMC_CMD_PTZ_RIGHTDOWN_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_ZOOMIN_STOP:
      command = IMC_CMD_PTZ_ZOOMIN_STOP;
      break;
    case IMC_MSG_LIVE_VIEW_PTZ_ZOOMOUT_STOP:
      command = IMC_CMD_PTZ_ZOOMOUT_STOP;
      break;
  }
  
  ImcCommand* imcCmd = [[ImcCommand alloc] initWithCommand:command andData:parameter];
  [self addCommand:imcCmd];
}

-(void)processSnapshotRequest:(NSInteger)messageID :(NSObject *)parameter
{
	
  IMC_MOBILE_COMMAND command = 0;
  switch (messageID) {
    case IMC_MSG_LIVE_VIEW_REQUEST_SNAPSHOT:
      command = IMC_CMD_DISPLAY_REQUEST_SNAPSHOT;
      break;
    case IMC_MSG_LIVE_VIEW_CANCEL_SNAPSHOT:
      command = IMC_CMD_DISPLAY_CANCEL_SNAPSHOT;
      break;
    default:
      break;
  }
  ImcCommand* imcCmd = [[ImcCommand alloc] initWithCommand:command andData:parameter];
  [self addCommand:imcCmd];
}

- (void)updateSettingToServer:(ImcConnectedServer *)connectedServer
{
	
  [lockServerList lock];
  for(ImcRemoteConnection* remote in env.connectedServers)
  {
    if( [connectedServer.server_address isEqualToString:remote.serverInfo.server_address] &&
       connectedServer.server_port == remote.serverInfo.server_port )
    {
      remote.deviceSetting.framePerSecond = connectedServer.framePerSecond;
      remote.deviceSetting.videoQuality = connectedServer.videoQuality;
      remote.deviceSetting.filterAlarmBy = connectedServer.filterAlarmBy;
      remote.deviceSetting.durationViewAlarmList = connectedServer.durationViewAlarmList;
      remote.deviceSetting.numListOfDurationViewAlarmList = connectedServer.numListOfDurationViewAlarmList;
      
      ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:IMC_CMD_MOBILE_SEND_ALL_SETTING andData:remote];
      [self addCommand:imcCommand];
      break;
    }
  }
  [lockServerList unlock];
}


-(void)sendRequestTimeZoneToServer:(ImcConnectionServer*)connectionServer
{
	
  for(ImcRemoteConnection* connection in env.connectedServers)
  {
    if ([connectionServer.server_address isEqualToString:connection.serverInfo.server_address]) {
      //[lockCommandList lock];
      [connection sendCommand:MOBILE_MSG_SERVER_SEND_TIMEZONE :nil:0];
      //[lockCommandList unlock];
      break;
    }
  }
}

-(void)sendSearchCommonMessageToServer:(ImcConnectionServer*)connectionServer message:(MOBILE_MSG)message forTimeInterval:(long)ti andChannelMask:(uint64_t)channelMask withMainStreamMask:(uint64_t)mainStreamMask
{
	
  if (ti > 0 && channelMask > 0 && connectionServer)
  {
    if(message==MOBILE_MSG_SEARCH_REQUEST_MAIN_SUB)
    {
      message = MOBILE_MSG_SEARCH_REQUEST_PLAY_FW;
      [self.decoderThread clearEncodedFrameQueue:YES];
    }
    
    [lockCommandList lock];
    //ti = -1;
    for(ImcRemoteConnection* connection in env.connectedServers)
    {
      if ([connectionServer.server_address isEqualToString:connection.serverInfo.server_address])
      {
        GDataXMLElement* rootNode = nil;
        
        if (message == MOBILE_MSG_SEARCH_REQUEST_PLAY_FW ||
            message == MOBILE_MSG_SEARCH_REQUEST_SETPOS ||
            message == MOBILE_MSG_SEARCH_REQUEST_STEP_BW ||
            message == MOBILE_MSG_SEARCH_REQUEST_STEP_FW)
        {
          rootNode = [connection buildSearchCommonMessageWithTimeInterval2:ti andChannelMask:channelMask withMainStreamMask:mainStreamMask];
        }
        else if (message == MOBILE_MSG_SEARCH_REQUEST_SNAPSHOT)
        {
          rootNode = [connection buildSearchCommonMessageWithTimeInterval3:ti andChannelMask:channelMask withMainStreamMask:mainStreamMask];
        }
        else
        {
          rootNode = [connection buildSearchCommonMessageWithTimeInterval:ti andChannelMask:channelMask withMainStreamMask:mainStreamMask];
        }
        if (rootNode)
        {
          //[lockCommandList lock];
          GDataXMLDocument* doc = [[GDataXMLDocument alloc] initWithRootElement:rootNode];
          [connection sendCommand:message :(int8_t*)doc.XMLData.bytes :doc.XMLData.length];
          //[lockCommandList unlock];
        }
        break;
      }
    }
    [lockCommandList unlock];
  }
}

-(void)stopTransferingVideo
{
	
  //ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:IMC_CMD_STOP_TRANSFER_VIDEO andData:nil];
  ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:IMC_CMD_STOP_TRANSFER_VIDEO andData:nil];
  [self addCommand:imcCommand];
  /*for(ImcRemoteConnection* connection in env.connectedServer)
   {
   [connection sendCommand:MOBILE_MSG_PAUSE_SEND_VIDEO :nil:0];
   }*/
}

-(void)startTransferingVideo
{
	
  ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:IMC_CMD_START_TRANSFER_VIDEO andData:nil];
  [self addCommand:imcCommand];
  /*for(ImcRemoteConnection* connection in env.connectedServer)
   {
   [connection sendCommand:MOBILE_MSG_RESUME_SEND_VIDEO :nil:0];
   }*/
}

-(void)startTransferingVideoForServer:(NSArray*)data
{
	
  NSArray* dataParams = data;
  ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:IMC_CMD_START_TRANSFER_VIDEO_FOR_SERVER andData:dataParams];
  [self addCommand:imcCommand];
}

-(void)prepareForMinimize
{
	
  /*ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:IMC_CMD_PREPARE_FOR_MINIMIZE       andData:nil];
   [self addCommand:imcCommand];*/
  [lockServerList lock];
  for(ImcRemoteConnection* remote in env.connectedServers)
  {
    [remote sendCommand:MOBILE_MSG_STOP_SEND_VIDEO :nil :0 ];
    //[remote sendCommand:MOBILE_MSG_MINIMIZE :nil :0 ];
    [remote sendCommand:MOBILE_MSG_EXIT :nil :0 ];
    [remote videoSocketHasDisconnected];
  }
  [lockServerList unlock];
}

-(void)prepareForRestore
{
	
  ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:IMC_CMD_PREPARE_FOR_RESTORE andData:nil];
  [self addCommand:imcCommand];
  
  /*for(ImcRemoteConnection* remote in env.connectedServer)
   {
   [remote startVideoConnection];
   }*/
}

-(void)disconnectAllServers
{
	
  [lockServerList lock];
  for( int index = 0; index < env.connectedServers.count; index++ )
  {
    ImcRemoteConnection* remote = [env.connectedServers objectAtIndex:index];
//    [remote sendCommand:MOBILE_MSG_STOP_SEND_VIDEO :nil :0 ];
//    [remote sendCommand:MOBILE_MSG_EXIT :nil :0 ];
//    [remote sendCommand:MOBILE_MSG_DISCONNECT :nil :0 ];
    [self.decoderThread releaseDecoders:remote.serverInfo.server_address];
    
    [remote disconnect];
  }
  [env.connectedServers removeAllObjects];
  [lockServerList unlock];
}

-(void)disconnectServers:(NSArray*)serverList
{
	
  NSMutableArray* deletedservers = [NSMutableArray array];
  
  [lockServerList lock];
  for (NSString* serverAddress in serverList) {
    for( int index = 0; index < env.connectedServers.count; index++ )
    {
      ImcRemoteConnection* remote = [env.connectedServers objectAtIndex:index];
      
      if ([serverAddress isEqualToString:remote.serverInfo.server_address]) {
        [remote disconnect];
        [deletedservers addObject:remote];
        break;
      }
      
    }
  }
  
  if (deletedservers.count > 0) {
    [env.connectedServers removeObjectsInArray:deletedservers];
  }
  
  [lockServerList unlock];
}

#pragma mark - handle command from server
-(int)handleCommand:(NSInteger)command :(id)parameter
{
	
  switch (command) {
    case IMC_CMD_CONNECTION_CONNECT_RESPONSE:
    case IMC_CMD_SEND_CAMERA_LIST:
    case IMC_CMD_SETTING_SERVER_SEND:
    case IMC_CMD_ADD_IP_CAMERAS:
    case IMC_CMD_REMOVE_IP_CAMERAS:
    case IMC_CMD_SERVER_CHANGED_PORTS:
    case IMC_CMD_SERVER_SEND_SETTINGS:
    case IMC_CMD_server_SEND_HARDWARE_CONFIG:
    case IMC_CMD_SERVER_CHANGED_CURRENT_USER:
    case IMC_CMD_SERVER_CHANGED_SERVER_INFO:
    case IMC_CMD_NEW_ALARM_DETECTED:
    case IMC_CMD_SEND_ALARM_LIST:
    case IMC_CMD_SEND_ALARM_LIST_RESPONSE:
    case IMC_CMD_VIEW_ALARM_IMAGES:
    case IMC_CMD_NEXT_ALARM_IMAGE:
    case IMC_CMD_NEXT_ALARM_LIST:
    case IMC_CMD_NEXT_ALARM_LIST_RESPONSE:
    case IMC_CMD_PREVIOUS_ALARM_LIST:
    case IMC_CMD_PREVIOUS_ALARM_LIST_RESPONSE:
    case IMC_CMD_EXIT_ALARM_LIST:
    case IMC_CMD_MOBILE_SEND_SOURCE_RESQUEST_MASK:
    case IMC_CMD_MOBILE_SEND_ALL_SETTING:
    case IMC_CMD_MOBILE_SEND_ALARM_SETTING:
    case IMC_CMD_SERVER_CHANGE_INFO:
    case IMC_CMD_SEARCH_UPDATE_DATA_DATE:
    case IMC_CMD_SEARCH_UPDATE_CHANNEL_LIST_IN_DATE:
    case IMC_CMD_SEARCH_STOP_RESPONSE:
    case IMC_CMD_CONNECTION_CONNECT_ERROR:
    {
      ImcCommand* imcCommand = [[ImcCommand alloc] initWithCommand:command andData:parameter];
      [self addCommand:imcCommand];
    }
      break;
    case IMC_CMD_DISPLAY_VIDEO:
    {
      //@autoreleasepool
      {
        DisplayedVideoFrame* videoFrame = (DisplayedVideoFrame*)parameter;
        
        if(delegate)
          [delegate handleCommand:IMC_CMD_DISPLAY_VIDEO :videoFrame];
      }
    }
      break;
      
    case IMC_CMD_DECODE_FRAME:
    {
      @autoreleasepool
      {
        EncodedFrame* frame = (EncodedFrame*)parameter;
        if(![self.decoderThread addEncodedFrame:frame]) break;
        
        NSInteger subMainStream = ((FrameHeaderEx*)frame.header).subMainStream;
        NSString* serverAddress = frame.videoFrameInfo.serverAddress;
        NSInteger channelIndex = frame.videoFrameInfo.channelIndex;
        NSInteger resolutionHeight = frame.videoFrameInfo.resolutionHeight;
        NSInteger resolutionWidth = frame.videoFrameInfo.resolutionWidth;
        if (frame.videoFrameInfo.frameMode != SEARCH_VIEW)
        {
          if (delegate)
          {
            NSArray* frameInfo = [NSArray arrayWithObjects:serverAddress, @(channelIndex), @(subMainStream) ,@(resolutionHeight) , @(resolutionWidth),nil];
            if (frame.videoFrameInfo.frameMode != SEARCH_VIEW)
              [delegate handleCommand:IMC_CMD_DECODE_FRAME :frameInfo];
            else
              [delegate handleCommand:IMC_CMD_DECODE_SEARCH_FRAME :frameInfo];
          }
        }
		    // dongpt: add nil
        frame = nil;
      }
    }
      break;
    case IMC_CMD_RESET_DECODER:
    {
      self.decoderThread.needToResetDecoderForChannelIndex = IMC_MAX_CHANNEL-1;
    }
      break;
      
    case IMC_CMD_DISCONNECT_VIDEO:
    {
      NSString* serverAddress = (NSString*)parameter;
      if (delegate) {
        [delegate handleCommand:IMC_CMD_DISCONNECT_VIDEO :serverAddress];
      }
    }
      break;
      
    case IMC_CMD_DISPLAY_RESPONSE_SNAPSHOT:
    {
      if( delegate )
        [delegate handleCommand:IMC_CMD_DISPLAY_RESPONSE_SNAPSHOT :parameter];
    }
      break;
    case IMC_CMD_CONNECTION_DISCONNECT_RESPONSE:
    {
      if( delegate )
      {
        ImcRemoteConnection* connection = parameter;
        [self.decoderThread releaseDecoders:connection.serverInfo.server_address];
        ImcConnectedServer* server = [[ImcConnectedServer alloc] init];
        [server updateServerInfo: connection.serverInfo];
        [delegate handleCommand:IMC_CMD_CONNECTION_DISCONNECT_RESPONSE :server];
      }
      [lockServerList lock];
      [env.connectedServers removeObject:parameter];
      [lockServerList unlock];
    }
      break;
    case IMC_CMD_UPDATE_SETTING_TO_GUI:
    {
      if( delegate )
      {
        ImcRemoteConnection* remoteConnection = parameter;
        ImcConnectedServer* server = [[ImcConnectedServer alloc] init];
        
        [server updateServerInfo:remoteConnection.serverInfo];
        
        server.framePerSecond = remoteConnection.deviceSetting.framePerSecond;
        server.videoQuality = remoteConnection.deviceSetting.videoQuality;
        server.filterAlarmBy = remoteConnection.deviceSetting.filterAlarmBy;
        server.maxChannelSupport = remoteConnection.deviceSetting.maxChannelSupport;
        server.durationViewAlarmList = remoteConnection.deviceSetting.durationViewAlarmList;
        server.numListOfDurationViewAlarmList = remoteConnection.deviceSetting.numListOfDurationViewAlarmList;
        
        [delegate handleCommand:command :server];
        
      }
    }
      break;
    case IMC_CMD_UPDATE_SETTING_SERVER:
    {
      if( delegate )
      {
        ImcRemoteConnection* remoteConnection = parameter;
        ImcConnectedServer* server = [[ImcConnectedServer alloc] init];
        
        [server updateServerInfo:remoteConnection.serverInfo];
        
        server.framePerSecond = remoteConnection.deviceSetting.framePerSecond;
        server.videoQuality = remoteConnection.deviceSetting.videoQuality;
        server.filterAlarmBy = remoteConnection.deviceSetting.filterAlarmBy;
        server.maxChannelSupport = remoteConnection.deviceSetting.maxChannelSupport;
        server.durationViewAlarmList = remoteConnection.deviceSetting.durationViewAlarmList;
        server.numListOfDurationViewAlarmList = remoteConnection.deviceSetting.numListOfDurationViewAlarmList;
        server.serverTimezone = remoteConnection.deviceSetting.timeZone;
        
        [delegate handleCommand:command :server];
      }
    }
      break;
    case IMC_CMD_UPDATE_CHANNEL_CONFIG:
    {
      ImcRemoteConnection* remoteConnection = parameter;
      NSArray* channelConfig = [remoteConnection.deviceSetting exportChannelConfig];
      ImcChannelConfig* guiChannelConfig = [[ImcChannelConfig alloc] initWithServerAddress:remoteConnection.serverInfo.server_address withPort:remoteConnection.serverInfo.server_port andChannelConfig:channelConfig];
      [delegate handleCommand:command :guiChannelConfig];
      
    }
      break;
    case IMC_CMD_SERVER_SEND_SETTINGS_SUCCESSFUL:
    {
      [delegate handleCommand:IMC_CMD_SERVER_SEND_SETTINGS_SUCCESSFUL :nil];
    }
      break;
    default:
      break;
  }
  return 1;
}

@end

