# Leaderboard participation and rankings

16 October 2026. The original podium, list, category pills and Local / State / National / Global tabs are restored. Rankings read committed Supabase account progress directly; no cache population or scheduled job is needed.

## Participation

Global participation is on by default for verified accounts with saved profiles, including zero lifetime EXP. No prior join metadata is required. Settings → Show me on the leaderboard can hide a profile from every list. Old browse-only metadata does not override that explicit Settings preference.

On the first visit, an optional Regional rankings dialog offers Global only or Join regional rankings with approximate country, state/province and city/general area. Everyone can browse all four scopes and skill categories, including after opting out. Manage regions changes or withdraws regional location without silently changing Global visibility. Choices persist through account metadata.

Location is manually self-declared and approximate. No GPS, street address, IP geocoding or third-party location service is used. Country/state/city names are suggestions and filters, not verified identity. Regional lists also imply the approximate area of their consenting members; the dialog explicitly asks to share that area. Exact coordinates are never collected. Spelling aliases are not automatically geocoded; case and whitespace are normalized.

## Data and privacy

Membership uses existing Supabase account metadata, `zynth_leaderboard`, with version 1, choice browse/global/regional and an optional coarse location. It is only a self-declared participation preference. Editable metadata grants no authorization, rewards, profession, score or privileged access. Browsing is available to all authenticated users.

The field-only Settings update changes leaderboard visibility while preserving numerical progress. The regional dialog changes only regional preferences. Switching to Global clears the shared location. Audio, quest replies and behavioral data are unrelated and never returned by rankings.

`public.get_leaderboard` reads accounts and profiles directly. Global includes all verified visible profiles, including zero EXP and accounts without membership metadata. Regional lists require explicit regional membership and visibility. National compares country; State compares country/state; Local compares country/state/city. Regional filters default to the user's shared area, otherwise an available area, whose name is displayed. View filters never imply the browser's location. A bounded directory of public regional areas supplies suggestions; a typed filter can browse any area.

Pages contain 25 entries with full-board totals and the user's rank/score independent of the page. Score ties use creation time and account identity internally. Responses contain only rank, shortened first-name/last-initial, domain, level, EXP, streak and own-row flag. They contain no account IDs, email, full surname or per-row location fields. Empty, loading, retry and category/private browsing states are implemented. Rankings refresh on entry, saved-profile changes, participation/filter changes, window focus and each visible minute.

## Database and authorization

The previous approved migration `20261016030828_live_leaderboard.sql` added the ranking index and original Global function. The owner separately approved `20261016034313_leaderboard_membership_scopes.sql`, which was applied on 16 October. The new migration adds the scoped read-only function and makes the old Global RPC delegate to the same consent rules. It creates no tables/columns and changes no existing users, profiles, scores or rewards. The old cache table remains intact. The separately approved 20261016111757_leaderboard_global_by_default.sql is now applied; it changes only ranking functions, not user records.

The function requires auth.uid(), accepts no caller identity or score parameter, validates scopes/categories/bounded pagination, uses an empty search path and returns a narrow projection. PUBLIC and anonymous execution are revoked; authenticated execution is granted. Profile SELECT policies remain private. SECURITY DEFINER is intentional for the cross-account projection. The legacy wrapper is SECURITY INVOKER.

The advisor's [authenticated SECURITY DEFINER notice](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) describes this intentional constrained execution. Its other notice is the pre-existing disabled [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); this feature does not change that setting.

Scores still reflect saved profiles. Step 1 adds a separately gated trusted progression boundary and a service-only profession eligibility calculation. Viewing rankings never grants rewards or changes a profession. See expansion/STEP1_ROLLOUT.md for activation status.

## Verification

- `npm run test:leaderboard` passes actual PostgreSQL/PGlite queries over 61 fictional accounts: all scopes, case/whitespace normalization, Global default, zero EXP, unverified exclusion and Settings opt-out, explicit regional consent, filtering, ties, paging, rank beyond the page, instant saved-score/opt-out changes, output privacy, legacy RPC consistency and profile RLS/authentication.
- `scripts/verify-leaderboard.cjs` passes the real UI/SDK against a disposable loopback backend: Global rank before any join choice, first optional regional prompt, remembered choices, original podium order and four tabs, optional area entry, unrestricted regional browsing, scoped totals, pagination, category ranking, withdrawal, browse-only privacy and phone fit. No hosted test users or progress changes are used.
- Lint, TypeScript and the 29-entry production build pass. Desktop/mobile layout screenshots were inspected.
- Hosted read-only checks return valid snapshots for every scope and no private row fields; anonymous execution is denied. The latest approved query returns three verified profiles, including two zero-EXP profiles. No participation or profile records were backfilled.

The browser fixture setup is described in [voice verification](VOICE_REPLIES.md). It blocks requests to nonlocal hosts. This verifies application behavior and actual SQL separately; it does not claim a real user's hosted sign-in/join journey was exercised.
