package com.astrovikass.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.Toast;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Astro Vikass — apna full-screen browser (WebView). URL bar nahi, Chrome ki zaroorat nahi. */
public class MainActivity extends Activity {
    static final String HOME = "https://sidtech366.vercel.app/astrovikas/";
    static final String RASHIFAL = "https://sidtech366.github.io/jyotishi/tools/rashifal.html";   // सुबह के नोटिफ़िकेशन से खुलता है
    static final int NAVY = Color.parseColor("#14103A");
    /** Ye sites app ke andar hi khulti hain; baaki sab (WhatsApp, call, UPI, dusri site) phone ke apne app me. */
    static final List<String> INSIDE = Arrays.asList("sidtech366.vercel.app", "sidtech366.github.io", "script.google.com",
            "script.googleusercontent.com", "checkout.razorpay.com", "api.razorpay.com", "razorpay.com", "lumberjack.razorpay.com");

    WebView web;
    ImageView splash;
    ValueCallback<Uri[]> filePicker;
    PermissionRequest pendingWebPerm;
    GeolocationPermissions.Callback pendingGeo;
    String pendingGeoOrigin;
    static final int REQ_FILE = 11, REQ_CAM = 12, REQ_LOC = 13, REQ_NOTIF = 14;

    Updater upd;

    @Override protected void onResume() { super.onResume(); if (upd != null) upd.onResume(); }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(NAVY);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        splash = new ImageView(this);
        splash.setBackgroundColor(NAVY);
        splash.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        splash.setImageResource(R.drawable.splash);
        splash.setPadding(80, 80, 80, 80);
        root.addView(splash, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        setup();
        DailyReceiver.schedule(this);
        upd = new Updater(this);
        web.postDelayed(new Runnable() { @Override public void run() { upd.check(false); } }, 5000);   // नया वर्ज़न ➜ पॉपअप
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);

