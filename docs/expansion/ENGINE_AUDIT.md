# Evolution and Chronicles implementation audit

Date: 15 October 2026. Initiative: ZEC. Baseline commit: `0c1e668`. This audit distinguishes local algorithm verification from production authority. A passing browser algorithm is not a secure reward boundary.

## Repository discovery

The working tree was clean. Work continues on local branch `feature/evolution-chronicles`; publishing, deployment, paid calls, and live data changes are outside this directive's authorization.

Installed versions, verified with `npm ls --depth=0`: Next.js 14.2.35 App Router; React/React DOM 18.3.1; TypeScript 5.9.3; Supabase JS 2.110.7; Zustand 5.0.14; Tailwind 3.4.19; Framer Motion 12.42.2; Zod 4.4.3. These support local expansion development; the subsequent dependency audit requires coordinated security upgrades before release. Components live in `src/components`, routes in `src/app`, engines in `src/lib/engines`. Styling mixes Tailwind tokens with hardcoded workspace/public CSS at baseline.

At discovery, Supabase email/password sessions were verified through `auth.getUser`; account hydration restored profile, onboarding draft, active quest and response drafts. The only server route was the model proxy, which authenticated but accepted a caller-built prompt. Grading, math, achievement rewards, profile writes and quest retirement ran in the browser. RLS isolates accounts, but permits users to edit their own numerical progression. Authenticated ownership is not proof that a reward is legitimate. The implementation delta below records the staged new route; the active client trust limitation remains.

Read-only hosted inspection found nine public tables with RLS enabled: profiles, quests, events, exploit_log, hidden_skill_signals, profession_evolutions, leaderboard_cache, daily_profile_questions, onboarding_drafts. Migration history contains `initial_zynth_accounts_and_journeys` and `restrict_internal_rls_trigger`. No user responses or credentials were inspected. Existing policies permit owner-scoped ALL operations on profiles/quests and most event tables; leaderboard is publicly readable. No expansion schema or live changes were applied.

## Engine audit matrix

“VERIFIED” below means the cited local checks, not full production acceptance. Primary status identifies the most important remaining boundary.

| Engine | Status | Implementation and interface | Data and event dependencies | Database and tests | Limitation and expansion reuse |
| --- | --- | --- | --- | --- | --- |
| 1 Onboarding | PARTIALLY IMPLEMENTED | `onboarding.ts`: definitions, validation, scaffolding; `llm/client.ts`: classifyOnboarding | Aspiration, four scenario choices, validated model signals → initial profile | profiles/onboarding_drafts; smoke and account integration suites | Retain current questions. Classification and scaffolding remain browser-owned; secure creation needs a trusted route. |
| 2 Quest Generation | NEEDS REFACTORING | `quest.ts`: resolveQuestType/resolveQuestPlan; client generateQuest; dashboard | Profile, adaptive state, history → content and active quest | quests; resolver/fallback checks | Streak-based missions and adaptive type overrides need reconciliation. Generation locks are tab-local. Reuse for missions; no new Mission Engine. |
| 3 Grading | NEEDS REFACTORING | `pipeline.ts`: runPostGradePipeline; client gradeResponse | Stored quest, response, validated grade signals → numerical profile and events | profiles plus quests, separate saves; pipeline tests | Caller supplies profile and grade locally. No database transaction, durable result, cross-tab idempotency or trusted completion yet. |
| 4 Behavioral Stats | PARTIALLY IMPLEMENTED | `stats.ts`: runStatEngine/applyStatDeltas/checkWeaknessOvercome | Bounded behavior window, onboarding floor, streak event | Profile JSON; floor/regression tests | Core stat updates work; domain stat behavior and prestige floors remain unresolved. Reuse unchanged in trusted pipeline. |
| 5 Progression | PARTIALLY IMPLEMENTED | `progression.ts`: EXP, levels, titles, unlocks, prestige | Grade/type/streak/prestige/penalty → EXP, level events | Profile JSON; math, rollover and prestige tests | No level cap; 1000+ title is static. Browser persistence is not authoritative. Chapters must consume, not replace, these calculations. |
| 6 Hidden Skills | PARTIALLY IMPLEMENTED | `hiddenSkills.ts`: text and event checks | Domain text counters and actual history → discoveries | Profile counters/history; resilience timing tests | Heuristics, not proven personality traits. Reuse discoveries for story/cosmetics without inventing skills. |
| 7 Anti Exploitation | NEEDS REFACTORING | `exploit.ts`: runExploitCheck/recordExploitFlag | Response, elapsed time, last responses → flags, penalty or rejection | Profile flag JSON; duplicate and timing checks | Browser can forge timing/flags. Server must read stored quests and enforce idempotency/rate limits. |
| 8 Context Compression | PARTIALLY IMPLEMENTED | `compression.ts`: buildCompressedContext | Profile, last grades, summary, ten answers, level-gated memory | No direct DB writes; prompt/context tests | Skills and some text are not strictly token-bounded. Add bounded narrative facts, not transcripts. |
| 9 Memory | PARTIALLY IMPLEMENTED | `memory.ts`: milestones, bests, snapshots, struggles | Verified pipeline events, summaries | Profile memory JSON; milestone gating checks | Histories grow inside profile; fastest-level record incomplete. Narrative history belongs in indexed records. |
| 10 Economy | PARTIALLY IMPLEMENTED | `economy.ts`: award/spend/prune cards and tokens | Existing achievements, streaks and performance | Profile balances/grant ledger; expiry, cap and debit tests | Several spending actions lack UI; all writes untrusted. Do not add cosmetic purchases. |
| 11 Achievements | PARTIALLY IMPLEMENTED | `achievements.ts`: catalog/checkAchievements | Updated history, level, skills, streak → once-only cards and UI events | Profile unlocked list; duplicate and calendar tests | Once-only within a profile snapshot, not concurrent transactions. Cosmetic grants must consume trusted unlocks. |
| 12 Adaptive Intelligence | PARTIALLY IMPLEMENTED | `adaptive.ts`: detectUserState and prompt injections | Recent behavior, grades, current energy and absence | Profile adaptive fields; absence/stale-energy tests | Descriptive heuristics. Reuse difficulty adjustment, keep mission eligibility independent. |
| 13 Continuous Profiling | PARTIALLY IMPLEMENTED | Dashboard answers; client getDailyQuestion; compressed insights | Optional question/energy → stored answers → later quests | Profile answers; context and hydration tests | No full long-term recalibration/rotation implementation. Optional answers must not gate core play. |

