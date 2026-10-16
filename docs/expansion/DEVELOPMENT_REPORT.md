# Zynth Evolution and Chronicles — Development Report

Updated: **15 October 2026**, Africa/Lagos. Local branch: `feature/evolution-chronicles`. This is an implementation checkpoint, not completion of the full expansion or a production release.

Owner's latest instruction: finish now and defer further tests to the next prompt. The checks reported below completed before that instruction. The last defensive recording-timeout cleanup and documentation edits were not followed by another test/build run. Production deployment, hosted preference migration and real microphone/provider checks remain pending.

## Document format and authority

At the owner's request, the revised blueprint and this report are Markdown documents. A Word export is no longer required. The [Complete Application Blueprint v2](<../blueprints/ZYNTH Complete Application Blueprint v2.md>) covers the expansion in 28 sections and separates requirements from current implementation. The original v1 Word document, extraction and historical PDF remain preserved; v1 numerical rules apply unless v2 explicitly supersedes them.

The [master directive](MASTER_DIRECTIVE.md) records the supplied request. The existing [milestone record](../../MILESTONES.md) and [progress record](../../PROGRESS.md) remain authoritative and retain earlier history. [Engine audit](ENGINE_AUDIT.md) documents all thirteen original engines, their connections, implementation gaps and source conflicts.

## Current milestone position

- **ZEC-M0 — COMPLETED:** repository, original blueprint, installed stack, engine interfaces, schema/policies and baseline audited; v2 Markdown blueprint, conflict decisions and roadmap recorded. Completing the audit does not resolve every audited defect.
- **ZEC-M1 — IN PROGRESS:** mission policy is integrated and locally tested. Trusted completion and atomic persistence are implemented as a disabled staged foundation. Other mutation routes, privilege cutover, client integration, durable reveal recovery and separate-connection race verification remain.
- **ZEC-M2 — VERIFIED LOCALLY:** editable names, save/discard/draft recovery, light/dark/system themes and reduced motion are implemented. Account/SQL checks and real browser interactions against a disposable local backend pass. Desktop/phone screenshots were inspected. Hosted preference migration and production verification remain pending.
- **ZEC-M3–M6 — NOT STARTED:** avatar/editor, secure inventory, modular regions and permanent environmental evolution are specified. Existing landscape/map-label corrections do not implement these systems.
- **ZEC-M7 — IN PROGRESS:** the versioned, 20-section [Lore Bible](../chronicles/ZYNTH-CHRONICLES-LORE-BIBLE.md) is authored. Runtime chapters, conditions and first playable arc are not implemented.
- **ZEC-M8–M10 — NOT STARTED:** personalized branches/archive, chapter/world integration and expansion compatibility runtime remain planned.
- **ZEC-M11 — NOT STARTED:** final hardening depends on unfinished milestones. Verification and dependency-audit evidence have been accumulated; release acceptance is not met.

## Implemented application behavior

### Quests, missions and map

Engine 2 now uses seven unique qualifying completions to unlock one slightly harder, playable mission, independently of streaks. Explicit eligibility excludes failed/Bad attempts, missions, Swift Mode, retests, skips and unknown types. Excess completions bank; failed missions retain eligibility; legacy missions/history remain usable without removing earned EXP.

Stable plan identifiers and insert-if-absent persistence preserve existing quest content and drafts. Unfinished challenges survive a date change. Generated missions require linked steps or use a playable existing fallback. Ordinary retry IDs and mission skip/retry handling were corrected. Successful additional same-day missions no longer break the calendar-based Flawless Week achievement. A Bad mission no longer earns the successful-mission XP-card grant.

The Mark Map retains landscape checkpoint geometry shared with Overview. Fourteen-mark pages are labeled **segments**, distinct from future narrative chapters. Mission markers reflect actual state instead of implying every seventh day completed a mission. Returning users retain their character presentation without absence fading.

These changes reuse existing engines; no competing Mission Engine or numerical progression system was created. A separate persisted generation stage is still pending. Skip token/profile and quest-retirement writes remain a legacy multi-write flow, so cross-tab atomic skip recovery is not complete.

### Profile settings and appearance

Settings validates display and optional character names and rejects extra progression fields. Persistence patches only editable fields and merges confirmed results into the latest account state, preserving concurrent numerical progress. Save, discard, errors, unsaved-change confirmation and account-scoped draft recovery are implemented. Browser Back relies on recovered drafts rather than a universal navigation block.

Central semantic colors support light, dark and system settings, follow operating-system changes and synchronize browser tabs. Explicit reduced motion integrates with existing animations. Native confirmation dialogs provide keyboard dismissal and focus restoration. Grade/domain/rarity colors, the profile radar and dashboard surfaces use theme tokens. Account preferences have cloud adapters and isolated tests; until the hosted migration exists, the interface explicitly reports its browser-only fallback. Failed preference saves retain a pending account-scoped value across reloads and retry on reconnect or request. If browser storage is unavailable, the interface identifies the preference as temporary. Discard-and-leave removes the draft instead of restoring it later.

Overview now displays all six existing stats: Focus, Consistency, Adaptability, Execution and the two actual domain attributes. The cards use three columns on desktop and two on phones; this changes no stat values or formulas.

### Voice replies — additional owner request

Quests and each mission step now offer microphone recording with an editable transcript. Final recognized words append to existing text and use existing account draft persistence; the reviewed answer follows the same grading/progression pipeline as typing. Local audio playback, language selection, permission/network errors, transcript/recording limits, step isolation and microphone cleanup are implemented. Submission/navigation actions are disabled during capture/finalization. Audio is held only in page memory and is never uploaded by Zynth; transcript drafts persist across refreshes. The interface discloses that a browser speech provider may process voice remotely. Unsupported browsers retain the typed reply and an explanation. No new server, paid transcription service, credentials or audio-storage migration were introduced. See [voice reply guide](../VOICE_REPLIES.md).

