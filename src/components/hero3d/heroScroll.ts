/**
 * Tiny bridge between the Hero's pinned ScrollTrigger (GSAP, main bundle) and
 * the 3D scene (dynamically imported chunk). THREE-free on purpose so Hero.tsx
 * can import it without pulling three into the initial bundle.
 *
 * Hero.tsx writes `progress` (0..1 across the pin) from the scrub timeline's
 * onUpdate; SceneController reads it every frame and eases uTravel toward it —
 * one source of truth, so the headline phrases and the path are always synced.
 */
export const heroScroll = { progress: 0 };
