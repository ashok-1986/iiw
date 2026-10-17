'use client';

import { useState } from 'react';
import { SITE_URL } from '@/lib/site';

/**
 * Share row for a profile deep link (PRD: "shareable deep links").
 * The absolute origin comes from NEXT_PUBLIC_SITE_URL (site.ts), never from
 * `window` — a window-based URL renders one thing on the server and another on the
 * client, which React reports as a hydration mismatch and never patches.
 */
export function ShareBar({ name, slug }: { name: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  const url = `${SITE_URL}/profile/${slug}`;
  const message = `${name} — Inspiring Indian Women, a digital heirloom`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const targets = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 font-(family-name:--font-ui) text-[12px] tracking-[0.08em] uppercase text-[var(--text)] transition-colors hover:bg-[var(--surface-3)]"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>

      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-[var(--rose)]/30 px-4 py-2 font-(family-name:--font-ui) text-[12px] tracking-[0.08em] uppercase text-[var(--rose)] transition-colors hover:bg-[var(--rose)]/10"
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
