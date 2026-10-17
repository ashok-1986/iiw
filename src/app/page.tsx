import { Suspense } from 'react';
import { Cover } from '@/components/Cover';
import { FlipBook } from '@/components/FlipBook';
import { SearchPill } from '@/components/SearchPill';
import { toFlipProfile } from '@/lib/flipbook-store';
import { getNominees } from '@/lib/sheets';

/**
 * Home = cover + flipbook, per the PRD's "no index, direct storytelling" rule.
 * Data is cached with cacheLife('hours') (= ISR 3600s) and projected through
 * toFlipProfile so curator-only fields never cross into the client bundle.
 */
export default async function Home() {
  const { nominees } = await getNominees();
  const profiles = nominees.map(toFlipProfile);
  const categories = [...new Set(profiles.map((p) => p.category).filter(Boolean))].sort();

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <Cover />

      <section id="archive" className="scroll-mt-10 py-24 md:py-32">
        <div className="mx-auto mb-10 flex max-w-[1180px] flex-col items-center gap-6 px-4">
          <h2 className="max-w-2xl text-balance font-(family-name:--font-display) text-[32px] font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-[38px]">
            The Archive
          </h2>
          <Suspense>
            <SearchPill categories={categories} />
          </Suspense>
        </div>
        <FlipBook profiles={profiles} />
      </section>
    </main>
  );
}
