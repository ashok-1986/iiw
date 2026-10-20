import Link from 'next/link';

/**
 * Site footer — the only global navigation besides the cover CTA.
 * /about must be reachable from every page for crawlers (it is in the sitemap too),
 * otherwise the methodology/consent page reads as an orphan.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <p className="font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
          IIW · Inspiring Indian Women
        </p>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="font-(family-name:--font-ui) text-[12px] text-[var(--text-muted)] hover:text-[var(--rose-deep)]"
          >
            The archive
          </Link>
          <Link
            href="/about"
            className="font-(family-name:--font-ui) text-[12px] text-[var(--text-muted)] hover:text-[var(--rose-deep)]"
          >
            About &amp; methodology
          </Link>
          {/* plain anchor on purpose: a full load replays the trailer and its boot script */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/?intro=1"
            className="font-(family-name:--font-ui) text-[12px] text-[var(--text-faint)] hover:text-[var(--rose-deep)]"
          >
            Replay intro
          </a>
        </nav>
      </div>
    </footer>
  );
}
