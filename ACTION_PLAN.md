# Zynth milestone completion action plan

Updated: 16 October 2026 (Africa/Lagos).

## Goal and current position

Complete the ZYNTH EVOLUTION & CHRONICLES roadmap, ZEC-M0 through ZEC-M11, against the Complete Application Blueprint v2, retaining unchanged v1 progression rules and the owner's onboarding, landscape Overview map, voice replies and leaderboard additions.

**Current tracked completion: 37% — 37 of 100 weighted acceptance points. Remaining: 63 points.**

This is an initial planning estimate based on evidenced work packages, not elapsed time, lines of code, test coverage or production readiness. Weights reflect scope and risk; they are not promised durations. The existing account, landing, branding and leaderboard features are shipped foundations, not extra credits counted again in this expansion denominator. A plan, schema draft or passing build alone does not complete a feature.

The base app and leaderboard are live at the owner-approved production address. The separately approved Global-default query returns all three verified profiles. Step 1 local implementation/checks are complete, with production activation explicitly authorized and pending private server configuration and coordinated rollout. Hosted preference/inbox behavior still needs dedicated verification.

## Execution order

1. **Close M1's trust boundary first.** Complete every existing gameplay mutation on the server, durable recovery and real Postgres concurrency checks before removing client progression writes. Start the M11 dependency audit/upgrade preparation alongside this work.
2. **Close M2's last verification point.** Inspect actual hosted preference schema first; do not reapply an already completed migration. Verify names/themes survive sign-out, a second session and retry without changing XP.
3. **Deliver M3 then M4.** Ship a small default avatar/editor, then ownership-backed inventory and equipment. New grants depend on M1's verified events.
4. **Deliver M5 then M6.** Add a small versioned region package/atlas and permanent environmental changes. Reuse the landscape in Overview and Mark Map.
5. **Finish M7, then M8.** Build deterministic chapters around the existing lore, then truthful branches and the private paginated archive.
6. **Deliver M9 and M10.** Connect chapter outcomes to world changes, then prove a new content release works for existing players without resets.
7. **Close M11 and reconcile all acceptance criteria.** Verify the complete account-to-quest-to-world loop, security, accessibility, costs and compatibility; perform an authorized staged rollout with recovery evidence.

This is dependency order, not a promise to implement every milestone in one change. Each completed package updates the percentage and cites its evidence before dependent runtime features are enabled.

## Step 1 implementation and activation checklist

Local implementation and tests cover items 1–6 below. Item 7 is the remaining hosted activation gate; the owner has approved the three migrations and activation after checks. Follow docs/expansion/STEP1_ROLLOUT.md.

1. Inspect hosted migration history/schema read-only against the prepared foundation; record the actual delta and preserve existing accounts. Never assume all foundation objects are present or absent from an old note.
2. Add server-owned onboarding/scaffolding and conservative legacy import. The server derives identity, initial stats and allowed transitions; legacy records retain their history without becoming verified grant evidence.
3. Persist quest plans, mission cycles, generation attempts and leases. Concurrent tabs reuse one stored challenge. Failed generation keeps eligibility and drafts.
4. Move skip, check-in, prestige, existing economy spending and profession mutations to validated server actions. Quest retirement and token debit must commit together.
5. Route typed and reviewed voice transcripts through trusted completion. Remove browser re-upserts of returned numerical state; recover committed outcomes/reveals after reload or network loss.
6. Prepare the privilege cutover with allowlisted name/privacy/draft/preference writes. Exercise separate Postgres connections for duplicate completion, skip, generation and prestige, plus existing-user upgrade fixtures.
7. Prepare a rollout/rollback package, backups/count checks and the exact SQL diff. Apply production changes only with the required authorization. Activate the gate only when all existing actions work with client numerical writes denied.

**Batch exit:** a forged browser XP/grade/mission claim cannot change saved progression; two submissions commit one outcome and one reward; old accounts resume safely; all ordinary actions still work. Do not turn the current gate on merely because the staged completion route exists.

