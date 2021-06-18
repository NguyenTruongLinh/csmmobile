package i3.mobile.base;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Paint;
import android.graphics.Rect;
import android.hardware.Camera;
import android.hardware.Camera.Size;
import android.net.DhcpInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.text.Html;
import android.util.DisplayMetrics;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ListAdapter;
import android.widget.ListView;
import android.widget.RelativeLayout.LayoutParams;
import android.widget.TextView;

import org.joda.time.DateMidnight;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.text.DateFormatSymbols;
import java.util.Calendar;
import java.util.Enumeration;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import i3.mobile.search.setting.SearchTimeData;

//import i3.mobile.dvrremote.base.Constant;
//import i3.mobile.dvrremote.base.Global;
//import i3.mobile.search.SearchTabPage;
//import i3.mobile.search.setting.SearchTimeData;
//import i3.mobile2.R;
//import cms.mobile.i3.cmslivesearch.R;
//import cms.mobile.i3.cmslivesearch.base.*;


@SuppressWarnings("deprecation")
public class Utilities {
	/**
	 * Get current day like Month Day, Year
	 * 
	 * @return
	 */
	public static final int DEBUG = 0;
	public static final int RELEASE = 1;

	/**
	 * Change on build new package
	 * 
	 * @return
	 */
	public static int getCurrentSRXBuildStatus() {
		return RELEASE;
	}

	public static String getCurrentDay() {
		Calendar calendar = Calendar.getInstance();
		StringBuilder result = new StringBuilder();
		String month = new DateFormatSymbols().getMonths()[calendar
				.get(Calendar.MONTH)];
		result.append(month + " " + calendar.get(Calendar.DAY_OF_MONTH) + ", "
				+ calendar.get(Calendar.YEAR));
		return result.toString();
	}

	public static String getBuildDay() {

		return new String("Build: August 01, 2017 - 2.5.2.0");
	}

	public static CharSequence getBuildInformation() {
		CharSequence dialogAboutHtmlContent = Html
				.fromHtml("<h4><b>Software version</b></h4>"
						+ "SRX-Pro Mobile Remote v2.4 <br>"
						+ "Build: "
						+ Utilities.getBuildDay()
						+ "<br>"
						+ "@ Copyright 2016 i3 International Inc. All rights reserved. <br>"
						+ "<h4><b>Policies</b></h4>"
						+ "<a href=\"http://www.i3international.com/index.php/en/company-policies\">http://www.i3international.com/index.php/en/company-policies</a>"
						+ "<h4><b>Privacy Policy</b></h4>"
						+ "<a href=\"http://www.i3international.com/index.php/en/privacy-policy\">http://www.i3international.com/index.php/en/privacy-policy</a> ");

		return dialogAboutHtmlContent;
	}

	public static int calcSizeTextView(TextView textView, double expectedSize,
                                       String text) {
		Rect bounds = new Rect(0, 0, 0, 0);
		int curSize = 5;
		while (bounds.width() < expectedSize) {
			textView.setTextSize(curSize);
			Paint textPaint = textView.getPaint();
			textPaint.getTextBounds(text, 0, text.length(), bounds);
			curSize++;
		}
		if (curSize > 25) {
			curSize = 25;
		}
		return curSize;

	}

	public static void setListViewHeightBasedOnChildren(ListView listView) {
		ListAdapter listAdapter = listView.getAdapter();
		if (listAdapter == null) {
			// pre-condition
			return;
		}

		int totalHeight = 0;
		for (int i = 0; i < listAdapter.getCount(); i++) {
			View listItem = listAdapter.getView(i, null, listView);
			listItem.measure(0, 0);
			totalHeight += listItem.getMeasuredHeight();
		}
		int listViewHeight = totalHeight
				+ (listView.getDividerHeight() * (listAdapter.getCount() - 1));
		ViewGroup.LayoutParams params = new LayoutParams(
				LayoutParams.MATCH_PARENT, listViewHeight);
		listView.setLayoutParams(params);
	}

	public static double getRealDisplaySize(Activity ctx) {
		DisplayMetrics dm = new DisplayMetrics();
		ctx.getWindowManager().getDefaultDisplay().getMetrics(dm);
		double screenInches = Math.sqrt(Math.pow(dm.widthPixels / dm.xdpi, 2)
				+ Math.pow(dm.heightPixels / dm.xdpi, 2));
		return screenInches;
	}

