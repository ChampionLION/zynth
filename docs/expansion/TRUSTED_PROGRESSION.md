# Trusted progression foundation

15 October 2026. Status: locally implemented and tested foundation; **not a completed security cutover**. Do not enable new permanent cosmetic/world rewards from browser-owned profile claims.

## What now exists

- Engine 2's mission projection, stable plan IDs, retries, banked credits and eligibility tests.
- `src/lib/server/complete-quest.ts`: strictly accepts a quest ID and response, loads actual stored records for a verified owner, checks all mission steps, computes exploitation and existing pipeline math, and commits through a repository boundary. Caller grades, EXP, profiles, timing and eligibility are rejected. Optional message/name/summary enrichment uses existing deterministic fallbacks and cannot block the transaction.
- `src/app/api/journey/complete/route.ts`: verifies the Supabase session before creating a server-only service client. No service credential is added to public variables or source. It constructs grading prompts from stored content. Live model failure returns an error, never a hidden practice reward. Model mode must explicitly be `live` or `practice`.
- `completion-repository.ts`: owner-scoped reads and RPC adapters. The SQL commit uses revision checks and row locks; repeated completion returns the stored result with the latest profile. Settings fields are preserved. Profile, quest outcome and durable event records are committed in one statement/transaction.
- Database leases suppress simultaneous grading calls. A failed provider releases its own lease; a two-minute expiry permits recovery if the process dies. Lease cleanup failure cannot undo a committed outcome.

The existing browser still uses its legacy grading/persistence path. The new route is staged and disabled by default. Merely enabling the route does **not** remove the existing ability to edit one's own profile numbers.

## Migration

Generated with the official Supabase CLI: `supabase/migrations/20261015204720_evolution_foundation.sql`. It adds user preferences, profile revisions, quest outcomes, progression events and submission leases. New tables have RLS and explicit grants; completion/lease functions use SECURITY INVOKER and are executable only by service_role. It is additive for existing data. No hosted migration was applied.

The earlier `user_preferences.proposed.sql` remains a historical draft and must not be applied in addition to the generated migration. The generated migration supersedes it.

## Local database verification

`npm test` executes `database.integration.test.ts` in PGlite, an embedded Postgres runtime. It creates isolated Supabase-like auth roles and the baseline schema, then applies the account and expansion SQL. Assertions cover:

- Preference ownership, another account's reads and unauthorized writes.
- Browser/anonymous inability to execute trusted completion or insert outcome records.
- Idempotent completion replay and once-only event insertion.
- Profile revision conflict and ownership mismatch.
- Failure during event insertion rolling back profile and quest changes.
- The full trusted service using actual SQL, one grader call under repeated concurrent submissions, rejected forged grade input, account isolation, replay after completion and provider-failure lease cleanup.

PGlite serializes its requests. This verifies actual Postgres constraints/transactions and concurrent service requests against one embedded connection. It does not replace separate-connection/distributed race and hosted RLS verification.

## Server configuration for a future reviewed cutover

- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret configured directly in the hosting environment. Never use a NEXT_PUBLIC prefix or commit a value.
- `ZYNTH_TRUSTED_COMPLETION=1`: staged route gate. Keep unset until the full cutover below is ready.
- `ZYNTH_MODEL_MODE=practice` or `live`: explicit evaluator mode. Do not silently change a live failure to practice.

No credential value was requested, fetched or committed for this foundation. No live model call or paid service was used.

## Required next work before secure activation

1. Move onboarding/scaffolding and legacy-import handling to a trusted route; imported browser history is legacy evidence, never a verified grant.
2. Move quest planning/generation, skip, prestige, daily check-in and profession evolution mutations behind validated server actions. Generation needs its own durable user/plan lease and stored attempt identity, including skips.
3. Wire the client to trusted responses and durable grade/event recovery, without re-upserting the resulting profile from the browser.
4. Coordinate column-level grants and owner RLS: authenticated clients may patch editable settings/drafts/preferences, but must not write progression, quest definitions/outcomes, rewards or event ledgers. Closing one route while leaving profile writes open is insufficient.
5. Add end-to-end and separate-connection Postgres race fixtures for all mutating flows. Test upgrades with old profiles, pending quests, skips, failed attempts and prestige.
6. Only then connect inventory, discoveries and narrative transformations to verified durable events. Prepare any privilege migration with the CLI and obtain explicit authorization before a hosted rollout.

## Known timing and history limits

The trusted service uses server-observed quest issuance age, not the browser's timer. This prevents caller-controlled elapsed-time claims but does not prove active work duration. Paused-session timing requires an explicit server session model if later needed. History remains the legacy profile array for compatibility; new outcomes/events are separately indexed. Migrating old unbounded arrays into pages is future work and must preserve their content.
