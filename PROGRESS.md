# Progress update

Updated: 6 November 2026 (Africa/Lagos).

<!-- ZEC_PROGRESS_START -->
## Current completion: 55%

**55 of 100 weighted acceptance points complete; 45 points remaining.** Roadmap weights unchanged; status reviewed 6 November 2026 (Africa/Lagos).

Scope: the full Evolution & Chronicles roadmap, **ZEC-M0 through ZEC-M11**, including production hardening. This is an evidence-based planning baseline, not a measurement of time, code coverage or production readiness. The already shipped base app is not counted a second time. Weights and evidence are defined in [the action plan](ACTION_PLAN.md).

- **M0 Architecture/documentation — 100%** (5/5 points): audit and versioned specification complete.
- **M1 Quests/trusted progression — 100%** (22/22): trusted actions/recovery, local PostgreSQL concurrency checks and owner-approved hosted permissions/configuration activation complete.
- **M2 Profile/appearance — 100%** (8/8): implementation, local UI/SQL evidence and authorized hosted cross-session persistence/retry complete.
- **M3 Identity/avatar — 100%** (8/8): character/editor, account persistence, free equipment restrictions and responsive/keyboard evidence complete.
- **M4 Cosmetic inventory — 100%** (8/8): catalog, verified grants, ownership/equipment and focused acceptance complete.
- **M5 World expansion — 0%** (0/8).
- **M6 Living Mark Map — 0%** (0/7).
- **M7 Chronicles foundation — 25%** (2/8): Lore Bible done; chapter runtime/first arc remain.
- **M8 Personalization/archive — 0%** (0/5).
- **M9 Chapter/world integration — 0%** (0/5).
- **M10 Expansion readiness — 0%** (0/5).
- **M11 Production hardening — 18%** (2/11): reusable baseline checks credited; security, original-engine gaps and final acceptance remain.

**Next action:** M5 World Expansion. M2, M3 and M4 are complete.

The original leaderboard UI and all four scopes are live. Global includes verified profiles by default, including zero EXP; Settings can hide entries, and regional location remains optional. Current application commit: 0bdc38da81c6758b988c803849d255156f55d672. The owner-approved leaderboard migrations are applied, and the owner confirms prior database/SMTP setup. No repeated setup is requested. Real hosted preference/inbox/user-journey verification is distinct from that confirmation.

**How updates work:** the checked packages in ACTION_PLAN.md sum to the accepted points. Overall percentage uses those points directly; milestone percentages are rounded. Add implementation/check evidence before awarding points, update both progress/milestones together and preserve old entries. No points were awarded for writing this plan.
<!-- ZEC_PROGRESS_END -->

## Historical progress log

### 3 November 2026 — Android application and scheduled quest focus

Added an Android shell for the existing hosted account/quest experience, with an explicit first-use overlay permission explanation and prominent Settings permission controls. A device-local daily alarm opens the quest overlay when Android permits it. The focus timer lasts approximately three minutes or ends after a matching committed quest submission; an emergency exit and Android's controls remain available.

Denied/unavailable overlays use optional repeat notifications. Settings offers 5, 10 or 15-minute requested intervals, defaulting to 5, within a 30-minute reminder window. Completing a quest, Pause today, disabling/changing the alarm or signing out cancels the repeats. Android can delay inexact alarms. Existing progress and database schema are preserved; no hosted migration is required.

The APK, build instructions, account boundaries and verification limits are recorded in [Android application notes](docs/ANDROID_APP.md). Real-device alarm/overlay acceptance and release signing remain separate from compilation. This requested addition earns no extra ZEC acceptance points: the weighted roadmap remains **38%**.

Verification: debug APK compilation and signature verification passed, along with six native policy tests, Android lint (no errors), web lint/TypeScript, bridge tests, existing engine/account/database/voice suites and the portrait browser integration flow using a simulated Android port. The actual device alarm/overlay walkthrough remains open.

Earlier entries below are dated snapshots. This dashboard and the action plan supersede their old pending-setup, deployment and no-percentage wording; they do not erase the original evidence or remaining limitations.

### 15 October 2026 — Account and workspace checkpoint

