package i3.mobile.base;


import i3.mobile.base.Constant.EnumImageCodecType;
import i3.mobile.base.Constant.EnumMobileNetworkType;
import i3.mobile.search.setting.SearchTimeData;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.lang.reflect.Array;
import java.math.BigInteger;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.UnknownHostException;
import java.security.spec.AlgorithmParameterSpec;
import java.util.ArrayList;
import java.util.List;
import java.util.Calendar;
import java.util.Date;
import java.util.Queue;
import java.util.Stack;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

//import jcifs.UniAddress;

//import org.apache.http.conn.util.InetAddressUtils;
// import org.w3c.dom.Document;
// import org.w3c.dom.Element;
// import org.w3c.dom.Node;
// import org.w3c.dom.NodeList;
// import org.xml.sax.InputSource;
// import org.xml.sax.SAXException;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.AlertDialog.Builder;
import android.app.Application;
import android.app.PendingIntent;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnCancelListener;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.media.MediaScannerConnection;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.provider.Settings.Secure;
import android.text.method.LinkMovementMethod;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.TypedValue;
import android.view.Display;
import android.view.Gravity;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.Animation;
import android.view.animation.TranslateAnimation;
import android.view.inputmethod.InputMethodManager;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.ImageButton;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.util.Log;
@SuppressLint("NewApi")
public class i3Global
{
	static
	{
		//System.loadLibrary("crystax");
		//System.loadLibrary("ijkffmpeg");
		//System.loadLibrary("Corei3");
	}



	private static i3Global global = null;
	private i3Global()	{
		// System.loadLibrary("crystax");
		// System.loadLibrary("ijkffmpeg");
		// System.loadLibrary("Corei3");
	}
	//public static SearchTimeData searchDayRequest;
	public static i3Global g = i3Global.getGlobal();

