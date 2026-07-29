"use client";

import { useEffect, useState } from "react";
import { heroScroll } from "@/components/hero3d/heroScroll";

/**
 * TEMPORARY on-device diagnostics for the "iOS shows only the shader, no text"
 * bug. Renders a fixed readout of the hero's real runtime state so it can be
 * read off a real iPhone/Android screen. REMOVE once the bug is understood.
 *
 * Enabled only when the URL has ?herodebug (so prod visitors never see it).
 */
export function HeroDebug() {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("herodebug")) return;
    setOn(true);

    const sample = () => {
      const out: string[] = [];
      const mm = (q: string) => window.matchMedia(q).matches;
      out.push("reduce=" + mm("(prefers-reduced-motion: reduce)"));
      out.push("coarse=" + mm("(pointer: coarse)"));
      let webgl2 = false;
      try {
        webgl2 = !!document.createElement("canvas").getContext("webgl2");
      } catch {
        webgl2 = false;
      }
      out.push("webgl2=" + webgl2);
      out.push("isLoading=" + document.body.classList.contains("is-loading"));
      out.push("canvases=" + document.querySelectorAll("canvas").length);

      const phrase0 = document.querySelector("[data-phrase]");
      const intro = phrase0?.querySelector<HTMLElement>("[data-intro]");
      const line = phrase0?.querySelector<HTMLElement>("[data-line]");
      const mask = phrase0?.querySelector<HTMLElement>(".overflow-hidden");
      if (intro) {
        const cs = getComputedStyle(intro);
        out.push("intro.opacity=" + cs.opacity);
        out.push("intro.transform=" + cs.transform.slice(0, 30));
        out.push("intro.visibility=" + cs.visibility);
      } else {
        out.push("intro=NULL");
      }
      if (line) {
        const r = line.getBoundingClientRect();
        out.push(
          `line.rect=t${Math.round(r.top)} h${Math.round(r.height)} w${Math.round(r.width)}`,
        );
        out.push("line.opacity=" + getComputedStyle(line).opacity);
      } else {
        out.push("line=NULL");
      }
      if (mask) {
        const r = mask.getBoundingClientRect();
        out.push(`mask.h=${Math.round(r.height)} overflow=${getComputedStyle(mask).overflow}`);
      }
      // is the hero pinned? (ScrollTrigger sets position:fixed on the section)
      const hero = document.querySelector<HTMLElement>(".hero-dark");
      if (hero) {
        const cs = getComputedStyle(hero);
        out.push("hero.pos=" + cs.position + " z=" + cs.zIndex);
        out.push("REVEALED=" + (hero.getAttribute("data-revealed") ?? "0"));
      }
      // Portfolio mark (a [data-hero-item]) — the other element that was stuck
      const mark = document.querySelector<HTMLElement>("[data-hero-item]");
      if (mark) out.push("mark.opacity=" + getComputedStyle(mark).opacity);

      // works-journey: the currently-visible beat's WHITE window frame — is it
      // forming (opacity→1, width grown) as the node docks? ("morph broken" bug)
      const beats = Array.from(
        document.querySelectorAll<HTMLElement>("[data-beat]"),
      );
      const activeBeat = beats.find((b) => {
        const cs = getComputedStyle(b);
        return cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.02;
      });
      if (activeBeat) {
        const idx = beats.indexOf(activeBeat);
        const frame = activeBeat.querySelector<HTMLElement>("[data-frame]");
        if (frame) {
          const fcs = getComputedStyle(frame);
          const fr = frame.getBoundingClientRect();
          out.push(
            `beat${idx}.frame: op=${(+fcs.opacity).toFixed(2)} w=${Math.round(fr.width)}`,
          );
          const img = frame.querySelector<HTMLImageElement>("img");
          out.push(
            img
              ? `beat${idx}.img: ${img.complete && img.naturalWidth > 0 ? "ok" : "PENDING"} nw=${img.naturalWidth}`
              : `beat${idx}.img: NONE`,
          );
        }
        const skin = activeBeat.querySelector<HTMLElement>("[data-skin]");
        if (skin) out.push(`beat${idx}.skin=${(+getComputedStyle(skin).opacity).toFixed(2)}`);
      } else {
        out.push("beat=none-visible");
      }
      // Is the 3D scene ACTUALLY painting? `sceneLive` is a latch that never
      // goes false, so a stale heartbeat means the frameloop died — which would
      // starve the works-window morph. This is the pair to read when the
      // project card is missing on a real device.
      out.push(
        "sceneLive=" +
          heroScroll.sceneLive +
          " lastFrame=" +
          (heroScroll.lastFrameAt
            ? Math.round(performance.now() - heroScroll.lastFrameAt) + "ms"
            : "never"),
      );
      out.push("heroProgress=" + heroScroll.progress.toFixed(3));
      // Loader breadcrumbs — the pair that identifies a stuck intro:
      //   opened set but handoff MISSING  => the exit ran but never handed off
      //   (that leaves body.is-loading on and the page unscrollable).
      const w = window as unknown as Record<string, unknown>;
      out.push(
        "loader: opened=" +
          (w.__loaderOpened ?? "no") +
          " handoff=" +
          (w.__loaderHandoff ?? "NO"),
      );
      // Stacking check — the intro overlay MUST be the topmost thing at the
      // viewport centre while it is up. ScrollTrigger's fixed pin gets
      // z-index:110, which used to out-stack the z-100 loader on touch (the
      // hero showed and the pan hid behind it).
      const introEl = document.querySelector<HTMLElement>(
        '[aria-label="Site intro"]',
      );
      if (introEl) {
        const topEl = document.elementFromPoint(
          Math.round(window.innerWidth / 2),
          Math.round(window.innerHeight / 2),
        );
        out.push(
          "introZ=" +
            getComputedStyle(introEl).zIndex +
            " onTop=" +
            (topEl ? introEl.contains(topEl) : "?"),
        );
      } else {
        out.push("introZ=absent");
      }
      out.push(
        "worksNode: on=" +
          heroScroll.worksNode.on +
          " p=" +
          heroScroll.worksNode.p.toFixed(2) +
          " m=" +
          heroScroll.worksNode.m.toFixed(2),
      );
      setLines(out);
    };

    sample();
    const iv = window.setInterval(sample, 500);
    return () => window.clearInterval(iv);
  }, []);

  if (!on) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 60,
        left: 8,
        zIndex: 99999,
        background: "rgba(0,0,0,0.82)",
        color: "#0f0",
        font: "11px/1.35 monospace",
        padding: "8px 10px",
        borderRadius: 6,
        maxWidth: "80vw",
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
      }}
    >
      {lines.join("\n")}
    </div>
  );
}
