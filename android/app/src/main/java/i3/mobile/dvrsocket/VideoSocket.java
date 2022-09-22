package i3.mobile.dvrsocket;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
// import android.util.Base64;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
// import java.io.ByteArrayOutputStream;
import java.net.SocketException;
import java.util.TimeZone;
import java.util.Arrays;

import i3.mobile.FFMpegFrameView;
import i3.mobile.base.Constant;
import i3.mobile.base.FrameData;
import i3.mobile.base.FrameHeader;
import i3.mobile.base.ServerSite;
import i3.mobile.base.DST;
import i3.mobile.base.utils;
import i3.mobile.dvrremote.decode.DecodeArgument;
import i3.mobile.dvrremote.decode.FFMPEGDecoder;
import i3.mobile.search.setting.SearchTimeData;

//import cms.mobile.i3.cmslivesearch.base.ThreadInfo;

/**
 * Created by i3dvr on 12/19/2017.
 */

public class VideoSocket extends CommunicationSocket {

    static  final  int MAX_FRAME_LENGTH = 1024 *256;//256Kb
    static final int VIDEO_SOCKET_BUFFER = 1024 * 80;
    static final int MAX_INVALID_FRAMES = 4;
    public  static  final  int Resolution_Width = 720;
    public  static  final  int Resolution_Height = 480;
    private int mWidth = 0;
    private int mHeight = 0;
    public int originResolutionX = 0;
    public int originResolutionY = 0;
    FFMPEGDecoder ffmpeg;
    private boolean takeANap = false;
    private int invalidFrameCount = 0;
    // private static byte[] buff = new byte[VIDEO_SOCKET_BUFFER];
    // private static FrameData dataframe = new FrameData(0);

    public  VideoSocket( Handler hwnd, ServerSite serverinfo, String channel, boolean search, boolean bychannel, String clientIP)
    {

        super(hwnd, serverinfo, channel, search, bychannel, clientIP);
        ffmpeg = new FFMPEGDecoder();
        ffmpeg.LoadLib();
        Log.d("2408", "VideoSocket serverinfo.getIsRelayReconnecting()" + serverinfo.getIsRelayReconnecting());
    }

    public void setViewDimensions(int w, int h)
    {
        mWidth = w;
        mHeight = h;
    }

    public void rest(boolean value)
    {
        takeANap = value;
    }

