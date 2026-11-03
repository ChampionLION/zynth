package app.zynth.skillforge;

import android.app.*;
import android.content.Intent;
import android.os.Bundle;
import android.view.*;
import android.webkit.WebView;
import android.widget.FrameLayout;

public final class MainActivity extends Activity {
    private WebHost host;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved); QuestScheduler.channel(this);
        FrameLayout root = new FrameLayout(this); WebView web = new WebView(this); root.addView(web); setContentView(root);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                var bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        host = new WebHost(this, web, false); host.load(getIntent().getStringExtra("path") == null ? "/" : getIntent().getStringExtra("path"));
    }
    @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); host.load(intent.getStringExtra("path") == null ? "/dashboard" : intent.getStringExtra("path")); }
    @Override protected void onResume() { super.onResume(); QuestScheduler.schedule(this); if (host != null) host.view.evaluateJavascript("window.dispatchEvent(new Event('zynth-native-resume'))", null); }
    @Override public void onBackPressed() { if (host != null && host.view.canGoBack()) host.view.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { if (host != null) host.destroy(); super.onDestroy(); }
}