	public static boolean isTopActivity(Context ctx) {
		boolean result = false;
		ActivityManager mngr = (ActivityManager) ctx
				.getSystemService(Context.ACTIVITY_SERVICE);
		List<ActivityManager.RunningTaskInfo> taskList = mngr
				.getRunningTasks(10);
		if (taskList.get(0).topActivity.getClassName().equals(
				ctx.getClass().getName())) {
			result = true;
		}
		return result;
	}

	public static boolean inSearchMode() {
		//if (Global.curActivity == SearchTabPage.context)
		//	return true;
		//return false;
		return  true;
	}

	public static int calculateTimeSearchWidth(int width, int numberOfMinute) {
		int newWidth = width;
		while (true) {
			if (newWidth % numberOfMinute == 0) {
				break;
			}
			newWidth--;
		}
		return newWidth;
 
	}
//
//	public static int getPixelFromSP(int sp) {
//		return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, sp,
//				Global.curActivity.getResources().getDisplayMetrics());
//	}
//
//	public static float getPixelFromDIP(int dip) {
//		return (float) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP,
//				dip, Global.curActivity.getResources().getDisplayMetrics());
//	}

	public static boolean dayBeginOfDST(int year, int month, int day,
                                        TimeZone timeZone, SearchTimeData beginDST) {
		// We try going to next day from input day
		// If the day in DST and previous transition day same with the input day
		// The day is beginning DST of this year
		Calendar date = new GregorianCalendar(year, month - 1, day + 1); // next
																			// day
		date.setTimeZone(timeZone);
		boolean inDayLight = timeZone.inDaylightTime(date.getTime());

		DateMidnight today = new DateMidnight(date);
		DateTimeZone zone = today.getZone();

		DateTime previousTransition = new DateTime(
				zone.previousTransition(today.getMillis()));

		if (inDayLight && previousTransition.getYear() == year
				&& previousTransition.getMonthOfYear() == month
				&& previousTransition.getDayOfMonth() == day) {
			SearchTimeData temp = new SearchTimeData(
					previousTransition.getMillis() / 1000, 1000, timeZone);
			beginDST.setDay(temp.getDay());
			beginDST.setYear(temp.getYear());
			beginDST.setMonth(temp.getMonth());
			beginDST.setMinute(temp.getMinute());
			beginDST.setHour(temp.getHour());
			beginDST.setTimeStamp(temp.getTtimeStamp());
			return true;
		}
		return false;
	}

	public static boolean dayEndOfDST(int year, int month, int day,
                                      TimeZone timeZone, SearchTimeData endDST) {
		Calendar date = new GregorianCalendar(year, month - 1, day);
		date.setTimeZone(timeZone);
		boolean inDayLight = timeZone.inDaylightTime(date.getTime());

		DateMidnight today = new DateMidnight(date);
		DateTimeZone zone = today.getZone();

		DateTime nextTransition = new DateTime(zone.nextTransition(today
				.getMillis()));

		if (inDayLight && nextTransition.getYear() == year
				&& nextTransition.getMonthOfYear() == month
				&& nextTransition.getDayOfMonth() == day) {
			SearchTimeData temp = new SearchTimeData(
					nextTransition.getMillis() / 1000, 1000, timeZone);
			endDST.setDay(temp.getDay());
			endDST.setYear(temp.getYear());
			endDST.setMonth(temp.getMonth());
			endDST.setMinute(temp.getMinute());
			endDST.setHour(temp.getHour());
			endDST.setTimeStamp(temp.getTtimeStamp());
			return true;
		}
		return false;
	}

	public static int getDefaultTimeInterval(int year, int month, int day,
			TimeZone timeZone) {
		int timeInterval = 24 * 60 * 60 - 1;
		SearchTimeData data = new SearchTimeData();
		if (Utilities.dayBeginOfDST(year, month, day, timeZone, data)) {
			timeInterval -= timeZone.getDSTSavings() / 1000;
		} else if (Utilities.dayEndOfDST(year, month, day, timeZone, data)) {
			timeInterval += timeZone.getDSTSavings() / 1000;
		}
		return timeInterval;
	}

//	public static Size2D getThumbnailSize() {
//		int width = Global.curActivity.getResources().getDimensionPixelSize(
//				R.dimen.activity_vertical_margin);
//		int height = Global.curActivity.getResources().getDimensionPixelSize(
//				R.dimen.activity_vertical_margin);
//		return new Size2D(width, height);
//	}