    @Override
    public void run() {
        this.running = true;
        try {
            this.socket = this.isRelay ? super.InitRelaySocket() : super.InitSocket(ServerInfo.conntectingIp, ServerInfo.serverVideoPort);
            if( socket.isConnected() == false )
                OnHandlerMessage( isRelay? Constant.EnumVideoPlaybackSatus.MOBILE_REMOTE_RELAY_CONFIG_CHANGED :
                        Constant.EnumVideoPlaybackSatus.MOBILE_VIDEO_PORT_ERROR, null );
        }catch (Exception e)
        {
            OnHandlerMessage( isRelay? Constant.EnumVideoPlaybackSatus.MOBILE_REMOTE_RELAY_CONFIG_CHANGED :
                    Constant.EnumVideoPlaybackSatus.MOBILE_VIDEO_PORT_ERROR, null );
        }
        if( socket != null && socket.isConnected())
        {

            try {
                this.InPut = new BufferedInputStream(socket.getInputStream());
                this.OutPut = new BufferedOutputStream(socket.getOutputStream());
            }
            catch (Exception e){

            }

            running = notifyMakeRelayHandshake("video");

            //utils.WriteBlock( output, utils.IntToByteArrayOfC( ServerInfo.ConnectionIndex ));
            this.WriteSocketData(utils.IntToByteArrayOfC( ServerInfo.ConnectionIndex ), "VideoSocket");

            //int max_len = 1024 * 80;
            byte[] buff = new byte[VIDEO_SOCKET_BUFFER];
            // Arrays.fill(buff, (byte)0);
            FrameData dataframe = new FrameData(0);
            // dataframe.Reset();
            int remain_len = FrameData.Command_Header_Length;//need to read command first
            int read_len = 0;
            int offset = 0;
            long last_frame_time = 0;
            try {
                socket.setSoTimeout(Constant.socketReadTimeOut);
            }catch (SocketException ex){}
            catch (IllegalArgumentException iex){}
            relayHeaderBlockRemainLen = 0;
            while (!Thread.currentThread().isInterrupted() && running)
            {
                try
                {
                    boolean isRelayHeader = isRelay && (relayHeaderBlockRemainLen == 0);
//                    Log.d("relay", "debug = videoSocket relayHeaderBlockRemainLen = " + relayHeaderBlockRemainLen);
                    read_len = ReadBlock(InPut, remain_len ,buff, offset, isRelayHeader, false , "videoSocket");//utils.ReadBlock(input, remain_len ,buff, offset);

//                    relayHeaderBlockRemainLen -= read_len;

                    if( read_len == -1) {
                        if(running) {
                            long deltaTime = System.currentTimeMillis() - lastReadBlockSuccTimePoint;
                            Log.d("relay", "video socket ioEx deltaTime = " + deltaTime);
                            if (deltaTime > WAITING_TIME_SINCE_IO_EXCEPTION_OCCURRED) {
                                OnHandlerMessage(isRelay ? Constant.EnumVideoPlaybackSatus.MOBILE_REMOTE_RELAY_CONFIG_CHANGED :
                                        Constant.EnumVideoPlaybackSatus.MOBILE_VIDEO_PORT_ERROR, null);
                                break;
                            } else
                                continue;
                        }
                    }else{
                        lastReadBlockSuccTimePoint = System.currentTimeMillis();
                    }

                    if( read_len == 0 || isRelayHeader)
                        continue;
                    
                    offset += read_len;
                    if(takeANap)
                    {
                        Log.e("GOND","VideoSocket is taking nap, please comeback later!");
                        continue;
                    }
                    switch (dataframe.getState())
                    {
                        case Constant.EnumBufferState.COMMAND_GET:
                            if( offset >= dataframe.getReadSize()) {
                                GetCommnad(buff, dataframe);
                                remain_len = dataframe.getReadSize();
                                offset = 0;
                            }
                            else
                            {
                                remain_len = dataframe.getReadSize() - offset;
                            }
                            break;
                        case Constant.EnumBufferState.COMMAND_HEADER:
                            if( offset >= dataframe.getReadSize()) {
                                FrameHeader(buff, dataframe);
                                if( dataframe.getHeader() != null) {
                                    remain_len = dataframe.getHeader().length;
                                    offset = 0;
                                }
                                else
                                {
                                    dataframe.Reset();
                                    remain_len = FrameData.Command_Header_Length;//need to read command first
                                    offset = 0;
                                    relayHeaderBlockRemainLen = 0;
                                }
                            }
                            else {
                                remain_len = dataframe.getReadSize() - offset;
                            }
                            break;
                        case Constant.EnumBufferState.COMMAND_DATA:
                            dataframe.AppendBuffer( buff, 0, read_len);

                            if(  dataframe.getRemainLen() == 0) {

    //                             FrameHeader header = dataframe.getHeader();
    //                             char cmdid = dataframe.getCommand();
    //                             int width = header.resolutionX;
    //                             int height = header.resolutionY;
                                try
                                {
                                    VideoEncodeData(dataframe, last_frame_time);
                                    last_frame_time = dataframe.getHeader().time;
                                }
                                catch (Exception ex){}

                                dataframe.Reset();
                                remain_len = FrameData.Command_Header_Length;//need to read command first
                                offset = 0;
                                relayHeaderBlockRemainLen = 0;
                            }
                            else
                            {
                                remain_len = dataframe.getRemainLen();
                                offset = 0;
                            }

                            break;
                    }

                }
                catch (Exception e)
                {
                    //System.out.print(e.getMessage());
                    // dongpt: should we reset offset to 0?
                    offset = 0;
                }
                finally
                {
                    if (offset == 0)
                        Arrays.fill(buff, (byte)0);
                }
            } //end while
            this.CloseSocket();
            buff = null;
            dataframe = null;
        }
        running = false;
    }

