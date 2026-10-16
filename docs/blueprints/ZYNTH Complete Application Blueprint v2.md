# Zynth Complete Application Blueprint v2

Version 2.0. Revision date 15 October 2026. Initiative ZEC, Evolution and Chronicles. Format: Markdown, explicitly requested by the owner. Historical predecessor: `ZYNTH Complete Application Blueprint v1.docx`, retained byte-for-byte alongside its text extraction and historical PDF. This revision governs the expansion; unchanged numerical rules and catalogs in v1 remain applicable. The implementation appendix distinguishes specification from shipped behavior.

## Contents

1 Philosophy; 2 Extensible universe; 3 Quests and missions; 4 Narrative chapters; 5 Original engines; 6 World Expansion; 7 World Evolution; 8 Avatar and Identity; 9 Chronicles; 10 Cosmetic Inventory; 11 Events; 12 Memory; 13 Achievements; 14 Mark Map; 15 Archive; 16 Lore; 17 Identity and Settings; 18 Themes; 19 Database; 20 Security; 21 Accessibility; 22 Performance; 23 Recovery; 24 Verification; 25 Migration; 26 Content releases; 27 Roadmap; 28 Implementation appendix.

## 1 Philosophy and version history

Zynth synthesizes a model of demonstrated development through meaningful in-app activities. It remains a behavioral synthesis platform with RPG-inspired presentation. Public branding remains the owner's latest approved **Synthesize your Zenith**, explained by **Build who you want to become.** The older two-sentence slogan is historical, not a request to revert current branding or onboarding.

The expansion supersedes v1's seven-day mission trigger, fixed mission-looking checkpoints, vertical map presentation, absence dimming and future-only treatment of narrative and character visuals. It preserves existing levels, EXP formulas, skill names/evolutions, profession, achievements, economy and private account continuity. Historical v1's coercive engagement goals do not govern new features: rest never deletes earned world or identity progress.

## 2 Extensible progression universe

There is no final region, chapter or mandatory end. Extensible means stable versioned definitions and controlled releases, not infinite AI generation. Add regions, landmarks, story branches, titles and cosmetic definitions without rewriting every player record. Unknown future identifiers retain safe fallbacks. The initial release should contain a small, coherent world, not hundreds of fake chapters.

## 3 Quest and mission relationship

Seven unique qualifying completed quests unlock one playable mission. Quest eligibility is an explicit versioned policy: calibration, daily, challenge, hidden, weakness and prestige; Basic, Good and Excellent grades. Bad/Fail, missions, skips, abandoned/rejected attempts, Swift Mode and retests are excluded from new mission credit. Existing EXP and streak formulas remain independent; this rule does not retroactively remove their rewards. New quest types default to excluded until reviewed.

Only one mission is active at a time. Additional qualifying completions bank for the next cycle. A successful mission consumes seven credits; failed missions retain eligibility and support retry. Generated content and unlock state are not completion. The lifecycle distinguishes not eligible, progressing, eligible, generated, available, in progress, awaiting retry and completed. A completed cycle advances without any final mission.

Generation must use stored eligibility and adaptive difficulty. Missions retain 1–3 meaningful linked steps, in-app text completion and the existing mission EXP/card behavior. Raise adaptive ordinary difficulty by one pip where possible, capped at five; deeper scope differentiates the top level. Generation failure leaves eligibility intact. Requests for the same pending cycle reuse the persisted mission rather than generate another. Concurrency and reward idempotency require trusted transactional persistence, not a tab-local lock.

Owner addition, 15 October 2026: quests and mission steps accept voice input with an editable transcript. Record and transcribe in supporting browsers, allow review/correction, then submit text through the existing grader. Do not create separate voice rewards or infer traits from the voice. Persist transcript drafts; local playback audio is temporary and is not uploaded by Zynth. Explain browser speech processing and unavailable support before recording. See `../VOICE_REPLIES.md` for limits and verification.

Historical missions and EXP remain intact. Replay unique reconstructable history conservatively, consuming at most seven available credits for an old successful mission. Do not fabricate past completions or negative debt. Preserve an unfinished legacy mission and mark uncertain history as legacy rather than verified evidence.

## 4 Flexible narrative chapters

Chapters are versioned narrative definitions with deterministic requirements. They may span quests, several missions, achievements, profession events, discoveries and reversible choices. Main, side, regional and profession-aware branches share one schema. A chapter concludes only when its configured conditions pass. Neither seven quests nor seven missions automatically closes one. Fourteen-mark rendering pages are map segments, not chapters.

## 5 Original engines and responsibilities

