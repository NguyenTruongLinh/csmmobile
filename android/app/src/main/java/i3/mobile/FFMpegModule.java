package i3.mobile;

import android.app.ActionBar;
import android.app.Activity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by i3dvr on 12/20/2017.
 */

public class FFMpegModule extends ReactContextBaseJavaModule {
    private ReactContext mReactContext;
    public FFMpegModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
        //Global.LoadLib();
    }


    @Override
    public String getName() {
        return "FFMpegModule";
    }
    private void sendEvent(String eventName, WritableMap params) {
        mReactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        //constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
        //constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
        return constants;
    }

}
