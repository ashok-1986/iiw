'use client';

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Page } from './Page';
import { ProgressDots } from './ProgressDots';
import { chunkIntoPages } from '@/lib/paginate';
import { useIsMobile } from '@/lib/use-is-mobile';
import { useFlipbook, type FlipProfile } from '@/lib/flipbook-store';

/**
 * PRD motion spec: curl 420ms. Keyboard and dot jumps reuse the same curve at
 * 240ms — the motion keeps its meaning, only its length — and an exit is always
 * shorter than an entrance so the incoming page never waits for the old one.
 */
const EASE_CURL: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const CURL_S = 0.42;
const CURL_SNAP_S = 0.24;
const EXIT_S = 0.26;
const DRAG_THRESHOLD_PX = 80;
/** A flick is enough on its own; distance should never be the only signal. */
const FLICK_VELOCITY = 0.12;

type Side = 'left' | 'right';

export function FlipBook({ profiles }: { profiles: FlipProfile[] }) {
  const { spread, direction, next, prev, go, setTotalSpreads, query, category } = useFlipbook();
  const mobile = useIsMobile();
  const reduced = useReducedMotion();
  const [snappy, setSnappy] = useState(false);
  const [settled, setSettled] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [profiles, query, category]);

  const pages = useMemo(() => chunkIntoPages(filtered, 2), [filtered]);
  // PRD responsive rule: desktop shows a two-page spread, mobile shows one page per turn.
  const totalSpreads = Math.max(1, mobile ? pages.length : Math.ceil(pages.length / 2));

  useEffect(() => setTotalSpreads(totalSpreads), [totalSpreads, setTotalSpreads]);

  const turn = useCallback(
    (fn: () => void, quick: boolean) => {
      setSnappy(quick);
      setSettled(true);
      fn();
    },
    [],
  );

  // Keyboard flip (WCAG requirement in the PRD)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') turn(next, true);
      else if (e.key === 'ArrowLeft') turn(prev, true);
      else if (e.key === 'Home') turn(() => go(0), true);
      else if (e.key === 'End') turn(() => go(totalSpreads - 1), true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, totalSpreads, turn]);

  const onDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const flicked = Math.abs(info.velocity.x) > FLICK_VELOCITY;
    const forward = info.offset.x <= -DRAG_THRESHOLD_PX || (flicked && info.velocity.x < -1);
    const backward = info.offset.x >= DRAG_THRESHOLD_PX || (flicked && info.velocity.x > 1);
    if (forward) turn(next, false);
    else if (backward) turn(prev, false);
  };

  const curl = reduced ? 0 : snappy ? CURL_SNAP_S : CURL_S;

  const flip = (side: Side) => {
    const origin = side === 'left' ? 'right center' : 'left center';
    const closed = side === 'left' ? { rotateY: -180 } : { rotateY: 180 };
    const enters = side === 'left' ? direction === -1 : direction === 1;
    const exits = side === 'left' ? direction === 1 : direction === -1;
    if (reduced) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18, ease: 'easeOut' as const },
      };
    }
    return {
      initial: enters ? { ...closed, opacity: 0 } : false,
      animate: { rotateY: 0, opacity: 1 },
      exit: exits
        ? { ...closed, opacity: 0, transition: { duration: EXIT_S, ease: EASE_CURL } }
        : { opacity: 0, transition: { duration: 0.16, ease: 'easeOut' as const } },
      transition: { duration: curl, ease: curl > 0.3 ? EASE_CURL : ([0.23, 1, 0.32, 1] as [number, number, number, number]) },
      style: { transformOrigin: origin },
    };
  };

  const left = mobile ? pages[spread] : pages[spread * 2];
  const right = mobile ? undefined : pages[spread * 2 + 1];
  const leftPageNumber = mobile ? spread + 1 : spread * 2 + 1;
  const rightPageNumber = spread * 2 + 2;
  const atStart = spread === 0;
  const atEnd = spread >= totalSpreads - 1;
  // Boundary friction: dragging away from an end of the book resists, and
  // resists harder the further it goes, instead of hitting an invisible wall.
  const elastic = (side: Side) => (side === 'left' ? (atStart ? 0.02 : 0.09) : atEnd ? 0.02 : 0.09);

  return (
    <section
      className="mx-auto w-full max-w-[1180px] px-4"
      role="region"
      aria-roledescription="paginated book"
      aria-label="IIW flipbook"
    >
      <div
        className="relative flex h-[76vh] min-h-[600px] gap-3"
        style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {left && (
            <motion.div
              key={`L-${spread}`}
              className="h-full min-w-0 flex-1"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={elastic('left')}
              onDragEnd={onDragEnd}
              {...flip('left')}
            >
              <Page profiles={left} pageNumber={leftPageNumber} stagger={!settled} />
            </motion.div>
          )}
        </AnimatePresence>

        {!mobile && (
          <>
            <div className="w-px shrink-0 bg-[var(--gold)]/40" aria-hidden="true" />

            <AnimatePresence initial={false} mode="popLayout">
              {right ? (
                <motion.div
                  key={`R-${spread}`}
                  className="h-full min-w-0 flex-1"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={elastic('right')}
                  onDragEnd={onDragEnd}
                  {...flip('right')}
                >
                  <Page profiles={right} pageNumber={rightPageNumber} stagger={!settled} />
                </motion.div>
              ) : (
                <div className="arch-card silk-overlay flex h-full min-w-0 flex-1 items-center justify-center">
                  <p className="font-(family-name:--font-accent) text-[18px] italic text-[var(--text-muted)]">
                    {filtered.length ? 'End of the archive' : 'No profiles match your search'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => turn(prev, true)}
            disabled={atStart}
            className="press rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 font-(family-name:--font-ui) text-[12px] text-[var(--text)] hover:bg-[var(--surface-3)] disabled:opacity-40"
          >
            ← Previous
          </button>
          <span
            aria-live="polite"
            className="font-(family-name:--font-ui) text-[12px] tabular-nums text-[var(--text-faint)]"
          >
            Spread {spread + 1} of {totalSpreads} · {filtered.length} profiles
          </span>
          <button
            type="button"
            onClick={() => turn(next, true)}
            disabled={atEnd}
            className="press rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 font-(family-name:--font-ui) text-[12px] text-[var(--text)] hover:bg-[var(--surface-3)] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
        <ProgressDots total={totalSpreads} current={spread} onJump={(i) => turn(() => go(i), true)} />
      </div>
    </section>
  );
}
