package i3.mobile.dvrsocket;


import android.os.AsyncTask;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.text.TextUtils;
import android.util.Log;

import org.joda.time.DateTime;
import org.json.JSONException;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.lang.reflect.Array;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.nio.channels.Selector;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;

import i3.mobile.base.CommandState;
import i3.mobile.base.Constant;
import i3.mobile.base.MsgCommandItem;
import i3.mobile.base.ServerSite;
import i3.mobile.base.DST;
import i3.mobile.base.utils;
import i3.mobile.dvrremote.decode.FFMPEGDecoder;
import i3.mobile.search.setting.SearchAllDayInterval;
import i3.mobile.search.setting.SearchDay;
import i3.mobile.search.setting.SearchDayInterval;
import i3.mobile.search.setting.SearchDayList;
import i3.mobile.search.setting.SearchTimeData;
import i3.mobile.search.setting.SearchTimeInterval;
import i3.mobile.search.setting.ServerTimeZone;
import i3.mobile.base.Utilities;

/**
 * Created by i3dvr on 12/15/2017.
 */

public class CommunicationSocket implements Runnable {

    static  int Socket_Time_Out = 10000;
    static  int Connect_Time_Out = 1000 * 30;//30 seconds
    static  int Socket_Buff_Len = 1024 *80;//80kBs
    public   volatile  boolean running;
    //protected InetAddress hostAddress;
    protected ServerSite ServerInfo;
    public  DST daylight;
    //public  ServerSite getServerInfo(){ return ServerInfo;}
    protected int port;
    private String message = "";
    protected Selector selector;
    protected  Socket socket;
    protected int[] Channel;
    private byte PlaybackStatus = Constant.EnumPlaybackSatus.VIDEO_PLAY;
    private boolean HDMode = false;
    protected boolean Search;
    protected boolean PlaybyChannel;
    public  void setHDMode( boolean value){ HDMode = value;}
    public  boolean getHDMode(){ return this.HDMode;}
    public  boolean getPlaybyChannel(){ return  this.PlaybyChannel;}
    public  int[] getChannel(){ return  Channel;}
    public  boolean getSearch(){ return  Search;}
    protected  String str_Channel;
    protected Handler handler;
    protected BufferedOutputStream OutPut;
    protected  BufferedInputStream InPut;
    public VideoSocket video_handler = null;
    private int width = 0;
    private int height = 0;
    protected boolean isRelay;
    protected String clientIp;

    protected boolean withRelayHeader = false;
    protected int relayHeaderBlockRemainLen = 0;

    public CommunicationSocket(Handler hwnd, ServerSite serverinfo, String channel, boolean search, boolean bychannel, String clientIp){
        //this.message = message;
        //this.hostAddress = address;
        //this.port = port;
        this.handler = hwnd;
        str_Channel = channel;
        ServerInfo = serverinfo;
        String[] chs = channel.split(",");
        Channel = new int[chs.length];
        for(int i = 0; i < chs.length; i++)
        {
            Channel[i] = Integer.parseInt(chs[i]);
        }

        Search = search;
        this.PlaybyChannel = bychannel;
        this.isRelay = serverinfo.isRelay && serverinfo.relayConnectable;
        this.clientIp = clientIp;
        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " CommunicationSocket constructor this.isRelay = " + this.isRelay);
    }


    protected   Socket InitSocket( String ip, int port)throws IOException
    {
        try {
            Socket socket = new Socket();
            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " InetSocketAddress ip = " + ip + " port = " + port);
            SocketAddress sockAdd = new InetSocketAddress(ip, port);
            socket.connect(sockAdd, Socket_Time_Out);
            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " socket.connect sockAdd = " + sockAdd + " socket = " + socket);
            return socket;
        }
        catch (IllegalArgumentException ilex){
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " InitDirectSocket catch ilex: ", ilex);
        }
        catch (SocketException skex) {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " InitDirectSocket catch skex: ", skex);
        }
        catch (UnsupportedOperationException un_ex) {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " InitDirectSocket catch un_ex: ", un_ex);
        }
        catch (IOException ioEx) {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " InitDirectSocket catch ioEx: ", ioEx);
        }
        catch (Exception ex) {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " InitDirectSocket catch ex: ", ex);
        }
        return null;
    }
    private Socket InitDirectSocket()
    {
        if( ServerInfo == null) return  null;
        int port = Integer.parseInt( ServerInfo.serverPort);
        String[]hosties = {ServerInfo.serverIP, ServerInfo.serverWANIp};
        Log.d("GOND", "InitDirectSocket hosties length: " + hosties.length);
        Socket socket = null;
        for (String host : hosties) {
            if( running == false || Thread.interrupted() || socket != null)
                break;
            try {
                socket = InitSocket(host, port);
                ServerInfo.conntectingIp = host;
            }
            catch (Exception ex) {
                Log.e("GOND", "InitDirectSocket ex: ", ex);
            }
        }
        return  socket;
    }

    public void setViewDimensions(int w, int h)
    {
        if (video_handler != null)
        {
            video_handler.setViewDimensions(w, h);
        }
        else
        {
            width = w;
            height = h;
        }
    }

    public void rest(boolean value)
    {
        if (video_handler != null)
        {
            video_handler.rest(value);
        }
    }

    protected Socket InitRelaySocket()
    {
        if(ServerInfo == null)
            return null;
        try {
            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " InitRelaySocket try ");
            Socket socket = InitSocket(ServerInfo.relayIp, ServerInfo.relayPort);//19901);//relay1.i3international.com//test-relay.i3international.com//192.168.20.202
//            ServerInfo.conntectingIp = ServerInfo.relayIp;//"192.168.20.158";//""192.168.20.202";//"relay1.i3international.com";
            return  socket;
        }
        catch (Exception ex) {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " InitRelaySocket catch ex: ", ex);
            return  null;
        }
    }

    private static final int RELAY_HEADER_LEN = 68;

    private JSONObject parseRelayHandshakeResponse() {
        JSONObject result = null;
        byte[] headerBytes = new byte[RELAY_HEADER_LEN];
        ReadBlock(InPut, RELAY_HEADER_LEN, headerBytes, 0, "parseRelayHandshakeResponse");

        int totalLen = utils.ByteArrayOfCToIntJava( headerBytes,0);
        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " parseRelayHandshakeResponse totalLen = " + totalLen);

        byte[] jsonBytes = new byte[totalLen - RELAY_HEADER_LEN];
        ReadBlock(InPut, totalLen - RELAY_HEADER_LEN, jsonBytes, 0, "parseRelayHandshakeResponse");
