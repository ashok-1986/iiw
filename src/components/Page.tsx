import { forwardRef } from 'react';
import type { FlipProfile } from '@/lib/flipbook-store';
import { ProfileCard } from './ProfileCard';

/**
 * One physical page of the book. react-pageflip needs a ref-forwarding element per
 * page. `number` is the printed folio: the front cover is page 1, so the first
 * content page is 2 (left) and pages then alternate left/right — even = left.
 * A page with no profiles is the blank leaf that keeps the page count even so the
 * back cover lands alone on its own leaf.
 */
export const Page = forwardRef<
  HTMLDivElement,
  { profiles: FlipProfile[]; number: number; phone: boolean }
>(function Page({ profiles, number, phone }, ref) {
  const side = phone ? '' : number % 2 === 0 ? 'fp-left' : 'fp-right';
  return (
    <div ref={ref} className={`fp fp-paper paper ${phone ? 'fp-phone' : side}`}>
      <div className="fp-in">
        {profiles.map((p, i) => (
          <PageEntry key={p.id} profile={p} divider={i > 0} />
        ))}
        <span className="fp-folio" aria-hidden="true">
          {profiles.length ? String(number).padStart(2, '0') : ''}
        </span>
      </div>
    </div>
  );
});

function PageEntry({ profile, divider }: { profile: FlipProfile; divider: boolean }) {
  return (
    <>
      {divider && <div className="fp-rule" aria-hidden="true" />}
      <ProfileCard nominee={profile} />
    </>
  );
}
