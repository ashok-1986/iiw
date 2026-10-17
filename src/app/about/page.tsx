import type { Metadata } from 'next';
import Link from 'next/link';
import { getNominees } from '@/lib/sheets';
import { RangoliDivider } from '@/components/RangoliDivider';
import { SITE_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About the archive',
  description:
    'How the Inspiring Indian Women flipbook is sourced, curated and consented — Google Sheet Final Directory, nomination form responses, and Drive portraits.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const { nominees, counts } = await getNominees();
  const withPortrait = nominees.filter((n) => n.imageId).length;
  const categories = Object.entries(
    nominees.reduce<Record<string, number>>((acc, n) => {
      acc[n.category] = (acc[n.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <div className="mx-auto max-w-[760px] px-4 py-16">
        <Link
          href="/#archive"
          className="font-(family-name:--font-ui) text-[12px] uppercase tracking-[0.12em] text-[var(--text-faint)] hover:text-[var(--rose-deep)]"
        >
          ← Back to the archive
        </Link>

        <header className="mt-8 text-center">
          <p className="font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.18em] text-[var(--rose-deep)]">
            About this archive
          </p>
          <h1 className="mt-3 font-(family-name:--font-display) text-[36px] font-semibold tracking-[-0.02em] text-[var(--text)]">
            Not a directory. A digital heirloom.
          </h1>
          <RangoliDivider />
          <p className="mx-auto mt-4 max-w-[560px] font-(family-name:--font-body) text-[15px] leading-[1.8] text-[var(--text-muted)]">
            {SITE_DESCRIPTION}
          </p>
        </header>

        <section className="mt-12">
          <h2 className="font-(family-name:--font-display) text-[22px] font-semibold text-[var(--text)]">
            How each profile is sourced
          </h2>
          <ol className="mt-4 space-y-4 font-(family-name:--font-body) text-[15px] leading-[1.8] text-[var(--text-muted)]">
            <li>
              <span className="font-(family-name:--font-display) font-semibold text-[var(--text)]">1 · Curation.</span>{' '}
              The Final Directory tab is the authoritative text. Where a woman appears there, that edited biography is
              published verbatim.
            </li>
            <li>
              <span className="font-(family-name:--font-display) font-semibold text-[var(--text)]">2 · Nominations.</span>{' '}
              Women who appear only in the nomination form tab are published from their own submitted text — the
              acknowledgement in that form is treated as consent to be listed.
            </li>
            <li>
              <span className="font-(family-name:--font-display) font-semibold text-[var(--text)]">3 · Portraits.</span>{' '}
              Photographs come from the original uploads in the nominations Drive folder, matched to a profile by name.
              Where no portrait exists, the lotus-and-initials mark is shown rather than a stock image.
            </li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-(family-name:--font-display) text-[22px] font-semibold text-[var(--text)]">
            Consent and corrections
          </h2>
          <p className="mt-4 font-(family-name:--font-body) text-[15px] leading-[1.8] text-[var(--text-muted)]">
            Personal contact details captured in the nomination form are never read into this site — the data layer binds
            columns by header name and explicitly excludes email, phone and address fields. Any honoured woman (or her
            family) can request an edit or removal through the IIW curation team, and the archive republishes within the
            hour.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-(family-name:--font-display) text-[22px] font-semibold text-[var(--text)]">
            The archive today
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { n: nominees.length, label: 'profiles' },
              { n: withPortrait, label: 'portraits' },
              { n: counts.finalDirectory, label: 'curated entries' },
              { n: categories.length, label: 'causes' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center"
              >
                <p className="font-(family-name:--font-display) text-[26px] font-semibold text-[var(--text)]">{s.n}</p>
                <p className="mt-1 font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 font-(family-name:--font-body) text-[14px] leading-[1.7] text-[var(--text-faint)]">
            Cause labels ({categories.map(([c, n]) => `${c} · ${n}`).join(', ')}) are derived from the biography text
            itself: the source sheet has no category column, so each profile is classified by the work it describes.
          </p>
        </section>

        <footer className="mt-14 border-t border-[var(--border)] pt-6 text-center">
          <p className="font-(family-name:--font-accent) text-[17px] italic text-[var(--rose-deep)]">
            “Where every page turn feels like unfolding a silk saree.”
          </p>
          <p className="mt-3 font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
            IIW Curation Team · built by Alchemetryx Consulting
          </p>
        </footer>
      </div>
    </main>
  );
}
