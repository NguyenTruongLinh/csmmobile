//
//  CodecWrapper.h
//  SRX-Pro Mobile Remote
//
//  Created by i3International Inc on 10/1/12.
//
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#ifndef SRX_Pro_Mobile_Remote_CodecWrapper_h
#define SRX_Pro_Mobile_Remote_CodecWrapper_h

typedef unsigned int DWORD;
typedef unsigned char BYTE;
typedef DWORD HANDLE;

#define CODEC_TYPE( ch0, ch1, ch2, ch3 )                          \
( (DWORD)(BYTE)(ch0) | ( (DWORD)(BYTE)(ch1) << 8 ) |    \
 ( (DWORD)(BYTE)(ch2) << 16 ) | ( (DWORD)(BYTE)(ch3) << 24 ) )

#define I3CODE_ENCODER        0x0080
#define I3CODE_DECODER        0x8000

#define CODEC_ID(type, ch0, ch1, ch2, ch3)  ((type) | CODEC_TYPE(ch0, ch1, ch2, ch3))

#define ISENCODER(x)   ((x) & I3CODE_ENCODER)
#define ISDECODER(x)   ((x) & I3CODE_DECODER)
#define CODETYPE(x)    ((x) & (~(I3CODE_ENCODER|I3CODE_DECODER)))

#define MJPEG_CODEC CODEC_TYPE('M', 'J', 'I', 'P')
#define MJPEG_CODEC_2 CODEC_TYPE('I', 'P', '0', '2')
#define MPEG4_CODEC  CODEC_TYPE('X', 'V', 'I', 'D')
#define H264_CODEC  CODEC_TYPE('F', 'M', 'P', 'G')
#define MPEG4_CODEC_2 CODEC_TYPE('M', 'P', 'I', 'P')
#define MPEG4_CODEC_3 CODEC_TYPE('I', 'P', '0', '3')


typedef enum
{
    I3CODE_ERROR_OK = 0,
    I3CODE_ERROR_SKIP_FRAME,
    I3CODE_ERROR_FAIL,
}I3_CODEC_ERROR;

// Used with I3VENC_PARAM & I3VDEC_PARAM structs, defined in ImcBase.h
typedef enum
{
	VCM_UNKNOWN = 0,
	
	VCM_IP,		// Frames are compressed using I<-P1, I<-P2,..., I<-Pn dependency method
	VCM_PP,		// Frames are compressed using I<-P1<-P2<-...<-Pn dependency method
    
	VCM_COUNT
    
} VIDEO_CODING_METHOD;

typedef struct
{
	uint32_t codecId;  // codec type
	int width;              // the x dimension of the frames to be encoded
	int height;             // the y dimension of the frames to be encoded
	int bitrate;            // the bitrate of the target encoded stream, in bits/second
	int max_key_interval;   // the maximum interval between key frames
	int quality;            // the quality of compression ( 0 - lowest, 100 - highest )
	int codingMethod;		// IP, PP, etc.
} I3VENC_PARAM;

typedef struct
{
    int cx;
    int cy;
}SIZE;

typedef struct
{
	void* bitstream;        // [in] bitstream ptr
	int   length;           // [out] bitstream length (bytes)
    
	unsigned char* image;   // [in] image ptr
    int     colorspace;     // [in] source colorspace
	int     bTextOverlay;	//JK Bin Add because of MVIA Codec changes, Dec. 15, 2005
	SIZE	sizeImage;      // Jerry
} I3VENC_FRAME;

typedef struct
{
	uint32_t codecId;
	int width;
	int height;
	int codingMethod;		// IP, PP, etc.
} I3VDEC_PARAM;

typedef struct
{
	I3VDEC_PARAM	parm;
    
	unsigned char*	bitstream;
	int				length;
} I3VDEC_DIMENSION;

typedef struct
{
	void* bitstream;
	int length;
    
	unsigned char* image;
	int stride;
	int colorspace;
} I3VDEC_FRAME;

#endif