The app now has a minimal public landing page, real email/password accounts, and account-owned progress in Supabase. The primary product reference remains the complete application blueprint, with the user's aspiration-first onboarding and world-map additions.

## Completed

- Built a fluid ivory-and-amber landing page with clear sign-up/sign-in entry points, a labeled illustrative journey preview, an explanation of quests, and returning-user access.
- Added signup, signin, email-confirmation callback, password-recovery screens, password visibility, useful errors, and private-route loading/retry states.
- Connected the Zynth Supabase project in Zynth-SkillForge's Org and applied the initial application schema plus account draft storage.
- Separated account synchronization from practice/AI feedback mode. Practice mode still saves profiles and progress to the real account.
- Restored profiles and current quest drafts after signin. Partial onboarding saves its goal, selections, and step; quest drafts save text, completed mission steps, and elapsed time.
- Added account-scoped browser draft backups, stale-load protection on signout/account changes, and guards against cross-account saves.
- Added a one-time import for a matching legacy local journey without overwriting an existing cloud profile.
- Updated account settings for cloud signout and progress reset. Added authenticated access to model requests and removed synthetic rankings from connected empty boards.
- Verified row-level security on all nine application tables; anonymous private reads return empty data and anonymous draft writes are denied. Restricted an API-callable internal Supabase trigger; the security advisor now returns no findings.
- Released application commit `a0affc33eada19e42a1c3caa335dc6a19a65f41e` on the original Vercel project. That project was subsequently deleted; the replacement project and current address are recorded below.

## Preserved earlier work

Aspiration-first onboarding uses one written direction and four everyday scenarios. All 500 primary scenario combinations produce valid profiles. Mark Map and Overview share a landscape of winding checkpoints, mission landmarks, and fourteen-mark chapters; only successful quest days add marks. See the milestone record and original blueprints in `docs/blueprints`.

## Verification

- All 68 engine/regression checks and the 500-combination sweep pass.
- New account integration suite passes using the actual Supabase SDK against a simulated Auth/PostgREST backend: confirmation, invalid credentials, restored cloud drafts/profile, separate accounts, failed saves, and stale-load rejection.
- Lint, TypeScript, and the production build pass for 22 routes.
- Local landing/account responses return HTTP 200. The real Supabase email provider and signup are enabled, with confirmation required. Unauthenticated model requests return 401.
- Production landing and all four account routes return HTTP 200. Published browser bundles contain the intended project URL and public key. Missing and invalid sessions both receive HTTP 401 from the model endpoint.
- Full desktop/mobile browser verification is still pending because the browser runtime cannot initialize. Real inbox confirmation/reset and authenticated writes to the hosted database have not been walked through end to end.

## Remaining

The user confirmed the original production Site URL and redirect URLs, but the replacement site uses a different address. Save the new URLs from `docs/DEPLOYMENT.md`, then configure and test SMTP using `docs/EMAIL_SETUP.md`. The connector cannot independently edit or read the dashboard's auth settings.

Progression math remains browser-owned. Model rate limiting, leaderboard aggregation, Swift Mode and XP-card actions, durable grade/event recovery, and real community content remain listed in `ENGINE_STATUS.md`. This update does not claim those broader blueprint features are complete.

## Replacement Vercel project — 15 October

Reconnected the replacement project prj_QPxos3AVIGXk73axBpLXVGHqEhUh to the existing Supabase configuration and local Vercel link. Its verified production domain is https://zynth-skillforge.vercel.app. GitHub production source remains ChampionLION/zynth on master. Added docs/EMAIL_SETUP.md for free Gmail SMTP with an App Password because the user does not own a domain. Supabase's production URL and both redirect URLs must be updated from the deleted project's address; SMTP credentials and delivery remain user setup steps.

## Approved identity and social sharing — 15 October

