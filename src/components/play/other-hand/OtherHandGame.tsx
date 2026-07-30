"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { ConnectionState } from "./ConnectionState";
import { Visualizer } from "./Visualizer";
import type { SimulationState } from "./types";

/**
 * THE OTHER HAND — playable in-page.
 *
 * WHAT IT IS (the author's framing — keep the copy faithful to this):
 * a spiritual digital experience about consciousness searching for meaning and
 * direction — the invisible guiding hand — and about how creation only happens
 * when something PUSHES an idea, because entropy is always pulling the other
 * way. It is not a "spooky presence" toy; earlier copy read it that way and
 * undersold it.
 *
 * Ported from the standalone Vite app in `the-other-hand project/` (kept out of
 * this repo — it is a separate app). The engine files next to this one are
 * copied verbatim apart from flattened import paths; ALL the portfolio-specific
 * shell lives here so re-syncing the engine stays a straight file copy.
 *
 * Two things worth knowing before touching this:
 *  • The AI is entirely LOCAL (OtherHandAI.ts). The original README mentions a
 *    GEMINI_API_KEY, but it is only wired into the old vite.config define and
 *    never read at runtime — the game needs no key and makes no network calls.
 *  • Input works with pointer/mouse AND gamepad (BallController.ts). A gamepad
 *    is the intended instrument but not required, which is what makes it
 *    playable on the site at all.
 *
 * Shell adds, per the brief: a full-viewport stage, an intro note + explicit
 * START gate (audio cannot begin without a user gesture anyway — browsers
 * require it), and the volume controls the original already had.
 */

type Phase = "intro" | "playing";