	public static void LoadLib()
	{
		// System.loadLibrary("crystax");
		// System.loadLibrary("ijkffmpeg");
		// System.loadLibrary("Corei3");
		System.loadLibrary("avcodec-57");
		System.loadLibrary("avfilter-6");
		System.loadLibrary("avformat-57");
		System.loadLibrary("avutil-55");
		System.loadLibrary("c++_shared");
		System.loadLibrary("i3decoder");
		System.loadLibrary("swresample-2");
		System.loadLibrary("swscale-4");
	}
	//Singleton
	public static i3Global getGlobal()
	{
		  if(global == null)
		  {
			  global = new i3Global();
		  }
		  return global;
	}
	public static MobileSystemInfo GetMobileSysInfo(Context context)
	{
		WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
		Display display = wm.getDefaultDisplay();
		DisplayMetrics metrics = new DisplayMetrics();
		display.getMetrics(metrics);
		int width = metrics.widthPixels;
		int height = metrics.heightPixels;

		MobileSystemInfo mobileSysInfo = new MobileSystemInfo();
		mobileSysInfo.deviceID = Secure.getString(context.getContentResolver(), Secure.ANDROID_ID);
		mobileSysInfo.deviceType = android.os.Build.MODEL;
		mobileSysInfo.memorySize = /*DeviceInfo.getTotalFlashSize()/1024*/1024;
		mobileSysInfo.osType = "ANDROID";
		mobileSysInfo.osVersion = /*DeviceInfo.getSoftwareVersion()*/Build.VERSION.RELEASE;
		mobileSysInfo.processorFre = 0;
		mobileSysInfo.screenHigh =  Math.max(width, height);
		mobileSysInfo.screenWidth = Math.min(width, height );
		mobileSysInfo.isSimulator = false;
		return mobileSysInfo;
	}
	public static byte[] ReadBlock(ArrayList _is, int _length)
			 // read length bytes from is
	{
		byte[] result = null;
        try {
			result = new byte[_length]; //try - catch : array size too large
            for(int i = 0; i < _length; i++)
			{
				result[i] = (byte)_is.get(0);
				_is.remove(0);
			}
		} catch (Exception e) {

			//throw e;
		}
		return result;

	}
	public static int ByteArrayOfCToIntJava(byte[] _buff, int _offset)
	{
		int value = 0;
		for (int i = 0; i < 4; i++) 
		{
			int shift = (3 - i) * 8;
			value += (_buff[3 - i + _offset] & 0x000000FF) << shift;
		}
		return value;
	}
	public static int ReadInt(ArrayList _is)
	{
		byte[] buff = ReadBlock(_is, 4);
		if(buff == null)
		{
			return 0;
		}
		return ByteArrayOfCToIntJava(buff, 0);
	}
	public static char ReadChar(ArrayList _is)
	{
		byte[] buff = ReadBlock(_is, 2);
		byte[] b ={buff[1], buff[0]};
		return ByteArrayToChar(b, 0);
	}
	public static char ByteArrayToChar(byte[] _buff, int _offset) 
	{ 
		char value = 0;
		for(int i = 0; i < 2; i++) 
		{ 
			int shift = (1 - i) * 8; 
			value += (_buff[i +_offset] & 0x00FF) << shift;
		} 
		return value; 
	}
	public static DataInputStream ConvertByteArrayToDataInputStream(byte[] arr)
	{
		InputStream in = new ByteArrayInputStream(arr);
		return new DataInputStream(in);
	}
	public static FrameHeader ReceiveFrameHeader(ArrayList _is, int _serverVersion)
	{
		int codecType = ReadInt(_is);
		char resolutionX = ReadChar(_is);
		if(resolutionX == 0)
		{
			//I3Exception.writeErrorLog("Socket read  error");
			//resolutionX = ReadChar(_is);
		}
		char resolutionY = ReadChar(_is);
		int sourceIndex = ReadInt(_is);
		
		int length = ReadInt(_is);
		
		char originResolutionX = 0;
		char originResolutionY = 0;
		
		int mainSubStream  = - 1;
		long time = 0;
		int serverVersion = _serverVersion;
		int frameIndex = 0;
		if(serverVersion >= Constant.EnumServerVersion.VERSION_2300)
		{
			originResolutionX = ReadChar(_is);
			originResolutionY = ReadChar(_is); 
			//settings[_serverIndex].SetServerInputResolution(sourceIndex, originResolutionX, originResolutionY);
		}  
		if(serverVersion >= Constant.EnumServerVersion.VERSION_SUPPORT_SEARCHING)
		{
			mainSubStream  = ReadInt(_is);
			time  = ReadInt(_is); 
			frameIndex = ReadInt(_is);
		} 
		return (new FrameHeader(codecType, resolutionX, resolutionY, sourceIndex, length, originResolutionX, originResolutionY, mainSubStream,time,frameIndex));
	}
 	public static byte[] ReceiveEncodeFrame(ArrayList _is,int length)
	{

		byte[] encodeFrame = null;

		try
		{   
		   encodeFrame =  ReadBlock(_is, length);
		}
		catch (OutOfMemoryError e)
		{
			String str = e.getMessage() + " OutOfMemoryError __ Rec Video";
			//Global.g.WriteErrorLog(str);
			return null;
		}
		return encodeFrame;
	}
	public static  byte[] IntToByteArray(int _value)
	{
		byte[] result = new byte[4];
		result[0] = (byte) (_value >> 24);
		result[1] = (byte) (_value >> 16);
		result[2] = (byte) (_value >> 8);
		result[3] = (byte) (_value);
		return result;
	}
	private static byte[] AES_Encrypt(byte[] key, byte[] data) throws Exception
	{
		byte[] iv = new byte[]{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
		AlgorithmParameterSpec paramSpec = new IvParameterSpec(iv);
		SecretKeySpec skeySpec = new SecretKeySpec(key, "AES");
		Cipher cipher = Cipher.getInstance("AES/CBC/NoPadding");
		cipher.init(Cipher.ENCRYPT_MODE, skeySpec, paramSpec);
		byte[] encrypted = cipher.doFinal(data);
		return encrypted;
	}
	public static byte[] ConstructLoginInfoForSend(String _userName, String _pass, String _svrID, int _serverVersion) throws Exception
	{
		String loginXMLstr = "<LoginInfo user_name=\"" + _userName + "\" password=\"" + _pass
				+ "\" server_id=\"" + _svrID + "\" remote_type=\"2\"/>";
		byte[] bloginXMLstrTmp = loginXMLstr.getBytes();

		byte[] bLoginXmlSend = bloginXMLstrTmp;

		if(_serverVersion > Constant.EnumServerVersion.VERSION_2200)
		{
			int xmlLength = bloginXMLstrTmp.length;

			int newLength = - 1;
			if( (xmlLength%16) == 0)
				newLength = xmlLength + 16;
			else
				newLength = xmlLength + 32 - (xmlLength%16);

			bLoginXmlSend = new byte[newLength];
			for(int i = 0; i < xmlLength; i++)
				bLoginXmlSend[i] = bloginXMLstrTmp[i];

			for( int i = xmlLength; i < newLength; i++ )
				bLoginXmlSend[i] = 0;

			byte[] realXmlLength = IntToByteArray(xmlLength);
			for(int i = 0; i < 4; i++)
				bLoginXmlSend[newLength - 4 + i] = realXmlLength[i];

			// encrypt
			byte[] encryptedXML = AES_Encrypt(Constant.aesKey ,bLoginXmlSend);
			Log.d("Lenght Encrypt", String.valueOf(encryptedXML.length));
			for(int i = 0; i < encryptedXML.length; i++)
			{
				Log.d("Encrypt " + String.valueOf(i+1), String.valueOf(encryptedXML[i]));
			}
			return encryptedXML;
		}
		return null;
	}
	public static byte[] globalJpg = null;
	public static FrameBitmap ReceiveFrameToBitmap(ArrayList _is, boolean _ishaveFrameHeader, int _serverIndex)
	{
		FrameBitmap frame = new FrameBitmap();

		try
		{
			if (_ishaveFrameHeader)
			{
				// read frame header
				frame.header = ReceiveFrameHeader(_is, _serverIndex);
				byte[] jpg = ReadBlock(_is, frame.header.length);
				globalJpg = new byte[frame.header.length];
				System.arraycopy(jpg, 0, globalJpg, 0, jpg.length);
				//globalJpg = Arrays.copyOf(jpg, frame.header.length);
				frame.bmp = BitmapFactory.decodeByteArray(jpg, 0, jpg.length);
			}
			else
			{
				int lenBuff = ReadInt(_is);
				byte[] jpg =  ReadBlock(_is, lenBuff);
				//System.arraycopy(jpg, 0, globalJpg, 0, jpg.length);
				frame.bmp = BitmapFactory.decodeByteArray(jpg, 0, jpg.length);
			}
		}
		catch (OutOfMemoryError e)
		{
			String str = e.getMessage() + " OutOfMemoryError __ Rec Video";
			return null;
		}
		return frame;
	}
	public static byte[] ConcatTwoByteArray(byte[] a, byte[] b)
	{
		byte[] c = new byte[a.length + b.length];
		System.arraycopy(a, 0, c, 0, a.length);
		System.arraycopy(b, 0, c, a.length, b.length);
		return c;
	}
	public static Bitmap resizeImage(Bitmap originalImage, int newWidth, int newHeight, boolean isRecycleOriginalImage)
	{

		Bitmap resultBmp = Bitmap.createScaledBitmap(originalImage, newWidth, newHeight, true);
		//Blackberry
		if(isRecycleOriginalImage)
		{

			originalImage.recycle();
			originalImage = null;

		}

		return resultBmp;
	}

	public static Bitmap scaleDown(Bitmap realImage, float maxImageSize,
								   boolean filter) {
		float ratio = Math.min(
				(float) maxImageSize / realImage.getWidth(),
				(float) maxImageSize / realImage.getHeight());
		int width = Math.round((float) ratio * realImage.getWidth());
		int height = Math.round((float) ratio * realImage.getHeight());

		Bitmap newBitmap = Bitmap.createScaledBitmap(realImage, width,
				height, filter);
		return newBitmap;
	}
}
