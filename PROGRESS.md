# Progress update

Updated: 15 October 2026 (Africa/Lagos).

The app now has a minimal public landing page, real email/password accounts, and account-owned progress in Supabase. The primary product reference remains the complete application blueprint, with the user's aspiration-first onboarding and world-map additions.

## Completed

- Built a fluid ivory-and-amber landing page with clear sign-up/sign-in entry points, a labeled illustrative journey preview, an explanation of quests, and returning-user access.
- Added signup, signin, email-confirmation callback, password-recovery screens, password visibility, useful errors, and private-route loading/retry states.
- Connected the Zynth Supabase project in Zynth-SkillForge's Org and applied the initial application schema plus account draft storage.
- Separated account synchronization from practice/AI feedback mode. Practice mode still saves profiles and progress to the real account.
- Restored profiles and current quest drafts after signin. Partial onboarding saves its goal, selections, and step; quest drafts save text, completed mission steps, and elapsed time.
- Added account-scoped browser draft backups, stale-load protection on signout/account changes, and guards against cross-account saves.
- Added a one-time import for a matching legacy local journey without overwriting an existing cloud profile.
- Updated account settings for cloud signout and progress reset. Added authenticated access to model requests and removed synthetic rankings from connected empty boards.
- Verified row-level security on all nine application tables; anonymous private reads return empty data and anonymous draft writes are denied. Restricted an API-callable internal Supabase trigger; the security advisor now returns no findings.
- Released application commit `a0affc33eada19e42a1c3caa335dc6a19a65f41e` on the original Vercel project. That project was subsequently deleted; the replacement project and current address are recorded below.

## Preserved earlier work

Aspiration-first onboarding uses one written direction and four everyday scenarios. All 500 primary scenario combinations produce valid profiles. Mark Map and Overview share a landscape of winding checkpoints, mission landmarks, and fourteen-mark chapters; only successful quest days add marks. See the milestone record and original blueprints in `docs/blueprints`.

## Verification

- All 68 engine/regression checks and the 500-combination sweep pass.
- New account integration suite passes using the actual Supabase SDK against a simulated Auth/PostgREST backend: confirmation, invalid credentials, restored cloud drafts/profile, separate accounts, failed saves, and stale-load rejection.
- Lint, TypeScript, and the production build pass for 22 routes.
- Local landing/account responses return HTTP 200. The real Supabase email provider and signup are enabled, with confirmation required. Unauthenticated model requests return 401.
- Production landing and all four account routes return HTTP 200. Published browser bundles contain the intended project URL and public key. Missing and invalid sessions both receive HTTP 401 from the model endpoint.
- Full desktop/mobile browser verification is still pending because the browser runtime cannot initialize. Real inbox confirmation/reset and authenticated writes to the hosted database have not been walked through end to end.

## Remaining

The user confirmed the original production Site URL and redirect URLs, but the replacement site uses a different address. Save the new URLs from `docs/DEPLOYMENT.md`, then configure and test SMTP using `docs/EMAIL_SETUP.md`. The connector cannot independently edit or read the dashboard's auth settings.

Progression math remains browser-owned. Model rate limiting, leaderboard aggregation, Swift Mode and XP-card actions, durable grade/event recovery, and real community content remain listed in `ENGINE_STATUS.md`. This update does not claim those broader blueprint features are complete.

## Replacement Vercel project — 15 October

Reconnected the replacement project prj_QPxos3AVIGXk73axBpLXVGHqEhUh to the existing Supabase configuration and local Vercel link. Its verified production domain is https://zynth-skillforge.vercel.app. GitHub production source remains ChampionLION/zynth on master. Added docs/EMAIL_SETUP.md for free Gmail SMTP with an App Password because the user does not own a domain. Supabase's production URL and both redirect URLs must be updated from the deleted project's address; SMTP credentials and delivery remain user setup steps.

## Approved identity and social sharing — 15 October

- Applied the user's refined stepped Z and serif wordmark to the landing header/footer, account access and recovery screens, onboarding, workspace sidebar, leaderboard, and account/synthesis loading states.
- Added a crisp SVG mark, light-on-dark presentation, multi-size ICO/SVG/PNG favicons, Apple touch icon, and 192/512-pixel app icons. Original transparent and white-preview logo exports remain available.
- Set the page and Open Graph title to **Zynth — Synthesize your zenith.**, with **Build who you want to become.** as the explanatory line.
- Added a 1200 × 630 share image with the approved logo and wording, with no domain text. Open Graph and Twitter use the same title and image.
- Verified the public logo in a real browser at the normal preview width and at 390 × 844; the phone landing and signup page have no horizontal overflow and load the serif wordmark successfully. This does not replace the earlier pending full authenticated account walkthrough.
- Lint and the production build pass. Local HTTP checks confirm the metadata, all favicon formats, the Apple icon, logo assets, and exact share-image dimensions.

