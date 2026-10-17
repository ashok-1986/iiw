import { LotusMark } from '@/components/LotusMark';
import { RangoliDivider } from '@/components/RangoliDivider';

/**
 * Cover spread — full viewport, lotus, champagne-gold foil, "Enter Archive" CTA.
 * Zero client JS (PRD LCP rule): a plain anchor scrolls to the book, which Next
 * has already streamed below the fold.
 */
export function Cover() {
  return (
    <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 text-center">
      <div className="text-[var(--rose)]">
        <LotusMark size={96} />
      </div>

      <p className="mt-8 font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.32em] text-[var(--text-faint)]">
        Inspiring Indian Women
      </p>

      <h1 className="mt-4 max-w-3xl font-(family-name:--font-display) text-[44px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[56px] lg:text-[68px]">
        <span className="bg-gradient-to-r from-[#8a6a2f] via-[var(--gold)] to-[#8a6a2f] bg-clip-text text-transparent">
          A Digital Heirloom
        </span>
      </h1>

      <p className="mt-6 max-w-xl font-(family-name:--font-accent) text-[22px] italic leading-[1.5] text-[var(--text-muted)]">
        “Not a directory. A digital heirloom — where every page turn feels like
        unfolding a silk saree.”
      </p>

      <RangoliDivider className="my-9 w-56" />

      <a
        href="#archive"
        className="group inline-flex items-center gap-3 rounded-full bg-[var(--plum)] px-8 py-3.5 font-(family-name:--font-ui) text-[13px] uppercase tracking-[0.16em] text-[var(--cream)] shadow-[0_18px_40px_-18px_rgb(45_27_45/0.8)] transition-transform hover:-translate-y-0.5"
      >
        Enter the Archive
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </a>

      <p className="mt-10 font-(family-name:--font-ui) text-[11px] tracking-[0.14em] text-[var(--text-faint)]">
        Use ← → keys, drag, or swipe to turn pages
      </p>
    </section>
  );
}
