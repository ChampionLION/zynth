# Remembered sign-in and offline learning

Updated: 5 November 2026 (Africa/Lagos).

## Delivered behavior

The web application and Android WebView share the same remembered sign-in, offline library and synchronization flow. Sign in online once on each installation. **Remember me** is enabled by default and can be changed on the sign-in form or in Settings. It stores the Supabase session in local storage, using the normal refresh-token mechanism. Turning it off moves the session and PKCE verifier to session storage; closing that tab/session requires signing in again. Passwords are never saved by this feature. Clearing browser/app storage, signing out, or server-side session revocation can still require authentication.

The dedicated `/offline` library saves the current issued quest, its local draft, a profile snapshot and **three upcoming foundation lessons**. Each lesson contains teaching, worked examples and a small check. It is available through Settings and the offline status banner. A service worker prepares the public offline page and its scripts, styles and brand assets. A failed full navigation redirects to that cached page. Android also tries this same-origin offline page before showing the first-launch connection fallback.

The lesson buffer has three upcoming lessons after a successful online sync. Completing lessons offline consumes the saved buffer; reconnecting syncs the study journal and replaces the buffer with the next three. It cannot download new material without a connection. The current finite foundation bank repeats after its seven units per domain; this is not an infinite or complete profession curriculum.

## What synchronizes

- Study replies and ordered completion cursors synchronize to the account's existing Supabase Auth metadata. Each installation writes a separate top-level journal key; cursors merge monotonically across devices. Recent answer history is bounded to three entries per journal, with a 1,000-character limit for each additional-study answer; lifetime completion cursors remain. These editable study records never grant permissions, EXP, mission credits or ranking scores.
- Current-quest drafts remain account/quest scoped. Local drafts restore after offline reload and upload when connected.
- A submitted issued quest is queued locally and sent through the existing trusted completion endpoint after reconnecting. Its saved quest ID preserves server replay protection. Rewards appear only after a confirmed server result. A rejection retains the answer for review; it does not block syncing/refilling the additional lesson pack.
- The app retries on connection restoration, return to the page/app, study completion and a one-minute foreground interval. Session expiry requires online sign-in before cloud synchronization can finish. There is no claim of background sync while the browser or Android process is closed.

The three buffered lessons are additional foundation study, separate from the daily quest schedule. This keeps offline learning available without inventing future server-issued quests, bypassing the daily policy or awarding unverified XP. Missions and already issued quests keep their original server definitions. Rankings, account changes, new daily generation and server grading require a connection. Voice transcription can also depend on the browser's online speech service; typing remains available offline.

## Isolation and persistence

Offline packs, drafts and queued answers use account-scoped local-storage keys. The cached session's identity selects only its own pack; it never authorizes a server request. Sign-out locks access to the saved pack and clears in-memory account state while retaining unsynced local work for the same account's next sign-in. Reset progress explicitly clears that account's pack and submission queue. Browser storage eviction or manual data clearing removes local-only work.

Cache Storage holds only the public offline HTML, versioned application assets and brand images. It excludes tokens, Auth responses, private APIs, RSC requests and APK downloads. Study metadata updates use a captured, verified bearer token so an account change cannot redirect a previous account's in-flight write to the new account. No service-role key, database migration or new permission is required.

## Verification

`npm run test:offline` verifies persistent versus session-only storage, PKCE migration, account isolation, all five domain packs, ordered offline consumption, reload persistence, exactly-three refill, stale queue acknowledgements and real SDK authentication against an isolated fixture.

`scripts/verify-offline.cjs` runs against a local production build and disposable accounts: service-worker installation, offline cold reload, saved current-quest answer, three lessons completed without network writes, reconnection, one trusted completion request, synced study history, replenishment to sequences 3/4/5, remembered browser restart, phone width, public-cache exclusions and APK response headers/hash. No hosted account or progression records are written by this check. Physical Android WebView/storage/permission acceptance remains separate.

The Android package and checksum are linked from `/download`, the landing page and Settings. Distribution is an early-access, debug-signed APK; Play Store release signing and store acceptance are not complete.
