"use client";

import { useEffect, useState } from "react";

/**
 * BootProbe — an INDEPENDENT on-screen diagnostic for the intro/scroll boot
 * sequence.
 *
 * Why this exists separately from HeroDebug: HeroDebug is mounted INSIDE
 * <Hero>, so it lives in the same stacking/mount context as the thing being
 * diagnosed. It cannot report on the loader before the hero mounts, and it can
 * itself be covered by the pinned hero. This one is mounted at the top of the
 * site layout, renders at z-index 2147483647, and reports a TIMELINE of events
 * rather than a single snapshot — so a bug that happens before the hero exists,
 * or that hides an overlay, still shows up.
 *
 * Enabled with ?boot in the URL. Never renders otherwise.
 */

type Row = { t: number; msg: string };

export function BootProbe() {
  const [on, setOn] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [snap, setSnap] = useState<string[]>([]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("boot")) return;
    setOn(true);

    const t0 = performance.now();
    const log: Row[] = [];
    const add = (msg: string) => {
      log.push({ t: Math.round(performance.now() - t0), msg });
      setRows([...log]);
    };

    add("probe mounted");

    // ── event timeline ────────────────────────────────────────────────────
    const onLoaderDone = () => add("LOADER_DONE_EVENT");
    window.addEventListener("loader:done", onLoaderDone);

    // watch body.is-loading flip
    let lastLock: boolean | null = null;
    // watch the overlay appear/disappear
    let lastIntro: boolean | null = null;
    // watch the hero pin
    let lastPin: string | null = null;

    const poll = window.setInterval(() => {
      const lock = document.body.classList.contains("is-loading");
      if (lock !== lastLock) {
        add("is-loading=" + lock);
        lastLock = lock;
      }

      const intro = !!document.querySelector('[aria-label="Site intro"]');
      if (intro !== lastIntro) {
        add("introInDOM=" + intro);
        lastIntro = intro;
      }

      const hero = document.querySelector<HTMLElement>(".hero-dark");
      if (hero) {
        const cs = getComputedStyle(hero);
        const sig = cs.position + "/" + cs.zIndex;
        if (sig !== lastPin) {
          add("hero=" + sig);
          lastPin = sig;
        }
      }
    }, 100);

    // ── live snapshot ─────────────────────────────────────────────────────
    const snapshot = () => {
      const out: string[] = [];
      const w = window as unknown as Record<string, unknown>;
      const introEl = document.querySelector<HTMLElement>(
        '[aria-label="Site intro"]',
      );
      const hero = document.querySelector<HTMLElement>(".hero-dark");
      const body = document.body;

      out.push("scrollY=" + Math.round(window.scrollY));
      out.push("docH=" + document.documentElement.scrollHeight);
      out.push("vh=" + window.innerHeight);
      out.push("lock=" + body.classList.contains("is-loading"));
      out.push("bodyOv=" + getComputedStyle(body).overflow);
      out.push("htmlOv=" + getComputedStyle(document.documentElement).overflow);
      out.push("touchAct=" + getComputedStyle(body).touchAction);
      if (introEl) {
        const cs = getComputedStyle(introEl);
        const top = document.elementFromPoint(
          Math.round(window.innerWidth / 2),
          Math.round(window.innerHeight / 2),
        );
        out.push(`intro z=${cs.zIndex} op=${cs.opacity} vis=${cs.visibility}`);
        out.push("intro onTop=" + (top ? introEl.contains(top) : "?"));
        const pan = introEl.querySelector<HTMLElement>(".pan__group");
        out.push(
          "pan=" +
            (pan
              ? `op=${(+getComputedStyle(pan).opacity).toFixed(2)} w=${Math.round(pan.getBoundingClientRect().width)}`
              : "MISSING"),
        );
      } else {
        out.push("intro=NOT IN DOM");
      }
      if (hero) {
        const cs = getComputedStyle(hero);
        out.push(`hero pos=${cs.position} z=${cs.zIndex}`);
      } else {
        out.push("hero=NOT IN DOM");
      }
      out.push("opened=" + (w.__loaderOpened ?? "no"));
      out.push("handoff=" + (w.__loaderHandoff ?? "NO"));
      out.push("lenis=" + (document.documentElement.className || "-"));
      setSnap(out);
    };
    snapshot();
    const snapIv = window.setInterval(snapshot, 400);

    return () => {
      window.removeEventListener("loader:done", onLoaderDone);
      window.clearInterval(poll);
      window.clearInterval(snapIv);
    };
  }, []);

  if (!on) return null;

  return (
    <div
      // above literally everything, including any ScrollTrigger pin
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        zIndex: 2147483647,
        maxHeight: "62vh",
        overflow: "auto",
        background: "rgba(0,0,0,0.9)",
        color: "#7CFF9B",
        font: "10px/1.35 ui-monospace,Menlo,monospace",
        padding: "8px 10px",
        pointerEvents: "none",
        whiteSpace: "pre",
      }}
    >
      {"── SNAPSHOT ──\n"}
      {snap.join("\n")}
      {"\n\n── TIMELINE ──\n"}
      {rows.map((r) => `${String(r.t).padStart(5)}ms ${r.msg}`).join("\n")}
    </div>
  );
}
