import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OtherHandGameMount } from "@/components/play/other-hand/OtherHandGameMount";

export const metadata: Metadata = {
  title: "The Other Hand",
  description:
    "A spiritual digital experience about consciousness searching for meaning and direction, and how creation resists entropy. Playable in the browser.",
};

export default function TheOtherHandPage() {
  return (
    // The game owns the whole viewport and paints its own near-black, so this
    // page deliberately does NOT run the particle field — two competing
    // atmospheres would fight, and the game's audio-reactive visuals are the
    // point. `hero-dark` still rescopes the tokens for the back link.
    // `flex flex-col` + an IN-FLOW back link (not absolute). The link used to be
    // `absolute top-24`, so it sat outside the flow and the game content — which
    // is centred in its own min-h-svh box — ran straight underneath it. On a
    // phone that put the intro copy directly on top of the words "Back to play".
    // `h-svh` (a FIXED height), not `min-h-svh`. With min-height the stage's
    // `flex-1` was free to grow past the viewport, so `overflow-y-auto` on it
    // never engaged and the Begin button sat ~35px below the fold with no way to
    // reach it. Pinning the page to the viewport is what makes the stage a real
    // scroll container.
    <div
      data-header-dark
      className="hero-dark relative flex h-svh flex-col overflow-hidden bg-[#050505] text-fg"
    >
      {/* back to the wall — the only chrome over the game. `pt-20 sm:pt-24`
          clears the fixed site header; being in flow means the game starts
          BELOW it instead of colliding with it. */}
      <Link
        href={"/play" as Route}
        className="z-20 inline-flex shrink-0 items-center gap-2 self-start px-[var(--gutter)] pb-2 pt-20 text-[13px] font-medium text-white/45 transition-colors duration-300 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:pt-24"
      >
        <ArrowLeft size={15} />
        Back to play
      </Link>

      <OtherHandGameMount />
    </div>
  );
}
