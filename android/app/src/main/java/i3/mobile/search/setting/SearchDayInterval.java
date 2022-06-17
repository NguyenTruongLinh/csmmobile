package i3.mobile.search.setting;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;

public class SearchDayInterval { 
	
	 long time;
	 int size; //number of time parts
	 ArrayList<SearchTimeInterval> baseSearchTime = null;
	 boolean isSort = false;
	 public SearchDayInterval(long time, int size)
	 {
		 baseSearchTime = new ArrayList<SearchTimeInterval>();
		 this.time = time;
		 this.size = size;
		 isSort = false;
	 }
	 public ArrayList<SearchTimeInterval>  gets()
	 {
	 	return  baseSearchTime;
	 }


	 public void addItem(SearchTimeInterval searchTime)
	 {
		 if(baseSearchTime != null)
		 {
			 baseSearchTime.add(searchTime);
			 size = baseSearchTime.size();
		 }
	 }

	 public SearchTimeInterval getItem(int index)
	 {
		 if(!isSort)
		 {
			 sortIncrease();
			 isSort = true;
		 }
		 if(baseSearchTime != null && baseSearchTime.size() >0)
		 {
			 return baseSearchTime.get(index);
		 }
		 return null;
	 }
	 public void clear()
	 {
		 if(baseSearchTime != null)
		 {
			 baseSearchTime.clear();
			 baseSearchTime = null;
			 size = 0;
			 isSort =false;
		 }
	 }

	 public SearchTimeInterval getBeginTimeOfDay()
	 {

		 if(size >= 0)
		 {
			 if(!isSort)
			 {
				 sortIncrease();
				 isSort = true;
			 }
			 return baseSearchTime.get(0);
		 }

		 return null;
	 }
	 public void sortIncrease()
	 {
	    Collections.sort(baseSearchTime, new Comparator<SearchTimeInterval>() {
	        @Override
	        public int compare(SearchTimeInterval searchInterval1, SearchTimeInterval searchInterval2)
	        {
	            return (int) (searchInterval1.end -searchInterval2.end);
	        }
	    }); //Increase

	 }
	 public SearchTimeInterval getEndTimeOfDay()
	 {
		 
		 if(size >= 0)
		 {
			 if(!isSort)
			 {
				 sortIncrease();
				 isSort = true;
			 }
			 return baseSearchTime.get(baseSearchTime.size()-1);
		 }
		
		 return null;
	 }
	 public int size()
	 {
		 return size;
	 }
	 
}
