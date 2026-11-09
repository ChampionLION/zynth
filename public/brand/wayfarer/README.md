# Layered Wayfarer artwork

**Preserved experiment:** the active application returned to `Avatar3D` on 9 November 2026 at the owner's request. These images and their renderer are retained for later reuse; “active” below describes the last image-based checkpoint, not the current app entry point.

Generated using the built-in image tool, 8 November 2026. Exact original prompts are in `docs/expansion/WAYFARER_IMAGE_PROMPTS.json`; the cohesive-body refinement prompts are in `docs/expansion/WAYFARER_BLEND_PROMPTS.json`.

- `clothing-v3.png` (active): six softly sculpted free wardrobe silhouettes, three masculine and three feminine, matched to the face rendering. Three columns, two rows. Authored moss wool allows material-specific hue changes while linen and leather retain their colours. `clothing-v1.png` is the initial photographic prototype; `clothing-v2.png` is the neutral style-transfer source.
- `faces-v1.png`: twelve faces, six skin tones per gender. Three columns, four rows.
- `hair-v1.png`: fourteen hairstyles and two beard overlays. Four columns, four optically spaced rows; the compositor records individual UV rectangles.
- `settings-v1.png`: atrium, grove and workshop in three side-by-side panels.
- `earned-clothing-v2.png` (active): six earned outfits per gender, matched to the soft body/face style, with covered forearms. Three columns, four rows. `earned-clothing-v1.png` is retained as the initial source.
- `equipment-v1.png`: scarf, satchel, pin, spectacles, gloves, boots, hood, pendant, map carrier, lantern, halo and belt. Four columns, three rows. Belt is an art spare, not a new inventory grant.

All character sheets retain generated alpha. Scenery is opaque. `src/lib/avatar-image.ts` composites these same-origin assets on a 2D canvas and exports static WebP pictures; CSS provides small optional horizontal depth movements, light and close-up framing. A feathered neck joins the face to the collar, the hair casts a small contact shadow, and the floor shadow is part of the same image as the character so it stays registered to the feet. View controls sit beside the figure. There are no runtime 3D models. Existing appearance IDs, saves and ownership rules remain the source of truth. The three free outfits use hue-specific wool tinting, face shapes use proportional variations, eye colour/expression use small composited changes, builds/heights use scaling, and earned wardrobe uses separate artwork. This is image-based art, not a rotatable sculpt.

These files are public presentation assets, not confidential inventory records. Their availability does not grant ownership or disclose user account data. Inventory screens and database reads continue to expose only earned items. The existing service worker caches `/brand/` assets as they are used; one hair/face sheet supports all its variants without further requests.
