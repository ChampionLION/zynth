# Step 1: trusted progression rollout

Updated 16 October 2026. The owner has explicitly authorized all three Step 1 migrations and activation after configuration and checks pass. This document separates local evidence from hosted activation. The Global leaderboard update has separate approval and is already applied.

## Scope and evidence

Server actions derive onboarding, stored quest plans, grading, skip costs, energy/check-ins, prestige, profession eligibility and the existing implemented card effects from persisted records. Strict input schemas reject caller-provided XP, grades, eligibility, timing and quest definitions. Typed replies and reviewed voice transcripts use the same completion path. New outcomes and presentation acknowledgements survive a lost response and reload.

Existing cloud profiles/quests remain in place. A private baseline snapshot preserves their original state before trusted mutations. Browser-only imports are archived privately and remain downloadable; they cannot overwrite cloud scores or become verified grant evidence. Legacy mission eligibility remains playable, with provenance excluded from new verified mission credits. No progress reset or user backfill is part of this rollout.

Local evidence: existing engine/account/voice suites, actual SQL tests, separate PostgreSQL connections for generation/completion/skip races and revision conflicts, injected transaction failure, provider failure, replay, owner isolation, restricted column grants and reset replay. The browser-to-Next-to-SDK-to-real-Postgres fixture proves draft restoration, a lost committed reply, durable grade/events and editable settings without XP changes. Fixtures use synthetic accounts and loopback hosts only. They do not prove hosted inbox delivery or real microphone recognition.

## Production discovery

Read-only inspection found three verified accounts and three saved profiles, two at zero lifetime EXP. The approved Global query now returns all three, honoring Settings opt-out and requiring location consent only for regional participation.

The new expansion foundation was absent: no user_preferences, quest_outcomes, progression_events, quest_submission_leases or progression_revision column. Authenticated profile/quest writes were still broad. This is a newly inspected schema delta, not a request to repeat the owner's earlier migration or SMTP setup.

Vercel target: championlions-projects/zynth, project prj_QPxos3AVIGXk73axBpLXVGHqEhUh. The owner corrected authentication to this account. Production was configured with public Supabase credentials and mock mode only; a server-only credential is required before activation. Never print or commit its value.

## Exact migration order

1. `supabase/migrations/20261015204720_evolution_foundation.sql`: preferences, revision guard, immutable outcomes/events and completion leases.
2. `supabase/migrations/20261016105454_trusted_journey_actions.sql`: persisted action plans/leases, private snapshots, mission projection, rate budgets, reset receipts, service-only actions and durable presentation. Its configuration starts with trusted_writes=false.
3. `supabase/migrations/20261016105458_trusted_journey_cutover.sql`: revoke browser progression/definition writes, retain owner SELECT and field-only settings/drafts, then set trusted_writes=true. Never apply this independently.

The separate `20261016111757_leaderboard_global_by_default.sql` is already applied and must not be reapplied. Do not apply the superseded user_preferences.proposed.sql draft. Record hosted migration versions and local file hashes in release evidence.

## Coordinated release

1. Pass local suites, lint and production build; inspect mobile layout and browser bundles for local fixtures/server credentials. Record production schema/migration inventory and aggregate profile/quest/status/EXP totals immediately before DDL. Additive migrations preserve existing records; these checks are not a claim of an independently restored full database backup.
2. Verify the exact Vercel project. Set SUPABASE_SERVICE_ROLE_KEY privately as a Production Secret. Set ZYNTH_MODEL_MODE=practice to preserve the existing mock experience; live mode requires separately configured providers and never silently substitutes practice grades.
3. Apply foundation then actions under the owner's authorization. Confirm all original counts/totals remain unchanged and the DB activation flag is false. Publish the compatible application with ZYNTH_TRUSTED_COMPLETION off first; verify exact deployed commit and public/authentication boundaries.
4. Set ZYNTH_TRUSTED_COMPLETION=1 and redeploy that compatible commit. During the short cutover, journey requests return a safe retry state until the database flag is ready. Apply the separate cutover only after that deployment is ready. Old browser tabs are prevented from writing numerical state by SQL permissions and must reload.
5. Read back permissions: authenticated cannot insert profiles/quest definitions or update XP; may update names/privacy and drafts with owner RLS. Anonymous access and direct service RPC execution stay denied. Confirm all exposed new tables have RLS and secret values are absent from browser bundles. Run security advisors and account/migration count checks.
6. Verify public pages, unauthenticated API rejection, the live three-account Global board and configuration flags. A hosted authenticated quest/recovery walkthrough requires an authorized test account; record it separately instead of modifying a real user's progress for a smoke test.

