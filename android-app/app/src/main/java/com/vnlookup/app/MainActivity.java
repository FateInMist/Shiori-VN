package com.vnlookup.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MainActivity extends Activity {

    private static final String APP_ORIGIN = "appassets.androidplatform.net";
    private static final String APP_URL = "https://appassets.androidplatform.net/assets/index.html";
    private static final String BG = "#050D17";

    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");

    private WebView webView;
    private int insetTopDp = 0;
    private int insetBottomDp = 0;
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(20, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();
    private final ExecutorService httpPool = Executors.newFixedThreadPool(3);

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        /* 沉浸式：内容铺满整屏，状态栏和导航栏透明 */
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }
        applyBarIcons(true);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor(BG));
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(false);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setUseWideViewPort(false);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUserAgentString(settings.getUserAgentString() + " VNLookup/0.1.3");

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String host = url.getHost();
                if (host != null && host.equals(APP_ORIGIN)) {
                    return false;
                }
                openExternal(url.toString());
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pushInsets();
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void openExternal(String url) {
                MainActivity.this.openExternal(url);
            }

            @JavascriptInterface
            public void setTheme(final boolean dark) {
                runOnUiThread(() -> applyBarIcons(dark));
            }

            /* 原生 HTTP 桥：绕开浏览器的 CORS 限制，支持 PATCH / DELETE */
            @JavascriptInterface
            public void request(final String id, final String method, final String url,
                                final String headersJson, final String body) {
                httpPool.execute(() -> handleNativeRequest(id, method, url, headersJson, body));
            }

            @JavascriptInterface
            public String platform() {
                return "android";
            }
        }, "AndroidApp");

        /* 把系统栏高度传给网页，网页用它做安全区内边距 */
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float density = getResources().getDisplayMetrics().density;
            insetTopDp = Math.round(bars.top / density);
            insetBottomDp = Math.round(bars.bottom / density);
            pushInsets();
            return windowInsets;
        });

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void applyBarIcons(boolean darkTheme) {
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(!darkTheme);
        controller.setAppearanceLightNavigationBars(!darkTheme);
    }

    private void pushInsets() {
        if (webView == null) return;
        String js = "window.__setInsets&&window.__setInsets(" + insetTopDp + "," + insetBottomDp + ")";
        webView.evaluateJavascript(js, null);
    }

    private void handleNativeRequest(String id, String method, String url, String headersJson, String body) {
        int status = 0;
        String respBody = "";
        String error = null;
        try {
            Request.Builder builder = new Request.Builder().url(url);
            try {
                JSONObject headers = new JSONObject(headersJson == null ? "{}" : headersJson);
                Iterator<String> keys = headers.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    builder.addHeader(key, headers.getString(key));
                }
            } catch (Exception ignored) { /* 头解析失败就不带头 */ }

            RequestBody rb = null;
            if (body != null && !body.isEmpty()) {
                rb = RequestBody.create(body, JSON_TYPE);
            }
            builder.method(method, rb);

            try (Response response = httpClient.newCall(builder.build()).execute()) {
                status = response.code();
                if (response.body() != null) {
                    respBody = response.body().string();
                }
            }
        } catch (Exception e) {
            error = e.getMessage();
        }

        final int st = status;
        final String out = respBody;
        final String err = error;
        runOnUiThread(() -> {
            try {
                JSONObject res = new JSONObject();
                res.put("status", st);
                res.put("body", out);
                if (err != null) res.put("error", err);
                String js = "window.__nativeHttp&&window.__nativeHttp("
                        + JSONObject.quote(id) + "," + res.toString() + ")";
                if (webView != null) {
                    webView.evaluateJavascript(js, null);
                }
            } catch (Exception ignored) { /* 忽略 */ }
        });
    }

    private void openExternal(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception ignored) {
            // 没有可用的浏览器时静默失败
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        httpPool.shutdownNow();
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
