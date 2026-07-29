/**
 * Tiny bridge between the Hero's pinned ScrollTrigger (GSAP, main bundle) and
 * the 3D scene (dynamically imported chunk). THREE-free on purpose so Hero.tsx
 * can import it without pulling three into the initial bundle.
 *
 * Hero.tsx writes `progress` from the scrub timeline's onUpdate (scaled so the
 * tunnel's world-units-per-scroll stays constant however long the pin grows);
 * SceneController reads it every frame and eases uTravel toward it — one
 * source of truth, so the headline phrases and the path are always synced.
 *
 * `travel` flows the OTHER way: SceneController writes the eased uTravel value
 * (scroll journey + idle drift) back here each frame, so DOM riders — the
 * works-journey project nodes — can bend along the exact same snake path the
 * shaders are rendering, idle sway included. Stays 0 when the 3D scene isn't
 * mounted (video fallback); consumers then just get the static curve.
 */
export const heroScroll = {
  progress: 0,
  travel: 0,
  /** true once the 3D scene is actually rendering frames (false on the video
   *  fallback) — the works ticker uses it to pick 3D-mesh vs DOM-skin flight. */
  sceneLive: false,
  /**
   * performance.now() of the last frame SceneController rendered.
   *
   * `sceneLive` alone is a LATCH — it only ever goes true — so if the WebGL
   * context is lost or the frameloop stalls (real iOS Safari does both under
   * memory pressure / Low Power Mode), consumers keep believing the 3D scene
   * is driving when nothing is being rendered. The works ticker then waits on
   * a morph that never advances and the project window never appears, which is
   * the "project cards are not visible" bug on iPhone.
   *
   * Consumers should treat the scene as live ONLY if this is recent
   * (see `sceneIsLive()`), never `sceneLive` on its own.
   */
  lastFrameAt: 0,
  /**
   * The active works-beat project node, in CAMERA space (x/y lateral world
   * units, z negative ahead) + its beat progress. Written each frame by the
   * works ticker (WorksJourney.ts); read by WorksProjectNode inside the Canvas,
   * which renders the REAL energy-cuboid at exactly this spot. Because the mesh
   * is a camera child and the DOM overlay projects with the same fov, the two
   * layers stay aligned by construction.
   */
  worksNode: { on: false, x: 0, y: 0, z: -10, p: 0, m: 0 },
};

/** How stale the last rendered frame may be before we stop trusting the scene.
 *  Generous — a slow phone can legitimately drop to a few fps — but far short
 *  of the multi-second stall that means the context is gone. */
const SCENE_STALE_MS = 900;

/**
 * Is the 3D scene ACTUALLY rendering right now?
 *
 * Use this instead of reading `sceneLive` directly. It requires both that the
 * scene once started AND that it painted a frame recently, so a lost WebGL
 * context or a stalled frameloop correctly reports false and DOM fallbacks
 * take over rather than waiting forever on a mesh that will never draw.
 */
export function sceneIsLive() {
  return (
    heroScroll.sceneLive &&
    typeof performance !== "undefined" &&
    performance.now() - heroScroll.lastFrameAt < SCENE_STALE_MS
  );
}
