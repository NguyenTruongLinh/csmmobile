package i3.mobile.dvrremote.decode;

// import i3.mobile.dvrremote.base.Global;
// import i3.mobile.dvrremote.base.FrameBitmap;
// import i3.mobile.dvrremote.base.Global;
// import i3.mobile.dvrremote.base.I3Exception;

import android.graphics.Bitmap;
import android.util.Base64;

import java.io.ByteArrayOutputStream;

import i3.mobile.search.setting.SearchAllDayInterval;


public class FFMPEGDecoder {
	//http://stackoverflow.com/questions/21188711/read-settings-secure-from-the-ndk-invalid-indirect-reference-in-decodeindirect
    public static final int DECODE_NOT_FOUND  = 0;
    public static final int DECODE_LOCK 	    = 1;
    public static final int DECODE_UNLOCK     = 2;
    
	static {
        /*
		try {
			
			System.loadLibrary("avutil-52");
	        System.loadLibrary("avcodec-55");
	        System.loadLibrary("avformat-55");
	        System.loadLibrary("swscale-2");
	        System.loadLibrary("i3decoder");


	        
	    } catch (UnsatisfiedLinkError e) {
	      I3Exception.writeErrorLog(e.toString());
	    }
	    */

    }
	public void LoadLib()
	{
		// System.loadLibrary("crystax");
		// System.loadLibrary("ijkffmpeg");
		// System.loadLibrary("Corei3");
		System.loadLibrary("avcodec-57");
		System.loadLibrary("avfilter-6");
		System.loadLibrary("avformat-57");
		System.loadLibrary("avutil-55");
		System.loadLibrary("c++_shared");
		System.loadLibrary("i3decoder");
		System.loadLibrary("swresample-2");
		System.loadLibrary("swscale-4");
	}

	public /*static*/ native boolean naDecodeImage(Bitmap bitmap /*Bitmap for live view*/,int requestWidth, 
			int requestHeight,byte[] dataEncode /*Data encode*/,int channel, boolean isSnapShot,Integer index/*For decode group*/,boolean oneImage);

	public static native long[] getSearchDaylist(byte[] dataDaylist);
	public static native void getSearchInformation(byte[] dataChannel,SearchAllDayInterval searchInfo);
	public static native void getArgument(byte[] dataEncode,DecodeArgument argument);
	// public static native boolean isIFrame(byte[] dataEncode);
	// public static native long getTime(byte[] dataEncode);
	// public static native int  getFrameIndex(byte[] dataEncode);
	// public /*static*/ native void getArgument(byte[] dataEncode,DecodeArgument argument); 
	public native void destroyFFMEGContext(int videoSource); 
	// public static native int getDecodeStatus(int videoSource);
	// public /*static*/ native void getSearchInformation(byte[] dataChannel,SearchAllDayInterval searchInfo);
	// public static native long[] getSearchDaylist(byte[] dataDaylist);
	/**
	 * Decode a frame to bitmap using ffmpeg library
	 * @param frameBitmap : input 
	 * @param dataEncode  : data for ffmpeg decoding
	 * @return null if can't decode or FrameBitmap 
	 */



	/*public static FrameBitmap decodeImage(FrameBitmap frameBitmap, byte[] dataEncode, int channelId, boolean isSnapShot)
	{
		  
		frameBitmap.bmp = Bitmap.createBitmap(frameBitmap.header.resolutionX,
				frameBitmap.header.resolutionY, Bitmap.Config.ARGB_8888);
		Integer index = frameBitmap.header.index;
		FFMPEGDecoder ffmpeg = new FFMPEGDecoder();
		boolean result = ffmpeg.naDecodeImage(frameBitmap.bmp,
				frameBitmap.header.resolutionX, frameBitmap.header.resolutionY,
				dataEncode, channelId, isSnapShot, index, false);

		if(result)
        {
			frameBitmap.header.index = index.intValue();//need for counting fps

			return frameBitmap;
		}
		return null;
	}


	public static FrameBitmap decodeImageThumbnail(FrameBitmap frameBitmap,byte[] dataEncode, int channel)
	{
		 //decode thumbnail always stretch 
		 int width = Global.curActivity.getResources().getDimensionPixelSize(R.dimen.thumbnail_width);
		
		 int height = Global.curActivity.getResources().getDimensionPixelSize(R.dimen.thumbnail_height);
		 
		 I3Exception.writeErrorLog("size of thumbnail: width: "+String.valueOf(width) +"  height: "+String.valueOf(height));
		 
		 frameBitmap.header.resolutionX  =(char) width;
		 frameBitmap.header.resolutionY  = (char)height; 
		 
		 frameBitmap.bmp = Bitmap.createBitmap(frameBitmap.header.resolutionX,frameBitmap.header.resolutionY,Bitmap.Config.ARGB_8888);
		 
		 Integer index = frameBitmap.header.index;
		 FFMPEGDecoder ffmpeg = new FFMPEGDecoder();
		 boolean result = ffmpeg.naDecodeImage(frameBitmap.bmp,
				 frameBitmap.header.resolutionX,
				 frameBitmap.header.resolutionY,
				 dataEncode, channel, false, index, true);
		 if(result)
		 {
			  frameBitmap.header.index = index.intValue(); 
			  return frameBitmap;
         }
		 return null; 
	}


	
	/*public static Bitmap getBitmapFromDataEncode(int width, int height, byte[] data, int channelId, int serverVersion)
	{
		Global.LoadLib();
		Bitmap bmp = Bitmap.createBitmap(width,
				height, Bitmap.Config.ARGB_8888);
		DataInputStream mainData = Global.ConvertByteArrayToDataInputStream(data);
		FrameHeader header = Global.ReceiveFrameHeader(mainData, serverVersion);
		byte[] encodeData = Global.ReceiveEncodeFrame(mainData, header.length);


		if(encodeData != null)
		{
			FFMPEGDecoder ffmpeg = new FFMPEGDecoder();
			boolean result = ffmpeg.naDecodeImage(bmp,
					width, height,
					encodeData, channelId, false, header.index, true);

			if(result)
			{
				return bmp;
			}
		}
		return null;
	}*/
	public static String convertBitmapToBase64(Bitmap bitmap)
	{
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);

		return Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP);
	}
}
