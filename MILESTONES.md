# Project milestones

Updated: 5 November 2026 (Africa/Lagos).

## Current roadmap snapshot — 39%

The full ZEC-M0–M11 roadmap has **39/100 accepted weighted points**, with 61 remaining. M1 is 22/22 points: trusted actions, client recovery, local grants/concurrency evidence and owner-approved hosted activation are complete. The owner approved all three migrations and activation after checks. This is a planning estimate tied to completed packages, not a production-readiness score. [ACTION_PLAN.md](ACTION_PLAN.md) defines the weights and explicit M1-F split. [PROGRESS.md](PROGRESS.md) contains milestone percentages. [The rollout](docs/expansion/STEP1_ROLLOUT.md) records the release boundary.

Execution order: M1 trusted mutations/recovery/cutover → M2 complete → M3 avatar → M4 inventory → M5 regions → M6 living map → M7 chapter runtime → M8 branches/archive → M9 integration → M10 content-release compatibility → M11 final hardening. Dependency audit and upgrade preparation start early. M11 already has baseline test/release evidence, so it is IN PROGRESS; final acceptance remains open.

The leaderboard participation update is pushed and production-verified at eea7ce7fa5441a682554fb10c7396e37ff38af9b, and its separately approved migrations are applied. Earlier dated setup/publication notes are historical. The owner confirms earlier migration/SMTP setup; actual hosted behavior still needs the dedicated remaining checks. Future production migrations retain their explicit authorization requirement.
## Completed milestones

### 5 November 2026 — Learning, Android identity and offline continuity

- [x] Learning-first generation: one or two actual short lessons, worked examples and one reinforcement check; mission assessments supply their problem, evidence and constraints.
- [x] Saved learning-topic history, concise corrective grading and supplied-case visibility across mission steps; legacy quests/drafts remain readable.
- [x] Supplied Zynth artwork packaged unchanged as the Android launcher icon, with a separate themed monochrome layer.
- [x] Android 0.1.2 APK compiled, signed-package verification passed, Android lint reported zero errors; corrected APK delivered before subsequent web checks.
- [x] Remember me on sign-in and Settings, persistent refreshable sessions by default and session-only sign-in when disabled.
- [x] Current quest/draft and exactly three upcoming foundation lessons saved per account; offline lesson/check completion and cold reload supported.
- [x] Reconnection syncs study history/drafts, submits the queued issued quest through trusted completion, and refills the next three lessons.
- [x] Website download page, landing/Settings links, APK attachment and checksum.
- [x] Engine/account/database/voice suites, learning and offline unit/integration checks, trusted journey checks and local production compilation passed.
- [x] Real-browser offline restart, three completed lessons, synced history, three-lesson refill, one queued-quest submission, remembered restart and APK download/hash passed against disposable accounts.
- [x] GitHub publication and Vercel deployment complete; minimal live APK/offline-page/account-configuration verification passed (release evidence below).
- [ ] Physical Android acceptance and release/store signing remain open.

These additional requested deliverables do not complete the remaining ZEC avatar/world/Chronicles acceptance packages. Weighted roadmap completion remains **38/100 (38%)**. See [learning behavior](docs/LEARNING_QUESTS.md), [offline continuity](docs/OFFLINE_LEARNING.md) and [Android evidence](docs/ANDROID_APP.md).

### 3 November 2026 — Android quest focus implementation

- [x] Native Android project and reproducible Gradle wrapper, using the approved Zynth mark.
- [x] Existing hosted sign-in, onboarding, progress and quest UI retained in a secure WebView.
- [x] First-use overlay permission explanation, explicit system permission request and Settings controls.
- [x] Device-local daily alarm, time-zone/reboot rearming and non-resetting three-minute focus timer.
- [x] Matching committed quest submission closes focus; emergency exit remains reachable.
- [x] Overlay denial/unavailability falls back to allowed notifications at configurable 5/10/15-minute intervals for up to 30 minutes, with Pause today.
- [x] Sign-out/account changes disable the saved alarm and cancel the active focus/reminder series.
- [x] Device settings introduce no database migration or progression-engine rule changes.
- [x] Installable debug APK compiled and signature verified; six native policy tests, Android lint, web checks and the simulated-device browser flow passed.
- [ ] Physical-device acceptance for alarms, permissions, system overlays, keyboard and manufacturer battery behavior.
- [ ] Release signing, store package and store-policy review for public store distribution.

