# Progress update

Updated: 14 October 2026 (Africa/Lagos).

The current update replaces onboarding and brings the blueprint's Mark Map into both its own screen and the background of Overview. This records implementation progress; it does not claim the app is ready for public deployment.

## Main reference

The primary reference is [ZYNTH Complete Application Blueprint v1](<docs/blueprints/ZYNTH Complete Application Blueprint v1.docx>), checked against the 60-page [PDF blueprint](docs/blueprints/Zynth_Blueprint_v1.md.pdf) and [extracted text](docs/blueprints/blueprint_extracted.txt). Both original files describe the complete v1 application. No separate Complete Application Blueprint `.md` file exists in this checkout.

The user requested new onboarding questions and a game-like world-map treatment. Those instructions supersede the original questions and the straight vertical presentation. The blueprint's checkpoint states, mission landmarks, shared Overview backdrop, adaptive profiling, and application-owned progression are retained. Original blueprint files are unchanged.

## Completed in this update

- Replaced the old five questions with one written aspiration and four everyday scenarios.
- Added a custom-text field, suggested directions, and a “Still exploring” option to the first question.
- Added Back navigation, primary/optional secondary choices, validation, and preserved answers on synthesis failure.
- Made the questions and signal mappings a shared source for both local classification and live prompts.
- Preserved the chosen direction in the profile and passed it into quest context and local calibration content.
- Kept work-style inference based on scenario choices; changing the destination alone does not change core starting attributes or learning style.
- Added a nullable aspiration column to the fresh database schema and a migration for existing databases. The migration has not been applied to an external database.
- Replaced the vertical Mark Map presentation with landscape regions, winding paths, forests, mountains, crossings, a compass, and checkpoint landmarks.
- Retained completed/current/future states, mission landmarks every seventh checkpoint, historical quest details, and current-checkpoint routing to a quest or Overview when preparation is needed.
- Added fourteen-checkpoint chapters, earlier-chapter viewing, a return-to-current control, and horizontal exploration on narrow screens.
- Made successful quest days the source of map progress. Failed attempts and duplicate same-day completions do not create extra marks.
- Added the same terrain and checkpoint geometry as a subdued, non-interactive layer behind Overview.
- Added responsive rules, keyboard-operable checkpoints, announced details, and reduced-motion handling.

## The new five steps

1. **What do you want to become?** A user-written direction, optional suggested starting points, or “Still exploring.”
2. **A queue that won't move.** A café has a queue despite empty tables; choose the first practical change to try.
3. **An unfamiliar tool.** Make a simple poster using a sample, a guide, or a blank canvas; choose where to start.
4. **Something has to give.** A pop-up event loses two helpers; choose what to cut while keeping it workable.
5. **The last twenty minutes.** An event guide is ready; choose where the final review time goes.

The scenarios infer tentative preferences through ordinary trade-offs. They do not ask for private experiences, weaknesses, family details, money, or personality confessions. They are not a validated psychological assessment.

## Verification

- Engine/regression suite: all 68 checks passed, including aspiration handling, scenario mappings, and world-map progression.
- All 500 primary combinations of the four scenario questions were exercised and produced schema-valid local profiles.
- TypeScript checking passed with the updated browser compilation target.
- Shared SVG map artwork was rendered from the actual component and visually inspected. A malformed decorative mission polygon was corrected.
- Browser inspection was attempted twice, but the browser tool failed to initialize because its runtime assets could not be written. The new onboarding layout and full interactive map have not been visually verified in a live browser in this update.
- Production build: passed; all 20 pages/routes compiled or generated successfully. Lint and TypeScript checks passed.

## Remaining project work

The previously recorded gaps remain in [engine status](ENGINE_STATUS.md): real Supabase authentication, server-owned progression transactions, authenticated/rate-limited model requests, live leaderboard refresh, Swift Mode controls, XP-card spending flows, durable offline grading/event recovery, and live community content.

This update adds the aspiration database migration but does not configure credentials, deploy the app, run migrations against a live service, or establish production readiness.
