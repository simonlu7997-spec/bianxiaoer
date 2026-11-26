package com.bianxiaoer.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * 口岸通（边小二）Android 入口 —— 原生 WebView 壳。
 *
 * 与 iOS 壳同策略：站点留在应用内，高德导航/拨号/支付等外链交给系统打开。
 * 另外必须实现 WebView 定位桥接：H5 出行页的「开启定位」走 navigator.geolocation，
 * 若宿主不转发系统权限并回调 GeolocationPermissions.Callback，点击会毫无反应。
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
    webView.getSettings().setJavaScriptEnabled(true);
    webView.getSettings().setDomStorageEnabled(true);
    webView.getSettings().setDatabaseEnabled(true);
    webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
    webView.getSettings().setUseWideViewPort(true);
    webView.getSettings().setLoadWithOverviewMode(true);
    // H5 需要 navigator.geolocation（出行页定位、详情页距离）
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
        // 保存回调，等系统授权结果回来再答复网页
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
    webView.loadUrl("https://bianxiaoer.net/");
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
