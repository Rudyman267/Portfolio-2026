"use client";

import { useSiteAudio } from "./AudioProvider";

/**
 * NOW PLAYING — the home page's music control.
 *
 * DESIGN INTENT (the brief left the design open, so here is the reasoning):
 * this site's chrome is quiet and typographic — thin white-on-near-black, wide
 * tracking, no boxes. A conventional media player with a card, a progress bar
 * and transport buttons would read as browser UI bolted onto the piece. So this
 * is just three things sitting in the corner: a waveform that MOVES while sound
 * is on, the track title, and the artist. The whole lockup is the button.
 *
 * The waveform IS the state indicator — no "playing/paused" label, no icon
 * swap-plus-text. Bars animating = you are hearing this. Bars collapsed to a
 * flat line with a slash through it = you are not. That reads at a glance and
 * needs no legend, which is what lets it live at 11px in a corner.
 *
 * Bars are CSS-animated (not GSAP) on purpose: it is a decorative idle loop with
 * no scroll or timeline coupling, so it belongs on the compositor where it costs
 * nothing and cannot be affected by a stalled gsap.ticker — the exact failure
 * mode that broke the loader hand-off on iOS (PROJECT_LOG §6).
 */

/** Per-bar height/delay pairs — irregular so it reads as audio, not a metronome. */
const BARS = [
  { h: 0.45, delay: "0ms", dur: "620ms" },
  { h: 0.9, delay: "120ms", dur: "480ms" },
  { h: 0.65, delay: "60ms", dur: "700ms" },
  { h: 1, delay: "200ms", dur: "540ms" },
  { h: 0.5, delay: "90ms", dur: "660ms" },
];

export function NowPlaying({
  /**
   * `compact` drops the title/artist and renders the waveform alone.
   *
   * Used in the site header, where it has to live next to the hamburger on a
   * phone: the track text would not fit, and the control cannot go INSIDE the
   * menu (a reader mid-scroll needs to reach it without opening a panel). The
   * waveform on its own still communicates on/off, which is the whole job here —
   * see the note above about it being the state indicator.
   */
  compact = false,
}: {
  compact?: boolean;
} = {}) {
  const { playing, toggle, track } = useSiteAudio();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={
        playing
          ? `Mute background music — ${track.title} by ${track.artist}`
          : `Play background music — ${track.title} by ${track.artist}`
      }
      style={{ touchAction: "manipulation" }}
      className={`group/np pointer-events-auto flex items-center rounded-full text-left transition-colors duration-300 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
        compact ? "justify-center p-1.5" : "gap-3 py-1.5 pl-1.5 pr-3"
      }`}
    >
      {/* ── THE WAVEFORM ──
          Motion = audio on. When off the bars sit at a flat baseline and a
          slash is drawn across them (the `waveform-slash` idea from the
          reference), so the off state is explicit rather than just "still". */}
      <span
        aria-hidden
        className="relative flex h-6 w-6 shrink-0 items-end justify-center gap-[2.5px]"
      >
        {BARS.map((b, i) => (
          <span
            key={i}
            // `bg-current`, not `bg-white`: this now also mounts in the site
            // header, which is a WHITE bar with black text on light routes. A
            // hardcoded white bar was invisible there. Inheriting `color` means
            // the waveform is legible on every surface it lands on.
            className={`w-[2px] rounded-full bg-current opacity-80 transition-[height,opacity] duration-500 ease-out ${
              playing ? "np-bar" : ""
            }`}
            style={{
              // ⚠️ OFF = THE SHAPE FREEZES, IT DOES NOT COLLAPSE.
              // The bars used to drop to a 2px dash when muted, which turned the
              // waveform into a row of dots with a line over it — the silhouette
              // that identifies the control vanished, so the muted state read as
              // "broken" rather than "paused". Now the bars KEEP their heights
              // and simply stop animating, and the slash is drawn across that
              // intact shape: a paused waveform, which is what muting actually
              // is. Dimming carries the state change instead of the geometry.
              height: `${Math.round(b.h * 18)}px`,
              opacity: playing ? 0.85 : 0.45,
              animationDelay: b.delay,
              animationDuration: b.dur,
            }}
          />
        ))}

        {/* THE SLASH — only when muted, drawn ACROSS the frozen bars (see the
            bar comment above: the shape stays, this cancels it).
            It carries a thin dark outline so it stays legible where it crosses
            a bar — without it the stroke and the bars are the same colour and
            the line disappears into them exactly where it needs to read most.

            The whole transform is written in ONE inline string (rotate AND the
            scale that hides it): mixing a Tailwind `scale-x-0` with an inline
            `transform` means the inline value wins outright and the class
            silently does nothing, so the slash would never hide. */}
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[26px] origin-center rounded-full bg-current transition-all duration-300"
          style={{
            transform: `translate(-50%,-50%) rotate(-45deg) scaleX(${playing ? 0 : 1})`,
            opacity: playing ? 0 : 1,
            boxShadow: playing ? "none" : "0 0 0 1.5px rgb(0 0 0 / 0.55)",
          }}
        />
      </span>

      {/* ── TRACK ── title over artist, tight leading so the pair reads as one
          block against the 24px waveform.
          Suppressed in `compact` (the header on a phone), where only the
          waveform fits. The button's aria-label still names the track, so
          nothing is lost for assistive tech. Colours are opacity-on-currentColor
          rather than white so this reads on the light header too. */}
      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span
            className={`truncate text-[13px] font-medium transition-opacity duration-300 ${
              playing ? "opacity-100" : "opacity-60"
            } group-hover/np:opacity-100`}
          >
            {track.title}
          </span>
          <span className="truncate text-[12px] opacity-45 transition-opacity duration-300 group-hover/np:opacity-70">
            {track.artist}
          </span>
        </span>
      )}
    </button>
  );
}