## Weighted acceptance checklist

Check a package only when its whole deliverable and relevant checks are complete. Partial work remains unchecked; split a package explicitly if finer progress is needed, preserving its total weight. IDs are stable for progress reports.

### M0 — Architecture and documentation: 5/5 points (100%)

- [x] M0-A — **5 points:** repository/engine audit, blueprint reconciliation, mission/legacy policy, versioned Markdown specification and integrated milestone map. Evidence: ENGINE_AUDIT.md, blueprint v2, existing baseline suites and M0 record.

Exit: the implementation has a common specification and known gaps. Audit completion does not resolve those gaps.

### M1 — Quests, missions and trusted progression: 21/22 points (95%)

- [x] M1-A — **4 points:** seven-quest eligibility, banking, retries, stable plan IDs, legacy mission preservation and map-label correction. Evidence: quest-cycle.ts, expansion.test.ts and recorded browser behavior.
- [x] M1-B — **4 points:** staged server completion, atomic outcome/event commit, revision checks and grading leases. Evidence: complete-quest.ts, foundation migration and database.integration.test.ts. Credit covers the tested local foundation only.
- [x] M1-C — **4 points:** trusted onboarding/private legacy archive, persisted server-owned quest/mission plans and generation leases. Evidence: journey-actions.ts, action migration, journey.integration.test.ts and real Postgres fixture; locally verified 16 October.
- [x] M1-D — **4 points:** atomic skip, prestige, check-in, profession and existing economy effect mutation paths preserving rules/balances. Evidence: service/SQL tests, failure rollback and replay checks; locally verified 16 October. Future Swift/retest/bonus interfaces remain M11 scope.
- [x] M1-E — **3 points:** gated client typed/reviewed-transcript integration, durable outcomes/reveals and network/reload recovery without numerical re-upserts. Evidence: verify-trusted-journey.cjs, browser → Next → SDK → real PostgreSQL; locally verified 16 October.
- [x] M1-F1 — **2 points:** prepared grants/RLS cutover, separate-connection generation/completion/skip races, existing-account upgrade and rollback/runbook. Evidence: verify-journey-postgres.cjs and docs/expansion/STEP1_ROLLOUT.md; locally verified 16 October.
- [ ] M1-F2 — **1 point:** authorized hosted activation and read-back of restrictive grants/configuration on the deployed compatible app. Owner approval received; private server credential and coordinated release pending.

Exit: gameplay authority is server-owned across every write path; replay is safe; original accounts/data and all quest types remain usable. M1-C through M1-F form one coordinated release boundary.

### M2 — Profile and appearance: 7/8 points (88%)

- [x] M2-A — **3 points:** validated field-only names, save/discard/error states, account-scoped draft recovery and navigation confirmation.
- [x] M2-B — **3 points:** shared light/dark/system themes, reduced motion, offline preference persistence/retry and all six Overview stats.
- [x] M2-C — **1 point:** SDK/SQL and desktop/mobile browser verification of the above. Evidence: verify-m2-voice.cjs, account/expansion suites and recorded screenshots.
- [ ] M2-D — **1 point:** verify the actual hosted preference schema and cross-session persistence/retry on an authorized test account, including unchanged numerical progress. The owner's setup confirmation is recorded; do not ask them to repeat completed setup.

Exit: names and appearance work locally and across hosted sessions; no progress can be edited through settings. Existing voice replies remain intact.

### M3 — Identity and avatar: 0/8 points (0%)

- [ ] M3-A — **2 points:** lightweight layered default avatar and coherent profile environment, with readable missing-asset fallback.
- [ ] M3-B — **2 points:** optional editor with preview, save, cancel, reset and account persistence.
- [ ] M3-C — **2 points:** equipment slots and locked-item display obey the ownership contract; appearance never alters stats or access.
- [ ] M3-D — **2 points:** desktop profile composition, stacked phone layout, keyboard/focus and reduced-motion checks.

