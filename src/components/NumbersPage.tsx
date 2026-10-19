'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { LotusMark } from './LotusMark';

/**
 * The book's one animated leaf, right after the cover: a 9s "By the numbers" loop —
 * lotus blooms, the count rolls up to the number of women, and the book's themes fade
 * in under it. Framer Motion only (already a dependency; no video, no render step).
 * It runs only while it is the open page AND on screen, and under prefers-reduced-motion
 * it is a static poster frame. Nothing here captures pointer events, so page turns and
 * drag/swipe are never blocked.
 */
const LOOP = 9; // seconds, one full cycle
const WORDS = ['Courage', 'Craft', 'Community', 'Care', 'Culture'];

export const NumbersPage = forwardRef<
  HTMLDivElement,
  { count: number; phone: boolean; active: boolean }
>(function NumbersPage({ count, phone, active }, ref) {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);
  const play = active && inView && !reduced;

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const n = useMotionValue(count);
  const shown = useTransform(n, (v) => Math.round(v));
  useEffect(() => {
    if (!play) {
      n.set(count);
      return;
    }
    n.set(0);
    const c = animate(n, count, { duration: 2.2, ease: 'easeOut', repeat: Infinity, repeatDelay: LOOP - 2.2 });
    return () => c.stop();
  }, [play, count, n]);

  const setRefs = (node: HTMLDivElement | null) => {
    host.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div ref={setRefs} className={`fp fp-cover fp-numbers${phone ? ' fp-phone' : ''}`}>
      <div className="fp-cover-frame" aria-hidden="true" />
      <div className="fp-in">
        <motion.div
          className="fp-bloom"
          aria-hidden="true"
          initial={false}
          animate={play ? { scale: [0.2, 1, 1, 1], opacity: [0, 1, 1, 0] } : { scale: 1, opacity: 1 }}
          transition={play ? { duration: LOOP, times: [0, 0.3, 0.85, 1], ease: 'easeOut', repeat: Infinity } : { duration: 0 }}
        >
          <LotusMark size={64} style={{ width: '100%', height: '100%' }} aria-hidden="true" role="presentation" />
        </motion.div>
        <p className="fp-masthead">By the numbers</p>
        <p className="fp-count">
          <span className="sr-only">{count} women, one book.</span>
          <motion.span className="foil" aria-hidden="true">
            {shown}
          </motion.span>
        </p>
        <p className="fp-tag fp-numbers-tag" aria-hidden="true">
          women. One book.
        </p>
        <ul className="fp-words" aria-label="Themes of the book">
          {WORDS.map((w, i) => (
            <motion.li
              key={w}
              initial={false}
              animate={play ? { opacity: [0, 1, 1, 0], y: [6, 0, 0, 0] } : { opacity: 1, y: 0 }}
              transition={
                play
                  ? { duration: LOOP, times: [0, 0.07, 0.88, 1], ease: 'easeOut', delay: 1.2 + i * 0.6, repeat: Infinity }
                  : { duration: 0 }
              }
            >
              {w}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
});