        Uri d = getIntent() != null ? getIntent().getData() : null;
        web.loadUrl(d != null && "https".equals(d.getScheme()) ? d.toString() : HOME);
    }

    void setup() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " AstroVikassApp/1");
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(web, true);   // site Apps Script ko iframe me kholti hai
        web.addJavascriptInterface(new Bridge(), "AVApp");   // website ka "ऐप शेयर करें" button isse ऐप की फ़ाइल भेजता है
        web.setBackgroundColor(NAVY);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String sc = u.getScheme() == null ? "" : u.getScheme();
                if (sc.equals("http") || sc.equals("https")) {
                    if (!r.isForMainFrame()) return false;                     // iframe ke andar ka load
                    String h = u.getHost() == null ? "" : u.getHost();
                    for (String ok : INSIDE) if (h.equals(ok) || h.endsWith("." + ok)) return false;
                    if (h.endsWith(".googleusercontent.com")) return false;
                }
                if (sc.equals("about") || sc.equals("blob") || sc.equals("data") || sc.equals("javascript")) return false;
                openOutside(u);
                return true;
            }
            @Override public void onPageFinished(WebView v, String url) {
                CookieManager.getInstance().flush();
                if (splash != null && splash.getParent() != null) {
                    splash.animate().alpha(0f).setDuration(300).withEndAction(new Runnable() {
                        @Override public void run() { if (splash.getParent() != null) ((ViewGroup) splash.getParent()).removeView(splash); }
                    }).start();
                }
            }
            @Override public void onReceivedHttpError(WebView v, WebResourceRequest r, android.webkit.WebResourceResponse res) {
                // कोई पेज "नहीं मिला" (404) आए तो खाली पेज न दिखे — होम पर ले जाएँ
                if (r.isForMainFrame() && res != null && res.getStatusCode() == 404 && !HOME.equals(r.getUrl().toString())) {
                    toast("पेज नहीं मिला — होम खोल रहे हैं"); v.loadUrl(HOME);
                }
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (!r.isForMainFrame()) return;
                v.loadDataWithBaseURL(null, "<html><body style='margin:0;background:#14103A;color:#fff;font-family:sans-serif;text-align:center;padding:90px 24px'>" +
                        "<div style='font-size:54px'>🔌</div><h2 style='color:#fad678'>इंटरनेट नहीं चल रहा</h2><p>कनेक्शन जाँचकर दोबारा कोशिश करें।</p>" +
                        "<a href='" + HOME + "' style='display:inline-block;margin-top:18px;background:#deb048;color:#14103A;font-weight:700;padding:12px 28px;border-radius:99px;text-decoration:none'>दोबारा खोलें</a></body></html>",
                        "text/html", "utf-8", null);
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(final PermissionRequest req) {          // camera (हस्त रेखा स्कैन)
                runOnUiThread(new Runnable() { @Override public void run() {
                    boolean cam = false;
                    for (String r : req.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) cam = true;
                    if (!cam) { req.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        req.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    } else { pendingWebPerm = req; requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAM); }
                }});
            }
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {   // GPS (शहर / पंचांग)
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) cb.invoke(origin, true, false);
                else { pendingGeo = cb; pendingGeoOrigin = origin; requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOC); }
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {   // फ़ोटो / फ़ाइल चुनना
                if (filePicker != null) filePicker.onReceiveValue(null);
                filePicker = cb;
                try { startActivityForResult(p.createIntent(), REQ_FILE); }
                catch (ActivityNotFoundException e) { filePicker = null; return false; }
                return true;
            }
        });

        web.setDownloadListener(new DownloadListener() {
            @Override public void onDownloadStart(String url, String ua, String cd, String mime, long len) {
                try {
                    if (url.startsWith("blob:") || url.startsWith("data:")) { toast("ऐप में ⬇️ डाउनलोड बटन से सेव करें"); return; }
                    DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                    r.setMimeType(mime);
                    r.addRequestHeader("User-Agent", ua);
                    r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, cd, mime));
                    ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(r);
                    toast("डाउनलोड शुरू हुआ");
                } catch (Exception e) { openOutside(Uri.parse(url)); }
            }
        });
    }


    /** Website se bulaya jata hai: window.AVApp.shareApp() */
    class Bridge {
        @JavascriptInterface public boolean isApp() { return true; }
        @JavascriptInterface public void shareApp() {
            runOnUiThread(new Runnable() { @Override public void run() { doShareApp(); } });
        }
        /** फ़ाइल (base64) फ़ोन के Download/AstroVikass फ़ोल्डर में सेव — window.AVApp.saveFile(name, mime, b64) */
        @JavascriptInterface public void saveFile(final String name, final String mime, final String b64) {
            new Thread(new Runnable() { @Override public void run() { doSave(name, mime, b64); } }).start();
        }
        /** फ़ाइल शेयर — phone दिया हो तो सीधे उसी नंबर की WhatsApp चैट में: window.AVApp.shareFile(name, mime, b64, phone, text) */
        @JavascriptInterface public void shareFile(final String name, final String mime, final String b64, final String phone, final String text) {
            new Thread(new Runnable() { @Override public void run() { doShareFile(name, mime, b64, phone, text); } }).start();
        }
        @JavascriptInterface public int ver() { return 3; }
        /** वेबसाइट से "अपडेट देखें" बटन — window.AVApp.checkUpdate() */
        @JavascriptInterface public void checkUpdate() { runOnUiThread(new Runnable() { @Override public void run() { if (upd != null) upd.check(true); } }); }
        @JavascriptInterface public String appVer() { return upd != null ? upd.myName() : ""; }
    }

    void doSave(String name, String mime, String b64) {
        try {
            byte[] data = Base64.decode(b64, Base64.DEFAULT);
            String n = ShareProvider.clean(name), m = (mime == null || mime.isEmpty()) ? ShareProvider.mimeOf(n) : mime;
            String where;
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, n);
                v.put(MediaStore.MediaColumns.MIME_TYPE, m);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/AstroVikass");
                Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (u == null) throw new Exception("no uri");
                OutputStream os = getContentResolver().openOutputStream(u);
                os.write(data); os.close();
                where = "Download/AstroVikass";
            } else {
                File d = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "AstroVikass"); d.mkdirs();
                OutputStream os = new FileOutputStream(new File(d, n)); os.write(data); os.close();
                where = d.getAbsolutePath();
            }
            final String msg = "✅ सेव हो गई: " + where + "/" + n;
            runOnUiThread(new Runnable() { @Override public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); } });
        } catch (Exception e) {
            runOnUiThread(new Runnable() { @Override public void run() { toast("फ़ाइल सेव नहीं हो सकी"); } });
        }
    }

    void doShareFile(String name, String mime, String b64, String phone, String text) {
        try {
            byte[] data = Base64.decode(b64, Base64.DEFAULT);
            String n = ShareProvider.clean(name), m = (mime == null || mime.isEmpty()) ? ShareProvider.mimeOf(n) : mime;
            File[] old = ShareProvider.dir(this).listFiles();
            if (old != null) for (File f : old) if (System.currentTimeMillis() - f.lastModified() > 86400000L) f.delete();   // पुरानी फ़ाइलें साफ़
            OutputStream os = new FileOutputStream(new File(ShareProvider.dir(this), n)); os.write(data); os.close();
            final Uri uri = ShareProvider.uriOf(n);
            final Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(m);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            if (text != null && !text.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, text);
            send.setClipData(ClipData.newRawUri(n, uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            String p = phone == null ? "" : phone.replaceAll("\\D", "");
            if (p.length() == 10) p = "91" + p;
            String wa = null;
            if (p.length() >= 11) for (String pk : new String[]{"com.whatsapp", "com.whatsapp.w4b"}) {
                try { getPackageManager().getPackageInfo(pk, 0); wa = pk; break; } catch (Exception e) { }
            }
            final String waPkg = wa, jid = p + "@s.whatsapp.net";
            runOnUiThread(new Runnable() { @Override public void run() {
                if (waPkg != null) {
                    Intent w = new Intent(send);
                    w.setPackage(waPkg);
                    w.putExtra("jid", jid);          // सीधे उसी नंबर की चैट
                    try { startActivity(w); return; } catch (Exception e) { }
                }
                try { startActivity(Intent.createChooser(send, "भेजें").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)); }
                catch (Exception e) { toast("शेयर नहीं हो सका"); }
            } });
        } catch (Exception e) {
            runOnUiThread(new Runnable() { @Override public void run() { toast("फ़ाइल शेयर नहीं हो सकी"); } });
        }
    }

    /** Installed ऐप की APK फ़ाइल ही शेयर करता है (लिंक नहीं) — WhatsApp, Bluetooth, Nearby Share आदि से। */
    void doShareApp() {
        try {
            File out = ApkProvider.file(this);
            out.getParentFile().mkdirs();
            InputStream in = new FileInputStream(getApplicationInfo().sourceDir);
            OutputStream os = new FileOutputStream(out);
            byte[] buf = new byte[65536]; int n;
            while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
            os.close(); in.close();

            Uri uri = Uri.parse("content://" + ApkProvider.AUTH + "/" + ApkProvider.NAME);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("application/vnd.android.package-archive");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_SUBJECT, "Astro Vikass ऐप");
            send.putExtra(Intent.EXTRA_TEXT, "🙏 Astro Vikass ऐप — लाल किताब, वैदिक ज्योतिष, वास्तु, कुंडली, राशिफल।\nइसे इंस्टॉल करने के लिए यह फ़ाइल खोलें (\"अनजान स्रोत से इंस्टॉल\" की अनुमति दें)।");
            send.setClipData(ClipData.newRawUri("Astro Vikass", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(send, "Astro Vikass ऐप शेयर करें").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));
        } catch (Exception e) { toast("ऐप शेयर नहीं हो सका"); }
    }

    void openOutside(Uri u) {
        try {
            if ("intent".equals(u.getScheme())) { startActivity(Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME)); return; }
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (Exception e) { toast("यह लिंक खुल नहीं सका"); }
    }

    void toast(String t) { Toast.makeText(this, t, Toast.LENGTH_SHORT).show(); }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE && filePicker != null) {
            Uri[] r = null;
            if (res == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    ArrayList<Uri> l = new ArrayList<>();
                    for (int i = 0; i < data.getClipData().getItemCount(); i++) l.add(data.getClipData().getItemAt(i).getUri());
                    r = l.toArray(new Uri[0]);
                } else if (data.getData() != null) r = new Uri[]{data.getData()};
            }
            filePicker.onReceiveValue(r);
            filePicker = null;
        } else super.onActivityResult(req, res, data);
    }

    @Override public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
        if (req == REQ_CAM && pendingWebPerm != null) {
            if (ok) pendingWebPerm.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}); else pendingWebPerm.deny();
            pendingWebPerm = null;
        } else if (req == REQ_LOC && pendingGeo != null) {
            pendingGeo.invoke(pendingGeoOrigin, ok, false);
            pendingGeo = null;
        }
    }

    @Override protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        Uri d = i.getData();
        if (d != null && "https".equals(d.getScheme())) web.loadUrl(d.toString());
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else if (web.getUrl() != null && !web.getUrl().startsWith(HOME)) web.loadUrl(HOME);   // नोटिफ़िकेशन से खुला राशिफल ➜ पीछे = होम
        else super.onBackPressed();
    }

    @Override protected void onPause() { CookieManager.getInstance().flush(); super.onPause(); }

    @Override protected void onDestroy() {
        if (web != null) { ((ViewGroup) web.getParent()).removeView(web); web.destroy(); }
        super.onDestroy();
    }
}
