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

      // ── works-journey beats: which one is on stage, and is its window +
      //    image actually there? This is what the thumbnail report needs.
      const beats = Array.from(
        document.querySelectorAll<HTMLElement>("[data-beat]"),
      );
      const active = beats.findIndex((b) => {
        const cs = getComputedStyle(b);
        return cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.05;
      });
      out.push("beats=" + beats.length + " active=" + (active < 0 ? "none" : active));
      // RAW driver state — p/m per beat, straight from the ticker. This is the
      // ground truth for "did the morph tween actually run".
      out.push("drv " + (w.__worksDrivers ?? "ticker not running"));
      out.push("sceneLive=" + (w.__worksLive ?? "?"));
      if (active >= 0) {
        const b = beats[active];
        const frame = b.querySelector<HTMLElement>("[data-frame]");
        const img = frame?.querySelector<HTMLImageElement>("img");
        const skin = b.querySelector<HTMLElement>("[data-skin]");
        const title = b.querySelector<HTMLElement>("[data-ptitle]");
        if (title) out.push("title=" + title.textContent);
        if (frame) {
          const fcs = getComputedStyle(frame);
          const fr = frame.getBoundingClientRect();
          out.push(
            `frame op=${(+fcs.opacity).toFixed(2)} ${Math.round(fr.width)}x${Math.round(fr.height)} @${Math.round(fr.left)},${Math.round(fr.top)}`,
          );
          // The loader bug hid an element while every one of these read normal,
          // so report the properties that can hide pixels invisibly.
          out.push(
            `frame vis=${fcs.visibility} disp=${fcs.display} bg=${fcs.backgroundColor}`,
          );
          out.push(
            `frame mask=${fcs.maskImage === "none" ? "none" : "SET"} clip=${fcs.clipPath === "none" ? "none" : "SET"} filt=${fcs.filter === "none" ? "none" : "SET"}`,
          );
          out.push(`frame xform=${fcs.transform.slice(0, 34)}`);
          // is the frame the topmost thing at its own centre?
          const cx = Math.round(fr.left + fr.width / 2);
          const cy = Math.round(fr.top + fr.height / 2);
          if (fr.width > 2 && cy > 0 && cy < window.innerHeight) {
            const hit = document.elementFromPoint(cx, cy);
            out.push(
              "frame onTop=" +
                (hit ? frame.contains(hit) || frame === hit : "?") +
                " hit=" +
                (hit ? hit.tagName + "." + String(hit.className).slice(0, 18) : "-"),
            );
          } else {
            out.push("frame offscreen/zero-size");
          }
        } else {
          out.push("frame=NO [data-frame] IN BEAT");
        }
        out.push(
          "img=" +
            (img
              ? `${img.complete && img.naturalWidth > 0 ? "ok" : "PENDING"} nw=${img.naturalWidth} op=${getComputedStyle(img).opacity} w=${Math.round(img.getBoundingClientRect().width)} ${(img.getAttribute("src") || "").split("/").pop()}`
              : "NONE (unpublished beat)"),
        );
        if (skin)
          out.push("skin op=" + (+getComputedStyle(skin).opacity).toFixed(2));
      }
      // NOTE: an earlier version reported `frame onTop=…` via elementFromPoint.
      // That was MISLEADING and cost two wrong diagnoses: the whole works layer
      // is `pointer-events-none`, so hit-testing skips the frame by design and
      // onTop is false even when the card is perfectly visible. Do not
      // reintroduce it — check ancestor chains and paint state instead.
      if (active >= 0) {
        const b = beats[active];
        const frame = b.querySelector<HTMLElement>("[data-frame]");
        if (frame) {
          // Walk from the frame to <body> and report ANY ancestor that is
          // faded, hidden, clipped or transformed away. A parent at opacity 0
          // hides the child while the child's own computed opacity still
          // reads 1 — which is precisely what the earlier readouts could not
          // distinguish.
          const chain: string[] = [];
          let n: HTMLElement | null = frame.parentElement;
          let depth = 0;
          while (n && n !== document.body && depth < 12) {
            const c = getComputedStyle(n);
            const bad =
              +c.opacity < 0.99 ||
              c.visibility === "hidden" ||
              c.display === "none" ||
              (c.clipPath && c.clipPath !== "none") ||
              (c.maskImage && c.maskImage !== "none");
            if (bad) {
              chain.push(
                `  !${n.tagName}.${String(n.className).slice(0, 18)} op=${(+c.opacity).toFixed(2)} vis=${c.visibility.slice(0, 4)} disp=${c.display.slice(0, 5)}${c.clipPath !== "none" ? " CLIP" : ""}${c.maskImage !== "none" ? " MASK" : ""}`,
              );
            }
            n = n.parentElement;
            depth++;
          }
          out.push(
            chain.length
              ? "ANCESTORS HIDING IT:\n" + chain.join("\n")
              : "ancestors: all visible",
          );
        }
      }
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