Brand assets and generation notes are documented in `docs/brand/og-image-v1.md` and `docs/brand/logo-refinement-v1.md`.

## Homepage slogan revision — 15 October

- Replaced the main landing headline with **Synthesize your Zenith** and the explanation **Build who you want to become.** A short line explains daily quests and visible skill progress.
- Centralized the revised capitalization across footer, account and workspace branding, and sharing metadata.
- Added a matching domain-free 1200 × 630 share image at `public/brand/zynth-og-v2.png` so sharing services receive a new image URL.
- Lint and production compilation pass. Browser checks confirm the headline fits the normal desktop preview and 390 × 844 phone viewport without horizontal overflow. Metadata and image endpoint checks pass locally.

See `docs/brand/og-image-v2.md` for the current wording and image edit record.

## 15 October 2026 — ZEC-M0 expansion discovery

Status: IN PROGRESS. Registered **ZYNTH EVOLUTION & CHRONICLES — INFINITE WORLD EXPANSION** in the existing milestone file. Baseline working tree clean; created local branch `feature/evolution-chronicles`. Preserved the supplied directive in `docs/expansion/MASTER_DIRECTIVE.md` and original Word/PDF/text sources unchanged.

Inspected installed stack, engine interfaces, routes, state, database adapters/schema/migrations, existing status records and original blueprint. Read-only hosted schema/policy/migration inspection confirms owner RLS, but owner writes can alter progression; no authoritative completion transaction existed at discovery. No live user data was changed. Created the engine matrix, explicit mission eligibility/legacy transition policy, source-conflict resolutions, and versioned expanded Markdown blueprint. Later checkpoint below supersedes the initial Word-export plan and records implementation.

Baseline evidence: `npm test` passes all existing 68 local checks, 500 onboarding combinations and SDK-backed simulated account integration; `npm ls --depth=0` confirms the actual dependency versions. Database changes at discovery: none. Main limitation: browser math/whole-profile writes cannot support secure concurrent new rewards. Initial next actions were document export, mission policy and foundational UI; the owner subsequently selected Markdown. No remote push, deployment, live migration or paid API call is authorized.

## 15 October 2026 — ZEC-M1 mission policy phase

Status: IN PROGRESS, local domain policy verified; trusted reward persistence is incomplete. Added `src/lib/engines/quest-cycle.ts` as an Engine 2 helper, with explicit eligibility, unique-ID history replay, banked credits, legacy mission preservation, retry/active/completed state and stable user/cycle/attempt generation IDs. Quest planning now unlocks a slightly harder mission after seven qualifying completions, independent of streaks. Invalid multi-step model output falls back to real mission templates. A Bad mission does not earn the successful-mission card grant.

Dashboard retains unfinished challenges across days, exposes mission progress, and no longer fades a returning user's character. Insert-if-absent generation preserves an existing planned quest/draft. Mark Map now calls fourteen-mark views segments and removes invented every-seventh-day mission markers; Overview continues using shared landscape geometry.

Tests: `npm test` passes updated smoke checks, the 500-case onboarding sweep, existing SDK account integration and `expansion.test.ts`. The new suite checks six/seven, duplicate/failing/Swift/retest exclusion, generation failure, real mission steps, pending/retry, banking, completion/next cycle, legacy history, streak independence, prestige and concurrent planner IDs. Stable IDs are not a cross-request reward transaction test.

Database changes: none applied. Remaining: trusted stored-quest grading, atomic reward/event commit, privilege hardening and real Postgres race tests. New permanent cosmetic/world rewards must remain disabled until that boundary is verified. Next independent work: M2 validated field-only settings and theme infrastructure. M1 is not complete.

## 15 October 2026 — Markdown deliverables and local foundation checkpoint

**M0 COMPLETED; M1, M2 and M7 IN PROGRESS. The full initiative is not complete.** The owner requested `.md`; the current v2 blueprint and development report are Markdown. The original v1 Word document remains unchanged. The unreviewed export draft is excluded from deliverables. See [Blueprint v2](<docs/blueprints/ZYNTH Complete Application Blueprint v2.md>) and [Development report](docs/expansion/DEVELOPMENT_REPORT.md).

