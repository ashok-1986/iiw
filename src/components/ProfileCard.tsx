import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { FlipProfile } from '@/lib/flipbook-store';
import { PortraitArch } from './PortraitArch';
import { RangoliDivider } from './RangoliDivider';

/**
 * Arch profile card — PRD component spec: arch container, PortraitArch,
 * name (Playfair 20px), category line (Inter 11px uppercase, only when populated),
 * summary in Lora 14px, rangoli/gold divider.
 *
 * The portrait is the plate, not a thumbnail: 176–192px. From md up it sits
 * beside the text column instead of above it, which keeps the plate large *and*
 * gives the biography a two–three times taller reading area than the stacked
 * version. Phones get a full-page plate because the page now holds one profile.
 * Breakpoint sizing lives in CSS so nothing re-lays-out on hydration.
 *
 * Bios run to 6,400 chars, so the summary scrolls inside a capped, faded box
 * rather than being clipped or truncated — the full text is the published content.
 * `delay` is only nonzero on the book's first view; from the second spread on,
 * the page turn is the animation and cards do not compete with it.
 */
export function ProfileCard({ nominee, delay = 0 }: { nominee: FlipProfile; delay?: number }) {
  return (
    <article
      className={
        'hoverable group flex min-h-0 flex-1 flex-col items-center gap-4 text-center md:flex-row md:items-stretch md:gap-7 md:text-left' +
        (delay ? ' rise-in' : '')
      }
      style={delay ? ({ '--rise-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      <PortraitArch
        name={nominee.name}
        imageId={nominee.imageId}
        sizeClass="size-[176px] xl:size-[192px]"
        sizes="(max-width: 1279px) 176px, 192px"
      />
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3">
        <div>
          <h3 className="font-(family-name:--font-display) text-[20px] font-semibold leading-tight tracking-tight text-[var(--text)]">
            {nominee.name}
          </h3>
          {nominee.category && (
            <p className="mt-1.5 inline-block rounded-full bg-[var(--menthe)] px-2.5 py-0.5 font-(family-name:--font-ui) text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--plum)]">
              {nominee.category}
            </p>
          )}
        </div>
        <RangoliDivider className="w-full" />
        <div className="bio-fade w-full min-h-0 flex-1">
          <div
            className="bio-scroll h-full w-full overflow-y-auto px-1 text-left"
            tabIndex={0}
            role="region"
            aria-label={`${nominee.name} — biography, scrollable`}
          >
            <p className="font-(family-name:--font-body) text-[14px] leading-[1.65] text-[var(--text-muted)]">
              {nominee.summary}
            </p>
          </div>
        </div>
        <Link
          href={`/profile/${nominee.slug}`}
          className="press cursor-pointer self-start rounded-full bg-[var(--peche)] px-4 py-1.5 font-(family-name:--font-ui) text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--plum)] transition-colors duration-200 hover:bg-[var(--nectarine)]"
        >
          Full profile
        </Link>
      </div>
    </article>
  );
}
