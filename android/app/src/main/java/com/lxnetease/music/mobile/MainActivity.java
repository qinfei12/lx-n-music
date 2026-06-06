package com.lxnetease.music.mobile;

import com.reactnativenavigation.NavigationActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;

public class MainActivity extends NavigationActivity {


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 刘海屏适配：让内容延伸到刘海区域
        extendToCutout();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // RNN 可能在 onResume 时重新设置窗口属性，需要再次确保刘海屏适配
        extendToCutout();
    }

    private void extendToCutout() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            Window window = getWindow();
            if (window != null) {
                WindowManager.LayoutParams layoutParams = window.getAttributes();
                // 将布局延伸到刘海区域
                layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(layoutParams);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    // Android 11+：使用新 API 让窗口内容延伸到刘海/挖孔区域
                    window.setDecorFitsSystemWindows(false);
                } else {
                    // Android 9-10：让内容在刘海区域也显示
                    window.getDecorView().setSystemUiVisibility(
                            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
                }

                // 关键修复：确保 React Native 根视图延伸到刘海区域
                window.getDecorView().post(() -> {
                    View rootView = window.getDecorView().getRootView();
                    if (rootView != null) {
                        rootView.setFitsSystemWindows(false);
                    }
                });
            }
        }
    }
}
