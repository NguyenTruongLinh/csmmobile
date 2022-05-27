package i3.mobile;

import android.app.ActionBar;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

import java.util.Map;

import javax.annotation.Nullable;

import i3.mobile.base.Constant;
import i3.mobile.base.ServerSite;

/**
 * Created by i3dvr on 10/6/2017.
 */

public class FFMpegFrameViewManager extends SimpleViewManager<FFMpegFrameView>

{
    public static final String onChangeEvent = "onChange";

    public static final String REACT_CLASS = "FFMpegFrameViewManager";
    private ReactContext mReactContext;
    FFMpegFrameView instance;
    private boolean isSearch = false;

    public FFMpegFrameViewManager(ReactApplicationContext reactContext) {
        mReactContext = reactContext;
    }
    @Override
    public String getName() {
        return REACT_CLASS;
    }
    @Override
    public FFMpegFrameView createViewInstance(ThemedReactContext context) {
        // this.mReactContext = context;
        instance = new FFMpegFrameView(context, null);
        return instance;
    }
    @ReactProp(name = "src")
    public void setSrc(FFMpegFrameView view, @Nullable ReadableArray  sources) {
        //view.setSource(sources);
        view.setSource( sources);
    }
    @ReactProp(name = "width")
    public void setWidthScreen(FFMpegFrameView view, @Nullable double widthScreen) {

        if(widthScreen >= 0)
            view.SetWidth( widthScreen);
    }
    @ReactProp(name = "height")
    public void setHeightScreen(FFMpegFrameView view, @Nullable double heightScreen) {

        if(heightScreen >= 0)
            view.SetHeight( heightScreen);
    }

    @ReactProp(name = "pause")
    public void setPause(FFMpegFrameView view, @Nullable boolean pause){
        view.PauseVideo();

    }

    @ReactProp(name = "firstrun")
    public void setFirstRun(FFMpegFrameView view, @Nullable boolean firstrun){
        view.setFirstRun(firstrun);
    }

    @ReactProp(name = "refresh")
    public void setRefresh(FFMpegFrameView view, @Nullable boolean refresh)
    {
        if(refresh) {
            // view.UpdateFrame(null);
            view.Refresh(isSearch);
        }
    }
	
	@ReactProp(name = "singlePlayer")
    public void setSinglePlayer(FFMpegFrameView view, @Nullable boolean singlePlayer)
    {
        view.setSingle(singlePlayer);
    }

    @ReactProp(name = "disconnect")
    public void setDisconnect(FFMpegFrameView view, @Nullable boolean disconnect)
    {
        // if(disconnect) {
            view.Stop();
        // }
    }


    @ReactProp(name = "stop")
    public void setStop(FFMpegFrameView view, @Nullable boolean stop)
    {
        if(stop)
            view.Stop();
    }

