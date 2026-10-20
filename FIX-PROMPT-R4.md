# FIX-PROMPT-R4: designed covers + the 5 missing portraits

Repo: `D:\STARTUP PROJECTS\eUtsav\IIW\Website\iiw-flipbook` (Next 16 App Router, cacheComponents, react-pageflip, baked data in `src/data/nominees.json`, `tools/refresh-data.mjs`, `tools/face.mjs`). Start from HEAD `fac0e9a`. Commit locally, do not push.

Read `src/components/BookCover.tsx`, `src/components/FlipBook.tsx`, `tools/refresh-data.mjs` and `tools/face.mjs` before changing anything.

---

## Part A. Designed front and back covers

Already placed by me (do NOT regenerate, resize or edit the pixels):

- `public/covers/cover-front.jpg` (1600x2400), `cover-front-sm.jpg` (900x1350)
- `public/covers/cover-back.jpg` (1600x2400), `cover-back-sm.jpg` (900x1350)
- Full-size masters: `design-src/covers/cover-front-master.jpg`, `cover-back-master.jpg`

All text is baked into the images. Front: "A Digital Heirloom / Inspiring Indian Women / 88 stories of courage, craft & community / Volume I 2026". Back: "Lift. Support. Rise. / 88 stories... / Every profile is published in the nominee's own words, with her consent." plus the eUtsav logo.

**A1. Rewrite `BookCover.tsx`.** Each cover stays a hard page. Keep `forwardRef`, `data-density="hard"`, the `fp fp-cover` classes and the props `(variant, count, phone)` so `FlipBook.tsx` needs no change. Remove the lotus medallion, masthead, foil title, tag, issue line and the `.fp-cover-frame` element (the image has its own gold frame). Render one `<img>`:

- `src` = 1600w file, `srcSet` with the 900w `-sm` file, sensible `sizes`
- `alt` front: `Inspiring Indian Women, Volume I 2026. A digital heirloom. {count} stories of courage, craft and community.`
- `alt` back: `Back cover of Inspiring Indian Women. Lift. Support. Rise. Every profile is published in the nominee's own words, with her consent.`
- `draggable={false}`, `decoding="async"`, eager load for the front, `user-select: none`, `pointer-events: none` so page-flip drag and corner-pull still work on the cover.

**A2. CSS.** Image fills the page: `position:absolute; inset:0; width:100%; height:100%; object-fit:contain; object-position:center;`. Page background `#e8e1d2` (matches the image edge) so any letterbox is invisible. Keep the existing hard-cover edge, spine shading and shadow rules on `.fp-cover`. Delete CSS that is now dead (`.fp-medallion`, `.fp-masthead`, `.fp-title.foil`, `.fp-tag`, `.fp-issue`, `.fp-cover-frame`) only after grepping that nothing else uses it.

**A3. Aspect ratio check (important).** The images are 2:3 (0.667). `FlipBook.tsx` sizes pages DESKTOP 550x715 (0.769) and PHONE 360x630 (0.571) with `size="stretch"`, so the real ratio changes with the viewport. Measure the rendered cover box at 1440x900, 1024x768 and 390x844 and report width, height and ratio for each in your final message. Do not stretch or crop the image to fix bars. If background bars show by more than about 8% on any side, leave it and tell me the ratios. I will re-render the covers at them.

**A4. Count guard.** "88" is baked into the front image. In the front cover only, in development only, `console.warn` if `count !== 88` ("Front cover image says 88 stories but data has N. Re-render the cover."). Do not change any visible text.

**A5. Leave alone:** interior pages, search/chips hiding on covers, NumbersPage, folio logic, filler leaf logic.

---

## Part B. Fill the 5 missing portraits

State today: `nominees.json` has 88 records, 5 with `image: null`:

| id | name | supplied file (in `public/portraits/`) | size |
|---|---|---|---|
| 6 | Hema Yellapragada | `Hema Yellapragada.jpg` | 1290x1653 |
| 70 | Usha Raghavan | `Usha Raghavan.jpg` | 647x647 |
| 73 | Suparna Rathi | `Suparna Rathi.jpeg` | 2048x1366 |
| 74 | Hema Manjunath | `Hema Manjunath.jpg` | 800x1120 |
| 79 | Kirti Soni | `Kirti Soni.jpg` | 1536x2048 |

I looked at all five. Each is a real photo of one woman. Per-file notes:

- **Usha Raghavan:** has a rounded yellow and teal frame baked into the photo. Trim 6% off every side first, then face-crop, so no border shows inside the circle or arch.
- **Suparna Rathi:** landscape event photo, face is small, a banner with tiny icon-faces is behind her. Make sure the detector picks HER face, not the banner. Result must be head and shoulders.
- **Kirti Soni:** selfie holding two pink NHS "Yes I donate" cards on the right. Centre on her face. Cards partly in frame are fine.
- **Hema Yellapragada:** full-length in a classroom, face small. Head and shoulders crop, not a torso crop. Do not upscale more than 1.2x.
- **Hema Manjunath:** standard portrait.

**B1.** Move the five originals from `public/portraits/` to `design-src/portraits-raw/` (full-size files must not ship to the CDN).

**B2.** Create `tools/manual-portraits.mjs`:

- exports `applyManualPortraits(nominees)`
- also runs standalone: `node tools/manual-portraits.mjs` patches `src/data/nominees.json` in place, offline, no network
- match records by normalised name, assert exactly one record per name, throw otherwise

**B3.** Crop with the existing face-centred 600px square logic from `refresh-data.mjs` (face.mjs UltraFace first, smartcrop fallback). If it is inline there, extract it into a shared module (e.g. `tools/crop.mjs`) and import it in both places. Do not copy-paste it. Output `public/portraits/manual-<slug>.jpg` (e.g. `manual-hema-manjunath.jpg`), JPEG, EXIF stripped (sharp default).

**B4.** For those 5 records only, set `image` to `/portraits/manual-<slug>.jpg`. Leave `imageId` and every other field alone. Do not touch the other 83 records or re-crop their files. In `refresh-data.mjs`, call `applyManualPortraits` right before the final write (after `applyFolder1`) so `npm run refresh` keeps these five. Keep the existing `PORTRAIT_BLOCKLIST` entries.

**B5. Verify with code and with your eyes:**

- code: 88 records, 88 with `image`, 0 null, every file exists, every crop is 600x600, no duplicate image paths among the five
- eyes: open each of the five output crops and confirm the face is centred, has headroom and is not cut. Save a 5-up contact sheet to `design-src/portraits-raw/_check.jpg` (do not commit it) and name the path in your final message. If any face is off, fix the crop for that file and say what you changed.

**B6.** If any page or copy shows a count of lotus fallbacks or "photos" as a static number (By the numbers leaf, about page, footer), check it is still true. There are now 0 lotus fallbacks.

---

## Part C. Repo hygiene

- **C1.** Move these out of `public/portraits/` into `design-src/` after confirming with `grep -rn` that `src/` does not reference them: `iiw-logo.jpeg`, `eUtsav_logo.png` (1.4 MB), `front-cover-1..4.jpeg`, `back-cover-1..2.jpeg`.
- **C2.** Add `*.bak` to `.gitignore`. Do not commit `src/app/about/page.tsx.bak` or `tools/refresh-data.mjs.bak`.
- **C3.** End state of `public/portraits/`: only the 83 Drive-ID crops plus the 5 `manual-*.jpg` crops (88 files).

---

## Do not

- Do not re-fetch from Drive or Sheets, and do not run the full `npm run refresh` unless it works offline.
- Do not change PII rules. Never surface email, phone, address, consent flags or curator notes.
- Do not add `force-dynamic` or `revalidate` segment configs (Next 16 cacheComponents rejects them).
- Do not stretch or crop the cover images.

## Acceptance

1. `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass.
2. Dev server screenshots at 1440x900 and 390x844 of: the front cover, the first content spread, the back cover, and one portrait lightbox. Use Playwright or the Chrome tool if one works. If no screenshot tool works, say so plainly. Do not claim a visual check you did not do.
3. Covers are not stretched or cropped, baked text is legible, drag and corner-flip still work on the hard covers, flip animation is smooth.
4. All five new faces show correctly in the cards and in the lightbox.

## Commits (no push)

1. `Covers: designed front and back images on the hard cover pages (contain-fit)`
2. `Portraits: fill the 5 missing photos via manual-portraits (face-centred 600px); move raw originals and design sources to design-src/`

## Final message

Keep it short: what changed, the measured cover ratios (Part A3), any portrait you had to hand-adjust, what you ran, and anything you could not verify.