Engine 1 Onboarding retains the aspiration-first five questions and validated scaffolding. Engine 2 Quest Generation owns all existing quest types, eligibility planning, adaptive difficulty and playable mission content. Engine 3 Grading owns validated quality signals and the existing post-grade orchestration; trusted application code owns all numerical outcomes.

Engine 4 Behavioral Stats retains observation windows and onboarding floors. Engine 5 Progression retains level math, titles, unlocks and voluntary prestige. Engine 6 Hidden Skills retains existing discovery detection. New narrative directions cannot assign competing professions or skills.

Engine 7 Anti-Exploitation checks stored response history, timing and duplicate requests on the server. Engine 8 Context Compression bounds profile facts and narrative context. Engine 9 Memory retains milestones, bests, skill history and struggles while referencing paginated narrative records.

Engine 10 Economy retains Skip Token and XP Card grants, caps, expiry and spending. No cosmetic purchase mechanic is authorized. Engine 11 Achievements remains the single achievement detector. Engine 12 Adaptive Intelligence influences difficulty and tone without bypassing mission eligibility. Engine 13 Continuous Profiling remains optional input to personalization, never a prerequisite for core play. See `../expansion/ENGINE_AUDIT.md` for interfaces, tests, persistence responsibilities and limitations for every engine.

## 6 Engine 14 World Expansion

World definitions contain versioned region packages, connections, landmarks, narratives and availability rules. Discoveries are per-user records derived from verified events. Clients may select a known visible region, never grant access. New packages must not rewrite old records. Read only the selected region and nearby atlas summaries; catalog navigation is paginated. Reject unknown IDs safely and retain retired-content display labels in archived entries.

## 7 Engine 15 World Evolution

Regions evolve through lightweight reusable SVG layers: restored paths, vegetation, structures, rivers and ambient treatment. Mission, chapter, discovery and achievement events may cause region-specific permanent changes. No inactivity decay. A chapter conclusion can cause a meaningful transformation only after its actual conditions pass. State commits before animation; skipping, reduced motion, failure to load effects and revisiting must not change persistence or replay rewards. Provide a textual description of each transformation.

## 8 Engine 16 Avatar and Identity

Use a lightweight layered 2D avatar with a default appearance; customization is optional. Layers may include skin, hair/head details, outfit, accessory/effect and cosmetic environment. The editor previews only valid choices, lists locked items and requirements, equips owned items, removes equipment, saves, and restores defaults. Opening, closing and saving must work by keyboard with managed focus. An asset failure falls back to a readable default.

The avatar visualizes existing skills, titles and profession. It never grants numerical progression. Absence returns a welcoming presentation, not a faded or deteriorated character. `/profile` gives the avatar a prominent environment, with stats beside compact skills on wide screens and stacked content on phones.

## 9 Engine 17 Zynth Chronicles

Chronicles interprets real development through authored canonical lore and deterministic branches. It owns no EXP or competing levels/classes. Inputs include actual profession and evolution history, skills, earned titles, achievements, verified missions, discoveries, chapters and explicit story choices. Do not infer sensitive traits. Regions and chapters may be main, side or optional and have no fixed terminal endpoint.

Use handcrafted templates first. Optional AI receives only canonical bounded facts, uses structured validation and cannot invent achievements or state changes. Store stable narrative results and provide deterministic fallback text. Narrative failure cannot prevent completing a quest or claiming its legitimate gameplay result.

## 10 Engine 18 Cosmetic Inventory

A versioned item catalog defines categories, compatible equipment slots, previews and deterministic unlock requirements. Ownership is server-granted from verified achievements, mission outcomes, levels, profession evolution, chapter completion or discovery. Unique ownership and idempotent event processing prevent double grants; equipment must reference an owned compatible item. Public clients have no ownership INSERT/UPDATE permission. Category filters show owned, locked and equipped states with accessible descriptions. Defaults are available without payment. No new exchange/purchase mechanic is included.

## 11 Shared event architecture

Extend the post-grade pipeline rather than duplicating calculations. Commit a quest result, profile changes, mission state and immutable source event in one database transaction. Use stable source and user identifiers, content version and unique `(user_id, source_id, event_type)` keys. Process downstream world/narrative/cosmetic work idempotently with durable retry status. Event types cover quests, missions, levels, skill/profession evolution, achievements, cosmetics, chapters, discoveries and explicit choices.

A trusted completion reads stored profile and quest, validates session and ownership, computes application results and performs a version-checked commit. Concurrent requests either receive the same committed result or retry against the latest state. Database locks/CAS establish authority; animation and browser caches do not. Isolate enrichment failures so gameplay can complete independently, with durable follow-up work.

## 12 Updated memory

