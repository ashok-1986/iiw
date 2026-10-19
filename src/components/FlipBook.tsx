'use client';

import { useReducedMotion } from 'framer-motion';
import HTMLFlipBook from 'react-pageflip';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import { BookCover } from './BookCover';
import { Page } from './Page';
import { SoundToggle } from './SoundToggle';
import { playFlip } from '@/lib/sound';
import { chunkIntoPages } from '@/lib/paginate';
import { useIsMobile } from '@/lib/use-is-mobile';
import { useFlipbook, type FlipProfile } from '@/lib/flipbook-store';

/**
 * The book is react-pageflip (StPageFlip): fixed-ratio pages, a real curl with
 * shadow, drag / swipe / corner-pull, and hard covers. Page 1 is the front cover,
 * content pages follow (2 profiles each on desktop, 1 on a phone), and the back
 * cover is last. The folio printed on a page is its 1-based index in the book, so
 * numbers are consecutive and even = left page. Desktop keeps the page count even
 * (blank filler leaf) so the back cover lands alone on its own leaf.
 */
const DESKTOP = { width: 550, height: 715, minWidth: 330, maxWidth: 720, minHeight: 430, maxHeight: 940 };
const PHONE = { width: 360, height: 630, minWidth: 260, maxWidth: 520, minHeight: 440, maxHeight: 940 };

interface FlipApi {
  flipNext: () => void;
  flipPrev: () => void;
  flip: (page: number) => void;
  turnToPage: (page: number) => void;
}
interface BookRef {
  pageFlip: () => FlipApi | undefined;
}

const noopSubscribe = () => () => {};