Dependency: M2 and M1's persistence contract. Exit: a returning account restores its saved appearance; users can use the app without customization. Only default/free items are equippable until M4 ownership checks are live.

### M4 — Cosmetic inventory: 0/8 points (0%)

- [ ] M4-A — **2 points:** versioned item catalog, categories, previews, default items and explicit compatible slots.
- [ ] M4-B — **3 points:** server-owned grants from verified events, unique ownership and retry-safe ledger; no cosmetic purchases.
- [ ] M4-C — **1 point:** owned/locked/equipped filters and validated equip/remove actions connected to the avatar.
- [ ] M4-D — **2 points:** ownership/RLS, concurrent duplicate grant, source-event replay, wrong-slot and prestige-preservation tests.

Dependencies: M1 and M3. Exit: a client cannot grant an item or equip an unowned item, and replay cannot duplicate ownership.

### M5 — World expansion: 0/8 points (0%)

- [ ] M5-A — **3 points:** a small coherent package of stable region, connection and landmark definitions with versions and availability rules.
- [ ] M5-B — **2 points:** account-owned discovery and selected-region state derived from verified events.
- [ ] M5-C — **2 points:** atlas navigation, selected-region loading and reachable cross-region routes using existing landscape geometry.
- [ ] M5-D — **1 point:** locked/available/unknown-region, account isolation and old-player/new-package compatibility checks.

Dependency: M1 events. Exit: region discovery persists without fetching/rendering the full world or rewriting old accounts.

### M6 — Living Mark Map: 0/7 points (0%)

- [ ] M6-A — **3 points:** reusable environmental layers and durable per-region restoration from real mission/discovery events; chapter-driven changes connect in M9.
- [ ] M6-B — **2 points:** the same world state appears in foreground Mark Map and the landscape background of Overview, with textual change summaries.
- [ ] M6-C — **2 points:** idempotent replay, independent regions, reload/return, animation failure, skipping and reduced-motion verification; no inactivity decay.

Dependency: M5. Exit: state commits before presentation; revisiting or skipping an animation cannot lose restoration or replay rewards.

### M7 — Chronicles foundation: 2/8 points (25%)

- [x] M7-A — **2 points:** canonical, versioned Lore Bible. Evidence: ZYNTH-CHRONICLES-LORE-BIBLE.md. Lore is authored; runtime chapters are not credited.
- [ ] M7-B — **2 points:** versioned chapter schema, deterministic requirements, durable chapter state and source-event references.
- [ ] M7-C — **2 points:** first playable coherent arc with main/optional content and authored no-AI fallback.
- [ ] M7-D — **2 points:** condition/replay/history-recovery checks, lore consistency and proof that chapter completion grants no duplicate gameplay EXP.

Dependencies: M1 and M5. Exit: chapters conclude from their configured conditions, not a fixed quest/mission count; uncertain legacy history never becomes verified evidence.

### M8 — Personalization and archive: 0/5 points (0%)

- [ ] M8-A — **2 points:** branches use actual profession, skill, title and achievement events plus explicit reversible choices.
- [ ] M8-B — **2 points:** private paginated chapters/choices/discoveries archive alongside preserved quest history.
- [ ] M8-C — **1 point:** persisted continuity, bounded memory/context, account isolation, unknown-content and optional AI-failure checks.

Dependency: M7 and trusted identity events. Exit: narration never invents an earned evolution; archive pages do not expose other users or load unbounded history.

### M9 — Chapter/world integration: 0/5 points (0%)

- [ ] M9-A — **3 points:** correlate verified chapter outcomes to permanent regional changes with unique source keys and durable retry status.
- [ ] M9-B — **2 points:** refresh/replay and failed-enrichment recovery, reduced-motion/skippable transitions and independent-region checks.

Dependencies: M6 and M8. Exit: a chapter changes the right region once; narrative/art failure cannot undo a legitimate quest or achievement.

### M10 — Expansion readiness: 0/5 points (0%)