## Existing presentation and expansion gaps

- Mark Map: shared SVG terrain and winding checkpoint path, same art behind Overview; daily marks deduplicate successful days. Fourteen-mark view windows are called chapters and every seventh mark is drawn as a mission even when no mission occurred. Both labels must be corrected before narrative integration. Keep horizontal landscape navigation.
- Chronicle: private quest history and labeled illustrative community responses. No narrative chapters, decisions or persisted archive. Do not remove history or imply examples are live people.
- Identity: profession, domain, skills, hidden skills, radar and stats. The dashboard has an anonymous silhouette with absence dimming. No avatar editor, equipment, cosmetics or room catalog.
- Settings: character name saves on blur without error handling; leaderboard switch; sign out and destructive reset. No display-name editor or theme preference.
- New engines 14–18: SPECIFIED ONLY at audit baseline. World, evolution, avatar, narrative and inventory must remain distinct consumers of verified progression. There is no authoritative cosmetic ownership today.

## Mission eligibility and transition policy

The initial qualifying set is calibration, daily, challenge, hidden, weakness and prestige quests graded Basic, Good or Excellent. Fail and Bad are excluded from mission credit; their historical EXP/streak effects are preserved. Missions, skips, abandoned/rejected submissions and unknown future types do not count. Swift Mode completions and retests cannot be counted until their separate attempt semantics exist; the current UI submits neither. Deduplicate by quest ID. This deliberately defines successful mission credit more strictly than v1's non-Fail streak update.

Replay known history in chronological order. Preserve every historical mission and XP record. A successful historical mission consumes up to seven accumulated credits, never produces debt and never fabricates an additional completed mission. Excess regular completions remain banked; only one mission is pending at once. A failed mission consumes no credits. A legacy unfinished mission may be resumed without asking for seven new quests. History of uncertain provenance is grandfathered as legacy, never promoted to verified reward evidence.

Missions are multi-step playable quests, slightly harder than the ordinary adaptive plan. At the top of the five-pip scale use scope/steps rather than an out-of-range difficulty. The seven-quest counter grants no streak bonus. A mission conclusion does not automatically conclude a narrative chapter.

## Security and migration dependency

Before new permanent world/cosmetic grants are enabled, trusted server completion must load stored profile/quest, run exploit/grading/math, and commit profile, quest outcome, mission state and deduplicated events in one transaction. Browser UPDATE/INSERT access to progression fields must be removed in the same coordinated rollout. Protect onboarding, legacy import, skip, prestige and daily updates too; simply revoking writes breaks those existing flows.

Prepare migration SQL and test it in an isolated database. Applying production migrations is expressly prohibited by the directive. No separate event broker, paid model or hosted service is needed. Full concurrency acceptance requires real Postgres tests in addition to injected repository tests.

## Baseline evidence

`npm test` passes before implementation: 68 engine/regression assertions, the 500-combination onboarding sweep, and account integration tests using the real SDK with a simulated backend. The hosted email confirmation/reset workflow and authenticated real writes were not repeated. Existing production was not modified.

## Feedback traceability

David A: restoration layers and spatial rewards → ZEC-M5/M6/M9. David B: editable names, prominent avatar, shorter bars, environment and equipment → M2/M3/M4. David C: light/dark and Atlas Skins → M2/M4/M6. Owner expansion: seven qualifying quests, playable missions, flexible chapters, continuous world releases, profession/skill/title reuse and overarching Chronicles → M1/M5/M7/M8/M9/M10. Preserve these distinct sources.

## Current implementation delta

The matrix above records the discovery baseline. Engine 2's mission policy and map terminology have since been corrected and tested, including skipped mission retries and distinct ordinary retry IDs. Engine 3 now has a staged trusted completion service, authenticated route, durable SQL outcome/event transaction, revision checks and a database grading lease. The actual SQL and service pass embedded Postgres tests; the existing browser path has not been cut over and is still untrusted. Engine 11's calendar grouping now accommodates multiple successful same-day challenges. None of these changes makes engines 14–18 implemented.

Settings now supports safe field-only edits, account-scoped appearance caches and light/dark/system/reduced-motion controls. The generated expansion migration creates protected preferences and trusted progression foundation tables; it is prepared and locally tested, not applied to Supabase. See `TRUSTED_PROGRESSION.md` for the remaining coordinated cutover. A dependency audit also identifies a critical Next.js/toolchain hardening task under M11; a passing build is not release security approval.
