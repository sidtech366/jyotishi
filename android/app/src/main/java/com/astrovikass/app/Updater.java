package com.astrovikass.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;

/** ऐप के अंदर से अपडेट: GitHub पर नया वर्ज़न ➜ पॉपअप ➜ ऐप में डाउनलोड ➜ इंस्टॉल स्क्रीन (पुराने के ऊपर, डेटा सुरक्षित) */
public class Updater {
    static final String API = "https://api.github.com/repos/sidtech366/jyotishi/releases/latest";
    static final String APK = "https://github.com/sidtech366/jyotishi/releases/latest/download/AstroVikass.apk";
    static final String FILE = "AstroVikass-update.apk";

    final Activity a;
    boolean busy, waitPerm;
    int newVer;

    Updater(Activity a) { this.a = a; }

    int myVer() {
        try { return a.getPackageManager().getPackageInfo(a.getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
    }

    String myName() {
        try { return a.getPackageManager().getPackageInfo(a.getPackageName(), 0).versionName; } catch (Exception e) { return "?"; }
    }

    void ui(Runnable r) { if (!a.isFinishing()) a.runOnUiThread(r); }

    void toast(final String t) { ui(new Runnable() { @Override public void run() { Toast.makeText(a, t, Toast.LENGTH_LONG).show(); } }); }

    /** manual = उपयोगकर्ता ने ख़ुद "अपडेट देखें" दबाया; वरना ऐप खुलने/लौटने पर (10 मिनट में एक बार) */
    void check(final boolean manual) {
        if (busy) return;
        final SharedPreferences sp = a.getSharedPreferences("upd", 0);
        if (!manual && System.currentTimeMillis() - sp.getLong("at", 0) < 10 * 60000L) return;   // हर बार खुलने पर (10 मिनट में एक बार)
        sp.edit().putLong("at", System.currentTimeMillis()).apply();
        if (manual) toast("नया अपडेट देखा जा रहा है…");
        new Thread(new Runnable() { @Override public void run() {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(API).openConnection();
                c.setConnectTimeout(15000); c.setReadTimeout(15000);
                c.setRequestProperty("Accept", "application/vnd.github+json");
                InputStream in = c.getInputStream(); ByteArrayOutputStream bo = new ByteArrayOutputStream();
                byte[] buf = new byte[8192]; int n; while ((n = in.read(buf)) > 0) bo.write(buf, 0, n); in.close();
                JSONObject j = new JSONObject(bo.toString("UTF-8"));
                String tag = j.optString("tag_name", "");               // app-v1.12
                int v = 0; try { v = Integer.parseInt(tag.substring(tag.lastIndexOf('.') + 1)); } catch (Exception e) { }
                final int nv = v, mine = myVer();
                if (nv <= mine) { if (manual) toast("✅ आपका ऐप नया है (वर्ज़न " + myName() + ")"); return; }
                if (!manual && sp.getInt("skip", 0) == nv && System.currentTimeMillis() - sp.getLong("skipAt", 0) < 24 * 3600000L) return;
                newVer = nv;
                ui(new Runnable() { @Override public void run() { ask(nv, sp); } });
            } catch (Exception e) {
                if (manual) toast("अपडेट नहीं देख सके — इंटरनेट जाँचें");
            }
        } }).start();
    }

    void ask(final int nv, final SharedPreferences sp) {
        new AlertDialog.Builder(a)
            .setTitle("🎉 नया अपडेट उपलब्ध")
            .setMessage("Astro Vikass का नया वर्ज़न 1." + nv + " आ गया है (आपके पास " + myName() + ")।\n\nअभी अपडेट करें — आपका लॉगिन और डेटा सुरक्षित रहेगा, पुराना ऐप हटाने की ज़रूरत नहीं।")
            .setPositiveButton("⬇️ अभी अपडेट करें", (d, w) -> start())
            .setNegativeButton("बाद में", (d, w) -> sp.edit().putInt("skip", nv).putLong("skipAt", System.currentTimeMillis()).apply())
            .show();
    }

    /** Android 8+ में "इस ऐप से इंस्टॉल" की अनुमति एक बार चाहिए */
    void start() {
        if (Build.VERSION.SDK_INT >= 26 && !a.getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(a)
                .setTitle("एक बार अनुमति दें")
                .setMessage("अपडेट इंस्टॉल करने के लिए अगली स्क्रीन पर \"Allow from this source / इस स्रोत से अनुमति दें\" चालू करें, फिर वापस आएँ — अपडेट अपने-आप आगे बढ़ेगा।")
                .setPositiveButton("ठीक है", (d, w) -> {
                    waitPerm = true;
                    try { a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.getPackageName()))); }
                    catch (Exception e) { waitPerm = false; download(); }
                })
                .setNegativeButton("रद्द", null).show();
            return;
        }
        download();
    }

    /** अनुमति देकर लौटे ➜ डाउनलोड शुरू */
    void onResume() {
        if (!waitPerm) { check(false); return; }   // ऐप पर लौटते ही भी नया वर्ज़न देखें
        waitPerm = false;
        if (Build.VERSION.SDK_INT < 26 || a.getPackageManager().canRequestPackageInstalls()) download();
        else toast("अनुमति नहीं मिली — अपडेट के लिए अनुमति चालू करें");
    }

    void download() {
        if (busy) return;
        busy = true;
        final TextView tv = new TextView(a);
        tv.setPadding(60, 40, 60, 20); tv.setTextSize(16); tv.setText("नया ऐप डाउनलोड हो रहा है… 0%");
        final AlertDialog dlg = new AlertDialog.Builder(a).setTitle("⬇️ अपडेट").setView(tv).setCancelable(false).show();
        new Thread(new Runnable() { @Override public void run() {
            File f = new File(ShareProvider.dir(a), FILE);
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(APK).openConnection();
                c.setInstanceFollowRedirects(true); c.setConnectTimeout(20000); c.setReadTimeout(30000);
                int total = c.getContentLength(); InputStream in = c.getInputStream(); OutputStream os = new FileOutputStream(f);
                byte[] buf = new byte[16384]; int n, got = 0, last = -1;
                while ((n = in.read(buf)) > 0) {
                    os.write(buf, 0, n); got += n;
                    final int pc = total > 0 ? (int) (got * 100L / total) : -1;
                    if (pc != last) { last = pc; final int kb = got / 1024; ui(new Runnable() { @Override public void run() { tv.setText("नया ऐप डाउनलोड हो रहा है… " + (pc >= 0 ? pc + "%" : kb + " KB")); } }); }
                }
                os.close(); in.close();
                final boolean same = sameKey(f.getAbsolutePath());
                ui(new Runnable() { @Override public void run() {
                    try { dlg.dismiss(); } catch (Exception e) { }
                    busy = false;
                    if (!same) {
                        new AlertDialog.Builder(a).setTitle("⚠️ एक बार पुराना ऐप हटाना होगा")
                            .setMessage("यह नया ऐप नई सुरक्षा-चाबी से बना है, इसलिए पुराने के ऊपर नहीं लगेगा।\n\nकेवल इस एक बार: पुराना ऐप हटाकर नया इंस्टॉल करें — इसके बाद हर अपडेट यहीं से सीधे होगा।")
                            .setPositiveButton("नया ऐप इंस्टॉल करें", (d, w) -> install()).setNegativeButton("बाद में", null).show();
                        return;
                    }
                    install();
                } });
            } catch (final Exception e) {
                ui(new Runnable() { @Override public void run() { try { dlg.dismiss(); } catch (Exception x) { } busy = false; toast("डाउनलोड नहीं हो सका — इंटरनेट जाँचकर दोबारा कोशिश करें"); } });
            }
        } }).start();
    }

    /** डाउनलोड हुए ऐप की चाबी = इंस्टॉल ऐप की चाबी? (न हो तो Android "App not installed" दिखाता है) */
    @SuppressWarnings("deprecation")
    boolean sameKey(String path) {
        try {
            PackageManager pm = a.getPackageManager();
            PackageInfo nu = pm.getPackageArchiveInfo(path, PackageManager.GET_SIGNATURES);
            PackageInfo me = pm.getPackageInfo(a.getPackageName(), PackageManager.GET_SIGNATURES);
            if (nu == null || nu.signatures == null || me.signatures == null) return true;
            return Arrays.equals(nu.signatures, me.signatures);
        } catch (Exception e) { return true; }
    }

    void install() {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(ShareProvider.uriOf(FILE), "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            a.startActivity(i);
        } catch (Exception e) { toast("इंस्टॉल स्क्रीन नहीं खुल सकी"); }
    }
}
