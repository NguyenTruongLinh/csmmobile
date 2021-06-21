//codecf.cpp
//use code from FFmpeg to make encoder and decoder
//now, this project only support H.264 decoder, will add more functions in the future

unsigned long			g_CodecID = CODEC_ID(I3CODE_DECODER, 'F', 'M', 'P', 'G');

#include "codecf.h"
#include "codecf_mod.h"

Codecf_Array			g_CodecfChannels;

// Get codec ID
unsigned long GetCodecId()
{
	return g_CodecID;
}

// find a decoder channel
Codecf_Mod* FindChannel (HANDLE handle)
{
	for (Codecf_Array::iterator it = g_CodecfChannels.begin(); it < g_CodecfChannels.end(); it++)
	{
		Codecf_Mod* pMod = *it;
		if ((HANDLE) pMod == handle)
			return pMod;
	}

	return NULL;
}

// init a decoder channel
HANDLE Decoder_Init(I3VDEC_PARAM* parm)
{
	Codecf_Mod* pMod = new Codecf_Mod ();

	HANDLE ret = pMod->Decoder_Init (parm);
	g_CodecfChannels.push_back(pMod);

    return ret;
}

// destroy a decoder channel
void Decoder_Destroy(HANDLE handle)
{
	for (Codecf_Array::iterator it = g_CodecfChannels.begin(); it < g_CodecfChannels.end(); it++)
	{
		Codecf_Mod* pMod = *it;
		if ((HANDLE) pMod == handle) 
		{
			pMod->Decoder_Destroy();
			delete pMod;

			g_CodecfChannels.erase(it);
			break;
		}
	}
}

// decode a video frame
int Decoder_Decode(HANDLE handle, I3VDEC_FRAME* parm)
{
	int ret = I3CODE_ERROR_OK;

	Codecf_Mod* pMod = FindChannel (handle);
	if (NULL != pMod)
	{
		ret = pMod->Decoder_Decode(parm);
	}

	return ret;
}

// get image width and height
int Decoder_GetDimension(HANDLE handle, unsigned char* encodedVideo, int bufSize, int* pw, int* ph)
{
	if (handle == NULL)
		return I3CODE_ERROR_FAIL;

	int ret = I3CODE_ERROR_OK;


	Codecf_Mod* pMod = FindChannel (handle);
	if (NULL != pMod)
	{
		pMod->Decoder_GetDimension(pw, ph);
	}
	else
	{
		ret = I3CODE_ERROR_FAIL;
	}

	return ret;
}
// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
int Decoder_Deinterlace(HANDLE handle, unsigned char* pYUV422Video, int bufSize, int width, int height)
{
	if (handle == NULL)
		return I3CODE_ERROR_FAIL;

	int ret = I3CODE_ERROR_OK;

	Codecf_Mod* pMod = FindChannel (handle);
	if (NULL != pMod)
	{
		pMod->Decoder_Deinterlace(pYUV422Video, bufSize, width, height);
	}
	else
	{
		ret = I3CODE_ERROR_FAIL;
	}

	return ret;
}
// Thang Do, add for deinterlaced D1, Dec 02, 2011, end
