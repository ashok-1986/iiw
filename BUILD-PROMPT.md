# Build prompt — IIW "Inspiring Indian Women" flipbook

Build a flipbook-magazine website for the client IIW (Inspiring Indian Women, under eUtsav): an editorial directory of women leaders where each spread turns like a page of a book. Luxury Indian aesthetic, two profiles per page. This is a real client deliverable, so reliability and data hygiene matter more than clever architecture.

## Stack (pinned, do not swap)
- Next.js 16 (App Router, Turbopack, `cacheComponents` enabled), React 19, TypeScript, Tailwind 4.
- framer-motion (page-turn + motion), zustand (flipbook + UI state), three.js (3D lotus on the cover only).
- IMPORTANT: this Next 16 is NOT the version in your training. `force-dynamic` and `revalidate` segment configs are rejected under cacheComponents. Read `node_modules/next/dist/docs/` before using an API you are unsure about. `next/font/google` fetches fonts at build, so the build needs internet (fine on a dev machine and on Vercel).

## Data: baked, not live
Do NOT read Google at runtime. A script pulls and bakes the data + photos into the repo; the site ships that. Provide `npm run refresh` (a Node script, `tools/refresh-data.mjs`) that re-pulls and rebakes, to run after the sheet changes.

Sheet id: `1loMFRoc6H5nDFZk5-tjXDjH0DCq0KUFHF-ggOIC1Geg` (public; read with the gviz CSV endpoint `.../gviz/tq?tqx=out:csv&gid=<gid>`, no API key).
Three tabs, bind columns BY HEADER NAME, never by column letter:
- Final Directory (gid 0): Name, Description, Consent, DUE Diligence. Curated, ~18 rows.
- Form responses 1 (gid 688232594): Nominee Name, Key Focus / Organization, Executive Summary (~50 words), Image Link. The best source, ~88 rows.
- Old (gid 293174): raw form. Your Name, Tell us about yourself, Image Upload, Consent. Col B is a personal EMAIL and must NEVER be read into the site.

### Consolidation rules
- Merge all three into one unique list, keyed by a normalised name. Normalise by lowercasing, dropping parenthetical nicknames, and stripping honorifics (dr, prof, mr, mrs, ms, smt, cllr, sir, dame...) and post-nominals (obe, mbe, bem, phd, mba...). This collapses "Reena Ranger OBE" / "Reena Ranger" and "Dr (Prof) Arpita Ray" / "Arpita Ray" into one. Expect ~89 unique, not 100.
- Field priority: Form responses 1, then Final Directory, then Old.
- `summary` (card text) = the short Executive Summary where present. `fullText` (profile page) = the longest available bio across the three sources. `org` = Key Focus / Organization. Do not pad summaries to a fixed length; publish the woman's own words, lightly tidied. Never invent facts.
- `imageId` = Drive file id from the Image Link / Image Upload column.

### Photos
Download each `imageId` from `https://drive.google.com/thumbnail?id=<id>&sz=w1000` into `public/portraits/<id>.jpg`. Validate it is a real JPEG/PNG; if it is an HTML error page or missing, set the photo to null so the card shows a lotus-and-initials fallback. Reference photos locally (`/portraits/<id>.jpg`), never the live Drive URL.
Some uploads are NOT portraits (WhatsApp screenshots, event posters, a donation webpage). Keep a `PORTRAIT_BLOCKLIST` of normalised names whose photo is forced to the lotus fallback. Seed it with: divya parakat, hema yellapragada, usha raghavan. About 7 curated women have no photo at all; they use the lotus fallback too.

Output: `src/data/nominees.json`, each record `{ id, name, org, summary, fullText, imageId, image, sources }`.

## Design system (luxury Indian, calm whitespace)
- Fonts: Playfair Display (display/headings), Cormorant Garamond (italic accents), Lora (body), Inter (UI).
- Palette: deep lagoon ink text `#1f3640`, nectarine `#d7897f`, peche `#f9b95c`, menthe `#96c7b3`, lagune `#6398a9`, warm cream paper. Cards sit brighter than the page.
- Motifs: 8-petal lotus mark (plus one 3D lotus medallion on the cover via three.js, with a gentle idle float), rangoli 3-dot divider, arch-top cards (24px top radius), portrait in a double ring, faint silk texture overlay, a four-colour hairline band on each page top.
- Reference feel: fliphtml5 "clean / minimalist" magazine calm, kept inside the Indian luxury character. Airy, not busy.

## Pages
- `/` cover (lotus, "Inspiring Indian Women", Cormorant tagline, "Enter the Archive" CTA that scrolls to the flipbook) then the flipbook section with a search pill.
- `/profile/[slug]` full profile (large portrait, name, org, full bio, share bar, Person JSON-LD). slug = kebab(name)-id.
- `/about`, sitemap.xml, robots, per-route OpenGraph images.
- `/api/image/[id]` stays only as a fallback proxy; the site uses local photos.

## Flipbook behaviour
- A real 3D page turn (CSS `perspective` + a hinged leaf with front/back faces via framer-motion), progress-driven so a drag follows the finger and settles with a flick. Keyboard arrows, Prev/Next buttons, progress dots (collapse to "n / total" past ~24). Desktop shows a two-page spread (2 profiles per page, 4 per spread); phone shows one page (2 profiles) and swipes.
- Search pill: debounced, filters name + summary + org + category, URL-synced `?q=&cat=`, never shows a numbered index.

## Interactions (apply emil-design-eng + ui-ux-pro-max)
- Sound: a synthesised page-flip via Web Audio (no asset files), MUTED by default, with a toggle. Create the AudioContext lazily on first gesture.
- Portrait click-to-zoom lightbox: backdrop blur, panel scales from 0.96 (never 0), ease-out, Esc + backdrop close, body scroll lock, reduced-motion aware.
- Ambient float on the cover lotus; card hover lift; entrance stagger (30-80ms) on first view only.
- Motion rules: animate transform/opacity only, custom ease-out curves, UI animations under 300ms, respect `prefers-reduced-motion`, gate hover behind `(hover:hover) and (pointer:fine)`.

## Guardrails
- Never let email, phone, address, consent flags or curator notes reach the client. Project to a client-safe shape at the server boundary.
- Accessibility: AA contrast, visible focus rings, keyboard flip, alt = name, 44px touch targets.

## Acceptance
- `npm run build` is green (TypeScript + all routes).
- `/` renders ~89 unique women, two per page, with local photos and lotus fallbacks; flip works by drag, keys, buttons, dots on desktop and mobile.
- Lightbox opens from any portrait; sound is off until toggled.
- No duplicate women; no non-portrait image shown as a face; no email anywhere in the shipped output.
- `npm run refresh` rebuilds `src/data/nominees.json` and `public/portraits/` from the sheet.

Plan the steps and show them before building. Keep commits small.
