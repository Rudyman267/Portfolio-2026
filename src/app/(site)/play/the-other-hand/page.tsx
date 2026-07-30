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
    <div
      data-header-dark
      className="hero-dark relative min-h-svh bg-[#050505] text-fg"
    >
      {/* back to the wall — the only chrome over the game */}
      <Link
        href={"/play" as Route}
        className="absolute left-[var(--gutter)] top-24 z-20 inline-flex items-center gap-2 text-[13px] font-medium text-white/45 transition-colors duration-300 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <ArrowLeft size={15} />
        Back to play
      </Link>

      <OtherHandGameMount />
    </div>
  );
}
