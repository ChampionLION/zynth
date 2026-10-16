# Project milestones

Updated: 15 October 2026 (Africa/Lagos).

## Completed milestones

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

Initiative ID: **ZEC**. Registered 15 October 2026. Full source: `docs/expansion/MASTER_DIRECTIVE.md`. Local implementation only; no remote push, production deployment, live data mutation or external cost is authorized. Historical milestones above retain their identifiers and completion records. Status vocabulary: NOT STARTED, IN PROGRESS, IMPLEMENTED, VERIFIED, COMPLETED, BLOCKED. No percentage is asserted; completion requires the acceptance criteria below.

### ZEC-M0 Architecture and documentation audit — COMPLETED

Objective/scope: inspect repository, installed versions, all thirteen engines, historical blueprint, schema, mission semantics and current UI. Dependencies: none. Acceptance: engine matrix, explicit conflicts/migration policy, v2 Markdown blueprint, baseline checks, integrated roadmap. The owner's subsequent request to use `.md` replaces the Word-export requirement; original v1 Word remains unchanged. Tasks: discovery, source reconciliation, versioned blueprint, implementation appendix and development report complete. Evidence: baseline `npm test`, 500 onboarding combinations, real-SDK simulated auth suite and `npm ls --depth=0` pass; current SQL/service tests documented separately. References: `docs/expansion/ENGINE_AUDIT.md`, `docs/blueprints/ZYNTH Complete Application Blueprint v2.md`, `docs/expansion/DEVELOPMENT_REPORT.md`. Risks: owner RLS currently permits forged progression; full inbox flows unverified. Blocker: none to local implementation. Progress: no production changes. Next: resolve M1 trust boundary before verified reward projections.

### ZEC-M1 Quest–Mission Correction — IN PROGRESS

Objective: seven qualifying quests unlock one actual mission, independent of streaks. Scope/tasks: explicit eligibility and lifecycle, deterministic pending identity, retry/banked credits, generation failure, legacy transition, idempotent trusted completion. Dependency: M0 policy. Acceptance: six/seven, duplicates, failure, pending/completed/next cycle, concurrent requests, legacy/streak/prestige tests; existing records unchanged. Evidence: mission-domain, SDK account and embedded Postgres suites pass. References: `quest-cycle.ts`, `quest.ts`, dashboard, `ensurePlannedQuest`, `expansion.test.ts`, `database.integration.test.ts`, `docs/expansion/TRUSTED_PROGRESSION.md`. Verified tasks: eligibility/replay/retry/banking, stable plan IDs, real fallback steps, retained drafts, streak independence, skipped mission retries, map segment labels and nonpunitive return. Implemented staged foundation: response-only server grading, revision checks, service-only atomic SQL commit, immutable outcomes/events and expiring leases; actual SQL verifies replay, RLS, rollback and concurrent service requests. Remaining: trusted onboarding/generation/skip/prestige/check-in/evolution mutations, client cutover, write restrictions, durable reveal recovery, persisted generation lifecycle and separate-connection database races. Risk/blocker: browser-owned writes still authorize current progression; skip remains separate writes. Embedded Postgres is not distributed race proof. Migration is prepared, not hosted; new route stays disabled. Next: coordinated persistence/privilege cutover before new reward projections.

### ZEC-M2 Profile and Appearance — VERIFIED

Objective: validated editable names, safe save/discard and centralized light/dark/system themes. Scope/tasks: field-only persistence, error/loading states, global synchronization, account preferences, reduced motion and responsive settings. Dependencies: M0; cloud preferences require prepared migration. Acceptance: validation, owner isolation, persistence failure, theme/system changes and no progression mutation tests, visual verification. Implemented: strict name validation, editable-field patches, save/discard/error states, scoped draft recovery, navigation confirmation, semantic theme/domain/grade/rarity tokens, system theme changes and reduced motion. Offline preferences retain a pending account-scoped value across reloads; retry and reconnect synchronize it. Discard-and-leave removes the draft. Storage-unavailable messaging is explicit. Evidence: SDK tests preserve concurrent XP/history, reject invalid/extra fields, retry failed preferences and restore cloud preferences with empty cache; isolated SQL tests verify owner policies. Headless Edge checks real authenticated UI against a disposable local backend: save/error/discard, navigation dialog/Escape, light/dark/system, reduced motion, failed-sync reload/retry, restored cloud preferences, mobile fit and themed dashboard/profile/achievements/map. Screenshots inspected at desktop and 390×844. References: `scripts/verify-m2-voice.cjs`, `appearance.ts`, `appearance-db.ts`, `AppearanceProvider.tsx`, settings, `docs/expansion/DEVELOPMENT_REPORT.md`. Status scope: VERIFIED LOCALLY, not production-verified. Hosted preference migration remains unapplied and deployment unauthorized; fallback is explicitly labeled. Browser Back relies on draft recovery. Next release action: authorized hosted migration and live account preference checks.

Related owner additions — locally implemented and verified: voice replies with editable transcripts, local audio playback and saved text drafts for quests/missions; Overview shows all six stats in three desktop/two phone columns. Speech-provider accuracy and real-microphone transcription remain manual checks. See `docs/VOICE_REPLIES.md`.

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

### ZEC-M11 Production Hardening — NOT STARTED

Objective: satisfy the directive's complete definition of done. Scope/tasks: real database transactions/RLS, account-to-quest integration, accessibility, security, performance, production build and documentation reconciliation. Dependencies: M1–M10. Acceptance: all milestone criteria and relevant regression suites pass; no unauthorized reward writes; hosted changes only under separate explicit authorization. Evidence accumulated: engine/account/mission suites, isolated actual-SQL service/RLS tests and production compilation; these do not constitute full release verification. Dependency audit: 16 vulnerable entries (1 critical, 13 high, 2 moderate), including current Next.js and styling/lint toolchain. References: `docs/expansion/MASTER_DIRECTIVE.md` sections 27/32, `docs/expansion/DEVELOPMENT_REPORT.md`. Blockers: dependencies need coordinated upgrades; private UI, inbox and distributed database checks remain; M1–M10 acceptance incomplete. Production writes/deployments are not authorized; local work can continue. Next: resolve dependency findings and accumulate evidence per phase before final acceptance.
