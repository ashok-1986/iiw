import type { CSSProperties } from 'react';
import { LotusMedallion } from '@/components/LotusMedallion';
import { RangoliDivider } from '@/components/RangoliDivider';

/**
 * Cover spread — full viewport, lotus medallion, "Enter Archive" CTA.
 *
 * The heading stays server-rendered and un-animated because it is the LCP
 * element; only the decorative surfaces below it rise in, staggered. The brand
 * name carries the H1 rather than sitting above it as a label, and the gold
 * emphasis is a solid ink rather than a gradient wash.
 */
export function Cover() {
  return (
    <section className="cover-glow relative flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
      <LotusMedallion size={168} />

      <h1 className="mt-9 max-w-4xl font-(family-name:--font-display) text-[42px] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--text)] sm:text-[58px] lg:text-[76px]">
        Inspiring Indian Women
      </h1>

      <p className="mt-5 max-w-xl font-(family-name:--font-accent) text-[21px] italic leading-[1.5] text-[var(--rose-deep)] sm:text-[24px]">
        A digital heirloom — where every page turn feels like unfolding a silk
        saree.
      </p>

      <p className="rise-in mt-6 max-w-[58ch] font-(family-name:--font-body) text-[15px] leading-[1.75] text-[var(--text-muted)]"
        style={{ '--rise-delay': '60ms' } as CSSProperties}
      >
        Every profile is published in the nominee&rsquo;s own words, with her
        consent — set in type and bound as a volume worth keeping.
      </p>

      <div className="rise-in" style={{ '--rise-delay': '160ms' } as CSSProperties}>
        <RangoliDivider className="my-9 w-56" />
      </div>

      <div className="rise-in" style={{ '--rise-delay': '260ms' } as CSSProperties}>
        <a
          href="#archive"
          className="press lift group inline-flex items-center gap-3 rounded-full bg-[var(--plum)] px-8 py-3.5 font-(family-name:--font-ui) text-[13px] uppercase tracking-[0.16em] text-[var(--cream)] shadow-[0_18px_40px_-16px_rgb(160_54_90/0.55)]"
        >
          Enter the Archive
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:translate-x-1"
          >
            →
          </span>
        </a>
      </div>

      <p
        className="rise-in mt-10 font-(family-name:--font-ui) text-[11px] tracking-[0.14em] text-[var(--text-faint)]"
        style={{ '--rise-delay': '360ms' } as CSSProperties}
      >
        <span className="sm:hidden">Swipe to turn a page</span>
        <span className="hidden sm:inline">Use ← → keys, drag, or swipe to turn pages</span>
      </p>
    </section>
  );
}
