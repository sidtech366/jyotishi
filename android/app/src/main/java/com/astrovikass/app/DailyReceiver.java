package com.astrovikass.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

/** Roz subah ~6 baje "आज का राशिफल" notification. Phone par hi banta hai (internet / server nahi chahiye). */
public class DailyReceiver extends BroadcastReceiver {
    static final String CH = "rashifal";
    static final String ACT = "com.astrovikass.app.DAILY";
    static final int HOUR = 6, MIN = 0;

    static final String[] DAYS = {"रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"};
    static final String[] MONTHS = {"जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"};
    static final String[] LINES = {
            "अपनी राशि का आज का फल, शुभ रंग और उपाय देखें।",
            "आज कौन सा समय शुभ है? अपनी राशि खोलकर देखें।",
            "नौकरी, धन, प्रेम और स्वास्थ्य — आज आपके सितारे क्या कहते हैं?",
            "दिन की शुरुआत सही दिशा में — आज का राशिफल और लाल किताब उपाय।",
            "आज का पंचांग और आपकी राशि का फल तैयार है।",
            "ग्रहों की चाल आज आपके लिए क्या लाई है? अभी देखें।",
            "आज का भाग्यशाली अंक, रंग और उपाय — अपनी राशि में देखें।"
    };

    /** Aaj/kal ke 6 baje se roz-roz ka alarm lagata hai (dobara lagane par purana badal jata hai). */
    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar t = Calendar.getInstance();
        t.set(Calendar.HOUR_OF_DAY, HOUR); t.set(Calendar.MINUTE, MIN); t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
        if (t.getTimeInMillis() <= System.currentTimeMillis()) t.add(Calendar.DAY_OF_YEAR, 1);
        Intent i = new Intent(c, DailyReceiver.class).setAction(ACT);
        PendingIntent pi = PendingIntent.getBroadcast(c, 6, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.setInexactRepeating(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), AlarmManager.INTERVAL_DAY, pi);
    }

    @Override
    public void onReceive(Context c, Intent in) {
        String a = in == null ? null : in.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) { schedule(c); return; }
        if (!ACT.equals(a)) return;

        Calendar n = Calendar.getInstance();
        int d = n.get(Calendar.DAY_OF_WEEK) - 1;
        String body = DAYS[d] + ", " + n.get(Calendar.DAY_OF_MONTH) + " " + MONTHS[n.get(Calendar.MONTH)] + " — " + LINES[d % LINES.length];

        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null)
            nm.createNotificationChannel(new NotificationChannel(CH, "रोज़ का राशिफल", NotificationManager.IMPORTANCE_DEFAULT));

        Intent open = new Intent(c, MainActivity.class).setData(android.net.Uri.parse(MainActivity.RASHIFAL)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);   // टैप ➜ सीधे आज का राशिफल
        PendingIntent pi = PendingIntent.getActivity(c, 7, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CH) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("🌅 शुभ प्रभात — आज का राशिफल")
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(pi)
                .setAutoCancel(true);
        nm.notify(6, b.build());
    }
}
