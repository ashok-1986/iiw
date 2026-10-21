import { forwardRef } from 'react';

/**
 * Hard front and back covers of the book (react-pageflip: data-density="hard").
 * Each cover is one designed image with all of its text baked in (public/covers,
 * 2:3, masters in design-src/covers). The image is contain-fitted, never stretched
 * or cropped, and takes no pointer events so page-flip drag and corner-pull keep working.
 */
const BAKED_COUNT = 97; // the front image says "97 stories"; re-render it if the data changes

export const BookCover = forwardRef<
  HTMLDivElement,
  { variant: 'front' | 'back'; count: number; phone: boolean }
>(function BookCover({ variant, count, phone }, ref) {
  const front = variant === 'front';
  if (process.env.NODE_ENV !== 'production' && front && count !== BAKED_COUNT) {
    console.warn(`Front cover image says ${BAKED_COUNT} stories but data has ${count}. Re-render the cover.`);
  }
  const name = front ? 'cover-front' : 'cover-back';
  return (
    <div ref={ref} data-density="hard" className={`fp fp-cover fp-cover-art${phone ? ' fp-phone' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed art, already sized; the flip library needs a plain element */}
      <img
        src={`/covers/${name}.jpg`}
        srcSet={`/covers/${name}-sm.jpg 900w, /covers/${name}.jpg 1600w`}
        sizes="(max-width: 767px) 92vw, 45vw"
        alt={
          front
            ? `Inspiring Indian Women, Volume I 2026. A digital heirloom. ${count} stories of courage, craft and community.`
            : 'Back cover of Inspiring Indian Women. Lift. Support. Rise. Profiles are published in the nominee’s own words, with her consent. A few are compiled by IIW from public records and marked as such.'
        }
        width={1600}
        height={2400}
        draggable={false}
        decoding="async"
        // the back cover is display:none until the end of the book, so lazy would pop in late
        loading="eager"
        fetchPriority={front ? 'high' : 'low'}
        className="fp-cover-img"
      />
    </div>
  );
});
