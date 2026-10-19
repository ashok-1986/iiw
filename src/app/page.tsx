import { Suspense } from 'react';
import { FlipBook } from '@/components/FlipBook';
import { SearchPill } from '@/components/SearchPill';
import { toFlipProfile } from '@/lib/flipbook-store';
import { getNominees } from '@/lib/sheets';

/**
 * Home = the book. Its hard front cover is the masthead, so there is no separate
 * hero above it. Data is cached with cacheLife('hours') (= ISR 3600s) and projected
 * through toFlipProfile so curator-only fields never cross into the client bundle.
 */
export default async function Home() {
  const { nominees } = await getNominees();
  const profiles = nominees.map(toFlipProfile);
  const categories = [...new Set(profiles.map((p) => p.category).filter(Boolean))].sort();

  return (
    <main id="archive" className="ground min-h-screen bg-[var(--surface)]">
      <section className="py-6 md:py-8">
        <div className="mx-auto mb-6 flex max-w-[1180px] flex-col items-center gap-3 px-4 text-center">
          <h1 className="max-w-2xl text-balance font-(family-name:--font-display) text-[26px] font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-[32px]">
            Inspiring Indian Women
          </h1>
          <Suspense>
            <SearchPill categories={categories} />
          </Suspense>
        </div>
        <FlipBook profiles={profiles} />
      </section>
    </main>
  );
}
