import type { FlipProfile } from '@/lib/flipbook-store';
import { ProfileCard } from './ProfileCard';

/**
 * One physical page = 2 profiles on desktop, 1 on a phone (PRD flipbook rule,
 * read at the size the plate needs). Paper texture + silk overlay.
 * Bios are long (median ~935 chars) and are shown in full per the curation decision,
 * so the card body scrolls rather than clipping text.
 *
 * `solo` marks the one-per-page layout: the half-page balancer used when a desktop
 * page ends up with a single profile would steal height from the only card here.
 */
export function Page({
  profiles,
  pageNumber,
  stagger = false,
  solo = false,
  side = 'solo',
}: {
  profiles: FlipProfile[];
  pageNumber: number;
  stagger?: boolean;
  solo?: boolean;
  /** Which half of the open book this is; drives the spine-aware corners and gutter shade. */
  side?: 'left' | 'right' | 'solo';
}) {
  return (
    <div
      className={
        'arch-card silk-overlay page-card relative flex h-full flex-1 flex-col gap-4 overflow-hidden p-5 ' +
        (side === 'left' ? 'page-left' : side === 'right' ? 'page-right' : '')
      }
    >
      {side !== 'solo' && (
        <span
          aria-hidden="true"
          className={'page-gutter ' + (side === 'left' ? 'page-gutter-left' : 'page-gutter-right')}
        />
      )}
      {profiles.map((p, i) => (
        <ProfileCard key={p.id} nominee={p} delay={stagger ? 80 + i * 80 : 0} />
      ))}
      {!solo && profiles.length === 1 && <div className="flex-1" aria-hidden="true" />}
      <span className="absolute bottom-3 right-5 font-(family-name:--font-ui) text-[10px] tracking-[0.14em] text-[var(--text-faint)]">
        {String(pageNumber).padStart(2, '0')}
      </span>
    </div>
  );
}
