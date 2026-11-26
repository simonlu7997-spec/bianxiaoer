package com.bianxiaoer.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.DisplayCutout;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * 口岸通（边小二）Android 入口 —— 原生 WebView 壳。
 *
 * 三条关键约束：
 *  1. 站点留在应用内，高德导航/拨号/支付等外链交给系统打开；
 *  2. 转发系统定位权限给 navigator.geolocation（否则「开启定位」点了没反应）；
 *  3. 按系统栏 insets 给 WebView 留边距 —— targetSdk 35+ 强制 edge-to-edge，
 *     而 Android WebView 的 env(safe-area-inset-*) 恒为 0，H5 的 100dvh 会把
 *     系统导航栏算进视口，导致底部 Tab 被压在导航栏后面、短页面多出空白。
 */
public class MainActivity extends Activity {
  private static final int REQ_LOCATION = 1001;

  private WebView webView;
  private GeolocationPermissions.Callback pendingLocationCallback;
  private String pendingLocationOrigin;

  @SuppressLint("SetJavaScriptEnabled")
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    webView = new WebView(this);
    webView.setLayoutParams(new ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    webView.setBackgroundColor(Color.WHITE);
    webView.getSettings().setJavaScriptEnabled(true);
    webView.getSettings().setDomStorageEnabled(true);
    webView.getSettings().setDatabaseEnabled(true);
    webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
    webView.getSettings().setUseWideViewPort(true);
    webView.getSettings().setLoadWithOverviewMode(true);
    webView.getSettings().setGeolocationEnabled(true);

    webView.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        String host = url.getHost() == null ? "" : url.getHost().toLowerCase();
        if (host.equals("bianxiaoer.net") || host.equals("www.bianxiaoer.net")) {
          return false;
        }
        try {
          startActivity(new Intent(Intent.ACTION_VIEW, url));
          return true;
        } catch (Exception ignored) {
          return false;
        }
      }
    });

    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onGeolocationPermissionsShowPrompt(
          String origin, GeolocationPermissions.Callback callback) {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
          callback.invoke(origin, true, false);
          return;
        }
        pendingLocationCallback = callback;
        pendingLocationOrigin = origin;
        requestPermissions(
            new String[] {
              Manifest.permission.ACCESS_FINE_LOCATION,
              Manifest.permission.ACCESS_COARSE_LOCATION
            },
            REQ_LOCATION);
      }
    });

    setContentView(webView);
    applySystemBarInsets();
    styleSystemBars();
    webView.loadUrl("https://bianxiaoer.net/");
  }

  /** 让 WebView 的视口等于「去掉状态栏/导航栏/刘海后的可见区域」。 */
  private void applySystemBarInsets() {
    webView.setOnApplyWindowInsetsListener((view, insets) -> {
      int left = insets.getSystemWindowInsetLeft();
      int top = insets.getSystemWindowInsetTop();
      int right = insets.getSystemWindowInsetRight();
      int bottom = insets.getSystemWindowInsetBottom();
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        DisplayCutout cutout = insets.getDisplayCutout();
        if (cutout != null) {
          left = Math.max(left, cutout.getSafeInsetLeft());
          top = Math.max(top, cutout.getSafeInsetTop());
          right = Math.max(right, cutout.getSafeInsetRight());
          bottom = Math.max(bottom, cutout.getSafeInsetBottom());
        }
      }
      view.setPadding(left, top, right, bottom);
      return insets;
    });
    webView.requestApplyInsets();
  }

  /** 系统栏用白底深色图标，与站点浅色主题一致。 */
  private void styleSystemBars() {
    getWindow().setBackgroundDrawableResource(android.R.color.white);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getWindow().setStatusBarColor(Color.TRANSPARENT);
      getWindow().setNavigationBarColor(Color.TRANSPARENT);
      getWindow()
          .getInsetsController()
          .setSystemBarsAppearance(
              android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                  | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
              android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                  | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      getWindow().setStatusBarColor(Color.WHITE);
      getWindow()
          .getDecorView()
          .setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode, String[] permissions, int[] grantResults) {
    if (requestCode == REQ_LOCATION && pendingLocationCallback != null) {
      boolean granted =
          grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
      pendingLocationCallback.invoke(pendingLocationOrigin, granted, false);
      pendingLocationCallback = null;
      pendingLocationOrigin = null;
      return;
    }
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
  }

  @Override
  public void onBackPressed() {
    if (webView != null && webView.canGoBack()) {
      webView.goBack();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  protected void onDestroy() {
    if (webView != null) {
      webView.destroy();
      webView = null;
    }
    super.onDestroy();
  }
}
