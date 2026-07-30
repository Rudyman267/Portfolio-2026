"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Site background music — a single <audio> element owned by one provider.
 *
 * WHY A PROVIDER AND NOT A HOOK PER COMPONENT:
 * the intro loader decides whether sound starts ("Enter with sound" /
 * "Enter without sound") and the home-page NowPlaying widget has to reflect and
 * control that same decision. Two independent <audio> tags would double the
 * track; a provider means there is exactly one element, mounted in the site
 * layout, and both consumers talk to it.
 *
 * ⚠️ AUTOPLAY: browsers refuse `play()` without a user gesture. The loader's
 * button click IS that gesture, which is the whole reason the choice lives
 * there rather than on a floating control the reader might never touch. If
 * play() is still rejected (Low Power Mode, a strict autoplay policy) we do NOT
 * pretend it is playing — `blocked` goes true and the widget shows the muted
 * state, so a click there can retry from a fresh gesture.
 *
 * The preference is remembered in sessionStorage, not localStorage: music that
 * silently resumes on a page the reader opened days later is startling.
 * Deliberate — don't "upgrade" it to localStorage.
 */

/** Track metadata — shown by the NowPlaying widget. From the file's ID3 tags. */
export const TRACK = {
  title: "Friendship",
  artist: "wooll",
  /** re-encoded 320k→128k for the web; opus first, mp3 fallback */
  sources: [
    { src: "/audio/friendship-wooll.webm", type: "audio/webm" },
    { src: "/audio/friendship-wooll.mp3", type: "audio/mpeg" },
  ],
} as const;

/** Default level. Ambient bed under a portfolio — it should never dominate. */
const DEFAULT_VOLUME = 0.5;

const STORAGE_KEY = "rudyman:audio-pref";

type AudioContextValue = {
  /** is the track actually audible right now */
  playing: boolean;
  /** the browser refused playback — the UI must offer a retry */
  blocked: boolean;
  /** 0..1 */
  volume: number;
  setVolume: (v: number) => void;
  /** toggle from a user gesture */
  toggle: () => void;
  /** start playing (loader's "Enter with sound") */
  enable: () => void;
  /** explicitly stay silent (loader's "Enter without sound") */
  disable: () => void;
  /**
   * Duck an already-playing track to silence WITHOUT changing the reader's
   * preference or reporting `playing: false`. Used while the home intro is on
   * screen: on a reload the music has resumed from sessionStorage, and hearing
   * it behind the front door — while being asked to choose sound — is odd.
   * Returns silently if nothing is playing.
   */
  duck: () => void;
  /** Undo `duck()` — fade back to the reader's volume. */
  unduck: () => void;
  track: typeof TRACK;
};

const AudioCtx = createContext<AudioContextValue | null>(null);