//        String jsonString = new String(jsonBytes, StandardCharsets.UTF_8);
//        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " parseRelayHandshakeResponse jsonString = " + jsonString);
//        return jsonBytes;
//        byte[] jsonBytes = parseRelayResponse();
        String jsonString = new String(jsonBytes, StandardCharsets.UTF_8);
        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " parseRelayHandshakeResponse jsonString = " + jsonString);

        if(!jsonString.contains("session_id")){
            OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_RELAY_HANDSHAKE_FAILED, null);
        }
        return null;
    }

    void notifyMakeRelayHandshake(String service) {
        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " notifyMakeRelayHandshake service = " + service + " this.isRelay = " + this.isRelay);
        if(this.isRelay) {
            JSONObject json = new JSONObject();

            try {
                json.put("command", "connect");
                json.put("id", ServerInfo.serverID);//"nghia!@#"
                json.put("service", "com.i3.srx_pro.mobile." + service);//video//control
                json.put("serial_number", ServerInfo.haspLicense);//"nghia-a");
            } catch (JSONException e) {
                e.printStackTrace();
                return;
            }

            byte[] jsonBytes = json.toString().getBytes(StandardCharsets.UTF_8);
            WriteSocketData(jsonBytes, "notifyMakeRelayHandshake");
            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " request content = " + json.toString());
            parseRelayHandshakeResponse();
        }
    }

    boolean lastIsLive = true;
    Thread mainThread = null;
    @Override
    public void run(){
        running = true;
        Thread thread_Video_socket = null;
        // VideoSocket video_handler = null;
        video_handler = null;
        PlaybackStatus = Constant.EnumPlaybackSatus.VIDEO_PLAY;
        OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_CONNECTTING, null );
        socket = this.isRelay ? InitRelaySocket() : InitDirectSocket();
        if( socket != null)
        {
            //BufferedInputStream input = null;
            //BufferedOutputStream output = null;
            try {
                InPut = new BufferedInputStream(socket.getInputStream());
                OutPut = new BufferedOutputStream(socket.getOutputStream());

                try {
                    notifyMakeRelayHandshake("control");
                }catch (Exception e) {
                    Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " notifyMakeRelayHandshake Exception e = " + e);
                }

                ServerInfo.serverVersion = this.ReadServerVersion(InPut);
                Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " ServerInfo.serverVersion = " + ServerInfo.serverVersion);

                if (ServerInfo.serverVersion < 0)//
                {
                    OnHandlerMessage(Constant.EnumVideoPlaybackSatus.SVR_REJECT_ACCEPT, null);
                    running = false;
                }

                OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_LOGIN_MESSAGE, null);
                int send_len = this.SendLogin(this.ServerInfo);
                if (send_len == -1) {
                    Log.d("GOND", "MOBILE_CANNOT_CONNECT_SERVER: Send login failed");
                    OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_CANNOT_CONNECT_SERVER, null);
                }

                char cmd_id = Constant.EnumCmdMsg.MOBILE_MSG_GROUP_COMMUNICATION_BEGIN;
                int rcv_len = 0;
                //int msg_len = 0;
                byte[] rcv = new byte[Socket_Buff_Len];
                int rcv_offset = 0;

                int available_len = 0;//available data in buffer

                //int remain = Character.BYTES;
                //byte state = Constant.EnumBufferState.COMMAND_GET;
                CommandState cmdsate = new CommandState();
                cmdsate.remain_len = Character.BYTES;
                cmdsate.state = Constant.EnumBufferState.COMMAND_GET;
                try {
                    socket.setSoTimeout(Constant.socketReadTimeOut);
                } catch (SocketException ex) {
                    Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " SocketException = " + ex);
                } catch (IllegalArgumentException iex) {
                    Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " IllegalArgumentException = " + iex);
                }
                withRelayHeader = true;
                relayHeaderBlockRemainLen = 0;
                while (!Thread.currentThread().isInterrupted() && running) {
                    rcv_len = ReadBlock(InPut, cmdsate.remain_len, rcv, rcv_offset, isRelay && (relayHeaderBlockRemainLen == 0), "rcv_len");

                    relayHeaderBlockRemainLen -= cmdsate.remain_len;

                    if (rcv_len == 0) {
                        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " rcv_len == 0 continue");
                        continue;
                    }else{

                    }
                    rcv_offset += rcv_len;
                    switch (cmdsate.state) {
                        case Constant.EnumBufferState.COMMAND_GET:
                            cmd_id = utils.ByteArrayCToChar(rcv, 0);
                            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " cmdsate.state = COMMAND_GET cmd_id = " + (int) cmd_id);
                            rcv_offset = 0;
                            cmdsate.cmdid = cmd_id;
                            SelectCommand(InPut, cmdsate);

                            break;
                        case Constant.EnumBufferState.COMMAND_HEADER:
                            cmdsate.msg_len = utils.ByteArrayOfCToIntJava(rcv, 0);
                            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " cmdsate.state = COMMAND_HEADER cmdsate.msg_len = " + cmdsate.msg_len);
                            rcv_offset = 0;
                            if (cmdsate.msg_len <= 0) {
                                cmdsate.ResetState();
                                //remain = Character.BYTES;
                                //state = Constant.EnumBufferState.COMMAND_GET;

                            } else {
                                //remain = msg_len;
                                cmdsate.remain_len = cmdsate.msg_len;
                                cmdsate.state = Constant.EnumBufferState.COMMAND_DATA;
                            }
                            break;
                        case Constant.EnumBufferState.COMMAND_DATA:
                            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " cmdsate.state = COMMAND_DATA");
                            if( rcv_offset >= cmdsate.msg_len)//complete
                            {
                                //remain = Character.BYTES;
                                //state = Constant.EnumBufferState.COMMAND_GET;

                                this.ProcessCommand(InPut, cmd_id, rcv, cmdsate.msg_len, 0);

                                if( cmd_id == Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO)
                                {
                                    video_handler = new VideoSocket( handler, this.ServerInfo,this.str_Channel, this.Search, this.PlaybyChannel, this.clientIp);
                                    if (width > 0 && height > 0)
                                        video_handler.setViewDimensions(width, height);
                                    thread_Video_socket = new Thread( video_handler);
                                    thread_Video_socket.start();

                                }
                                rcv_offset = 0;
                                cmdsate.ResetState();
                            }
                            else
                            {
                                cmdsate.remain_len = cmdsate.msg_len - rcv_offset;
                            }
                            break;
                    }
                }
            }catch (IOException ioe){
                Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " IOException" + ioe.toString());
            }
            finally {
                CloseSocket();
                if( thread_Video_socket != null && video_handler != null)
                {
                    video_handler.running = false;
                    thread_Video_socket.interrupt();
                    video_handler = null;
                    thread_Video_socket = null;

                }
            }
        }
        else
        {
            Log.d("GOND", "MOBILE_CANNOT_CONNECT_SERVER: Socket is null");
            OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_CANNOT_CONNECT_SERVER, null);
        }
        PlaybackStatus = Constant.EnumPlaybackSatus.VIDEO_STOP;
        running = false;
    }

    int dataUsage = 0;
    long lastDataUsageSentTimePoint = System.currentTimeMillis();
    private void notifyUpdateDataUsage(int newBlockLen, String debug){
        if(this.isRelay) {
            dataUsage += newBlockLen;
            long newTimePoint = System.currentTimeMillis();
            long deltaTime = newTimePoint - lastDataUsageSentTimePoint;
            if (deltaTime >= 3 * 1000) {
                lastDataUsageSentTimePoint = newTimePoint;
                OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_RELAY_UPDATE_DATA_USAGE, dataUsage);
                dataUsage = 0;
            }
        }
    }

    int relayHeaderBlockCount = 0;
    protected int ReadBlock(BufferedInputStream _is, int _length, byte[] buff, int offset, boolean hasRelayHeader, String debug)
    {
        Log.d("GOND", "1508 hasRelayHeader = " + hasRelayHeader);
        if(hasRelayHeader) {
            byte[] headerBytes = new byte[RELAY_HEADER_LEN];
            int readHeaderCount = ReadBlock(InPut, RELAY_HEADER_LEN, headerBytes, 0, debug);
            if(readHeaderCount == 0) {
                Log.d("GOND","relay isLive = " + ServerInfo.getisLive() + " ReadBlock hasRelayHeader  _length = " + _length +
                        " relayHeaderBlockCount = " + relayHeaderBlockCount + " debug = " + debug + " readHeaderCount = " + readHeaderCount + "RETURN !!!!!!!!");
                return 0;
            }else {
                int totalLen = utils.ByteArrayOfCToIntJava( headerBytes,0);
                Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " ReadBlock hasRelayHeader  _length = " + _length +
                        " relayHeaderBlockCount = " + relayHeaderBlockCount + " totalLen = " + totalLen + " debug = " + debug + " readHeaderCount = " + readHeaderCount);
                relayHeaderBlockRemainLen = totalLen - RELAY_HEADER_LEN;
                relayHeaderBlockCount++;
            }
        }else
            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " ReadBlock NoRelayHeader _length = " + _length + " debug = " + debug);
        return ReadBlock(_is, _length, buff, offset, debug);
    }

    protected int ReadBlock(BufferedInputStream _is, int _length, byte[] buff, int offset, String debug)
    {
        int count = 0;
        try {
            if(_length < buff.length - offset)
                count = _is.read(buff, offset, _length);
            else
                count = _is.read(buff, offset, buff.length - offset);
            notifyUpdateDataUsage(count, debug);
        }
        catch (SocketTimeoutException tm)
        {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " ReadBlock SocketTimeoutException tm = " + tm + " debug = " + debug);
            return  0;
        }
        catch (IndexOutOfBoundsException outex)
        {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " ReadBlock IndexOutOfBoundsException outex = " + outex + " debug = " + debug);
            return count;
        }
        catch (IOException e)
        {
            count = -1;// socket failed
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " ReadBlock IOException e = " + e + " debug = " + debug);
        }
        // for (int i = offset; i < count; i ++)
        // {
        //     if (buff[i] != (byte)0)
        //         return  count;
        // }
        // return 0;
        return  count;
    }
    protected int SelectCommand(BufferedInputStream in, CommandState  state)
    {
        char cmd_id = state.cmdid;
        int ret = 1;
        if(cmd_id <= Constant.EnumCmdMsg.MOBILE_MSG_GROUP_COMMUNICATION_BEGIN  || cmd_id >= Constant.EnumCmdMsg.MOBILE_MSG_MAX_VALUE_FOR_MOBILE) {
            state.ResetState();
            return ret;
        }
        switch (cmd_id)
        {

            case Constant.EnumCmdMsg.MOBILE_MSG_EXIT:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_EXIT:");
                state.ResetState();
                running = false;
                Log.d("GOND", "MOBILE_CANNOT_CONNECT_SERVER: received exit message");
                this.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_CANNOT_CONNECT_SERVER, null );
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_VIDEO_SOCKET_ERROR:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_VIDEO_SOCKET_ERROR:");
                state.ResetState();
                //this.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_VIDEO_PORT_ERROR, null );
                //running = false;
                break;

            case Constant.EnumCmdMsg.MOBILE_MSG_KEEP_ALIVE:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_KEEP_ALIVE:");
                state.ResetState();
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_CHANGED_CURRENT_USER:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SERVER_CHANGED_CURRENT_USER:");
                state.ResetState();
                running = false;
                this.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SERVER_CHANGED_CURRENT_USER, null );
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_CHANGED_SERVER_INFO:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SERVER_CHANGED_SERVER_INFO:");
                state.ResetState();
                running = false;
                this.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SERVER_CHANGED_SERVER_INFO, null );
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_CHANGED_PORTS:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SERVER_CHANGED_PORTS:");
                state.ResetState();
                running = false;
                this.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SERVER_CHANGED_PORTS, null );
                break;

            case Constant.EnumCmdMsg.MOBILE_MSG_MOBILE_SEND_SETTINGS:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_MOBILE_SEND_SETTINGS:");
                state.state = Constant.EnumBufferState.COMMAND_DATA;
                state.msg_len = Byte.BYTES;
                state.remain_len = Byte.BYTES;
                break;

            case Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO:");
                state.state = Constant.EnumBufferState.COMMAND_DATA;
                state.msg_len = Integer.BYTES;
                state.remain_len = Integer.BYTES;
                break;
            case  Constant.EnumCmdMsg.MOBILE_MSG_LOGIN:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_LOGIN:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_TIMEZONE:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_TIMEZONE:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_CAMERA_LIST:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEND_CAMERA_LIST:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_SETTINGS: {
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_SETTINGS: {");
                state.state = Constant.EnumBufferState.COMMAND_HEADER;
                state.remain_len = Integer.BYTES;
                state.msg_len = Integer.BYTES;
                break;
            }
            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL:
            {
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL:");
                state.state = Constant.EnumBufferState.COMMAND_HEADER;
                state.remain_len = Integer.BYTES;
                state.msg_len = Integer.BYTES;
                break;
            }
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_ALARM_LIST:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEND_ALARM_LIST:");
            case Constant.EnumCmdMsg.MOBILE_MSG_NEXT_ALARM_LIST:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_NEXT_ALARM_LIST:");
            case Constant.EnumCmdMsg.MOBILE_MSG_PREVIOUS_ALARM_LIST:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_PREVIOUS_ALARM_LIST:");
                byte status = utils.readByte( in );
                if( status == -1)//socket failed
                {
                    ret = -1;
                    break;
                }
                if(status == Constant.EnumStatusMsg.MOBILE_MSG_SUCCESS)
                {
                    status = utils.readByte( in );
                    state.state = Constant.EnumBufferState.COMMAND_HEADER;
                    state.remain_len = Integer.BYTES;
                }
                else
                    state.ResetState();

                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_SETPOS:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_SETPOS:");
                state.ResetState();
                break;

            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_RECORDING_ONLY_CANT_PLAY_VIDEO:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SERVER_RECORDING_ONLY_CANT_PLAY_VIDEO:");
                state.ResetState();
                this.OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_SERVER_RECORDING_ONLY, null);
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_NEW_ALARM_DETECTED:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_NEW_ALARM_DETECTED:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SNAPSHOT:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SNAPSHOT:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_PLAY_FW:");

            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_STEP_BW:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_STEP_BW:");
            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_STOP:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_STOP:");

            case Constant.EnumCmdMsg.MOBILE_MSG_VIEW_ALARM_IMAGES:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_VIEW_ALARM_IMAGES:");
            case Constant.EnumCmdMsg.MOBILE_MSG_NEXT_ALARM_IMAGE:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_NEXT_ALARM_IMAGE:");

            case Constant.EnumCmdMsg.MOBILE_MSG_ADD_IP_CAMERAS:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_ADD_IP_CAMERAS:");
            case Constant.EnumCmdMsg.MOBILE_MSG_REMOVE_IP_CAMERAS:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_REMOVE_IP_CAMERAS:");

            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_STEP_FW:
                Log.v("GOND", "relay isLive = " + ServerInfo.getisLive() + " SelectCommand Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_STEP_FW:");
                state.ResetState();
                break;

            default:{
                //state.state = Constant.EnumBufferState.COMMAND_HEADER;
                //state.remain_len = Integer.BYTES;
                state.ResetState();
                break;
            }
        }
        return  ret;
    }
    int ProcessCommand(BufferedInputStream in, char cmdId, byte[] buffer, int len, int offset)
    {
        int ret = 0;
        switch ( cmdId)
        {
            case  Constant.EnumCmdMsg.MOBILE_MSG_LOGIN:
                try {
                    ByteArrayInputStream xmlIS = new ByteArrayInputStream(buffer);
                    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                    DocumentBuilder builder = factory.newDocumentBuilder();
                    Document document = builder.parse(new InputSource(new InputStreamReader(xmlIS, Constant.XML_SERVER_ENCODEDING)));
                    Element loginStatusElement = document.getDocumentElement();
                    String strLoginStatus = loginStatusElement.getAttribute("loginStatus");
                    if(!strLoginStatus.equals(""))
                    {
                        int loginStatus = Integer.parseInt(strLoginStatus);
                        if(loginStatus == Constant.EnumGeneric.MOBILE_LOGIN_MESSAGE_SUCCEEDED)
                        {
                            String strConnectionIndex = loginStatusElement.getAttribute("connectionIndex");
                            if(!strConnectionIndex.equals(""))
                            {

                                this.ServerInfo.ConnectionIndex = Integer.parseInt(strConnectionIndex);
                                //utils.WriteBlock(out, utils.IntToByteArrayOfC(this.ServerInfo.ConnectionIndex));
                                WriteSocketData(utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_SETTINGS, null), "MOBILE_MSG_SERVER_SEND_SETTINGS");
                                //WriteSocketData(utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SEND_CAMERA_LIST, null));
                                WriteSocketData(utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG, null), "MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG");
                               /*
                                if( ServerInfo.getisLive() == true ) {
                                    if (this.PlaybyChannel)
                                        this.WriteSocketData(utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG, null));
                                    else {
                                        byte[] msg_buffer = MsgCommandItem.MOBILE_MSG_MOBILE_SEND_SETTINGS(this.Channel);
                                        this.WriteSocketData(msg_buffer);
                                        //utils.WriteBlock(out, msg_buffer);
                                    }
                                }
                                else
                                {

                                    WriteSocketData(utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG, null));
                                    //utils.WriteBlock(out, utils.MsgBuffer( Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO, null ));
                                }
                                */
                            }
                            OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_LOGIN_SUCCCESS, null);
                        }
                        else {
                            switch (loginStatus)
                            {
                                case Constant.EnumGeneric.SVR_DONT_ACCPET_ERR:
                                    OnHandlerMessage(Constant.EnumVideoPlaybackSatus.SVR_REJECT_ACCEPT, null);
                                    break;
                                case Constant.EnumGeneric.MOBILE_LOGIN_MESSAGE_WRONG_USER_PASS:
                                    OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_LOGIN_FAILED, null);
                                    break;
                                case Constant.EnumGeneric.MOBILE_LOGIN_MESSAGE_WRONG_SERVERID:
                                        OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_LOGIN_MESSAGE_WRONG_SERVERID, null);
                                    break;

                                default:
                                    OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_LOGIN_FAILED, null);
                                    break;
                            }
                            running = false;
                        }
                    }
                    else
                        OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_LOGIN_FAILED, null);
                }
                catch (Exception ex)
                {
                    Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " Exception 1 ex = " + ex);
                    ret = 0;
                }
                break;
            case  Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_SETTINGS: {
                try {
                    String str_xml = new String(buffer, 0, len);
                    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                    DocumentBuilder builder = factory.newDocumentBuilder();
                    InputSource is = new InputSource(new StringReader(str_xml));
                    Document document = builder.parse( is);
                    Element root = document.getDocumentElement();

                    XPathFactory xpath = XPathFactory.newInstance();
                    XPath xPath = xpath.newXPath();
                    NodeList nodes = (NodeList) xPath.compile("/ServerSetings/UserManagementSetup").evaluate(document, XPathConstants.NODESET);
                    if(nodes != null && nodes.getLength() > 0)
                    {
                        Node node = nodes.item(0);
                        NamedNodeMap n_map = node.getAttributes();
                        Node ch_mask = n_map.getNamedItem("channel_enable_mask");
                        String str_mask = ch_mask.getNodeValue();
                        ServerInfo.UpdateLivePrivilege(str_mask);
                        ch_mask = n_map.getNamedItem("search_channel_enable_mask");
                        str_mask = ch_mask.getNodeValue();
                        ServerInfo.UpdateSearchPrivilege(str_mask);
                    }
                }
                catch (Exception ex){
                    Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " isLive = " + ServerInfo.getisLive() + "Exception 2 ex = " + ex);
                }

                break;
            }
            case  Constant.EnumCmdMsg.MOBILE_MSG_SEND_CAMERA_LIST:
            {
                String str_xml = new String( buffer,0, len );

                break;
            }
            case  Constant.EnumCmdMsg.MOBILE_MSG_MOBILE_SEND_SETTINGS:
                if (ServerInfo.getisLive() == true)
                WriteSocketData(utils.MsgBuffer( Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO, null ), "MOBILE_MSG_START_SEND_VIDEO");
                break;
            case  Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO:
                ServerInfo.serverVideoPort = utils.ByteArrayOfCToIntJava( buffer,0);
                break;
            case  Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG: {
                String s = new String(buffer, offset, len);
                this.ServerInfo.setVideoInput(this.ParserChannel(s));
                if (ServerInfo.getisLive() == false)
                {
                    WriteSocketData(utils.MsgBuffer( Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO, null ), "MOBILE_MSG_START_SEND_VIDEO"); //duck marked
                }
                if (ServerInfo.getisLive() == true) {
                    WriteSocketData( utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_TIMEZONE, null), "MOBILE_MSG_SERVER_SEND_TIMEZONE");

                } else {
                    WriteSocketData( utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_TIMEZONE, null), "MOBILE_MSG_SERVER_SEND_TIMEZONE");
                }
                //
            }
                break;

            case Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_TIMEZONE: {
                String s = new String(buffer, offset, len);
                Element rootTimeZone = utils.ParserXML(s);
                ServerTimeZone timezone = new ServerTimeZone();
                timezone.setBias(Integer.parseInt(rootTimeZone.getAttribute("Bias")));
                timezone.setDaylightBias(Integer.parseInt(rootTimeZone.getAttribute("DaylightBias")));
                timezone.setStandardName(rootTimeZone.getAttribute("StandardName"));
                timezone.setDaylightName(rootTimeZone.getAttribute("DaylightName"));
                Element daylightDay = (Element) rootTimeZone.getChildNodes().item(0);
                timezone.setDlYear(Integer.parseInt(daylightDay.getAttribute("wYear")));
                timezone.setDlMonth(Integer.parseInt(daylightDay.getAttribute("wMonth")));
                timezone.setDlDay(Integer.parseInt(daylightDay.getAttribute("wDay")));
                timezone.setDlDayofWeek(Integer.parseInt(daylightDay.getAttribute("wDayOfWeek")));
                timezone.setDlDayofWeek(Integer.parseInt(daylightDay.getAttribute("wHour")));
                timezone.setDlMinute(Integer.parseInt(daylightDay.getAttribute("wMinute")));
                timezone.setDlSecond(Integer.parseInt(daylightDay.getAttribute("wSecond")));
                timezone.setDlMiliSecond(Integer.parseInt(daylightDay.getAttribute("wMilliseconds")));
                //Global.serverTimeZone = timezone; //add server time zone
                ServerInfo.setTimeZone(timezone);

                // Check daylight saving time
                daylight = new DST();
//                SearchTimeData data = new SearchTimeData();
//                daylight.setBeginOfDST(Utilities.dayBeginOfDST(
//                        ServerInfo.getSearchTime().getYear(),
//                        ServerInfo.getSearchTime().getMonth(),
//                        ServerInfo.getSearchTime().getDay(), timezone.getTimeZone(),data));
//                daylight.setEndOfDST(Utilities.dayEndOfDST(
//                        ServerInfo.getSearchTime().getYear(),
//                        ServerInfo.getSearchTime().getMonth(),
//                        ServerInfo.getSearchTime().getDay(), timezone.getTimeZone(),data));
//                if(daylight.isBeginOfDST())
//                {
//                    daylight.setTimeStartDST(data.getHour() +1/*1h 59*/);// previousTransition
//                }
//                else if(daylight.isEndOfDST())
//                {
//                    daylight.setTimeStartDST(data.getHour());// previousTransition
//                }
//                String [] dateSearchRes1 = new String[2];
//                dateSearchRes1[0] = "1";
//                dateSearchRes1[1] = "10";
                //Log.d(daylight, "data");[[
                //String content = TextUtils.join(",", daylight);
//                String strObj = daylight.toString();
                //Log.i(strObj);
//                result[0] = "hoursofDay: " + "23";
//                result[1] = "hourSpecial: " + "2";
//                String content = TextUtils.join(",", result);

                if(ServerInfo.getisLive() == false)
                {
                    int hoursofDay = 24;
                    int hourSpecial = 2;
                    SearchTimeData data = new SearchTimeData();
                    boolean isBeginOfDST = Utilities.dayBeginOfDST(
                            ServerInfo.getSearchTime().getYear(),
                            ServerInfo.getSearchTime().getMonth(),
                            ServerInfo.getSearchTime().getDay(), timezone.getTimeZone(),data);
                    boolean isEndOfDST = Utilities.dayEndOfDST(
                            ServerInfo.getSearchTime().getYear(),
                            ServerInfo.getSearchTime().getMonth(),
                            ServerInfo.getSearchTime().getDay(), timezone.getTimeZone(),data);
                    String[] arr_Hours = {"00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"};
                    if(isBeginOfDST == true)
                    {
                        hourSpecial = data.getHour() +1; /*1h 59*/// previousTransition
                        hoursofDay = 23;
                        daylight.setBeginOfDST(true);
                        SearchTimeData _oldSearchTime = ServerInfo.getSearchTime();
                        _oldSearchTime.setTimeInterval(82799);
                        ServerInfo.setSearchTime(_oldSearchTime);

                        int minValue = 1;
                        String color = "#FFFFFF";
                        int hourSpecialFirst = data.getHour() +1;
                        String HourArr[] = new String[23];
                        String astr_hour = "{\"key\":\"%s\", \"visible\":%b,\"color\":\"%s\",\"value\":%d,\"minData\":[%s]}";
                        int displayH = 0;
                        for(int i = 0 ;i <23;i++)
                        {

                            String TimeArr[]= new String[60];
                            String astr_min = "{\"id\":%d, \"begin\":%d,\"end\":%d}";
                            for(int j = 0; j < 60;j++)
                            {
                                long long_start1 =  ServerInfo.getSearchTime().getLongStamp(timezone.getTimeZone())+(i*3600)+ (j*minValue*60);
                                long long_end1 = long_start1 + (minValue*60) - 1;

                                long long_start = SearchTimeData.getSecond(long_start1,timezone.getTimeZone());
                                long long_end = SearchTimeData.getSecond(long_end1,timezone.getTimeZone());

                                String res_min = String.format(astr_min,-1,long_start1,long_end1);
                                TimeArr[j] = res_min;

                            }

                            String content_minData = TextUtils.join(",", TimeArr);

                            if(displayH == hourSpecialFirst)
                            {
                                color = "#27AEE3";
                                displayH++;
                                hourSpecialFirst = 999;
                            }

                            //String res = String.format(astr_hour,arr_Hours[displayH],1, i, 1);
                            String a = arr_Hours[displayH].toLowerCase();
                            String res = String.format(astr_hour,arr_Hours[displayH].toLowerCase() ,1, color,i, content_minData.toLowerCase());
                            displayH++;
                            HourArr[i] = res;
                        }
                        String content_minData = TextUtils.join(",", HourArr);
                        OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_RESPONSE_RULES_DST, "[" + content_minData + "]");

                    }
                    else if(isEndOfDST == true)
                    {
                        daylight.setEndOfDST(true);

                        //daylight.setTimeStartDST(data.getHour());// previousTransition
                        hourSpecial = data.getHour();
                        hoursofDay = 25;
                        SearchTimeData _oldSearchTime = ServerInfo.getSearchTime();
                        _oldSearchTime.setTimeInterval(89999);
                        ServerInfo.setSearchTime(_oldSearchTime);

                        int minValue = 1;
                        String color = "#FFFFFF";
                        int hourSpecialFirst = data.getHour();
                        String HourArr[] = new String[25];
                        String astr_hour = "{\"key\":\"%s\", \"visible\":%b,\"color\":\"%s\",\"value\":%d,\"minData\":[%s]}";
                        int displayH = 0;
                        for(int i = 0 ;i <25;i++)
                        {

                            String TimeArr[]= new String[60];
                            String astr_min = "{\"id\":%d, \"begin\":%d,\"end\":%d}";
                            for(int j = 0; j < 60;j++)
                            {
                                long long_start1 =  ServerInfo.getSearchTime().getLongStamp(timezone.getTimeZone())+(i*3600)+ (j*minValue*60);
                                long long_end1 = long_start1 + (minValue*60) - 1;

                                long long_start = SearchTimeData.getSecond(long_start1,timezone.getTimeZone());
                                long long_end = SearchTimeData.getSecond(long_end1,timezone.getTimeZone());

                                String res_min = String.format(astr_min,-1,long_start1,long_end1);
                                TimeArr[j] = res_min;

                            }

                            String content_minData = TextUtils.join(",", TimeArr);

                            if(displayH == (hourSpecialFirst + 1))
                            {
                                color = "#27AEE3";
                                displayH--;
                                hourSpecialFirst = 999;
                            }

                            //String res = String.format(astr_hour,arr_Hours[displayH],1, i, 1);
                            String a = arr_Hours[displayH].toLowerCase();
                            String res = String.format(astr_hour,arr_Hours[displayH].toLowerCase() ,1, color,i, content_minData.toLowerCase());
                            displayH++;
                            HourArr[i] = res;
                        }

                        String content_minData = TextUtils.join(",", HourArr);
                        OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_RESPONSE_RULES_DST, "[" + content_minData + "]");
                    }


                    String result[]= new String[2];
                    String astr_app = "{\"hoursofDay\":%d, \"hourSpecial\":%d}";
                    String res = String.format(astr_app, hoursofDay, hourSpecial);



                    OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_RESPONSE_DAYLIGHT, "[" + res + "]");
                }




                //get channel No for request day list

