//
//  CodecfDecoder.m
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 10/9/12.
//
//

#import "CodecfDecoder.h"
#import "libswscale/swscale.h"
#import "libavcodec/avcodec.h"
#import <UIKit/UIKit.h> 

//int MJPEG_CODEC =  CODEC_TYPE('M', 'J', 'I', 'P');
//int MPEG4_CODEC = CODEC_TYPE('X', 'V', 'I', 'D');
//int H264_CODEC = CODEC_TYPE('F', 'M', 'P', 'G');

@interface CodecfDecoder(PrivateMethod)

-(void)convertFrameToRGB;
-(UIImage *)imageFromAVPicture:(AVPicture)pict width:(int)width height:(int)height;
-(void)setupScaler;

@end

@implementation CodecfDecoder
@synthesize currentImage, lastFrameSize, count, curDiv, lastFrameTime, needIFrame, frameIndex, frameCount, frameRate, m_avcodec, m_avcodecContext, lastChannelIndex, lastServerAddress;

+(void)initFFmpeg
{
	//avcodec_init();
    avcodec_register_all();
}

+ (unsigned long) GetCodecId
{
    return CODEC_ID(I3CODE_DECODER, 'F', 'M', 'P', 'G');
}

-(id)init
{
    self = [super init];
    if (self) {
        lastFrameSize = CGSizeZero;
        count = 0;
        curDiv = 0;
        lastFrameTime = -1;
        needIFrame = YES;
        frameIndex = -1;
        frameCount = 0;
        frameRate = -1;
        lastServerAddress = nil;
        lastChannelIndex = -1;
        //decodeLock = [[NSLock alloc] init];
    }
    
    return self;
}

-(UIImage *)currentImage {
	if (!m_avFrame->data[0]) return nil;
	[self convertFrameToRGB];
	return [self imageFromAVPicture:picture width:m_outputWidth height:m_outputHeight];
}

-(BOOL) isDecoderChanged : (I3VDEC_PARAM*)param
{
    BOOL result = (param->codecId != m_codecID) || (param->width != m_frameWidth) || (param->height != m_frameHeight);
    return result;
}

-(HANDLE) Decoder_Init : (I3VDEC_PARAM*) parm isFullScreen:(BOOL)isFullScreen
{
	m_frameWidth = parm->width;
	m_frameHeight = parm->height;
    m_codecID = parm->codecId;
    m_outputWidth = m_frameWidth;
    m_outputHeight = m_frameHeight;
    
    m_needSetupScaler = false;
    
	m_avcodecContext = avcodec_alloc_context3(m_avcodec);
	m_avcodecContext->flags |= CODEC_FLAG_EMU_EDGE | CODEC_FLAG_INTERLACED_DCT;		//enable this parameter, output image stride will be same as image width
    
	// ysong, May 18, 2012, add more option to the codec
	m_avcodecContext->error_concealment = (FF_EC_GUESS_MVS|FF_EC_DEBLOCK);
	m_avcodecContext->err_recognition = AV_EF_CAREFUL;
	m_avcodecContext->workaround_bugs   = FF_BUG_AUTODETECT;
	m_avcodecContext->flags2|=CODEC_FLAG2_CHUNKS;
    //m_avcodecContext->colorspace = 2;
	
	m_avFrame = av_frame_alloc();
	
    switch (parm->codecId) {
        case MPEG4_CODEC:
            m_avcodec = avcodec_find_decoder(AV_CODEC_ID_MPEG4);
            break;
        case H264_CODEC:
            m_avcodec = avcodec_find_decoder(AV_CODEC_ID_H264);
            break;
        case MPEG4_CODEC_2:
                m_avcodec = avcodec_find_decoder(AV_CODEC_ID_H264);
            break;
        case MPEG4_CODEC_3:
                m_avcodec = avcodec_find_decoder(AV_CODEC_ID_H264);
            break;
        case MJPEG_CODEC:
                m_avcodec = avcodec_find_decoder(AV_CODEC_ID_MJPEG);
            break;
        case MJPEG_CODEC_2:
                m_avcodec = avcodec_find_decoder(AV_CODEC_ID_MJPEG);
        default:
            break;
    }
    if (!m_avcodec)
		return 0;
    
	if (avcodec_open2(m_avcodecContext, m_avcodec, NULL) < 0)
		return 0;
    
	// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
	if ( (parm->width == 704 || parm->width == 720) && (parm->height == 480 || parm->height == 576) )
		// Fill the image buffer to AVPicture with type 422 planar
		m_pDeinterlaced = malloc(parm->width * parm->height * 2);
	// Thang Do, add for deinterlaced D1, Dec 02, 2011, end
    
	return (HANDLE)self;
}

