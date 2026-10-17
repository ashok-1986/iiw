# IIW Data Reconciliation — PRD v1.0 vs Live Spreadsheet

Verified 2026-10-17 against sheet `1loMFRoc6H5nDFZk5-tjXDjH0DCq0KUFHF-ggOIC1Geg` and both Drive folders, using the key you supplied. Every number below comes from an actual read, not inference.

**Headline: 0 of the PRD's data-model assumptions survived contact with the real sheet.** The site cannot be built from PRD v1.0 §Data as written.

---

## 1. The PRD's column map is wrong, and following it would publish emails

PRD said: *Final Directory, cols A–F → name in B, org in C/D, imageId in E; "never expose emails/phone/address — only cols A-F".*

The real tabs:

| Tab (gid) | Actual columns | Real rows |
|---|---|---|
| **Final Directory** (0) | A=Sr no, B=**Name**, C=(empty), D=**Description**, E=**Consent**, F=**DUE Diligence**, G–AA empty | **18 populated**, not 82 |
| Form responses (1166691534, 1682883716, 1915581797 — three near-identical) | A=टाइमस्टैम्प, B=**ईमेल पता (EMAIL)**, C=Your Name, D=Tell us about yourself, E=Reason/Due Diligence, F=Consent, G=Image Upload | 92 / 938 total lines |
| **Flipbook** (293174) | same form schema as above | **92 rows with a name** |

The danger: in the Form/Flipbook tabs, **col A is a timestamp and col B is a personal email address**. The PRD's rule "read only cols A–F" is precisely the instruction that would ship ~92 women's email addresses to the public site. Column-letter allowlists are unsafe here; **binding by header name is mandatory.** I have implemented header-name binding.

There is also **no organization field and no imageId column in Final Directory** — both are required by the PRD's ProfileCard design. `DUE Diligence` (col F) is curator working notes ("please fill in the bio", "it's a group of 427 International women living in England"), not a publishable organization string.

## 2. "82 profiles" does not exist in any single tab

- Final Directory: **18** named profiles (7 with Consent=TRUE)
- Flipbook tab: 92 submission rows → **77 unique names** (14 women submitted twice: Gayatri Lokhande ×3, Sujatha Thaladi, Neelam Chawla, Chinu Kishore, Hema Yellapragada, Gayatri Shenoy, Kalpana Doshi, Vidhi Bhagat, Prafula Shah, Amarjit Jammu, Sweta Mohanty, Malathy Muthu, Geeta Shah, Geetanjali Mirpuri)
- **Union across both: 88 unique women.** 11 of the 18 Final Directory names are absent from the form data entirely (Dina Bhudia, Nina Darmeci, Suparna Rathi, Hema Manjunath, Manjiri Gokhale Joshi, Sonal Dave, Anupama Sharma, Sabitha Nalli, Sutapa Ray, Arpita Ray, Kirti Soni); 7 overlap.

So the source of truth is split across two tabs describing overlapping-but-different populations. "82" is not reproducible from the data as it stands. The flipbook math changes too: at 2 profiles/page, **18 → 9 pages / 5 spreads**, not 41/21. Progress dots, spread counts, and the sitemap URL count (84) in the PRD are all wrong for whatever number we land on.

## 3. Consent is inconsistent between tabs — this gates what can be published

Final Directory col E is a strict boolean: only **7 of 18** are TRUE (Hema Manjunath, Sonal Dave, Anupama Sharma, Sabitha Nalli, Mayuri Patel, Arpita Ray, Kirti Soni). The Flipbook tab stores consent as **free-text acknowledgement** ("I acknowledge and provide consent for the collection and processing of this data"), so it never equals `TRUE`.

Net: the curated tab has 7 consented profiles; the bulk tab has ~77 with soft consent. The PRD's rule "ensure consent = true before including imageId" would produce a **7-profile site**, not 82.

## 4. Images: 91 real files, and two PRD links are broken

- Folder 2 (`18R9269j…`) contains **one subfolder** "Image Upload (File responses)" holding **90 images** — not files directly in the folder. The PRD's `files.list?q=<folder> in parents and mimeType contains 'image'` returns **empty** against Folder 2's root. Needs recursive subfolder traversal (now implemented).
- Folder 1 (`118jbchK0V…`) holds curated portraits **plus a Google Form object** ("IIW Submission Form") — the name-fuzzy-match fallback must filter `mimeType startsWith 'image/'` or it will try to render a Form as a portrait.
- The 91 `Image Upload` links yield **91 distinct Drive file IDs, zero duplicates** — this is the reliable profile→portrait link, better than fuzzy name matching.
- The key you supplied has **Sheets API blocked** (`API_KEY_SERVICE_BLOCKED`, project `878880461692`). Not needed: the sheet is public and exports via CSV/gviz without auth, which is what I wired. The key **is** enabled for Drive and is what `files.list` uses.
- The `/api/image` proxy works, but only for **anyone-with-link** file IDs — it 302s for the rest, so we must either confirm share settings on the 90 uploads or switch to `googledrive.com/hosted`/`lh3` via the key. Unverified; flagging rather than guessing.

**Security note:** the OAuth client secret and the API key are now in this chat transcript and a shared document. An unrestricted `AIzaSy…` key is billable-scrapeable. Since we don't need it for Sheets at all, **delete that API key** and reissue a Drive-only restricted one only if `files.list` proves necessary.

---

## What I changed in code as a result

- `src/lib/nominee.ts` — header-name binding, no positional trust; added `source` provenance + `consentGiven`
- `src/lib/sheets.ts` — **three-source merge** (Final Directory curated → Flipbook deduped → Folder 2 recursive image listing), fuzzy name→portrait match, no API key required, never-throw fallback
- `src/app/api/nominees/route.ts` — **explicit allowlist wire shape**; curator notes stripped
- API routes fixed for Next 16 `cacheComponents` (it rejects `force-dynamic`/`revalidate` segment configs)
- `GOOGLE_SHEETS_API_KEY` is now optional in `.env.example`

## Verified live through `/api/nominees` (the merge now runs)

| Metric | Value |
|---|---|
| Final Directory rows parsed | 18 |
| Flipbook/form rows parsed | 92 |
| **Merged unique profiles** | **88** |
| Portraits resolved (exact + fuzzy match) | **76 of 88** (86%) |
| Passing `parseConsent` (boolean TRUE **or** free-text ack) | 83 |
| Emails / curator notes in public payload | **none** (verified by regex over the wire JSON) |

Two caveats on those numbers, stated rather than hidden:

1. **`consented: 83` is a generous read.** Final Directory's strict boolean says only **7 of 18** are TRUE; the other 76 pass because the form tab stores consent as an acknowledgement *sentence*, not a record-level approval. Treat 83 as "no hard NO", not as "cleared for publication".
2. **The endpoint currently serves all 88 regardless of consent**, because the publication gate is an open product decision (below), not a technical one. Say the word and it becomes a one-line filter.

## Open decision — needs you, not me

| Option | Profiles | Cons |
|---|---|---|
| **A. Ship Final Directory only** | 18 (7 consented) | Faithful to "curated"; site feels thin vs the "82 leaders" promise |
| **B. Union, curated-first** (recommended) | 88 | Needs a dedupe rule + a consent policy for the 70 form-only women |
| **C. Backfill the sheet first** | → true 82 | IIW team must finish curating before dev can finish; blocks M2 |

For B I additionally need: (1) dedupe — keep earliest or latest submission per name? (2) are form-tab women publishable on the free-text consent, or do we need explicit re-consent before launch? (3) does "82" come from somewhere outside this sheet (a list, an awards doc) that should be the real target list?
