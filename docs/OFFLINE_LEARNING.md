# One daily lesson flow, with transparent caching

Updated: 5 November 2026. This owner correction supersedes the separate study-library design.

Daily quests **are** the lessons: one/two short teaching sections, worked examples and a small reinforcement check. Missions hold the substantial assessments. There is no additional foundation-study track, alternate dashboard or offline-mode banner. `/offline` exists only to redirect older bookmarks to Overview.

The same Overview, quest, feedback, profile, settings and map pages load online or from their saved public application shells. The service worker preserves the requested route; it never redirects a connection failure into a different experience. Private account snapshots and drafts remain account scoped, outside the public page cache. Saved leaderboard snapshots use the existing ranking UI and timestamp. Editable profile changes, energy choices and presentation receipts queue for reconnection; existing appearance synchronization remains intact.

## Daily lesson buffer

The authenticated `/api/journey/lessons` service prepares three upcoming **daily quest definitions**, with real quest IDs, curriculum positions and scheduled dates. It also prepares the supplied mission scenario for the current mission cycle. Definitions are durably recorded through existing server-only journey action transactions. A stable lesson-content receipt preserves the first issued definition across overlapping packs/devices.

The normal generation path activates the same prepared definition when available. A cached daily lesson opens through `/quest` when due; future dates stay locked. Mission activation additionally verifies current learning readiness and the cycle/attempt identifier. Reconnection submits saved answers against those same stored definitions through trusted completion. Client-supplied grades, XP, timestamps and replacement content are never accepted as authoritative progress.

Local formative checks use the saved answer key and existing progression pipeline, with deterministic local enrichment and the usual feedback screen. These local projections are reconciled to server results; they cannot write authoritative progression directly. Mission prose answers are saved for server grading rather than receiving an invented local assessment. A connection restoration, app/page return and foreground minute timer retry saved work and refill the buffer. Closed-process background synchronization is not claimed.

## Existing daily quests

Older non-mission active quests can be converted into the lesson format by the authenticated service. It keeps the quest ID and existing draft; the previous quest definition and draft are retained in the owner-scoped action receipt. Missions remain unchanged. This updates the actual daily quest instead of placing a second lesson panel above an old assessment.

No new schema migration, service credential in the client or additional user permission is needed. Existing action transactions, ownership checks, revision protection and result replay remain in force. Original v1 study metadata/cache records remain historical and are no longer generated or presented. Remember me remains configurable in the existing account UI.

## Focused verification and remaining work

`npm run test:offline` verifies shared quest identity, account isolation, cached cold restore and renewed hydration after reconnection. `scripts/verify-unified-lessons.cjs` checks the normal Overview → quest → feedback flow, cold reload without a connection, a saved reply submitted once on reconnection, and the three-definition buffer against disposable accounts. TypeScript, lint and local production compilation passed. Broader cross-device races, long disconnects, reward/streak reconciliation across multiple dates, storage eviction and physical Android acceptance remain for the owner's dedicated testing day.

The Android package loads this same application; its normal startup route is cached too. One initial connected sign-in and application download is necessary on a new installation. Cached pages cannot manufacture unreceived account data or remote service results.
