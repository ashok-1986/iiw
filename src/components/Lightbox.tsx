"use client";

import { useEffect } from 'react';
import { useLightbox } from '@/lib/lightbox-store';
import { COMPILED_PROFILE_NOTE } from '@/lib/site';

/**
 * Portrait lightbox — the click-to-zoom trigger. A single instance mounted in the
 * layout; any PortraitArch with `zoomable` opens it via the store. Backdrop blur
 * signals dismissal, Esc and backdrop-click close it, and the panel scales from
 * 0.96 (never 0). Body scroll is locked while open.
 */
export function Lightbox() {
  const { item, close } = useLightbox();

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [item, close]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} — portrait`}
      onClick={close}
      className="lightbox-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-6"
    >
      <figure
        onClick={(e) => e.stopPropagation()}
        className="lightbox-panel flex w-full max-w-[440px] flex-col items-center"
      >
        <div className="relative w-full overflow-hidden rounded-[22px] border border-[var(--cream)]/50 bg-[var(--surface-2)] shadow-[0_44px_90px_-30px_rgb(var(--shadow-ink)/0.75)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- full-res zoom, not a layout image */}
          <img src={item.src} alt={item.name} className="h-auto w-full object-cover" />
        </div>
        <figcaption className="mt-5 text-center">
          <p className="font-(family-name:--font-display) text-[22px] font-semibold text-[var(--cream)]">
            {item.name}
          </p>
          {item.org && (
            <p className="mt-1.5 max-w-[42ch] font-(family-name:--font-ui) text-[12.5px] leading-snug text-[var(--peche)]">
              {item.org}
            </p>
          )}
          {item.compiled && (
            <p className="mt-2 font-(family-name:--font-ui) text-[11px] text-[var(--cream)]/60">
              {COMPILED_PROFILE_NOTE}
            </p>
          )}
        </figcaption>
      </figure>
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="press absolute right-5 top-5 grid size-10 cursor-pointer place-items-center rounded-full bg-[var(--surface-2)] text-[var(--plum)] shadow-[0_8px_24px_-8px_rgb(var(--shadow-ink)/0.6)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
