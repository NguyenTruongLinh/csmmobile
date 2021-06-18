package i3.mobile.base;

/**
 * Created by i3dvr on 1/10/2018.
 */

public class CommandState{
    public char cmdid = 0;
    public byte state = Constant.EnumBufferState.COMMAND_GET;
    public int msg_len =0;
    public  int remain_len = Character.BYTES;
    public CommandState()
    {
        ResetState();
    }
    public void ResetState(){
        state = Constant.EnumBufferState.COMMAND_GET;
        msg_len =0;
        remain_len = Character.BYTES;
        cmdid = 0;
    }
}