See [Android build and verification notes](docs/ANDROID_APP.md). These are additional requested deliverables; the weighted ZEC roadmap remains **38/100**.

### 13 October 2026 — Local engine review and responsive workspace

Reviewed the existing local engine flow against the blueprint. Fixed reward, prestige, grading, persistence, and connection bugs, added regression coverage, and introduced a wider desktop workspace with mobile bottom navigation. The local suite passed 48 checks at that point. Production-service gaps were recorded in [engine status](ENGINE_STATUS.md).

### 14 October 2026 — Aspiration-first onboarding

Implemented exactly five onboarding steps: a custom written direction and four grounded scenarios. Added suggestions, “Still exploring,” Back navigation, optional second choices, input validation, and retry feedback. Question definitions, local signal interpretation, and live prompt content now share the same source.

Acceptance criteria completed:

- [x] The first question asks what the user wants to become.
- [x] The first answer supports custom text.
- [x] Four ordinary scenarios replace the original fantasy/personal questions.
- [x] Choices use trade-offs rather than an obvious good/bad answer.
- [x] The chosen direction reaches profile and quest context.
- [x] All 500 primary scenario combinations produce valid local profiles.
- [x] Existing profiles remain loadable without forced re-onboarding.

### 14 October 2026 — Shared world-map progression

Implemented a landscape of connected checkpoints and mission landmarks. The blueprint's progression remains visible in the dedicated map and as a faint background in Overview. Fourteen-checkpoint chapters keep long journeys manageable; earlier completed chapters stay available.

Acceptance criteria completed:

- [x] A terrain map replaces the straight vertical presentation.
- [x] Completed, current, and future checkpoints remain distinct.
- [x] Seventh checkpoints retain mission-landmark treatment.
- [x] Completed checkpoints expose quest details, grade, date, and EXP.
- [x] Current checkpoints route to the active quest or quest preparation.
- [x] The same map geometry and progress appear behind Overview.
- [x] Progress groups successful days and excludes failed attempts.
- [x] Narrow screens can explore the map horizontally.
- [x] Rendered shared SVG artwork was visually reviewed.

## Automated release checks for this update

- [x] All 68 local engine/regression checks pass.
- [x] All 500 primary scenario combinations produce schema-valid profiles.
- [x] Lint and TypeScript checks pass.
- [x] Production build passes for all 22 pages/routes.

## Verification still requiring a live browser

- [ ] Walk through all five new onboarding steps on desktop and mobile.
- [ ] Confirm Back navigation, secondary-choice changes, Enter submission, and synthesis retry in the browser.
- [ ] Check the Overview background against real text/cards at multiple widths.
- [ ] Exercise checkpoint selection, horizontal exploration, chapter navigation, and current-quest routing.

The browser tool could not initialize during this update. Automated logic/build checks and static map rendering are separate from the uncompleted browser checks above.

## Next production milestones

### Real accounts and trusted progression — Not complete

Supabase authentication and profile/draft storage are connected. Move grading rewards and profile updates into validated server transactions; verify a real inbox-driven production signup/signin flow.

### Reliable live services — Not complete

Model requests require verified authentication. Add rate limiting, verify live provider output, implement leaderboard aggregation/current-user lookup, and connect real community data.

### Complete quest economy and recovery — Not complete

Wire Swift Mode and XP-card spending actions; responses now persist; finish durable grade reveals and queued events through failures and refreshes.

### Release verification — Not complete

Complete browser checks across desktop and portrait mobile layouts, exercise the entire live onboarding-to-quest-to-progression loop, and resolve the remaining deployment blockers before publishing.

## 15 October 2026 — Landing page and account continuity

- [x] Minimal public landing page with fluid desktop and mobile layouts.
- [x] Email/password signup, signin, confirmation callback, and password reset UI.
- [x] Connected Zynth Supabase project and applied application/draft migrations.
- [x] Account-owned profile, incomplete onboarding, and unfinished quest persistence.
- [x] Return routing for new, partially onboarded, and existing accounts.
- [x] Account isolation and stale asynchronous-load protection.
- [x] Authenticated model requests; live anonymous database-access checks.
- [x] No remaining Supabase security advisor findings.
- [x] Engine and account integration checks, lint, types, and 22-route build pass.
- [x] Vercel project found and account environment configuration saved.
- [x] Verify the new production deployment, its exact application commit, public account routes, published Supabase configuration, and model access boundary at https://zynth-one.vercel.app.
- [x] Save production Supabase Site URL and redirect allowlist — confirmed by the user on 15 October.
- [ ] Configure production email delivery and verify a real confirmation/reset inbox flow.
- [ ] Complete desktop and mobile browser interaction/visual checks.

