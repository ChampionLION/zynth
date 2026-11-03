package app.zynth.skillforge;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.webkit.*;
import androidx.webkit.*;
import org.json.*;
import java.util.Collections;

/** The native bridge is origin-scoped and accepts messages only from the main frame. */
final class WebHost {
    final Context context; final WebView view; final boolean overlay;
    WebHost(Context context, WebView view, boolean overlay) {
        this.context = context; this.view = view; this.overlay = overlay;
        var settings = view.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(false); settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false); settings.setSupportMultipleWindows(false); settings.setMediaPlaybackRequiresUserGesture(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false); view.setBackgroundColor(Color.rgb(247,245,239));
        view.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView web, WebResourceRequest request) {
                if (trusted(request.getUrl())) return false;
                if (request.isForMainFrame() && "https".equals(request.getUrl().getScheme())) {
                    try { context.startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (ActivityNotFoundException ignored) {}
                }
                return true;
            }
            @Override public void onReceivedSslError(WebView web, android.webkit.SslErrorHandler handler, android.net.http.SslError error) { handler.cancel(); }
            @Override public void onReceivedError(WebView web, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    // No bridge is exposed to this opaque-origin offline page.
                    web.loadData("<html><meta name='viewport' content='width=device-width'><body style='background:#f7f5ef;font:18px sans-serif;padding:36px'><h1>Your journey is still yours.</h1><p>Connect to the internet, then reopen Zynth. Your saved progress stays with your account.</p><a href='" + BuildConfig.APP_ORIGIN + "/quest'>Try again</a></body></html>", "text/html", "UTF-8");
                }
            }
        });
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(view, "ZynthNative", Collections.singleton(BuildConfig.APP_ORIGIN), (web, message, origin, mainFrame, reply) -> {
                if (!mainFrame || !trusted(origin)) return;
                String id = "";
                try {
                    String raw = message.getData(); if (raw == null || raw.length() > 4096) return;
                    JSONObject input = new JSONObject(raw); id = input.getString("id");
                    JSONObject result = command(input.getString("command"), input.optJSONObject("data"));
                    reply.postMessage(new JSONObject().put("id", id).put("ok", true).put("state", result).toString());
                } catch (Exception e) {
                    try { reply.postMessage(new JSONObject().put("id", id).put("ok", false).put("error", e instanceof IllegalArgumentException ? e.getMessage() : "That device setting could not be changed. Please try again.").toString()); } catch (JSONException ignored) {}
                }
            });
        }
    }
    static boolean trusted(Uri uri) { return "https".equals(uri.getScheme()) && Uri.parse(BuildConfig.APP_ORIGIN).getHost().equals(uri.getHost()) && (uri.getPort() == -1 || uri.getPort() == 443); }
    JSONObject command(String name, JSONObject data) throws Exception {
        if (data == null) data = new JSONObject();
        switch (name) {
            case "bindOwner": {
                String owner = data.optString("owner", ""); if (!owner.isEmpty() && !FocusPolicy.isOwner(owner)) throw new IllegalArgumentException("Sign in again before setting a quest time.");
                QuestScheduler.bindOwner(context, owner);
                if (context instanceof QuestOverlayService service) service.bindQuest(owner, data.optString("questId", ""));
                break;
            }
            case "getState": break;
            case "saveSchedule": {
                String owner = data.optString("owner", ""), time = data.getString("time"); FocusPolicy.time(time);
                if (!FocusPolicy.isOwner(owner) || !owner.equals(QuestScheduler.prefs(context).getString("owner", ""))) throw new IllegalArgumentException("Sign in again before setting a quest time.");
                boolean enabled = data.getBoolean("enabled");
                if (enabled && !QuestScheduler.notifications(context) && !(Settings.canDrawOverlays(context) && QuestScheduler.exact(context))) throw new IllegalArgumentException("Allow notifications, or allow both overlays and precise alarms first.");
                int minutes = data.optInt("reminderMinutes", 5);
                if (minutes != 5 && minutes != 10 && minutes != 15) throw new IllegalArgumentException("Choose a 5, 10 or 15 minute reminder interval.");
                QuestScheduler.cancelReminders(context);
                QuestScheduler.prefs(context).edit().putString("time", time).putInt("reminderMinutes", minutes).putBoolean("enabled", enabled).apply(); QuestScheduler.schedule(context); break;
            }
            case "permission": {
                if (!(context instanceof Activity activity)) throw new IllegalArgumentException("Open Zynth normally to change device permissions.");
                String kind = data.optString("kind"); Intent intent;
                if ("overlay".equals(kind)) intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + context.getPackageName()));
                else if ("exact".equals(kind) && Build.VERSION.SDK_INT >= 31) intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + context.getPackageName()));
                else if ("notifications".equals(kind) && Build.VERSION.SDK_INT >= 33 && !QuestScheduler.notifications(context)
                    && (!QuestScheduler.prefs(context).getBoolean("askedNotifications", false) || activity.shouldShowRequestPermissionRationale(android.Manifest.permission.POST_NOTIFICATIONS))) {
                    QuestScheduler.prefs(context).edit().putBoolean("askedNotifications", true).apply(); activity.requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 7); break;
                }
                else { intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName()); }
                activity.startActivity(intent); break;
            }
            case "preview": {
                if (!(context instanceof Activity) || !Settings.canDrawOverlays(context)) throw new IllegalArgumentException("Allow display over other apps first.");
                if (!FocusPolicy.isOwner(QuestScheduler.prefs(context).getString("owner", ""))) throw new IllegalArgumentException("Sign in before trying focus.");
                context.startForegroundService(new Intent(context, QuestOverlayService.class).putExtra("preview", true)); break;
            }
            case "questCompleted": {
                QuestScheduler.completed(context, data.optString("owner"), data.optString("questId"));
                if (context instanceof QuestOverlayService service) service.completed(data.optString("owner"), data.optString("questId"));
                break;
            }
            default: throw new IllegalArgumentException("Update Zynth to use this device setting.");
        }
        return QuestScheduler.state(context, overlay);
    }
    void load(String path) { view.loadUrl(BuildConfig.APP_ORIGIN + (path.startsWith("/") && !path.startsWith("//") ? path : "/")); }
    void destroy() { view.stopLoading(); if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) WebViewCompat.removeWebMessageListener(view, "ZynthNative"); view.destroy(); }
}
