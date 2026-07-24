/**
 * Tiny coordination channel between the hero background and <Loader>.
 *
 * The loader's door should not unlock until the hero background is ready to
 * paint — otherwise the reveal opens onto a blank frame. HeroCanvas reports
 * readiness here (the 3D scene once it mounts, or the dark fallback
 * immediately); Loader awaits it. Name kept for continuity — it predates the
 * video fallback being removed.
 *
 * Latched: if the background becomes ready before the loader subscribes, the
 * subscriber still fires immediately. Safe on the server (no window access).
 */

let ready = false;
const waiters = new Set<() => void>();

/** Called by HeroCanvas once the background is ready (or skipped). */
export function markHeroVideoReady() {
  if (ready) return;
  ready = true;
  waiters.forEach((fn) => fn());
  waiters.clear();
}

/** Resolve when the hero video is ready (or immediately if already ready). */
export function whenHeroVideoReady(): Promise<void> {
  if (ready) return Promise.resolve();
  return new Promise((resolve) => waiters.add(resolve));
}

export function isHeroVideoReady() {
  return ready;
}
