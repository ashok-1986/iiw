/**
 * Safely serialize data for application/ld+json script tags.
 * Escapes &, <, and > characters to protect against stored XSS and
 * premature script tag termination when rendering user-submitted content.
 */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}