## Recovery

Before the cutover, leave both gates off if credentials/configuration are incomplete. Foundation/actions can remain installed harmlessly with the DB flag false and no gameplay changes.

After the cutover, use maintenance/retry mode and fix forward if verification fails. Do not redeploy an old browser-writing app or restore broad profile grants after trusted events begin. Preserve profiles, quests, snapshots, outcomes and action receipts; never delete them as a rollback shortcut. Inspect failed action leases, revision conflicts and cached outcomes before retrying. A lost response can already have committed, so clients recover saved outcomes rather than creating another reward.

Reset remains an explicit existing Settings action, owner-scoped and receipt-idempotent. It is not used in production rollout verification.

## Remaining boundaries

Swift/retest/bonus interfaces, future cosmetic/world/chapter grants and unbounded historical arrays remain outside this Step 1 implementation. New inventory/narrative features must consume verified events. The refreshed dependency audit still reports 16 package entries (1 critical, 13 high, 2 moderate); upgrade preparation earns no resolved-hardening credit. M11 remains open.

## Release state

Local implementation and required local checks pass. The foundation and actions migrations are applied under the owner's approval (hosted versions 20261016113018 and 20261016113049). Read-back preserves 3 profiles, 4 quests and lifetime EXP total 30, with zero trusted outcomes and the DB activation flag false. All 10 new public tables have RLS. The compatible gated-off app at commit 0bdc38da81c6758b988c803849d255156f55d672 is production-ready and public/authentication smoke checks pass. The owner saved a Production Secret; practice mode and the server gate have been configured, with a redeployment preceding the final cutover. Overall weighted progress remains 37/100 until the final activation read-back passes.

Local migration SHA-256 records:

- Foundation: 67DE1FECD51D1C8409499813B201DCCC77FAF4B538FB518B23615122B24059FF.
- Actions: 8B5807C636E3F15386914F2FDEDA8ADDF2B5321BBA180D935B34B6927A612A3F.
- Cutover: 0D010874608A4837AF6F8B4454DC19EB1B7A999C697B99CF3062D261BFD67957.

Advisor review: service-only leases/actions/configuration/budget/reset tables intentionally have RLS with no client policies and no client grants ([deny-by-default notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). The narrow cross-account leaderboard function retains its intentional [authenticated SECURITY DEFINER notice](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). The pre-existing [leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains unchanged. No missing-RLS finding was returned.

## 2 November 2026 — Step 1 production activation

Resumed the owner's paused Supabase project with explicit permission. Verified the compatible production deployment dpl_54T8yZ1eMwN2WhYNjjHgULgKDVoC at application commit 0bdc38da81c6758b988c803849d255156f55d672 and the production alias. Confirmed the non-secret server gate is 1 and grading mode is practice, preserving the existing mock experience; Production Secret values were excluded from the configuration export.

Applied the previously authorized trusted_journey_cutover migration (hosted version 20261102131859). Read-back confirms trusted_writes=true, browser XP and quest-definition edits denied, editable names/privacy and quest drafts retained with owner RLS. Profile/quest counts and aggregate lifetime EXP are unchanged across this cutover: 3 profiles, 4 quests, 30 EXP. The Global query returns 3 verified visible profiles, including zero-EXP entries. No real account was reset or graded for release verification.

Public pages/assets and anonymous API rejection checks pass. Local engine, account, voice, SQL, separate-connection and browser recovery evidence remains recorded from the implementation checkpoint. A real hosted signed-in quest/recovery and inbox walkthrough remains under M11; cross-session appearance verification remains M2. This activation does not complete those separate checks.

Weighted progress is now **38/100 (38%)**, with M1 **22/22 (100%)**. The final M1-F2 activation point is credited; the denominator and other milestone points are unchanged. Next: M2's hosted cross-session appearance/persistence proof, then M3 avatar work. Existing dependency hardening and future expansion engines remain open.
