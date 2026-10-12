/** `Cache-Control` value for a successful, publicly cacheable answer that stays fresh for `ttlMs`. */
export function cacheControlFor(ttlMs: number): string {
  const seconds = Math.floor(ttlMs / 1000);
  return seconds > 0 ? `public, max-age=${seconds}` : 'no-store';
}
