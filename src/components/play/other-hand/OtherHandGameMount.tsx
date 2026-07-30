"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the game.
 *
 * The engine touches Web Audio, requestAnimationFrame, canvas and the Gamepad
 * API at module scope, so it must never run on the server — and `ssr: false`
 * in `next/dynamic` is illegal inside a Server Component (Next 16 hard-errors).
 * Same pattern as PageGlowMount.
 */
const OtherHandGame = dynamic(
  () => import("./OtherHandGame").then((m) => m.OtherHandGame),
  { ssr: false },
);

export function OtherHandGameMount() {
  return <OtherHandGame />;
}
