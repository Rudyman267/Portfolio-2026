"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lenisRef } from "@/components/motion/lenisBridge";

/**
 * IMAGE LIGHTBOX — click any case-study screenshot to open it large.
 *
 * Why a delegated listener instead of wrapping each <img>: the two studies
 * render images from 16 different call sites across four files (Figure,
 * CardImg, ImageCycle, GapReveal, the decision screenshots, the diagrams…).
 * Wrapping every one would mean touching all of them and would still miss any
 * added later. Instead this mounts once inside `.lir` and listens on the
 * container, so every image is covered by construction.
 *
 * Opt an image OUT with `data-no-zoom` (used for logos/marks, which are
 * decorative and would look silly blown up).
 *
 * Scroll is locked while open. The page uses Lenis smooth scroll, which keeps
 * driving the page even when `overflow:hidden` is set on body, so the lock
 * stops Lenis explicitly via the same `.is-loading` mechanism the intro loader
 * uses, plus a wheel/touch guard on the overlay itself.
 */

/** Smallest rendered size worth zooming — skips icons, logo chips, avatars. */
const MIN_ZOOMABLE = 120;

type Shot = { src: string; alt: string };

export function ImageLightbox({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const [shot, setShot] = useState<Shot | null>(null);
  const restoreScroll = useRef<number>(0);

  /* ── open: one delegated click listener on the case-study root ────────── */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const img = target.closest("img") as HTMLImageElement | null;
      if (!img) return;
      if (img.hasAttribute("data-no-zoom")) return;
      // Never hijack a click that was meant for a link or button.
      if (target.closest("a,button")) return;

      const r = img.getBoundingClientRect();
      if (r.width < MIN_ZOOMABLE || r.height < MIN_ZOOMABLE) return;

      e.preventDefault();
      setShot({ src: img.currentSrc || img.src, alt: img.alt || "" });
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [containerRef]);

  /* ── mark images as interactive so the hover affordance can apply ─────── */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const tag = () => {
      root.querySelectorAll("img").forEach((img) => {
        if (img.hasAttribute("data-no-zoom")) return;
        const r = img.getBoundingClientRect();
        // Only mark once it's actually big enough to be worth opening.
        if (r.width >= MIN_ZOOMABLE && r.height >= MIN_ZOOMABLE) {
          img.setAttribute("data-zoomable", "");
        } else {
          img.removeAttribute("data-zoomable");
        }
      });
    };

    tag();
    // Images load late and layout shifts; re-tag on both.
    const mo = new MutationObserver(tag);
    mo.observe(root, { childList: true, subtree: true });
    window.addEventListener("load", tag);
    const t = window.setTimeout(tag, 1200);

    return () => {
      mo.disconnect();
      window.removeEventListener("load", tag);
      window.clearTimeout(t);
    };
  }, [containerRef]);

  const close = useCallback(() => setShot(null), []);

  /* ── scroll lock while open ──────────────────────────────────────────── */
  useEffect(() => {
    if (!shot) return;

    restoreScroll.current = window.scrollY;
    const body = document.body;
    const prevOverflow = body.style.overflow;

    // Lenis keeps driving the page even with overflow:hidden, so stop it via
    // the shared bridge. Null when smooth scroll is off (reduced motion/touch),
    // in which case overflow:hidden alone is enough.
    lenisRef.current?.stop();
    body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      body.style.overflow = prevOverflow;
      lenisRef.current?.start();
      window.removeEventListener("keydown", onKey);
      // Restore exactly where the reader was, so the study continues in place.
      window.scrollTo({ top: restoreScroll.current, behavior: "instant" as ScrollBehavior });
    };
  }, [shot, close]);

  if (!shot || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Expanded image"
      onClick={close}
      // Block scroll-chaining to the page underneath on trackpad / touch.
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="lir-lightbox fixed inset-0 z-[300] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm sm:p-8"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close expanded image"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:border-white/45 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-6 sm:top-6"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shot.src}
        alt={shot.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full cursor-default rounded-[6px] object-contain shadow-2xl"
      />

      <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] tracking-wide text-white/45">
        Click anywhere or press Esc to close
      </p>
    </div>,
    document.body,
  );
}
