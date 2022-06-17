package i3.mobile.search.setting;

import org.joda.time.DateTime;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public class SearchDay implements Comparable<SearchDay> {
	private long timeUTC = 0;
	private int day = 0;
	private int month = 0;
	private int year = 0;
	private  int hour = 0;
	private  int minutes = 0;
	private int second = 0;
	TimeZone timeZone;
	public SearchDay(long timeUTC, TimeZone timeZone) {
		// TODO Auto-generated constructor stub
		this.timeUTC = timeUTC;
		this.timeZone = timeZone;
		this.convertUTCTime();
		
	}
	public boolean equal(int day,int month,int year)
	{
		if(this.getDay() == day && this.getMonth() == month && this.getYear() == year)
			return true;
		return false;
	}
	private void convertUTCTime() { 
		Date localTime = new Date(timeUTC*1000);
		String format = "yyyy/MM/dd HH:mm:ss";
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		sdf.setTimeZone(this.timeZone);  //time zone of server
		String sLocalTime = sdf.format(localTime);
		//Calendar mydate = new GregorianCalendar();

		//Date thedate = sdf.parse(sLocalTime); 
		//mydate.setTime(thedate);
		this.setDay(sdf.getCalendar().get(Calendar.DAY_OF_MONTH));
		this.setMonth(sdf.getCalendar().get(Calendar.MONTH) + 1);
		this.setYear(sdf.getCalendar().get(Calendar.YEAR));
		this.setHour(sdf.getCalendar().get(Calendar.HOUR));
		this.setMin(sdf.getCalendar().get(Calendar.MINUTE));
		this.setSec(sdf.getCalendar().get(Calendar.SECOND));
	}
	@Override
	public int compareTo(SearchDay another) {
		// TODO Auto-generated method stub
		if(this.timeUTC > another.timeUTC)
		{
			return 1;
		}
		else if(this.timeUTC < another.timeUTC)
		{
			return -1;
		}
		return 0;
	}
	public int getDay() {
		return day;
	}
	public void setDay(int day) {
		this.day = day;
	}
	public int getMonth() {
		return month;
	}
	public void setMonth(int month) {
		this.month = month;
	}
	public int getYear() {
		return year;
	}
	public void setYear(int year) {
		this.year = year;
	}
	public void  setHour(int hour)
	{
		this.hour = hour;
	}
	public int getHour()
	{
		return  this.hour;
	}

	public void setMin(int min)
	{
		this.minutes = min;
	}
	public int getMin()
	{
		return  this.minutes;
	}

	public void setSec(int second){

		this.second = second;
	}

	public  int getSec(){
		return  this.second;
	}

	public long toLong()
	{
		DateTime result =  new DateTime(this.year,this.month,this.day,this.hour,this.minutes,this.second);
		return result.getMillis();
	}
	@Override
	public String toString() {

		String s_day ="";
		if(day < 10)
		{
			s_day = "0"+ Integer.toString(day);
		}
		else
			s_day =  Integer.toString(day);


		String s_month ="";
		if(month < 10)
		{
			s_month = "0"+ Integer.toString(month);
		}
		else
			s_month =  Integer.toString(month);


		String s_hour = this.hour < 10 ? "0"+String.valueOf(this.hour) :  String.valueOf(this.hour);
		String s_min = this.minutes < 10 ? "0"+String.valueOf(this.minutes) :  String.valueOf(this.minutes);
		String s_sec = this.second < 10 ? "0"+String.valueOf(this.second) :  String.valueOf(this.second);

		return  s_day+"/"+ s_month+"/"+Integer.toString(year)+" "+s_hour+":"+s_min+":"+s_sec ;
	}
	public String toString(int format)
	{
			switch (format)
			{
				case 1:
				{

					String s_day ="";
					if(day < 10)
					{
						s_day = "0"+ Integer.toString(day);
					}
					else
						s_day =  Integer.toString(day);


					String s_month ="";
					if(month < 10)
					{
						s_month = "0"+ Integer.toString(month);
					}
					else
						s_month =  Integer.toString(month);
					String s_hour = this.hour < 10 ? "0"+String.valueOf(this.hour) :  String.valueOf(this.hour);
					String s_min = this.minutes < 10 ? "0"+String.valueOf(this.minutes) :  String.valueOf(this.minutes);
					String s_sec = this.second < 10 ? "0"+String.valueOf(this.second) :  String.valueOf(this.second);
					return  Integer.toString(year) + "-" + s_month + "-" + s_day;
				}
				default:
					return this.toString();


			}

	}

}
