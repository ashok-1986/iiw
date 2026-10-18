'use client';

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Page } from './Page';
import { ProgressDots } from './ProgressDots';
import { chunkIntoPages } from '@/lib/paginate';
import { useIsMobile } from '@/lib/use-is-mobile';
import { useFlipbook, type FlipProfile } from '@/lib/flipbook-store';

/**
 * A page turn is a physical leaf, not a fade:
 *  - the leaf hinges on the spine (desktop) or its left edge (phone) and has two
 *    faces — the page being left behind on the front, the page arriving on the back —
 *    so the incoming page is carried over rather than popped in;
 *  - the pages underneath are already the destination pages, revealed as the leaf lifts;
 *  - light follows the angle: the leaf darkens as it stands up, and casts a soft shadow
 *    first on the page it uncovers, then on the page it lands on;
 *  - a drag drives the leaf directly (progress = finger travel), so the page follows
 *    the hand and settles with a flick or springs back if released early.
 * Progress `p` (0..1) is the single source of truth; every visual derives from it.
 */
const PAPER_EASE: [number, number, number, number] = [0.645, 0.045, 0.355, 1];
const SETTLE_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const TURN_S = 0.9;
const JUMP_S = 0.7;
/** Fraction of the stage width a finger must travel for a complete turn. */
const DRAG_SPAN = 0.85;
const COMMIT_PROGRESS = 0.32;
const FLICK_VELOCITY = 520;
const PHONE_ANGLE = 104;
const INK = '31 54 64';

type Dir = 1 | -1;
type Side = 'left' | 'right';
interface Leaf {
  dir: Dir;
  from: number;
  to: number;
}

const radiusOf = (side: Side | 'solo') =>
  side === 'left' ? '24px 4px 4px 14px' : side === 'right' ? '4px 24px 14px 4px' : '24px 24px 14px 14px';

/** Soft shadow laid on a page by the leaf passing over it. */
function Cast({
  p,
  spine,
  input,
  output,
  radius,
}: {
  p: MotionValue<number>;
  spine: Side;
  input: number[];
  output: number[];
  radius: string;
}) {
  const opacity = useTransform(p, input, output);
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        opacity,
        borderRadius: radius,
        background: `linear-gradient(to ${spine === 'left' ? 'right' : 'left'}, rgb(${INK} / 0.7), rgb(${INK} / 0) 58%)`,
      }}
    />
  );
}

/** Darkening on a leaf face as it stands up toward the light. */
function Shade({
  p,
  spine,
  input,
  output,
}: {
  p: MotionValue<number>;
  spine: Side;
  input: number[];
  output: number[];
}) {
  const opacity = useTransform(p, input, output);
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        opacity,
        background: `linear-gradient(to ${spine === 'left' ? 'right' : 'left'}, rgb(${INK} / 0.85), rgb(${INK} / 0) 75%)`,
      }}
    />
  );
}

function TurningLeaf({
  p,
  dir,
  phone,
  front,
  back,
}: {
  p: MotionValue<number>;
  dir: Dir;
  phone: boolean;
  front: ReactNode;
  back: ReactNode;
}) {
  const angle = useTransform(p, (v) => {
    if (phone) return dir === 1 ? -PHONE_ANGLE * v : -PHONE_ANGLE * (1 - v);
    return dir === 1 ? -180 * v : 180 * v;
  });
  const opacity = useTransform(
    p,
    phone ? (dir === 1 ? [0, 0.7, 1] : [0, 0.3, 1]) : [0, 1],
    phone ? (dir === 1 ? [1, 1, 0] : [0, 1, 1]) : [1, 1],
  );
  const lift = useTransform(p, (v) => {
    const s = Math.sin(Math.PI * v);
    return `0 ${8 + 26 * s}px ${26 + 44 * s}px -10px rgb(${INK} / ${(0.1 + 0.36 * s).toFixed(3)})`;
  });

  const frontSpine: Side = phone || dir === 1 ? 'left' : 'right';
  const backSpine: Side = frontSpine === 'left' ? 'right' : 'left';
  const position = phone
    ? { left: 0, width: '100%', transformOrigin: 'left center' }
    : dir === 1
      ? { left: '50%', width: '50%', transformOrigin: 'left center' }
      : { left: 0, width: '50%', transformOrigin: 'right center' };
  const frontRadius = phone ? radiusOf('solo') : radiusOf(dir === 1 ? 'right' : 'left');
  const backRadius = radiusOf(dir === 1 ? 'left' : 'right');

  // The desktop leaf's front face darkens until edge-on (p = .5), then its back face
  // brightens back to flat paper. The phone leaf has a single face.
  const frontIn = phone ? [0, 1] : [0, 0.5];
  const frontOut = phone ? (dir === 1 ? [0, 0.3] : [0.3, 0]) : [0, 0.4];

  return (
    <motion.div
      aria-hidden="true"
      {...({ inert: true } as object)}
      className="absolute top-0 bottom-0 z-30"
      style={{
        ...position,
        rotateY: angle,
        opacity,
        boxShadow: lift,
        borderRadius: frontRadius,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
        {front}
        <Shade p={p} spine={frontSpine} input={frontIn} output={frontOut} />
      </div>
      {!phone && (
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: backRadius }}
        >
          {back}
          <Shade p={p} spine={backSpine} input={[0.5, 1]} output={[0.4, 0]} />
        </div>
      )}
    </motion.div>
  );
}

