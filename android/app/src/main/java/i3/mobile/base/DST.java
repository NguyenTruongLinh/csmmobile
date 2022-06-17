package i3.mobile.base;

/**
 * Created by i3admin on 2018-12-25.
 */

public class DST {
    private boolean isBeginOfDST = false;
    private boolean isEndOfDST = false;
    private int timeStartDST = 2; // 2 hour
    private int timeEndDST = 2;

    public boolean isBeginOfDST() {
        return isBeginOfDST;
    }
    public void setBeginOfDST(boolean isBeginOfDST) {
        this.isBeginOfDST = isBeginOfDST;
    }
    public int getTimeStartDST() {
        return timeStartDST;
    }
    public void setTimeStartDST(int timeStartDST) {
        this.timeStartDST = timeStartDST;
    }
    public int getTimeEndDST() {
        return timeEndDST;
    }
    public void setTimeEndDST(int timeEndDST) {
        this.timeEndDST = timeEndDST;
    }
    public void setEndOfDST(boolean isEndOfDST) {
        this.isEndOfDST = isEndOfDST;
    }
    public boolean isEndOfDST() {
        return isEndOfDST;
    }
}