export function FlipBook({ profiles }: { profiles: FlipProfile[] }) {
  const { query, category } = useFlipbook();
  const phone = useIsMobile();
  const reduced = useReducedMotion();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const bookRef = useRef<BookRef>(null);
  const flipping = useRef(false);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((pr) => {
      if (category && pr.category !== category) return false;
      if (!q) return true;
      return (
        pr.name.toLowerCase().includes(q) ||
        pr.summary.toLowerCase().includes(q) ||
        pr.org.toLowerCase().includes(q) ||
        pr.category.toLowerCase().includes(q)
      );
    });
  }, [profiles, query, category]);

  const contentPages = useMemo(() => chunkIntoPages(filtered, phone ? 1 : 2), [filtered, phone]);
  const empty = filtered.length === 0;
  const needsFiller = !phone && contentPages.length % 2 === 1;
  const total = contentPages.length + (needsFiller ? 1 : 0) + 2; // + front and back cover
  const last = total - 1;

  // A new filter / breakpoint builds a new book, which opens on its cover.
  const bookKey = `${phone ? 'p' : 'd'}|${category}|${query}|${filtered.length}`;
  useEffect(() => {
    setPage(0);
  }, [bookKey]);

  const children = useMemo(() => {
    const out: ReactElement[] = [
      <BookCover key="front" variant="front" count={profiles.length} phone={phone} />,
    ];
    contentPages.forEach((p, i) => {
      out.push(<Page key={`p${i}-${p[0]?.id}`} profiles={p} number={i + 2} phone={phone} />);
    });
    if (needsFiller) {
      out.push(<Page key="filler" profiles={[]} number={contentPages.length + 2} phone={false} />);
    }
    out.push(<BookCover key="back" variant="back" count={profiles.length} phone={phone} />);
    return out;
  }, [contentPages, needsFiller, phone, profiles.length]);

  const api = () => bookRef.current?.pageFlip();
  const next = useCallback(() => api()?.flipNext(), []);
  const prev = useCallback(() => api()?.flipPrev(), []);
  const jump = useCallback(
    (to: number) => {
      const target = Math.max(0, Math.min(to, last));
      if (reduced) api()?.turnToPage(target);
      else api()?.flip(target);
    },
    [last, reduced],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Home') {
        e.preventDefault();
        jump(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        jump(last);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, jump, last]);

  const size = phone ? PHONE : DESKTOP;
  const atStart = page <= 0;
  const atEnd = page >= last;
  const pct = last > 0 ? Math.min(100, Math.max(0, (page / last) * 100)) : 0;
  // The library sizes the book from its parent's WIDTH only (height = width x ratio), so cap
  // that width from the stage height: the open book is two pages wide, a phone book one.
  const ratio = size.height / size.width;
  const frameWidth = `min(100%, calc(var(--stage-h) * ${((phone ? 1 : 2) / ratio).toFixed(4)}))`;
  // A closed book (cover or back cover alone) sits in one half of the spread: slide it to centre.
  const slide = phone || (page > 0 && page < last) ? 'translateX(0)' : `translateX(${page === 0 ? '-25%' : '25%'})`;
  // A desktop spread shows two pages (odd index = left page of a spread); covers show alone.
  const shown =
    phone || page === 0 || page === last
      ? [page + 1]
      : page % 2 === 1
        ? [page + 1, page + 2]
        : [page, page + 1];

  return (
    <section
      className="mx-auto w-full max-w-[1180px] px-4"
      role="region"
      aria-roledescription="paginated book"
      aria-label="Inspiring Indian Women flipbook"
    >
      <div className="book-stage relative flex items-center justify-center select-none">
        {empty ? (
          <p className="font-(family-name:--font-accent) text-[20px] italic text-[var(--text-muted)]">
            No profiles match your search
          </p>
        ) : mounted ? (
          <div className="h-full" style={{ width: frameWidth }}>
          <HTMLFlipBook
            key={bookKey}
            ref={bookRef as never}
            className="iiw-book book-slide"
            style={{ transform: slide }}
            startPage={0}
            size="stretch"
            width={size.width}
            height={size.height}
            minWidth={size.minWidth}
            maxWidth={size.maxWidth}
            minHeight={size.minHeight}
            maxHeight={size.maxHeight}
            drawShadow={!reduced}
            flippingTime={reduced ? 1 : 900}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            maxShadowOpacity={0.55}
            showCover={true}
            mobileScrollSupport={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={!reduced}
            disableFlipByClick={true}
            onFlip={(e: { data: number }) => setPage(e.data)}
            onChangeState={(e: { data: string }) => {
              const isFlipping = e.data === 'flipping';
              if (isFlipping && !flipping.current) playFlip();
              flipping.current = isFlipping;
            }}
          >
            {children}
          </HTMLFlipBook>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={atStart || empty}
            className="press min-h-11 cursor-pointer whitespace-nowrap rounded-full border-2 border-[var(--gold)] bg-transparent px-4 py-2 sm:px-5 font-(family-name:--font-ui) text-[12px] font-medium text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--on-accent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <span
            aria-live="polite"
            className="min-w-[5.5rem] text-center sm:min-w-[8.5rem] font-(family-name:--font-ui) text-[12px] tabular-nums text-[var(--text-muted)]"
          >
            {empty ? '0 profiles' : `Page ${shown.join('–')} of ${total}`}
          </span>
          <button
            type="button"
            onClick={next}
            disabled={atEnd || empty}
            className="press min-h-11 cursor-pointer whitespace-nowrap rounded-full border-2 border-[var(--marigold)] bg-[var(--marigold)] px-4 py-2 sm:px-5 font-(family-name:--font-ui) text-[12px] font-semibold text-[var(--on-accent)] hover:border-[var(--gold-hi)] hover:bg-[var(--gold-hi)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
          <SoundToggle />
        </div>
        <div
          className="book-progress w-full max-w-[420px]"
          role="progressbar"
          aria-label="Position in the book"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={Math.min(total, page + 1)}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="font-(family-name:--font-ui) text-[11px] tracking-[0.12em] text-[var(--text-faint)]">
          {filtered.length} profiles · <span className="sm:hidden">swipe to turn a page</span>
          <span className="hidden sm:inline">← → keys, drag a corner, or swipe</span>
        </p>
      </div>
    </section>
  );
}
