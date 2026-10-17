/**
 * Single origin for absolute URLs (metadataBase, OG images, sitemap, share links).
 * Set NEXT_PUBLIC_SITE_URL in Vercel once the domain is decided (M5); the fallback
 * keeps local QA honest instead of emitting "undefined" into og:url.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3210').replace(/\/$/, '');

export const SITE_NAME = 'Inspiring Indian Women';

export const SITE_DESCRIPTION =
  'A digital heirloom celebrating 87 extraordinary women leaders across community, enterprise, and social impact — curated editorial profiles, not a directory.';