    @ReactProp(name = "exit")
    public void Exit(FFMpegFrameView view, boolean exit) {
        view.exitFullscreen();
        // do nothing
//        Activity activity =  mReactContext.getCurrentActivity();
//        if(activity != null) {
//
//            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
//            int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_VISIBLE;
//            activity.getWindow().getDecorView().setSystemUiVisibility(uiOptions);
//        }
    }
    @ReactProp(name = "seekpos")
    public void SeekPOS(FFMpegFrameView view, @Nullable ReadableMap  source) {
        // do nothing
        int pos = source.getInt("pos");
        boolean HD = false;
        if( source.hasKey("hd")) {
            try {
                HD = source.getBoolean("hd");
            }
            catch (Exception ex){
                HD = false;
            }

        }

        view.SeekPOS( pos, HD);
    }
    @ReactProp(name = "fullscreen")
    public void setFullscreen(FFMpegFrameView view, @Nullable int  fullscreen) {
        switch ( fullscreen)
        {
            case 0:
                //onPorTrait( ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                view.setOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                view.exitFullscreen();
                break;
            case 90:
                //onLandScape( ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE);
                view.setOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE);
                view.setFullscreen();
                break;
            case 180:
                //onPorTrait( ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT);
                view.setOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                view.exitFullscreen();
                //onPorTrait( ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                break;
            case 270:
                view.setOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                view.setFullscreen();
                //onLandScape( ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                break;

        }

    }
    @ReactProp(name = "startplayback")
    public void setStart(FFMpegFrameView view, @Nullable ReadableMap source) {
        Log.i("GOND", "startplayback called " + source + " - " + source.toString());
        ServerSite s = GetServerInfo(source);
        // Log.i("GOND", "setStart 1");
        String channel = source.getString("channels");
        Log.i("GOND", "setStart 2 ChangePlay: " + channel);
        boolean by_channel = source.getBoolean("byChannel");
        // Log.i("GOND", "setStart 3");
        /*boolean*/ isSearch = source.getBoolean("searchMode");
        // Log.i("GOND", "setStart 4");
        boolean HD = false;
        if( source.hasKey("hd"))
        {
            try {
                HD = source.getBoolean("hd");
            }
            catch(Exception ex){
                HD= false;
            }

        }
        if(view.socket_handler == null || view.video_thread == null || view.socket_handler.running == false) {
            view.setServer(s);
            view.setByChannels(by_channel);
            view.setChannels( channel);
        }
        else
        {
            String old_channel = view.getChannels();
            boolean old_bychannel = view.getByChannels();
            // Log.d("GOND", "ChangePlay 0: " + channel + ", old: " + old_channel);
            if( old_bychannel != by_channel || old_channel != channel)
            {
                view.setByChannels(by_channel);
                view.setChannels(channel);
            }
        }
        // Log.i("GOND", "setStart 6");
        if(isSearch) {
            DateTimeFormatter formatter = DateTimeFormat.forPattern("yyyy/MM/dd HH:mm:ss");
            DateTime dt = formatter.parseDateTime(source.getString("date"));
            int interval = source.getInt("interval");
            view.StartSearch(dt, interval, HD);
        }
        else
            view.StartLive(HD);
        //onLandScape();
        //onFullScreen();
        // Log.i("GOND", "setStart 7");
    }

    @ReactProp(name = "hdmode")
    public void setHD(FFMpegFrameView view,@Nullable Boolean HDMode){
        Log.i("GOND", "setHDMode enter");
        if(HDMode != null)
            view.ViewHD(HDMode);
    }
    
    @ReactProp(name = "scaleXY")
    public void setScaleXY(FFMpegFrameView view, double scaleXY){
        view.setScaleXY(scaleXY);
    }

    @ReactProp(name = "translateX")
    public void setTranslateX(FFMpegFrameView view, int translateX){
        view.setTranslateX(translateX);
    }

    @ReactProp(name = "translateY")
    public void setTranslateY(FFMpegFrameView view, int translateY){
        view.setTranslateY(translateY);
    }

    @ReactMethod
    public void UpdateFrame(FFMpegFrameView view, int width, int height, String dataEncode, int channelId, int serverVersion, int index){
        //view.UpdateVideoFrame(width, height,dataEncode,channelId, serverVersion, index);
    }
    @ReactMethod
    public  void Live(FFMpegFrameView view, ReadableMap map, String  channel, boolean bychanel )
    {
        ServerSite s = GetServerInfo( map);
        //instance.StartLive();

    }
    private void sendEvent(String eventName, WritableMap params) {
        mReactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    ServerSite GetServerInfo(@Nullable ReadableMap args)
    {
        ServerSite server = new ServerSite();
        server.serverIP = args.getString("serverIP");
        server.serverWANIp = args.getString("publicIP");//WanIp;
        server.serverName = args.getString("name");//WanIp;//Name;
        server.serverPort =  Integer.toString(args.getInt("port"));//Integer.toString(port);
        server.serverID =  args.getString("serverID"); //serverID;
        server.userName = args.getString("userName"); //UserName;
        server.pass = args.getString("password"); //Password;
        server.ID = args.getInt("kDVR");// KDVR;
        return server;
    }


    public Map getExportedCustomBubblingEventTypeConstants() {
//        return MapBuilder.of(
//                "FFMPegEvent",
//                MapBuilder.of("registrationName", "onFFMPegFrameChange")); // <-- renamed from onError to onError2



        return MapBuilder.builder()
                .put(
                        Constant.FFMPEG_EVENT,
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onFFMPegFrameChange")))
                .build();
    }

    private  void  onPorTrait( int orient )
    {
        Activity activity =  mReactContext.getCurrentActivity();
        if(activity != null) {
            activity.setRequestedOrientation(orient);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

            int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_VISIBLE;
            activity.getWindow().getDecorView().setSystemUiVisibility(uiOptions);

            ActionBar actionBar = activity.getActionBar();
            if(actionBar != null)
                actionBar.hide();
        }
    }
    private void onLandScape(int orient) {

        Activity activity =  mReactContext.getCurrentActivity();
        if(activity != null) {
            activity.setRequestedOrientation(orient);
            activity.getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

            int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide nav bar
                    | View.SYSTEM_UI_FLAG_FULLSCREEN // hide status bar
                    | View.SYSTEM_UI_FLAG_IMMERSIVE;

                    //View.SYSTEM_UI_FLAG_FULLSCREEN;
            Window win = activity.getWindow();
            if(win != null)
                win.getDecorView().setSystemUiVisibility(uiOptions);
            //activity.getWindow().getDecorView().setSystemUiVisibility(uiOptions);

            ActionBar actionBar = activity.getActionBar();
            if(actionBar != null)
                actionBar.hide();
        }

    }

}


