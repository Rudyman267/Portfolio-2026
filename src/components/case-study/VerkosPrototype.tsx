"use client";

/**
 * VerkosPrototype — an interactive sample of what Verkos Reports OUTPUTS,
 * embedded in the case study so a reader can handle the artifact itself.
 *
 * The page in the iframe (`public/verkos-report/index.html`) is a standalone,
 * self-contained recreation of the product's generated-report viewer: light
 * canvas, "Observation #N" headings, coloured priority, AI confidence, the
 * pilot's note, and the annotated drone frame with its detection caption.
 * Readers can filter by priority, open the pilot notes, and re-roll the
 * executive summary.
 *
 * Hard rules that page keeps:
 *   - no network of any kind (no API, no CDN fonts, no external icons —
 *     icons are inlined lucide SVGs, MIT licensed)
 *   - no backend; "regenerate" replays canned copy on a timer
 *   - invented data throughout
 *
 * It lives in an iframe because the report is a LIGHT document and the case
 * study around it is dark — the iframe is a hard style boundary, so neither
 * stylesheet can leak into the other.
 *
 * DESKTOP ONLY — see the `allowed` gate below.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RotateCw } from "lucide-react";

/** Two exhibits share this shell: the product UI, and the report it outputs. */
const VARIANTS = {
  /** the real Verkos Reports frontend, built to static + stripped of auth */
  app: {
    src: "/verkos-demo/index.html",
    chrome: "Verkos Reports — the product",
    note: "real UI · sample data · nothing leaves this page",
    caption:
      "The actual Verkos Reports interface — browse reports, open the agent and template builders, start a new report.",
    gateTitle: "Interactive product demo",
    gateBody:
      "The Verkos Reports interface is embedded here — a dense operator UI that needs a wider screen. Open this case study on a desktop to use it.",
    /** the app is a full dashboard; give it more room than a document */
    height: "h-[min(86vh,860px)]",
    /** Render at this logical width and scale down to fit the column. The app
     *  is an operator dashboard (sidebar + tables); below ~1200px its cards
     *  wrap into unreadable slivers. Scaling keeps the intended proportions. */
    designWidth: 1400,
  },
  /** a standalone recreation of the generated report artifact */
  report: {
    src: "/verkos-report/index.html",
    chrome: "Verkos Reports — generated report",
    note: "sample data · nothing leaves this page",
    caption:
      "A generated Verkos report — filter by priority, open the pilot notes, re-roll the summary.",
    gateTitle: "Interactive report sample",
    gateBody:
      "A generated Verkos report is embedded here to click through — it needs a wider screen. Open this case study on a desktop to use it.",
    height: "h-[min(78vh,760px)]",
    /** the report is a document — it reflows fine, so no scaling */
    designWidth: 0,
  },
} as const;

export type PrototypeVariant = keyof typeof VARIANTS;

