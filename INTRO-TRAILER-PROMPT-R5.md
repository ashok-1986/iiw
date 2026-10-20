# INTRO-TRAILER-PROMPT-R5: a trailer-style intro before the magazine is revealed

Repo: `D:\STARTUP PROJECTS\eUtsav\IIW\Website\iiw-flipbook` (Next 16 App Router with cacheComponents, React 19, Tailwind 4, `framer-motion` ^14 already installed, react-pageflip book on `/`). Start from HEAD `9063fff`. Commit locally, do not push.

Read first: `AGENTS.md`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/NumbersPage.tsx` (copy its Framer Motion import style and its `useReducedMotion` handling), `src/components/Lightbox.tsx` (z-index 1000), `src/components/LotusMark.tsx`, `src/lib/sound.ts`, and the tokens at the top of `src/app/globals.css`.

---

## 1. What the client asked for

An introduction slide that plays like a film trailer, before the magazine is revealed. Heading text, exactly as the client wrote it:

> IIW Top 100 impactful British Indian Women 2026 compiled by IIW Inspiring Indian Women UK !
>
> #10yrsiiw2026
> #Tenyearsiiw2026

Use these words and no others in the trailer. The only extra text allowed is UI labels: `Skip intro` and `Enter the magazine`.

Two copy rules:
- Keep every word and the capitalisation as given ("impactful" stays lowercase, "IIW Top 100" stays as is).
- The client typed a space before the "!". Render it attached: `UK!`. That is the only edit. Mention it in your final message so I can tell the client.

Put all copy in one file, `src/lib/intro-copy.ts`, so the client can change it without touching animation code. The "100" is client copy. Do not tie it to the data count.

---

## 2. The feel

A short title sequence, about 10 seconds, cinematic and warm. Not a loader, not a splash. Think film-festival opening card for a heritage magazine.

- Ground: `--ground` (#0e2b25) with a deeper radial vignette (#081a16 at the edges) and a very faint film grain. No images, no photos of women. Text, lotus and light only.
- Colours: gold (`--gold`, `--gold-hi`, `--gold-lo`) and ivory (`--cream`). One small magenta accent (`--magenta`) in a few spark particles only. No other colours.
- Type: Playfair Display (`--font-display`) for the heading, Cormorant italic (`--font-accent`) for the "compiled by" line, Inter (`--font-ui`) for hashtags and buttons. Reuse the existing `.foil` class for the gold text if it fits.
- Motion character: slow, confident, ease-out. Use the repo ease `[0.23, 1, 0.32, 1]` (`--ease-out-quint`). Springs only for the final curtain. Nothing bouncy.

---

## 3. Storyboard (desktop 16:9 and phone 9:16 share one timeline)

Master timeline driven by one `useAnimate` sequence, with `variants` and `staggerChildren` for the word-by-word text. Times are from mount.

| Time | Beat | What happens |
|---|---|---|
| 0.0 to 0.8s | Dark open | Ground fades in from black. Vignette settles. About 24 gold dust specks (12 on phone) drift slowly upward at different speeds. |
| 0.6 to 2.0s | Lotus | `LotusMark` draws in at the centre, petal by petal (8 petals, stagger 0.09s, opacity and scale 0.6 to 1, rotate -8deg to 0). A soft gold glow breathes behind it. Lotus then eases up and shrinks to a small mark above the heading. |
| 1.8 to 3.6s | Title: line 1 | "IIW Top" rises word by word (y 28 to 0, opacity 0 to 1, stagger 0.12s). "100" lands large in gold and counts 0 to 100 over 1.1s with ease-out (use `animate` on a motion value, round to integer). |
| 3.2 to 4.8s | Title: lines 2 and 3 | "impactful British Indian Women" word by word, then "2026" with a thin gold rule drawing out on both sides (pathLength or scaleX 0 to 1). |
| 4.6 to 6.0s | Credit line | "compiled by IIW Inspiring Indian Women UK!" fades up in Cormorant italic, ivory at 85% opacity. |
| 5.6 to 7.2s | Light sweep | One diagonal gold light sweep crosses the full heading (a gradient pseudo-element moving on transform, not a width or background-position animation). Single pass. |
| 6.4 to 8.0s | Hashtags | "#10yrsiiw2026" then "#Tenyearsiiw2026" appear one after the other (stagger 0.35s) as gold-outlined pills, hairline `--gold` border, Inter 500, letter-spacing 0.06em. |
| 8.0 to 9.6s | Hold | Everything on screen, still. A very slow 2% scale drift on the whole composition keeps it alive. This hold must be at least 1.6s so the full text can be read. |
| 9.6 to 10.8s | Curtain | `Enter the magazine` button has been visible since 7.5s. If the viewer has not clicked, the overlay auto-continues: two ground-coloured panels part left and right (x: 0 to -101% and 0 to 101%, spring stiffness 120, damping 22) revealing the book already mounted underneath. Content fades out 0.2s before the panels move. Then the overlay unmounts. |

If the viewer clicks `Enter the magazine` or `Skip intro` at any time, jump straight to the curtain beat (about 0.9s). Never leave them waiting.

Phone layout: heading stacks to four short lines, centred, `clamp()` type sized so "impactful British Indian Women" fits in 2 lines at 360px width. Respect `env(safe-area-inset-*)`. Hashtags wrap to two rows if needed. Buttons at least 44px tall.

---

## 4. Build

**Files**
- `src/components/IntroTrailer.tsx` (client component, `'use client'`).
- `src/lib/intro-copy.ts` (copy constants).
- `src/lib/intro-session.ts` (seen-flag helpers).
- Add `<IntroTrailer />` in `src/app/page.tsx` as a sibling before `<main>`. Do not put it in `layout.tsx` (profile and about pages must not get it). Do not change the `getNominees` call, caching, or any segment config. Next 16 cacheComponents rejects `force-dynamic` and `revalidate`.

**Behaviour**
- Plays once per browser session. Store `iiw-intro-seen` in `sessionStorage`, wrapped in try/catch (private mode can throw). Read it with `useSyncExternalStore` (server snapshot = "not seen") so there is no hydration mismatch.
- Query overrides for QA: `?intro=1` forces replay, `?intro=0` skips. Add a small, quiet "Replay intro" text link in `SiteFooter.tsx` that goes to `/?intro=1`.
- Server-rendered markup contains the overlay, so first paint is the trailer, not the book. A returning visitor (flag set) is dismissed immediately with no animation, in a layout effect, so they never see a flash of the trailer.
- The book underneath stays mounted and keeps rendering normally (SEO and data untouched). The overlay must not change layout: `position: fixed; inset: 0`, z-index 1100 (above the Lightbox at 1000).
- While open: lock body scroll and restore it on close, set `inert` on `#archive`, give the overlay `role="dialog" aria-modal="true" aria-label="Introduction"`, focus `Skip intro` on open, trap Tab inside, close on `Escape`. On close, remove `inert` and move focus to `#archive`.
- Accessible heading: render the heading as `<h2 aria-label="{full text}">` with the animated word spans `aria-hidden="true"`. Do not create a second `<h1>`; the page already has one.
- `Skip intro` button: top-right on desktop, top-right on phone, always visible from 0s, low-key (Inter 500, ivory 80%, hairline gold border).

