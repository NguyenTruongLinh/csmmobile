package i3.mobile.base;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.security.spec.ECFieldFp;
import java.util.Arrays;
import java.util.TimeZone;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import i3.mobile.FFMpegFrameView;
import i3.mobile.search.setting.SearchTimeData;

public class MsgCommandItem
{
	public char CommandID;
	public byte[] buffer;
	public MsgCommandItem(char _commandID, byte[] _buffer)
	{
		CommandID = _commandID;
		buffer = _buffer;
	}

	public  static byte[] MOBILE_MSG_MOBILE_SEND_SETTINGS(int[] videosource, boolean mainstream, boolean isRelay)
	{
		isRelay = false;
		try {
			byte[] channels = new byte[Constant.MAX_VIDEO_INPUT];
			Arrays.fill(channels,(byte) '0');
			for ( int it: videosource) {
				channels[it] = '1';
			}


			byte[] main_sub = new byte[Constant.MAX_SERVER_CHANNEL];
			Arrays.fill(main_sub,(byte) 0);
			if( mainstream)
			{
				for ( int it: videosource) {
					if(it < Constant.MAX_SERVER_CHANNEL)
						continue;
					main_sub[it - Constant.MAX_SERVER_CHANNEL] = 1;

				}
			}

			BigInteger mainsubMask = new BigInteger(main_sub);
			DocumentBuilderFactory dBFactory = DocumentBuilderFactory.newInstance();
			DocumentBuilder dBuilder = dBFactory.newDocumentBuilder();
			Document myDocument = dBuilder.newDocument();

			Element root = myDocument.createElement("ALL_SETTINGS");
			Element sourceResTab = myDocument.createElement("SOURCE_RESQUEST_MASK");

			String m = new String(channels, "US-ASCII");
			sourceResTab.setAttribute("value", m);
			root.appendChild(sourceResTab);
			MobileSystemInfo mobilesysteminfo = FFMpegFrameView.getMobileSystemInfo();
			Element screenSizeTab = myDocument.createElement("SCREEN_SIZE");
			screenSizeTab.setAttribute("screen_width", String.valueOf(mobilesysteminfo.screenWidth));
			screenSizeTab.setAttribute("screen_high", String.valueOf(mobilesysteminfo.screenHigh));
			root.appendChild(screenSizeTab);


//			Element sysInfoTab = myDocument.createElement("MOBILE_SYSTEM_INFO");
//
//			Element isFullScreenTab = myDocument.createElement("IS_FULL_SCREEN");
//			isFullScreenTab.setAttribute("value", String.valueOf( true));
//			root.appendChild(isFullScreenTab);
//
//			sysInfoTab.setAttribute("network_type", String.valueOf((byte)1));
//			sysInfoTab.setAttribute("device_id", String.valueOf(mobilesysteminfo.deviceID ));
//			sysInfoTab.setAttribute("device_type", mobilesysteminfo.deviceType);
//			sysInfoTab.setAttribute("is_simulator", String.valueOf(mobilesysteminfo.isSimulator));
//			sysInfoTab.setAttribute("os_type", mobilesysteminfo.osType);
//			sysInfoTab.setAttribute("os_version", mobilesysteminfo.osVersion);
//			sysInfoTab.setAttribute("memory_size", String.valueOf(mobilesysteminfo.memorySize));
//			sysInfoTab.setAttribute("processor_frequency", String.valueOf(mobilesysteminfo.processorFre));
//			sysInfoTab.setAttribute("resolution",String.valueOf(mobilesysteminfo.screenWidth * mobilesysteminfo.screenHigh));
//			root.appendChild(sysInfoTab);

			Element resolutionReqTab = myDocument.createElement("RESOLUTION_REQUEST");
			resolutionReqTab.setAttribute("count", "1");
			resolutionReqTab.setAttribute("source_0", "*");

			int width =  Math.min(isRelay ? 640 : 1280, mobilesysteminfo.screenWidth);
			int height = Math.min(isRelay ? 360 : 720, mobilesysteminfo.screenHigh);
			if(!isRelay && mainstream){
				width = mobilesysteminfo.screenWidth;
				height = mobilesysteminfo.screenHigh;
			}
			resolutionReqTab.setAttribute("resolutionX_0", String.valueOf(width ));
			resolutionReqTab.setAttribute("resolutionY_0", String.valueOf(height));
			root.appendChild(resolutionReqTab);

			String n = new String(main_sub, "US-ASCII");
			Element mainsubTab = myDocument.createElement("MAIN_SUB_REQUEST");

			mainsubTab.setAttribute("mainsub_mask", String.valueOf(mainsubMask)  );
			root.appendChild(mainsubTab);

			Element searchScreen = myDocument.createElement("SEARCH_FRAMESIZE_REQUEST");
			searchScreen.setAttribute("search_frame_width", String.valueOf(width));
			searchScreen.setAttribute("search_frame_height", String.valueOf(height));
			root.appendChild(searchScreen);

			myDocument.appendChild(root);


			byte[] _settings = utils.documentToByte(myDocument);
			int xmlSize = _settings.length; //SearchMgr.documentToByte(myDocument).length;

			int totalLength = 4/*integer*/ + 2 /*char*/ + xmlSize;
			int realDataSize = totalLength - 4;
			byte[] bsize = utils.IntToByteArrayOfC(realDataSize);
			byte[] bComMsg = utils.CharToByteArrayOfC(Constant.EnumCmdMsg.MOBILE_MSG_MOBILE_SEND_SETTINGS);
			byte[] allSettingBuff = new byte[totalLength];

			System.arraycopy(bsize, 0, allSettingBuff, 0, 4);
			System.arraycopy(bComMsg, 0, allSettingBuff, 4, 2);
			System.arraycopy(_settings, 0, allSettingBuff, 6, xmlSize);

			byte[] buff = allSettingBuff;
			return  buff;
//			//String str = new String(_settings);
//
//			if (buff != null) {
//				Global.mainOS.write(buff);  //send command to Server
//				Global.mainOS.flush();
//			} else {
//				//I3Exception.writeErrorLog("error buff send settings");
//			}
		}
		catch (Exception e){
			return  null;
		}
	}

