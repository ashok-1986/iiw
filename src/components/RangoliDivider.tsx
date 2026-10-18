/** Rangoli 3-dot + gold hairline divider (PRD motif spec). */
export function RangoliDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <span className="h-0.5 flex-1 rounded bg-gradient-to-r from-transparent to-[var(--peche)]" />
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[var(--lagune)]" />
        <span className="size-2 rounded-full bg-[var(--nectarine)]" />
        <span className="size-1.5 rounded-full bg-[var(--menthe)]" />
      </span>
      <span className="h-0.5 flex-1 rounded bg-gradient-to-l from-transparent to-[var(--peche)]" />
    </div>
  );
}
