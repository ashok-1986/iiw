import { Suspense } from 'react';
import Link from 'next/link';
import { FlipBook } from '@/components/FlipBook';
import { IntroTrailer } from '@/components/IntroTrailer';
import { SearchPill } from '@/components/SearchPill';
import { toFlipProfile } from '@/lib/flipbook-store';
import { getNominees } from '@/lib/sheets';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { toJsonLd } from '@/lib/json-ld';

/**
 * Home = the book. Its hard front cover is the masthead, so there is no separate
 * hero above it. Data is cached with cacheLife('hours') (= ISR 3600s) and projected
 * through toFlipProfile so curator-only fields never cross into the client bundle.
 */
export default async function Home() {
  const { nominees } = await getNominees();
  const profiles = nominees.map(toFlipProfile);
  const categories = [...new Set(profiles.map((p) => p.category).filter(Boolean))].sort();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
      },
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/#collection`,
        url: `${SITE_URL}/`,
        name: `${SITE_NAME} — Top Impactful British Indian Women 2026`,
        description: SITE_DESCRIPTION,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: profiles.length,
          itemListElement: profiles.map((p, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Person',
              name: p.name,
              url: `${SITE_URL}/profile/${p.slug}`,
              jobTitle: p.org || undefined,
              description: p.summary,
              image: p.image
                ? `${SITE_URL}${p.image}`
                : p.imageId
                  ? `${SITE_URL}/api/image/${p.imageId}`
                  : undefined,
            },
          })),
        },
      },
    ],
  };

  return (
    <>
    <IntroTrailer />
    <main id="archive" tabIndex={-1} className="ground min-h-screen bg-[var(--surface)] outline-none">
      <section className="py-6 md:py-8">
        <div className="mx-auto mb-6 flex max-w-[1180px] flex-col items-center gap-3 px-4 text-center">
          <h1 className="max-w-2xl text-balance font-(family-name:--font-display) text-[26px] font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-[32px]">
            Inspiring Indian Women
          </h1>
        </div>
        <FlipBook
          profiles={profiles}
          chrome={
            <Suspense>
              <SearchPill categories={categories} />
            </Suspense>
          }
        />

        {/* Semantic, server-rendered directory: ensures crawlers and assistive technology discover all 97 profile links */}
        <nav aria-label="Directory of Honoured Profiles" className="sr-only">
          <h2>All {profiles.length} Honoured Profiles</h2>
          <ol>
            {profiles.map((p) => (
              <li key={p.id}>
                <article>
                  <h3>
                    <Link href={`/profile/${p.slug}`}>{p.name}</Link>
                  </h3>
                  {p.org && <p>{p.org}</p>}
                  {p.category && <p>Cause: {p.category}</p>}
                  <p>{p.summary}</p>
                </article>
              </li>
            ))}
          </ol>
        </nav>
      </section>
    </main>

    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
    />
    </>
  );
}
