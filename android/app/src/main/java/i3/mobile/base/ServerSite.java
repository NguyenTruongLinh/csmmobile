package i3.mobile.base;

import java.util.Arrays;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.TimeZone;
import android.util.Log;

import i3.mobile.search.setting.SearchTimeData;
import i3.mobile.search.setting.ServerTimeZone;

/**
 * Created by Administrator on 11/30/2017.
 */

public class ServerSite
{
    public int ID;//CMS KDVR
    public boolean hasEverConnnected;
    public String serverName;
    public String serverIP;
    public String serverWANIp;
    public String conntectingIp;
    public String serverPort;
    public String serverID;
    public String userName;
    public String pass;
    public boolean isConnecting;
    public int serverVersion;
    public boolean bUserCannceled;
    public  int ConnectionIndex;
    public  int serverVideoPort;
    boolean isLive = true;
    ServerTimeZone TimeZone = null;
    SearchTimeData SearchTime;
    public String haspLicense;
    public boolean isRelay = false;
    public boolean relayConnectable = false;
    public String relayIp = "";
    public int relayPort = -1;
    public SearchTimeData getSearchTime(){ return SearchTime;}
    public void  setSearchTime(SearchTimeData val){ SearchTime = val;}
    public ServerTimeZone getTimeZone() {return  TimeZone;}
    public  void  setTimeZone(ServerTimeZone val){ TimeZone = val;}
    public  boolean getisLive(){ return  isLive;}
    public  void  setLive(boolean val){ isLive = val;}
    HashMap<Integer, Integer> VideoInput;
    byte[]Search_privilege;
    byte[]Live_privilege;
    public  HashMap<Integer, Integer> getVideoInput(){ return VideoInput;}
    public  void  setVideoInput( HashMap<Integer, Integer> value){ this.VideoInput = value;}
    public ServerSite()
    {
        ID = -1;
        hasEverConnnected = false;
        serverName = serverIP = serverWANIp = serverID = userName = pass = null;
        isConnecting = false;
        serverVersion = -1;
        Search_privilege = new byte[Constant.MAX_SERVER_CHANNEL];
        Live_privilege = new byte[Constant.MAX_SERVER_CHANNEL];
    }
    public void MakeInitDefaultInfo()
    {
        ID = -1;
        hasEverConnnected = false;
        serverName = serverIP = serverWANIp = conntectingIp = userName = pass = "";
        serverID = "";
        serverPort = "13225";
        isConnecting = false;
        serverVersion = -1;
        bUserCannceled = false; //Bao added
    }
    public ServerSite(int _ID, boolean _hasEverConnnected, String _svrName, String _svrIP, String _wanIP,
                      String _svrPort, String _svrID, String _usr, String _pass,
                      boolean _isConnecting, int _serverVersion)
    {
        ID = _ID;
        hasEverConnnected = _hasEverConnnected;
        serverName = _svrName;
        serverIP = _svrIP;
        serverWANIp = _wanIP;
        serverPort = _svrPort;
        serverID = _svrID;
        userName = _usr;
        pass = _pass;
        isConnecting = _isConnecting;
        serverVersion = _serverVersion;
    }
//    public ServerSite CopyItself()
//    {
//        if(this == null)
//            return null;
//        else
//        {
//            ServerSite _sv = new ServerSite(ID, hasEverConnnected, serverName, serverIP, serverWANIp, serverPort, serverID, userName, pass, isConnecting, serverVersion);
//            _sv.conntectingIp = conntectingIp;
//            return _sv;
//        }
//    }
    public String ToString()
    {
        if(this == null)
            return null;
        else
        {
            if((serverIP == null) || (serverPort == null))
                return null;
            return ("Server_" + serverIP+ "_" + serverPort);
        }
    }
    public boolean EqualWith(ServerSite svr)
    {
        if (svr == null ) {
            return false;
        }
        // Log.i("GOND","Ip: " + svr.serverIP + ", port: " + svr.serverPort + ", id: " + svr.serverID + ", name: " + svr.userName + ", pass: " + svr.pass);
        return this.EqualWith(svr.serverIP, svr.serverPort, svr.serverID, svr.userName, svr.pass);
    }
    public boolean EqualWith(String _svrIP, String _svrPort, String _svrID, String _usr, String _pass)
    {
        if((!_svrIP.equals(serverIP)) || (!_svrPort.equals(serverPort))
                ||(!_svrID.equals(serverID)) || (!_usr.equals(userName)) || (!_pass.equals(pass)))
            return false;
        return true;
    }
    public boolean SameWith(String _svrIP, String _svrPort)
    {
        if((!_svrIP.equals(serverIP)) || (!_svrPort.equals(serverPort)))
            return false;
        return true;
    }
    private boolean GetPrivilege( int channelNo, byte[]permission)
    {
        if( channelNo < 0 || permission == null || channelNo >= permission.length )
            return false;
        return  permission[channelNo] == (byte)1;
    }
    private void UpdatePrivilege(String privilege, byte[]permission)
    {
        if( permission == null)
            return;
        Arrays.fill(permission,(byte)0);
        if( privilege == null || privilege.length() == 0 )
            return;
        String[] parts = privilege.split("_");
        if(parts.length == 0)
            return;
        for( int i=0; i< parts.length; i++)
        {
            if( parts[i].equals("1"))
                permission[i] = (byte)1;
        }
    }

    synchronized public boolean GetSearchPrivilege(int channelNo)
    {
        return this.GetPrivilege(channelNo, this.Search_privilege);
    }

    synchronized public void UpdateSearchPrivilege(String privilege )
    {
        this.UpdatePrivilege(privilege, this.Search_privilege);
    }

    synchronized public boolean GetLivePrivilege(int channelNo)
    {
        return this.GetPrivilege(channelNo, this.Live_privilege);
    }

    synchronized public void UpdateLivePrivilege(String privilege )
    {
        this.UpdatePrivilege(privilege, this.Live_privilege);
    }
}
