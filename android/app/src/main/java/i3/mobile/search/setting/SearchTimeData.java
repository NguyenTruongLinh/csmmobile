package i3.mobile.search.setting;

import android.annotation.SuppressLint;

import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;

import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.Locale;
import java.util.TimeZone;

import i3.mobile.base.Utilities;

//import cms.mobile.i3.cmslivesearch.base.Global;


@SuppressLint("DefaultLocale")
public class SearchTimeData {
	int mYear;

	public int getYear() {
		return mYear;
	}

	public void setYear(int mYear) {
		this.mYear = mYear;
	}

	public int getMonth() {
		return mMonth;
	}

	public void setMonth(int mMonth) {
		this.mMonth = mMonth;
	}

	public int getDay() {
		return mDay;
	}

	public void setDay(int mDay) {
		this.mDay = mDay;
	}

	int mMonth;
	int mDay;
	private int mHour;
	private int mMinute;
	int mSecond;
	private int mTimeInterval;
	private long mtimeStamp;// = 1515681000;
	public  static int DEFAULT_INTERVAL_TIME = 60 * 60 * 24 - 1;// default
	private boolean needCalculateTimeStamp = true;
	public SearchTimeData() {
		this.mYear = 2013;
		this.mMonth = 1;
		this.mDay = 1;
		this.setHour(0);
		this.setMinute(0);
		this.mSecond = 0;
		this.setTimeInterval(DEFAULT_INTERVAL_TIME);
	}

	public void setTimeInterval(int timeInterval) {
		this.mTimeInterval = timeInterval;
	}

	public SearchTimeData(int year, int month, int day, int hour, int minute,
                          int second, int timeInterval) {
		this.mYear = year;
		this.mMonth = month;
		this.mDay = day;
		this.mHour = hour;
		this.mMinute = minute;
		this.mSecond = second;
		this.setTimeInterval(timeInterval);
	}

	public SearchTimeData toGMTTime() {
		GregorianCalendar cal = new GregorianCalendar(this.getYear(),
				this.getMonth() - 1, this.getDay(), this.getHour(),
				this.mMinute, 0);
		long millis = cal.getTimeInMillis();
		Timestamp ts = new Timestamp(millis);
		SearchTimeData searchTimeData = new SearchTimeData(ts.getTime() / 1000,
				this.getTimeInterval(), TimeZone.getTimeZone("GMT"));
		return searchTimeData;
	}

