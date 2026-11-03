package app.zynth.skillforge;

import android.content.*;
import android.provider.Settings;

public final class QuestAlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if ("app.zynth.PAUSE_REMINDERS".equals(intent.getAction())) { QuestScheduler.cancelReminders(context); return; }
        if ("app.zynth.REPEAT_REMINDER".equals(intent.getAction())) { QuestScheduler.nextReminder(context); return; }
        var p = QuestScheduler.prefs(context);
        if (!p.getBoolean("enabled", false) || !FocusPolicy.isOwner(p.getString("owner", ""))) return;
        QuestScheduler.schedule(context);
        // Only an exact user-requested alarm is used for an automatic background service.
        if (intent.getBooleanExtra("exact", false) && QuestScheduler.exact(context) && Settings.canDrawOverlays(context)) {
            try { context.startForegroundService(new Intent(context, QuestOverlayService.class)); return; }
            catch (RuntimeException ignored) { /* OEM/system restrictions retain a notification fallback. */ }
        }
        QuestScheduler.beginReminders(context);
    }
}
