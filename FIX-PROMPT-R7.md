# FIX-PROMPT-R7: the 97th profile (96 to 97)

Repo: `D:\STARTUP PROJECTS\eUtsav\IIW\Website\iiw-flipbook`. Start from the current working tree (R6 changes are there, uncommitted or committed, do not reset anything). Commit locally, do not push.

## Already placed by me (do NOT regenerate, resize or edit)

`public/covers/cover-front.jpg`, `cover-front-sm.jpg`, `cover-back.jpg`, `cover-back-sm.jpg` and the masters in `design-src/covers/`. Front and back now say "97 stories". Nothing else on the covers changed.

## Steps

1. **Find and verify the 97th record.** `src/data/nominees.json` has 96 records right now, so the new woman is not in it yet. First locate and verify the 97th nominee, including her name, bio, and photo, using the specified data and portrait sources (`tools/data/community-nominees.json`, any new file in `public/portraits/` or `design-src/portraits-raw/`, and the live source if `npm run refresh` works offline); do not invent missing information. If any required data is unavailable, stop after the lookup and report exactly what is missing without changing counts.
2. **Counts.** Only after adding the verified record should you update `BookCover.tsx`'s `BAKED_COUNT` to 97 and other incorrect static counts from 96 or 88 to 97 in `src/` and `tools/` (NumbersPage, about, footer, OG card, comments), while leaving computed values unchanged.
3. **Add her.** Same pattern as R6: new record with the next id (97), unique name and slug. Set `compiled: true` unless the text is clearly her own words from the form, then `false`. If a raw photo exists, move it to `design-src/portraits-raw/`, add her to `tools/manual-portraits.mjs`, and crop to `public/portraits/manual-<slug>.jpg` (600x600, face-centred, headroom, no cut face). If there is no photo, `image: null` and the lotus fallback shows. Keep all 96 existing records byte-identical.
4. **Odd count check.** 97 is odd. With 2 profiles per page on desktop and 1 on phone, confirm the last page, the filler leaf, the folio numbers and the back cover still land cleanly at both sizes. Report the spread and page counts for each.
5. **Verify.** `npm run lint`, `npx tsc --noEmit`, `npm run build` pass. Code check: 97 records, unique ids and names; check image files only for profiles whose image value is non-null, while allowing null-image profiles to use the lotus fallback. Report photo-backed and lotus-fallback counts separately. Verify her `/profile/<slug>` page renders and is in the sitemap. Screenshots at 1440x900 and 390x844 of the front cover (says 97), her card, and the last spread. If no screenshot tool works, say so plainly.

## Do not

Do not edit any other bio, name or portrait. Do not re-fetch from Drive or Sheets unless it works offline. Do not add `force-dynamic` or `revalidate`. Do not use em dashes in new copy.

## Commit (no push)

`Data: add 97th profile; covers and counts now 97`

## Final message

Short: who the 97th is and where you found her, the counts (profiles, photos, lotus, spreads), the odd-count result, and anything you could not verify.