    void  VideoEncodeData( FrameData dataframe, long last_frame_time){
        FrameHeader header = dataframe.getHeader();
        int cmdid = dataframe.getCommand();
        int width = header.resolutionX;
        int height = header.resolutionY;
        
        originResolutionX = header.originResolutionX;
        originResolutionY = header.originResolutionY;
        if (header.mainSubStream == 0 && mWidth > 0 && mHeight > 0)
        {
            Log.d("GOND", "**DIRECT** - VideoSocket use viewRes: " + mWidth + ", " + mHeight);
            width = mWidth;
            height = mHeight;
        }
        else if( width == 0)
        {
            Log.d("GOND", "**DIRECT** - VideoSocket use originalRes: " + originResolutionX + ", " + originResolutionY);
            width = originResolutionX;
            height = originResolutionY;
        }
        else
        {
            Log.d("GOND", "**DIRECT** - VideoSocket use res: " + width + ", " + height);
        }
        Log.d("GOND", "**DIRECT** - VideoSocket cmdid: " + cmdid + ", mainSub = " + header.mainSubStream);

        if (ServerInfo.getTimeZone() != null)
            onFrameTimeEvent( header.time, ServerInfo.getTimeZone().getTimeZone() ,last_frame_time);
        switch ( cmdid)
        {
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_NEXT_FRAME:
            {
//                if( super.ServerInfo.getisLive() == false)
//                {
//                    Long time = dataframe.getHeader().time;
//
//                    String time_format = SearchTimeData.getTimeDisplayFull( time, super.ServerInfo.getTimeZone().getTimeZone());
//                    System.out.println(time_format);
//                    DateTimeZone forTimeZone = DateTimeZone.forTimeZone( super.ServerInfo.getTimeZone().getTimeZone());
//                    DateTime dt = new DateTime( time * 1000);
//                    super.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_FRAME_TIME, time_format);
//                    onFrameTimeEvent( header.time, ServerInfo.getTimeZone().getTimeZone() ,last_frame_time);
//                }
                try {
                    byte[] b = dataframe.getBuffer();

                    Bitmap bmp = BitmapFactory.decodeByteArray(b, 0, b.length);
                    // // CMS TODO: on single player
                    // Log.e("GOND", "Native send frame 1 " );
                    // if (true) {
                    //     Log.e("GOND", "Native send frame 1 - a" );
                        this.sendFrameBuffer(bmp , header.sourceIndex);
                    // } else {
                    //     Message completeMessage = handler.obtainMessage(Constant.EnumVideoPlaybackSatus.MOBILE_FRAME_BUFFER, bmp);
                    //     completeMessage.sendToTarget();
                    // }
                }catch (Exception ex){
                    //Log.d("bug","bug ");
                }

            }
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_NEXT_ENCODE_FRAME:
            {
//                if( super.ServerInfo.getisLive() == false)
//                    break;
//                if( super.ServerInfo.getisLive() == false)
//                {
//                    Long time = dataframe.getHeader().time;
//
//                    String time_format = SearchTimeData.getTimeDisplayFull( time, super.ServerInfo.getTimeZone().getTimeZone());
//                    System.out.println(time_format);
//                    DateTimeZone forTimeZone = DateTimeZone.forTimeZone( super.ServerInfo.getTimeZone().getTimeZone());
//                    DateTime dt = new DateTime( time * 1000);
//                    super.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_FRAME_TIME, time_format);
//                    onFrameTimeEvent( header.time, ServerInfo.getTimeZone().getTimeZone(),last_frame_time);
//                }
                //onFrameTimeEvent( header.time, ServerInfo.getTimeZone().getTimeZone(),last_frame_time);
                Log.d("GOND", "**DIRECT** - VideoSocket MOBILE_ENCODE: " + header.codecType + ", len = " + dataframe.getBuffer().length + ", sIndex = " + header.sourceIndex + ", idx = " + header.index);
                if(header.codecType >= Constant.EnumImageCodecType.MOBILE_ENCODE) // && header.mainSubStream == 0)
                {
                    try {

                        Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                        boolean result = ffmpeg.naDecodeImage(bmp, width, height, dataframe.getBuffer(), header.sourceIndex, false, header.index, false);
                        Bitmap emptyBitmap = Bitmap.createBitmap(width, height, bmp.getConfig());
                        
                        if (bmp.sameAs(emptyBitmap)) {
                            Log.d("GOND", "**DIRECT** - VideoSocket decoded empty, try BMP...");
                            // byte[] b = dataframe.getBuffer();
                            // bmp = null;
                            // bmp = BitmapFactory.decodeByteArray(b, 0, b.length);
                            if (invalidFrameCount < MAX_INVALID_FRAMES) {
                                invalidFrameCount++;
                            } else {
                                ffmpeg.destroyFFMEGContext(header.sourceIndex);
                                ffmpeg = new FFMPEGDecoder();
                                invalidFrameCount = 0;
                            }
                            return;
                        }

                        if( result == true) {
                            // CMS TODO: on single player
                            Log.e("GOND", "Native send frame 2" );
                            this.sendFrameBuffer(bmp , header.sourceIndex);
                            // } else {
                            //     Message completeMessage = handler.obtainMessage(Constant.EnumVideoPlaybackSatus.MOBILE_FRAME_BUFFER, bmp);
                            //     completeMessage.sendToTarget();
                            // }
                        }
                    }
                    catch (Exception drex){}
                }
                else
                {
                    Log.d("GOND", "**DIRECT** - VideoSocket decoded mainstream...");
                    byte[]b = dataframe.getBuffer();

                    Bitmap bmp = BitmapFactory.decodeByteArray(b, 0, b.length);
                    // CMS TODO: on single player
                    // Log.e("GOND", "Native send frame 3" );
                    // if (true) {
                    //     Log.e("GOND", "Native send frame 3 - a" );
                        this.sendFrameBuffer(bmp , header.sourceIndex);
                    // } else {
                    //     Message completeMessage = handler.obtainMessage(Constant.EnumVideoPlaybackSatus.MOBILE_FRAME_BUFFER, bmp);
                    //     completeMessage.sendToTarget();
                    // }

                    // dongpt: send black frame instead of null
                    // if (bmp == null)
                    // {
                    //     this.sendFrameBuffer(Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888), header.sourceIndex);
                    // }
                }
                break;
            }
            case Constant.EnumCmdMsg.MOBILE_MSG_ENCODED_VIDEO:
            case Constant.EnumCmdMsg.MOBILE_MSG_ENCODED_VIDEO_GROUP:
            {
                try {
                    Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                    boolean result = ffmpeg.naDecodeImage(bmp, width, height, dataframe.getBuffer(), header.sourceIndex, false, header.index, false);
                    if( result == true) {
                        DecodeArgument argument = new DecodeArgument();
                        ffmpeg.getArgument(dataframe.getBuffer(), argument);
                        //onFrameTimeEvent(header.time, ServerInfo.getTimeZone().getTimeZone(),last_frame_time);

                        // Long time = argument.getTime();
                        // String time_format = SearchTimeData.getTimeDisplayFull( time, super.ServerInfo.getTimeZone().getTimeZone());
                        // System.out.println(time_format);
                        // DateTimeZone forTimeZone = DateTimeZone.forTimeZone( super.ServerInfo.getTimeZone().getTimeZone());
                        // DateTime dt = new DateTime( time * 1000);
                        // super.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_FRAME_TIME, time_format);

                        // CMS TODO: on single player
                        Log.e("GOND", "Native send frame 4" );
                        Bitmap emptyBitmap = Bitmap.createBitmap(width, height, bmp.getConfig());
                        
                        if (bmp.sameAs(emptyBitmap)) {
                            Log.d("GOND", "**DIRECT** - VideoSocket decoded empty, try BMP...");
                            // byte[] b = dataframe.getBuffer();
                            // bmp = null;
                            // bmp = BitmapFactory.decodeByteArray(b, 0, b.length);
                            if (invalidFrameCount < MAX_INVALID_FRAMES) {
                                invalidFrameCount++;
                            } else {
                                ffmpeg.destroyFFMEGContext(header.sourceIndex);
                                ffmpeg = new FFMPEGDecoder();
                                invalidFrameCount = 0;
                            }
                            return;
                        }
                        // if (true) {
                        //     Log.e("GOND", "Native send frame 4 - a" );
                            this.sendFrameBuffer(bmp , header.sourceIndex);
                        // } else {
                        //     Message completeMessage = handler.obtainMessage(Constant.EnumVideoPlaybackSatus.MOBILE_FRAME_BUFFER, bmp);
                        //     completeMessage.sendToTarget();
                        // }
                    }
                }catch (Exception ex){}
                break;
            }
        }

    }