	public  static byte[] MSG_SEARCH_REQUEST_STOP(ServerSite server, int[]channelNo){
		SearchTimeData time_search = server.getSearchTime();
		boolean mainSub = false;//searchManager.isMainSubRequest();
		byte[] buff = contructSearchSetting(server.ConnectionIndex, "", String.valueOf(channelNo[0]), Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_REQUEST_STOP
				, time_search ,mainSub, server.TimeZone.getTimeZone());
		return  buff;
	}

	public  static byte[] MSG_SEARCH_REQUEST_SETPOS(ServerSite server, int[]channelNo, int interval, boolean mainstream){

		SearchTimeData time_search = server.getSearchTime();
		if( interval > 0 )
		{
			int cur_interval = time_search.getTimeInterval();
			long pos =  time_search.getLongStamp( server.TimeZone.getTimeZone());
			pos += interval;

			time_search = new SearchTimeData(pos, cur_interval - interval, server.TimeZone.getTimeZone() );
		}
		byte[] buff = contructSearchSetting(server.ConnectionIndex, "", String.valueOf(channelNo[0]), Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_REQUEST_SETPOS
				, time_search ,mainstream, server.TimeZone.getTimeZone());
		return  buff;
	}
	public  static byte[] MSG_SEARCH_REQUEST_PLAY_FW(ServerSite server, int[]channelNo, int interval, boolean mainstream){

		SearchTimeData time_search = server.getSearchTime();
		if( interval > 0 )
		{
			int cur_interval = time_search.getTimeInterval();
			long pos =  time_search.getLongStamp( server.TimeZone.getTimeZone());
			pos += interval;

			time_search = new SearchTimeData(pos, cur_interval - interval, server.TimeZone.getTimeZone() );
		}
		byte[] buff = contructSearchSetting(server.ConnectionIndex, "",  String.valueOf(channelNo[0]), Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_REQUEST_PLAY_FW , time_search,mainstream, server.TimeZone.getTimeZone());
		return  buff;
	}
	public static byte[] MSG_SEARCH_REQUEST_TIME_INTERVAL(ServerSite server, int[]channelNo){

		boolean mainSub = true;
		TimeZone tz = server.getTimeZone().getTimeZone();

		SearchTimeData searchTime  = server.getSearchTime();
//		SearchTimeData searchTime =  new SearchTimeData();
//		searchTime.setDay( _temp.getDay() );
//		searchTime.setMonth(_temp.getMonth());
//		searchTime.setYear(_temp.getYear());
//		searchTime.setHour(0);
//		searchTime.setMinute(0);
//		searchTime.setSecond(0);
//		searchTime.setTimeInterval(_temp.getTimeInterval());


		int serverIndex = server.ConnectionIndex;

//		LocalDateTime now = LocalDateTime.now();
//		int year = now.getYear();
//		int month = now.getMonthOfYear();
//		int day = now.getDayOfMonth();
//		SearchTimeData searchTime = new SearchTimeData( year ,month , day ,0,0,0, SearchTimeData.DEFAULT_INTERVAL_TIME); //Global.searchDayRequest;
		//i3Global.searchDayRequest = searchTime;
		//int timeInterval = Utilities.getDefaultTimeInterval(searchTime.getYear(), searchTime.getMonth(), searchTime.getDay(), tz);
		//searchTime.setTimeInterval(timeInterval);

		//byte[] buff = null;
		if( channelNo.length == 1) {
			byte[] buff = contructSearchSetting(-1, "0xFFFFFFFFFFFFFFFF", String.valueOf(channelNo[0]), Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL, searchTime, mainSub, tz);
			//buff = _buff;

			return  buff;
		}
		else
		{
			BigInteger requestSearch = BigInteger.ZERO.shiftLeft(Constant.MAX_SERVER_CHANNEL);
			for (int i =0 ; i< channelNo.length;i++)
			{
				if( channelNo[i] >= 0) {
					BigInteger ii = BigInteger.ONE;
					ii = ii.shiftLeft(i);
					requestSearch = requestSearch.or(ii);
				}
			}
			byte[] buff = contructSearchSetting(-1, requestSearch.toString(), "-1", Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_REQUEST_TIME_INTERVAL, searchTime, mainSub, tz);
			return buff;
		}

	}

//	public static byte[] MSG_SEARCH_REQUEST_DAY_LIST(int serverIndex, TimeZone timeZone, int[] channelNo,boolean mainstream)
//	{
//		return MSG_SEARCH_REQUEST_DAY_LIST( serverIndex,  timeZone, channelNo,mainstream);
//	}