//                if( this.PlaybyChannel == false)
//                {
//                    channels = GetChannelforIndex(this.getChannel());
//                }
                int[] channels = this.ChannelNo(this.ServerInfo.getisLive() ); //this.Channel;
                if(channels == null || channels.length == 0)
                {
                    OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_PERMISSION_CHANNEL_DISABLE, 1);
                    break;
                }

                if(ServerInfo.getisLive() == false)
                {
//                    int[] v_index = this.VideoSourceIndex();
//                    byte[] msg_buffer = MsgCommandItem.MOBILE_MSG_MOBILE_SEND_SETTINGS(v_index,this.HDMode);
//                    byte[] msg_stop = MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, v_index);
//                    byte[]buff_daylist = MsgCommandItem.MSG_SEARCH_REQUEST_DAY_LIST(ServerInfo.ConnectionIndex, this.ServerInfo.getTimeZone().getTimeZone(), channels, this.HDMode);
//                    byte[] data = new byte[msg_buffer.length+msg_stop.length+buff_daylist.length];
//
//                    System.arraycopy(msg_buffer,0,data,0,msg_buffer.length);
//
//                    System.arraycopy(msg_stop,0,data,msg_buffer.length,msg_stop.length);
//
//                    System.arraycopy(buff_daylist,0,data,msg_buffer.length + msg_stop.length,buff_daylist.length);
//
//                  WriteSocketData(data);
                    int[] v_index = this.VideoSourceIndex();
                    byte[] msg_buffer = MsgCommandItem.MOBILE_MSG_MOBILE_SEND_SETTINGS(v_index,this.HDMode);
                    byte[] msg_stop = utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_PAUSE_SEND_VIDEO, null);
                    byte[] send_data = new byte[msg_buffer.length+msg_stop.length];
                    System.arraycopy(msg_buffer,0,send_data,0,msg_buffer.length);
                    System.arraycopy(msg_stop,0,send_data,msg_buffer.length,msg_stop.length);
                    WriteSocketData(send_data, "MOBILE_MSG_PAUSE_SEND_VIDEO OTHERS");
                    //WriteSocketData(utils.MsgBuffer( Constant.EnumCmdMsg.MOBILE_MSG_START_SEND_VIDEO, null )); //duck marked
                    WriteSocketData(MsgCommandItem.MSG_SEARCH_REQUEST_DAY_LIST(ServerInfo.ConnectionIndex, timezone.getTimeZone(), channels, this.HDMode), "MSG_SEARCH_REQUEST_DAY_LIST");
                }
                else
                {
                    int[] v_index = this.VideoSourceIndex();
                    byte[] msg_buffer = MsgCommandItem.MOBILE_MSG_MOBILE_SEND_SETTINGS(v_index,this.HDMode);
                    WriteSocketData( msg_buffer, "ProcessCommand MOBILE_MSG_MOBILE_SEND_SETTINGS");
                }
            }
                break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_DAY_LIST:{
                byte[] msg_buff = new byte[len];
                System.arraycopy(buffer,offset, msg_buff,0, len);
                long []daylist = FFMPEGDecoder.getSearchDaylist( msg_buff);
                if( daylist != null && ServerInfo.getTimeZone() != null) {
                    TimeZone currentServerTimeZone = ServerInfo.getTimeZone().getTimeZone();
                    int numberOfSize = daylist.length;
                    long beginTime = numberOfSize > 0 ? daylist[0] : 0;
                    SearchDayList searchDayList = new SearchDayList(daylist.length,beginTime);
                    //SearchDay[] searchDays = new SearchDay[numberOfSize];
                    boolean found = false;
                    SearchTimeData search_time = ServerInfo.getSearchTime();
                    String [] dateSearchRes = new String[numberOfSize];
                    for(int i = 0 ;i <numberOfSize;i++)
                    {
                        SearchDay searchDay = new SearchDay(daylist[i],currentServerTimeZone);
                        //searchDayList.addNewDay(searchDay);
                        //searchDays[i] =  searchDay;
                        dateSearchRes[i] =  searchDay.toString(1);//String.valueOf(searchDay.getMonth()) + String.valueOf(searchDay.getDay())+ String.valueOf(searchDay.getYear());

                        if(!found)
                        found = searchDay.equal(search_time.getDay(),search_time.getMonth(), search_time.getYear());
                        //if( found)
                        // break;
                    }
                    OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_RESPONSE_DAYLIST,dateSearchRes);
                    if( found)
                    {
                        int[] channels = this.ChannelNo( ServerInfo.getisLive());
//                        if( this.PlaybyChannel == false)
//                            channels = GetChannelforIndex(this.getChannel());

                        //utils.WriteBlock(out, utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_PAUSE_SEND_VIDEO, null));

                        msg_buff = MsgCommandItem.MSG_SEARCH_REQUEST_TIME_INTERVAL(this.ServerInfo, channels);
                        //String str = new String( msg_buff, 6, msg_buff.length - 6);
                        //System.out.println( str);
                        WriteSocketData(  msg_buff, "MSG_SEARCH_REQUEST_TIME_INTERVAL");

                    }
                    else
                        OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_NO_DATA, null );
                }
                else
                {
                    OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_SEARCH_NO_DATA, null );
                }
            }
            break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL:
            {
                if (ServerInfo.getTimeZone() == null)
                {
                    Log.d("GOND", "**DIRECT** Search time interval: no timezone");
                    break;
                }
                TimeZone currentServerTimeZone = ServerInfo.getTimeZone().getTimeZone();
                byte[] msg_buff = new byte[len];
                System.arraycopy(buffer,offset, msg_buff,0, len);
                Log.d("0720", "relay isLive = " + ServerInfo.getisLive() + " ProcessCommand case MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL 2");
                SearchAllDayInterval searchAllDayInterval = new SearchAllDayInterval();
                FFMPEGDecoder.getSearchInformation(msg_buff, searchAllDayInterval);
               // OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_RESPONSE_TIMEINTERVAL,searchAllDayInterval);
                int[] v_channel = this.ChannelNo(this.ServerInfo.getisLive() ); //this.Channel;
                Log.d("0720", "relay isLive = " + ServerInfo.getisLive() + " ProcessCommand case MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL 3");
                SearchDayInterval di = searchAllDayInterval.getSearchDayOfChannel(v_channel[0]);
                ArrayList<SearchTimeInterval> arr = di == null? new ArrayList<SearchTimeInterval>(): di.gets();
                String s = arr.toString();
                String TimeArr[]= new String[arr.size()];
                Log.d("0720", "relay isLive = " + ServerInfo.getisLive() + " ProcessCommand MOBILE_MSG_SEARCH_RESPONSE_TIME_INTERVAL arr.size() = " + arr.size());
                String astr_app = "{\"id\":%d, \"begin\":%d,\"end\":%d,\"time\":%d,\"type\":%d,\"timezone\":%d}";
                for(int i = 0;i<arr.size();i++)
                {

                    SearchTimeInterval value = arr.get(i);



                    // long l1 = SearchTimeData.getSecond(value.getBegin(),currentServerTimeZone);
                    // long l2 = SearchTimeData.getSecond(value.getEnd(),currentServerTimeZone);

                    // if(daylight.isBeginOfDST() || daylight.isEndOfDST())
                    // {
                    //     l1 = value.getBegin();
                    //     l2 = value.getEnd();
                    // }

                    long l1 = value.getBegin();
                    long l2 = value.getEnd();

                    String s1 = SearchTimeData.getTimeDisplayFull(value.getBegin(),currentServerTimeZone).replaceAll("/","-");
                    //String s2 = SearchTimeData.getTimeDisplayFull(value.getEnd(),currentServerTimeZone).replaceAll("/","-");
                    String res = String.format(astr_app,value.getId(),l1,l2,value.getTime(),value.getType(),currentServerTimeZone.getRawOffset());
                    TimeArr[i] = res;
                }
                String content = TextUtils.join(",", TimeArr);
                OnHandlerMessage(Constant.EnumVideoPlaybackSatus.MOBILE_RESPONSE_TIMEINTERVAL,"[" + content + "]");
//                if( this.PlaybyChannel == false)
//                    v_index = GetChannelforIndex(this.getChannel());//this.GetVideoSourceIndex(this.Channel);

//                byte[] msg_buffer = MsgCommandItem.MOBILE_MSG_MOBILE_SEND_SETTINGS(v_index);
//                utils.WriteBlock(out, msg_buffer);

               WriteSocketData( utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_PAUSE_SEND_VIDEO, null), "MOBILE_MSG_PAUSE_SEND_VIDEO");
                //byte[]   msg_buffer = MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, v_index);

                byte[]  msg_buffer = MsgCommandItem.MSG_SEARCH_REQUEST_SETPOS(this.ServerInfo, v_channel, 0, this.HDMode);
                WriteSocketData(  msg_buffer, "MSG_SEARCH_REQUEST_SETPOS");

                msg_buffer = MsgCommandItem.MSG_SEARCH_REQUEST_PLAY_FW(this.ServerInfo, v_channel,0, this.HDMode);
                WriteSocketData( msg_buffer, "MSG_SEARCH_REQUEST_PLAY_FW");



                break;
            }
        }
        return  ret;
    }
    protected void  OnHandlerMessage(int msgid, Object data)
    {
        if( msgid < 0 || handler == null || PlaybackStatus != Constant.EnumPlaybackSatus.VIDEO_PLAY)
            return;
        Message completeMessage = handler.obtainMessage(msgid, data);
        completeMessage.sendToTarget();
    }
    protected int [] ChannelNoWithoutPermission() {
        int[] channelNo = this.getChannel();
        if(this.getPlaybyChannel() == false)
            channelNo = ChannelFromIndex( this.getChannel());
        return  channelNo;
    }
    protected int [] ChannelNo(boolean islive){
        int[] channelNo = this.getChannel();
        // Log.d("GOND", "ChangePlay GetChannel: " + channelNo.toString());
        if(this.getPlaybyChannel() == false)
            channelNo = ChannelFromIndex( this.getChannel());

        if(channelNo == null)
            return new int[0];
         if( channelNo.length == 0)
             return  channelNo;
        ArrayList<Integer> ret = new ArrayList<Integer>();
        if( islive == false) {
          for(int i = 0; i< channelNo.length; i++)
          {
              if( ServerInfo.GetSearchPrivilege( channelNo[i]) == false)
                  continue;
              ret.add( Integer.valueOf(channelNo[i]));
          }
        }
        else{
            for(int i = 0; i< channelNo.length; i++)
            {
                if( ServerInfo.GetLivePrivilege( channelNo[i]) == false)
                    continue;
                ret.add( Integer.valueOf(channelNo[i]));
            }
        }

        // Log.d("GOND", "ChangePlay GetChannel result: " + ret);
        int[] values = new int[ret.size()];
        int index = 0;
        for ( Integer it :ret) {
            values[index++] = it.intValue();
        }
        return  values;
        //return  channelNo;
    }

    protected int[]VideoSourceIndex()
    {
        if( this.PlaybyChannel == false)
            return this.getChannel();
        return  this.GetVideoSourceIndex( this.getChannel());
    }
    int[] ChannelFromIndex(int[]index)
    {
        HashMap<Integer, Integer> hmap = ServerInfo.getVideoInput();
        int[] ret = new int[ index.length];
        Arrays.fill(ret, -1);
        Integer m;
        for (int i = 0; i< index.length; i++)
        {
            for(Map.Entry<Integer, Integer> it : hmap.entrySet()){
                if( it.getValue().intValue() != index[i])
                    continue;
                ret[i] = it.getKey().intValue();
                break;
            }
        }
        return ret;
    }
    int[] GetVideoSourceIndex( int[] channel)
    {
        HashMap<Integer, Integer> hmap = ServerInfo.getVideoInput();
        //int[] ret = new int[ channel.length];
        //Arrays.fill(ret, -1);
        ArrayList<Integer> ret = new ArrayList<Integer>();
        Integer m;
        for (int i = 0; i< channel.length; i++)
        {
            m = hmap.get( channel[i] );
            if( m == null || m.intValue() < 0)
                continue;;
            ret.add(m);
        }

        int[] values = new int[ret.size()];
        int index = 0;
        for ( Integer it :ret) {
            values[index++] = it.intValue();
        }
        return  values;
    }

    HashMap<Integer, Integer> ParserChannel( String xml)
    {
        HashMap<Integer, Integer> hmap = new HashMap<Integer, Integer>();
        try{
            //ByteArrayInputStream xmlIS = new ByteArrayInputStream(buffer);
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            InputSource is = new InputSource(new StringReader(xml));
            Document document = builder.parse( is);
            Element root = document.getDocumentElement();


            XPathFactory   xpath = XPathFactory.newInstance();
            XPath xPath = xpath.newXPath();
           // XPathExpression xPathExpression=  xPath.compile("/CHANNEL_CONFIG");
            NodeList nodes = (NodeList) xPath.compile("/HARDWARE_CONFIG/CHANNEL_CONFIG").evaluate( document, XPathConstants.NODESET);
            if( nodes.getLength() > 0)
            {
                Node node = nodes.item(0);
                NamedNodeMap n_map = node.getAttributes();
                Node ch_mask = n_map.getNamedItem("channel_enable_mask");
                String str_mask = ch_mask.getNodeValue();
                String[] parts = str_mask.split("_");
                int str_value = 0;

                for (int i = 0; i < parts.length; i++)
                {
                    String att_name =  "video_input_" + Integer.toString(i);
                    ch_mask = n_map.getNamedItem(att_name);
                    if( ch_mask == null)
                        continue;
                    str_mask = ch_mask.getNodeValue();
                    hmap.put( i, Integer.valueOf( str_mask));

                }

            }
//            NodeList el_channel = root.getElementsByTagName("CHANNEL_CONFIG");
//            if( el_channel.getLength() == 0)
//                return  null;
//            Node node =  el_channel.item(0);
//            node.
//            String ch_mask = root.getAttribute("channel_enable_mask");
        }
        catch (Exception e)
        {
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " Exception 3 e = " + e);
        }
        return hmap;
    }

    int SendLogin(ServerSite server )
    {
        try {
            byte[] loginBuff = ConstructLoginInfoForSend
                    (
                            utils.ReplaceSpecialCharForXML(server.userName),
                            utils.ReplaceSpecialCharForXML(server.pass),
                            utils.ReplaceSpecialCharForXML(server.serverID),
                            server.serverVersion
                    );
            //out.write(loginBuff);
            //out.flush();
            WriteSocketData(loginBuff, "SendLogin");
            return 1;
        }
        catch (Exception ex)
        {
            String msg = ex.getMessage();
            Log.d("sendlogin:", msg);

            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " Exception 3 ex = " + ex);
            return  -1;
        }
    }

    byte[] ConstructLoginInfoForSend(String _userName, String _pass, String _svrID, int _serverVersion) throws Exception
    {
        String loginXMLstr = "<LoginInfo user_name=\"" + _userName + "\" password=\"" + _pass
                + "\" server_id=\"" + _svrID + "\" remote_type=\"2\"></LoginInfo>";
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

            byte[] realXmlLength = utils.IntToByteArray(xmlLength);
            for(int i = 0; i < 4; i++)
                bLoginXmlSend[newLength - 4 + i] = realXmlLength[i];

            // encrypt
            byte[] encryptedXML = utils.AES_Encrypt(Constant.aesKey ,bLoginXmlSend);
            bLoginXmlSend = encryptedXML;


//			byte[] nm = new byte[1600];
//			for(int i = 0 ; i < 1000; i++)
//				nm[i] = (byte)i;
//
//			byte[] en = AES_Encrypt(Constant.aesKey ,nm);
//
//			byte[] de = AES_Decrypt(Constant.aesKey ,en);
//
//			en = null;

        }

        int loginXmlLength = bLoginXmlSend.length;

        int totalLength = 4/*integer*/ + 2 /*char*/ + 4 /*mobile version*/+ loginXmlLength;
        int realDataSize = totalLength - 4;

        byte[] bSize = utils.IntToByteArrayOfC(realDataSize);
        byte[] bComMsg = utils.CharToByteArrayOfC(Constant.EnumCmdMsg.MOBILE_MSG_LOGIN);
        byte[] bMobileVersion = utils.IntToByteArrayOfC(Constant.EnumMobileVersion.MOBILE_VERSION_CURRENT);

        byte[] loginBuff = new byte[totalLength];
        for(int i = 0 ; i < 4 ; i++)
            loginBuff[i] = bSize[i];

        loginBuff[4] = bComMsg[0];
        loginBuff[5] = bComMsg[1];

        for(int i = 0 ; i < 4 ; i++)
            loginBuff[i+6] = bMobileVersion[i];

        for(int i = 0 ; i < loginXmlLength; i++)
            loginBuff[i+10] = bLoginXmlSend[i];

        return loginBuff;
    }

    private int ReadServerVersion( BufferedInputStream input)
    {
        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " ReadServerVersion isRelay = " + isRelay);
        byte[] header = new byte[ Integer.BYTES];
       int len =  ReadBlock( input, Integer.BYTES, header,0 , isRelay, "ReadServerVersion");
       if( len != Integer.BYTES)
           return -1;
        int msg_len = utils.ByteArrayOfCToIntJava( header,0);
        byte[] buffer = new byte[msg_len];
        len = ReadBlock(input, msg_len, buffer, 0, "ReadServerVersion");
        if( len != msg_len)
            return -1;

        try {
            ByteArrayInputStream xmlIS = new ByteArrayInputStream(buffer);
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(new InputSource(new InputStreamReader(xmlIS, Constant.XML_SERVER_ENCODEDING)));
            Element rootElement = document.getDocumentElement();
            String strSvrVersion = rootElement.getAttribute("server_version");
            if( strSvrVersion == null || strSvrVersion.equals(""))
                return  -1;

            int result = Integer.parseInt(strSvrVersion);

            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " strSvrVersion = " + result);
            return  result;
        }
        catch ( Exception e) {
            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " ReadServerVersion Exception e = " + e);
            return -1;
        }
    }

     synchronized protected int WriteSocketData(byte[] buff, String debug){

         Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " WriteSocketData debug = " + debug);

         return  utils.WriteBlock( this.OutPut, utils.notifyAddRelayHeader(buff, isRelay, this.clientIp));
    }

    public void PauseVideo()
    {
        PlaybackStatus = Constant.EnumPlaybackSatus.VIDEO_PAUSE;
        if( ServerInfo == null || running == false)
            return;
        boolean islive = ServerInfo.getisLive();
        if( islive == false) {
            int[] ChannelNo = this.ChannelNo(false);
            if (ChannelNo == null || ChannelNo.length == 0)
                return;
            byte[] msg_stop = MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, ChannelNo);
            new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute(msg_stop);
        }
        else{
            byte[] msg_stop = utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_PAUSE_SEND_VIDEO, null);
            new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( msg_stop);
        }

    }
    public  void ChangetoHD(boolean HDMode)
    {
        boolean islive = ServerInfo.getisLive();
        int [] ChannelNo = this.ChannelNo(islive);
        this.HDMode = HDMode;
        if(islive)
        {
            // Log.d("GOND", "**DIRECT** ChangetoHD srcIdx: " + Arrays.toString(this.VideoSourceIndex()) + ", channel: " + Arrays.toString(ChannelNo));
            byte[] msg_buffer = MsgCommandItem.MOBILE_MSG_MOBILE_SEND_SETTINGS(this.VideoSourceIndex(),HDMode);
            byte[] msg = new byte[msg_buffer.length];
            System.arraycopy( msg_buffer, 0, msg, 0, msg_buffer.length );
            new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( msg);
        }
        else
        {
            if (this.ServerInfo.getTimeZone() == null) 
            {
                Log.d("GOND", "**DIRECT** ChangetoHD no timezone");
                return;
            }
            ServerInfo.setLive( islive);
            byte[]buff_daylist = MsgCommandItem.MSG_SEARCH_REQUEST_DAY_LIST(ServerInfo.ConnectionIndex, this.ServerInfo.getTimeZone().getTimeZone(), ChannelNo, this.HDMode);
            byte[]buff = new byte[buff_daylist.length];
            System.arraycopy(buff_daylist,0, buff,0, buff_daylist.length );
            new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( buff);
        }

    }
    public  void ChangePlay( boolean islive, boolean reload, String channel)
    {
        // Log.d("GOND", "**DIRECT** ChangePlay: " + channel + ", old: " + str_Channel);
        boolean isReset = reload;
        if( str_Channel != channel)
        {
            // Log.d("GOND", "**DIRECT** ChangePlay channel changed");
            str_Channel = channel;
            if (this.video_handler != null)
                this.video_handler.changeChannel(channel);
            String[] chs = channel.split(",");
            Channel = new int[chs.length];
            for(int i = 0; i < chs.length; i++)
            {
                Channel[i] = Integer.parseInt(chs[i]);
            }
            // if (islive == false)
            // {
            //     isReset = true;
            // }
            this.ChangePlayInternal(islive,  isReset, false, true);
        }
        else 
        {
            this.ChangePlayInternal(islive,  isReset, false, false);
        }
    }

    private  void ChangePlayInternal( boolean islive, boolean reload, Boolean mainstream, Boolean forceChange)
    {
        // this.HDMode = mainstream;

        Log.d("GOND", "**DIRECT** ChangePlayInternal: " + forceChange + ", HD: " + this.HDMode + ", reload: " + reload);
        // dongpt: remove these line, why do not allow switch channel when playing live?
        if(forceChange == false && ServerInfo.getisLive() == islive && PlaybackStatus == Constant.EnumPlaybackSatus.VIDEO_PLAY)
        {
            Log.d("GOND", "**DIRECT** ChangePlay: not start play");
            return;
        }

        PlaybackStatus = Constant.EnumPlaybackSatus.VIDEO_PLAY;
        //int[] v_index = this.Channel;
        //if( this.PlaybyChannel == false)
        // v_index = GetChannelforIndex(this.getChannel());//this.GetVideoSourceIndex(this.Channel);
        int [] ChannelNo = this.ChannelNo(islive);
        // Log.d("GOND", "**DIRECT** ChangePlay with channels: " + Arrays.toString(ChannelNo));
        if( ChannelNo == null || ChannelNo.length == 0)
        {
            // Log.d("GOND", "**DIRECT** ChangePlay: case 1");
            OnHandlerMessage( Constant.EnumVideoPlaybackSatus.MOBILE_PERMISSION_CHANNEL_DISABLE, islive? 0 : 1);
            if( islive == false){
                byte[] msg_stop = utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_PAUSE_SEND_VIDEO, null);
                new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( msg_stop);

            }
            else
            {
                if(this.ServerInfo != null && this.ServerInfo.getSearchTime() != null && this.ServerInfo.getisLive() == false) {
                    byte[] msg_stop = MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, ChannelNoWithoutPermission());
                    new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute(msg_stop);
                }
            }
            ServerInfo.setLive( islive);
            return;
        }
        if(islive == true)//change search to live
        {
            // Log.d("GOND", "**DIRECT** ChangePlay: case 2");
            // Log.d("GOND", "ChangePlay channel 111");
            boolean need_stop_search = this.ServerInfo.getSearchTime() == null? false : true;
            if(ServerInfo.getisLive() == false )
                need_stop_search = true;

            ServerInfo.setLive( islive);
            if( this.ServerInfo.getTimeZone()  != null) {
                byte[] msg_stop = need_stop_search == false? new byte[0] : MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, ChannelNo);
                int[] vindex = this.VideoSourceIndex();
                byte[] msg_buffer = MsgCommandItem.MOBILE_MSG_MOBILE_SEND_SETTINGS( vindex, this.HDMode);
                byte[] msg = new byte[msg_buffer.length + msg_stop.length];
                System.arraycopy( msg_stop, 0, msg, 0, msg_stop.length );
                System.arraycopy( msg_buffer, 0, msg, msg_stop.length, msg_buffer.length );
                new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( msg);
            }
            else{
                byte[] msg_stop = need_stop_search == false? new byte[0] : MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, ChannelNo);
                byte[] msg_hw = utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_SERVER_SEND_HARDWARE_CONFIG, null);
                byte[] msg = new byte[msg_hw.length + msg_stop.length];
                System.arraycopy( msg_stop, 0, msg, 0, msg_stop.length );
                System.arraycopy( msg_hw, 0, msg, msg_stop.length, msg_hw.length );
                new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( msg);
            }

        }
        else// switch from Live => search
        {
            // Log.d("GOND", "ChangePlay channel 222");
            // Log.d("GOND", "**DIRECT** ChangePlay: case 3");
            boolean _islive = ServerInfo.getisLive();
            ServerInfo.setLive( islive);

            if( reload == true ){
                // Log.d("GOND", "**DIRECT** ChangePlay: case 3 reload");
                //int[] channel_no = this.ChannelNo();
                byte[]buff = null;
                byte[] msg_stop = null;
                if( _islive == true){
                    // Log.d("GOND", "**DIRECT** ChangePlay: case 3 reload live");
                    if (this.ServerInfo.getTimeZone() == null)
                    {
                        Log.d("GOND", "**DIRECT** ChangePlay 2: no timezone");
                        return;
                    }
                    msg_stop = utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_PAUSE_SEND_VIDEO, null);
                    byte[]buff_daylist = MsgCommandItem.MSG_SEARCH_REQUEST_DAY_LIST(ServerInfo.ConnectionIndex, this.ServerInfo.getTimeZone().getTimeZone(), ChannelNo, this.HDMode);
                    buff = new byte[buff_daylist.length + msg_stop.length ];
                    System.arraycopy(msg_stop,0, buff,0, msg_stop.length );

                    System.arraycopy(buff_daylist,0, buff, msg_stop.length , buff_daylist.length );
                }
                else {
                    // Log.d("GOND", "**DIRECT** ChangePlay: case 3 reload search");
                    int[] v_index = this.ChannelNo(false);
                    msg_stop = MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, v_index);
                    byte[] msg_timeinterval = MsgCommandItem.MSG_SEARCH_REQUEST_TIME_INTERVAL(this.ServerInfo, ChannelNo);
                    buff = new byte[msg_timeinterval.length + msg_stop.length ];
                    System.arraycopy(msg_stop,0, buff,0, msg_stop.length );
                    System.arraycopy(msg_timeinterval,0, buff, msg_stop.length , msg_timeinterval.length );
                }
                //byte[] msg_timeinterval = MsgCommandItem.MSG_SEARCH_REQUEST_TIME_INTERVAL(this.ServerInfo, ChannelNo);
                //byte[] msg_set_pos = MsgCommandItem.MSG_SEARCH_REQUEST_SETPOS(this.ServerInfo, ChannelNo, 0, this.HDMode);
                //byte[] msg_fw = MsgCommandItem.MSG_SEARCH_REQUEST_PLAY_FW(this.ServerInfo, ChannelNo,0, this.HDMode);

