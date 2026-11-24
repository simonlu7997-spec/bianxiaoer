package com.bianxiaoer.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * 口岸通（边小二）Android 入口 —— 原生 WebView 壳。
 * 与 iOS 壳同策略：站点留在应用内，高德导航/拨号/支付等外链交给系统打开。
 */
public class MainActivity extends Activity {
  private WebView webView;

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

    setContentView(webView);
    webView.loadUrl("https://bianxiaoer.net/");
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
