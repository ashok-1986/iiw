'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFlipbook } from '@/lib/flipbook-store';

/**
 * Search overlay pill (PRD: client-side Zustand, debounce 200ms, URL-synced ?q=&cat=).
 * Deliberately an overlay pill, not a directory sidebar — filters the book in place and
 * never renders a numbered index, per the editorial brief.
 */
export function SearchPill({ categories }: { categories: string[] }) {
  const { query, category, setQuery, setCategory, reset } = useFlipbook();
  const [text, setText] = useState(query);
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQuery(text);
      reset();
      const params = new URLSearchParams();
      if (text.trim()) params.set('q', text.trim());
      if (category) params.set('cat', category);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, category, setQuery, setCategory, reset, router, pathname]);

  // Derived, not stateful: the debounce window is the only "loading" state here,
  // and the pill's own hairline says so instead of a spinner.
  const pending = text.trim() !== query.trim();

  const onCategory = (c: string) => {
    const nextCategory = category === c ? null : c;
    setCategory(nextCategory);
    reset();
  };

  const chips = useMemo(() => categories.filter(Boolean).slice(0, 8), [categories]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        className={
          'lift flex w-full max-w-md items-center gap-2 rounded-full border bg-[var(--surface-2)] px-4 py-2.5 shadow-[0_10px_30px_-16px_rgb(var(--shadow-ink)/0.4)] transition-colors ' +
          (pending ? 'border-[var(--blush)]' : 'border-[var(--border)]')
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-[var(--rose-deep)]"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search a name, a city, a cause…"
          aria-label="Search profiles"
          className="w-full bg-transparent font-(family-name:--font-ui) text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText('')}
            aria-label="Clear search"
            className="press -mr-1 grid size-6 shrink-0 place-items-center rounded-full text-[var(--text-faint)] hover:text-[var(--text)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCategory(c)}
                aria-pressed={active}
                className={
                  'press cursor-pointer rounded-full border-2 px-3.5 py-1 pointer-coarse:min-h-11 pointer-coarse:px-4 font-(family-name:--font-ui) text-[11px] font-medium transition-colors duration-200 ' +
                  (active
                    ? 'border-[var(--peche)] bg-[var(--peche)] font-semibold text-[var(--plum)]'
                    : 'border-[var(--menthe)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--menthe)]/45')
                }
              >
                {c}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
