import { forwardRef } from 'react';
import { LotusMark } from './LotusMark';

/**
 * Hard front and back covers of the book (react-pageflip: data-density="hard").
 * Page 1 of the volume is the front cover, so the book always opens on it. Sized in
 * `em` like the content pages (see .fp-in), so it scales with the book.
 */
export const BookCover = forwardRef<
  HTMLDivElement,
  { variant: 'front' | 'back'; count: number; phone: boolean }
>(function BookCover({ variant, count, phone }, ref) {
  const front = variant === 'front';
  return (
    <div ref={ref} data-density="hard" className={`fp fp-cover${phone ? ' fp-phone' : ''}`}>
      <div className="fp-cover-frame" aria-hidden="true" />
      <div className="fp-in">
        <div className="fp-medallion" aria-hidden="true">
          <LotusMark size={64} style={{ width: '62%', height: '62%' }} aria-hidden="true" role="presentation" />
        </div>
        {front ? (
          <>
            <p className="fp-masthead">A Digital Heirloom</p>
            <h2 className="fp-title foil">
              Inspiring
              <br />
              Indian Women
            </h2>
            <p className="fp-tag">{count} stories of courage, craft and community</p>
            <p className="fp-issue">Volume I · 2026</p>
          </>
        ) : (
          <>
            <p className="fp-masthead">Inspiring Indian Women</p>
            <p className="fp-tag">Every profile is published in the nominee&rsquo;s own words, with her consent.</p>
            <p className="fp-issue">Volume I · 2026</p>
          </>
        )}
      </div>
    </div>
  );
});
