# Changelog

## 16 October — trusted progression release preparation

- Added gated server-owned onboarding, persisted quest plans and current gameplay actions, with private legacy archives and durable grade/event recovery.
- Added owner rate budgets, atomic costs, replay-safe reset, restricted SQL cutover and separate-connection PostgreSQL/browser verification.
- Made Global rankings default for verified profiles, including zero EXP, with Settings opt-out and optional regions. The approved query is applied.
- Recorded 37% weighted progress and the owner-approved production rollout; activation is tracked separately from implementation.

## Unreleased — Evolution and Chronicles

### 16 October — Original leaderboard and optional joining

- Restore the original podium/list UI and Local, State, National and Global tabs.
- Ask first-time visitors to join Global, share an approximate area for all rankings, or browse only; everyone can view every list.
- Remember participation in existing account metadata, with editable/withdrawable location and no GPS collection.
- Read all scopes directly from Supabase; apply the separately approved function migration without tables or existing-progress changes.
- Verify consent, browsing, all scopes, filters, paging and withdrawal in actual SQL and focused browser checks; keep rank-based rewards disabled.

### 16 October — Functional leaderboard

- Replace the empty cache read with authenticated live global/domain rankings, pagination, real counts and full-board own rank.
- Respect Settings opt-out and publish only shortened names and ranking fields; keep all private profile policies intact.
- Add manual/focus/minute refresh, errors/retry and honest empty/category/privacy states. Regional rankings await optional location data.
- Apply the explicitly approved read-only database migration; validate actual SQL, hosted permissions and focused browser flows. No profile/reward backfill or rank-based profession write.
- Prevent account-form submission before initialization and use POST as the non-JavaScript fallback.

### Architecture and documentation

- Registered initiative ZEC without renumbering historical milestones.
- Preserved the expansion directive and original v1 specification.
- Audited all thirteen engines and documented the missing trusted progression boundary.
- Created version 2 of the expanded blueprint with explicit quest/mission, narrative, identity, world and security responsibilities.

Implementation and verification entries are added as each phase is completed. No production changes are part of this release yet.

### Mission policy and map correction

- Resolve missions from seven qualifying completions rather than streaks; preserve historical mission records and bank excess progress.
- Reuse stable mission plan identifiers and preserve unfinished challenges/drafts across days.
- Require two or three linked steps in generated missions; keep fallback challenges playable.
- Label map rendering pages as segments and draw mission markers from actual progress.
- Remove absence-related character fading. Existing streak/EXP mechanics remain separate.
- Added mission-domain regression tests; trusted transactional reward persistence remains unfinished.

### Local trusted completion foundation

- Added an authenticated, disabled-by-default completion route that accepts response input and derives gameplay outcomes from stored records through existing engines.
- Added service-only SQL completion, immutable outcome/event records, revision conflict handling and expiring grading leases.
- Generated the additive expansion migration with the Supabase CLI and validated its actual SQL, RLS, rollback, replay and trusted service using embedded Postgres.
- Preserved the legacy client path pending a coordinated mutation/privilege cutover. No new permanent world or cosmetic rewards are enabled.
- Fixed failed ordinary quest retries, skipped mission handling and calendar achievement checks for extra same-day missions.

### Profile and appearance

- Added validated display/character-name editing, field-only persistence, save/discard/error states and account-scoped draft recovery.
- Added centralized workspace light/dark/system themes, account-scoped preference caching/sync and explicit reduced motion.
- Added native accessible confirmation dialogs and theme-aware grade/radar colours.
- Preference synchronization is verified locally; hosted migration and private-screen visual checks remain pending.

### Documentation and release limits

- Finished M2's local settings/theme work, including offline preference retry and actual discard-on-leave. Added shared domain/rarity tokens and corrected light dashboard surfaces.
- Added voice recording with editable transcripts, local audio playback, language selection and recovery for quest/mission replies; transcripts reuse existing saved drafts and grading.
- Overview now shows all six existing stats in three desktop/two phone columns.
- Local browser checks passed against a disposable account backend using synthetic microphone input. Hosted migration and live speech accuracy remain separate checks. Further testing after the final defensive cleanup is deferred at the owner's request.

- Added the versioned Lore Bible, trusted progression cutover guide and detailed development report.
- Delivered the v2 blueprint and development report as Markdown at the owner's request; preserved the original v1 Word document unchanged.
- Dependency audit reports 16 vulnerable entries, including one critical; framework/toolchain hardening remains a release blocker. No force upgrade, deployment or production data change was performed.