	public SearchTimeData(long timeStamp, int timeInterval, TimeZone timeZone) {
		this.setTimeStamp(timeStamp);
		Date localTime = new Date(timeStamp * 1000);
		String format = "yyyy/MM/dd HH:mm:ss";
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		sdf.setTimeZone(timeZone); // default time zone
		String sLocalTime = sdf.format(localTime);
		Calendar mydate = new GregorianCalendar();
		mydate.setTimeZone(timeZone);
		try {
			Date thedate = sdf.parse(sLocalTime);
			mydate.setTime(thedate);
			this.mDay = mydate.get(Calendar.DAY_OF_MONTH);
			this.mMonth = mydate.get(Calendar.MONTH) + 1;
			this.mYear = mydate.get(Calendar.YEAR);
			this.setHour(mydate.get(Calendar.HOUR_OF_DAY));
			this.setMinute(mydate.get(Calendar.MINUTE));
			this.mSecond = mydate.get(Calendar.SECOND);
			this.setTimeInterval(timeInterval);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	public long getLongStamp(TimeZone timeZone) {
		 
		Calendar cal = new GregorianCalendar(this.mYear, this.mMonth - 1,
				this.mDay, this.getHour(), this.getMinute(), this.mSecond);
		cal.setTimeZone(timeZone);
		
		return cal.getTimeInMillis() / 1000;
	}

	public static String getTimeDisplayFull(long timeStamp) {
		Date localTime = new Date(timeStamp * 1000);
		String format = "yyyy/MM/dd HH:mm:ss";
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		sdf.setTimeZone(TimeZone.getDefault()); // default
																	// time zone
		String sLocalTime = sdf.format(localTime);
		return sLocalTime;
	}

	public static String getTimeDisplayFull(long timeStamp, TimeZone tz) {
		Date localTime = new Date(timeStamp * 1000);
		String format = "yyyy/MM/dd HH:mm:ss.SSS";
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		sdf.setTimeZone(tz); // default
		// time zone
		String sLocalTime = sdf.format(localTime);
		return sLocalTime;
	}

	public static long getSecond(long timeStamp, TimeZone tz) {

		DateTimeZone destimeZone = DateTimeZone.forID( tz.getID());
		DateTime desTime = new DateTime(timeStamp * 1000, destimeZone);
		DateTime utc =  desTime.withZone( DateTimeZone.forID("UTC"));

		int year = desTime.getYear();
		int month = desTime.getMonthOfYear();
		int day = desTime.getDayOfMonth();
		int hour = desTime.getHourOfDay();
		int minute = desTime.getMinuteOfHour();
		int sec = desTime.getSecondOfMinute();
		int mil =  desTime.getMillisOfSecond();
		long left = new DateTime(year, month, day, hour, minute, sec, DateTimeZone.UTC).getMillis();
	 	long mili =  left;
	 	return  mili/1000;
	}
	public static long getTimeSecond(long timeStamp, TimeZone tz) {

		Calendar cal = new GregorianCalendar(tz);
		cal.setTimeInMillis(  timeStamp * 1000);
		return cal.getTimeInMillis() / 1000;

	}
	public static String getTimeDisplayFull(long timeStamp, int frameIndex) {
		Date localTime = new Date(timeStamp * 1000);
		String format = "yyyy/MM/dd HH:mm:ss";
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		sdf.setTimeZone(TimeZone.getDefault()); // default
																	// time zone
		String sLocalTime = sdf.format(localTime);
		String sFrameIndex = frameIndex >= 10 ? String.valueOf(frameIndex):"0"+ String.valueOf(frameIndex);
		return sLocalTime+" "+sFrameIndex;
	}

	public static String getTimeDisplayFormatHHMM(long timeStamp) {
		Date localTime = new Date(timeStamp * 1000);
		String format = "HH:mm";
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		sdf.setTimeZone(TimeZone.getDefault()); // default
																	// time zone
		String sLocalTime = sdf.format(localTime);
		return sLocalTime;
	}

	public String getTimeFormatHourMinute() {
		long timeStamp = this.getTtimeStamp();
		if (timeStamp == 0) {
			timeStamp = getLongStamp(TimeZone.getDefault());
		}
		Date localTime = new Date(timeStamp * 1000);
		String format = "HH:mm";
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		sdf.setTimeZone(TimeZone.getDefault()); // default
																	// time zone
		String sLocalTime = sdf.format(localTime);
		return sLocalTime;
	}

//	public static String getTimeDisplayTimeSearch(long timeStamp) {
//		Date localTime = new Date(timeStamp * 1000);
//		String format = "HH:mm";
//		boolean is24h = DateFormat.is24HourFormat(Global.curActivity);
//		if (!is24h) {
//			format = "hh:mm aa";
//		}
//		SimpleDateFormat sdf = new SimpleDateFormat(format);
//		sdf.setTimeZone(TimeZone.getDefault()); // default
//																	// time zone
//		String sLocalTime = sdf.format(localTime);
//	    sLocalTime = sLocalTime.toUpperCase();
//		return sLocalTime;
//	}

	//Carefully using this function
	public static SearchTimeData getAnyDay(TimeZone timeZone) {
		Calendar calendar = Calendar.getInstance();
		int defaultInterval = Utilities.getDefaultTimeInterval(calendar.get(Calendar.YEAR),calendar.get(Calendar.MONTH)+1,
				calendar.get(Calendar.DAY_OF_MONTH),timeZone);
		SearchTimeData searchTimeData = new SearchTimeData(
				calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH) + 1,
				calendar.get(Calendar.DAY_OF_MONTH), 0, 0, 0,
				defaultInterval);
		return searchTimeData;

	}


	public String getDateLabel() {
		String input_date = String.valueOf(this.mDay) + "/"
				+ String.valueOf(this.mMonth) + "/"
				+ String.valueOf(this.mYear);
		String dayString = "";

		try {
			SimpleDateFormat format1 = new SimpleDateFormat("dd/MM/yyyy",
					Locale.getDefault());
			Date dt1 = format1.parse(input_date);
			SimpleDateFormat format2 = new SimpleDateFormat(
					"EEEE, MMMM dd yyyy", Locale.getDefault());
			dayString = format2.format(dt1);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		return dayString;
	}

	public String convertTimetoXmlType() {
		String timeRequest = "%d:%d:%d:%d:%d:%d";
		return String.format(Locale.getDefault(), timeRequest, mYear, mMonth,
				mDay, getHour(), getMinute(), mSecond);
	}

	public String getDisplayMinute() {
		String minute = "%d:%d";
		return String.format(Locale.getDefault(), minute, getMinute(), mSecond);
	}

	public String convertIntervaltoXmlType() {
		return String.valueOf(this.getTimeInterval());
	}

	public long getTtimeStamp() {
		return mtimeStamp;
	}

	public void setTimeStamp(long mtimeStamp) {
		this.setNeedCalculateTimeStamp(false);
		this.mtimeStamp = mtimeStamp;
	}

	public int getTimeInterval() {
		return mTimeInterval;
	}

	public int getTimeintervalMinute() {
		return mTimeInterval / 60;
	}

	public int getHour() {
		return mHour;
	}

	public void setHour(int mHour) {
		this.mHour = mHour;
	}

	public int getMinute() {
		return mMinute;
	}

	public void setMinute(int mMinute) {
		this.mMinute = mMinute;
	}
	
	public void setSecond(int second)
	{
		this.mSecond = second;
	}

	public boolean isNeedCalculateTimeStamp() {
		return needCalculateTimeStamp;
	}

	public void setNeedCalculateTimeStamp(boolean needCalculateTimeStamp) {
		this.needCalculateTimeStamp = needCalculateTimeStamp;
	}
	 
}
