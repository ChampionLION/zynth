# Zynth deployment

Updated 15 October 2026.

## Targets

- GitHub: `ChampionLION/zynth`, production branch `master`, repository root contains `package.json`.
- Vercel: project `zynth`, public production alias `https://zynth-one.vercel.app`.
- Supabase: project `Zynth`, region `eu-west-1`, project reference `khvzjbhmozvpwidaxbah`.

## Environment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel before building. These are public browser configuration; never use a secret or service-role key. `.env.local` remains ignored by Git.

`NEXT_PUBLIC_ZYNTH_MODE=mock` runs practice quests and deterministic feedback with real account storage. For model feedback, configure server-only `GEMINI_API_KEY` and/or `GROQ_API_KEY` and set the mode to `live`. Redeploy after changing public environment variables; Next.js embeds them at build time.

## Database

For a new database, apply `supabase/schema.sql`, then `supabase/migrations/20261015_auth_and_resume.sql` and `20261015_restrict_internal_trigger.sql`. The initial schema includes aspiration; existing older databases also need `20261014_onboarding_aspiration.sql`. The connected project has the initial schema and both 15 October changes applied.

All nine application tables have row-level security. Profiles, quests, and onboarding drafts use authenticated ownership. No service-role key is required by the app.

## Email confirmation and password recovery

In Supabase → Authentication → URL Configuration, set:

- Site URL: `https://zynth-one.vercel.app`
- Redirect URL: `https://zynth-one.vercel.app/auth/callback`
- Redirect URL: `https://zynth-one.vercel.app/auth/reset-password`
- Optional local development URLs: `http://localhost:3001/auth/callback` and `http://localhost:3001/auth/reset-password`.

These dashboard settings cannot be changed through the connected Supabase tools. They must be saved before production confirmation/reset emails can reliably return to the app. Keep email confirmation enabled. Use a production SMTP sender for public registrations; Supabase's default sender restricts delivery and is intended for testing. Never paste SMTP credentials into source code.

## Account behavior

New confirmed accounts begin onboarding. Incomplete onboarding restores the latest saved answers. Existing profiles open Overview, or today's unfinished quest if it has a saved draft. Completed quest history prevents a committed quest from reopening after a failed cleanup request.

Browser draft caches are account-scoped. Cloud saves support returning on another device. A prior local-only journey can be imported once when its saved email matches the verified account; create the account on the original browser using the same email. An existing cloud profile is never overwritten by that import.

## Verification

Run `npm test`, `npm run lint`, and `npm run build`. The account integration suite uses a simulated Auth/PostgREST backend and tests cloud restoration, account isolation, wrong credentials, confirmation-required signup, save failures, and stale loads after sign-out. It does not send confirmation email or substitute for a real browser walkthrough.

Live checks on 15 October confirmed enabled email registration and confirmation, private anonymous reads, denied anonymous draft writes, and a 401 for model requests without a session. Supabase security advisories were clear after restricting its internal trigger function. The local browser automation runtime failed to initialize; desktop/mobile screenshots and a real inbox-driven signup/reset walkthrough remain unverified.
