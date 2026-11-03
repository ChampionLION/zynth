package app.zynth.skillforge;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.os.SystemClock;
import org.json.JSONObject;
import java.time.ZonedDateTime;

final class QuestScheduler {
    static final String PREFS = "zynth_focus", CHANNEL = "quest_reminders";
    static android.content.SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    static boolean notifications(Context c) {
        NotificationManager manager = c.getSystemService(NotificationManager.class);
        NotificationChannel channel = manager.getNotificationChannel(CHANNEL);
        return manager.areNotificationsEnabled() && (channel == null || channel.getImportance() != NotificationManager.IMPORTANCE_NONE)
            && (Build.VERSION.SDK_INT < 33 || c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
    }
    static boolean exact(Context c) { return Build.VERSION.SDK_INT < 31 || c.getSystemService(AlarmManager.class).canScheduleExactAlarms(); }
    static PendingIntent alarm(Context c) {
        return alarm(c, false);
    }
    static PendingIntent alarm(Context c, boolean exact) {
        return PendingIntent.getBroadcast(c, 10, new Intent(c, QuestAlarmReceiver.class).putExtra("exact", exact), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    static void schedule(Context c) {
        AlarmManager manager = c.getSystemService(AlarmManager.class); manager.cancel(alarm(c));
        var p = prefs(c); if (!p.getBoolean("enabled", false) || !FocusPolicy.isOwner(p.getString("owner", ""))) return;
        long next = FocusPolicy.next(p.getString("time", "18:00"), ZonedDateTime.now()).toInstant().toEpochMilli();
        try {
            if (exact(c)) manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, alarm(c, true));
            else manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, alarm(c));
        } catch (SecurityException e) { manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, alarm(c)); }
    }
    static void bindOwner(Context c, String owner) {
        String old = prefs(c).getString("owner", "");
        if (!old.equals(owner)) {
            prefs(c).edit().putString("owner", owner).putBoolean("enabled", false).apply();
            cancelReminders(c); c.stopService(new Intent(c, QuestOverlayService.class)); schedule(c);
        }
    }
    static JSONObject state(Context c, boolean overlay) throws org.json.JSONException {
        var p = prefs(c); boolean enabled = p.getBoolean("enabled", false);
        return new JSONObject().put("platform", "android").put("enabled", enabled).put("time", p.getString("time", "18:00"))
            .put("overlayAllowed", Settings.canDrawOverlays(c)).put("exactAllowed", exact(c)).put("notificationsAllowed", notifications(c))
            .put("reminderMinutes", p.getInt("reminderMinutes", 5))
            .put("overlay", overlay).put("nextAt", enabled ? FocusPolicy.next(p.getString("time", "18:00"), ZonedDateTime.now()).toInstant().toString() : JSONObject.NULL);
    }
    static void channel(Context c) {
        c.getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel(CHANNEL, "Daily quest time", NotificationManager.IMPORTANCE_HIGH));
    }
    static Notification notification(Context c, String title, String body) {
        channel(c);
        PendingIntent open = PendingIntent.getActivity(c, 1, new Intent(c, MainActivity.class).putExtra("path", "/quest"), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(c, CHANNEL).setSmallIcon(app.zynth.skillforge.R.drawable.zynth_notification).setContentTitle(title).setContentText(body).setContentIntent(open).setAutoCancel(true).build();
    }
    static void remind(Context c, String message) {
        if (notifications(c)) {
            PendingIntent pause = PendingIntent.getBroadcast(c, 30, new Intent(c, QuestAlarmReceiver.class).setAction("app.zynth.PAUSE_REMINDERS"), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification notice = Notification.Builder.recoverBuilder(c, notification(c, "Your next step is waiting", message))
                .setTimeoutAfter(Math.max(1, prefs(c).getLong("reminderUntil", SystemClock.elapsedRealtime() + 30 * 60_000L) - SystemClock.elapsedRealtime()))
                .addAction(new Notification.Action.Builder(null, "Pause today", pause).build()).build();
            c.getSystemService(NotificationManager.class).notify(11, notice);
        }
    }
    static PendingIntent repeat(Context c) { return PendingIntent.getBroadcast(c, 20, new Intent(c, QuestAlarmReceiver.class).setAction("app.zynth.REPEAT_REMINDER"), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE); }
    static void cancelReminders(Context c) {
        c.getSystemService(AlarmManager.class).cancel(repeat(c)); prefs(c).edit().putLong("reminderUntil", 0).apply();
        c.getSystemService(NotificationManager.class).cancel(11);
    }
    static void beginReminders(Context c) {
        cancelReminders(c);
        if (!notifications(c)) return;
        prefs(c).edit().putLong("reminderUntil", SystemClock.elapsedRealtime() + 30 * 60_000L).apply();
        nextReminder(c);
    }
    static void nextReminder(Context c) {
        var p = prefs(c); long now = SystemClock.elapsedRealtime(), until = p.getLong("reminderUntil", 0);
        if (!p.getBoolean("enabled", false) || !FocusPolicy.isOwner(p.getString("owner", "")) || !notifications(c) || now >= until) { cancelReminders(c); return; }
        remind(c, "A small step toward who you want to become. Open your quest, or pause today's reminders.");
        long next = FocusPolicy.repeatAt(now, until, p.getInt("reminderMinutes", 5));
        if (next >= 0) c.getSystemService(AlarmManager.class).setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, next, repeat(c));
    }
    static void completed(Context c, String owner, String quest) {
        if (FocusPolicy.isOwner(quest) && FocusPolicy.isOwner(owner) && owner.equals(prefs(c).getString("owner", ""))) cancelReminders(c);
    }
}
