package i3.mobile;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.Rect;
import android.hardware.SensorManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.AsyncTask;
import android.os.SystemClock;
import android.util.Base64;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.views.imagehelper.ImageSource;

import org.joda.time.DateTime;
import org.json.JSONObject;

// import java.lang.System;
import java.lang.reflect.Array;
import java.io.ByteArrayOutputStream;
import javax.annotation.Nullable;
import java.util.HashMap;
import java.util.Map;

import i3.mobile.base.Constant;
import i3.mobile.base.MobileSystemInfo;
import i3.mobile.base.ServerSite;
import i3.mobile.base.i3Global;
import i3.mobile.dvrsocket.CommunicationSocket;
import i3.mobile.search.setting.SearchAllDayInterval;
import i3.mobile.search.setting.SearchTimeData;

/**
 * TODO: document your custom view class.
 */
//public class FFMpegFrameView extends AppCompatImageView {
public class FFMpegFrameView extends View {
    private static float RATIO = 16f / 9f;
    double _width = 0;
    double _height = 0;
    double _scaleXY = 1;
    int _translateX = 0;
    int _translateY = 0;
    boolean firstRunAlarm;
    boolean singlePlayer = false;
    int index = 0;
    Paint mPaint = null;
    Bitmap DrawBitmap = null;
    Bitmap preDrawBitmap = null;
    Bitmap src;
    boolean valid_first_frame = false;
    HashMap<Integer, Long> lastFrameTimeByChannel = new HashMap<Integer, Long>();
    static MobileSystemInfo mobileSystemInfo = null;
    boolean isTakeANap = false;

    public static MobileSystemInfo getMobileSystemInfo(){
                return  mobileSystemInfo;
        }
    public void SetWidth(double _w)
    {
        if( _width != _w)
        {
            _width = _w ;
            if (socket_handler != null)
                socket_handler.setViewDimensions((int)_width, (int)_height);
        }

    }
    public void SetHeight(double _h)
    {
        if(_height != _h)
        {
            _height = _h;
            if (socket_handler != null)
                socket_handler.setViewDimensions((int)_width, (int)_height);
        }
        
    }

    int img_width;

    int img_height;
    Rect img_rect = null;
    ServerSite Server;
    String Channels;
    boolean ByChannel;
    Handler handler = null;
    public  ServerSite getServer(){ return Server;}
    public  void  setServer(ServerSite value){ 
        if (value != null && (this.Server == null || !this.Server.EqualWith(value)))
            this.Server = value; 
    }

    public String getChannels(){ return  this.Channels;}
    public  void  setChannels(String value){ this.Channels = value;}

    public  boolean getByChannels(){ return  this.ByChannel;}
    public  void setByChannels(boolean value){ this.ByChannel = value;}
    Thread video_thread = null;
    CommunicationSocket socket_handler;
    OrientationEventListener mOrientationListener;
    //volatile  boolean is_fullscreen = false;
    ReactContext reactContext;
    int  mLastRotation;
    String clientIp;
    public FFMpegFrameView(Context context, AttributeSet attrs) {
        super(context, attrs);
        reactContext = (ReactContext)getContext();
        mobileSystemInfo = i3Global.GetMobileSysInfo(reactContext );
        initPaint();
        i3Global.LoadLib();
        InitHandler();
        // InitOrientation();
        setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        //setBackgroundColor(Color.DKGRAY);
        this.setOnClickListener(
                new OnClickListener() {
                    @Override
                    public void onClick(View v) {

                        OnEvent(Constant.EnumVideoPlaybackSatus.MOBILE_VIEW_CLICK, 0);
//                        WritableMap event = Arguments.createMap();
//                        event.putInt("msgId",1);
//                        //event.putString("message", "MyMessage");
//                        ReactContext reactContext = (ReactContext)getContext();
//                        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
//                                getId(),
//                                FFMPEG_EVENT,
//                                event);

                    }
                }
        );

        WifiManager wm = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
        int ipAddress = wm.getConnectionInfo().getIpAddress();
        clientIp = String.format("%d.%d.%d.%d", (ipAddress & 0xff),(ipAddress >> 8 & 0xff),
                (ipAddress >> 16 & 0xff),(ipAddress >> 24 & 0xff));

        Log.v("DEBUG_TAG", "relay 2507 FFMpegFrameView constructor this = " + this);
    }

