import Image from 'next/image';
import { getInitials } from '@/lib/nominee';
import { LotusMark } from './LotusMark';

/**
 * Circular portrait, 88px, double border: inner 4px cream + outer 1.5px rose
 * (PRD PortraitArch spec). Source = /api/image proxy; missing imageId shows
 * lotus + initials fallback. alt = name (WCAG rule).
 */
export function PortraitArch({
  name,
  imageId,
  size = 88,
}: {
  name: string;
  imageId: string | null;
  size?: number;
}) {
  const ring = {
    width: size,
    height: size,
    border: '4px solid var(--cream)',
    boxShadow: '0 0 0 1.5px var(--rose), 0 6px 16px -6px rgb(45 27 45 / 0.35)',
  };

  if (!imageId) {
    return (
      <div
        className="flex shrink-0 flex-col items-center justify-center rounded-full bg-[var(--surface-3)]"
        style={ring}
        role="img"
        aria-label={`${name} — lotus fallback`}
      >
        <LotusMark size={size * 0.34} className="text-[var(--blush)]" />
        <span
          className="font-(family-name:--font-display) font-semibold text-[var(--text-muted)]"
          style={{ fontSize: size * 0.2 }}
        >
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative shrink-0 overflow-hidden rounded-full bg-[var(--surface-3)]" style={ring}>
      <Image
        src={`/api/image/${imageId}`}
        alt={name}
        width={size - 8}
        height={size - 8}
        className="size-full object-cover"
      />
    </div>
  );
}
