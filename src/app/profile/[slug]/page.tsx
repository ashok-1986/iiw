import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getNominees } from '@/lib/sheets';
import { toFlipProfile } from '@/lib/flipbook-store';
import { BioText } from '@/components/BioText';
import { PortraitArch } from '@/components/PortraitArch';
import { RangoliDivider } from '@/components/RangoliDivider';
import { ShareBar } from '@/components/ShareBar';
import { SITE_URL } from '@/lib/site';

/**
 * /profile/[slug] — the full-profile route the PRD's deep-link journey requires.
 * Slug is computed with the SAME toFlipProfile projection the flipbook cards use,
 * so "Full profile" links can never drift from the routes this page serves.
 *
 * Next 16 cacheComponents + partialPrefetching: reading `params` and the cached
 * lookup happens inside <Suspense> so the route shell stays prefetchable and the
 * page streams instead of blocking (dev insight: instant-shell-url-data).
 */
async function findProfile(slug: string) {
  const { nominees } = await getNominees();
  return nominees.map(toFlipProfile).find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await findProfile(slug);
  if (!p) return { title: 'Profile not found' };
  const url = `/profile/${p.slug}`;
  return {
    // layout title.template appends "— Inspiring Indian Women"
    title: p.name,
    description: p.summary.slice(0, 155),
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      url,
      title: `${p.name} — Inspiring Indian Women`,
      description: p.summary.slice(0, 155),
    },
    twitter: { card: 'summary_large_image', title: p.name, description: p.summary.slice(0, 155) },
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <div className="mx-auto max-w-[720px] px-4 py-16">
        <Link
          href="/#archive"
          className="font-(family-name:--font-ui) text-[12px] uppercase tracking-[0.12em] text-[var(--text-faint)] hover:text-[var(--rose-deep)]"
        >
          ← Back to the archive
        </Link>
        {children}
      </div>
    </main>
  );
}

async function ProfileBody({ params }: { params: Promise<{ slug: string }> }) {
  // `params` is awaited *inside* the boundary so the shell never reads URL data.
  const { slug } = await params;
  const p = await findProfile(slug);
  if (!p) notFound();

  return (
    <>
      <div className="mt-8 flex flex-col items-center text-center">
        <PortraitArch
          imageId={p.imageId}
          image={p.image}
          name={p.name}
          org={p.org}
          zoomable
          sizeClass="size-[168px] sm:size-[212px]"
          sizes="(max-width: 639px) 168px, 212px"
          priority
        />
        <h1 className="mt-6 font-(family-name:--font-display) text-[32px] font-semibold tracking-[-0.02em] text-[var(--text)]">
          {p.name}
        </h1>
        {(p.org || p.category) && (
          <p className="mt-1 max-w-[46ch] font-(family-name:--font-ui) text-[12px] tracking-[0.04em] text-[var(--rose-deep)]">
            {p.org || p.category}
          </p>
        )}
        <RangoliDivider />
      </div>

      <article className="arch-card silk-overlay mt-8 px-6 py-8 sm:px-10 sm:py-10">
        <BioText text={p.fullText} />
      </article>

      <ShareBar name={p.name} slug={p.slug} />

      {/* Structured data for search/preview rich results — public fields only. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: p.name,
            description: p.summary,
            image: p.image ? `${SITE_URL}${p.image}` : p.imageId ? `${SITE_URL}/api/image/${p.imageId}` : undefined,
            url: `${SITE_URL}/profile/${p.slug}`,
            knowsAbout: p.category ? [p.category] : undefined,
          }),
        }}
      />
    </>
  );
}

export default function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Shell>
      <Suspense
        fallback={
          <div className="mt-8 space-y-4" aria-busy="true">
            <div className="mx-auto size-[168px] animate-pulse rounded-full bg-[var(--surface-3)] sm:size-[212px]" />
            <div className="mx-auto h-8 w-1/2 animate-pulse rounded-full bg-[var(--surface-3)]" />
            <div className="h-64 animate-pulse rounded-[24px] bg-[var(--surface-3)]" />
          </div>
        }
      >
        <ProfileBody params={params} />
      </Suspense>
    </Shell>
  );
}
