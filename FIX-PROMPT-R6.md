# FIX-PROMPT-R6: add the 8 community nominees (88 to 96), new covers, honest labelling

Repo: `D:\STARTUP PROJECTS\eUtsav\IIW\Website\iiw-flipbook` (Next 16 App Router, cacheComponents, react-pageflip, baked data in `src/data/nominees.json`, `tools/refresh-data.mjs`, `tools/manual-portraits.mjs`, `tools/crop.mjs`). Start from the current HEAD. Commit locally, do not push.

Read first: `AGENTS.md`, `src/lib/sheets.ts`, `src/lib/nominee.ts`, `src/lib/flipbook-store.ts`, `src/components/BookCover.tsx`, `src/components/NumbersPage.tsx`, `src/components/Lightbox.tsx`, `src/app/profile/[slug]/page.tsx`, `src/app/about/page.tsx`, `tools/refresh-data.mjs`, `tools/manual-portraits.mjs`.

Context: the client approved adding 8 more women. 96 is the agreed total for now. The client dropped Sohini Roychoudhury (not British), so she is NOT in this batch. Seven of the eight have no photo and no words of their own yet. Their bios were rewritten from public sources only. Sonoo Malkani sent her own words and a photo.

---

## Already placed by me (do NOT regenerate, resize or edit the pixels or the text)

- `tools/data/community-nominees.json`: the 8 records (ids 89 to 96), final copy. Do not rewrite any bio. Fields: `id, name, org, summary, fullText, imageId (null), sources, image (null), compiled (bool), published (bool)`.
- `public/covers/cover-front.jpg`, `cover-front-sm.jpg`, `cover-back.jpg`, `cover-back-sm.jpg`: re-rendered. Front now says "96 stories". Back now has a two-line consent note (see Part D). Masters in `design-src/covers/`.
- `design-src/community-nominees-sources.md`: curator-only audit trail of where each fact came from. Do not import it into `src/`.
- `public/portraits/Sonoo Malkani.jpeg` (1988x2651): her supplied photo, still raw in the public folder.

---

## Part A. Add the 8 records

**A1.** Create `tools/community-nominees.mjs`:
- exports `applyCommunityNominees(nominees)` and also runs standalone (`node tools/community-nominees.mjs`) to patch `src/data/nominees.json` in place, offline, no network.
- reads `tools/data/community-nominees.json`, skips any record with `published: false`.
- idempotent: match by normalised name, replace an existing record rather than duplicate. Throw if a name matches more than one record.
- appends new records after the existing ones, keeping the ids given (89 to 96). Throw on a duplicate id.
- `compiled` and the other fields are copied as is.

**A2.** In `tools/refresh-data.mjs`, call `applyCommunityNominees` right before `applyManualPortraits` (which stays last before the final write), so `npm run refresh` keeps all 8. Do not run the full refresh unless it works offline.

**A3.** Run the CLI once. Verify: 96 records, unique ids, unique names, 88 original records byte-identical to before (diff them), 8 new ones present.

**A4. Schema.** Add `compiled?: boolean` to `RawNominee` in `sheets.ts` and to `Nominee` in `nominee.ts` (default false). Pass it through `toFlipProfile` in `flipbook-store.ts` as `compiled`. This is a deliberate, client-safe field. Nothing else new may cross into the client bundle. Do not surface email, phone, address, consent flags, or curator notes.

---

## Part B. Sonoo Malkani's photo

Her raw photo is a close selfie, face large and centred, a plant and doorframe behind. Same flow as the earlier five:
- Move `public/portraits/Sonoo Malkani.jpeg` to `design-src/portraits-raw/`.
- Add her to the table in `tools/manual-portraits.mjs`. Output `public/portraits/manual-sonoo-malkani.jpg`, 600x600, face-centred head and shoulders, headroom kept, glasses and hair not cut, no plant or door edge dominating. Use the shared `tools/crop.mjs`.
- Set `image` for her record only. The other 7 keep `image: null` and show the lotus fallback.
- Open the output crop and confirm by eye. Add it to a contact sheet `design-src/portraits-raw/_check.jpg` (do not commit it).

---

## Part C. Labelling the 7 compiled profiles

The back cover and site say profiles are in the nominee's own words, with her consent. For 7 of the 8 that is not true yet, so mark them quietly.

- Where `compiled` is true, show one small line in Inter, muted, under the bio on the lightbox and on `/profile/[slug]`: `Compiled by IIW from public records.` Do not show it on the small flipbook cards. No icon, no colour.
- Sonoo (`compiled: false`) shows nothing extra.
- Put the line text in one constant in `src/lib/site.ts`.
- Grep `src/` for "own words" and "consent". List every place the old promise appears (about page, footer, metadata, OG card). Update the wording to match the new back cover: `Profiles are published in the nominee's own words, with her consent. A few are compiled by IIW from public records and marked as such.` Keep the typographic apostrophe style already used.

---

## Part D. Counts and covers

- `BookCover.tsx`: set `BAKED_COUNT` to 96. The dev warning stays, so it will fire if the data count changes again. Do not change the cover images or alt-text structure. The alt text already uses the `count` prop. The back-cover alt text must now read: `Back cover of Inspiring Indian Women. Lift. Support. Rise. Profiles are published in the nominee's own words, with her consent. A few are compiled by IIW from public records and marked as such.`
- Grep `src/` and `tools/` for the literal `88` as a count and for static "photos" or "lotus" counts (NumbersPage, about, footer, OG, `mock-data.ts` comment). Fix anything that is static and wrong. Anything computed from data stays. Expected truth now: 96 profiles, 89 with a photo, 7 lotus fallbacks. Report what you changed.
- Pagination: with 96 profiles check the spread count, folio numbers and the filler-leaf logic still end cleanly. Report pages per viewport (desktop 2 per page, phone 1 per page).
- `sitemap.ts` and `/profile/[slug]` must include the 8 new slugs. Confirm each new profile page renders and has a valid `opengraph-image` (the lotus fallback for the 7).
- If `published` is later set to `false` for anyone (the client may drop Lakshmi Kaul, see below), the count and cover would need a re-render. Do not do that now.

---

## Do not

- Do not edit any bio, name or org line in `community-nominees.json`. If you think a claim is wrong, say so in your final message instead.
- Do not add any claim from the web yourself. The 7 compiled bios are final.
- Do not re-fetch from Drive or Sheets. Do not touch the 88 existing records or their portraits.
- Do not add `force-dynamic` or `revalidate` segment configs (Next 16 cacheComponents rejects them).
- Do not stretch or crop the cover images. Do not use em dashes in any copy you add.

---

## Acceptance

1. `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass.
2. Code checks: 96 records, 89 with `image`, 7 null, every image file exists, Sonoo's crop is 600x600, 88 old records unchanged.
3. Screenshots at 1440x900 and 390x844 (Playwright or the Chrome tool): front cover (says 96), a spread showing 2 of the new profiles with lotus fallbacks, Sonoo's card, her lightbox, a compiled profile's lightbox with the "Compiled by IIW" line, and the back cover. If no screenshot tool works, say so plainly. Do not claim a visual check you did not do.
4. Text check: the full back-cover note is legible and not cropped at both sizes.

## Commits (no push)

1. `Data: add 8 community nominees (96 total), Sonoo portrait, compiled-profile label`
2. `Covers: 96 stories front, honest consent note on back`

## Final message

Short. What changed, the measured counts (profiles, photos, lotus, spreads), where the old "own words" promise appeared and what you changed it to, any claim in the 8 bios you think is wrong, and what you could not verify.
