# Zynth for Android

Updated: 3 November 2026 (Africa/Lagos).

## What this adds

An Android application (`app.zynth.skillforge`, Android 8.0 and later) opens the existing secure Zynth website in a native WebView. Existing accounts, onboarding, saved progress and quest drafts continue to use the hosted application. Internet access is required. This is a native Android shell with a native alarm/overlay service; it is not an offline copy of the Next.js backend.

After signing in with a completed profile, a first-use explanation asks for **Display over other apps** permission. The user explicitly chooses whether to open Android's permission screen or use notifications instead. Settings repeats this request prominently whenever overlay access is unavailable. Declining access leaves ordinary account and quest use available.

In **Settings → Make time for your next step**, choose a daily time and enable focus. The time follows the device's time zone and belongs to this installation and account. Saving rejects invalid times and asks for either notifications or both overlay and precise-alarm access before enabling an alarm.

## Overlay behavior

- With overlay and precise-alarm access, an exact, user-requested alarm starts the native foreground service and displays the real quest page above ordinary apps.
- A visible countdown uses the monotonic device clock. Repeated triggers cannot restart it. The overlay closes after approximately three minutes, or after a matching account/quest submission has successfully committed through the existing progression flow.
- The usual close button is unavailable during focus. **Emergency exit always works**, and Android's Home, permission controls, force-stop and uninstall remain available. No device-admin, accessibility interception, kiosk lock or lock-screen bypass is used.
- If the device is locked, permission has been revoked, or the system blocks the overlay, notification reminders are used instead when allowed.
- Reply text is cached as it changes. Closing requests a final account draft sync; the local copy remains available if the network request cannot finish. Audio playback is not retained.

The OS can stop the service earlier. An ordinary Android application cannot guarantee an irremovable overlay. The service is deliberately non-sticky and does not relaunch itself after the user or system stops it.

## Repeat notifications when overlays are unavailable

If overlay access is denied, precise-alarm access is missing, or focus cannot open, the daily alarm starts a **30-minute reminder window**. The user chooses a requested interval of **5, 10 or 15 minutes**, defaulting to 5. These are notifications that open the quest page; they do not start repeated overlay services.

Submitting a quest, selecting **Pause today**, disabling/changing the alarm, or signing out cancels the current repeats. Future daily alarms remain scheduled unless focus is disabled. Each notification expires at the end of its reminder window. Boot clears the old reminder series and rearms the next daily alarm. Time, time-zone and app-update broadcasts also rearm the daily alarm.

Android may batch or delay inexact reminders, particularly in Doze or with manufacturer battery restrictions. Exact daily delivery needs **Alarms & reminders** permission. Notification delivery requires notifications to be allowed both for the app and its **Daily quest time** channel. If all relevant permissions are denied, Zynth cannot display either an overlay or notifications. Reopen the app after force-stopping it to resume alarms.

## Account and bridge boundaries

The WebView uses only `https://zynth-skillforge.vercel.app` for native messages. AndroidX WebKit limits the bridge to that origin and the main frame. External HTTPS navigation opens outside the app; insecure schemes, mixed content, file access and invalid TLS certificates are blocked. No service credential or privileged database key is included in the APK.

Account changes disable the saved alarm and stop any overlay/repeat series. A returning session for the same account preserves its alarm. A successful result notification cannot change XP, grade, rewards or quest state; it only closes a matching overlay and cancels reminders. The server continues to own progression. The durable pending-result flow can also close focus after recovering an already committed submission.

Use a current Android System WebView. Where browser speech recognition is unavailable inside WebView, the existing editable reply and keyboard dictation remain usable. Native audio capture/transcription is not included in this build.

## Build and installation

The generated APK is a **debug-signed installation build**, not a Play Store release. Copy it to an Android device and open it to install, allowing installation from that source if Android asks. Sign in, grant the permissions you choose, save a daily time, then use **Try focus now** to check the overlay.

The repository includes the Gradle wrapper. Requirements: JDK 17, Android SDK platform `android-36-ext19` and build-tools `36.1.0`. The application targets API 36, uses Android Gradle Plugin 9.0.1, Gradle 9.3.0 and AndroidX WebKit 1.14.0.

```powershell
$env:JAVA_HOME='C:/path/to/jdk-17'
$env:ANDROID_HOME='C:/path/to/Android/Sdk'
cd android
./gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`. No signing keys or generated build directories are committed. A separately managed release signing key, release package, physical-device acceptance and store declarations are required before store distribution.

## Verification boundary

Build checkpoint, 3 November 2026:

- `assembleDebug` and all **6 JVM policy tests** passed. APK Signature Scheme v2 verification passed; minimum API 26 and target API 36 were read back from the package.
- Android lint: **0 errors, 2 version-update advisories** for deliberately pinned build/library versions. The backup/transfer warning was resolved with explicit extraction rules.
- Web lint, TypeScript, Android bridge tests, and the existing engine/account/database/voice suites passed. The browser integration check passed against a simulated native port; the phone layout was visually reviewed at 390 pixels wide.
- Artifact: `mobile-builds/Zynth-0.1.0-android-debug.apk` in the parent workspace. SHA-256: `baea247ea800ed3401d3e4315c965850cb010d3bf921b38dc629be479b780271`.
- The machine's extracted Android resource compiler differed from the original archive, so the final build used a fresh copy extracted from Google's checksum-verified archive. Its SHA-256 was unchanged before and after compilation. The original altered cache and other disposable transforms were cleared. Future builds should use intact Android tools.
- Initial browser attempts ran out of local resources. After clearing generated caches and precompiling routes, the complete browser check passed. No hosted database writes were made by these checks.

`FocusPolicyTest` checks daily scheduling, daylight-saving transitions, the three-minute duration, account/quest matching, invalid times and bounded reminder intervals. `native-focus.test.ts` checks the actual web bridge's request isolation, malformed responses, denial errors and closed-port recovery. `scripts/verify-android-focus.cjs` exercises the actual web UI against disposable local accounts and a simulated native port, including overlay denial, notification fallback, permission refresh, saved-alarm restoration, phone width and sign-out cancellation.

These checks do not establish real Android alarm delivery, OEM battery behavior, keyboard placement in a system overlay, or permission-screen behavior. Those require a device/emulator walkthrough. No production schema migration is needed for these device-local settings.

Before release, verify on a physical phone: grant and deny each permission; deny overlays and receive repeat notifications; select Pause today; submit a quest; type an unfinished reply and let focus expire; change the device time zone; reboot; sign out/change accounts; and revoke access while focus is active. Confirm the emergency exit remains reachable in portrait, landscape and with the keyboard open.

Reference: [Android alarm scheduling](https://developer.android.com/develop/background-work/services/alarms), [foreground service background-start restrictions](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start), and [origin-scoped WebView messaging](https://developer.android.com/reference/androidx/webkit/WebViewCompat).