Keep bounded behavior data and concise summaries in the existing profile. Store narrative decisions, chapters, discoveries and archive entries as indexed user-scoped records; retrieve pages and short summaries, not endless JSON transcripts. Retain old memory untouched during transition. Context Compression selects a bounded set of relevant narrative facts rather than all chapters.

## 13 Achievement and profession integration

Engine 11 detects existing achievements once from committed gameplay. Inventory and Chronicles consume those outcomes. Titles, skills and professions continue to come from original progression mechanisms. The existing incomplete profession-evolution implementation must be resolved before claiming dynamic profession story branches work. Cosmetic failures cannot undo an earned achievement. Prestige must preserve permanent discoveries, mission credit/history, narrative outcomes and cosmetic ownership.

## 14 Expanded Mark Map

Keep Overview's background and Mark Map's foreground on shared landscape checkpoint geometry. World-map navigation extends to region and atlas selection without a permanently fixed world. Separate gameplay marks, mission challenges, narrative chapters and environmental layers. A day mark remains a historical daily mark, not an automatic mission completion. Draw mission landmarks from actual quest/mission state; remove false every-seventh-day completion implications. Segment paging can remain fourteen marks as a rendering choice, labeled as segments. Keyboard, swipe and ordinary scroll remain usable.

## 15 Chronicle Archive

Extend `/chronicle` with private story chapters and archive entries alongside existing quest history and labeled community examples. Preserve familiar routes. Entries have stable identifiers, user scope, source event, content version, timestamps and deterministic ordering. Paginate long histories. Record significant missions, earned titles, profession changes, decisions, discoveries, chapters and world transformations. Never expose response text or behavioral logs in public endpoints.

## 16 Lore reference

`../chronicles/ZYNTH-CHRONICLES-LORE-BIBLE.md` is the narrative authority. The Great Stillness describes dormancy, not destruction. Wayfarers awaken potential through development. Atlas of Remembrance is a lore name for the Mark Map; familiar navigation labels remain. The Awakening describes a verified regional/chapter transformation. Canon may expand through versioned regional packages without contradicting prior choices.

## 17 Identity and Settings

Settings supports validated display-name and optional character-name edits, explicit save/loading/error states, discard and unsaved-change protection. Patch only editable fields and synchronize the global profile after confirmed persistence. Keep leaderboard privacy controls and account sign-out. Existing destructive reset is not invoked by this initiative. Appearance and avatar preferences cannot change XP, skills or access rights.

Overview shows all six existing behavioral/domain attributes, with actual saved values and responsive cards. The four core attributes and two domain attributes remain governed by the existing stat engine.

## 18 Theme system

Provide light, dark and system choices through central semantic CSS tokens, including dialogs, quest/grade views, achievements, map and navigation. Preserve dark cinematic presentation as an option. Follow system changes when selected; allow an explicit reduced-motion preference. Persist account-scoped preferences with a safe browser cache and document any unsynchronized fallback. Atlas skins are owned cosmetics, separate from free light/dark themes. Theme selection never changes progression.

## 19 Database model

Use existing profiles, quests and event records where appropriate. Introduce only needed concepts: immutable progression outcomes, mission cycles, user preferences/appearance, versioned content definitions, per-user region discovery/evolution, chapters/choices/archive, cosmetic ownership and equipment. User-owned tables have owner indexes, stable foreign keys, uniqueness constraints and RLS. Store sources and content versions; do not use arbitrary growing profile arrays for new infinite history. Migrations must be additive for data, with coordinated privilege changes for authoritative mutations.

## 20 Security

Verify the session server-side and derive user ID from it. Load actual quest and profile records instead of accepting caller-generated rewards, grades or eligibility. Never expose service-role/secret credentials in browser bundles. Validate bounded input shapes; protect completion replay, transaction ownership, reward grants and equipment changes. Client-writable metadata never authorizes rewards. Owner RLS is required but insufficient for verified progression: restrict client writes to editable fields/drafts/preferences, and expose only trusted server mutations for gameplay. Rate-limit expensive grading and generation per account. Legacy browser imports require a conservative, reviewed transition and cannot mint verified history.

## 21 Accessibility

Support visible focus, keyboard controls, semantic labels, readable light/dark contrast, fluid layouts, accessible dialogs with focus restoration, reduced motion and animation skipping. Environmental changes have textual summaries. Persistent state never depends on an animation ending. Decorative SVG layers are hidden from screen readers; checkpoint buttons have descriptive names and state.

## 22 Performance and cost

Reuse installed libraries and existing SVG assets. Load selected regions, pages of archive entries and only necessary avatar layers. No continuous expensive effects or full-atlas rendering. Prefer deterministic story selection, cache stable content, bound prompts and avoid duplicate AI calls. A paid model is not required for a basic quest. Do not invoke external services or purchase capacity during local development under this directive.