export function VerkosPrototype({
  variant = "report",
}: {
  variant?: PrototypeVariant;
}) {
  const v = VARIANTS[variant];
  const frameRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);
  const [faux, setFaux] = useState(false);
  const [loaded, setLoaded] = useState(false);
  /** bumped to force a remount of the iframe when the visitor hits Restart */
  const [nonce, setNonce] = useState(0);

  /* ── desktop gate ────────────────────────────────────────────────────
     A dense operator dashboard with a sidebar, wizards and tables — it does
     not degrade usefully to a phone, and iOS Safari refuses element
     fullscreen anyway. `null` until measured so SSR and first paint agree
     (no hydration mismatch). ─────────────────────────────────────────── */
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (pointer: fine)");
    const apply = () => setAllowed(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* ── fullscreen (toggleable: same control in, same control out) ─────── */
  useEffect(() => {
    const onChange = () => {
      const el =
        document.fullscreenElement ??
        (document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement ??
        null;
      setIsFull(el === frameRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Esc closes the fallback layer (the real API handles its own Esc).
  useEffect(() => {
    if (!faux) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFaux(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [faux]);

  const toggleFullscreen = useCallback(async () => {
    const node = frameRef.current;
    if (!node) return;
    if (faux) {
      setFaux(false);
      return;
    }
    type FsEl = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> };
    type FsDoc = Document & { webkitExitFullscreen?: () => Promise<void> };
    const el = node as FsEl;
    const doc = document as FsDoc;
    const active =
      document.fullscreenElement ??
      (document as Document & { webkitFullscreenElement?: Element })
        .webkitFullscreenElement;
    try {
      if (active) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
        return;
      }
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else setFaux(true);
    } catch {
      setFaux(true); // request rejected — fall back to an in-page layer
    }
  }, [faux]);

  const expanded = isFull || faux;

  /* ── fit-to-width scaling ──────────────────────────────────────────────
     For the app variant only: measure the viewport slot and scale the iframe
     from `designWidth` down to it, so the dashboard keeps its real layout in a
     narrower column. In fullscreen there is room for 1:1, so scale returns to
     1 and the iframe simply fills the frame. ─────────────────────────────── */
  const slotRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = slotRef.current;
    if (!el || !v.designWidth) return;
    const measure = () => {
      const w = el.clientWidth;
      setScale(expanded || w >= v.designWidth ? 1 : w / v.designWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [v.designWidth, expanded, allowed]);

  if (allowed === null) return <div className="my-16" aria-hidden />;

  if (!allowed) {
    return (
      <div className="not-prose my-16">
        <div className="rounded-[14px] border border-dashed border-white/14 bg-white/[0.02] px-5 py-8 text-center">
          <p className="text-[13.5px] font-semibold text-white/80">
            {v.gateTitle}
          </p>
          <p className="mx-auto mt-2 max-w-[38ch] text-[13px] leading-relaxed text-white/45">
            {v.gateBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose my-16">
      <div
        ref={frameRef}
        className={[
          "flex flex-col overflow-hidden border border-white/12 bg-[#0F0F11]",
          expanded ? "fixed inset-0 z-[999] rounded-none" : "rounded-[14px]",
        ].join(" ")}
      >
        {/* chrome bar */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <i className="block h-[9px] w-[9px] rounded-full bg-white/15" />
              <i className="block h-[9px] w-[9px] rounded-full bg-white/15" />
              <i className="block h-[9px] w-[9px] rounded-full bg-white/15" />
            </span>
            <span className="text-[12px] font-medium tracking-[0.02em] text-white/45">
              {v.chrome}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-white/25 lg:inline">
              {v.note}
            </span>
            <button
              type="button"
              onClick={() => {
                setLoaded(false);
                setNonce((n) => n + 1);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
            >
              <RotateCw size={12} aria-hidden />
              Reset
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={expanded}
              title={expanded ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
            >
              {expanded ? (
                <Minimize2 size={12} aria-hidden />
              ) : (
                <Maximize2 size={12} aria-hidden />
              )}
              <span>{expanded ? "Exit" : "Fullscreen"}</span>
            </button>
          </div>
        </div>

        {/* the app */}
        <div
          ref={slotRef}
          className={[
            "relative w-full overflow-hidden bg-[#0F0F11]",
            expanded ? "flex-1" : v.height,
          ].join(" ")}
        >
          {!loaded ? (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-[12.5px] text-white/30">
                Loading the interface…
              </span>
            </div>
          ) : null}
          <iframe
            key={nonce}
            src={v.src}
            title={v.chrome}
            onLoad={() => setLoaded(true)}
            className="border-0"
            style={
              scale < 1
                ? {
                    // render at design width, then shrink into the slot; the
                    // inverse-scaled height keeps the full slot covered.
                    width: v.designWidth,
                    height: `${100 / scale}%`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }
                : { width: "100%", height: "100%" }
            }
            // it's our own first-party static build; keep it sandboxed to
            // scripts + same-origin (needed for its router/localStorage) and
            // nothing else — no top-level navigation, no popups.
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] italic text-white/30">
        {v.caption}
      </p>
    </div>
  );
}
