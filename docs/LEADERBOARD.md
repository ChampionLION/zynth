# Live leaderboard

16 October 2026. Replaces the empty, unmaintained cache read with a narrow authenticated database query over saved progress. No cron, service credential or synthetic participants are required.

## Behavior

- Global All skills and five domain boards rank opted-in profiles with positive lifetime EXP. Domain boards filter participants by their actual domain; they use the same cumulative EXP score.
- Rankings update from committed profile saves without rebuilding a cache. The screen refreshes on entry, relevant saved-profile changes, focus, the Refresh button and every minute while visible.
- Pages contain 25 entries. Total participation and the signed-in user's rank/score are calculated across the entire selected board, independently of the page. Equal scores use account creation and stable account identity internally for deterministic ordering.
- First name and last initial are returned; full names, emails, account IDs, location, responses and behavioral profile fields are excluded. Opt-out is checked by the query on every read. Other users may retain the last screen snapshot until its next refresh.
- New profiles with no EXP see an explanation; other-category and private browsing states are distinct. Empty/loading/error/retry states are implemented. Regional boards are deferred because optional location data does not exist; regional ranks are not fabricated.
- Viewing rankings performs no profession evolution or reward writes. The existing eligibility helper remains for future integration with trusted progression.

## Database

CLI-generated migration: `supabase/migrations/20261016030828_live_leaderboard.sql`. The owner explicitly approved applying this migration. It was applied to the existing Zynth Supabase project on 16 October. It adds a partial ranking index and `public.get_live_leaderboard(text,integer,integer)`. No profile, score, reward or historical quest was modified or backfilled. The old cache table remains for compatibility.

The function deliberately uses SECURITY DEFINER to read the limited cross-account ranking projection without opening profile SELECT policies. It requires `auth.uid()`, grants execution only to authenticated users, has an empty search path, qualifies table names, validates bounded inputs and accepts no caller identity, profile or score parameter. It is read-only and returns a strict output shape. Anonymous execution is revoked.

The database advisor flags signed-in execution of this SECURITY DEFINER function. That execution is intentional and constrained as above; switching to SECURITY INVOKER would restrict ranking reads to the user's own profile under current RLS. See [Supabase's advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). The advisor also reports the pre-existing disabled leaked-password protection setting; it was not changed by this feature. See [password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Rankings reflect saved profiles. The existing browser-owned progression trust gap remains under ZEC-M1; this feature does not make scores tamper-proof and must not authorize competitive rewards, cosmetics or profession changes. No new reward path was added.

## Evidence

- `npm run test:leaderboard`: actual PostgreSQL execution in PGlite covers 61 fixture profiles, category/count/pagination behavior, a user's rank outside the page, ties, instant progress updates/opt-out, shortened names, absence of private fields, preserved profile RLS, authentication and invalid inputs.
- `scripts/verify-leaderboard.cjs`: the real UI/SDK against disposable local data covers filters, paging, empty/error/retry behavior, own position, anonymous display names, portrait fit and opt-out via actual Settings. No uncaught application errors. Desktop and 390×844 screenshots inspected.
- Read-only hosted query after migration: one eligible participant, valid rows/count/current-user fields, no private fields, anonymous execution denied and authenticated execution granted. No test accounts were created in production.
- Lint passes. Production build and publishing are recorded in the release progress entry.

The browser fixture follows the same local setup described in [voice verification](VOICE_REPLIES.md); run `node scripts/verify-leaderboard.cjs` with an available Playwright module/browser. It blocks requests to nonlocal hosts and never modifies hosted user data.

A small account-form hardening accompanies this work: submission waits for client account initialization and uses POST as its non-JavaScript method, preventing a pre-initialization submission from putting credentials in the URL.
