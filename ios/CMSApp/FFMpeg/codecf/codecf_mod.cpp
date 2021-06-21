//file name: codecf_mod.cpp

#import "codecf_mod.h"

// constructor
Codecf_Mod::Codecf_Mod ()
{
	m_avcodecContext = NULL;
	m_avFrame = NULL;
	m_avcodec = NULL;
	m_pDeinterlaced = NULL;	
}

// destructor
Codecf_Mod::~Codecf_Mod ()
{
}

// init decoder
HANDLE Codecf_Mod::Decoder_Init(I3VDEC_PARAM* parm)
{
	m_frameWidth = parm->width;
	m_frameHeight = parm->height;

#if 0 // ysong, move to dllmain
	avcodec_init();
	//JK Bin, change to use lib from sail, Nov. 17, 2011, Begin
	avcodec_register_all();
#endif

	m_avcodecContext = avcodec_alloc_context();
	m_avcodecContext->flags |= CODEC_FLAG_EMU_EDGE | CODEC_FLAG_INTERLACED_DCT;		//enable this parameter, output image stride will be same as image width

	// ysong, May 18, 2012, add more option to the codec	
	m_avcodecContext->error_concealment = (FF_EC_GUESS_MVS|FF_EC_DEBLOCK);
	m_avcodecContext->error_recognition = FF_ER_CAREFUL;
	m_avcodecContext->workaround_bugs   = FF_BUG_AUTODETECT;
	m_avcodecContext->flags2|=CODEC_FLAG2_CHUNKS;
	
	m_avFrame = avcodec_alloc_frame();
	//m_avcodec = &h264_decoder;
	m_avcodec = avcodec_find_decoder(CODEC_ID_H264);
	if (!m_avcodec)
		return NULL;

	if (avcodec_open(m_avcodecContext, m_avcodec) < 0)
		return NULL;

	// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
	if ( (parm->width == 704 || parm->width == 720) && (parm->height == 480 || parm->height == 576) )
		// Fill the image buffer to AVPicture with type 422 planar
		m_pDeinterlaced = new BYTE[parm->width * parm->height * 2];
	// Thang Do, add for deinterlaced D1, Dec 02, 2011, end

	return (HANDLE)this;
}

// destroy decoder
void Codecf_Mod::Decoder_Destroy()
{
	avcodec_close(m_avcodecContext);
	av_free(m_avcodecContext);
	av_free(m_avFrame);

	// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
	if ( m_pDeinterlaced )
	{
		delete []m_pDeinterlaced;
		m_pDeinterlaced = NULL;
	}
	// Thang Do, add for deinterlaced D1, Dec 02, 2011, end
}

// decode a video frame
// parm->bitstream:         encoded image buffer
// parm->length:			encoded image length
// parm->stride:			decoded image stride
int Codecf_Mod::Decoder_Decode (I3VDEC_FRAME* parm)
{
	
	if(parm->bitstream == NULL || parm->length < 1 || parm->stride < 1)
		return I3CODE_ERROR_FAIL;

	int len = 0;
	int got_picture = 0;

	//JK Bin, change to use lib from sail, Nov. 17, 2011, Begin
	AVPacket avpacket;
	av_init_packet(&avpacket);

    avpacket.data =  (uint8_t*)(parm->bitstream);
	avpacket.size = parm->length;

  // ysong	
	avcodec_get_frame_defaults(m_avFrame);
	
	len = avcodec_decode_video2(m_avcodecContext, m_avFrame, &got_picture, &avpacket);
	//JK Bin, change to use lib from sail, Nov. 17, 2011, End

	bool isSameDimension = false;
	if ((m_avcodecContext->width == m_frameWidth || (m_avcodecContext->width == 352 && m_frameWidth == 360))
		&& m_avcodecContext->height == m_frameHeight)
		isSameDimension = true;

	if (len < 0 || !isSameDimension)
		return I3CODE_ERROR_FAIL;

	if (got_picture)
	{
		// Thang Do, adds for AD-4016, Apr 19, 2011, begin
		int margin = 0;
		if (m_avcodecContext->width == 352 && parm->stride == 360)
			// For AD-4016, input width = 352 --> output width = 360
			// left margin = right margin = 4 pixels = 8 bytes
			margin = 8;
		// Thang Do, adds for AD-4016, Apr 19, 2011, end

		// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
		if ( (m_avcodecContext->width == 704 || m_avcodecContext->width == 720) &&
			(m_avcodecContext->height == 480 || m_avcodecContext->height == 576) )
			avpicture_deinterlace((AVPicture*)m_avFrame, (AVPicture*)m_avFrame,
									m_avcodecContext->pix_fmt, m_avcodecContext->width, m_avcodecContext->height);
		// Thang Do, add for deinterlaced D1, Dec 02, 2011, end

		return I3CODE_ERROR_OK;
	}

	// ysong, May 18, 2012, change the error code SKIP_FRAME when no picutre but decoding succeeded
	return I3CODE_ERROR_SKIP_FRAME;
}

// get image width and height
int	Codecf_Mod::Decoder_GetDimension(int* pw, int* ph)
{
	*pw = m_frameWidth;
	*ph = m_frameHeight;

	return I3CODE_ERROR_FAIL;
}

// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
int Codecf_Mod::Decoder_Deinterlace(unsigned char* pYUV422Video, int bufSize, int width, int height)
{
	int ret = 0;
	if ( (width == 704 || width == 720) && (height == 480 || height == 576) )
	{
		AVPicture pic;
		ret = avpicture_fill(&pic, m_pDeinterlaced, PIX_FMT_YUV422P, width, height);
#if 0
#ifdef _DEBUG
		CM_YUV422PKTOYUV422PL_API(pic.data[0], pic.data[1], pic.data[2], pYUV422Video, bufSize);
#else
		CM_YUV422PKTOYUV422PL_MMX(pic.data[0], pic.data[1], pic.data[2], pYUV422Video, bufSize);
#endif

		ret = avpicture_deinterlace(&pic, &pic, PIX_FMT_YUV422P, width, height);

#ifdef _DEBUG
		CM_YUV422PLTOYUV422PK_API(pic.data[0], pic.data[1], pic.data[2], pYUV422Video, bufSize);
#else
		CM_YUV422PLTOYUV422PK_MMX(pic.data[0], pic.data[1], pic.data[2], pYUV422Video, width, height);
#endif
#endif
	}

	return ret;
}
// Thang Do, add for deinterlaced D1, Dec 02, 2011, end