## 15 October 2026 — Replacement hosting connection

- [x] Located the replacement Vercel project and verified the user's production domain.
- [x] Restored Supabase public environment variables and the local Vercel project link.
- [x] Preserved the existing Supabase account/progress database.
- [x] Added free SMTP instructions for a user without a custom domain.
- [ ] Save the new production URL configuration and private Gmail SMTP settings in Supabase.
- [ ] Verify actual confirmation and password-reset email delivery.

## 15 October 2026 — Approved Zynth identity

- [x] Apply the refined staircase Z and serif wordmark across the public and app branding surfaces.
- [x] Add SVG/ICO/PNG favicons, Apple touch icon, and app-icon exports.
- [x] Adopt “Synthesize your zenith.” and “Build who you want to become.”
- [x] Create the matching 1200 × 630 Open Graph image without a domain.
- [x] Configure Open Graph site name/title/image and Twitter large-image sharing.
- [x] Verify landing and mobile signup branding in the browser, image loading, and horizontal fit.
- [x] Validate metadata, favicon and image endpoints, lint, and production compilation.

## 15 October 2026 — Homepage slogan revision

- [x] Make “Synthesize your Zenith” the main homepage heading.
- [x] Add the short explanation and daily-quest supporting copy.
- [x] Synchronize shared slogan and social metadata.
- [x] Update the domain-free share image and version its public URL.
- [x] Verify desktop/phone headline fit, lint, build, and local sharing metadata.

## ZYNTH EVOLUTION & CHRONICLES — INFINITE WORLD EXPANSION

Initiative ID: **ZEC**. Registered 15 October 2026. Full source: `docs/expansion/MASTER_DIRECTIVE.md`. Current publishing and already approved migrations are recorded in the snapshot above; future hosted migrations require authorization. Historical entries retain their original evidence scope. Historical milestones above retain their identifiers and completion records. Status vocabulary: NOT STARTED, IN PROGRESS, IMPLEMENTED, VERIFIED, COMPLETED, BLOCKED. The current weighted percentage is defined in ACTION_PLAN.md; completion still requires the acceptance criteria below.

### ZEC-M0 Architecture and documentation audit — COMPLETED

Objective/scope: inspect repository, installed versions, all thirteen engines, historical blueprint, schema, mission semantics and current UI. Dependencies: none. Acceptance: engine matrix, explicit conflicts/migration policy, v2 Markdown blueprint, baseline checks, integrated roadmap. The owner's subsequent request to use `.md` replaces the Word-export requirement; original v1 Word remains unchanged. Tasks: discovery, source reconciliation, versioned blueprint, implementation appendix and development report complete. Evidence: baseline `npm test`, 500 onboarding combinations, real-SDK simulated auth suite and `npm ls --depth=0` pass; current SQL/service tests documented separately. References: `docs/expansion/ENGINE_AUDIT.md`, `docs/blueprints/ZYNTH Complete Application Blueprint v2.md`, `docs/expansion/DEVELOPMENT_REPORT.md`. Risks: owner RLS currently permits forged progression; full inbox flows unverified. Blocker: none to local implementation. Progress: no production changes. Next: resolve M1 trust boundary before verified reward projections.

### ZEC-M1 Quest–Mission Correction — IN PROGRESS

