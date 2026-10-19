import type { ReactNode } from 'react';
import { formatBio } from '@/lib/format-bio';

/**
 * A nominee's full biography laid out as an article: a larger lead paragraph, an even
 * paragraph rhythm, section titles, and real bulleted / numbered lists. Left-aligned
 * (ragged right) at a readable measure — justified text makes rivers in a narrow column.
 */
const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"')]+[^\s<>"').,;:!?])/gi;

function linkify(text: string): ReactNode[] {
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
    return (
      <a
        key={i}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-words font-medium text-[var(--rose-deep)] underline decoration-[var(--gold)] decoration-2 underline-offset-4 hover:text-[var(--magenta)]"
      >
        {part}
      </a>
    );
  });
}

export function BioText({ text }: { text: string }) {
  const blocks = formatBio(text);
  const leadAt = blocks.findIndex((b) => b.type === 'p');

  return (
    <div className="font-(family-name:--font-body) text-[16px] leading-[1.85] text-[var(--text-muted)] [overflow-wrap:anywhere]">
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <h2
              key={i}
              className="mt-10 mb-4 border-b border-[var(--gold)]/50 pb-2 font-(family-name:--font-display) text-[22px] font-semibold leading-snug tracking-[-0.01em] text-[var(--text)] first:mt-0"
            >
              {b.text}
            </h2>
          );
        }
        if (b.type === 'ul' || b.type === 'ol') {
          const List = b.type === 'ul' ? 'ul' : 'ol';
          return (
            <List
              key={i}
              className={
                'my-5 space-y-2.5 pl-6 marker:font-semibold marker:text-[var(--magenta)] ' +
                (b.type === 'ul' ? 'list-disc' : 'list-decimal')
              }
            >
              {b.items.map((it, k) => (
                <li key={k} className="pl-1.5">
                  {linkify(it)}
                </li>
              ))}
            </List>
          );
        }
        const lead = i === leadAt;
        return (
          <p
            key={i}
            className={
              lead
                ? 'mb-6 text-[18px] leading-[1.8] text-[var(--text)]'
                : 'mt-5 first:mt-0'
            }
          >
            {linkify(b.text)}
          </p>
        );
      })}
    </div>
  );
}
