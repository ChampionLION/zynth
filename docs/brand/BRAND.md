# Zynth brand assets

Updated 15 October 2026.

- Name: **Zynth**.
- Slogan: **Synthesize your Zenith**
- Explanation: **Build who you want to become.**
- Open Graph title: **Zynth — Synthesize your Zenith**

## Identity

The user's approved black staircase Z is the source for the app identity. `src/lib/brand.ts` holds the shared crisp SVG outline, slogan, metadata title, description, and current website origin. `src/components/BrandLogo.tsx` combines the mark with the approved serif wordmark and provides light/dark variants with an accessible name.

Public pages, account screens, onboarding, workspace navigation, and account/loading states use the shared identity. The old star logo is removed. The original approved transparent and white PNGs are retained in `public/brand`.

## Files

- `public/brand/zynth-mark-v1.svg`: scalable icon-only Z.
- `public/brand/zynth-wordmark-v1.png`: tightly cropped approved serif wordmark with transparency.
- `src/app/favicon.ico`: 16, 32, 48, and 64 pixel icon sizes.
- `public/favicon.svg`: scalable favicon on an ivory tile.
- `public/brand/favicon-32-v1.png`: browser PNG fallback.
- `src/app/apple-icon.png`: 180 × 180 touch icon.
- `public/brand/zynth-icon-192-v1.png` and `zynth-icon-512-v1.png`: larger icon exports.
- `public/brand/zynth-og-v2.png`: 1200 × 630 social-sharing card, with no domain or website address in the artwork.

Root metadata supplies the site name, title, description, large Open Graph image and Twitter card, plus favicon links. Social image paths resolve against the website origin; removing the domain from the artwork does not remove the URL required for fetching the image.

## Share image production

The share image was generated with the built-in image-generation tool using the approved logo as its reference, then exported at exactly 1200 × 630. Its final text is the slogan and explanation above. The result was visually inspected at its published size. The final edit prompt was:

> Edit only one thing in the attached finished Zynth Open Graph image: REMOVE the domain text 'zynth-skillforge.vercel.app' from the bottom left and seamlessly fill that area with the same warm ivory background. Do not put any replacement text there. Keep all other elements exactly unchanged: top-left ZYNTH label, amber accent rule, large two-line serif slogan 'Synthesize your zenith.', smaller explanation 'Build who you want to become.', and the black staircase Z with serif ZYNTH logo on the right. Keep the same wide landscape layout, colors, logo geometry, typography, spacing and sharpness. No website address, URL or domain anywhere in the image. Preserve the clean, spacious background.

Logo refinement prompts and the original generated assets are documented in `logo-refinement-v1.md`. The app's SVG mark is a precise orthogonal reproduction for crisp small-size display; the favicon uses the mark alone so the tiny wordmark is not squeezed into a browser tab.
