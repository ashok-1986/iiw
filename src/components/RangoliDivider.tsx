/** Rangoli 3-dot + gold hairline divider (PRD motif spec). */
export function RangoliDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--gold)]/50" />
      <span className="flex items-center gap-1.5">
        <span className="size-1 rounded-full bg-[var(--rose)]" />
        <span className="size-1.5 rounded-full bg-[var(--gold)]" />
        <span className="size-1 rounded-full bg-[var(--rose)]" />
      </span>
      <span className="h-px flex-1 bg-[var(--gold)]/50" />
    </div>
  );
}
