//
//  CodecfDecoder.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 10/9/12.
//
//

#import <Foundation/Foundation.h>
#import "CodecWrapper.h"
#import "libavcodec/avcodec.h"
//#import "ImcGUIBase.h"
#include <stdlib.h>
//#import 40"libavfilter/avfilter.h"
#import <UIKit/UIKit.h>

#define NO_PICTURE_ERROR_THRESHOLD 25
#define PADDING_DATA

typedef enum
{
    IMC_NULL = 0,
    IMC_ALIGNED2 = 2,
    IMC_ALIGNED4 = 4,
    IMC_ALIGNED8 = 8,
    IMC_ALIGNED16 = 16,
    IMC_ALIGNED32 = 32,
    IMC_ALIGNED64 = 64,
    IMC_ALIGNED128 = 128
    
} MEMORY_ALIGNMNET_TYPE;

@interface CodecfDecoder : NSObject
{
    uint32_t    m_codecID;
    //AVFilterContext* m_avfilterContext;
    AVFrame* m_avFrame;
    int		m_frameWidth;
    int		m_frameHeight;
    BYTE*   m_pDeinterlaced;
    int     m_outputWidth;
    int     m_outputHeight;
	AVPicture picture;
	struct SwsContext *img_convert_ctx;
	int outputWidth, outputHeight;
	UIImage *currentImage;
    bool    m_needSetupScaler;
    //NSLock* decodeLock;
}

@property (nonatomic, readonly) UIImage* currentImage;
@property (nonatomic, readwrite) CGSize lastFrameSize;
@property (nonatomic, readwrite) NSInteger count;
@property (nonatomic, readwrite) NSInteger curDiv;
@property long lastFrameTime;
@property int  frameIndex;
@property BOOL needIFrame;
@property NSInteger frameCount;
@property NSInteger frameRate;
@property AVCodec* m_avcodec;
@property AVCodecContext* m_avcodecContext;
@property NSString* lastServerAddress;
@property NSInteger lastChannelIndex;

+(void)initFFmpeg;
+ (unsigned long) GetCodecId;

-(BOOL) isDecoderChanged : (I3VDEC_PARAM*)param;

-(HANDLE)	Decoder_Init : (I3VDEC_PARAM*) param isFullScreen:(BOOL)isFullScreen;
-(void)     Decoder_Destroy;
-(int)		Decoder_Decode : (I3VDEC_FRAME*) param;
-(int)		Decoder_GetDimension : (int*) width : (int*) height;
-(int)		Decoder_Deinterlace : (unsigned char*) pYUV422Video : (int) bufSize : (int) width : (int) height;
-(void)updateDimemsionWithHeight:(int)height width:(int)width isFullScreen:(BOOL)isFullScreen;
@end
