package i3.mobile.dvrremote.base;

public class FrameHeader 
{
	public int codecType;
	public char resolutionX;
	public char resolutionY;
	public int sourceIndex;
	public int length;	
	public int serverIndex;
	public char originResolutionX;
	public char originResolutionY;
	public int  mainSubStream;
	public long time; //BBB
	public int index; //frame index in a period of time (1 second)

    //lvxt public for debugging
	public FrameHeader()
	{
		sourceIndex = -1;
		serverIndex = -1;
		mainSubStream = -1;
		time = 0;
	}

	FrameHeader(int _codecType, char _resolutionX, char _resolutionY, int _sourceIndex, 
			int _length, char _originResolutionX, char _originResolutionY, int _mainSub,long _time,int _frameIndex)
	{
		codecType = _codecType;
		resolutionX = _resolutionX;
		resolutionY = _resolutionY;
		sourceIndex = _sourceIndex;
		length = _length;
		originResolutionX = _originResolutionX;
		originResolutionY = _originResolutionY;
		mainSubStream = _mainSub;
        time = _time;
		index = _frameIndex;
	}
}