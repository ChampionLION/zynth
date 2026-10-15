# Zynth

A responsive behavioral-growth web app built with Next.js, TypeScript, Zustand, and Supabase accounts. AI feedback is optional.

## Local preview

Install dependencies with `npm install`, copy `.env.example` to `.env.local`, configure the Supabase URL and public publishable key, and run `npm run dev -- --port 3001`. The landing page works without account configuration; sign-in requires Supabase. Default practice mode uses deterministic quests and feedback while keeping accounts and progress in Supabase. See [deployment setup](docs/DEPLOYMENT.md).

## Checks

- `npm test` — engine regression checks plus account persistence/isolation integration checks using the actual SDK with a simulated backend.
- `npm run lint` — lint checks.
- `npm run build` — production compilation, type checking, and page generation.

## Engine status

See [ENGINE_STATUS.md](ENGINE_STATUS.md) for all 13 engine connections and remaining blueprint gaps. Email/password accounts and private cloud saves are implemented. Model requests verify a signed-in user. Progression remains client-owned; trusted competitive ranking, model rate limits, and live service verification remain separate work.

## Onboarding and world map

Onboarding v2 starts with a written aspiration, followed by four ordinary scenarios. Question definitions and signal mappings are shared by local classification and live prompts. Existing profiles remain valid. Existing Supabase databases need the nullable column migration in `supabase/migrations/20261014_onboarding_aspiration.sql` before new profiles are saved.

Mark Map is now a landscape of fourteen checkpoints per chapter, with mission landmarks every seventh mark. It uses successful quest days, groups same-day retries, and excludes failed attempts. The same artwork and progression appear behind Overview.

## Layout

The dashboard uses a fluid browser workspace with a desktop sidebar and columns. Below 700px it switches to bottom navigation and a single content column. Immersive quest and reveal screens remain centered. The design supports widescreen desktops and portrait mobile browsers without forcing a fixed aspect ratio.

## Brand identity

The approved staircase Z and serif wordmark are shared through `BrandLogo`. The slogan is **Synthesize your Zenith**, with **Build who you want to become.** as the explanation. Social previews use the matching 1200 × 630 image without a domain. SVG, favicon, Apple, and app-icon exports live alongside the refined originals; see [brand notes](docs/brand/og-image-v2.md).

## Project records

- [Progress](PROGRESS.md)
- [Milestones](MILESTONES.md)
- [Complete application blueprint](<docs/blueprints/ZYNTH Complete Application Blueprint v1.docx>)
- [Blueprint PDF](docs/blueprints/Zynth_Blueprint_v1.md.pdf)
