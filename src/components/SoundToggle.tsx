"use client";

import { useEffect } from 'react';
import { useSound } from '@/lib/use-sound';

/**
 * Page-sound control for the flipbook. Sound is off by default; this is the only
 * affordance that turns it on, so it never plays without the reader asking.
 */
export function SoundToggle() {
  const { muted, toggle, hydrate } = useSound();
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? 'Turn page sound on' : 'Turn page sound off'}
      title={muted ? 'Page sound off' : 'Page sound on'}
      className="press grid size-9 pointer-coarse:size-11 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-[var(--menthe)] bg-[var(--surface-2)] text-[var(--rose-deep)] hover:bg-[var(--menthe)]/40"
    >
      {muted ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 9v6h3.5L13 19V5L7.5 9H4z"
            fill="currentColor"
          />
          <path d="M17 9l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 9v6h3.5L13 19V5L7.5 9H4z" fill="currentColor" />
          <path
            d="M16.5 8.5a5 5 0 010 7M18.8 6a8 8 0 010 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
