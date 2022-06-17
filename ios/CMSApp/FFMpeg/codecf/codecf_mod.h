#ifndef _I3_CODEF_MOD_H_
#define _I3_CODEF_MOD_H_

#include "CodecWrapper.h"
#include "libavcodec/avcodec.h"

class Codecf_Mod
{
public:
	Codecf_Mod ();
	~Codecf_Mod ();

	HANDLE	Decoder_Init (I3VDEC_PARAM* parm);
	void	Decoder_Destroy ();
	int		Decoder_Decode (I3VDEC_FRAME* parm);
	int		Decoder_GetDimension (int* pw, int* ph);
	int		Decoder_Deinterlace(unsigned char* pYUV422Video, int bufSize, int width, int height);		// Thang Do, add for deinterlaced D1, Dec 02, 2011

	int		m_frameWidth;
	int		m_frameHeight;

    static unsigned long GetCodecId(){ return CODEC_ID(I3CODE_DECODER, 'F', 'M', 'P', 'G');}
private:

	AVCodecContext* m_avcodecContext;
	AVFrame* m_avFrame;
	AVCodec* m_avcodec;

	BYTE* m_pDeinterlaced;		// Thang Do, add for deinterlaced D1, Dec 02, 2011
};

//typedef std::vector<Codecf_Mod*> Codecf_Array;

#endif
