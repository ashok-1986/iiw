import type { Nominee } from '@/lib/nominee';
import { PortraitArch } from './PortraitArch';
import { RangoliDivider } from './RangoliDivider';

/**
 * Arch-top profile card — PRD component spec:
 * arch container, PortraitArch, name (Playfair 20px), org (Inter 11px uppercase),
 * summary Lora 14px, gold/rangoli divider.
 */
export function ProfileCard({ nominee }: { nominee: Nominee }) {
  return (
    <article className="arch-card silk-overlay flex flex-col items-center gap-3 px-5 py-6 text-center">
      <PortraitArch name={nominee.name} imageId={nominee.imageId} />
      <div>
        <h3 className="font-(family-name:--font-display) text-[20px] font-semibold tracking-tight text-[var(--text)]">
          {nominee.name}
        </h3>
        {/* Org/city are absent from the current sheet — render only when populated
            (see DATA-RECONCILIATION.md §1: no organization column exists). */}
        {(nominee.organization || nominee.city) && (
          <p className="mt-1 font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {[nominee.organization, nominee.city].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <RangoliDivider className="w-full" />
      <p className="font-(family-name:--font-body) text-[14px] leading-[1.65] text-[var(--text-muted)]">
        {nominee.summary}
      </p>
    </article>
  );
}
