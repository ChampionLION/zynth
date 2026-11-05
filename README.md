# Zynth

A responsive behavioral-growth web app built with Next.js, TypeScript, Zustand, and Supabase accounts. AI feedback is optional.

## Local preview

Install dependencies with `npm install`, copy `.env.example` to `.env.local`, configure the Supabase URL and public publishable key, and run `npm run dev -- --port 3001`. The landing page works without account configuration; sign-in requires Supabase. Default practice mode uses deterministic quests and feedback while keeping accounts and progress in Supabase. See [deployment setup](docs/DEPLOYMENT.md).

## Checks

- `npm test` — engine, mission, appearance and voice lifecycle checks; account persistence/isolation using the actual SDK with a simulated backend; actual migration/RLS/transaction checks in isolated embedded Postgres.
- `npm run lint` — lint checks.
- `npm run build` — production compilation, type checking, and page generation.

## Engine status

See [ENGINE_STATUS.md](ENGINE_STATUS.md) for all 13 engine connections and remaining blueprint gaps. Email/password accounts and private cloud saves are implemented. Production progression uses the activated trusted server flow with replay protection and rate budgets. Global ranking reads verified saved profiles; broader expansion and hosted acceptance work remain tracked separately.

## Onboarding and world map

Onboarding v2 starts with a written aspiration, followed by four ordinary scenarios. Question definitions and signal mappings are shared by local classification and live prompts. Existing profiles remain valid. Existing Supabase databases need the nullable column migration in `supabase/migrations/20261014_onboarding_aspiration.sql` before new profiles are saved.

Mark Map is a landscape of fourteen checkpoints per rendering segment. Mission landmarks reflect actual mission progress; narrative chapters are separate. It uses successful quest days, groups same-day retries, and excludes failed attempts. The same artwork and progression appear behind Overview. Seven qualifying quests unlock a playable mission independently of streaks.

## Learning quests and missions

New quests teach through one or two short lessons and worked examples, then offer one small reinforcement check. Missions supply the actual problem, facts and constraints for the user to solve. Short practice replies receive corrective feedback; existing saved quests and drafts remain usable. Both authored fallback content and model generation follow this format. See [learning-first quest behavior and checks](docs/LEARNING_QUESTS.md).

## Expansion branch

The Evolution and Chronicles work includes mission policy, profile editing, themes and reviewed voice transcripts. Step 1 now implements server-owned onboarding, stored quest plans, grading, daily inputs, skip, prestige and current economy/profession actions, with durable result recovery. Its owner-approved production activation is complete; see the [rollout evidence and recovery runbook](docs/expansion/STEP1_ROLLOUT.md). Global rankings include verified saved profiles by default, including zero EXP; Settings can hide a profile and regional participation is optional. Avatar, inventory, modular living regions and runtime chapters remain planned. See [weighted progress](PROGRESS.md) and the [development report](docs/expansion/DEVELOPMENT_REPORT.md).

## Layout

The dashboard uses a fluid browser workspace with a desktop sidebar and columns. Below 700px it switches to bottom navigation and a single content column. Immersive quest and reveal screens remain centered. The design supports widescreen desktops and portrait mobile browsers without forcing a fixed aspect ratio.

## Leaderboard

The original Local, State, National and Global tabs read saved lifetime EXP directly from Supabase. First-time visitors choose Global only, optional approximate regional participation, or browse only; everyone can view every list. Choices are remembered and can be changed or withdrawn. Rankings include pagination, visibility, shortened names and full-board own position. The separately approved migration is applied; no cache job is required. See [leaderboard implementation](docs/LEADERBOARD.md).

## Voice replies and appearance

Quest and mission replies can be recorded in browsers with speech recognition, then reviewed as editable text before grading. Final words use the normal saved draft flow; playback audio stays only on the page. Typing remains available. See [voice reply behavior and browser checks](docs/VOICE_REPLIES.md).

Settings supports editable names, save/discard, light/dark/system themes, reduced motion and account preference retry. M2 is complete, including authorized hosted cross-session preference/retry verification; see [completion evidence](docs/expansion/M2_COMPLETION.md). Overview shows all six core/domain stats with three desktop/two phone columns.

## Remembered sign-in, offline lessons and downloads

Remember me keeps a refreshable sign-in on the device, with a session-only option. Daily quests are the lessons: teaching, worked examples and one small check in the normal quest screen. The same pages use cached account data and three server-prepared upcoming daily lessons when the connection is unavailable. Replies sync automatically; there is no separate library, study track or mode interface. Sign-out locks the saved journey without discarding queued work. See [offline behavior and verification](docs/OFFLINE_LEARNING.md). `/download` provides the signed early-access Android 0.1.2 APK and checksum, linked from the landing page and Settings.

## Brand identity

The approved staircase Z and serif wordmark are shared through `BrandLogo`. The slogan is **Synthesize your Zenith**, with **Build who you want to become.** as the explanation. Social previews use the matching 1200 × 630 image without a domain. SVG, favicon, Apple, and app-icon exports live alongside the refined originals; see [brand notes](docs/brand/og-image-v2.md).

## Android application

The `android` project packages the hosted application with device-local daily quest alarms. First-use setup requests overlay access explicitly; denied/unavailable overlays use optional repeated notifications at 5, 10 or 15-minute intervals within a 30-minute window. Focus closes after three minutes or a committed quest submission, with an emergency exit always available. See [Android setup, build and verification limits](docs/ANDROID_APP.md).

## Project records

- [Progress](PROGRESS.md)
- [Milestones](MILESTONES.md)
- [Complete application blueprint v2 — Markdown](<docs/blueprints/ZYNTH Complete Application Blueprint v2.md>)
- [Original complete application blueprint v1 — preserved](<docs/blueprints/ZYNTH Complete Application Blueprint v1.docx>)
- [Expansion development report](docs/expansion/DEVELOPMENT_REPORT.md)
- [Engine audit](docs/expansion/ENGINE_AUDIT.md)
- [Chronicles Lore Bible](docs/chronicles/ZYNTH-CHRONICLES-LORE-BIBLE.md)
- [Blueprint PDF](docs/blueprints/Zynth_Blueprint_v1.md.pdf)

## Character identity

M3 is complete: Profile and Overview share a layered Wayfarer avatar. The optional editor previews free skin/hair/outfit/backdrop choices, saves to the account, supports cancel/reset and restores across sessions. Equipment slots remain free-only until M4 ownership is implemented. See [M3 evidence and boundaries](docs/expansion/M3_AVATAR.md).