	public static boolean checkSearchPrivilege(int serverIndex) {
		boolean result = false;
		int numberPrivilege = 0;
//		if (Global.dropActiveServerVals != null
//				&& Global.ConnectedServerList[serverIndex] != null) {
//
//			for (int i = 0; i < Global.settings[serverIndex].maxChannelSupport; i++) {
//				if (Global.settings[serverIndex].serverChannelConfig1[i].isSearchViewAllow) {
//					numberPrivilege++;
//				}
//			}
//			if (numberPrivilege > 0) {
//				result = true;
//			}
//		}

		return result;
	}

	public static boolean existingServerSupportSearching() {
		boolean result = false;
//		for (int begin = 0; begin < Constant.MAX_SERVER_CONNECTION; begin++) {
//
//			if (Global.dropActiveServerVals != null
//					&& Global.ConnectedServerList != null
//					&& Global.ConnectedServerList[begin] != null) {
//
//				if (Global.ConnectedServerList[begin].serverVersion >= Constant.EnumServerVersion.VERSION_SUPPORT_SEARCHING
//						&& checkSearchPrivilege(begin))
//					return true;
//
//			}
//		}
		return result;
	}

	public static boolean isLastOneActivity(Context context) {
		boolean result = false;
		ActivityManager mngr = (ActivityManager) context
				.getSystemService(Context.ACTIVITY_SERVICE);

		List<ActivityManager.RunningTaskInfo> taskList = mngr
				.getRunningTasks(10);

		if (taskList.get(0).numActivities == 1
				&& taskList.get(0).topActivity.getClassName().equals(
						context.getClass().getName())) {
			result = true;
		}
		return result;
	}

	private static Pattern VALID_IPV4_PATTERN = null;
	private static Pattern VALID_IPV6_PATTERN = null;
	private static final String ipv4Pattern = "(([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\.){3}([01]?\\d\\d?|2[0-4]\\d|25[0-5])";
	private static final String ipv6Pattern = "([0-9a-f]{1,4}:){7}([0-9a-f]){1,4}";

	static {
		try {
			VALID_IPV4_PATTERN = Pattern.compile(ipv4Pattern,
					Pattern.CASE_INSENSITIVE);
			VALID_IPV6_PATTERN = Pattern.compile(ipv6Pattern,
					Pattern.CASE_INSENSITIVE);
		} catch (PatternSyntaxException e) {
			// logger.severe("Unable to compile pattern", e);
		}
	}

	/**
	 * Determine if the given string is a valid IPv4 or IPv6 address. This
	 * method uses pattern matching to see if the given string could be a valid
	 * IP address.
	 * 
	 * @param ipAddress
	 *            A string that is to be examined to verify whether or not it
	 *            could be a valid IP address.
	 * @return <code>true</code> if the string is a value that is a valid IP
	 *         address, <code>false</code> otherwise.
	 */
	public static boolean isIpAddress(String ipAddress) {
		Matcher m1 = Utilities.VALID_IPV4_PATTERN.matcher(ipAddress);
		if (m1.matches()) {
			return true;
		}
		Matcher m2 = Utilities.VALID_IPV6_PATTERN.matcher(ipAddress);
		return m2.matches();
	}

	public static boolean isIpv4Address(String ipAddress) {
		Matcher m1 = Utilities.VALID_IPV4_PATTERN.matcher(ipAddress);
		return m1.matches();
	}

	public static boolean isIpv6Address(String ipAddress) {
		Matcher m1 = Utilities.VALID_IPV6_PATTERN.matcher(ipAddress);
		return m1.matches();
	}

	public static String getMacAddress(Context context) {
		WifiManager manager = (WifiManager) context
				.getSystemService(Context.WIFI_SERVICE);
		WifiInfo info = manager.getConnectionInfo();
		String address = info.getMacAddress();
		return address;
	}

	public static String getNetworkAddress(Context context) {
		WifiManager manager = (WifiManager) context
				.getSystemService(Context.WIFI_SERVICE);
		DhcpInfo localDhcpInfo = manager.getDhcpInfo();
		String ipAddress = getLocalIpAddress(true);
		String subnetMask = intToIP(localDhcpInfo.netmask);
		String gateWay = intToIP(localDhcpInfo.gateway);
		return ipAddress + "/" + subnetMask + "/" + gateWay;
	}

