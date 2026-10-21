/**
 * Single origin for absolute URLs (metadataBase, OG images, sitemap, share links).
 * Resolves NEXT_PUBLIC_SITE_URL, Vercel system environment variables, or production domain,
 * falling back to localhost only in local development.
 */
function resolveOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://iiw-eutsav.vercel.app';
  }
  return 'http://localhost:3210';
}

export const SITE_URL = resolveOrigin().replace(/\/$/, '');

export const SITE_NAME = 'Inspiring Indian Women';

// No head-count here: the roster grows as the form keeps taking submissions, and
// every surface that shows a number (OG card, /about) reads it live from getNominees().
export const SITE_DESCRIPTION =
  'A digital heirloom celebrating extraordinary women leaders across community, enterprise, and social impact — curated editorial profiles, not a directory.';

export const COMPILED_PROFILE_NOTE = 'Compiled by IIW from public records.';

export const CONSENT_PROMISE =
  'Profiles are published in the nominee’s own words, with her consent. A few are compiled by IIW from public records and marked as such.';