Objective: seven qualifying quests unlock one actual mission, independent of streaks. Scope/tasks: explicit eligibility and lifecycle, deterministic pending identity, retry/banked credits, generation failure, legacy transition, idempotent trusted completion. Dependency: M0 policy. Acceptance: six/seven, duplicates, failure, pending/completed/next cycle, concurrent requests, legacy/streak/prestige tests; existing records unchanged. Evidence: mission-domain, SDK account and embedded Postgres suites pass. References: `quest-cycle.ts`, `quest.ts`, dashboard, `ensurePlannedQuest`, `expansion.test.ts`, `database.integration.test.ts`, `docs/expansion/TRUSTED_PROGRESSION.md`. Verified tasks: eligibility/replay/retry/banking, stable plan IDs, real fallback steps, retained drafts, streak independence, skipped mission retries, map segment labels and nonpunitive return. Implemented staged foundation: response-only server grading, revision checks, service-only atomic SQL commit, immutable outcomes/events and expiring leases; actual SQL verifies replay, RLS, rollback and concurrent service requests. Remaining: trusted onboarding/generation/skip/prestige/check-in/evolution mutations, client cutover, write restrictions, durable reveal recovery, persisted generation lifecycle and separate-connection database races. Risk/blocker: browser-owned writes still authorize current progression; skip remains separate writes. Embedded Postgres is not distributed race proof. The foundation migration is prepared; confirm actual hosted state before any further SQL. The new route stays disabled until the coordinated cutover is complete. Next: coordinated persistence/privilege cutover before new reward projections.

### ZEC-M2 Profile and Appearance — COMPLETED (100%)

Objective: validated editable names, safe save/discard and centralized light/dark/system themes. Scope/tasks: field-only persistence, error/loading states, global synchronization, account preferences, reduced motion and responsive settings. Dependencies: M0; cloud preferences require prepared migration. Acceptance: validation, owner isolation, persistence failure, theme/system changes and no progression mutation tests, visual verification. Implemented: strict name validation, editable-field patches, save/discard/error states, scoped draft recovery, navigation confirmation, semantic theme/domain/grade/rarity tokens, system theme changes and reduced motion. Offline preferences retain a pending account-scoped value across reloads; retry and reconnect synchronize it. Discard-and-leave removes the draft. Storage-unavailable messaging is explicit. Evidence: SDK tests preserve concurrent XP/history, reject invalid/extra fields, retry failed preferences and restore cloud preferences with empty cache; isolated SQL tests verify owner policies. Headless Edge checks real authenticated UI against a disposable local backend: save/error/discard, navigation dialog/Escape, light/dark/system, reduced motion, failed-sync reload/retry, restored cloud preferences, mobile fit and themed dashboard/profile/achievements/map. Screenshots inspected at desktop and 390×844. References: `scripts/verify-m2-voice.cjs`, `appearance.ts`, `appearance-db.ts`, `AppearanceProvider.tsx`, settings, `docs/expansion/DEVELOPMENT_REPORT.md`. Hosted M2-D closure: the owner-approved hidden test account passed two real Auth sessions, names/theme/motion restoration, injected failure/retry and unchanged-progression checks on 5 November 2026. Original test settings were restored. M2 is complete at 8/8; see docs/expansion/M2_COMPLETION.md.

Related owner additions — locally implemented and verified: voice replies with editable transcripts, local audio playback and saved text drafts for quests/missions; Overview shows all six stats in three desktop/two phone columns. Speech-provider accuracy and real-microphone transcription remain manual checks. See `docs/VOICE_REPLIES.md`.

16 October functional leaderboard addition: global/domain rankings, true counts, pagination, own rank beyond the visible page, privacy/opt-out and refresh/error states are implemented. The owner approved the read-only ranking migration; it is applied and verified on the hosted project, with no profile/reward changes. Targeted PostgreSQL and browser checks pass. Regional participation and unrestricted browsing have since shipped; rank-triggered profession/reward grants remain outside this read-only feature. See `docs/LEADERBOARD.md`.

### ZEC-M3 Identity and Avatar Foundation — NOT STARTED

Objective: prominent responsive avatar environment and optional editor. Scope/tasks: layered default, appearance preview/save/reset, keyboard/focus, room presentation, stats beside compact skills. Dependencies: M2, trusted persistence contract from M1. Acceptance: defaults, saved appearance, locked equipment, error fallback, mobile and keyboard tests. Evidence: none. References: blueprint section 8. Risk: no production avatar schema yet. Next: small coherent default and editor, not an asset explosion.

### ZEC-M4 Cosmetic Inventory — NOT STARTED

Objective: secure cosmetic ownership and equipment. Scope/tasks: versioned catalog, categories, server grants from existing achievements/events, duplicate protection, ownership and equipped UI. Dependencies: M1 trusted events, M3. Acceptance: unauthorized/concurrent grant rejection, event replay, slot validation, persistence and existing economy compatibility. Evidence: none. References: blueprint sections 10/13/19. Risk/blocker: browser profile claims cannot authorize cosmetics. Next: server-owned inventory after trust boundary passes.

