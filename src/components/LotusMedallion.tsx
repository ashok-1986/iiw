'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LotusMark } from './LotusMark';

/**
 * The 3D lotus medallion, layered over the SVG mark that is already in the
 * server HTML. Three.js is imported inside the effect, after a short delay, so
 * neither the module nor a WebGL context competes with the hero's LCP paint;
 * reduced-motion and no-WebGL visitors simply keep the crisp SVG lotus.
 */
export function LotusMedallion({ size = 168 }: { size?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    const timer = window.setTimeout(async () => {
      try {
        const { mountLotusMedallion } = await import('@/lib/lotus-renderer');
        if (cancelled) return;
        dispose = await mountLotusMedallion(el, () => {
          if (!cancelled) setMounted(true);
        });
        if (cancelled) {
          dispose?.();
          dispose = undefined;
        }
      } catch {
        // No WebGL, or the artifact failed to load — the SVG mark stays.
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      dispose?.();
    };
  }, [reduced]);

  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden="true">
      <div
        className="absolute inset-0 grid place-items-center text-[var(--rose)]"
        style={{
          opacity: mounted ? 0 : 1,
          transition: reduced ? 'none' : 'opacity 500ms var(--ease-out-quint)',
        }}
      >
        <LotusMark size={Math.round(size * 0.64)} />
      </div>
      <div ref={host} className={mounted ? 'absolute inset-0 bloom-in' : 'absolute inset-0'} />
    </div>
  );
}