// destroy decoder
-(void) Decoder_Destroy
{
	//[decodeLock lock];
    avcodec_close(m_avcodecContext);
	av_free(m_avcodecContext);
	av_frame_free(&m_avFrame);
    avpicture_free(&picture);
    if (img_convert_ctx)
        sws_freeContext(img_convert_ctx);
    //avpicture_free(&picture);
	// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
	if ( m_pDeinterlaced )
	{
		free(m_pDeinterlaced);
		m_pDeinterlaced = NULL;
	}
	// Thang Do, add for deinterlaced D1, Dec 02, 2011, end
    
    //[decodeLock unlock];
}

// decode a video frame
// parm->bitstream:         encoded image buffer
// parm->length:			encoded image length
// parm->stride:			decoded image stride
-(int) Decoder_Decode : (I3VDEC_FRAME*) parm
{
    //[decodeLock lock];
    @autoreleasepool
    {
        if(parm->bitstream == NULL || parm->length < 1 || parm->stride < 1)
        {
            //[decodeLock unlock];
            return I3CODE_ERROR_FAIL;
        }
      
        int got_picture = 1;
        
        //JK Bin, change to use lib from sail, Nov. 17, 2011, Begin
        AVPacket avpacket;
        av_init_packet(&avpacket);
        
        // update for memory alignment
#ifdef PADDING_DATA
        uint8_t* padding_data;
        int encoded_size = parm->length + FF_INPUT_BUFFER_PADDING_SIZE;
        @try
        {
            posix_memalign((void**)(&padding_data), IMC_ALIGNED32, encoded_size);
            
            memcpy(padding_data,parm->bitstream,parm->length);
            memset(padding_data + parm->length,0,FF_INPUT_BUFFER_PADDING_SIZE);
            avpacket.data = padding_data;
        }
        @catch(...)
        {
            //free(parm->bitstream);
            //[decodeLock unlock];
            return I3CODE_ERROR_FAIL;
        }
        avpacket.size = parm->length;
        
#else
        avpacket.data =  (uint8_t*)(parm->bitstream);
        avpacket.size = parm->length;
        
#endif
        //  ND Nghia, adds for padding data, Feb 06 2013, End

        // ysong
        av_frame_unref(m_avFrame);
      
      /*int _error = avcodec_send_packet(m_avcodecContext, &avpacket);
      if( _error==0)
        _error = avcodec_receive_frame(m_avcodecContext, m_avFrame);*/
      int _error = avcodec_decode_video2(m_avcodecContext, m_avFrame, &got_picture, &avpacket);
        //JK Bin, change to use lib from sail, Nov. 17, 2011, End
        
        
        //  ND Nghia, adds for padding data, Feb 06 2013, Begin
#ifdef PADDING_DATA
        if( padding_data )
            free((void*)padding_data);
#endif
        //  ND Nghia, adds for padding data, Feb 06 2013, End

        
        bool isSameDimension = false;
        if ((m_avcodecContext->width == m_frameWidth || (m_avcodecContext->width == 352 && m_frameWidth == 360))
            && m_avcodecContext->height == m_frameHeight)
            isSameDimension = true;
        if (_error < 0 || !isSameDimension)
        {
            //[decodeLock unlock];
            return I3CODE_ERROR_FAIL;

        }
        
        if (got_picture > 0)
        {
            if( !m_needSetupScaler )
            {
                [self setupScaler];
                m_needSetupScaler = true;
            }
            // Thang Do, adds for AD-4016, Apr 19, 2011, begin
            int margin = 0;
            if (m_avcodecContext->width == 352 && parm->stride == 360)
                // For AD-4016, input width = 352 --> output width = 360
                // left margin = right margin = 4 pixels = 8 bytes
                margin = 8;
            // Thang Do, adds for AD-4016, Apr 19, 2011, end
            
            // Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
            /*if ( (m_avcodecContext->width == 704 || m_avcodecContext->width == 720) &&
                (m_avcodecContext->height == 480 || m_avcodecContext->height == 576) )
                avpicture_deinterlace((AVPicture*)m_avFrame, (AVPicture*)m_avFrame,
                                      m_avcodecContext->pix_fmt, m_avcodecContext->width, m_avcodecContext->height);*/
            return I3CODE_ERROR_OK;
        }
        else
        {
            // ND Nghia, adds to fix Frame Delay issue, Dec 26 2012, Begin
            count++;
            if( count > NO_PICTURE_ERROR_THRESHOLD )
            {
                count = 0;
                //free(parm->bitstream);
                //[decodeLock unlock];
                return I3CODE_ERROR_FAIL;
            }
             // ND Nghia, adds to fix Frame Delay issue, Dec 26 2012, End
        }
        
        // ysong, May 18, 2012, change the error code SKIP_FRAME when no picutre but decoding succeeded
        return I3CODE_ERROR_SKIP_FRAME;
    }
}

