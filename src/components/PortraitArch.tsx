'use client';

import Image from 'next/image';
import { getInitials } from '@/lib/nominee';
import { LotusMark } from './LotusMark';
import { useLightbox } from '@/lib/lightbox-store';

/**
 * Portrait plate: full-bleed circle, inner 4px cream ring + outer 1.5px rose
 * ring (PRD PortraitArch spec) over a soft shadow. Source = /api/image proxy;
 * a missing imageId shows the lotus + initials fallback. alt = name (WCAG rule).
 *
 * Size is a Tailwind class (`sizeClass`) rather than a pixel prop so one element
 * can be small on a phone and dominant on a desktop without a JS viewport hook —
 * that hook would render the desktop size first and shift layout on hydration.
 * `sizes` must stay in step with `sizeClass`, or next/image fetches a variant
 * larger than the plate can show. `priority` is only for the plate that *is* the
 * route's LCP element (the full-profile page); the book's four-up pages stay lazy.
 */
export function PortraitArch({
  name,
  imageId = null,
  image = null,
  org,
  zoomable = false,
  sizeClass = 'size-[88px]',
  sizes = '88px',
  priority = false,
}: {
  name: string;
  imageId?: string | null;
  image?: string | null;
  org?: string;
  zoomable?: boolean;
  sizeClass?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const { open } = useLightbox();
  const ring = {
    border: 'var(--portrait-ring-inner)',
    boxShadow: 'var(--portrait-ring-outer), var(--portrait-shadow)',
  };

  const src = image ?? (imageId ? `/api/image/${imageId}` : null);

  if (!src) {
    return (
      <div
        className={`portrait flex shrink-0 flex-col items-center justify-center rounded-full bg-[var(--surface-3)] ${sizeClass}`}
        style={ring}
        role="img"
        aria-label={`${name} — lotus fallback`}
      >
        <LotusMark className="h-auto w-[34%]" />
        <span className="font-(family-name:--font-display) text-[17px] font-semibold text-[var(--text-muted)]">
          {getInitials(name)}
        </span>
      </div>
    );
  }

  const cls = `portrait relative shrink-0 overflow-hidden rounded-full bg-[var(--surface-3)] ${sizeClass}`;
  const img = <Image src={src} alt={name} fill sizes={sizes} priority={priority} className="object-cover" />;

  if (zoomable) {
    return (
      <button
        type="button"
        aria-label={`View ${name}’s photo`}
        onClick={() => open({ src, name, org })}
        className={`${cls} cursor-zoom-in`}
        style={ring}
      >
        {img}
      </button>
    );
  }

  return (
    <div className={cls} style={ring}>
      {img}
    </div>
  );
}
