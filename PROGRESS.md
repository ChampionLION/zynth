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
- Configured Supabase public variables and practice mode in the existing Vercel project. Released application commit `a0affc33eada19e42a1c3caa335dc6a19a65f41e` to https://zynth-one.vercel.app; Vercel reports READY with the production alias assigned.

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

The user confirmed the production Site URL and both redirect URLs were saved in Supabase on 15 October. The connector cannot independently read those settings. Verify inbox delivery and configure a production SMTP sender if the project still uses Supabase's default test sender. See `docs/DEPLOYMENT.md` for exact values.

Progression math remains browser-owned. Model rate limiting, leaderboard aggregation, Swift Mode and XP-card actions, durable grade/event recovery, and real community content remain listed in `ENGINE_STATUS.md`. This update does not claim those broader blueprint features are complete.
