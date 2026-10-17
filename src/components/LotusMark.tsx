import type { SVGProps } from 'react';

/** IIW 8-petal lotus motif (PRD design system). currentColor petals + gold core. */
export function LotusMark({ size = 40, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="IIW lotus motif"
      {...props}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={i}
          cx="32"
          cy="17"
          rx="5.5"
          ry="14"
          fill="currentColor"
          opacity={0.9}
          transform={`rotate(${i * 45} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="6" fill="var(--gold)" />
      <circle cx="32" cy="32" r="2.5" fill="var(--cream)" />
    </svg>
  );
}
