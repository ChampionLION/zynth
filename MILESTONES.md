# Project milestones

Updated: 15 October 2026 (Africa/Lagos).

## Completed milestones

### 13 October 2026 — Local engine review and responsive workspace

Reviewed the existing local engine flow against the blueprint. Fixed reward, prestige, grading, persistence, and connection bugs, added regression coverage, and introduced a wider desktop workspace with mobile bottom navigation. The local suite passed 48 checks at that point. Production-service gaps were recorded in [engine status](ENGINE_STATUS.md).

### 14 October 2026 — Aspiration-first onboarding

Implemented exactly five onboarding steps: a custom written direction and four grounded scenarios. Added suggestions, “Still exploring,” Back navigation, optional second choices, input validation, and retry feedback. Question definitions, local signal interpretation, and live prompt content now share the same source.

Acceptance criteria completed:

- [x] The first question asks what the user wants to become.
- [x] The first answer supports custom text.
- [x] Four ordinary scenarios replace the original fantasy/personal questions.
- [x] Choices use trade-offs rather than an obvious good/bad answer.
- [x] The chosen direction reaches profile and quest context.
- [x] All 500 primary scenario combinations produce valid local profiles.
- [x] Existing profiles remain loadable without forced re-onboarding.

### 14 October 2026 — Shared world-map progression

Implemented a landscape of connected checkpoints and mission landmarks. The blueprint's progression remains visible in the dedicated map and as a faint background in Overview. Fourteen-checkpoint chapters keep long journeys manageable; earlier completed chapters stay available.

Acceptance criteria completed:

- [x] A terrain map replaces the straight vertical presentation.
- [x] Completed, current, and future checkpoints remain distinct.
- [x] Seventh checkpoints retain mission-landmark treatment.
- [x] Completed checkpoints expose quest details, grade, date, and EXP.
- [x] Current checkpoints route to the active quest or quest preparation.
- [x] The same map geometry and progress appear behind Overview.
- [x] Progress groups successful days and excludes failed attempts.
- [x] Narrow screens can explore the map horizontally.
- [x] Rendered shared SVG artwork was visually reviewed.

## Automated release checks for this update

- [x] All 68 local engine/regression checks pass.
- [x] All 500 primary scenario combinations produce schema-valid profiles.
- [x] Lint and TypeScript checks pass.
- [x] Production build passes for all 22 pages/routes.

## Verification still requiring a live browser

- [ ] Walk through all five new onboarding steps on desktop and mobile.
- [ ] Confirm Back navigation, secondary-choice changes, Enter submission, and synthesis retry in the browser.
- [ ] Check the Overview background against real text/cards at multiple widths.
- [ ] Exercise checkpoint selection, horizontal exploration, chapter navigation, and current-quest routing.

The browser tool could not initialize during this update. Automated logic/build checks and static map rendering are separate from the uncompleted browser checks above.

## Next production milestones

### Real accounts and trusted progression — Not complete

Supabase authentication and profile/draft storage are connected. Move grading rewards and profile updates into validated server transactions; verify a real inbox-driven production signup/signin flow.

### Reliable live services — Not complete

Model requests require verified authentication. Add rate limiting, verify live provider output, implement leaderboard aggregation/current-user lookup, and connect real community data.

### Complete quest economy and recovery — Not complete

Wire Swift Mode and XP-card spending actions; responses now persist; finish durable grade reveals and queued events through failures and refreshes.

### Release verification — Not complete

Complete browser checks across desktop and portrait mobile layouts, exercise the entire live onboarding-to-quest-to-progression loop, and resolve the remaining deployment blockers before publishing.

## 15 October 2026 — Landing page and account continuity

- [x] Minimal public landing page with fluid desktop and mobile layouts.
- [x] Email/password signup, signin, confirmation callback, and password reset UI.
- [x] Connected Zynth Supabase project and applied application/draft migrations.
- [x] Account-owned profile, incomplete onboarding, and unfinished quest persistence.
- [x] Return routing for new, partially onboarded, and existing accounts.
- [x] Account isolation and stale asynchronous-load protection.
- [x] Authenticated model requests; live anonymous database-access checks.
- [x] No remaining Supabase security advisor findings.
- [x] Engine and account integration checks, lint, types, and 22-route build pass.
- [x] Vercel project found and account environment configuration saved.
- [x] Verify the new production deployment, its exact application commit, public account routes, published Supabase configuration, and model access boundary at https://zynth-one.vercel.app.
- [ ] Save production Supabase Site URL and redirect allowlist.
- [ ] Configure production email delivery and verify a real confirmation/reset inbox flow.
- [ ] Complete desktop and mobile browser interaction/visual checks.
