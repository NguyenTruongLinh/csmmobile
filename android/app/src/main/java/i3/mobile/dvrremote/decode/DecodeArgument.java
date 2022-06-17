package i3.mobile.dvrremote.decode;
 
public class DecodeArgument
{

	boolean isIFrame = false;
	long  time;
	int index;
	public DecodeArgument()
	{
		this.isIFrame = false;
		this.time = 0;
		this.index = 0;
	}
	public DecodeArgument(boolean isIFrame,long time,int index)
	{
		// TODO Auto-generated constructor stub
		this.isIFrame = isIFrame;
		this.time = time;
		this.index = index;
	}
	public void setData(boolean isIFrame,long time,int index)
	{
		this.isIFrame = isIFrame;
		this.time = time;
		this.index = index;
	}
	public boolean isIFrame() {
		return isIFrame;
	}
	public void setIFrame(boolean isIFrame) {
		this.isIFrame = isIFrame;
	}
	public long getTime()
	{
		return time;
	}
	public void setTime(long time) {
		this.time = time;
	}
	public int getIndex() {
		return index;
	}
	public void setIndex(int index) {
		this.index = index;
	}
	
}