- Applied the user's refined stepped Z and serif wordmark to the landing header/footer, account access and recovery screens, onboarding, workspace sidebar, leaderboard, and account/synthesis loading states.
- Added a crisp SVG mark, light-on-dark presentation, multi-size ICO/SVG/PNG favicons, Apple touch icon, and 192/512-pixel app icons. Original transparent and white-preview logo exports remain available.
- Set the page and Open Graph title to **Zynth — Synthesize your zenith.**, with **Build who you want to become.** as the explanatory line.
- Added a 1200 × 630 share image with the approved logo and wording, with no domain text. Open Graph and Twitter use the same title and image.
- Verified the public logo in a real browser at the normal preview width and at 390 × 844; the phone landing and signup page have no horizontal overflow and load the serif wordmark successfully. This does not replace the earlier pending full authenticated account walkthrough.
- Lint and the production build pass. Local HTTP checks confirm the metadata, all favicon formats, the Apple icon, logo assets, and exact share-image dimensions.

Brand assets and generation notes are documented in `docs/brand/og-image-v1.md` and `docs/brand/logo-refinement-v1.md`.

## Homepage slogan revision — 15 October

- Replaced the main landing headline with **Synthesize your Zenith** and the explanation **Build who you want to become.** A short line explains daily quests and visible skill progress.
- Centralized the revised capitalization across footer, account and workspace branding, and sharing metadata.
- Added a matching domain-free 1200 × 630 share image at `public/brand/zynth-og-v2.png` so sharing services receive a new image URL.
- Lint and production compilation pass. Browser checks confirm the headline fits the normal desktop preview and 390 × 844 phone viewport without horizontal overflow. Metadata and image endpoint checks pass locally.

See `docs/brand/og-image-v2.md` for the current wording and image edit record.

## 15 October 2026 — ZEC-M0 expansion discovery

Status: IN PROGRESS. Registered **ZYNTH EVOLUTION & CHRONICLES — INFINITE WORLD EXPANSION** in the existing milestone file. Baseline working tree clean; created local branch `feature/evolution-chronicles`. Preserved the supplied directive in `docs/expansion/MASTER_DIRECTIVE.md` and original Word/PDF/text sources unchanged.

Inspected installed stack, engine interfaces, routes, state, database adapters/schema/migrations, existing status records and original blueprint. Read-only hosted schema/policy/migration inspection confirms owner RLS, but owner writes can alter progression; no authoritative completion transaction existed at discovery. No live user data was changed. Created the engine matrix, explicit mission eligibility/legacy transition policy, source-conflict resolutions, and versioned expanded Markdown blueprint. Later checkpoint below supersedes the initial Word-export plan and records implementation.

Baseline evidence: `npm test` passes all existing 68 local checks, 500 onboarding combinations and SDK-backed simulated account integration; `npm ls --depth=0` confirms the actual dependency versions. Database changes at discovery: none. Main limitation: browser math/whole-profile writes cannot support secure concurrent new rewards. Initial next actions were document export, mission policy and foundational UI; the owner subsequently selected Markdown. No remote push, deployment, live migration or paid API call is authorized.

## 15 October 2026 — ZEC-M1 mission policy phase

Status: IN PROGRESS, local domain policy verified; trusted reward persistence is incomplete. Added `src/lib/engines/quest-cycle.ts` as an Engine 2 helper, with explicit eligibility, unique-ID history replay, banked credits, legacy mission preservation, retry/active/completed state and stable user/cycle/attempt generation IDs. Quest planning now unlocks a slightly harder mission after seven qualifying completions, independent of streaks. Invalid multi-step model output falls back to real mission templates. A Bad mission does not earn the successful-mission card grant.

Dashboard retains unfinished challenges across days, exposes mission progress, and no longer fades a returning user's character. Insert-if-absent generation preserves an existing planned quest/draft. Mark Map now calls fourteen-mark views segments and removes invented every-seventh-day mission markers; Overview continues using shared landscape geometry.

Tests: `npm test` passes updated smoke checks, the 500-case onboarding sweep, existing SDK account integration and `expansion.test.ts`. The new suite checks six/seven, duplicate/failing/Swift/retest exclusion, generation failure, real mission steps, pending/retry, banking, completion/next cycle, legacy history, streak independence, prestige and concurrent planner IDs. Stable IDs are not a cross-request reward transaction test.

Database changes: none applied. Remaining: trusted stored-quest grading, atomic reward/event commit, privilege hardening and real Postgres race tests. New permanent cosmetic/world rewards must remain disabled until that boundary is verified. Next independent work: M2 validated field-only settings and theme infrastructure. M1 is not complete.

