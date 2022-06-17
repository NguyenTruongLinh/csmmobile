package i3.mobile.search.setting;

public class SearchTimeInterval {

	int id; // id of sensor or motion in case of searching sensor or motion.
	long time; // active time of sensor or motion
	long begin; // begin time in seconds
	long end; // end time in seconds
	int type; // RecordType

	public SearchTimeInterval() {

	}

	public SearchTimeInterval(int id, long time, long begin, long end, int type) {
		this.id = id;
		this.time = time;
		this.begin = begin;
		this.end = end;
		this.type = type; 
	}
	public  int getId()
	{
		return  this.id;
	}
	public long getTime()
	{
		return  this.time;
	}
	public long getBegin()
	{
		return this.begin;
	}
	
	public long getEnd()
	{
		return this.end;
	}
	
	public int getType()
	{
		return this.type;
	}


	public static boolean oneMinuteData(SearchTimeInterval searchTime)
	{
		return searchTime.begin == searchTime.end;
	}
	
	public boolean haveData(long time)
	{
		if(this.begin <= time && this.end >= time)
			return true;
		return false;
	}

}
