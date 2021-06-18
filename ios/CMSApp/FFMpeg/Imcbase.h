//
//  Imcbase.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 2/7/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import <UIKit/UIKit.h>
#ifndef SRX_Pro_Mobile_Remote_Imcbase_h
#define SRX_Pro_Mobile_Remote_Imcbase_h

#define STR_LEN_8       8
#define STR_LEN_16      16
#define STR_LEN_32      32
#define STR_LEN_64      64
#define STR_LEN_128     128
#define STR_LEN_256     256

#define MAX_VIDEOSOURCE 128
#define MAX_CHANNEL 64

#define MAX_SERVER_SUPPORT  16




typedef enum ServerVersion
{
    VERSION_1000 			= 0,
    VERSION_1070,
    VERSION_1103,
    VERSION_1270,
    VERSION_1300,
    VERSION_1400,
    VERSION_1500,
    VERSION_1511,
    VERSION_1512,
    VERSION_1520,
    VERSION_1530,
    VERSION_1531,
    VERSION_1600,
    VERSION_1601,
    VERSION_1610,
    VERSION_1820,
    VERSION_2000,
    VERSION_2100,
    VERSION_2200,
    VERSION_2300,
    VERSION_3000,
    VERSION_3100,
    VERSION_3200,
    VERSION_3210,
    VERSION_3300,
    VERSION_3400,
    
    VERSION_1500_CMS = VERSION_1500 + 1000,
    VERSION_1512_CMS = VERSION_1512 + 1000,
    VERSION_1520_CMS = VERSION_1520 + 1000,
    VERSION_CURRENT = VERSION_3400,
    
    VERSION_UNKNOWN_HIGHER = VERSION_CURRENT + 1,
}ServerVersion;

typedef enum
{
    MOBILE_VERSION_1000 = 0,
    MOBILE_VERSION_1100,
    MOBILE_VERSION_1110,
    MOBILE_VERSION_2000,
    MOBILE_VERSION_2100,
    MOBILE_VERSION_CURRENT = MOBILE_VERSION_2000,
    
    MOBILE_VERSION_UNKNOWN_HIGHER = MOBILE_VERSION_CURRENT + 1,
}MobileVersion; 

typedef NS_ENUM(NSUInteger, ENCODED_VIDEO_FRAME_TYPE)
{
  EVFT_UNKNOWN = 0,
  EVFT_IFRAME,
  EVFT_PFRAME,
  EVFT_GFRAME,
  EVFT_BFRAME,
  
  // Thang Do, adds for dual stream, June 14, 2012, begin
  EVFT_SUBIFRAME,
  EVFT_SUBPFRAME,
  // Thang Do, adds for dual stream, June 14, 2012, end
  
};

#endif
