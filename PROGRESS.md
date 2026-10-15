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