Implemented the staged response-only trusted completion service/route and CLI-generated additive migration with profile revision checks, service-only atomic commit, immutable outcomes/events and expiring grading leases. Actual SQL and full service tests execute in isolated embedded Postgres, including RLS, replay, rollback, conflict, ownership, concurrent service submissions and grader-failure cleanup. The browser still uses legacy writes; the new route remains disabled, and the migration is **not applied to hosted Supabase**. Other mutating flows, privilege cutover, durable reveal recovery and separate-connection races remain open.

Settings now supports validated name edits, field-only save/discard, unsaved-change confirmation and account-scoped draft recovery. Semantic light/dark/system themes, operating-system following, cross-tab synchronization, reduced motion and native dialogs are implemented. SDK tests verify profile-field isolation, failure handling and preference restoration; SQL tests verify preference ownership. Hosted sync and new private-screen visual/keyboard checks remain pending. Browser fallback is explicitly labeled.

Corrected ordinary retry IDs, mission skip/retry tracking, specific-quest retirement and calendar achievement handling for extra same-day missions. Skip remains a multi-write legacy operation, not a completed atomic server action. Overview retains the shared landscape. Authored the versioned Lore Bible; runtime engines 14–18, avatar, inventory, modular worlds, chapters and archive remain unimplemented.

Latest verification: `npm test`, lint and production build pass, including all 24 build entries. Public/account entry HTTP checks and unauthenticated API rejection pass; these are not authenticated UI or inbox proof. Browser control is unavailable for new private UI checks. The dependency audit reports 16 vulnerable entries (1 critical, 13 high, 2 moderate); coordinated upgrades are a release blocker.

Next: trusted onboarding/import and all gameplay mutations, client/result recovery and grants/RLS cutover, separate-connection tests, then avatar/inventory/regions/Chronicles in milestone order. The development report records the exact continuation sequence and limits. No expansion push, deployment, hosted migration, live user-data write or paid external call was performed.

## 15 October 2026 — M2, voice replies and all six Overview stats

**ZEC-M2 is implemented and locally verified.** Finished editable-name save/discard behavior, native navigation confirmation, free light/dark/system themes, reduced motion, shared domain/rarity colors and light dashboard surfaces. Offline appearance choices remain queued across reloads, with account-sync retry/reconnect recovery and explicit temporary behavior if browser storage is unavailable. Discard-and-leave now removes unsaved edits. Hosted preferences still need the prepared migration; no hosted changes were made.

Added voice replies for ordinary quests and every mission step: microphone recording, optional local playback, language selection and editable transcripts. Final words append to existing text, save through normal account drafts and reach the existing grader; capture/finalization blocks submission or step changes. Audio stays only on the page and is cleared on leave/step/account changes. Permission/provider errors and unsupported browsers keep typing available. Browser speech processing is disclosed before recording. See [Voice replies](docs/VOICE_REPLIES.md).

Overview now shows Focus, Consistency, Adaptability, Execution and both saved domain attributes, in three columns on desktop and two on phones. No numerical progression rules changed.

Before the owner's request to defer further testing, engine/account/SQL/voice suites, lint and the 24-entry production build passed. Browser checks against a disposable local backend covered M2 saves/failures/discard, themes/system/reduced motion, pending preference retries, mobile layouts, six stats, synthetic microphone capture, draft recovery and both quest/mission grading. Screenshots were inspected. Real microphone/provider accuracy, hosted preferences and full release checks remain unverified. A final defensive recording-timeout cleanup and documentation edits were made afterward; further checks are deferred to the next prompt as requested. No push, deployment, hosted write or external cost occurred.

## 16 October 2026 — Publication authorized

The owner requested the current changes be pushed to GitHub and deployed to the existing Vercel site. Release preparation is in progress. This authorizes publishing application code, while leaving hosted database migrations and paid services outside scope. The trusted completion feature gate remains off; appearance cloud synchronization awaits its prepared migration. Prior implementation evidence and unresolved security/release limitations remain documented above and in the development report.

## 16 October 2026 — Release and owner setup confirmation

Application commit `a93bb0b3a38924abe948141b662a45402244f7ac` was pushed to GitHub and successfully deployed to the existing production site. Read-only checks confirmed the published M2, voice and six-stat interfaces, correct Supabase configuration and anonymous API rejection.

The owner confirms that the database migration and SMTP configuration were already completed. This supersedes earlier pending-setup notes; no migration was reapplied and no SMTP credentials were requested. Live preference synchronization and inbox delivery have not been independently rechecked. Added a Spam-or-Trash reminder to signup confirmation and password-reset notices. This is a copy change; broader tests remain deferred as requested.
