# Zynth engine connections and verification

Reviewed against `docs/blueprints/blueprint_extracted.txt` on 13 October 2026. This is an implementation status record, not a claim that every blueprint feature is complete.

## Verified local connections

1. **Onboarding:** answers → classification → schema validation (live responses) → application-owned initial skill values → profile persistence → reveal. Starting-stat validation now enforces uniqueness, range, and total.
2. **Quest generation:** dashboard → adaptive detection → type/difficulty resolver → compressed profile → generation/fallback → active quest → quest screen. Generation is locked against duplicate requests and waits for the daily check-in decision.
3. **Grading:** response → exploitation check → grading → post-grade pipeline → persistence → reveal → events. Rejected submissions and repeated quest IDs cannot enter the reward pipeline. Live grading failures now leave the response available for retry instead of silently awarding mock grades.
4. **Behavioral stats:** grading signals → capped behavior log → window-based deltas → onboarding floors → changed-stat reveal. Weakness-overcome events now also update the stored signature.
5. **Progression:** grade/type/streak/prestige/penalty → EXP → level rollover → unlocks and events. Repeated prestige correctly accumulates the foundation bonus and uses the capped economy grant ledger.
6. **Hidden skills:** text counters and behavior/history detectors → discovery → reward and milestone → event. Quest history is now appended before event detectors so Resilience appears on the qualifying submission.
7. **Anti-exploitation:** timing, duplicate text, and low-effort history → rejection or multiplier/strict-grading inputs → flag log. Client-side checks are not a production security boundary.
8. **Compression:** profile, recent grades, cached summary, daily answers, and level-gated memory → generation/grading prompts. Domain-stat keys no longer overwrite core-stat keys with the same name.
9. **Memory:** pipeline → milestones, struggle tracking, personal bests, snapshots; context becomes available at level 20. Pattern summary now receives the refreshed summary every 20 quests. Fastest-level-up bookkeeping remains incomplete.
10. **Economy:** pipeline achievements/streaks/discoveries → grants → capped balances; quest skip → token debit. Spending now consumes grants in expiry order, preventing already-spent cards from expiring again. Negative spends are rejected.
11. **Achievements:** updated quest history and discovered skills → once-only checks → cards and events. Flawless Week now requires consecutive calendar days.
12. **Adaptive intelligence:** recent behavior, grades, absence, and current-day energy → state → generation instructions and difficulty. Stale energy readings no longer influence the current day.
13. **Continuous profiling:** daily check-in → persisted answers → compressed quest context. Verified that answer labels reach generation context.

## Remaining implementation gaps

- Resolved 15 October: email/password Supabase sessions now protect private profile, quest, and onboarding storage. Production email redirects and a real inbox-driven walkthrough remain to verify.
- Profile math and persistence run in the browser. Production ranking requires server-owned transactions and validation; duplicate checks here protect the local flow, not concurrent or hostile clients.
- Model requests now require a verified Supabase session. Per-account rate limiting and trusted server-owned reward transactions remain incomplete.
- Live leaderboard refresh/aggregation job is absent. The local board uses sample players, now visibly labeled, and respects opt-out. Live cache pagination/current-user lookup remains incomplete.
- Swift Mode is unlocked in data but has no quest UI. XP-card spending helpers exist, but retest, bonus quest, upgraded hint, and reduced-difficulty actions are not wired to screens.
- Event queue and grade reveal remain memory-only. Quest responses, mission steps, elapsed time, and partial onboarding now save to the account; a durable offline grading retry queue is not implemented.
- Community Chronicle contains illustrative examples, now labeled, rather than live community responses.
- Hugging Face fallback and generated level-1000 titles are absent. Provider timeouts have been added to Gemini/Groq.
- Domain attributes do not yet have a behavioral update policy. Skill-evolution tier labels and permanent floors after prestige need product clarification to fully reconcile the blueprint.
- The 15 October account update verified enabled signup/email confirmation, anonymous database access restrictions, all-table RLS, and clear security advisories on the connected Supabase project. Authenticated browser writes, inbox callbacks, and real model output still need end-to-end verification.

## Validation

Run `npm test` for the compiled TypeScript smoke and regression suite. It covers the local end-to-end grading pipeline, EXP rollover, seven-day streaks, duplicate detection, card expiry/spending, prestige, hidden-skill timing, schema constraints, stat floors, memory gating, daily-profile context, and leaderboard opt-out.

Desktop and 390 × 844 mobile dashboard layouts were visually inspected. The browser flow through local identity, all five onboarding questions, profile reveal, dashboard, and daily energy/profile answers was exercised. Further browser testing was interrupted by the browser approval service timing out.

## Interface changes

Desktop sidebar; responsive wide dashboard with progress overview, featured quest, attributes, identity, and resources; mobile bottom navigation; wider secondary pages; split-screen welcome; improved contrast, focus states, reduced-motion support, and restored browser zoom. Layouts are fluid, not locked to a fixed aspect ratio, so standard widescreen browsers and portrait phones remain usable.

## 14 October 2026 update

Onboarding now collects a written aspiration and four ordinary scenarios; mock classification and live prompts share their definitions. The aspiration is optional on old profiles and reaches quest context on new profiles. Existing live databases require `supabase/migrations/20261014_onboarding_aspiration.sql`; no external migration was run.

Mark Map and the Overview backdrop share terrain/checkpoint geometry. Map progress now counts successful quest days, not failed attempts or same-day retries. The blueprint checkpoint states and mission landmarks remain, with world regions and fourteen-mark chapters added.

