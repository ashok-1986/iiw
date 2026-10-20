# FIX-PROMPT-R8: sort all profiles A to Z

Repo: `D:\STARTUP PROJECTS\eUtsav\IIW\Website\iiw-flipbook`. Run this AFTER R7 is done, so the 97th profile is included. Commit locally, do not push.

## Rule

Sort by the name as shown on the card, first name first, A to Z.
- Ignore leading titles and honorifics for sorting only: Dr, Mrs, Ms, Mr, Cllr, Councillor, Prof, Baroness, Lady, Sir, Dame. Keep them in the displayed name.
- Ignore trailing honours for sorting: MBE, OBE, CBE, BEM, DL, JP.
- Case-insensitive, accent-insensitive. Use `localeCompare(b, 'en', { sensitivity: 'base' })`.
- Ties: sort by the full display name, then by id.
- Example: "Dr Harsha Jani" sorts under H. "Cllr Anjana Patel" sorts under A. "Zamiha Desai MBE" sorts under Z.

Do not sort by surname. Surnames are unreliable here (single names, Kaur, Devi, married names).

## Do

1. Add one helper, `sortKey(name)` and `compareNominees(a, b)`, in `src/lib/nominee.ts`. Keep the title and honour lists as constants at the top of that file.
2. Apply the sort in ONE place: where the book order is built (`toFlipProfile` list, or `getNominees` if that is the single source). Do not sort in components. Do not change `id`, `slug`, or any field value.
3. Also sort the array in `tools/refresh-data.mjs` just before the final write, using the same rule, so `nominees.json` order matches the book. If that is hard to share, duplicate the small function and add a comment pointing to `nominee.ts`.
4. Check what depends on order and fix only if broken: folio numbers, spread pairing, the filler leaf, lightbox next and previous, deep links, `/profile/[slug]` prev/next if present, sitemap, NumbersPage, any "page X of Y" label, any hard-coded id-to-page map.
5. Add a tiny A to Z jump bar ONLY if one already exists. If none exists, do not build one. Mention it in the final message as an option.

## Verify

- Print the full sorted list (position, display name, sort key). Confirm no entry starts with a title word in the key, and that the first and last five look right.
- Confirm count is unchanged (97 if R7 is done), ids unique, no record changed except its position.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` pass.
- Screenshots at 1440x900 and 390x844: first spread (should start with A), a middle spread, and the last spread (should end with Z). If no screenshot tool works, say so plainly.
- Open two profile pages and one lightbox, and confirm the next and previous behaviour still makes sense.

## Do not

Do not edit any bio, name, portrait or cover. Do not re-fetch data. Do not add `force-dynamic` or `revalidate`. Do not use em dashes in new copy.

## Commit (no push)

`Order: sort profiles A to Z by first name, titles and honours ignored`

## Final message

Short: the sort rule you applied, first and last five names, any code that depended on the old order and what you changed, and anything you could not verify.
