package app.zynth.skillforge;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.webkit.WebView;
import android.widget.*;
import java.util.Locale;

public final class QuestOverlayService extends Service {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WindowManager windows; private LinearLayout root; private WebHost host;
    private TextView countdown; private Button close;
    private long started; private String owner = "", quest = ""; private boolean ending;
    private final Runnable tick = new Runnable() { @Override public void run() {
        long left = FocusPolicy.remaining(started, SystemClock.elapsedRealtime());
        countdown.setText(String.format(Locale.getDefault(), "QUEST FOCUS  ·  %d:%02d", (left + 999) / 60000, ((left + 999) / 1000) % 60));
        if (left == 0) finishFocus(); else handler.postDelayed(this, 250);
    }};
    @Override public IBinder onBind(Intent intent) { return null; }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(12, QuestScheduler.notification(this, "Zynth quest focus", "Three minutes for your next step. Emergency exit is available in the focus window."));
        if (root != null) return START_NOT_STICKY; // Repeated triggers never restart the clock.
        owner = QuestScheduler.prefs(this).getString("owner", "");
        boolean preview = intent != null && intent.getBooleanExtra("preview", false);
        if (!FocusPolicy.isOwner(owner) || !Settings.canDrawOverlays(this) || (!preview && !QuestScheduler.prefs(this).getBoolean("enabled", false)) || getSystemService(KeyguardManager.class).isKeyguardLocked()) {
            QuestScheduler.beginReminders(this); stopSelf(); return START_NOT_STICKY;
        }
        windows = getSystemService(WindowManager.class); root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(247,245,239));
        int pad = (int)(12 * getResources().getDisplayMetrics().density); root.setPadding(pad, pad, pad, pad);
        LinearLayout bar = new LinearLayout(this); bar.setGravity(Gravity.CENTER_VERTICAL);
        countdown = new TextView(this); countdown.setTextColor(Color.rgb(50,55,46)); countdown.setTextSize(13); bar.addView(countdown, new LinearLayout.LayoutParams(0, -2, 1));
        close = new Button(this); close.setText("Close"); close.setEnabled(false); close.setOnClickListener(v -> { if (FocusPolicy.remaining(started,SystemClock.elapsedRealtime()) == 0) finishFocus(); }); bar.addView(close); root.addView(bar);
        TextView exit = new TextView(this); exit.setText("Emergency exit"); exit.setTextSize(13); exit.setPadding(pad,pad,pad,pad); exit.setTextColor(Color.rgb(145,76,20)); exit.setContentDescription("Emergency exit focus immediately");
        exit.setOnClickListener(v -> finishFocus()); // Always reachable; no device-admin/accessibility lockout.
        root.addView(exit);
        WebView web = new WebView(this); root.addView(web, new LinearLayout.LayoutParams(-1,0,1));
        host = new WebHost(this,web,true);
        WindowManager.LayoutParams layout = new WindowManager.LayoutParams(-1,-1,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,android.graphics.PixelFormat.OPAQUE);
        layout.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        try { windows.addView(root,layout); } catch (RuntimeException e) { QuestScheduler.beginReminders(this); stopSelf(); return START_NOT_STICKY; }
        started = SystemClock.elapsedRealtime(); handler.post(tick); host.load("/quest?nativeFocus=1"); return START_NOT_STICKY;
    }
    void bindQuest(String account, String id) {
        if (!owner.equals(account)) { finishFocus(); return; }
        if (quest.isEmpty() && FocusPolicy.isOwner(id)) quest = id;
    }
    void completed(String account, String id) { if (FocusPolicy.completed(owner,quest,account,id)) finishFocus(); }
    private void finishFocus() {
        if (ending) return; ending = true; handler.removeCallbacks(tick);
        // Text drafts flush locally before the native WebView disappears.
        if (host != null) host.view.evaluateJavascript("window.dispatchEvent(new Event('zynth-focus-ending'))", value -> handler.postDelayed(this::stopSelf,400));
        handler.postDelayed(this::stopSelf,800);
    }
    @Override public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (root != null && windows != null) try { windows.removeView(root); } catch (IllegalArgumentException ignored) {}
        if (host != null) host.destroy(); root=null; stopForeground(STOP_FOREGROUND_REMOVE); super.onDestroy();
    }
}