function EndCard({ side }: { side: Side | 'solo' }) {
  return (
    <div
      className={
        'arch-card silk-overlay page-card relative flex h-full min-w-0 items-center justify-center overflow-hidden ' +
        (side === 'left' ? 'page-left' : side === 'right' ? 'page-right' : '')
      }
    >
      <p className="font-(family-name:--font-accent) text-[18px] italic text-[var(--text-muted)]">
        End of the archive
      </p>
    </div>
  );
}

export function FlipBook({ profiles }: { profiles: FlipProfile[] }) {
  const { spread, go, setTotalSpreads, query, category } = useFlipbook();
  const phone = useIsMobile();
  const reduced = useReducedMotion();
  const [leaf, setLeaf] = useState<Leaf | null>(null);
  const [settled, setSettled] = useState(false);
  const busy = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ active: boolean; dir: Dir; to: number }>({ active: false, dir: 1, to: 0 });
  const p = useMotionValue(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((pr) => {
      if (category && pr.category !== category) return false;
      if (!q) return true;
      return (
        pr.name.toLowerCase().includes(q) ||
        pr.summary.toLowerCase().includes(q) ||
        pr.category.toLowerCase().includes(q)
      );
    });
  }, [profiles, query, category]);

  const pages = useMemo(() => chunkIntoPages(filtered, phone ? 1 : 2), [filtered, phone]);
  // PRD responsive rule: desktop shows a two-page spread, mobile shows one page per turn.
  const totalSpreads = Math.max(1, phone ? pages.length : Math.ceil(pages.length / 2));
  const empty = filtered.length === 0;

  useEffect(() => setTotalSpreads(totalSpreads), [totalSpreads, setTotalSpreads]);

  const pageAt = (idx: number, side: Side) =>
    phone ? (side === 'left' ? pages[idx] : undefined) : pages[idx * 2 + (side === 'right' ? 1 : 0)];
  const numberAt = (idx: number, side: Side) => (phone ? idx + 1 : idx * 2 + (side === 'right' ? 2 : 1));
  const staggerOn = !settled && !leaf;

  const nodeAt = (idx: number, side: Side) => {
    const content = pageAt(idx, side);
    const kind: Side | 'solo' = phone ? 'solo' : side;
    return content ? (
      <Page
        key={`${side}-${idx}`}
        profiles={content}
        pageNumber={numberAt(idx, side)}
        stagger={staggerOn}
        solo={phone}
        side={kind}
      />
    ) : (
      <EndCard key={`${side}-${idx}-end`} side={kind} />
    );
  };

  const finish = useCallback(() => {
    setLeaf(null);
    busy.current = false;
  }, []);

  const turnTo = useCallback(
    (to: number) => {
      const target = Math.max(0, Math.min(to, totalSpreads - 1));
      if (target === spread || busy.current || empty) return;
      setSettled(true);
      if (reduced) {
        go(target);
        return;
      }
      busy.current = true;
      const dir: Dir = target > spread ? 1 : -1;
      p.set(0);
      setLeaf({ dir, from: spread, to: target });
      go(target);
      animate(p, 1, {
        duration: Math.abs(target - spread) > 1 ? JUMP_S : TURN_S,
        ease: PAPER_EASE,
        onComplete: finish,
      });
    },
    [totalSpreads, spread, empty, reduced, go, p, finish],
  );

  // Keyboard flip (WCAG requirement in the PRD)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') turnTo(spread + 1);
      else if (e.key === 'ArrowLeft') turnTo(spread - 1);
      else if (e.key === 'Home') turnTo(0);
      else if (e.key === 'End') turnTo(totalSpreads - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spread, totalSpreads, turnTo]);

  // Drag-to-turn: the finger drives the leaf directly.
  const onPanStart = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    pan.current.active = false;
    if (busy.current || reduced || empty) return;
    if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) return; // vertical intent: let the bio scroll
    const dir: Dir = info.offset.x < 0 ? 1 : -1;
    const to = spread + dir;
    if (to < 0 || to > totalSpreads - 1) return;
    busy.current = true;
    pan.current = { active: true, dir, to };
    setSettled(true);
    p.set(0);
    setLeaf({ dir, from: spread, to });
  };

  const onPan = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!pan.current.active) return;
    const width = stageRef.current?.offsetWidth || 1000;
    const travel = pan.current.dir === 1 ? -info.offset.x : info.offset.x;
    p.set(Math.min(1, Math.max(0, travel / (width * DRAG_SPAN))));
  };

  const onPanEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const st = pan.current;
    if (!st.active) return;
    st.active = false;
    const current = p.get();
    const speed = st.dir === 1 ? -info.velocity.x : info.velocity.x;
    if (current > COMMIT_PROGRESS || speed > FLICK_VELOCITY) {
      go(st.to);
      animate(p, 1, { duration: 0.55 * (1 - current) + 0.2, ease: SETTLE_EASE, onComplete: finish });
    } else {
      animate(p, 0, { duration: 0.4, ease: SETTLE_EASE, onComplete: finish });
    }
  };

  const atStart = spread === 0;
  const atEnd = spread >= totalSpreads - 1;

  // What lies under the leaf while it turns (the destination pages), and what it carries.
  let leftIdx = spread;
  let rightIdx = spread;
  let front: ReactNode = null;
  let back: ReactNode = null;
  if (leaf) {
    if (phone) {
      // One page: the base is whichever page the leaf is not carrying.
      leftIdx = leaf.dir === 1 ? leaf.to : leaf.from;
      front = nodeAt(leaf.dir === 1 ? leaf.from : leaf.to, 'left');
    } else if (leaf.dir === 1) {
      leftIdx = leaf.from;
      rightIdx = leaf.to;
      front = nodeAt(leaf.from, 'right');
      back = nodeAt(leaf.to, 'left');
    } else {
      leftIdx = leaf.to;
      rightIdx = leaf.from;
      front = nodeAt(leaf.from, 'left');
      back = nodeAt(leaf.to, 'right');
    }
  }

  const landSide: Side = leaf?.dir === 1 ? 'left' : 'right';
  const castIn = (side: Side) => (landSide === side ? [0.4, 0.78, 1] : [0, 0.28, 0.7]);
  const castOut = (side: Side) => (landSide === side ? [0, 0.3, 0] : [0, 0.34, 0]);

  return (
    <section
      className="mx-auto w-full max-w-[1180px] px-4"
      role="region"
      aria-roledescription="paginated book"
      aria-label="IIW flipbook"
    >
      <motion.div
        ref={stageRef}
        className="relative h-[76vh] min-h-[560px] select-none"
        style={{ perspective: '2200px', touchAction: 'pan-y' }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        aria-busy={leaf ? true : undefined}
      >
        {empty ? (
          <div className="arch-card silk-overlay flex h-full min-w-0 items-center justify-center">
            <p className="font-(family-name:--font-accent) text-[18px] italic text-[var(--text-muted)]">
              No profiles match your search
            </p>
          </div>
        ) : phone ? (
          <div className="relative h-full min-w-0">
            {nodeAt(leftIdx, 'left')}
            {leaf && (
              <Cast
                p={p}
                spine="left"
                input={[0, 0.5, 1]}
                output={leaf.dir === 1 ? [0.3, 0.18, 0] : [0, 0.18, 0.3]}
                radius={radiusOf('solo')}
              />
            )}
          </div>
        ) : (
          <>
            {/* the gutter: a dark strip behind the pages so the open book has a spine */}
            <div
              aria-hidden="true"
              className="absolute inset-y-2 left-1/2 w-2 -translate-x-1/2 rounded bg-[var(--plum)]/30"
            />
            <div className="relative z-10 grid h-full grid-cols-2">
              <div className="relative h-full min-w-0">
                {nodeAt(leftIdx, 'left')}
                {leaf && (
                  <Cast p={p} spine="right" input={castIn('left')} output={castOut('left')} radius={radiusOf('left')} />
                )}
              </div>
              <div className="relative h-full min-w-0">
                {nodeAt(rightIdx, 'right')}
                {leaf && (
                  <Cast p={p} spine="left" input={castIn('right')} output={castOut('right')} radius={radiusOf('right')} />
                )}
              </div>
            </div>
          </>
        )}

        {leaf && !empty && <TurningLeaf p={p} dir={leaf.dir} phone={phone} front={front} back={back} />}
      </motion.div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => turnTo(spread - 1)}
            disabled={atStart}
            className="press cursor-pointer rounded-full border-2 border-[var(--lagune)] bg-[var(--surface-2)] px-5 py-2 font-(family-name:--font-ui) text-[12px] font-medium text-[var(--text)] hover:bg-[var(--menthe)]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <span
            aria-live="polite"
            className="font-(family-name:--font-ui) text-[12px] tabular-nums text-[var(--text-muted)]"
          >
            Spread {spread + 1} of {totalSpreads} · {filtered.length} profiles
          </span>
          <button
            type="button"
            onClick={() => turnTo(spread + 1)}
            disabled={atEnd}
            className="press cursor-pointer rounded-full border-2 border-[var(--peche)] bg-[var(--peche)] px-5 py-2 font-(family-name:--font-ui) text-[12px] font-semibold text-[var(--plum)] shadow-[0_10px_24px_-12px_rgb(249_185_92/0.9)] hover:border-[var(--nectarine)] hover:bg-[var(--nectarine)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
        <ProgressDots total={totalSpreads} current={spread} onJump={(i) => turnTo(i)} />
      </div>
    </section>
  );
}
