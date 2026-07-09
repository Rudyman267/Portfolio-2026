/**
 * Tiny coordination channel between <VideoBackground> and <Loader>.
 *
 * The loader's door should not unlock until the hero video has buffered enough
 * to play seamlessly — otherwise the reveal stutters while the video is still
 * loading. VideoBackground reports readiness here; Loader awaits it.
 *
 * Latched: if the video becomes ready before the loader subscribes, the
 * subscriber still fires immediately. Safe on the server (no window access).
 */

let ready = false;
const waiters = new Set<() => void>();

/** Called by VideoBackground once the video can play through (or is skipped). */
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
