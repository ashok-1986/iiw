import Link from 'next/link';
import type { FlipProfile } from '@/lib/flipbook-store';
import { PortraitArch } from './PortraitArch';

/**
 * One profile on a book page. Everything is sized in `em` against the page's own
 * width (see .fp-in in globals.css), so the card scales with the page and can never
 * overflow it: the portrait plate sits beside the text on a desktop page and on top
 * of it on a phone page. The summary is the SHORT executive summary only, clamped
 * to a fixed number of lines — the long bio lives on /profile/[slug].
 */
export function ProfileCard({ nominee }: { nominee: FlipProfile }) {
  return (
    <article className="fp-card hoverable">
      <PortraitArch
        name={nominee.name}
        imageId={nominee.imageId}
        image={nominee.image}
        org={nominee.org}
        compiled={nominee.compiled}
        zoomable
        sizeClass="size-[10em] [.fp-phone_&]:size-[9.2em]"
        sizes="160px"
      />
      <div className="min-w-0">
        <h3 className="line-clamp-2">{nominee.name}</h3>
        {nominee.org && <span className="fp-org line-clamp-2">{nominee.org}</span>}
        <p className="fp-summary">{nominee.summary}</p>
        <Link href={`/profile/${nominee.slug}`} className="fp-btn press">
          Full profile
        </Link>
      </div>
    </article>
  );
}
