/**
 * All copy for the intro trailer. Edit the words here; no animation code needs to change.
 * The text is the client's own. The only edit is the space before the final "!" which is
 * attached ("UK!"). "100" is client copy and is deliberately not derived from the data.
 */
export const INTRO_COPY = {
  /** Heading, in reading order: line 1 words, the counted number, line 2 words, the year. */
  lead: ['IIW', 'Top'],
  number: 100,
  rest: ['impactful', 'British', 'Indian', 'Women'],
  year: '2026',
  credit: 'compiled by IIW Inspiring Indian Women UK!',
  hashtags: ['#10yrsiiw2026', '#Tenyearsiiw2026'],
  ui: { skip: 'Skip intro', enter: 'Enter the magazine' },
} as const;

/** The heading as one string, for the accessible name. */
export const INTRO_HEADING_TEXT = [
  ...INTRO_COPY.lead,
  String(INTRO_COPY.number),
  ...INTRO_COPY.rest,
  INTRO_COPY.year,
].join(' ');
