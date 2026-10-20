'use client';

import {
  motion,
  stagger,
  useAnimate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationSequence,
  type MotionValue,
} from 'framer-motion';
import { Fragment, memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { INTRO_COPY, INTRO_HEADING_TEXT } from '@/lib/intro-copy';
import {
  INTRO_BOOT_SCRIPT,
  markIntroSeen,
  readIntroMode,
  subscribeIntro,
  type IntroMode,
} from '@/lib/intro-session';
import { playChime } from '@/lib/sound';

/**
 * A trailer-style title sequence over the (already mounted) book. One master timeline
 * (useAnimate) drives the words, lotus, count-up, sweep and tags; the curtain is two
 * ground-coloured panels that part to reveal the book. Plays once per browser session.
 * Everything animated is transform or opacity.
 */
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

// Fixed values (no Math.random) so server and client markup match.
const SPECS = Array.from({ length: 24 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin((i + 1) * n) * 10000;
    return x - Math.floor(x);
  };
  return {
    left: `${(4 + r(12.9898) * 92).toFixed(1)}%`,
    size: 2 + Math.round(r(78.233) * 2),
    dur: 7 + r(37.7) * 6,
    delay: r(4.1) * 2.5,
    drift: Math.round((r(9.3) - 0.5) * 40),
    spark: i % 6 === 5,
  };
});

const PETALS = Array.from({ length: 8 }, (_, i) => i * 45);

const noscriptCss = '[data-intro-root]{display:none!important}';

// Rendered once; memo keeps React from re-creating the script element.
const BootScript = memo(
  function BootScript() {
    return <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />;
  },
  () => true,
);

const sequence = (count: MotionValue<number>): AnimationSequence => [
  ['.intro-petal', { opacity: [0, 0.9], scale: [0.6, 1], rotate: [-8, 0] }, { at: 0.6, duration: 0.7, ease: EASE, delay: stagger(0.09) }],
  ['.intro-core', { opacity: [0, 1] }, { at: 1.4, duration: 0.5 }],
  ['.intro-lotus', { y: ['14vh', '0vh'], scale: [2.4, 1] }, { at: 1.5, duration: 0.9, ease: EASE }],
  ['.intro-w1', { opacity: [0, 1], y: [28, 0] }, { at: 1.8, duration: 0.7, ease: EASE, delay: stagger(0.12) }],
  ['.intro-num', { opacity: [0, 1], scale: [0.86, 1] }, { at: 2.3, duration: 0.7, ease: EASE }],
  [count, INTRO_COPY.number, { at: 2.3, duration: 1.1, ease: 'easeOut' }],
  ['.intro-w2', { opacity: [0, 1], y: [28, 0] }, { at: 3.2, duration: 0.7, ease: EASE, delay: stagger(0.12) }],
  ['.intro-year', { opacity: [0, 1], y: [10, 0] }, { at: 4.2, duration: 0.6, ease: EASE }],
  ['.intro-rule', { opacity: [0, 1], scaleX: [0, 1] }, { at: 4.2, duration: 0.6, ease: EASE }],
  ['.intro-credit', { opacity: [0, 1], y: [14, 0] }, { at: 4.6, duration: 1.4, ease: EASE }],
  ['.intro-sweep', { x: ['-120%', '420%'], opacity: [0, 1, 1, 0] }, { at: 5.6, duration: 1.6, ease: 'easeInOut' }],
  ['.intro-tag', { opacity: [0, 1], y: [10, 0] }, { at: 6.4, duration: 0.6, ease: EASE, delay: stagger(0.35) }],
  ['.intro-enter', { opacity: [0, 1], y: [8, 0] }, { at: 7.5, duration: 0.6, ease: EASE }],
  ['.intro-column', { scale: [1, 1.02] }, { at: 8.0, duration: 1.6, ease: 'linear' }],
];

type Controls = { pause(): void; play(): void; stop(): void };

