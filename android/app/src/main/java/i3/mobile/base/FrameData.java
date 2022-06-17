package i3.mobile.base;



/**
 * Created by i3dvr on 12/13/2017.
 */

public final class FrameData {

    public static final int Command_Header_Length = 2;
    public static final int Command_Data_Length = 4;
    public static final int  AcceptInfo_Header_Length = 4;

    public static final int  FRAME_HEADER_SIZE = 16;
    public static final int  FRAME_HEADER_EX_SIZE_SERVER_3_2 = 20;
    public static final int  FRAME_HEADER_EX_SIZE_SERVER_3_3 = 32;


    FrameHeader Header;
    int index;
    byte[] buffer;
    int buffer_index = 0;
    byte state;
    char Command;
    int ReadSize;
    int ServerVersion;

    public int getRemainLen(){
        if(buffer == null || Header == null || Header.length == 0)
            return 0;
        return Header.length - (buffer_index);
    }
    public byte[] getBuffer(){ return  buffer;}
//    public  boolean getFrameComplete(){ if( buffer == null) return false;
//                                        return buffer_index >= buffer.length -1; }
    public int getReadSize(){ return ReadSize;}

    public  void  setReadSize(int size){ ReadSize = size;}

    public char getCommand() {return Command;}

    public void setCommand( char cmd){ Command = cmd; }



    public FrameHeader getHeader(){ return Header;}
    public void  setHeader(FrameHeader header){
        Header = header;
        if(header.length > 0)
        { buffer = new byte[ header.length];}
    }

    public int getIndex(){ return  index;}
    public  void  setIndex(int value){ index = value;}

    public byte getState(){ return state;}
    public void setState(byte value){ state = value;}

    public FrameData(int index)
    {
        InitData();
    }
    void  InitData()
    {
        Header = null;
        index = index;
        buffer = new byte[0];
        Command = Constant.EnumCmdMsg.MOBILE_MSG_GROUP_COMMUNICATION_BEGIN;
        state = Constant.EnumBufferState.COMMAND_GET;
        ReadSize = Command_Header_Length;
        buffer_index = 0;
    }
    public void Reset()
    {
        InitData();
    }
    public void AppendBuffer(byte[] src, int ofset, int length)
    {
        if( buffer == null || src == null)
            return;
        System.arraycopy(src,ofset , buffer,buffer_index,length);
        buffer_index += length;

//        if( src == null || src.length == 0)
//            return;
//
//        switch (state)
//        {
//            case Constant.EnumBufferState.COMMAND_GET:
//                CommandGet(src);
//                break;
//            case Constant.EnumBufferState.COMMAND_HEADER:
//                break;
//            case Constant.EnumBufferState.COMMAND_DATA:
//                break;
//        }
    }
    void CommandHeader(byte[] src)
    {

    }
    void CommandGet(byte[] src)
    {
        Command = utils.ByteArrayToChar(src,0);
        switch ( Command)
        {
            case Constant.EnumCmdMsg.MOBILE_MSG_KEEP_ALIVE:
            case Constant.EnumCmdMsg.MOBILE_MSG_MINIMIZE:
            case Constant.EnumCmdMsg.MOBILE_MSG_DISCONNECT:
                InitData();
            break;
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_NEXT_FRAME:
            case Constant.EnumCmdMsg.MOBILE_MSG_ENCODED_VIDEO:
            case Constant.EnumCmdMsg.MOBILE_MSG_ENCODED_VIDEO_GROUP:
            case Constant.EnumCmdMsg.MOBILE_MSG_SEND_NEXT_ENCODE_FRAME:
                ReadSize = FRAME_HEADER_SIZE;
                if( ServerVersion > Constant.EnumServerVersion.VERSION_2300)
                {
                    if(ServerVersion < Constant.EnumServerVersion.VERSION_3300)
                    {
                        ReadSize = FRAME_HEADER_EX_SIZE_SERVER_3_2;
                    }
                    else
                    {
                        ReadSize = FRAME_HEADER_EX_SIZE_SERVER_3_3;
                    }
                }
                state = Constant.EnumBufferState.COMMAND_HEADER;
                break;
            default:
                    ReadSize = Command_Header_Length;
                    state = Constant.EnumBufferState.COMMAND_GET;
                break;
        }
    }
}