    public void  setOrientation( int orient ){
        //reactContext.getCurrentActivity().setRequestedOrientation(orient);
    }
    public void setFullscreen() {

        getSystemUiVisibility();
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_FULLSCREEN;
                flags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;

            setSystemUiVisibility(flags);
    }

    public void exitFullscreen() {
        int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_VISIBLE;
        setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);

    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
//        if (hasFocus) {
//            setSystemUiVisibility(
//                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
//                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
//                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
//                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
//                            | View.SYSTEM_UI_FLAG_FULLSCREEN
//                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
//        }
    }
    void InitOrientation() {

        mOrientationListener = new OrientationEventListener(this.getContext()) {

            @Override
            public void onOrientationChanged(int orientation) {
                // Log.v("DEBUG_TAG", "Orientation changed to " + orientation);

                if (orientation == OrientationEventListener.ORIENTATION_UNKNOWN) {
                    return;
                }

                orientation = orientation % 360;
                int retVal;
                if (orientation < (0 * 90) + 45) {
                    retVal = 0;
                } else if (orientation < (1 * 90) + 45) {
                    retVal = 90;
                } else if (orientation < (2 * 90) + 45) {
                    retVal = 180;
                } else if (orientation < (3 * 90) + 45) {
                    retVal = 270;
                } else {
                    retVal = 0;
                }
                if(mLastRotation !=  retVal) {
                    mLastRotation = retVal;
                    OnEvent(Constant.EnumVideoPlaybackSatus.MOBILE_ORIENTATION, mLastRotation);
                }


//                int rotation = reactContext.getCurrentActivity().getWindowManager().getDefaultDisplay().getRotation();
//                switch (rotation) {
//                    case Surface.ROTATION_0:
//                        android.util.Log.i("DEBUG_TAG", "changed ROTATION_0 - " + orientation);
//                        break;
//                    case Surface.ROTATION_90:
//                        android.util.Log.i("DEBUG_TAG", "changed ROTATION_90 - " + orientation);
//                        break;
//                    case Surface.ROTATION_180:
//                        android.util.Log.i("DEBUG_TAG", "changed ROTATION_180 - " + orientation);
//                        break;
//                    case Surface.ROTATION_270:
//                        android.util.Log.i("DEBUG_TAG", "changed ROTATION_270 - " + orientation);
//                        break;
//                }



            }
        };

        if (mOrientationListener.canDetectOrientation() == true) {
            Log.v("DEBUG_TAG", "Can detect orientation");
            mOrientationListener.enable();
        } else {
            Log.v("DEBUG_TAG", "Cannot detect orientation");
            mOrientationListener.disable();
        }

    }

    void  InitHandler()
    {
        handler = new Handler(Looper.getMainLooper()){
            @Override
            public void handleMessage(Message msg) {
//                if(msg.what == 1000) {
//                    UpdateFrame( (Bitmap) msg.obj );
//                }
                HandlerMessage(msg.what, msg.obj, msg.arg1);
                super.handleMessage(msg);
            }
        };
    }
    private void HandlerMessage( int msgId, Object data, int channel)
    {
        switch (msgId)
        {
            case Constant.EnumVideoPlaybackSatus.MOBILE_FRAME_BUFFER:
                UpdateFrame( (Bitmap)data, channel );
                break;
            default:
                OnEvent(msgId, data, channel);
                break;

        }
    }

    private  void  OnEvent( int msgid, Object value)
    {
        OnEvent(msgid, value, -1);
    }

    private  void  OnEvent( int msgid, Object value, int channel)
    {
        if( msgid == Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_FRAME_TIME && valid_first_frame == false)
        {
            return;
        }
        try {
            WritableMap event = Arguments.createMap();
            event.putInt("msgid", msgid);
            event.putInt("channel", channel);
            if(value != null) {
                if (value instanceof String)
                    event.putString("value", (String) value);
                else
                {

                    if(value instanceof String[])
                    {
                        String[] c_value = (String[])value;
                        WritableArray array = Arguments.createArray();
                        for(int i = 0 ; i< c_value.length; i++)
                        {
                            array.pushString( c_value[i]);
                        }
                        event.putArray("value", array);
                    }
                    else
//                        if(value instanceof SearchAllDayInterval)
//                        {
//                            JSONObject.wrap()
//                        }
                    event.putInt("value", (int) value);
            }
            }

            ReactContext reactContext = (ReactContext)getContext();
            reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                    getId(),
                    Constant.FFMPEG_EVENT,
                    event);
        }
        catch (NullPointerException nex){
            Log.e("TAG", "NullPointerException " + nex.getMessage());
        }

    }
    private void initPaint(){
        mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        //mPaint.setColor(Color.RED);
        mPaint.setStrokeWidth(30);
        setLayerType(View.LAYER_TYPE_NONE, null);
        setLayerType(View.LAYER_TYPE_NONE, mPaint);
    }

    public static int dip2px(Context context, float dpValue) {
        final float scale = context.getResources().getDisplayMetrics().density;
        return (int) (dpValue * scale + 0.5f);
    }

    protected void onDraw(Canvas canvas) {
        if (!this.singlePlayer)
        {
            return;
        }
        //canvas.drawColor(Color.TRANSPARENT);
        super.onDraw(canvas);
        // CMSMobile not draw here
        canvas.clipRect(0,0, getWidth(), getHeight());
        canvas.translate(this._translateX, this._translateY);
        canvas.scale((float) this._scaleXY, (float) this._scaleXY);
        if(DrawBitmap != null)
        {
            Bitmap emptyBitmap = Bitmap.createBitmap(DrawBitmap.getWidth(), DrawBitmap.getHeight(), DrawBitmap.getConfig());
            if(DrawBitmap != null) {
                if (!DrawBitmap.sameAs(emptyBitmap)) {
                    preDrawBitmap = DrawBitmap;
                    valid_first_frame = true;
                    //Bitmap bmp = i3Global.resizeImage(preDrawBitmap, (int)this._width, (int)this._height, true );
                    Rect src =   new Rect(0, 0, getWidth(), getHeight());//new Rect(0,0,DrawBitmap.getWidth()-1, DrawBitmap.getHeight()-1);
                    //Rect dest = new Rect(0,0, (int)this.img_width, (int)this.img_height);
                    canvas.drawBitmap(preDrawBitmap, null, src, mPaint);
                    //bmp.recycle();
                    //bmp = null;
                    //Rect dest = new Rect(0, 0, getWidth(), getHeight());
                    //canvas.drawBitmap(preDrawBitmap,null, img_rect, mPaint);
                }else
                {
                    if(preDrawBitmap != null && !preDrawBitmap.sameAs(emptyBitmap)) {
//                        Rect dest = new Rect(0, 0, getWidth(), getHeight());
//                        canvas.drawBitmap(preDrawBitmap,null, dest, mPaint);
                        //Rect src = new Rect(0,0,DrawBitmap.getWidth(), DrawBitmap.getHeight());
                        Rect dest = new Rect(0,0,   this.img_width, this.img_height);
                        canvas.drawBitmap(preDrawBitmap, null, dest, mPaint);
                    }
                }
            }
        }
        else
        {
            if( src != null){

                Rect dest = new Rect(0, 0, getWidth(), getHeight());
                canvas.drawBitmap(src,null, dest, mPaint);
            }
        }
    }

    int _getScreenOrientation(){
        return getResources().getConfiguration().orientation;
    }
    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh){
        super.onSizeChanged(w,h,oldw,oldh);
      this.img_height = h;
      this.img_width = w;
      img_rect  = new Rect(0,0, (int)this.img_width, (int)this.img_height);
    }

