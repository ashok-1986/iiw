'use client';

import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { Page } from './Page';
import { ProgressDots } from './ProgressDots';
import { chunkIntoPages } from '@/lib/paginate';
import { useIsMobile } from '@/lib/use-is-mobile';
import { useFlipbook, type FlipProfile } from '@/lib/flipbook-store';

/** PRD motion spec: curl 420ms ease-out, entrance stagger 80ms, perspective 1600px. */
const CURL_MS = 420;
const DRAG_THRESHOLD_PX = 80;

export function FlipBook({ profiles }: { profiles: FlipProfile[] }) {
  const { spread, direction, next, prev, go, setTotalSpreads, query, category } = useFlipbook();
  const mobile = useIsMobile();

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

  // Keyboard flip (WCAG requirement in the PRD)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(totalSpreads - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, totalSpreads]);

  const onDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x <= -DRAG_THRESHOLD_PX) next();
    else if (info.offset.x >= DRAG_THRESHOLD_PX) prev();
  };

  const left = mobile ? pages[spread] : pages[spread * 2];
  const right = mobile ? undefined : pages[spread * 2 + 1];
  const leftPageNumber = mobile ? spread + 1 : spread * 2 + 1;
  const rightPageNumber = spread * 2 + 2;

  return (
    <section
      className="mx-auto w-full max-w-[1180px] px-4"
      aria-roledescription="carousel"
      aria-label="IIW flipbook"
    >
      <div
        className="relative flex h-[68vh] min-h-[520px] gap-3"
        style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {left && (
            <motion.div
              key={`L-${spread}`}
              className="h-full min-w-0 flex-1"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.08}
              onDragEnd={onDragEnd}
              initial={
                direction === -1
                  ? { rotateY: -180, transformOrigin: 'right center', opacity: 0 }
                  : false
              }
              animate={{ rotateY: 0, opacity: 1, transformOrigin: 'right center' }}
              exit={
                direction === 1
                  ? { rotateY: -180, transformOrigin: 'right center', opacity: 0 }
                  : { opacity: 0 }
              }
              transition={{ duration: CURL_MS / 1000, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <Page profiles={left} pageNumber={leftPageNumber} />
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
                  dragElastic={0.08}
                  onDragEnd={onDragEnd}
                  initial={
                    direction === 1
                      ? { rotateY: -180, transformOrigin: 'left center', opacity: 0 }
                      : false
                  }
                  animate={{ rotateY: 0, opacity: 1, transformOrigin: 'left center' }}
                  exit={
                    direction === -1
                      ? { rotateY: -180, transformOrigin: 'left center', opacity: 0 }
                      : { opacity: 0 }
                  }
                  transition={{ duration: CURL_MS / 1000, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <Page profiles={right} pageNumber={rightPageNumber} />
                </motion.div>
              ) : (
                <div className="arch-card silk-overlay flex h-full min-w-0 flex-1 items-center justify-center">
                  <p className="font-(family-name:--font-accent) text-[18px] italic text-[var(--text-faint)]">
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
            onClick={prev}
            disabled={spread === 0}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 font-(family-name:--font-ui) text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--surface-3)] disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="font-(family-name:--font-ui) text-[12px] tabular-nums text-[var(--text-faint)]">
            Spread {spread + 1} of {totalSpreads} · {filtered.length} profiles
          </span>
          <button
            type="button"
            onClick={next}
            disabled={spread >= totalSpreads - 1}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 font-(family-name:--font-ui) text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--surface-3)] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
        <ProgressDots total={totalSpreads} current={spread} onJump={go} />
      </div>
    </section>
  );
}