## 15 October 2026 — Markdown deliverables and local foundation checkpoint

**M0 COMPLETED; M1, M2 and M7 IN PROGRESS. The full initiative is not complete.** The owner requested `.md`; the current v2 blueprint and development report are Markdown. The original v1 Word document remains unchanged. The unreviewed export draft is excluded from deliverables. See [Blueprint v2](<docs/blueprints/ZYNTH Complete Application Blueprint v2.md>) and [Development report](docs/expansion/DEVELOPMENT_REPORT.md).

Implemented the staged response-only trusted completion service/route and CLI-generated additive migration with profile revision checks, service-only atomic commit, immutable outcomes/events and expiring grading leases. Actual SQL and full service tests execute in isolated embedded Postgres, including RLS, replay, rollback, conflict, ownership, concurrent service submissions and grader-failure cleanup. The browser still uses legacy writes; the new route remains disabled, and the migration is **not applied to hosted Supabase**. Other mutating flows, privilege cutover, durable reveal recovery and separate-connection races remain open.

Settings now supports validated name edits, field-only save/discard, unsaved-change confirmation and account-scoped draft recovery. Semantic light/dark/system themes, operating-system following, cross-tab synchronization, reduced motion and native dialogs are implemented. SDK tests verify profile-field isolation, failure handling and preference restoration; SQL tests verify preference ownership. Hosted sync and new private-screen visual/keyboard checks remain pending. Browser fallback is explicitly labeled.

Corrected ordinary retry IDs, mission skip/retry tracking, specific-quest retirement and calendar achievement handling for extra same-day missions. Skip remains a multi-write legacy operation, not a completed atomic server action. Overview retains the shared landscape. Authored the versioned Lore Bible; runtime engines 14–18, avatar, inventory, modular worlds, chapters and archive remain unimplemented.

Latest verification: `npm test`, lint and production build pass, including all 24 build entries. Public/account entry HTTP checks and unauthenticated API rejection pass; these are not authenticated UI or inbox proof. Browser control is unavailable for new private UI checks. The dependency audit reports 16 vulnerable entries (1 critical, 13 high, 2 moderate); coordinated upgrades are a release blocker.

Next: trusted onboarding/import and all gameplay mutations, client/result recovery and grants/RLS cutover, separate-connection tests, then avatar/inventory/regions/Chronicles in milestone order. The development report records the exact continuation sequence and limits. No expansion push, deployment, hosted migration, live user-data write or paid external call was performed.

## 15 October 2026 — M2, voice replies and all six Overview stats

**ZEC-M2 is implemented and locally verified.** Finished editable-name save/discard behavior, native navigation confirmation, free light/dark/system themes, reduced motion, shared domain/rarity colors and light dashboard surfaces. Offline appearance choices remain queued across reloads, with account-sync retry/reconnect recovery and explicit temporary behavior if browser storage is unavailable. Discard-and-leave now removes unsaved edits. Hosted preferences still need the prepared migration; no hosted changes were made.

Added voice replies for ordinary quests and every mission step: microphone recording, optional local playback, language selection and editable transcripts. Final words append to existing text, save through normal account drafts and reach the existing grader; capture/finalization blocks submission or step changes. Audio stays only on the page and is cleared on leave/step/account changes. Permission/provider errors and unsupported browsers keep typing available. Browser speech processing is disclosed before recording. See [Voice replies](docs/VOICE_REPLIES.md).

Overview now shows Focus, Consistency, Adaptability, Execution and both saved domain attributes, in three columns on desktop and two on phones. No numerical progression rules changed.

Before the owner's request to defer further testing, engine/account/SQL/voice suites, lint and the 24-entry production build passed. Browser checks against a disposable local backend covered M2 saves/failures/discard, themes/system/reduced motion, pending preference retries, mobile layouts, six stats, synthetic microphone capture, draft recovery and both quest/mission grading. Screenshots were inspected. Real microphone/provider accuracy, hosted preferences and full release checks remain unverified. A final defensive recording-timeout cleanup and documentation edits were made afterward; further checks are deferred to the next prompt as requested. No push, deployment, hosted write or external cost occurred.

