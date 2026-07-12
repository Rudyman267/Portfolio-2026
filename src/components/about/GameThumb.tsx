"use client";

import { useEffect, useRef } from "react";

/**
 * GameThumb — a live particle thumbnail of "The Other Hand" (the vibe-coded
 * game project). Faithfully replicates the game's DEFAULT/neutral visual
 * state (see `the-other-hand project/components/Visualizer.tsx`): Google
 * brand palette, 20% oversized dots, brownian idle drift with damping,
 * `lighter` compositing, edge wrapping — but with the motion turned up a
 * touch (livelier jitter + a faint center pull and swirl) so the frame reads
 * as something interactive, not a static image.
 *
 * Pure 2D canvas, ~220 particles — negligible next to the site's 3D scenes.
 * Reduced motion: renders a single settled frame, no loop.
 */

// Google brand colors, matching the game's PALETTE (r,g,b channel strings)
const PALETTE = [
  "66,133,244", // blue
  "234,67,53", // red
  "251,188,5", // yellow
  "52,168,83", // green
  "255,255,255", // white
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  c: string;
  phase: number;
};

export function GameThumb({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let parts: Particle[] = [];

    const seed = () => {
      parts = [];
      // uniform spread across the whole frame, like the game's field
      for (let i = 0; i < 220; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          // 20% big dots, like the game — sized up so the thumbnail reads
          // "zoomed in" and the dots fill the card
          r: Math.random() < 0.2 ? 3.2 + Math.random() * 2.6 : 1.6 + Math.random() * 1.4,
          c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      // layout size, NOT getBoundingClientRect — the frame is GSAP-scaled
      // (transform) while it grows, and the buffer must match the untransformed
      // box or the particles render at the docked 0.3× resolution forever
      if (!cvs.offsetWidth || !cvs.offsetHeight) return;
      w = cvs.offsetWidth;
      h = cvs.offsetHeight;
      cvs.width = Math.round(w * DPR);
      cvs.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (parts.length === 0) seed();
    };

    const step = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        // livelier brownian than the game's idle — feels interactive.
        // NO center pull or swirl: any radial term + damping acts like orbit
        // decay and slowly collapses the field into a blob. Pure brownian +
        // edge wrapping keeps the frame uniformly filled, like the game.
        p.vx += (Math.random() - 0.5) * 0.09;
        p.vy += (Math.random() - 0.5) * 0.09;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx;
        p.y += p.vy;
        // wrap at the margins, like the game
        const m = 30;
        if (p.x > w + m) p.x = -m;
        if (p.x < -m) p.x = w + m;
        if (p.y > h + m) p.y = -m;
        if (p.y < -m) p.y = h + m;
        // gentle twinkle around the game's 0.6 base alpha
        const a = Math.max(0.15, 0.55 + Math.sin(t * 2 + p.phase) * 0.25);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${a.toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = () => {
      step();
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      step(); // one settled frame, no loop
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
