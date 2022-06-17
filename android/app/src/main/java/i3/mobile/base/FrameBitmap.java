package i3.mobile.base;

import android.graphics.Bitmap;

public class FrameBitmap
{
	public FrameHeader header;
	public Bitmap bmp ;
	
	 
	public FrameBitmap()
	{
		header = new FrameHeader();
		bmp = null;
		 
	}
	public FrameBitmap(FrameHeader header, Bitmap bmp)
	{
		this.header = header;
		this.bmp = bmp;
	}
}

