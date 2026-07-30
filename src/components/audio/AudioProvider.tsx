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

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    if (elRef.current) elRef.current.volume = clamped;
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
      track: TRACK,
    }),
    [playing, blocked, volume, setVolume, toggle, enable, disable],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
