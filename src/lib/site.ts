/**
 * Single origin for absolute URLs (metadataBase, OG images, sitemap, share links).
 * Set NEXT_PUBLIC_SITE_URL in Vercel once the domain is decided (M5); the fallback
 * keeps local QA honest instead of emitting "undefined" into og:url.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3210').replace(/\/$/, '');

export const SITE_NAME = 'Inspiring Indian Women';

// No head-count here: the roster grows as the form keeps taking submissions, and
// every surface that shows a number (OG card, /about) reads it live from getNominees().
export const SITE_DESCRIPTION =
  'A digital heirloom celebrating extraordinary women leaders across community, enterprise, and social impact — curated editorial profiles, not a directory.';

export const COMPILED_PROFILE_NOTE = 'Compiled by IIW from public records.';

export const CONSENT_PROMISE =
  'Profiles are published in the nominee’s own words, with her consent. A few are compiled by IIW from public records and marked as such.';
