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

Local implementation and required local checks pass. Hosted activation is pending the privately configured server credential and coordinated release. Overall weighted progress is 37/100 while M1's final production activation point remains open. Update this state only with actual deployment, migration and permission evidence.