// get image width and height
-(int) Decoder_GetDimension :(int*) pw : (int*) ph
{
	*pw = m_frameWidth;
	*ph = m_frameHeight;
    
	return I3CODE_ERROR_FAIL;
}


-(int) Decoder_Deinterlace : (unsigned char*) pYUV422Video : (int) bufSize : (int) width : (int) height
{
	int ret = 0;
	if ( (width == 704 || width == 720) && (height == 480 || height == 576) )
	{
		AVPicture pic;
		ret = avpicture_fill(&pic, m_pDeinterlaced, AV_PIX_FMT_YUV422P, width, height);
	}
    
	return ret;
}

-(void)updateDimemsionWithHeight:(int)height width:(int)width isFullScreen:(BOOL)isFullScreen
{
    if (!isFullScreen)
    {
        m_outputHeight = 320;
        m_outputWidth = 480;
    }
    else
    {
        m_outputHeight = height;
        m_outputWidth = width;
    }
    
}

-(void)setupScaler {
    
	// Release old picture and scaler
	avpicture_free(&picture);
  if (img_convert_ctx)
  {
    sws_freeContext(img_convert_ctx);
    img_convert_ctx = nil;
  }
	
	// Allocate RGB picture
	avpicture_alloc(&picture, AV_PIX_FMT_RGB24, m_outputWidth, m_outputHeight);
	
	// Setup scaler
	static int sws_flags =  SWS_FAST_BILINEAR;
	img_convert_ctx = sws_getContext(m_avcodecContext->width,
									 m_avcodecContext->height,
									 m_avcodecContext->pix_fmt,
									 m_outputWidth,
									 m_outputHeight,
									 AV_PIX_FMT_RGB24,
									 sws_flags, NULL, NULL, NULL);
}

-(void)convertFrameToRGB {
	
    if (img_convert_ctx) {
        sws_scale (img_convert_ctx, (const uint8_t *const*)m_avFrame->data, m_avFrame->linesize,
                   0, m_avcodecContext->height,
                   picture.data, picture.linesize);
    }
    
}

-(UIImage *)imageFromAVPicture:(AVPicture)pict width:(int)width height:(int)height {
	CGBitmapInfo bitmapInfo = kCGBitmapByteOrderDefault;
	CFDataRef data = CFDataCreateWithBytesNoCopy(kCFAllocatorDefault, pict.data[0], pict.linesize[0]*height,kCFAllocatorNull);
	CGDataProviderRef provider = CGDataProviderCreateWithCFData(data);
	CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
	CGImageRef cgImage = CGImageCreate(width,
									   height,
									   8,
									   24,
									   pict.linesize[0],
									   colorSpace,
									   bitmapInfo,
									   provider,
									   NULL,
									   YES,
									   kCGRenderingIntentDefault);
	CGColorSpaceRelease(colorSpace);
	UIImage *image = [UIImage imageWithCGImage:cgImage];
	CGImageRelease(cgImage);
    //cgImage = NULL;
	CGDataProviderRelease(provider);
	CFRelease(data);
	
	return image;
}

@end
