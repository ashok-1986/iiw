'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Mobile flipbook mode (PRD: one page visible on small screens, swipe to turn).
 * useSyncExternalStore over matchMedia — no effect-setState cascade, and the
 * server snapshot is `false` so the desktop two-page spread is what prerenders.
 */
export function useIsMobile(query = '(max-width: 767px)'): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