export function IntroTrailer() {
  const mode = useSyncExternalStore<IntroMode>(subscribeIntro, readIntroMode, () => 'play');
  const [phase, setPhase] = useState<'playing' | 'closing' | 'done'>('playing');
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const count = useMotionValue(0);
  const shown = useTransform(count, (v) => Math.round(v));
  const skipRef = useRef<HTMLButtonElement>(null);
  const timeline = useRef<Controls | null>(null);
  const closing = useRef(false);

  const open = mode === 'play' && phase !== 'done';

  const finish = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('intro')) {
        url.searchParams.delete('intro');
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      }
    } catch {
      /* ignore */
    }
    markIntroSeen();
    setPhase('done');
  }, []);

  const close = useCallback(async () => {
    if (closing.current || !scope.current) return;
    closing.current = true;
    timeline.current?.stop();
    setPhase('closing');
    // Never autoplay: only chime when the visitor has already interacted with the page.
    if (navigator.userActivation?.hasBeenActive) playChime();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      if (still) {
        await animate(scope.current, { opacity: 0 }, { duration: 0.3 });
      } else {
        const spring = { type: 'spring', stiffness: 120, damping: 22, delay: 0.2 } as const;
        await Promise.all([
          animate('.intro-content', { opacity: 0 }, { duration: 0.25, ease: 'easeIn' }),
          animate('.intro-panel-l', { x: ['0%', '-101%'] }, spring),
          animate('.intro-panel-r', { x: ['0%', '101%'] }, spring),
        ]);
      }
    } finally {
      finish();
    }
  }, [animate, scope, finish]);

  useEffect(() => {
    // A returning visitor was rendered open by the server snapshot; they are dismissed here.
    if (!open || readIntroMode() === 'skip') return;
    const root = scope.current;
    if (!root) return;

    const archive = document.getElementById('archive');
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    const prevGutter = html.style.scrollbarGutter;
    // keep the scrollbar's width reserved while scroll is locked, so the book never reflows
    html.style.scrollbarGutter = 'stable';
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    archive?.setAttribute('inert', '');
    skipRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        void close();
        return;
      }
      if (e.key === 'Tab') {
        const items = Array.from(root.querySelectorAll<HTMLElement>('button'));
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        const active = document.activeElement;
        if (!root.contains(active) || (e.shiftKey && active === first)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      // keep the book behind the overlay from turning pages
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onVisibility: (() => void) | undefined;
    const still = reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      root.setAttribute('data-static', 'true');
      count.set(INTRO_COPY.number);
      timer = setTimeout(() => void close(), 6000);
    } else {
      const controls = animate(sequence(count));
      timeline.current = controls;
      void controls.then(() => void close());
      onVisibility = () => {
        if (document.visibilityState === 'hidden') controls.pause();
        else controls.play();
      };
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      timeline.current?.stop();
      timeline.current = null;
      window.removeEventListener('keydown', onKey, true);
      html.style.overflow = prevHtml;
      html.style.scrollbarGutter = prevGutter;
      document.body.style.overflow = prevBody;
      archive?.removeAttribute('inert');
      archive?.focus({ preventScroll: true });
    };
  }, [open, reduced, animate, scope, count, close]);

  if (!open) return null;

  const twinkle = !reduced;

  return (
    <>
      <div
        ref={scope}
        className="intro-root"
        data-intro-root=""
        role="dialog"
        aria-modal="true"
        aria-label="Introduction"
        suppressHydrationWarning
      >
        <div className="intro-panel intro-panel-l" style={{ willChange: 'transform' }} />
        <div className="intro-panel intro-panel-r" style={{ willChange: 'transform' }} />
        <div className="intro-content">
          <div className="intro-grain" aria-hidden="true" />
          <div className="intro-dust" aria-hidden="true">
            {SPECS.map((s, i) => (
              <motion.span
                key={i}
                className="intro-spec"
                data-spark={s.spark ? '' : undefined}
                style={{ left: s.left, width: s.size, height: s.size }}
                animate={
                  twinkle
                    ? { y: ['0vh', '-108vh'], x: [0, s.drift], opacity: [0, s.spark ? 0.55 : 0.85, s.spark ? 0.55 : 0.85, 0] }
                    : undefined
                }
                transition={{
                  y: { duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear' },
                  x: { duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear' },
                  opacity: { duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'linear', times: [0, 0.1, 0.8, 1] },
                }}
              />
            ))}
          </div>

          <div className="intro-stage">
            <div className="intro-column">
              <div className="intro-lotus" aria-hidden="true">
                <motion.div
                  className="intro-glow"
                  animate={twinkle ? { opacity: [0.2, 0.55, 0.2], scale: [0.94, 1.06, 0.94] } : undefined}
                  transition={{ duration: 3.2, delay: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <svg viewBox="0 0 64 64" fill="none">
                  {PETALS.map((deg) => (
                    <g key={deg} transform={`rotate(${deg} 32 32)`}>
                      <ellipse className="intro-petal" cx="32" cy="17" rx="5.5" ry="14" fill="currentColor" />
                    </g>
                  ))}
                  <circle className="intro-core" cx="32" cy="32" r="6" fill="var(--gold)" />
                  <circle className="intro-core" cx="32" cy="32" r="2.5" fill="var(--cream)" />
                </svg>
              </div>

              <h2 className="intro-h" aria-label={INTRO_HEADING_TEXT}>
                <span className="intro-line intro-line1" aria-hidden="true">
                  {INTRO_COPY.lead.map((w, i) => (
                    <Fragment key={w}>
                      {i > 0 ? ' ' : null}
                      <span className="intro-w intro-w1 intro-hide">{w}</span>
                    </Fragment>
                  ))}
                </span>
                <span className="intro-num intro-hide foil" aria-hidden="true">
                  <motion.span>{shown}</motion.span>
                </span>
                <span className="intro-line intro-line2" aria-hidden="true">
                  {INTRO_COPY.rest.map((w, i) => (
                    <Fragment key={w}>
                      {i > 0 ? ' ' : null}
                      <span className="intro-w intro-w2 intro-hide">{w}</span>
                    </Fragment>
                  ))}
                </span>
              </h2>

              <div className="intro-yearrow" aria-hidden="true">
                <span className="intro-rule intro-hide" style={{ transformOrigin: 'right center' }} />
                <span className="intro-year intro-hide foil">{INTRO_COPY.year}</span>
                <span className="intro-rule intro-rule-r intro-hide" style={{ transformOrigin: 'left center' }} />
              </div>

              <p className="intro-credit intro-hide">{INTRO_COPY.credit}</p>

              <div className="intro-tags">
                {INTRO_COPY.hashtags.map((t) => (
                  <span key={t} className="intro-tag intro-hide">
                    {t}
                  </span>
                ))}
              </div>

              <button type="button" className="intro-btn intro-enter intro-hide" onClick={() => void close()}>
                {INTRO_COPY.ui.enter}
              </button>
            </div>
          </div>

          <div className="intro-sweep" aria-hidden="true">
            <i />
          </div>

          <button ref={skipRef} type="button" className="intro-btn intro-skip" onClick={() => void close()}>
            {INTRO_COPY.ui.skip}
          </button>
        </div>
      </div>
      <noscript>
        <style>{noscriptCss}</style>
      </noscript>
      <BootScript />
    </>
  );
}
