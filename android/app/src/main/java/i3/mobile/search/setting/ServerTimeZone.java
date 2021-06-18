package i3.mobile.search.setting;


import java.util.TimeZone;

import i3.mobile.base.TimeZoneList;

public class ServerTimeZone {

	 int bias;
	 public int getBias() {
		return bias;
	}
	public void setBias(int bias) {
		this.bias = bias;
	}
	public String getStandardName() {
		return standardName;
	}
	public void setStandardName(String standardName) {
		this.setTimeZone(TimeZoneList.getTimeZonefromWindowsStandardName(standardName));
		this.standardName = standardName; 
	}
	public String getDaylightName() {
		return daylightName;
	}
	public void setDaylightName(String daylightName) {
		this.daylightName = daylightName;
	}
	public int getDaylightBias() {
		return daylightBias;
	}
	public void setDaylightBias(int daylightBias) {
		this.daylightBias = daylightBias;
	}
	public int getDlYear() {
		return dlYear;
	}
	public void setDlYear(int dlYear) {
		this.dlYear = dlYear;
	}
	public int getDlMonth() {
		return dlMonth;
	}
	public void setDlMonth(int dlMonth) {
		this.dlMonth = dlMonth;
	}
	public int getDlDayofWeek() {
		return dlDayofWeek;
	}
	public void setDlDayofWeek(int dlDayofWeek) {
		this.dlDayofWeek = dlDayofWeek;
	}
	public int getDlDay() {
		return dlDay;
	}
	public void setDlDay(int dlDay) {
		this.dlDay = dlDay;
	}
	public int getDlMinute() {
		return dlMinute;
	}
	public void setDlMinute(int dlMinute) {
		this.dlMinute = dlMinute;
	}
	public int getDlSecond() {
		return dlSecond;
	}
	public void setDlSecond(int dlSecond) {
		this.dlSecond = dlSecond;
	}
	public int getDlMiliSecond() {
		return dlMiliSecond;
	}
	public void setDlMiliSecond(int dlMiliSecond) {
		this.dlMiliSecond = dlMiliSecond;
	}
	public TimeZone getTimeZone() {
		return timeZone;
	}
	void setTimeZone(TimeZone timeZone) {
		this.timeZone = timeZone;
	}
	/**
	 * @return the dlHour
	 */
	int getDlHour() {
		return dlHour;
	}
	/**
	 * @param dlHour the dlHour to set
	 */
	void setDlHour(int dlHour) {
		this.dlHour = dlHour;
	}
	String standardName;

	 String daylightName;
	 int daylightBias;
	 
	 int dlYear;
	 int dlMonth;
	 int dlDayofWeek;
	 int dlDay;
	 private int dlHour;
	 int dlMinute;
	 int dlSecond;
	 int dlMiliSecond;
	 private TimeZone timeZone;
	 
}
