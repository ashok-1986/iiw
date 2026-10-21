# FIX-PROMPT-R10: client words for Lakshmi Kaul and Sunita Chaubey, portraits for 6 community nominees

Repo: `D:\STARTUP PROJECTS\eUtsav\IIW\Website\iiw-flipbook`. Start from current HEAD. Commit locally, do not push.

**Do NOT run `FIX-PROMPT-R9-LAKSHMI.md`. This prompt replaces it.** Leave that file untouched (do not delete it).

This deliberately overrides the earlier "do not edit bios" rule for records 89 (Sunita Chaubey) and 95 (Lakshmi Kaul) only. The client has now supplied their own words. Match records by name, not by position (the data is now sorted A to Z).

---

## Part A. Text for the two women (edit `tools/data/community-nominees.json`)

Both records get `compiled: false` (these are now the client's supplied words, not compiled from public records). Keep `published: true`, `id`, `name`, `imageId`, `sources`. Do not touch the other six records' text.

**Lakshmi Kaul (id 95)**
- `org`: `Grin Media / Authors of Bharat`
- `summary`: `Lakshmi Kaul is CEO of Grin Media and, until recently, was Senior Vice President at Mott MacDonald. She is an Indian British National who has spent her life bringing diasporic communities closer to their cultural roots and identity.`
- `fullText` (one paragraph, exactly):

`Lakshmi Kaul is CEO of Grin Media. Until recently, she was Senior Vice President at Mott MacDonald. Kaul has had a long career across India and the United Kingdom, with several key roles including political aide to the British Member of Parliament Bob Blackman, Head of the Confederation of Indian Industry (CII) in the UK, board member of the Commonwealth Enterprise and Investment Council (CWEIC), the Manchester-India Partnership, and the West Midlands-India Partnership. Lakshmi Kaul is an Indian British National who has spent her life bringing diasporic communities closer to their cultural roots and identity. She spends her time encouraging the love for nature, books, reading, reconnecting as a community and family through simple storytelling and conversation. She also curates daily wisdom stories, Authors of Bharat, re-telling stories from ancient Bharat but relevant to Modern Living, promoting thus, Indian civilisational systems. Lakshmi has had a thriving career in public policy, non-profit and corporate world before transitioning into writing and publishing full time. She spends her time living in India and United Kingdom.`

Only grammar fixes were made to the client's text: added "is" in sentence 1, removed a stray " -", "story telling" to "storytelling", and a comma after "Authors of Bharat". Do not change anything else.

**Sunita Chaubey (id 89)**
- `org`: `Recruitment Professional / Purvanchal Culture`
- `summary`: `With over 25 years of professional experience in the UK, she has always believed in empowering women and giving back to her community. She has been working hard to promote the rich Purvanchal culture, language, and traditions.`
- `fullText`: the three paragraphs below. If the renderer supports paragraph breaks (check how Sonoo's and the older multi-paragraph records are stored), keep them as separate paragraphs. If it does not, join them with a single space.

> With over 25 years of professional experience in the UK, she has always believed in empowering women and giving back to her community.
>
> She has been working hard to promote the rich Purvanchal culture, language, and traditions, creating platforms through cultural events where women can showcase their hidden talents and shine with confidence.
>
> Alongside this, she takes pride in coaching, mentoring, and motivating women returning to work after career breaks, helping them rebuild confidence and achieve financial independence. She is working hard as a Recruitment Professional to support ladies get back to work after motherhood and career break.

Only fixes: "my community" to "her community" (the client text mixed first and third person), and a final full stop.

Follow the same summary/fullText relationship the original records use. If there is a length cap or truncation rule for cards, apply it and tell me.

Run `node tools/community-nominees.mjs` after editing (it replaces by name, no duplicates).

---

## Part B. Portraits (6 of the 7 uploaded photos)

Client uploaded these into `public/portraits/` (untracked): Sunita Chaubey, Zamiha Desai, Ranu Mehta-Radia, Renu Gidoomal, Ragasudha Vinjamuri, Seema Anand, and Lakshmi Kaul. Same flow as the earlier manual portraits:
- Move ALL seven raw files out of `public/portraits/` to `design-src/portraits-raw/` (they must not ship). Keep original filenames.
- Add six to the table in `tools/manual-portraits.mjs` and crop with `tools/crop.mjs` and `tools/face.mjs` to `public/portraits/manual-<slug>.jpg`, 600x600, face-centred head and shoulders, headroom kept, no cut faces. No retouching, no AI upscaling, no heavy sharpening. Real faces stay unchanged.
- Set `image` on those six records only (in `community-nominees.json`, so `npm run refresh` keeps them).

Per photo notes (I have looked at each):
- **Sunita Chaubey** (886x868): tight portrait, face large. Keep the top of the hair, the bindi and both earrings in frame.
- **Zamiha Desai** (771x771): good. Include the long hanging earrings. A hand near the chin can stay in frame.
- **Ranu Mehta-Radia** (834x826): wears sunglasses, river and bridge behind. Head and shoulders is fine. Do not crop the frame in a way that cuts her hair on the left.
- **Renu Gidoomal** (1080x1080): a circular cut-out with white corners. The crop must sit fully inside the purple circle. After cropping, sample the four corner pixels and fail if any is near white (above 245). Use the largest square inside the circle that holds the head.
- **Ragasudha Vinjamuri** (715x960): full-body photo, small face, sunglasses on her head. Crop from the upper chest up. The face is small, so the upscale will be large.
- **Seema Anand** (496x652): full-length studio pose, small low-resolution face. Crop head and shoulders with the white hair fully in frame. Upscale will be large.
- For every photo, report the source crop width in pixels and the upscale factor. Flag any above 2.5x in the final message (expected for Ragasudha and Seema). Do not hide a soft result.

**Lakshmi Kaul: do NOT crop her photo.** Her file is a group photo with two women side by side (one in a grey saree, one in a green saree) and other people behind. I cannot tell which one is Lakshmi and I will not guess. Keep her `image` as `null` (lotus fallback) until I confirm which woman it is or the client sends a single portrait. Just move the raw file to `design-src/portraits-raw/`.

Make a contact sheet of the six new crops at `design-src/portraits-raw/_check2.jpg` (do not commit it). Open it and confirm by eye.

---

## Part C. Sources file

In `design-src/community-nominees-sources.md`:
- Under Lakshmi Kaul: text supplied by the client on 21 Oct 2026, now her own words (`compiled: false`). The client states she is an Indian British National, which closes the earlier citizenship flag. Photo: pending, the supplied photo is a group photo of two women, not yet identified.
- Under Sunita Chaubey: text supplied by the client on 21 Oct 2026 (`compiled: false`). Earlier public-source bio replaced. Note the earlier flag still stands: she is an IIW volunteer and won the IIW Best Entrepreneur award in 2024, so the client should know this when she is shown in the book.
- Under the other five: photos supplied by the client on 21 Oct 2026. Bios stay compiled from public records (`compiled: true`).

---

## Verify

1. Only records 89 and 95 changed in text. Six records gained an `image`. Every other record in `src/data/nominees.json` is byte-identical (diff against HEAD). Record count unchanged (96, or 97 if R7 has run). Ids and names unique.
2. Expected now: 95 records with a photo and 1 lotus fallback (Lakshmi) out of 96. Print the real counts. If any UI copy states a photo or lotus count as a static number, fix it. Computed values stay.
3. Sunita's and Lakshmi's lightbox and `/profile/<slug>` pages do NOT show the "Compiled by IIW from public records." line. Zamiha, Ranu, Ragasudha, Renu and Seema still do.
4. The two long texts do not overflow the lightbox or profile page at 390x844 and 1440x900. Screenshot Sunita, Lakshmi, Zamiha and Seema at both sizes. If no screenshot tool works, say so plainly.
5. `npm run lint`, `npx tsc --noEmit`, `npm run build` pass.

## Do not

Do not edit any other bio, name or portrait. Do not touch the covers or the count. Do not re-fetch data. Do not add `force-dynamic` or `revalidate`. Do not use em dashes in new copy.

## Commit (no push)

`Data: client-supplied words for Lakshmi Kaul and Sunita Chaubey; portraits for 6 community nominees`

## Final message

Short: confirm which records changed, the photo and lotus counts, the upscale factor for each of the six crops (flag anything above 2.5x), and anything you could not verify.
