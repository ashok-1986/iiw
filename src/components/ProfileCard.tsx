import Link from 'next/link';
import type { FlipProfile } from '@/lib/flipbook-store';
import { PortraitArch } from './PortraitArch';
import { RangoliDivider } from './RangoliDivider';

/**
 * Arch-top profile card — PRD component spec: arch container, PortraitArch,
 * name (Playfair 20px), org line (Inter 11px uppercase, only when populated),
 * summary in Lora 14px, rangoli/gold divider.
 *
 * Bios run to 6,400 chars, so the summary scrolls inside a capped, faded box
 * rather than being clipped or truncated — the full text is the published content.
 */
export function ProfileCard({ nominee }: { nominee: FlipProfile }) {
  return (
    <article className="flex min-h-0 flex-1 flex-col items-center gap-3 text-center">
      <PortraitArch name={nominee.name} imageId={nominee.imageId} />
      <div>
        <h3 className="font-(family-name:--font-display) text-[20px] font-semibold leading-tight tracking-tight text-[var(--text)]">
          {nominee.name}
        </h3>
        {nominee.category && (
          <p className="mt-1 font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {nominee.category}
          </p>
        )}
      </div>
      <RangoliDivider className="w-full" />
      <div
        className="bio-scroll relative min-h-0 w-full flex-1 overflow-y-auto px-1 text-left"
        tabIndex={0}
        role="region"
        aria-label={`${nominee.name} — biography, scrollable`}
      >
        <p className="font-(family-name:--font-body) text-[14px] leading-[1.65] text-[var(--text-muted)]">
          {nominee.summary}
        </p>
      </div>
      <Link
        href={`/profile/${nominee.slug}`}
        className="font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.14em] text-[var(--rose)] hover:underline"
      >
        Full profile
      </Link>
    </article>
  );
}