## 23 Error recovery

Generation failures preserve eligibility and drafts. A failed grading request cannot silently become a successful mock reward in live mode. A durable result makes network-loss retries safe. Unknown content renders an archived label/default; unavailable cosmetic art leaves ownership intact. Gameplay commits independently of optional narrative/cosmetic processing, which retries from its source event. Do not rely on in-memory celebration queues as the only recovery record.

## 24 Verification strategy

Retain the existing engine and real-SDK simulated account suites. Add mission tests for six/seven credits, duplicates, failure, generation failure, pending missions, next cycles, repeats/concurrency, legacy history, streak independence and prestige. Test profile validation, field restrictions, account isolation, theme/reduced motion, avatar defaults/equipment, reward idempotency, region isolation/new content and deterministic narrative requirements. Real Postgres transaction/RLS tests are distinct from in-memory simulations. Exercise representative desktop/mobile views and the complete account-to-quest-to-result flow without production mutations.

## 25 Migration strategy

Preserve original documents and all historical user data. Prepare migrations locally; production application requires explicit approval. Do not reset accounts, rewards or missions. Inspect existing migrations/schema and test on an isolated database with existing-user fixtures. Introduce stable compatibility defaults and conservative legacy eligibility. Roll out trusted onboarding, quest, grading, skip, prestige and editable-profile routes together before disabling legacy progression writes. Back up and verify counts/references before any authorized production rollout; rollback must preserve new events and restore compatible application behavior.

## 26 Future expansion mechanisms

Content packages use stable IDs, versions and validated conditions, with no final chapter marker. Release new regions/chapters/items without modifying previous user records. Preserve old package references or provide explicit versioned compatibility mappings. Test large catalogs through pagination and bounded lookups, missing packages and retired items. New content cannot change previously awarded numerical progression.

## 27 Development roadmap

The authoritative roadmap is `../../MILESTONES.md`, initiative ZEC-M0 through ZEC-M11. Dependencies: audit and revised blueprint → quest/mission and trusted-event boundary → settings/themes → avatar → inventory → modular world → living map → lore/chapters → personalization/archive → chapter/world integration → expansion readiness → hardening. Prepare dependent contracts while unresolved acceptance criteria remain visible. Do not mark a planned feature implemented or a simulated database test production-verified.

## 28 Implementation status appendix

Current local implementation: the mission eligibility/retry/banking policy is integrated with existing quest planning and tested. Pending quest drafts survive days; mission skips are recorded as skips, and map segments no longer pretend to be narrative chapters or automatic mission completions. Settings includes validated editable names, save/discard and draft recovery, light/dark/system appearance and reduced motion. Preference account synchronization is implemented and tested against the SDK fixture and isolated Postgres schema; its migration is not applied to the hosted project.

M2 is now verified locally with real browser UI checks against a disposable account backend, including offline preference retries, save/discard errors, theme/system changes and phone layouts. Shared domain/rarity tokens and dashboard surfaces support light mode. Voice replies provide local recording/playback and editable, draft-restored transcripts for quests and missions; synthetic-microphone browser tests submit both through the existing grader. Overview displays all six stats. Live speech accuracy, hosted preference persistence and production release remain unverified.

A staged trusted completion service and authenticated route now load stored records, validate response-only inputs, reuse existing exploit/grading/pipeline math and atomically commit through a service-only SQL function. Embedded Postgres verifies ownership, replay, leases, conflict detection and rollback. The browser still uses legacy progression writes: full secure cutover, other mutating actions, client wiring, durable reveal recovery and hosted multi-connection testing are unfinished. Keep the new route disabled until the coordinated cutover is complete. New cosmetic/world grants remain unimplemented.

Engines 14–18 remain specifications, with the Lore Bible authored but no runtime chapter, world-discovery, terraforming, avatar editor or cosmetic inventory implemented. Full initiative acceptance is not met. At the owner's request, this Markdown file is the v2 blueprint deliverable; a Word export is not required. The original v1 Word document remains unchanged. This appendix, the [milestones](../../MILESTONES.md) and [development report](../expansion/DEVELOPMENT_REPORT.md) carry the current implementation evidence. Production publishing and database changes remain explicitly unauthorized.

The dependency audit reports 16 vulnerable package entries (1 critical, 13 high, 2 moderate). These include the existing Next.js and styling/lint toolchain. Dependency hardening is a release blocker, separate from the passing local functional checks; no forced major upgrades have been performed.

Historical full specifications, formulas, prompts, catalogs, screens, first-run flows and future-system notes remain retrievable in v1. Where this revision explicitly supersedes a rule, this revision takes precedence; other v1 rules remain the reference rather than being silently rewritten.
