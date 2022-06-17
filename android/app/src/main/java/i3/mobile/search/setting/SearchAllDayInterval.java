package i3.mobile.search.setting;

 
import i3.mobile.base.Constant;

public class SearchAllDayInterval {

	SearchDayInterval[] baseSearchDay = new SearchDayInterval[Constant.MAX_SERVER_CHANNEL];

	public SearchAllDayInterval() {

	}
	public void testMethod(int channel)
	{
		this.baseSearchDay[channel] = new SearchDayInterval(123, 10);
	}

	public void clear() {
		for (int i = 0; i < baseSearchDay.length; i++) {
			this.baseSearchDay[i] = null;
		}
	}

	public void add(SearchDayInterval searchDayInterval, int channel) {
		this.baseSearchDay[channel] = searchDayInterval;
	}
	/**
	 * get size of having data channels
	 * @return
	 */
	public int getSize()
	{
		int size = 0;
		for (int i = 0; i < baseSearchDay.length; i++) {
			if(this.baseSearchDay[i] != null)
			{
				size ++;
			}
		}
		return size;
	}
	
	/**
	 * Return true if channel have data on this day otherwise return fasle
	 * @param channelId
	 * @return true or false
	 */
	public boolean isExisting(int channelId)
	{
		
		 if(this.baseSearchDay[channelId] != null)
		 {
			 return true;
		 }
		 return false;
	}

	public SearchDayInterval getSearchDayOfChannel(int channel)
	{ 
		if(baseSearchDay == null)
			return null;
		return baseSearchDay[channel];
	}
	
	public int getFirstChannelHaveData()
	{
		if(baseSearchDay == null)
			return -1;
		for(int i = 0 ;i < baseSearchDay.length;i++)
		{
			if (baseSearchDay[i] != null)
			{
				return i;
			}
		}
		return -1;
	}
}