## 16 October 2026 — Publication authorized

The owner requested the current changes be pushed to GitHub and deployed to the existing Vercel site. Release preparation is in progress. This authorizes publishing application code, while leaving hosted database migrations and paid services outside scope. The trusted completion feature gate remains off; appearance cloud synchronization awaits its prepared migration. Prior implementation evidence and unresolved security/release limitations remain documented above and in the development report.

## 16 October 2026 — Release and owner setup confirmation

Application commit `a93bb0b3a38924abe948141b662a45402244f7ac` was pushed to GitHub and successfully deployed to the existing production site. Read-only checks confirmed the published M2, voice and six-stat interfaces, correct Supabase configuration and anonymous API rejection.

The owner confirms that the database migration and SMTP configuration were already completed. This supersedes earlier pending-setup notes; no migration was reapplied and no SMTP credentials were requested. Live preference synchronization and inbox delivery have not been independently rechecked. Added a Spam-or-Trash reminder to signup confirmation and password-reset notices. This is a copy change; broader tests remain deferred as requested.

## 16 October 2026 — Functional leaderboard

Replaced the empty cache with authenticated, read-only live rankings over positive saved lifetime EXP. Global and five domain boards support pagination, true participant totals, current-user rank outside the page, refresh/focus/minute updates and distinct loading/empty/error/privacy states. Names are reduced to first name/last initial; profile details and account identifiers remain private. Settings opt-out takes effect on the next query. Location-based boards await optional location data. Viewing the board no longer writes professions or rewards; score authority remains part of M1 hardening.

The owner explicitly approved the additive leaderboard migration; it was applied to Supabase without changing profiles, scores or rewards. Hosted read-only verification found one eligible participant, no private fields, anonymous execution denied and authenticated execution granted. Local PostgreSQL checks and focused browser checks pass, including account privacy and actual Settings opt-out. Desktop/phone screenshots inspected. The intentional SECURITY DEFINER projection and existing password-protection advisory are documented in [leaderboard notes](docs/LEADERBOARD.md). Publishing follows the existing authorized GitHub/Vercel release workflow.

## 16 October 2026 — Original leaderboard and optional participation

Restored the original podium/list layout and all four scope tabs. First-time visitors choose Global only, all rankings with a manually entered approximate country/state/city, or browse only. Everyone can view every scope. Saved choices persist through Supabase account metadata; Manage participation changes or withdraws them. No GPS is collected, and there is no regional-ranking-unavailable message. The direct Supabase engine handles geographic filters and real counts; the old cache table remains intact.

The owner separately approved the prepared participation/scopes migration; it is applied. It creates no tables/columns and changes no existing progress. Existing accounts must explicitly join before appearing. Hosted read-only checks confirm valid snapshots in all four scopes, anonymous execution denied and no private row fields. Zero initial participants is expected until consent is saved. The old Global RPC delegates to the new consent rules.

Actual SQL tests, focused UI/SDK checks, lint, type checking and production build pass. The original two/one/three podium, scope browsing without location, regional membership, pagination, choice persistence and withdrawal are covered. Existing progression authority and broader expansion limits remain unchanged. Publication uses the already authorized GitHub/Vercel workflow; final deployment verification is recorded separately.

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

## 5 November 2026 — Learning and offline continuity checkpoint

Implemented learning-first daily quests with actual teaching and worked examples, one small reinforcement check, and supplied mission scenarios with facts/constraints. Added saved taught-topic context, deterministic concise-answer feedback and compatibility for historical quests/drafts. The owner-supplied icon is packaged unchanged in Android 0.1.2 with a themed layer; the corrected APK was built, signature-verified and delivered before the remaining checks. Android lint has zero errors.

Remember me is available on sign-in and Settings. The web/Android shared offline library saves the issued quest/draft, profile snapshot and three upcoming foundation lessons. Offline study and quest answers survive reload. Reconnection syncs study history and drafts, submits queued issued quests through the existing trusted endpoint and refills three upcoming lessons. Study metadata never grants XP or ranking credit. The website download page exposes the signed early-access APK and checksum from landing/Settings links.

