import { LotusMark } from '@/components/LotusMark';
import { PortraitArch } from '@/components/PortraitArch';
import { ProfileCard } from '@/components/ProfileCard';
import { RangoliDivider } from '@/components/RangoliDivider';
import { getNominees } from '@/lib/sheets';
import { toFlipProfile } from '@/lib/flipbook-store';
import type { Nominee } from '@/lib/nominee';

function toFlip(n: Nominee) {
  return toFlipProfile(n);
}

export const metadata = { robots: 'noindex' };

const SWATCHES = [
  ['--plum', 'Plum'],
  ['--rose', 'Rose'],
  ['--blush', 'Blush'],
  ['--gold', 'Gold'],
  ['--cream', 'Cream'],
  ['--surface', 'Surface'],
  ['--surface-2', 'Surface 2'],
  ['--surface-3', 'Surface 3'],
  ['--border', 'Border'],
  ['--text-muted', 'Ink muted'],
] as const;

/** Temporary design QA page — DELETE before ship (PRD M1 exit). */
export default async function DesignShowcase() {
  const { nominees } = await getNominees();
  const withPortrait = nominees.filter((n) => n.imageId);
  const withoutPortrait = nominees.filter((n) => !n.imageId);
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-6 py-12">
      <header>
        <p className="font-(family-name:--font-ui) text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          IIW Design System · Women-Centric Luxury
        </p>
        <h1 className="mt-2 font-(family-name:--font-display) text-4xl font-semibold">
          Sabyasachi <span className="font-(family-name:--font-accent) font-normal italic text-[var(--rose)]">× Vogue India</span>
        </h1>
        <p className="mt-2 font-(family-name:--font-body) text-[var(--text-muted)]">
          Dev QA sheet — remove <code>/dev</code> before ship. Data is MOCK (labeled).
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-(family-name:--font-display) text-xl">Tokens</h2>
        <div className="grid grid-cols-5 gap-2">
          {SWATCHES.map(([v, label]) => (
            <div key={v} className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="h-12" style={{ background: `var(${v})` }} />
              <div className="px-2 py-1.5 font-(family-name:--font-ui) text-[10px] text-[var(--text-faint)]">
                {label}
                <br />
                <span className="font-mono">{v}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-(family-name:--font-display) text-xl">Type stack</h2>
        <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
          <p className="font-(family-name:--font-display) text-3xl font-semibold">Display — Playfair 600 · cover, H1/H2</p>
          <p className="font-(family-name:--font-accent) text-2xl italic">Accent — Cormorant italic · quotes, highlights</p>
          <p className="font-(family-name:--font-body) text-[15px] leading-[1.8]">
            Body — Lora 400 · long-form editorial summaries, the reading voice of the archive.
          </p>
          <p className="font-(family-name:--font-ui) text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            UI — Inter · labels, chips, nav
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-(family-name:--font-display) text-xl">Motifs</h2>
        <div className="flex items-center gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6 text-[var(--rose)]">
          <LotusMark size={64} />
          <div className="flex-1">
            <RangoliDivider />
            <div className="hairline-gold mt-4" />
          </div>
          <div className="silk-overlay rounded-xl bg-[var(--surface-3)] px-6 py-4 font-(family-name:--font-ui) text-[11px] text-[var(--text-faint)]">
            silk overlay 4%
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-(family-name:--font-display) text-xl">PortraitArch — real proxy + fallbacks</h2>
        <div className="flex items-end gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
          <PortraitArch name={withPortrait[0]?.name ?? '—'} imageId={withPortrait[0]?.imageId ?? null} />
          <PortraitArch name={withPortrait[1]?.name ?? '—'} imageId={withPortrait[1]?.imageId ?? null} />
          <PortraitArch name={withoutPortrait[0]?.name ?? 'No Portrait'} imageId={null} />
          <div className="font-(family-name:--font-body) text-[13px] text-[var(--text-faint)]">
            {withPortrait.length} of {nominees.length} resolved from Drive ·
            unmatched render lotus + initials
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-(family-name:--font-display) text-xl">ProfileCard ×2 (a real physical page)</h2>
        <div className="grid grid-cols-2 gap-4">
          <ProfileCard nominee={toFlip(nominees[0])} />
          <ProfileCard nominee={toFlip(nominees[1])} />
        </div>
        <p className="mt-3 font-(family-name:--font-ui) text-[11px] text-[var(--text-faint)]">
          Real sheet data via /api/nominees merge · curator notes and emails stripped at the wire boundary
        </p>
      </section>
    </main>
  );
}
