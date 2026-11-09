# M3 / M4 — Sculpted storybook rebuild

## Current release — 9 November 2026: restored 3D atelier

The owner requested a return to models and deployment of the pending refinement. `AvatarArt` again loads `Avatar3D` for the atelier, identity, overview, reward moments and public portraits. The image renderer, generated artwork, exact prompts and earlier 3D ZIP remain preserved for reference; they are not used by the active entry point. The historical image-direction notes below are superseded by this release.

The refinement adds a curved scalp/hairline, shoulder-length braids with woven ridges, softer jaw/cheek shaping, inset irises and eyelids, smaller hands and boots, smooth garment profiles and cloth sheen/weave. Knitwear, shirts, vests, coats, cloaks and aprons use different tailoring instead of all inheriting coat lapels and belts. Spectacles and hoods share the head transform; boots share the foot transform; the map carrier no longer also creates an unintended satchel. Lighting, contact with the display platform and the atelier windows/floor/foliage have been refined.

The editor now reuses its WebGL renderer across appearance changes, disposes scene resources, offers zoom buttons and restores the correct home camera. Mobile controls sit alongside the figure; editor categories keep the expanded choices manageable. Existing account appearance, save/cancel/draft persistence, owned inventory, discovery privacy and progression are preserved. No new database migration is required.

Release checks passed: production Next.js build (including types/lint), focused changed-file lint, and a 1440px/390px fixture browser check covering real WebGL rendering, stable canvas reuse, male-to-female changes, braids/eye colour, rotate/zoom/recenter, saved restoration, cancellation and mobile fit. Screenshots: `docs/design/wayfarer-3d/`. Deployment targets project `zynth` in ChampionLION's existing team, using the `master` production branch and `zynth-skillforge.vercel.app`.

This completes the requested refinement/release work. The models remain procedural; authored production sculptures matching the original concept sheets and physical Android acceptance remain separate roadmap work. Historical roadmap completion stays at 70%; this visual rework does not add milestone points.

## Current direction — 8 November 2026: image-based dimensional artwork

### Full-avatar cohesion refinement

Replaced the photographic base and earned clothing sheets with softly sculpted storybook bodies that match the face artwork and warm light. Active assets are `clothing-v3.png` and `earned-clothing-v2.png`. Moss uses authored material colour; other palettes follow the wool hue, preserving linen, trousers, leather and their shading. The neck now blends into a continuous shaded stem behind the collar, face-shape changes keep the collar anchor fixed, and hair width follows face width. A single soft floor shadow is composited with the figure, the broad cutout drop shadow is removed, and depth movement is horizontal so feet stay grounded. View controls move to the side to expose the full silhouette on mobile. The saved 3D checkpoint is untouched.

Focused TypeScript/lint and the 1440px/390px save/reopen/cancel check passed. A local no-WebGL visual probe rendered six gender/outfit/palette combinations and six earned looks. Updated screenshots and the outfit contact sheet are in `docs/design/wayfarer-images/`; exact refinement prompts are in `docs/expansion/WAYFARER_BLEND_PROMPTS.json`. Local changes remain unpublished; no additional roadmap completion is claimed.

The owner replaced runtime models with images that look sculpted and spatial. The active `AvatarArt` entry point now loads `AvatarImage`, not `Avatar3D`. Six generated asset sheets supply gender-specific free/earned clothing, six skin tones per gender, fourteen hairstyles, beard overlays, equipment and three textured settings. The renderer uses 2D canvas composition, bounded picture/asset caches, same-origin image exports, layered scenery/contact shadows, optional pointer depth and full/close-up views. Reduced-motion keeps a static view. Existing appearance, drafts, save/cancel, inventory ownership and public portrait contracts are unchanged. Profile-share exports use the composed portrait.

**3D preservation:** `archive/m3-m4-3d/2026-11-08/` contains the complete renderer/scene, editor/inventory integration, CSS, appearance contracts, manifests, and an exact patch of the unpublished visual refinements. Live-source `Avatar3D.tsx` and `avatar-scene.ts` remain present and byte-identical to their archived copies. They are inactive, not deleted. The archive is excluded from compilation so historical integration files cannot break the current build.