export function useSiteAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx)
    throw new Error("useSiteAudio must be used inside <AudioProvider>");
  return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);

  /** Create the element once, imperatively — no JSX <audio> to re-render. */
  const getEl = useCallback(() => {
    if (elRef.current) return elRef.current;
    if (typeof document === "undefined") return null;
    const el = document.createElement("audio");
    el.loop = true;
    el.preload = "auto";
    el.volume = DEFAULT_VOLUME;
    // `playsInline` matters on iOS — without it Safari can hand the track to
    // the fullscreen native player.
    el.setAttribute("playsinline", "");
    TRACK.sources.forEach(({ src, type }) => {
      const s = document.createElement("source");
      s.src = src;
      s.type = type;
      el.appendChild(s);
    });
    // Keep React state honest about what the element is really doing — the
    // browser can pause us (interruption, focus loss, route audio conflict) and
    // the widget must not keep showing an animated waveform over silence.
    el.addEventListener("play", () => {
      setPlaying(true);
      setBlocked(false);
    });
    el.addEventListener("pause", () => setPlaying(false));
    el.addEventListener("ended", () => setPlaying(false));
    document.body.appendChild(el);
    elRef.current = el;
    return el;
  }, []);

  const enable = useCallback(() => {
    const el = getEl();
    if (!el) return;
    el.volume = volume;
    void el
      .play()
      .then(() => {
        setBlocked(false);
        try {
          sessionStorage.setItem(STORAGE_KEY, "on");
        } catch {
          /* private mode — fine, just don't remember */
        }
      })
      .catch(() => {
        // Refused. Record it so the widget shows "off" and can retry, rather
        // than lying about a playing track.
        setBlocked(true);
        setPlaying(false);
      });
  }, [getEl, volume]);

  const disable = useCallback(() => {
    elRef.current?.pause();
    setPlaying(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "off");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    if (playing) disable();
    else enable();
  }, [playing, disable, enable]);

  // ── DUCKING (intro only) ───────────────────────────────────────────────────
  // A plain rAF volume ramp on the media element. Deliberately NOT a GSAP tween:
  // this must keep working when the gsap ticker stalls (the iOS hand-off failure
  // in PROJECT_LOG §6), and it touches only `volume`, so it can never collide
  // with the transforms GSAP owns on the loader.
  //
  // `volume` is the reader's LEVEL and is untouched here; ducking only moves the
  // element. `playing` is untouched too — the track genuinely is still playing,
  // just inaudible, so the waveform keeps telling the truth.
  const duckRafRef = useRef<number | null>(null);
  const fadeTo = useCallback((target: number, ms: number) => {
    const el = elRef.current;
    if (!el || el.paused) return;
    if (duckRafRef.current) cancelAnimationFrame(duckRafRef.current);
    const from = el.volume;
    const delta = target - from;
    if (Math.abs(delta) < 0.001) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      // easeInOutSine — no audible "corner" at either end of the ramp
      const e = 0.5 - Math.cos(p * Math.PI) / 2;
      el.volume = Math.min(1, Math.max(0, from + delta * e));
      if (p < 1) duckRafRef.current = requestAnimationFrame(step);
      else duckRafRef.current = null;
    };
    duckRafRef.current = requestAnimationFrame(step);
  }, []);

  const duck = useCallback(() => fadeTo(0, 420), [fadeTo]);
  /**
   * ⚠️ Restores the level even when the element is PAUSED, which `fadeTo`
   * deliberately refuses to do (there is nothing to hear, so no ramp).
   * "Enter without sound" pauses the track and then unducks: without this
   * branch the element would sit at volume 0 forever, and a later un-mute from
   * the NowPlaying widget would come back SILENT — playing, but inaudible, with
   * the waveform animating over nothing.
   */
  const unduck = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    if (el.paused) {
      if (duckRafRef.current) cancelAnimationFrame(duckRafRef.current);
      duckRafRef.current = null;
      el.volume = volume;
      return;
    }
    fadeTo(volume, 700);
  }, [fadeTo, volume]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    if (elRef.current) elRef.current.volume = clamped;
    // A manual volume change means the reader is in control now — drop any duck
    // still in flight so it cannot stomp the value they just set.
    if (duckRafRef.current) cancelAnimationFrame(duckRafRef.current);
    duckRafRef.current = null;
  }, []);

  useEffect(
    () => () => {
      if (duckRafRef.current) cancelAnimationFrame(duckRafRef.current);
    },
    [],
  );

  // ── RESUME ACROSS NAVIGATION ──────────────────────────────────────────────
  // ⚠️ EVERY IN-APP NAVIGATION IS A REAL PAGE LOAD (see routeTransitionBridge:
  // hardNavigate does window.location.assign, deliberately, because SPA nav was
  // unfixably racy with Lenis/ScrollTrigger pins). That tears down this provider
  // AND the <audio> element with it, so the track always died on a page change
  // and every route started silent.
  //
  // The preference was already being WRITTEN to sessionStorage here — it was
  // simply never READ back, so it could not survive the very thing it was for.
  // On mount: if the reader had sound on, start it again.
  //
  // Why this is allowed to autoplay: the browser's gesture requirement is
  // satisfied for the SESSION by the original click on "Enter with sound" at the
  // front door. Chrome/Safari carry that within a same-origin navigation chain,
  // so this resume is not a cold autoplay attempt. If a browser still refuses,
  // `blocked` goes true and the widget honestly shows the muted state with a
  // one-click retry — we never pretend to be playing.
  //
  // Still sessionStorage, NOT localStorage: music must not silently resume on a
  // page opened days later. That remains deliberate (see the header note).
  useEffect(() => {
    let pref: string | null = null;
    try {
      pref = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      /* private mode — nothing remembered, stay silent */
    }
    if (pref !== "on") return;
    const el = getEl();
    if (!el) return;
    // ⚠️ START SILENT IF THE INTRO IS ON SCREEN, THEN RAMP UP.
    // Effect ORDER is the trap here: React runs CHILD effects before PARENT
    // ones, so the Loader's `duck()` fires before this provider effect has even
    // created the <audio> element — `fadeTo` finds `elRef.current === null`,
    // returns, and the track then starts here at FULL volume behind the intro.
    // (Measured exactly that: vol 0.5 with the gate up.)
    // So the resume path decides its own starting level instead of depending on
    // a duck that may already have been thrown away.
    //
    // ⚠️ THE TEST IS "IS THE SOUND GATE SHOWING", NOT "IS A LOADER SHOWING".
    // `body.is-loading` was the obvious check and it is WRONG: the loader also
    // runs in nav mode as a pan-flip curtain over every page change, where there
    // are no buttons and therefore nothing to ever unduck. Using it started the
    // track at volume 0 on every navigation and left it there — silent music,
    // i.e. the exact bug this session set out to fix (measured: /play vol 0).
    // `data-sound-gate` is set on <html> during render by the Loader ONLY on the
    // path that actually renders the two choice buttons.
    const gateUp = document.documentElement.hasAttribute("data-sound-gate");
    el.volume = gateUp ? 0 : volume;
    void el.play().catch(() => {
      // Refused (strict autoplay policy / Low Power Mode). Don't lie about it —
      // the widget shows muted and a click retries from a fresh gesture.
      setBlocked(true);
      setPlaying(false);
    });
    // Mount-only: this is the "restore after a page load" path. Re-running it on
    // a volume change would fight an explicit pause.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause while the tab is hidden and resume only if WE were the ones playing.
  // Music continuing from a background tab is a common annoyance and browsers
  // increasingly penalise it.
  useEffect(() => {
    const onVis = () => {
      const el = elRef.current;
      if (!el) return;
      if (document.hidden && !el.paused) {
        el.dataset.resume = "1";
        el.pause();
      } else if (!document.hidden && el.dataset.resume === "1") {
        delete el.dataset.resume;
        void el.play().catch(() => setBlocked(true));
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Tear the element down with the provider so a fast-refresh or route teardown
  // can't leave an orphaned track playing forever.
  useEffect(() => {
    return () => {
      const el = elRef.current;
      if (el) {
        el.pause();
        el.remove();
        elRef.current = null;
      }
    };
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      playing,
      blocked,
      volume,
      setVolume,
      toggle,
      enable,
      disable,
      duck,
      unduck,
      track: TRACK,
    }),
    [playing, blocked, volume, setVolume, toggle, enable, disable, duck, unduck],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