### Trusted completion foundation

The staged `/api/journey/complete` route verifies the Supabase user, accepts only a quest ID and bounded response text, and loads the stored quest/profile. It validates mission steps, performs existing exploit/grading/pipeline calculations on the server and commits through a service-only database function. Incoming grades, EXP and profiles cannot authorize the result. Request bodies are bounded to 100,000 bytes; the response field has a stricter schema limit.

The migration adds profile revisions, immutable quest outcomes/events, expiring grading leases and atomic completion. Replay returns the existing outcome; revision conflicts retry against current state. Event-insert failure rolls back the associated profile/quest update. Live grading failure returns an error instead of silently minting practice rewards.

**This is not an activated security cutover.** The browser still uses legacy progression writes, and an owner can currently alter their numerical profile. The new route stays disabled by default. New permanent cosmetic/world rewards are not enabled. [Trusted progression guide](TRUSTED_PROGRESSION.md) gives configuration gates, limits and the required coordinated transition.

## Database and external actions

Prepared migration: [`20261015204720_evolution_foundation.sql`](../../supabase/migrations/20261015204720_evolution_foundation.sql), generated using the official Supabase CLI and executed only in isolated embedded Postgres. The older `user_preferences.proposed.sql` is superseded and must not also be applied.

Read-only hosted schema/policy discovery informed the audit. No expansion migration was applied to the hosted project; no live user data was changed. No remote push, production deployment, credential publication or paid model/service call was performed. Server secret names are referenced in code; no secret value was fetched or committed. Supabase CLI temporary files and review/export intermediates are ignored.

## Verification evidence

At this checkpoint:

- **`npm test` passes:** the existing 68 engine/regression checks and 500 onboarding combinations; SDK-backed simulated account tests; mission/appearance and voice lifecycle tests; embedded Postgres tests of the actual migration, owner policies, atomic completion and trusted service.
- **`npm run lint` passes:** no warnings or errors.
- **`npm run build` passes:** optimized compilation, application type checks and all 24 build entries complete, including the new completion route. The optional local low-disk cache setting was used; default build behavior remains unchanged.
- Local HTTP boundary checks returned 200 for the public/account/settings entry responses and 401 for unauthenticated model/completion requests. A settings loading shell is not proof of authenticated settings behavior.

Database fixtures exercise unauthorized/other-owner requests, replay, revision conflicts, rollback after an injected event failure, concurrent service calls with one grader invocation, forged grade rejection and provider-failure lease cleanup. PGlite executes actual Postgres SQL but serializes database queries; it does not establish multi-connection/distributed race safety on hosted Supabase. SDK fixtures simulate the network backend and do not prove inbox delivery.

Headless Edge browser checks now pass against a disposable loopback Auth/PostgREST fixture using the actual application UI and SDK. They verify profile saves/failures/discard, navigation confirmation/Escape, light/dark/system changes, reduced motion, offline preference reload/retry, cloud restoration without browser cache, portrait fit, shared light themes, all six Overview stat cards and synthetic microphone capture. Injected speech results produce editable transcripts and restored drafts; both a recorded mission and ordinary quest reach grading and saved history. No uncaught application errors occurred. Screenshots for settings, recorded replies and Overview were inspected at desktop/390×844 widths. These replace the earlier unavailable-browser status for this scope. They do not prove live speech-provider accuracy, real inbox delivery or hosted persistence. See `scripts/verify-m2-voice.cjs` and `docs/VOICE_REPLIES.md` for the repeatable fixture.

## Security and implementation limits

The saved dependency audit reports **16 vulnerable package entries: 1 critical, 13 high and 2 moderate**, including the existing Next.js and styling/lint toolchain. This counts dependency entries, not sixteen independently verified exploitable application paths. Coordinated dependency upgrades and regression checks are required before release; no forced major upgrades were applied.

Other unresolved audited gaps include browser-owned progression and event/reveal recovery, model rate limits, incomplete live leaderboard aggregation, Swift/XP-card action interfaces, profession evolution and future pagination of legacy history. Engines 14–18 remain specifications rather than runtime implementations. The lore document does not imply live narrative personalization, chapter completion, inventory ownership or world restoration.

## Exact continuation order

1. Complete trusted onboarding/scaffolding and a conservative legacy-import boundary; imported browser claims must not grant verified rewards.
2. Move stored quest planning/generation, skip, prestige, check-in and profession mutations to trusted actions. Add durable generation/attempt identities and leases; replace multi-write skip behavior.
3. Wire the client to trusted responses and persisted result/event recovery without re-upserting server results from the browser.
4. Prepare coordinated grants/RLS hardening so clients can edit settings/drafts/preferences but cannot mint progression, quest definitions, outcomes, rewards or events. Keep activation gated until all required mutations work.
5. Test separate database connections and existing-account upgrades, pending/failed/skipped quests, replay and prestige. Repeat the locally verified M2 flows against hosted accounts only after authorization; check live microphone/provider behavior manually in supported browsers. Broader game/release accessibility checks remain under M11.
6. Implement M3–M6 in order: a small avatar/editor, server-owned inventory, versioned region packages and persistent region evolution. Consume verified events, preserving Overview's landscape and old records.
7. Implement M7–M10: deterministic flexible chapters, truthful identity-aware branches, private paginated archive, chapter/world projections and compatibility fixtures for future content releases.
8. Resolve dependency findings and remaining engine gaps; perform full release verification and reconcile all acceptance criteria. Seek separate authorization before any hosted migration, production deployment, remote push or external cost.

No percentage-complete estimate is asserted. The full initiative remains open until its definition of done and milestone acceptance criteria are met.