The earlier 3D foundation and approved database update were deployed at `84311b4`. The image-based replacement is local at this update. Historical notes below describe earlier checkpoints and are superseded by this section for current release status. No new migration, grants or progress changes are part of the image switch.

Focused checks passed: TypeScript, changed-file lint, desktop/mobile editor save/reopen/cancel, all fourteen hairstyles for both genders, six earned-outfit render paths and equipped-layer composition. The compositor probe rejects any WebGL context request. A visual pass corrected neighbouring sprite bleed, collar gaps and mobile preview width. Physical-device and final art acceptance remain open; roadmap completion stays at the historical 70% baseline. Broader testing remains deferred per the owner's preference.

Asset specifications and exact built-in generation prompts: `public/brand/wayfarer/README.md` and `docs/expansion/WAYFARER_IMAGE_PROMPTS.json`. The same image approach is the direction for later atlas work; no M5/M6 map layout or cutscene implementation changed in this task.


## 8 November 2026 ? M3/M4 storybook rebuild IN PROGRESS

Reopened M3 and M4 for the approved 3D direction. Local foundation: real Three.js geometry/materials, interactive full-screen atelier with rotate/zoom/recenter, male/female choices with 14 hairstyles, six skin tones, five hair and eye colours, six garment palettes, four face shapes, three builds/heights/expressions and four facial-hair choices. Existing appearance metadata defaults remain compatible. Snapshot portraits share the same 3D scene across identity/overview/rankings, using a shared renderer to avoid a WebGL context per ranking row; profile sharing now reads the rendered image.

M4 local work filters unearned items from UI, cache and API responses. A prepared migration adds 12 pieces across nine total slots, hides unowned catalog rows with RLS, preserves verified grant/replay rules and expands public appearance whitelisting. Production application requires the separately requested owner approval; it has not been applied.

Focused appearance boundary, TypeScript/lint, local SQL ownership/discovery/replay/isolation and browser WebGL/save/cancel/mobile checks passed. The actual procedural character is a functional prototype and does NOT yet match the approved concept-art fidelity: final sculpted character assets, hair/garment finishing, detailed atelier art, performance/physical-device acceptance and production rollout remain OPEN. No new completion points are claimed; 70% remains the historical accepted baseline, not acceptance of this rework. The live site is unchanged.

## Remaining acceptance

- [x] Real 3D scene and on-demand rendering; accessible keyboard camera alternatives.
- [x] Expanded shared appearance controls and old-record defaults.
- [x] Scoped save/cancel/draft restoration, rendered portraits and share export integration.
- [x] Prepared hidden-catalog migration, 12 new modeled item types, six new slots and local SQL checks.
- [ ] Authored production character meshes/hair/garments and material finish matching approved concepts.
- [ ] Final atelier environment art matching the visual direction.
- [ ] Production migration approval/application and public leaderboard verification.
- [ ] Physical Android/WebGL compatibility and mobile rendering budget acceptance.
- [ ] Reviewed release.

The new migration does not change XP, skills, levels or existing cosmetic ownership. It expands existing catalog/check constraints and replaces inventory projection/equip logic; grants remain server-owned and tied to verified completion evidence. New pieces can reconcile from existing verified learning. The application uses 1024-square procedural surface maps as prototype materials; these are not scanned 4K artist textures, and the preview images are not represented as runtime screenshots.


### 8 November 2026 — Approved database expansion applied

The owner-approved storybook_atelier_inventory migration is applied to Zynth as version 20261108060454. Expanded equipment uses versioned sync_atelier_inventory/equip_atelier_cosmetic endpoints; old endpoints retain their original bounded item/slot shape while the new renderer is staged. Old appearance records keep their previous public shape; newly expanded records are whitelisted. Added 12 catalog pieces (20 total), six new wearable slots, ownership-only catalog visibility and verified progression grants. Production permission/catalog/appearance checks passed without changing existing user progress. The 3D frontend remains local and visual acceptance is still open.
