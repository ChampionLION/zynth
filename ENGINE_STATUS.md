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
