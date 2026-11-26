package com.astrovikass.app;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/** वेबसाइट से बनी फ़ाइलें (लग्न पत्रिका, सामग्री सूची की इमेज/PDF) WhatsApp आदि को पढ़ने देता है।
    फ़ाइलें ऐप के cache/files फ़ोल्डर में ही रहती हैं — केवल नाम से, फ़ोल्डर के बाहर कुछ नहीं। */
public class ShareProvider extends ContentProvider {
    static final String AUTH = "com.astrovikass.app.files";

    static File dir(android.content.Context c) { File d = new File(c.getCacheDir(), "files"); d.mkdirs(); return d; }

    static String clean(String n) {
        String s = n == null ? "file" : n.replaceAll("[\\\\/:*?\"<>|\\n\\r]+", "-").trim();
        if (s.isEmpty() || s.startsWith(".")) s = "file" + s;
        return s.length() > 100 ? s.substring(s.length() - 100) : s;
    }

    static Uri uriOf(String name) { return Uri.parse("content://" + AUTH + "/" + Uri.encode(name)); }

    File fileOf(Uri uri) throws FileNotFoundException {
        String n = uri.getLastPathSegment();
        if (n == null) throw new FileNotFoundException();
        File f = new File(dir(getContext()), clean(n));
        if (!f.exists()) throw new FileNotFoundException();
        return f;
    }

    static String mimeOf(String n) {
        String l = n.toLowerCase();
        if (l.endsWith(".pdf")) return "application/pdf";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        if (l.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    @Override public boolean onCreate() { return true; }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        return ParcelFileDescriptor.open(fileOf(uri), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override public Cursor query(Uri uri, String[] proj, String sel, String[] args, String sort) {
        MatrixCursor c = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        try { File f = fileOf(uri); c.addRow(new Object[]{f.getName(), f.length()}); } catch (FileNotFoundException e) { }
        return c;
    }

    @Override public String getType(Uri uri) { String n = uri.getLastPathSegment(); return mimeOf(n == null ? "" : n); }
    @Override public Uri insert(Uri uri, ContentValues v) { return null; }
    @Override public int delete(Uri uri, String s, String[] a) { return 0; }
    @Override public int update(Uri uri, ContentValues v, String s, String[] a) { return 0; }
}
