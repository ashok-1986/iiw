import type { FlipProfile } from '@/lib/flipbook-store';
import { ProfileCard } from './ProfileCard';

/**
 * One physical page = 2 profiles (PRD flipbook rule), paper texture + silk overlay.
 * Bios are long (median ~935 chars) and are shown in full per the curation decision,
 * so the card body scrolls rather than clipping text.
 */
export function Page({ profiles, pageNumber }: { profiles: FlipProfile[]; pageNumber: number }) {
  return (
    <div className="arch-card silk-overlay relative flex h-full flex-1 flex-col gap-4 overflow-hidden p-5">
      {profiles.map((p) => (
        <ProfileCard key={p.id} nominee={p} />
      ))}
      {profiles.length === 1 && <div className="flex-1" aria-hidden="true" />}
      <span className="absolute bottom-3 right-5 font-(family-name:--font-ui) text-[10px] tracking-[0.14em] text-[var(--text-faint)]">
        {String(pageNumber).padStart(2, '0')}
      </span>
    </div>
  );
}
