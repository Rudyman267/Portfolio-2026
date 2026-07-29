/**
 * EXHIBIT SHIM — asset path resolution.
 *
 * The portfolio serves this build under `/verkos-demo/`, but local dev serves
 * it at `/`. Vite rewrites asset URLs it can see statically, but it does NOT
 * rewrite absolute paths that live inside JS strings (e.g. '/demo/foo.jpg' in
 * the demo scenario data). Every such path goes through here instead.
 *
 * IDEMPOTENT ON PURPOSE: some values pass through more than once — the demo
 * data resolves its URLs at module load, and the mock HTTP layer then hands
 * those same values back as API responses. Re-applying the base naively
 * produced `/verkos-demo/verkos-demo/demo/...` and broke every flight image.
 */
export function assetUrl(path: string): string {
  if (!path) return path;
  // Leave already-absolute / inline URLs alone.
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  if (!base) return path.startsWith('/') ? path : `/${path}`;

  // Already resolved against this base — hand it straight back.
  if (path === base || path.startsWith(`${base}/`)) return path;

  return `${base}/${path.replace(/^\/+/, '')}`;
}