Verification completed: engine/account/database/voice suites, learning and offline checks, trusted journey checks and local production compilation. Real-browser offline cold reload, three lesson completions, journal sync, refill to three, one queued-quest submission, remembered browser restart, phone width and APK headers/hash passed using disposable accounts; no hosted user progress was changed. Publication/smoke status is recorded with the release. Physical Android permission/alarm/WebView acceptance and store release signing remain open.

Weighted ZEC completion remains **38/100 (38%)**. These owner-requested additions do not satisfy the remaining avatar, inventory, world or Chronicles packages, or the hosted M2/M11 acceptance gaps. See docs/LEARNING_QUESTS.md, docs/OFFLINE_LEARNING.md and docs/ANDROID_APP.md.


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
## 5 November 2026 — M3 Identity and Avatar completed

**M3: 8/8 (100%). Overall roadmap: 47/100 (47%), 53 points remaining.** Added the layered Wayfarer/environment, optional skin/hair/outfit/backdrop preview editor, explicit save/cancel/reset, scoped drafts/pending saves and the shared Overview character. The profile displays actual identity and all six stats, with radar/skills in desktop columns and a stacked phone layout. Native modal keyboard/focus behavior and a touch close button are retained.

Equipment slots accept free default outfits only; accessory/aura and unreleased earned equipment stay locked until M4. Strict validation rejects forged IDs, incompatible slots and progression fields. Appearance does not write XP, skills or profile progress. Existing Auth metadata provides bounded account persistence without a migration.

Focused avatar-boundary and browser checks passed, including fresh-session restore, reset/Escape/focus, locked items, unchanged profile data and phone fit; screenshots were inspected. Actual hosted save/restore passed on the existing approved hidden zero-XP test account, and its previous avatar was restored. TypeScript, lint and production compilation passed. Broader testing remains deferred as requested. Evidence: docs/expansion/M3_AVATAR.md. Next: M4 Cosmetic Inventory. Publication uses the existing authorized GitHub/Vercel workflow.

### 6 November 2026 ? Male and female avatar options

Added a male/female selector, distinct character silhouettes and bob/long hair for both options. Existing saved appearances remain compatible; Profile and Overview share the selection on web and Android. Focused avatar and TypeScript checks passed. No database migration or progression changes. Weighted completion remains **47/100 (47%)**; M4 inventory remains next. [Implementation notes](docs/expansion/M3_AVATAR.md).


## 6 November 2026 - M4 Cosmetic Inventory completed

M4 completed: versioned eight-item catalog, verified server-owned grants, private ownership/equipment, compatible equip/remove, locked previews and owned/equipped filters. Profile and Overview share the equipment layers for male and female avatars. Cached selections sync on reconnection. Focused SQL, independent-connection duplicate-grant and desktop/phone UI checks passed; the owner-approved production migration is applied. No XP, currency or progression changes. **M4: 8/8 (100%); overall: 55/100 (55%), 45 points remaining.** Next: M5 World Expansion. [Evidence](docs/expansion/M4_INVENTORY.md).


### 6 November 2026 - Inventory placement

Moved inventory into Customize appearance, alongside the appearance controls. Removed the standalone inventory from the identity page. Ownership, equipment and synchronization behavior are retained. Roadmap completion remains **55%**.


### 6 November 2026 - Shared avatar portraits and daily check-in

The saved avatar now supplies profile pictures in navigation, Settings and leaderboard podium/list/current-position entries. The separately approved leaderboard read update projects only whitelisted appearance choices and owned equipment, retains opt-out/ranking rules and preserves old-client responses. The daily prompt now asks about energy; answer controls disappear immediately during save and return on failure for retry. Inventory remains inside Customize appearance. Focused avatar-ranking privacy/compatibility and TypeScript/lint checks passed. Weighted completion stays **55%**.


### 6 November 2026 - Concise interface and Android download

Removed repetitive explanatory copy from Overview, Mark Map, Chronicle, profile customization, leaderboards, account and reminder settings. Sample responses are labeled Examples. Added a permanent Android download action to the home page and a dismissible browser alert; the installed Android app does not show the alert, and dismissal is remembered. Essential permission choices and actionable errors remain. TypeScript, focused lint and the browser download/dismissal check passed. Roadmap completion remains **55%**.
