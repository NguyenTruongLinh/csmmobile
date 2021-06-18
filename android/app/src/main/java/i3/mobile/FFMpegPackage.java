package i3.mobile;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.uimanager.ViewManager;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
/**
 * Created by i3dvr on 12/20/2017.
 */

public class FFMpegPackage implements ReactPackage {

    // @Override
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                new FFMpegFrameViewManager(reactContext)
        );
        //return Collections.emptyList();
    }


    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        modules.add(new FFMpegModule(reactContext));

        return modules;
    }
}