### ZEC-M5 World Expansion Foundation — NOT STARTED

Objective: modular regions, connections, landmarks and atlas navigation. Scope/tasks: stable versioned definitions, per-user discovery, on-demand selected region, safe unknown IDs. Dependencies: M1 events. Acceptance: locked/available regions, cross-region navigation, new release and old-player compatibility, large catalog tests. Evidence: none. References: blueprint sections 6/14/26. Risk: existing map geometry is one scene. Next: initial coherent region package.

### ZEC-M6 Living Mark Map — NOT STARTED

Objective: permanent region-specific restoration from actual progress. Scope/tasks: layered environmental states, shared Overview art, textual changes, reduced motion and nonblocking transitions. Dependencies: M5. Acceptance: mission/chapter event replay, independent regions, refresh, navigation, skip/reduced motion and rendering tests. Evidence: existing shared landscape is preserved; M1 corrected segment labels/mission markers, but no evolution runtime exists. References: blueprint section 7. Risk: runtime regional restoration and persistence are absent. Next: consume verified regional events after M5.

### ZEC-M7 Chronicles Foundations — IN PROGRESS

Objective: canonical lore, deterministic chapters and first coherent arc. Scope/tasks: versioned Lore Bible, chapter definitions/requirements, narrative state, existing progression integration. Dependencies: M1/M5. Acceptance: flexible chapter conditions, canonical consistency, no XP duplication, no-AI fallback, missed-history recovery tests. Evidence: versioned 20-section Lore Bible authored in `docs/chronicles/ZYNTH-CHRONICLES-LORE-BIBLE.md`; runtime chapters, conditions and archive are NOT STARTED. References: blueprint sections 4/9/16. Risks/blockers: canonical documentation does not implement Engine 17; preserve existing quest history. Next: deterministic chapter runtime after trusted events and initial regions.

### ZEC-M8 Personalized Narrative — NOT STARTED

Objective: profession/skills/title-aware branches and private paginated archive. Scope/tasks: reversible choices, persisted continuity, bounded memory references, history tabs. Dependencies: M7 and trusted actual identity events. Acceptance: truthful branch selection, choices/account isolation, pagination, unknown content and AI failure tests. Evidence: none. References: blueprint sections 9/12/15. Risk: profession evolution is only partially implemented. Next: consume actual data without inventing evolutions.

### ZEC-M9 Chapter and World Integration — NOT STARTED

Objective: verified chapter conclusions transform the relevant world. Scope/tasks: source event correlation, idempotent projections and skippable presentation. Dependencies: M6/M8. Acceptance: chapter conditions differ from mission counts, event replay/recovery, independent regions and animation failure tests. Evidence: none. References: blueprint sections 7/11/14. Risk: optional enrichment must not roll back gameplay. Next: transaction/outbox integration.

### ZEC-M10 Infinite Expansion Readiness — NOT STARTED

Objective: add content without resetting user records or imposing a final chapter. Scope/tasks: content packages, stable identifiers, compatibility and bounded history reads. Dependencies: M4/M5/M7/M9. Acceptance: new package release, retired identifiers, existing user fixtures, large-history/catalog tests. Evidence: none. References: blueprint sections 2/22/26. Risk: no fake infinite-content claims. Next: release compatibility fixtures.

### ZEC-M11 Production Hardening — IN PROGRESS (baseline evidence only)

Objective: satisfy the directive's complete definition of done. Scope/tasks: real database transactions/RLS, account-to-quest integration, accessibility, security, performance, production build and documentation reconciliation. Dependencies: M1–M10. Acceptance: all milestone criteria and relevant regression suites pass; no unauthorized reward writes; hosted changes only under separate explicit authorization. Evidence accumulated: engine/account/mission suites, isolated actual-SQL service/RLS tests and production compilation; these do not constitute full release verification. Dependency audit: 16 vulnerable entries (1 critical, 13 high, 2 moderate), including current Next.js and styling/lint toolchain. References: `docs/expansion/MASTER_DIRECTIVE.md` sections 27/32, `docs/expansion/DEVELOPMENT_REPORT.md`. Blockers: dependencies need coordinated upgrades; private UI, inbox and distributed database checks remain; M1–M10 acceptance incomplete. Existing publication authorization and completed approved migrations are recorded above; new hosted migrations require their own authorization. Next: resolve dependency findings and accumulate evidence per phase before final acceptance.