**Reduced motion** (`useReducedMotion()` and the CSS media query)
- No particles, no count-up (show "100" immediately), no light sweep, no curtain, no drift.
- Show the finished title card with a plain 300ms opacity fade, with the `Enter the magazine` button. Auto-continue after 6s with a 300ms fade out.

**Performance rules**
- Animate only `transform` and `opacity`. No animating `width`, `top`, `left`, `box-shadow` or large `filter: blur`.
- Particles: plain `motion.span` elements with `transform` loops, no canvas, no WebGL. Do not import `three`.
- Add `will-change: transform` only to the curtain panels and clear it on unmount.
- No new dependencies. No Lottie, GSAP or video file. No audio files.
- Pause the timeline if the tab is hidden (`document.visibilityState`), resume when visible.

**Sound (optional, default silent)**
- If the existing sound store is unmuted (`useSound`), play one soft synthesised chime at the curtain beat by adding a small `playChime()` to `src/lib/sound.ts`, using the same Web Audio approach and low gain as `playFlip()`. If muted, do nothing. Never autoplay audio.

---

## 5. Do not

- Do not add any copy beyond section 1. No taglines, no "88 stories", no sub-headings, no names of women, no cover image in the trailer (the cover says 88 and the heading says 100, so keep the two apart).
- Do not touch `nominees.json`, the covers, `FlipBook.tsx` internals, or the data tools.
- Do not make the trailer block the page if JavaScript fails. The overlay is client-driven but the book must still be reachable (the `<noscript>` case can hide the overlay with a `<style>` in a `<noscript>` tag).
- Do not use an em dash anywhere in the UI copy or code comments you add.

---

## 6. Acceptance

1. `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass. No hydration warnings, no console errors.
2. Playwright (or the Chrome tool) screenshots of the trailer at about 0.5s, 3s, 5s, 7s, 9s at 1440x900 and 390x844. Plus one frame with `prefers-reduced-motion: reduce`. If no screenshot tool works, say so plainly. Do not claim a visual check you did not do.
3. Prove the behaviour with real runs: first visit plays; reload in the same session skips; `?intro=1` replays; `?intro=0` skips; `Skip intro` and `Escape` both close; after close, keyboard focus is inside the book area and scrolling works.
4. Check the full heading is readable for at least 1.6s without any other text covering it, at both sizes.
5. Confirm no layout shift (CLS 0 from the overlay) and that `/profile/[slug]` and `/about` do not show the trailer.

## Commit (no push)

`Intro: trailer-style title sequence before the magazine reveal (Framer Motion, once per session, reduced-motion safe)`

## Final message

Short. What changed, the files added, how to force replay, the measured timings, anything you could not verify, and the one copy edit (space before "!").