- [ ] M10-A — **2 points:** stable content IDs, versions, retirement labels and explicit compatibility mappings.
- [ ] M10-B — **2 points:** demonstrate adding a region/chapter/item package for existing accounts without resetting history, ownership or numerical progress.
- [ ] M10-C — **1 point:** large-catalog pagination/bounded-lookups, missing-package and prior-version fixtures.

Dependencies: M4, M5, M7 and M9. Exit: a real additional content release works; an expandable schema alone does not meet acceptance.

### M11 — Production hardening: 2/11 points (18%)

- [x] M11-A — **2 points:** accumulated engine/account/SQL/browser verification harnesses, build checks and release evidence. Credit is for reusable baseline evidence, not final security approval.
- [ ] M11-B — **2 points:** refresh the recorded dependency audit, review compatible upgrades against current primary documentation, resolve confirmed release blockers and run affected regressions. The 16 October refresh still reports 16 package entries (1 critical, 13 high, 2 moderate); upgrade preparation is complete but resolution/regression evidence remains.
- [ ] M11-C — **1 point:** account-level limits on costly generation/grading, bounded inputs/prompts, timeout/retry behavior and secret/bundle checks.
- [ ] M11-D — **2 points:** close the original engine audit's remaining stat/progression, hidden-skill, bounded context/memory, Swift/XP-card spending and profession gaps; record evidence per engine and retain numerical rules.
- [ ] M11-E — **1 point:** authorized hosted account/inbox confirmation/reset and returning-user journey, preferences, quest/mission grading, voice transcript submission, leaderboard participation and persistence. Real microphone/provider accuracy is a manual check.
- [ ] M11-F — **1 point:** end-to-end keyboard, contrast, reduced motion, desktop/portrait fit, selected-region performance and long-history behavior.
- [ ] M11-G — **2 points:** reconcile all acceptance criteria, migration/backup/rollback rehearsal, approved staged rollout and post-release smoke checks with exact commit/migration evidence.

Dependencies: final closure requires M1 through M10; audit/limit/upgrade preparation can start earlier. Exit: all required paths and rollback work with no unresolved release blocker. Previously published UI does not imply this milestone is finished.

## Evidence and percentage update rules

The checklist above is the scoring source. Its weights sum to 100; checked packages currently sum to 37. Overall completion is checked weight divided by total weight, multiplied by 100. Per-milestone percentages are rounded to the nearest whole number; overall progress uses the points directly, not the average of those rounded percentages. On 16 October M1-F was explicitly split into F1 (2 local evidence points) and F2 (1 hosted activation point), preserving its original 3-point weight and the 100-point denominator. Baseline was 24%.

After a package completes, add its implementation reference, relevant check result, date and local/hosted distinction before checking it. Update the leading dashboard in PROGRESS.md and the snapshot in MILESTONES.md together. Preserve historical progress entries. If scope changes, record the new denominator/reason before changing the percentage. Never award points merely for planning or re-running an already credited test.

Production migrations require their separate authorization under the master directive. Previously granted publishing authorization and already approved migrations remain valid within their original scope. Preparing this plan does not apply SQL, activate the trusted route, send email, incur service costs or alter user data.

## Definition of 100%

Every weighted package is accepted; existing accounts retain their history; all original engines and new engines 14–18 meet their documented responsibilities; the main product works without optional AI; security/recovery/accessibility and content-release checks pass; and the approved deployment is verified. Open blockers keep the relevant packages unchecked even if the UI looks finished.

## References

- [Milestones](MILESTONES.md)
- [Progress](PROGRESS.md)
- [Complete Application Blueprint v2](<docs/blueprints/ZYNTH Complete Application Blueprint v2.md>)
- [Engine audit](docs/expansion/ENGINE_AUDIT.md)
- [Trusted progression boundary](docs/expansion/TRUSTED_PROGRESSION.md)
- [Development report](docs/expansion/DEVELOPMENT_REPORT.md)
- [Leaderboard and participation](docs/LEADERBOARD.md)
- [Voice replies](docs/VOICE_REPLIES.md)