## 16 October 2026 — Leaderboard participation follow-up

**IMPLEMENTED, VERIFIED AND DEPLOYED.** Original UI and Local/State/National/Global tabs restored. First visit asks whether to join Global, share an approximate country/state/city for all lists, or browse only. All authenticated users can view all boards. Choices persist in existing account metadata, can be changed/withdrawn and never grant rewards or privileges. No exact location or new table is required. The separately approved scoped ranking migration is applied; no existing profiles or progression were modified. SQL, focused browser, lint/types and production compilation pass. Hosted read-only permissions/output checks pass; existing accounts await explicit consent. Broader ZEC milestones remain at their existing status. See docs/LEADERBOARD.md.

## 16 October 2026 — Step 1 implementation and Global default

Server-owned onboarding/private legacy archive, persisted generation plans, all existing gameplay mutation service paths and durable grade/event recovery are implemented behind a coordinated gate. Actual PostgreSQL separate-connection checks pass for overlapping generation/completion/skip requests, replay and revision conflicts; injected failures roll back quest/token changes. The real browser → Next → SDK → PostgreSQL fixture restores drafts and committed outcomes after a lost reply without duplicate rewards. Existing engine/account/voice suites, leaderboard SQL/UI checks, lint and the 29-entry production build pass. Phone settings/leaderboard layouts were inspected, and browser bundles contain neither local fixtures nor server credential names.

The owner approved the foundation, actions and privilege-cutover migrations and activation after readiness checks. The compatible app is being published gated off; production activation waits for privately configured server credentials and the coordinated checks in docs/expansion/STEP1_ROLLOUT.md. Existing cloud progress stays in place; uncertain imported history never becomes new verified grant evidence. No hosted quest/reset/test-user mutation is used for release verification.

The separately approved Global query is applied and read-only verified: all three verified saved profiles appear, including two at zero EXP. Settings opt-out is respected; optional approximate regional membership and unrestricted browsing remain. No user record was changed for this ranking fix.

Weighted completion is 37/100 (37%); M1 is 21/22 (95%), with the final hosted activation point pending. M1-F was split into 2 local evidence points and 1 activation point, keeping the denominator unchanged. M11 dependency audit preparation was refreshed: the same 16 vulnerable package entries remain unresolved, so no hardening credit is added.

## 2 November 2026 — Step 1 production activation

Resumed the owner's paused Supabase project with explicit permission. Verified the compatible production deployment dpl_54T8yZ1eMwN2WhYNjjHgULgKDVoC at application commit 0bdc38da81c6758b988c803849d255156f55d672 and the production alias. Confirmed the non-secret server gate is 1 and grading mode is practice, preserving the existing mock experience; Production Secret values were excluded from the configuration export.

Applied the previously authorized trusted_journey_cutover migration (hosted version 20261102131859). Read-back confirms trusted_writes=true, browser XP and quest-definition edits denied, editable names/privacy and quest drafts retained with owner RLS. Profile/quest counts and aggregate lifetime EXP are unchanged across this cutover: 3 profiles, 4 quests, 30 EXP. The Global query returns 3 verified visible profiles, including zero-EXP entries. No real account was reset or graded for release verification.

Public pages/assets and anonymous API rejection checks pass. Local engine, account, voice, SQL, separate-connection and browser recovery evidence remains recorded from the implementation checkpoint. A real hosted signed-in quest/recovery and inbox walkthrough remains under M11; cross-session appearance verification remains M2. This activation does not complete those separate checks.

Weighted progress is now **38/100 (38%)**, with M1 **22/22 (100%)**. The final M1-F2 activation point is credited; the denominator and other milestone points are unchanged. Next: M2's hosted cross-session appearance/persistence proof, then M3 avatar work. Existing dependency hardening and future expansion engines remain open.


### Production release verified — 5 November 2026

Published application commit 519258e5bf823ff85198d6c3aa64311197e0c996 to GitHub feature/evolution-chronicles and master; Vercel reports deployment success. Minimal live checks confirm /download, /offline and /sw.js return 200, the APK downloads as an Android attachment with the exact verified SHA-256, and browser configuration points to the production Zynth Supabase project without local fixtures. No hosted user records were changed by verification. Physical Android/store acceptance and remaining ZEC packages stay open.