//    @Override
//    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
//
//        int desiredWidth = 100;
//        int desiredHeight = 100;
//
//        int widthMode = MeasureSpec.getMode(widthMeasureSpec);
//        int widthSize = MeasureSpec.getSize(widthMeasureSpec);
//        int heightMode = MeasureSpec.getMode(heightMeasureSpec);
//        int heightSize = MeasureSpec.getSize(heightMeasureSpec);
//
//        int width;
//        int height;
//
//        //Measure Width
//        if (widthMode == MeasureSpec.EXACTLY) {
//            //Must be this size
//            width = widthSize;
//        } else if (widthMode == MeasureSpec.AT_MOST) {
//            //Can't be bigger than...
//            width = Math.min(desiredWidth, widthSize);
//        } else {
//            //Be whatever you want
//            width = desiredWidth;
//        }
//
//        //Measure Height
//        if (heightMode == MeasureSpec.EXACTLY) {
//            //Must be this size
//            height = heightSize;
//        } else if (heightMode == MeasureSpec.AT_MOST) {
//            //Can't be bigger than...
//            height = Math.min(desiredHeight, heightSize);
//        } else {
//            //Be whatever you want
//            height = desiredHeight;
//        }
//
//        //MUST CALL THIS
//        //int w = (int)this._width * 2 - 20;
//        //int h = (int)this._height * 2 - 20;
//        setMeasuredDimension( (int)this._width, (int)this._height );
//    }
//
    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        int width = getMeasuredWidth();
        int height = getMeasuredHeight();
        int widthWithoutPadding = width - getPaddingLeft() - getPaddingRight();
        int heigthWithoutPadding = height - getPaddingTop() - getPaddingBottom();

        int maxWidth = (int) (heigthWithoutPadding * RATIO);
        int maxHeight = (int) (widthWithoutPadding / RATIO);

        if (widthWithoutPadding  > maxWidth) {
            width = maxWidth + getPaddingLeft() + getPaddingRight();
        } else {
            height = maxHeight + getPaddingTop() + getPaddingBottom();
        }
