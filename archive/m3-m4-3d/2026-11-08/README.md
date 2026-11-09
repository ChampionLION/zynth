# Preserved 3D atelier checkpoint

Saved on 8 November 2026 before switching the active presentation to layered image artwork at the owner's request. This includes the unpublished visual refinements, not just the last deployed prototype.

- `components/Avatar3D.tsx`: Three.js renderer, snapshots, orbit controls, lighting and cleanup.
- `lib/avatar-scene.ts`: all procedural characters, hairstyles, outfits, equipment, rooms and texture generation.
- `components/AvatarArt.tsx`: original integration entry point.
- `components/AvatarIdentity.tsx`, `components/InventoryPanel.tsx`, `styles/atelier.css`: compatible editor, inventory and camera layout.
- `lib/avatar.ts`, `lib/inventory.ts`: appearance/equipment contracts at this checkpoint.
- Package manifests pin Three.js and its types. `refinement.patch` records the uncommitted changes against deployed commit `84311b40aa28940daa102ef90778c66b37645a25`.

The working `src/components/Avatar3D.tsx` and `src/lib/avatar-scene.ts` are also retained. They are not imported by the image presentation. To resume 3D later, use this entry point and renderer as a reference; do not restore account/database code wholesale over later changes. No data, ownership records, migrations or progression were reverted. Restore camera CSS from this snapshot when re-enabling the renderer. This is a prototype checkpoint, not final approved character fidelity.
