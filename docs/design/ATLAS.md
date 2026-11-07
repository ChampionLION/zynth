# Atlas design system

Established 7 November 2026. UI-only foundation: existing copy, route structure, account data and progression rules are preserved. The only added labels explain disabled controls, as requested.

## Source of truth

- `src/styles/atlas-tokens.css`: canonical light palette, system/manual dark overrides, six type sizes, spacing/radius/shadow/motion tokens and RGB aliases for existing alpha utilities.
- `src/styles/atlas-components.css`: shared primitives and the compatibility skin for existing screens.
- `src/components/ui/Atlas.tsx`: Button (primary/secondary/ghost), Card (flat/raised/highlighted), Chip, ProgressBar, EmptyState, Tabs/segmented controls and Toast. Existing `Dialog` remains the shared modal with focus restoration, Escape handling and native modal containment.
- `tailwind.config.ts`: token-backed theme and six-size utility scale. Existing `primary` text utility retains its historical ink meaning; action copper is `--primary` / `copper`.

Run `node scripts/build-atlas-guide.cjs` to regenerate the standalone `atlas-style-guide.html` and light/dark specimens directly from shared React primitives. No application route was added. Open the HTML files locally.

## Application rules

Light pages use parchment and paper; maps, hero atlas panels and event celebrations use forest surfaces. Copper identifies actions, neutral ink is used for stats and decorative labels, and indigo identifies XP/levels/tiers. Category colors appear in small category chip dots, with a contrasting outline. Existing broad domain-colored treatments now use neutral theme ink rather than large category fills. Gold is scoped to atlas/celebration surfaces.

Body text is 14px minimum, reading content 16px with 1.6 line height and 65ch measure, labels 12px. Cards use 24px desktop / 16px mobile padding. Controls have 44px targets, 8px radii and 2px copper focus rings. Disabled controls retain readable contrast and show a reason rather than opacity alone. Decorative map geometry and avatar drawings are not text/control contrast targets.

Dark mode uses the requested six core overrides. Copper hover/tint, on-primary, progression and status variants also adapt so text and controls remain readable; fixed atlas colors do not change. In particular, the light copper action fill uses dark ink text in dark mode. Existing Settings system/light/dark preferences and account persistence are reused without changing their logic.

The desktop sidebar is fixed to the viewport with independent overflow and a matching full-document column background. Mobile navigation remains at the bottom. The Overview still has its atlas backdrop, at lower contrast for long reading.

UI transitions are 200ms ease-out and reward reveals 800ms. Reduced motion disables CSS animations/transitions; the existing Framer Motion provider still honors both device and saved reduced-motion preferences. State is unchanged by presentation.

## Focused validation

TypeScript and full existing lint passed. Disposable browser checks at 1440×1000 and 390×844 confirmed light/dark surfaces, full viewport sidebar height and no horizontal overflow. Light/dark guide and Overview snapshots are included beside this document. Token-pair contrast results are in `ATLAS_CONTRAST.md`; this is focused verification, not a claim of a complete accessibility audit of every dynamic state.

Literal exceptions with file/line references are in `ATLAS_REMAINING_COLORS.md`. Avatar drawing colors and persisted appearance palette choices remain intact, as do raster brand/OG/Android icon assets. Browser `theme-color` is a literal parchment value because that metadata cannot resolve CSS variables.