//        this._width = width;
//        this._height = height;

        setMeasuredDimension(width, height);
    }
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

//        // Checks the orientation of the screen
//        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
//            Toast.makeText(this.getContext(), "landscape", Toast.LENGTH_SHORT).show();
//
//        } else if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT){
//            Toast.makeText(this.getContext(), "portrait", Toast.LENGTH_SHORT).show();
//        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        // View is now attached
        Activity activity =  reactContext.getCurrentActivity();
        if(activity != null)
        {
            activity.getWindow().addFlags( WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        // View is now detached, and about to be destroyed
        Activity activity =  reactContext.getCurrentActivity();
        if(activity != null) {
            setLayerType(View.LAYER_TYPE_HARDWARE, mPaint);
            activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }

    @Override
    public void finalize() {

        try {
            exitFullscreen();
            super.finalize();
        } catch (Throwable throwable) {
            throwable.printStackTrace();
        }
    }

    public void UpdateFrame(Bitmap bmp)
    {
        UpdateFrame(bmp, -1);
    }



    public void UpdateFrame(Bitmap bmp, int channel)
    {
        // TODO: single channel
        if (this.singlePlayer == true)
        {
            DrawBitmap = bmp;
            if (img_rect != null)
                this.invalidate(img_rect);
            // this.invalidate();
        } 
        else if(bmp != null)
        {
            if (this.isTakeANap)
            {
                Log.d("GOND", "CMSApp is taking a nap, comeback later!");
                return;
            }
            if (_width > 0 && _height > 0)
            {
                this.invalidate();
                new FrameEncodeTask(this, channel, _width, _height).execute(bmp);
            }


            /*
            //
            Long currentMs = System.currentTimeMillis();
            Long lastMs = lastFrameTimeByChannel.get(channel);
            if (lastMs == null)
            {
                lastFrameTimeByChannel.put((Integer)channel, currentMs);
            }
            else
            {
                Long dt = currentMs - lastMs;
                // Log.d("GOND", "UpdateFrame, timeDiff " + dt + ", channel " + channel);
                if (dt < 0 || dt > 200)
                {
                    lastFrameTimeByChannel.put((Integer)channel, currentMs);
                }
                else
                {
                    Log.e("GOND", "UpdateFrame skip frame, channel " + channel);
                    bmp.recycle();
                    return;
                }
            }
        
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            Bitmap bitmap = bmp;
            // Log.e("GOND", "UpdateFrame w = " + _width + ", h = " + _height);
            if (_width > 0 && _height > 0)
            {
                // Log.e("GOND", "UpdateFrame scaled bitmap");
                bitmap = Bitmap.createScaledBitmap(bmp, (int)_width, (int)_height, false);
            }
            boolean compressResult = bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            if (!compressResult)
            {
                bitmap.recycle();
                bmp.recycle();
                return;
            }
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            // Log.e("GOND", "UpdateFrame scaled bitmap 1: " + byteArray.length);

            String buffer = Base64.encodeToString(byteArray, Base64.DEFAULT);
            // Log.e("GOND", "UpdateFrame scaled bitmap 2: " + buffer.length());
            // bitmap.recycle();
            // bmp.recycle();
            bitmap = null;
            OnEvent(Constant.EnumVideoPlaybackSatus.MOBILE_JS_FRAME_DATA, buffer, channel);
            byteArray = null;
            // byteArrayOutputStream = null;
            */
        }
    }

    public void Refresh(boolean isSearch)
    {
        this.UpdateFrame(null);
        if( video_thread != null)
        {
            video_thread.interrupt();
            video_thread = null;
        }
        valid_first_frame = false;
    }

    public  void  Stop()
    {
        if( video_thread == null)
            return;

        if(socket_handler != null) {
            socket_handler.running = false;
            socket_handler.Stop();
        }
        video_thread.interrupt();
        video_thread = null;
        socket_handler = null;
        valid_first_frame = false;
    }

    //public  void  StartSearch(int KDVR, String ip, String WanIp, String Name, int port, String serverID, String UserName, String Password,String channel, boolean bychanel)
    public void StartSearch(DateTime date, int interval, boolean HD)
    {
        //this.Stop();
        int year, month, day, hour, min, sec;
        year = date.getYear();
        month = date.getMonthOfYear();
        day = date.getDayOfMonth();
        hour = date.getHourOfDay();
        min = date.getMinuteOfHour();
        sec = date.getSecondOfMinute();
        SearchTimeData search = new SearchTimeData(year, month, day, hour, min, sec, interval);

        valid_first_frame = false;
        if(video_thread == null || socket_handler == null || socket_handler.running == false) {
            this.Server.setLive(false);
            this.Server.setSearchTime(search);
            socket_handler = new CommunicationSocket(this.handler, this.Server, this.Channels, true, this.ByChannel, this.clientIp);
            socket_handler.setViewDimensions((int)_width, (int)_height);
            socket_handler.setHDMode( HD);
            video_thread = new Thread(socket_handler);
            video_thread.start();
        }
        else
        {
            boolean re_init = false;
            SearchTimeData searchtime = this.Server.getSearchTime();
            if( searchtime == null || searchtime.getYear() != year|| searchtime.getMonth() != month || searchtime.getDay() != day) {
                this.Server.setSearchTime(search);
                re_init = true;
            }
            socket_handler.setHDMode( HD);
            socket_handler.ChangePlay(false, re_init, Channels);
        }
    }
    public void setSource(@Nullable ReadableArray sources) {
        if (sources != null && sources.size() != 0) {
            ReadableMap source = sources.getMap(0);
            String uri = source.getString("uri");
            ImageSource imageSource = new ImageSource(getContext(), uri);
            src = BitmapFactory.decodeFile(uri);
        }

    }
    private boolean mockDisFlag = false;
    private void mockDisconnect() {
        final Handler handler2 = new Handler(Looper.getMainLooper());
        final Handler mainHandler = this.handler;
        handler2.postDelayed(new Runnable() {
            @Override
            public void run() {
                Log.d("2507", "mockDisconnect");
                if(mainHandler != null)
                    mainHandler.obtainMessage(Constant.EnumVideoPlaybackSatus.MOBILE_RELAY_DISCONNECTED, null ).sendToTarget();
                if(socket_handler != null)
                    socket_handler.CloseSocket();
                if( video_thread != null && socket_handler != null)
                {
                    socket_handler.running = false;
                    video_thread.interrupt();
                    socket_handler = null;
                    video_thread = null;
                }
            }
        }, 8*1000);
    }
    //public  void  StartLive(int KDVR, String ip, String WanIp, String Name, int port, String serverID, String UserName, String Password, String channel, boolean bychanel)
    public  void  StartLive( boolean HD )
    {
        Log.d("2507", "StartLive");
        //this.Stop();
        valid_first_frame = false;
        if( video_thread == null || socket_handler == null || socket_handler.running == false) {
            this.Server.setLive(true);
            socket_handler = new CommunicationSocket(this.handler, this.Server, this.Channels, false, this.ByChannel, this.clientIp);
            socket_handler.setViewDimensions((int)_width, (int)_height);
            socket_handler.setHDMode(HD);
            video_thread = new Thread(socket_handler);
            video_thread.start();
            if(!mockDisFlag) {
//                mockDisconnect();
                mockDisFlag = true;
            }
        }
        else
        {
            socket_handler.setHDMode(HD);
            socket_handler.ChangePlay( true, false, this.Channels);
        }
    }
    public  void  PauseVideo(){
        if( video_thread == null || socket_handler== null )
            return;
        try {
            socket_handler.PauseVideo();
        } catch (Exception e) {
            Log.e("GOND", "Pause video failed! " + e.getMessage());
        }
    }

    public void setFirstRun(boolean firstrun){
        if(firstrun != firstRunAlarm)
            firstRunAlarm = firstrun;
    }

    public void setSingle(boolean isSingle){
        if(isSingle != singlePlayer)
        singlePlayer = isSingle;
    }

    public void SeekPOS(int val, boolean HD)
    {
        if( video_thread == null || socket_handler== null )
            return;
        socket_handler.SeekPOS(val, HD, this.firstRunAlarm);
    }
    public void ViewHD( boolean HDMode)
    {
        // Log.d("GOND", "View HD " + (HDMode == true ? "true" : "false"));
        socket_handler.ChangetoHD(HDMode);
    }

    public void setScaleXY(double scaleXY) {
        this._scaleXY = scaleXY;
        this.invalidate();
    }

    public void setTranslateX(int translateX) {
        this._translateX = this.dip2px((ReactContext)getContext(), translateX);
        this.invalidate();
    }

    public void setTranslateY(int translateY) {
        this._translateY = this.dip2px((ReactContext)getContext(), translateY);
        this.invalidate();
    }

    public void rest(boolean value) {
        this.isTakeANap = value;
        if(socket_handler != null)
        {
            socket_handler.rest(value);
        }
    }

    protected class FrameEncodeTask extends AsyncTask<Bitmap, Integer, String> 
    {
        private FFMpegFrameView mViewer;
        private int mChannel;
        private int mWidth;
        private int mHeight;

        protected FrameEncodeTask(FFMpegFrameView uiView, int channel, double w, double h) {
            mViewer = uiView;
            mChannel = channel;
            mWidth = (int)w;
            mHeight = (int)h;
        }

        private ActivityManager.MemoryInfo getAvailableMemory() {
            ActivityManager activityManager = (ActivityManager) mViewer.getContext().getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
            activityManager.getMemoryInfo(memoryInfo);
            return memoryInfo;
        }

        @Override
        protected String doInBackground(Bitmap... bmp)
        {
            ActivityManager.MemoryInfo memoryInfo = getAvailableMemory();

            if (memoryInfo.lowMemory) {
                Log.d("GOND", "on Low memory on background!");
                System.gc();
                mViewer.rest(true);
                SystemClock.sleep(500);
                mViewer.rest(false);
                return null;
            }

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            // Bitmap bitmap = null;
            // if (bmp[0].getHeight() > mHeight && bmp[0].getWidth() > mWidth)
            //     bitmap = Bitmap.createScaledBitmap(bmp[0], mWidth, mHeight, false);
            // else
            //     bitmap = bmp[0];
            Bitmap bitmap = bmp[0];
            
            boolean compressResult = bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            if (!compressResult)
            {
                bitmap.recycle();
                return null;
            }
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            // Log.e("GOND", "UpdateFrame scaled bitmap 1: " + byteArray.length);

            String buffer = Base64.encodeToString(byteArray, Base64.DEFAULT);

            bitmap.recycle();
            bmp[0].recycle();
            return buffer;
        }

        @Override
        protected void onPostExecute(String result) {
            super.onPostExecute(result);
            if (result != null)
            {
                mViewer.OnEvent(Constant.EnumVideoPlaybackSatus.MOBILE_JS_FRAME_DATA, result, mChannel);
            }
        }
    }

}
