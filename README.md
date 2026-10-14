# Zynth

A responsive behavioral-growth web app built with Next.js, TypeScript, Zustand, and optional Supabase/LLM integrations.

## Local preview

Install dependencies with `npm install`, copy `.env.example` to `.env.local`, and run `npm run dev`. The default mock mode runs on this device without external keys. Open the local address printed by the development server.

## Checks

- `npm test` — engine smoke and regression checks.
- `npm run lint` — lint checks.
- `npm run build` — production compilation, type checking, and page generation.

## Engine status

See [ENGINE_STATUS.md](ENGINE_STATUS.md) for all 13 engine connections, fixes, verified local behavior, and remaining blueprint gaps. Live mode is not deployment-ready: local identity is not Supabase authentication, progression is client-owned, and the LLM endpoint still needs production access controls.

## Onboarding and world map

Onboarding v2 starts with a written aspiration, followed by four ordinary scenarios. Question definitions and signal mappings are shared by local classification and live prompts. Existing profiles remain valid. Existing Supabase databases need the nullable column migration in `supabase/migrations/20261014_onboarding_aspiration.sql` before new profiles are saved.

Mark Map is now a landscape of fourteen checkpoints per chapter, with mission landmarks every seventh mark. It uses successful quest days, groups same-day retries, and excludes failed attempts. The same artwork and progression appear behind Overview.

## Layout

The dashboard uses a fluid browser workspace with a desktop sidebar and columns. Below 700px it switches to bottom navigation and a single content column. Immersive quest and reveal screens remain centered. The design supports widescreen desktops and portrait mobile browsers without forcing a fixed aspect ratio.

## Project records

- [Progress](PROGRESS.md)
- [Milestones](MILESTONES.md)
- [Complete application blueprint](<docs/blueprints/ZYNTH Complete Application Blueprint v1.docx>)
- [Blueprint PDF](docs/blueprints/Zynth_Blueprint_v1.md.pdf)