	public static byte[] MSG_SEARCH_REQUEST_DAY_LIST(int serverIndex, TimeZone timeZone, int[] channelNo, boolean mainstream){

	SearchTimeData searchTime = SearchTimeData.getAnyDay(timeZone);
	if( channelNo.length == 1) {
		byte[] buff = contructSearchSetting(-1, "", String.valueOf(channelNo[0]), Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_REQUEST_DAY_LIST, searchTime, mainstream, timeZone);
		return buff;

	}
	else
	{
		BigInteger requestSearch = BigInteger.ZERO.shiftLeft(Constant.MAX_SERVER_CHANNEL);
		for (int i =0 ; i< channelNo.length;i++)
		{
			if( channelNo[i] >= 0) {
				BigInteger ii = BigInteger.ONE;
				ii = ii.shiftLeft(i);
				requestSearch = requestSearch.or(ii);
			}
		}
		byte[] buff = contructSearchSetting(serverIndex, requestSearch.toString() ,  "-1" , Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_REQUEST_DAY_LIST, searchTime, mainstream, timeZone);
		return buff;
	}

	}
	public static byte[] contructSearchSetting(int serverIndex,
											   String channelMask, String channelIndex, char msgRequest,
											   SearchTimeData searchTime, boolean needMainStream , TimeZone timeZone) {

		DocumentBuilderFactory dBFactory = DocumentBuilderFactory.newInstance();
		DocumentBuilder dBuilder;
		try {
			dBuilder = dBFactory.newDocumentBuilder();
			Document myDocument = dBuilder.newDocument();

			Element root = myDocument.createElement("Search_Request");
			BigInteger requestSearch = BigInteger.ZERO.shiftLeft(Constant.MAX_SERVER_CHANNEL);
			if (Integer.parseInt(channelIndex) >= 0) {

				for (int i = 0; i < Constant.MAX_SERVER_CHANNEL; i++) {
					if (i == Integer.parseInt(channelIndex)) {
						BigInteger ii = BigInteger.ONE;
						ii = ii.shiftLeft(i);
						requestSearch = requestSearch.or(ii);
					}
				}
				root.setAttribute("channelID", String.valueOf(requestSearch));
			}
			else
			{
				root.setAttribute("channelID", channelMask);
			}
			//TimeZone timeZone = Global.serverTimeZone.getTimeZone();
			long timeStampUTC = searchTime.getTtimeStamp();

			if(searchTime.isNeedCalculateTimeStamp())
			{
				timeStampUTC = searchTime.getLongStamp(timeZone);
				// I3Exception.writeErrorLog("Time stamp: " +String.valueOf(timeStampUTC));
				//I3Exception.writeErrorLog("Time interval: " +String.valueOf(searchTime.getTimeInterval()));
			}
			root.setAttribute("searchTimeUTC",String.valueOf(timeStampUTC));

			root.setAttribute("timeInterval",
					searchTime.convertIntervaltoXmlType());

			if(needMainStream)
			{
				String mainStreamMask = Integer.parseInt(channelIndex) >= 0 ? String.valueOf(requestSearch) : channelMask;
				root.setAttribute("mainStreamMask",mainStreamMask);
			}
			else
			{
				root.setAttribute("mainStreamMask","0");//default is substream
			}


			myDocument.appendChild(root);
			int xmlSize = documentToByte(myDocument).length;

			int totalLength = 4/* integer */+ 2 /* char */+ xmlSize;
			int realDataSize = totalLength - 4;
			// Header
			byte[] data = new byte[totalLength];
			byte[] bsize = i3.mobile.base.utils.IntToByteArrayOfC(realDataSize); //covertJavaInttoCplusByteArray(realDataSize);
			byte[] bComMsg = i3.mobile.base.utils.CharToByteArrayOfC(msgRequest);//convertJavaChartoCplusByteArray(msgRequest);
			System.arraycopy(bsize, 0, data, 0, 4);
			System.arraycopy(bComMsg, 0, data, 4, 2);
			// Copy data
			System.arraycopy(documentToByte(myDocument), 0, data, 6, xmlSize);
			return data;

		} catch (ParserConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		return null;
	}

	static byte[] documentToByte(Document document) {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		StreamResult result = new StreamResult(baos);
		Transformer transformer;
		try {
			transformer = TransformerFactory.newInstance().newTransformer();
			transformer.transform(new DOMSource(document), result);

		} catch (TransformerConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (TransformerFactoryConfigurationError e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (TransformerException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return baos.toByteArray();
	}
	public static byte[] ConstructSimpleMsgBuf(char msg)
	{
		byte[] size = utils.IntToByteArrayOfC(2);// //IntToByteArrayOfC(2);
		byte[] buff = new byte[6];
		for (int i = 0; i < 4; i++)
			buff[i] = size[i];
		byte[] cMsg = utils.CharToByteArrayOfC(msg);// CharToByteArrayOfC(msg);
		buff[4] = cMsg[0];
		buff[5] = cMsg[1];
		return buff;
	}
}