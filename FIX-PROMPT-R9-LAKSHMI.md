# FIX-PROMPT-R9: rewrite Lakshmi Kaul's bio (record id 95)

Repo: `D:\STARTUP PROJECTS\eUtsav\IIW\Website\iiw-flipbook`. Small change. This deliberately overrides the earlier "do not edit bios" rule for this one record only. Commit locally, do not push.

## Do

1. In `tools/data/community-nominees.json`, edit only the record with `"id": "95"` (name "Lakshmi Kaul"):
   - `org`: `UK-India Trade & Policy`
   - `summary` and `fullText` (both the same text, exactly):

   `Lakshmi Kaul is a UK-India policy and community leader. From 2018 she was Head and Representative of the Confederation of Indian Industry (CII) in the UK, based in London. Earlier she was a political aide to Bob Blackman MP and supported several All Party Parliamentary Groups. She has served on the boards of CWEIC, the Manchester-India Partnership and the West Midlands-India Partnership. In May 2026 she became CEO of Grin Media.`

   Leave `id`, `name`, `imageId`, `sources`, `image` (null), `compiled` (true) and `published` (true) as they are.
2. Run `node tools/community-nominees.mjs` (it replaces by name, so no duplicate). Then confirm in `src/data/nominees.json` that only this one record changed. Diff against HEAD or the previous file. Every other record must be byte-identical. Record count unchanged.
3. In `design-src/community-nominees-sources.md`, under "Lakshmi Kaul", replace the bullets with:
   - Head and Representative of CII in the UK from May 2018, London: Asian Voice, 8 May 2018. Still listed as "Head & Representative - UK, CII" in 2021 (Bdaily, YABA programme).
   - Political aide to Bob Blackman MP; boards of CWEIC, Manchester-India Partnership, West Midlands-India Partnership; CEO of Grin Media from May 2026: exchange4media, 11 May 2026.
   - Supported several All Party Parliamentary Groups: Asian Voice.
   - OPEN FLAG: citizenship is not stated publicly. LinkedIn location shows Delhi and Grin Media is India-based. Client to confirm she fits "British Indian". If dropped, set `published: false`, then the count and both covers need a re-render.
   - Left out on purpose: "senior policy advisor" (no source) and "Westminster public dialogues" (no source). Use only if the client supplies them.

## Verify

- Her `/profile/lakshmi-kaul` page and her lightbox show the new text and the "Compiled by IIW from public records." line.
- The card org line reads "UK-India Trade & Policy" and does not overflow at 390px width.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` pass.
- Screenshot of her lightbox at 1440x900 and 390x844. If no screenshot tool works, say so plainly.

## Do not

Do not touch any other record, the covers, or the count. Do not add claims. Do not use em dashes.

## Commit (no push)

`Data: rewrite Lakshmi Kaul bio, lead with UK work`

## Final message

Short: confirm only record 95 changed, and list anything you could not verify.