export function OtherHandGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [volume, setVolume] = useState(80);
  const [fullscreen, setFullscreen] = useState(false);

  const loopRef = useRef<number>(0);
  const gameRef = useRef<ConnectionState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);

  // Boot the engine ONLY once the player has pressed start. Mounting it behind
  // the intro would run the rAF loop (and the audio graph) while nobody is
  // looking, and on this site the page also carries a particle field.
  useEffect(() => {
    if (phase !== "playing") return;

    const game = new ConnectionState((text) => {
      setOverlayText(text);
      setShowOverlay(!!text);
    });
    game.setVolume(volume / 100);
    gameRef.current = game;
    // The start click IS the user gesture, so the audio context can resume.
    game.resumeAudio();

    const loop = () => {
      const state = game.tick();
      setSimState({ ...state });
      loopRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(loopRef.current);
      gameRef.current = null;
    };
    // volume is applied via its own effect; re-running here would restart the game
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    gameRef.current?.setVolume(volume / 100);
  }, [volume]);

  // Feed the disc's REAL viewport geometry to the input controller. The engine
  // originally assumed a fixed 360px disc at the window centre; here it is
  // responsive and sits above the caption + volume bar, so on a phone the hit
  // zone would otherwise be nowhere near the disc. Re-measured on resize and
  // on scroll, since the rect is viewport-relative.
  useEffect(() => {
    if (phase !== "playing") return;
    const measure = () => {
      const el = discRef.current;
      const game = gameRef.current;
      if (!el || !game) return;
      const r = el.getBoundingClientRect();
      game.setInputBounds(r.left + r.width / 2, r.top + r.height / 2, r.width / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (discRef.current) ro.observe(discRef.current);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [phase]);

  // keep our button state in step with the real fullscreen state (Esc, etc.)
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      // iOS Safari has no Element.requestFullscreen — fall back silently and
      // leave the in-page stage as-is rather than throwing.
      void el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative flex min-h-svh w-full select-none flex-col items-center justify-center gap-8 overflow-hidden bg-[#050505]"
      onPointerDown={() => gameRef.current?.resumeAudio()}
    >
      {phase === "intro" ? (
        <IntroCard onStart={() => setPhase("playing")} />
      ) : (
        <>
          {/* the device — a black disc the presence lives inside.
              touchAction:none is required: without it a drag inside the disc
              scrolls the page instead of reaching the sim, and iOS also fires
              pointercancel mid-gesture. */}
          <div
            ref={discRef}
            style={{ touchAction: "none" }}
            className="relative flex h-[min(360px,74vw)] w-[min(360px,74vw)] cursor-crosshair items-center justify-center overflow-hidden rounded-full border-4 border-[#1a1a1a] bg-black shadow-[0_0_50px_rgba(20,20,20,0.5)]"
          >
            {simState && <Visualizer simState={simState} />}

            <div
              className={`pointer-events-none absolute text-2xl tracking-[0.2em] text-white transition-opacity duration-1000 ease-in-out ${
                showOverlay ? "opacity-80" : "opacity-0"
              }`}
            >
              {overlayText}
            </div>

            {!simState?.playerIntent.force &&
              !simState?.aiState &&
              !simState?.isAscended &&
              !simState?.helloActive && (
                <div className="absolute animate-pulse text-xs tracking-widest text-white/20">
                  WAITING FOR SIGNAL
                </div>
              )}
          </div>

          <p className="px-6 text-center text-[12px] tracking-[0.18em] text-white/25">
            DRAG INSIDE THE DISC — MOUSE, FINGER, OR A GAMEPAD STICK
          </p>

          {/* volume + fullscreen */}
          <div className="z-10 flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md transition-all duration-300 hover:border-white/20">
            <button
              type="button"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
              onClick={(e) => {
                e.stopPropagation();
                setVolume(volume > 0 ? 0 : 80);
                gameRef.current?.resumeAudio();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-white/40 transition-colors hover:text-white/80 focus:outline-none"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              aria-label="Volume"
              onChange={(e) => {
                setVolume(parseInt(e.target.value, 10));
                gameRef.current?.resumeAudio();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="h-1 w-24 cursor-pointer appearance-none rounded-lg bg-white/10 accent-white/80 hover:accent-white focus:outline-none"
            />

            <span className="w-6 text-right font-mono text-[10px] tracking-wider text-white/30">
              {volume}%
            </span>

            <span className="mx-1 h-4 w-px bg-white/10" aria-hidden />

            <button
              type="button"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-white/40 transition-colors hover:text-white/80 focus:outline-none"
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** The intro note + start gate. Also the user gesture that unlocks audio. */
function IntroCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-[46ch] px-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/35">
        A digital meditation
      </p>
      <h1
        className="mt-5 text-[clamp(2.25rem,8vw,4rem)] uppercase leading-[0.95] tracking-[0.01em] text-white"
        style={{ fontFamily: "var(--font-display-tanker)" }}
      >
        The Other Hand
      </h1>

      <p className="mt-6 text-[15px] leading-relaxed text-white/60">
        Consciousness reaching for meaning, and for a direction to create in.
        Something moves alongside you here — the invisible guiding hand. You
        cannot see it, only feel it answer.
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-white/60">
        Entropy always pulls toward dissolution. Nothing is made unless
        something pushes. Hold the sync long enough and the shape and the sound
        begin to evolve — scattered particles drawing together into something
        with a gravity of its own.
      </p>

      {/* How to play — plain and short. The piece has no score and no fail
          state, so the only thing a newcomer actually needs is "here is how you
          touch it, and here is what to expect back". */}
      <div className="mx-auto mt-10 max-w-[36ch] text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
          How to play
        </p>
        <ul className="mt-4 space-y-2.5">
          {[
            ["Move", "Press and drag inside the disc — with a finger on touch, or the mouse. A gamepad stick works too; that is what it was built for."],
            ["Hold", "Stay in sync to hold a shape. Break it and entropy takes it back."],
            ["Listen", "Sound is half the piece. Use the volume slider below the disc."],
            ["Evolve", "The longer you sustain it, the further the shape and the sound go. There is somewhere to reach."],
          ].map(([k, v]) => (
            <li key={k} className="flex gap-3 text-[13px] leading-relaxed">
              <span className="w-[52px] shrink-0 pt-px text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                {k}
              </span>
              <span className="text-white/55">{v}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="group mt-10 inline-flex items-center gap-3 rounded-full border border-white/25 px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.22em] text-white/85 transition-all duration-300 hover:border-white/60 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        Begin
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </button>
    </div>
  );
}