All 68 local checks, the 500-combination onboarding sweep, lint, TypeScript, and the production build pass. Shared map artwork was rendered and visually inspected; the new interactive interfaces were not browser-verified because the browser runtime could not initialize. See `PROGRESS.md` and `MILESTONES.md` for the current progress record.


## 15 October 2026 account update

Public landing and email/password access now lead into the existing engines. Authenticated identity replaces local identity; account hydration restores profiles, current quest drafts, and partial onboarding. Practice/AI mode no longer controls database synchronization. The new integration suite verifies account continuity and isolation using the actual SDK with a simulated backend. See PROGRESS.md and docs/DEPLOYMENT.md for live checks and release status.

## ZEC expansion working branch — 15 October 2026

Current detailed engine matrix: `docs/expansion/ENGINE_AUDIT.md`. Historical findings above are retained; the following supersedes their mission/map wording.

- Engine 2 now projects seven qualifying unique completions into a pending playable mission, with banked credits, legacy compatibility, retries, stable plan IDs and explicit Swift/retest/failure exclusion. Streaks remain separate. Successful additional same-day missions no longer break the calendar-based Flawless Week check in Engine 11.
- Mark Map uses fourteen-mark **segments**, not narrative chapters, and mission markers reflect actual progress. Unfinished challenges retain their drafts across days. Returning users no longer fade.
- Engine 3 has a new staged server completion boundary and service-only atomic SQL commit, immutable outcomes/events, grading leases and version checks. `database.integration.test.ts` executes the real SQL and full trusted service in embedded Postgres. This is a locally verified foundation, not a completed production security cutover: current client writes and other mutation flows remain to migrate.
- Profile settings patch only editable fields and preserve concurrent numerical progress. Free light/dark/system themes and explicit reduced motion are implemented. The preference migration is prepared and locally SQL-tested, not hosted.
- Engines 14–18 are still SPECIFIED ONLY. Canonical lore documentation exists; runtime chapters, avatar/equipment, inventory and modular living regions are not implemented.
- `npm audit` reports 16 vulnerable package entries (1 critical, 13 high, 2 moderate), including Next.js and the existing styling/lint toolchain. No force upgrade was performed; framework/toolchain hardening is a release acceptance blocker under ZEC-M11.

No remote push, deployment, hosted migration or live user-data mutation is part of this branch's authorization. See `docs/expansion/TRUSTED_PROGRESSION.md` and the current development report for exact continuation work.

M2 follow-up: settings/themes now pass local browser interaction checks against a disposable account fixture, including offline preference recovery and discard-on-leave. Overview exposes all six stored stats. Voice replies transcribe to editable text and reuse existing drafts and Engine 3/pipeline grading; audio remains page-local. Synthetic-microphone browser checks completed both ordinary quest and mission grading. This adds no new engine or reward rules. Further testing after the final defensive cleanup is deferred at the owner's request; hosted preference sync and live speech-provider accuracy remain unverified. See `docs/VOICE_REPLIES.md`.

16 October leaderboard update: global/domain ranking reads now use `get_live_leaderboard`, not the empty cache. Real counts, pagination, full-board own rank, bounded refresh and Settings opt-out are implemented. The owner approved the additive migration, which is applied and read-only verified on Supabase; no user progression was changed. Local SQL and real UI/SDK fixture checks pass. Regional boards lack location preferences and are explicitly deferred. Rank-based profession/reward writes remain disabled pending trusted progression. See `docs/LEADERBOARD.md` for privacy boundaries, advisor findings and evidence; this supersedes earlier aggregation/current-user lookup gap notes.

16 October follow-up: the restored four-scope leaderboard uses get_leaderboard directly from Supabase, with first-visit opt-in, optional coarse regional membership and unrestricted browsing. Existing cache/state tabs remain. The separately approved migration is applied; Global-only users are excluded only from regional participation, never regional viewing. Ranking reads grant no rewards/profession changes. See docs/LEADERBOARD.md for current behavior and evidence; this supersedes the deferred-regions note above.

## 16 October 2026 — Step 1 implementation and Global default

Server-owned onboarding/private legacy archive, persisted generation plans, all existing gameplay mutation service paths and durable grade/event recovery are implemented behind a coordinated gate. Actual PostgreSQL separate-connection checks pass for overlapping generation/completion/skip requests, replay and revision conflicts; injected failures roll back quest/token changes. The real browser → Next → SDK → PostgreSQL fixture restores drafts and committed outcomes after a lost reply without duplicate rewards. Existing engine/account/voice suites, leaderboard SQL/UI checks, lint and the 29-entry production build pass. Phone settings/leaderboard layouts were inspected, and browser bundles contain neither local fixtures nor server credential names.

The owner approved the foundation, actions and privilege-cutover migrations and activation after readiness checks. The compatible app is being published gated off; production activation waits for privately configured server credentials and the coordinated checks in docs/expansion/STEP1_ROLLOUT.md. Existing cloud progress stays in place; uncertain imported history never becomes new verified grant evidence. No hosted quest/reset/test-user mutation is used for release verification.

The separately approved Global query is applied and read-only verified: all three verified saved profiles appear, including two at zero EXP. Settings opt-out is respected; optional approximate regional membership and unrestricted browsing remain. No user record was changed for this ranking fix.

Weighted completion is 37/100 (37%); M1 is 21/22 (95%), with the final hosted activation point pending. M1-F was split into 2 local evidence points and 1 activation point, keeping the denominator unchanged. M11 dependency audit preparation was refreshed: the same 16 vulnerable package entries remain unresolved, so no hardening credit is added.
