#ifndef _I3_CODECF_H_
#define _I3_CODECF_H_


unsigned long   GetCodecId();
unsigned long   Decoder_Init(I3VDEC_PARAM*);
void            Decoder_Destroy(HANDLE);
int             Decoder_Decode(HANDLE, I3VDEC_FRAME*);
int             Decoder_GetDimension(HANDLE, unsigned char*, int, int*, int*);

// Thang Do, add for deinterlaced D1, Dec 02, 2011, begin
int 	Decoder_Deinterlace(HANDLE handle, unsigned char* rawVideo,
																		int bufSize, int width, int height);
// Thang Do, add for deinterlaced D1, Dec 02, 2011, end

#endif	//	_I3_CODECF_H_
