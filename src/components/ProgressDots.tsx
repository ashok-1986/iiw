'use client';

/**
 * Spread progress dots (PRD: one dot per page, active scaled + rose gold, click to jump).
 * The PRD's "shows 82 count" rule is deliberately NOT a numeric index of profiles —
 * the editorial brief forbids a directory/list feel, so we show spread position only.
 */
export function ProgressDots({
  total,
  current,
  onJump,
}: {
  total: number;
  current: number;
  onJump: (i: number) => void;
}) {
  // Past a couple of spreads the dots stop being a map and become noise.
  if (total > 24) {
    return (
      <p className="font-(family-name:--font-ui) text-[11px] tabular-nums tracking-[0.12em] text-[var(--text-faint)]">
        {current + 1} / {total}
      </p>
    );
  }
  return (
    <nav aria-label="Flipbook pages" className="flex flex-wrap items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const active = i === current;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-current={active ? 'true' : undefined}
            aria-label={`Go to spread ${i + 1}`}
            className="rounded-full transition-all duration-200"
            style={{
              width: active ? 10 : 5,
              height: active ? 10 : 5,
              background: active ? 'var(--nectarine)' : 'rgb(99 152 169 / 0.45)',
              boxShadow: active ? '0 0 0 3px rgb(249 185 92 / 0.85)' : 'none',
            }}
          />
        );
      })}
    </nav>
  );
}