    void sendFrameBuffer(Bitmap bmp, int channel) {
        // if (false) {
            Message completeMessage = handler.obtainMessage(Constant.EnumVideoPlaybackSatus.MOBILE_FRAME_BUFFER, channel, 0, bmp);
            completeMessage.sendToTarget();
        // } else {
        //     ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        //     Bitmap bitmap = bmp;
        //     Log.e("GOND", "sendFrameBuffer w = " + viewWidth + ", h = " + viewHeight);
        //     if (viewWidth > 0 && viewHeight > 0) {
        //         bitmap = Bitmap.createScaledBitmap(bmp, viewWidth, viewHeight, true);
        //     }
        //     bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
        //     byte[] byteArray = byteArrayOutputStream .toByteArray();

        //     String buffer = Base64.encodeToString(byteArray, Base64.DEFAULT);

        //     String astr_app = "{\"buffer\":\"%s\",\"channel\":\"%d\"}";
        //     String res = String.format(astr_app, buffer, channel);
        //     super.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_JS_FRAME_DATA, "[" + res + "]");
        // }
    }

    void changeChannel(String newChannel) {
        this.str_Channel = newChannel;
    }

    void  onFrameTimeEvent(long time, TimeZone tz, long last_frame_time){
        if( time == last_frame_time)
            return;

//        if(daylight != null && (daylight.isBeginOfDST() || daylight.isEndOfDST()))
//        {
//            super.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_FRAME_TIME, time);
//        } else {
//            String  datetime = SearchTimeData.getTimeDisplayFull( time, tz);
//            super.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_FRAME_TIME, datetime);
//        }

        String  datetime = SearchTimeData.getTimeDisplayFull( time, tz);
        String result[]= new String[2];
        String astr_app = "{\"timestamp\":%d, \"value\":\"%s\",\"channel\":\"%s\"}";
        String res = String.format(astr_app, time, datetime, str_Channel);
        super.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_FRAME_TIME, "[" + res + "]");

    }

    void FrameHeader(byte[] buff, FrameData frame)
    {

        int index = 0;

        int codecType = utils.ByteArrayOfCToIntJava(buff, index );  //ReadInt(_is);
        index += Integer.BYTES;
        char resolutionX = utils.ByteArrayCToChar(buff, index);  //ReadChar(_is);
        index += Character.BYTES;
//        if(resolutionX == 0)
//        {
//            //I3Exception.writeErrorLog("Socket read  error");
//            resolutionX = utils.ByteArrayToChar(buff, index); //ReadChar(_is);
//            index += Character.BYTES;
//        }
        char resolutionY = utils.ByteArrayCToChar(buff, index); //ReadChar(_is);
        index += Character.BYTES;

        int sourceIndex = utils.ByteArrayOfCToIntJava(buff, index );  //ReadInt(_is);
        index += Integer.BYTES;

        int length = utils.ByteArrayOfCToIntJava(buff, index );  //ReadInt(_is);
        index += Integer.BYTES;
        if(length <= 0 ) {
            Log.d("Data length", Integer.toString(length ));
        }
        char originResolutionX = 0;
        char originResolutionY = 0;

        int mainSubStream  = - 1;
        long time = 0;
        int serverVersion = super.ServerInfo.serverVersion;
        int frameIndex = 0;
        if(serverVersion >= Constant.EnumServerVersion.VERSION_2300)
        {
            originResolutionX = utils.ByteArrayCToChar(buff, index); //ReadChar(_is);
            index += Character.BYTES;

            originResolutionY = utils.ByteArrayCToChar(buff, index); //ReadChar(_is);
            index += Character.BYTES;
            // settings[_serverIndex].SetServerInputResolution(sourceIndex, originResolutionX, originResolutionY);
        }
        if(serverVersion >= Constant.EnumServerVersion.VERSION_SUPPORT_SEARCHING)
        {
            mainSubStream  = utils.ByteArrayOfCToIntJava(buff, index );  //ReadInt(_is);
            index += Integer.BYTES;

            time  = utils.ByteArrayOfCToIntJava(buff, index );  //ReadInt(_is);
            index += Integer.BYTES;
            frameIndex = utils.ByteArrayOfCToIntJava(buff, index );  //ReadInt(_is);
            index += Integer.BYTES;
        }
        FrameHeader fheader = new FrameHeader (codecType, resolutionX, resolutionY, sourceIndex, length, originResolutionX, originResolutionY, mainSubStream,time,frameIndex);
        if( fheader.length > 0 && fheader.length <= MAX_FRAME_LENGTH) {
            frame.setHeader(fheader);
            frame.setReadSize(fheader.length);
            frame.setState(Constant.EnumBufferState.COMMAND_DATA);
        }
        //return (new FrameHeader(codecType, resolutionX, resolutionY, sourceIndex, length, originResolutionX, originResolutionY, mainSubStream,time,frameIndex));
    }
    void GetCommnad(byte[] src, FrameData frame)
    {


        byte[] bb = { src[1],src[0]};

        char Command = utils.ByteArrayToChar(bb, 0);  //utils.ByteArrayToChar(src,0);
        frame.setCommand(Command);
        switch ( Command)
        {
            case Constant.EnumCmdMsg.MOBILE_MSG_KEEP_ALIVE:
            case Constant.EnumCmdMsg.MOBILE_MSG_MINIMIZE:
            case Constant.EnumCmdMsg.MOBILE_MSG_DISCONNECT:
                frame.Reset();
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_NEXT_FRAME:
            case Constant.EnumCmdMsg.MOBILE_MSG_ENCODED_VIDEO:
            case Constant.EnumCmdMsg.MOBILE_MSG_ENCODED_VIDEO_GROUP:
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_NEXT_ENCODE_FRAME:
                int ReadSize = FrameData.FRAME_HEADER_SIZE;
                if( ServerInfo.serverVersion > Constant.EnumServerVersion.VERSION_2300)
                {
                    if(ServerInfo.serverVersion < Constant.EnumServerVersion.VERSION_3300)
                    {
                        ReadSize = FrameData.FRAME_HEADER_EX_SIZE_SERVER_3_2;
                    }
                    else
                    {
                        ReadSize = FrameData.FRAME_HEADER_EX_SIZE_SERVER_3_3;
                    }
                }

                frame.setReadSize(ReadSize);
                frame.setState(Constant.EnumBufferState.COMMAND_HEADER);
                break;
            default:
                frame.setReadSize(FrameData.Command_Header_Length);
                frame.setState(Constant.EnumBufferState.COMMAND_GET);
                break;
        }
    }
}
