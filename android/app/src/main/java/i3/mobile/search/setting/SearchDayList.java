package i3.mobile.search.setting;

 
import java.util.ArrayList;
import java.util.Collections;

public class SearchDayList {

	private int size = 0;
	private long beginTime = 0;
	boolean init = false;
	public ArrayList<SearchDay> searchDays =  null;
	public long getBeginTime()
	{
		return beginTime;
	}
	public void addNewDay(SearchDay searchDay)
	{
		this.searchDays.add(searchDay);
	}
    
	public boolean hasInit()
	{
		return this.init;
	}
	public int size()
	{
		if(searchDays != null)
		{
			return searchDays.size();
		}
		return 0;
	}
	public boolean isExisting(SearchDay searchday)
	{
	  return this.searchDays.indexOf(searchday) >= 0 ? true : false;
	}
	public boolean isExisting(int day, int month,int year)
	{
		for(int i=0 ;i < this.searchDays.size();i++)
		{
			SearchDay searchDay = this.searchDays.get(i);
			if(searchDay.equal(day, month, year))
				return true;
		}
		return false;
	}
	public void clear ()
	{
		this.searchDays.clear();
		this.size = 0;
		this.beginTime = 0;
		this.init= false;
	}
	public SearchDayList() {
		// TODO Auto-generated constructor stub
	}

	public SearchDayList(int size, long beginTime) {
		this.size = size;
		this.beginTime = beginTime; 
		this.searchDays = new ArrayList<SearchDay>();
		this.init = true;
	}
	
   public void sort()
   {
	   if(searchDays != null)
		  Collections.sort(searchDays);
   }
   
   public SearchDay getFirstItem()
   {
	   if(searchDays != null && searchDays.size() >0)
	   {
		   return searchDays.get(0);
	   }
	   return null;
   }
   
   public SearchDay getLastItem()
   {
	   sort();
	   if(searchDays != null && searchDays.size() >0)
	   {
		   return searchDays.get(searchDays.size() -1);
	   }
	   return null;
   }


	
}

