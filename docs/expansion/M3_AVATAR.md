# M3 — Identity and avatar

Completed implementation: **5 November 2026**, Africa/Lagos. M3 is **8/8 (100%)**; weighted roadmap progress becomes **47/100 (47%)**. M4 inventory and earned cosmetics remain separate.

## Shipped foundation

The profile has a prominent layered Wayfarer scene, the actual display/character name, profession, aspiration, title, level and six existing attributes. Radar and compact skills sit beside each other on desktop and stack on phones. Overview renders the same saved character. No identity layer derives traits from appearance, changes attributes or deteriorates after an absence.

The optional editor previews male and female avatars, five skin tones, six hair styles (including bob and long hair), four hair colors, three free outfits, four outfit palettes and three backdrops. Both genders can use every hairstyle, outfit and color. Save commits the chosen appearance; Cancel/Escape discards the preview and restores focus. Reset preview selects the free default and still requires Save. The close button keeps cancellation reachable on touch screens. Account-scoped drafts recover an interrupted editor session.

Inline SVG layers have no downloaded image dependency, looping animation or asset-loading requirement. Invalid/unknown versions and item IDs resolve to a readable free default. The editor uses native radio controls, fieldsets, visible focus and a modal dialog; reduced-motion operation does not depend on an animation completing.

## Ownership and persistence contract

`src/lib/avatar.ts` defines version 1 and the shared outfit/accessory/aura slots. Only the three explicitly free outfits may be selected. Accessory and aura remain empty, and unreleased earned equipment is displayed as locked. Forged earned IDs, wrong-slot items and extra progression fields are rejected by the strict schema. This implements M3's free/default foundation; it does not claim server grants or an inventory exists.

Appearance is bounded cosmetic metadata (`zynth_avatar`) in the account's existing Supabase Auth user metadata. It is not authority for ownership, rewards or permissions. M4 must use verified server ownership/equipment records rather than trusting editable metadata or simply expanding this allowlist. No migration is needed for M3.

Account-scoped local values and pending saves support the same profile UI without a connection. Root synchronization retries saved cosmetics independently of quest synchronization. Writes capture the signed-in bearer token and verify the returned owner, preventing an account switch from redirecting a previous user's write to another account. Other metadata and profile/progression records are untouched. Unknown future data is rendered safely, without automatically overwriting it.

## Acceptance evidence

- **M3-A — 2/2:** layered default scene, accessible identity text and invalid-version/default fallback. Profile and Overview share `AvatarArt`.
- **M3-B — 2/2:** preview, save, cancel, reset, local/pending persistence and returning-account restoration.
- **M3-C — 2/2:** shared equipment slots, free-only selection and locked unreleased equipment; no progression writes or ownership claims.
- **M3-D — 2/2:** wide profile composition, stacked 390px layout, Escape/focus restoration, modal controls and reduced-motion browser flow.

Focused checks, respecting the owner's minimal-check workflow:

1. `avatar.test.ts`: default/future-version fallback, incompatible/earned item rejection, extra progression-field rejection and immutable previews.
2. `scripts/verify-avatar.cjs`: actual UI with disposable local accounts; cancel, save, fresh-session restoration, reset/Escape/focus, locked controls, six real attributes, unchanged profile records and desktop/phone layouts. Screenshots were inspected.
3. The existing approved hidden, zero-EXP test account verified the **actual** `saveAvatar` function against hosted Auth, restored its selection in a fresh signed-in SDK session and retained unchanged profile data. Its original avatar was restored afterwards. No existing user was edited. The private receipt remains in ignored `.review/m3-hosted-avatar-evidence.json`.
4. TypeScript, lint and local production compilation passed. The final compatible release uses the normal GitHub/Vercel workflow and refreshes the public page-shell cache.

Broader device coverage, long-disconnect/concurrent-tab stress, real Android acceptance and the full regression suite remain for the dedicated testing day/M11. M4 is next: versioned cosmetic inventory and server-owned grants/equipment.

## 6 November 2026 — Avatar gender options

Added male/female selection with distinct face and clothing silhouettes, independent of hairstyle, skin tone and clothing choices. Added bob and long hair to both options. Existing version-1 saved avatars without a gender retain the original male rendering and all their saved selections; no account or progression migration is needed. The shared renderer covers Profile and Overview in the web application and hosted Android shell. Gender saves through the existing account-scoped appearance workflow, including cached and pending saves.

Focused avatar boundary checks and TypeScript passed, including legacy records and round trips for both genders with every hairstyle. Extended the reusable browser flow to select and restore a female avatar; broad browser/device regression remains for the dedicated testing day. This requested addition does not change the weighted milestone score (47/100).

## 6 November 2026 - Shared profile pictures

The saved avatar is also the account picture in navigation, Settings and leaderboard podium/list/current-position entries. A head-and-shoulders view reuses the same character layers and equipment; it is not a separate uploaded image. Own pictures follow cached appearance/equipment changes immediately, and other participants' pictures arrive in the normal ranking snapshot.

The separately approved avatar-ranking migration returns only permitted avatar choices and actual owned equipment for eligible ranking participants. It excludes private account metadata and account IDs, retains all regional/category/opt-out rules and preserves the exact older RPC row contract for cached clients. Focused SQL, hosted read-only projection and phone-interface checks passed. Inventory is accessed inside Customize appearance alongside Appearance. Current roadmap progress remains 55% after M4 completion.
