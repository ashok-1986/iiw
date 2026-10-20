# Round 3 — IIW flipbook tweaks

Continue in the existing `iiw-flipbook` repo (Next 16, React 19, react-pageflip with a hard cover as page 1, baked data in src/data/nominees.json). Keep PII guardrails, sound toggle, lightbox, profiles. Plan first. Show the animated-page concept before building it.

## 1. Clean cover: no search or category tabs on the cover
- The search pill and category chips currently sit above the book on every page. Show them only on interior spreads; hide them on the cover (first page) and the back cover.
- Track the current page via react-pageflip `onFlip` / `getCurrentPageIndex()`. Render search + chips only when the current page is interior. Fade them in/out (opacity + small translateY, ~200ms ease-out, reduced-motion aware) so they do not pop.
- On the cover, keep only the masthead and the Prev/Next + sound controls.

## 2. One animated interstitial page in the book
- Add a single full-bleed animated page right after the cover (page 2): a short title/overview sequence that loops (6-10s). Show me 1-2 concepts first, then build the chosen one:
  - "By the numbers": animated count-up (88 women, N causes), lotus bloom, category words fading in on the dark ground with gold.
  - "Chapter opener": masthead line unfurling, rangoli drawing itself, soft portrait drift.
- Animation tech (pick one and state which and why):
  - Preferred, lightest: Framer Motion (already installed) or a Lottie file. Best for a live in-page loop, no new heavy dependency.
  - If honoring Remotion for a live page: embed with `@remotion/player` (browser only, works on Vercel, no render pipeline). Verify the Remotion version supports React 19; if not, fall back to Framer Motion.
  - Only if a shareable reel is also wanted: author the same composition and render to mp4/webm with the Remotion CLI LOCALLY, commit to public/, embed as `<video autoplay muted loop playsinline>`. Do NOT render video during the Vercel build (needs headless Chromium).
- The page must fit the fixed react-pageflip page size, respect prefers-reduced-motion (show a static poster frame, no motion), autoplay muted, loop, playsinline, pause when off-screen, and never block the page-turn.

## Constraints
- Keep baked data + PII guardrails, AA contrast, keyboard flip, 390px mobile. `npm run build` green.
- Verify: cover shows no search/tabs; chips/search appear on interior pages; interstitial plays and loops without breaking the flip on desktop and mobile.
