# M3 / M4 ? Sculpted storybook rebuild


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
