# Maison Aurelle

Marketing site for a single (fictional) lakeside residence. Scroll is the medium: every section has its own scroll behaviour, entrance and matching exit.

The stack is vanilla HTML, CSS and JS modules, with Vite, GSAP 3.15 (ScrollTrigger, SplitText, CustomEase) and Lenis 1.3. There's no WebGL or canvas.

## Run

```bash
npm install
npm run dev          # http://localhost:5188
npm run build        # → dist/
```

Node isn't on the system PATH on this machine; it's managed by mise. Use `mise exec node@24 -- npm run dev`, or the `residence` entry in `../.claude/launch.json`.

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml`. The workflow sets `BASE_PATH=/<repo>/` so every asset URL works under the Pages sub-path. Images and videos are built locally (`npm run assets`) and committed in `public/media/`; CI only bundles.

## Swapping in real imagery

Every image and video is currently a generated **placeholder plate**. The plates are original drawings, labelled `PLACEHOLDER · NAME` in the corner.

1. Put real files in `assets-src/img/` and `assets-src/video/` using the **same basename** as the slot, e.g. `hero.jpg` or `water.mp4`. Any of `.jpg .jpeg .png .webp .avif` or `.mp4 .mov .webm` works. Real files always win over placeholders.
2. Run `npm run assets`.
   - Images come out as AVIF and WebP at 640, 1024, 1600, 2400 and 3840px. Hero quality is stepped down until the 1600px AVIF is under 400 KB.
   - Each video is cut to a 5s silent loop and encoded as H.264 MP4 plus VP9 WebM, with a WebP poster. Use `npm run assets:video -- --start=2.5` to choose where the cut begins.
   - `public/media/img/manifest.json` is updated. Vite's `<x-img>` transform reads it to write the `<picture>` markup, including `width`/`height`.
3. Change the footer line `Imagery: placeholder plates` to your credits.

| Slot | Shape | Section |
|---|---|---|
| `hero`, `hero-night` | 16:9, ≥5000px ideally (scaled 2×) — **same framing**, day and night | Hero dive + day/night toggle |
| `detail-material`, `slide-terrace`, `slide-dining` | 3:2 | Concept slider |
| `quote` | 16:9 | Quote (rises out of the sky) |
| `loc-lake`, `loc-aerial` | ~7:3, 3:2 | Location track |
| `loc-shore` | 4:5 | Location track |
| `valley` | 16:9, sky in the top third | Clouds part to reveal it |
| `amen-spa`, `amen-pool`, `amen-library`, `amen-garden` | 4:5 | Amenities grid (`amen-pool` is also the room you zoom into) |
| `bedroom-view` | 3:2 | Residences |
| `arch-facade` | 16:9, **symmetrical** | Architecture curtains |
| `interior-living` | 16:9 | Interiors |
| `water`, `light-wall` (video) | any, ≥1080p | Location, interiors |

Clouds and olive sprigs in `public/media/deco/` are original generated artwork (`node scripts/make-deco.mjs`), not placeholders.

Slots are defined in `scripts/manifest.mjs`. To regenerate the placeholders, run `npm run placeholders`.

## Where things live

| | |
|---|---|
| `src/core/timing.js` | The **only** place durations and eases are defined (`durS/M/L`, six CustomEases + `loadBar`) |
| `src/core/scroll.js` | Lenis wired exactly per brief, `lagSmoothing(0)`; layout-stable scroll lock |
| `src/core/reveal.js` | Six primitives `(elements, state, delay)` × `reveal/hide/initial`; wrapper grouping; `data-reveal-first` capping |
| `src/core/parallax.js` | Five `data-parallax` variants, rebuilt across 992px by `gsap.matchMedia()` |
| `src/core/theme.js` | Per-section theme swap for fixed UI (`data-bg` → `theme_on-*`) |
| `src/ui/*` | Preloader (four-layer CSS mask arch), corner mark, progress rail |
| `src/sections/*` | One file per scroll behaviour |

## QA

With the dev server running:

```bash
npm run qa -- --out=qa-shots               # frames of preloader + every section, CLS/LCP, console
npm run qa -- --w=390 --h=844              # mobile
npm run qa -- --rm                         # prefers-reduced-motion
npm run qa -- --repeat                     # second visit → short loader
npm run qa:interact                        # keyboard pass, tabs, dialog, resize across 992px
```

These scripts drive the locally installed Chrome through `puppeteer-core`.

## Decisions worth knowing

- **Sticky, never `pin`.** Every hold is a tall wrapper plus a `position: sticky` screen. While ScrollTrigger refreshes, `html.st-refresh` briefly releases every sticky layer so trigger positions are measured against natural flow.
- **Footer card.** The page element becomes `position: sticky` with its bottom edge pinned to the viewport's bottom edge, and the footer rises behind it. The brief's `inset(8% 22% 8% 22%)` is computed in px against the page's last viewport, because `inset()` percentages of a 20,000px element would clip the wrong region.
- **`once: true` versus mirrored exits.** Each reveal group's entrance trigger is `once: true`, as the brief asks. A second, lightweight trigger plays the mirrored exit on `onLeaveBack` and replays the entrance when you come back down.
- **Arch mask.** `public/arch.svg` holds the two *spandrels* (the corners above the curve). Unioned with the three gradient layers, that leaves an arch-shaped hole.
- **No layout shift.** The preloader outlines and progress thumb move by transform only. The spread keeps each line's first word anchored, so its start position never changes. Fallback fonts carry measured `size-adjust` and ascent/descent overrides.
- **Safari** isn't covered by the QA scripts. Check video playback and scale resampling on a real device.