//                byte[]buff = new byte[msg_timeinterval.length + msg_stop.length ];
//
//                System.arraycopy(msg_stop,0, buff,0, msg_stop.length );
//
//                System.arraycopy(msg_timeinterval,0, buff, msg_stop.length , msg_timeinterval.length );

                //System.arraycopy(msg_fw,0, buff,msg_set_pos.length + msg_stop.length, msg_fw.length );


                new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( buff);
            }
            else{
                // Log.d("GOND", "**DIRECT** ChangePlay: case 3 not reload !!!");
                //int[] channels = this.ChannelNo();  //this.getChannel();
                if (this.ServerInfo.getTimeZone() == null)
                {
                    Log.d("GOND", "**DIRECT** ChangePlay 3 no timezone");
                    return;
                }
                byte[] msg_stop = utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_PAUSE_SEND_VIDEO, null);
                byte[]buff_daylist = MsgCommandItem.MSG_SEARCH_REQUEST_DAY_LIST(ServerInfo.ConnectionIndex, this.ServerInfo.getTimeZone().getTimeZone(), ChannelNo, this.HDMode);
                byte[]buff = new byte[ msg_stop.length + buff_daylist.length];
                System.arraycopy(msg_stop,0, buff,0, msg_stop.length );

                System.arraycopy(buff_daylist,0, buff, msg_stop.length , buff_daylist.length );
                new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( buff);
            }

        }
    }

    public  void Stop(){
        if( running == true) {
            byte[] msg = utils.MsgBuffer(Constant.EnumCmdMsg.MOBILE_MSG_DISCONNECT, null);
            new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute(msg);
        }
    }

    public  void  SeekPOS(int val, boolean HD, boolean firstRun)
    {
        try {
            SearchTimeData st = this.ServerInfo.getSearchTime();
            if(st == null || val > st.getTimeInterval())
                return;
            PlaybackStatus = Constant.EnumPlaybackSatus.VIDEO_PLAY;
            int[] v_index = this.ChannelNo(false);
            //int send_len = this.SendLogin(this.ServerInfo);
            // Log.d("GOND", "**DIRECT** SeekPOS GetChannel: " + Arrays.toString(v_index));
            if(firstRun){
                TimeZone currentServerTimeZone = ServerInfo.getTimeZone().getTimeZone();

                if(daylight.isBeginOfDST() && val > (daylight.getTimeStartDST() * 3600)){
                    val -= 3600;
                }

                if(daylight.isEndOfDST()){
                    int hourSpecial = daylight.getTimeEndDST() - 1;
                    if(val >= (hourSpecial * 3600)) {
                        val += 3600;
                    }
                }
            }

            this.HDMode = HD;
            //new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( buff);
            byte[]  msg_stop = MsgCommandItem.MSG_SEARCH_REQUEST_STOP(this.ServerInfo, v_index);
            //WriteSocketData(  msg_buffer);
            byte[] msg_set_pos = MsgCommandItem.MSG_SEARCH_REQUEST_SETPOS(this.ServerInfo, v_index, val, this.HDMode);
            //WriteSocketData(  msg_buffer);
            byte[] msg_fw = MsgCommandItem.MSG_SEARCH_REQUEST_PLAY_FW(this.ServerInfo, v_index,val, this.HDMode);
            //WriteSocketData( msg_buffer);
            byte[]buff = new byte[ msg_fw.length + msg_set_pos.length + msg_stop.length ];
            System.arraycopy(msg_stop,0, buff,0, msg_stop.length );
            System.arraycopy(msg_set_pos,0, buff,msg_stop.length , msg_set_pos.length );
            System.arraycopy(msg_fw,0, buff,msg_set_pos.length + msg_stop.length, msg_fw.length );
            new SendBufferTask(this.OutPut, isRelay, this.clientIp).execute( buff);
        } catch (Exception e) {

            //throw e;
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " Exception 4 e = " + e);

        }

    }

    public void CloseSocket()
    {
        Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " CloseSocket");
        if( socket == null)
            return;
        try {
            InPut.close();
            //socket.shutdownInput();
        }catch (IOException ioe){
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " Exception 5 ioe = " + ioe);
        }
        try {
            OutPut.close();
            //socket.shutdownOutput();
        }catch (IOException ioe){
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " Exception 6 ioe = " + ioe);
        }
        try {
            socket.close();
            socket = null;
        }catch (IOException ioe){
            Log.e("GOND", "relay isLive = " + ServerInfo.getisLive() + " Exception 7 ioe = " + ioe);
        }
    }

    protected class SendBufferTask extends AsyncTask<byte[],Integer,Integer>
    {
        BufferedOutputStream writer;
        boolean isRelay;
        String clientIp;
        protected SendBufferTask(BufferedOutputStream output, boolean _isRelay, String _clientIp)
        {
            writer = output;
            isRelay = _isRelay;
            clientIp = _clientIp;
        }
        @Override
        protected Integer doInBackground(byte[]... buff){

            int ret = utils.WriteBlock( this.writer, utils.notifyAddRelayHeader(buff[0], isRelay, clientIp));

            Log.d("GOND", "relay isLive = " + ServerInfo.getisLive() + " WriteBlock SendBufferTask");
            return  Integer.valueOf(ret);
        }
    }

}