	private static String intToIP(int ipAddress) {
		String ret = String.format("%d.%d.%d.%d", (ipAddress & 0xff),
				(ipAddress >> 8 & 0xff), (ipAddress >> 16 & 0xff),
				(ipAddress >> 24 & 0xff));

		return ret;
	}

	public static InetAddress getIPv4LocalNetMask(InetAddress ip, int netPrefix) {

		try {
			// Since this is for IPv4, it's 32 bits, so set the sign value of
			// the int to "negative"...
			int shiftby = (1 << 31);
			// For the number of bits of the prefix -1 (we already set the sign
			// bit)
			for (int i = netPrefix - 1; i > 0; i--) {
				// Shift the sign right... Java makes the sign bit sticky on a
				// shift...
				// So no need to "set it back up"...
				shiftby = (shiftby >> 1);
			}
			// Transform the resulting value in xxx.xxx.xxx.xxx format, like if
			// / it was a standard address...
			String maskString = Integer.toString((shiftby >> 24) & 255) + "."
					+ Integer.toString((shiftby >> 16) & 255) + "."
					+ Integer.toString((shiftby >> 8) & 255) + "."
					+ Integer.toString(shiftby & 255);
			// Return the address thus created...
			return InetAddress.getByName(maskString);
		} catch (Exception e) {
			e.printStackTrace();
		}
		// Something went wrong here...
		return null;
	}

	/**
	 * Returns the IP address of the first configured interface of the device
	 * 
	 * @param removeIPv6
	 *            If true, IPv6 addresses are ignored
	 * @return the IP address of the first configured interface or null
	 */
	public static String getLocalIpAddress(boolean removeIPv6) {
		try {
			for (Enumeration<NetworkInterface> en = NetworkInterface
					.getNetworkInterfaces(); en.hasMoreElements();) {
				NetworkInterface intf = en.nextElement();
				for (Enumeration<InetAddress> enumIpAddr = intf
						.getInetAddresses(); enumIpAddr.hasMoreElements();) {
					InetAddress inetAddress = enumIpAddr.nextElement();
					if (inetAddress.isSiteLocalAddress()
							&& !inetAddress.isAnyLocalAddress()
							&& (!removeIPv6 || isIpv4Address(inetAddress
									.getHostAddress().toString()))) {

						return inetAddress.getHostAddress().toString();

					}
				}
			}
		} catch (SocketException ignore) {
		}
		return null;
	}

	public static int getCameraDisplayOrientation(Activity activity,
			int cameraId) {
		Camera.CameraInfo info = new Camera.CameraInfo();
		Camera.getCameraInfo(cameraId, info);
		int rotation = activity.getWindowManager().getDefaultDisplay()
				.getRotation();
		int degrees = 0;
		switch (rotation) {
		case Surface.ROTATION_0:
			degrees = 0;
			break;
		case Surface.ROTATION_90:
			degrees = 90;
			break;
		case Surface.ROTATION_180:
			degrees = 180;
			break;
		case Surface.ROTATION_270:
			degrees = 270;
			break;
		}
		return degrees;
	}
	public static boolean isCameraSupporting(Context context)
	{
		boolean hasCamera = false;
		PackageManager pm = context.getPackageManager();

		if (pm.hasSystemFeature(PackageManager.FEATURE_CAMERA)) {
			hasCamera = true;
		}
		return hasCamera;
	}
	@SuppressLint("NewApi")
	public static  int getMaxVideoSizeSupported(Camera mCamera)
	{
		// Check what resolutions are supported by your camera
		Camera.Parameters params = mCamera.getParameters();
		List<Size> sizes = (List<Size>) params.getSupportedVideoSizes();
		return sizes.get(0).height * sizes.get(0).width;
	}
	public static boolean tryParseInt(String value)
	{  
	     try  
	     {  
	         Integer.parseInt(value);
	         return true;  
	      } catch(NumberFormatException nfe)
	      {  
	          return false;  
	      }  
	}

    //todo (lvxt) what the fuck is this ?
	public static boolean isNexus72013()
	{
		if(Build.MODEL.equalsIgnoreCase("Nexus 7")&& ( Build.DEVICE.equalsIgnoreCase("flo") || Build.DEVICE.equalsIgnoreCase("deb")))
			return true;
		return false;
	}

}