Owner workflow preference from this checkpoint: focus on functional implementation and run only minimal checks needed for a change or release. Broader regression testing and debugging are deferred to a dedicated testing day.


## 5 November 2026 — Lesson visibility and readiness correction

Supersedes the earlier seven-completion policy: mission eligibility now uses successful practice across at least three distinct taught concepts, at least two understood checks among the last three recorded learning checks, and an understood latest check. This is concept coverage/readiness, not seven days or seven quests. Existing active missions/retries and earned progress remain valid; a completed mission starts the next learning cycle. Editable offline additional-study metadata does not grant mission eligibility. No database migration is required: the trusted server derives readiness from stored history.

Overview now shows actual teaching and a worked example above the quest card, with a direct Continue this lesson action. New learning quests are labelled as lessons; older unfinished tasks are labelled Continue saved quest. Saved drafts are retained. Learning is also directly accessible while an older task remains unfinished.

Focused readiness checks and TypeScript passed; broader regression fixtures for the superseded seven-credit policy are deferred to the dedicated testing day. Weighted roadmap remains 38/100. Publication follows the existing authorized release workflow.

## 5 November 2026 — Unified daily lessons and transparent caching

Owner correction: the daily quests themselves are the lessons. Removed the separate Overview lesson panel, extra study track, alternate library UI, mode banner and links to an offline experience. Older non-mission daily quests now convert to teaching plus a small check through the trusted service, retaining their IDs/drafts and archiving the previous definition. Missions remain the substantial assessments and use readiness rather than a calendar quota.

The normal application routes and account snapshot are cached. Three upcoming server-prepared daily quest definitions and the relevant mission case are recorded durably, activated through the same quest flow, and replayed through trusted completion after reconnection. The normal feedback screen handles cached formative checks. Profile edits, energy choices, draft/presentation receipts and previously fetched ranking snapshots use the same UI and synchronize quietly. No migration is required. Prior separate-library implementation and its acceptance notes are superseded.

Focused acceptance: normal Overview/quest/grade pages, same lesson identity after disconnected cold reload, local check feedback, one automatic saved-answer submission and three upcoming definitions passed against disposable accounts. Cache hydration/reconnection checks, TypeScript, lint and production compilation passed. Wider multi-date reward/streak reconciliation, distributed races and physical Android acceptance remain for the dedicated testing day. Weighted roadmap remains 38/100. Publication follows the existing authorized release workflow.

Unified application release 954cc9a is deployed successfully. The separate library and mode UI have been removed from production; the same quest routes now use the daily lesson cache. First-time cached lessons preserve the calibration type. Broader checks remain deferred as requested.


## 5 November 2026 — M2 final acceptance preparation

Read-only production inspection confirms public.user_preferences has user_id/theme/motion/updated_at, RLS enabled, and owner-scoped SELECT/INSERT/UPDATE/DELETE policies. Existing setup is complete; no migration is needed. The focused hosted acceptance runner is prepared in scripts/verify-m2-hosted.cjs. It requires an explicitly authorized, confirmed M2 test account, verifies names and appearance through two real Auth sessions plus interrupted-save/retry, preserves numerical progress and restores test settings.

M2-D remains pending until that authenticated hosted check passes. Current access permits schema inspection but does not provide a dedicated test login or Auth administration. Dashboard sign-in is required to prepare the isolated account. No existing user was edited, no test account was created, and no extra completion point is claimed. M2 remains 7/8 and overall progress 38/100 at this checkpoint.

## 5 November 2026 — M2 completed

**M2 Profile and Appearance: 8/8 points (100%). Overall roadmap: 39/100 (39%), 61 points remaining.** The final M2-D point is now earned. Production schema/RLS inspection and the owner-approved isolated hosted check passed: display/character names and dark/reduced-motion preferences restored after sign-out and a fresh SDK sign-in; an injected failed write preserved the hosted value and retry succeeded. Numerical progress stayed unchanged and original test settings were restored. The dedicated test account remains hidden from rankings at zero XP; existing users were untouched. No migration was applied.

Evidence: docs/expansion/M2_COMPLETION.md and scripts/verify-m2-hosted.cjs. M2-A/B/C retain their prior implementation and local UI/SQL evidence; this closes only the outstanding hosted point. Earlier pending-M2 notes are historical. Next: M3 Identity and Avatar. Broader checks stay deferred to the dedicated testing day.