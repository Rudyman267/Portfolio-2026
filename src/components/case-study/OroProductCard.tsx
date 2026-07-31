"use client";

/**
 * OroProductCard — the product card's hover interaction, faithful to the Figma
 * prototype (Frame 1134 · Mouse enter · Change to).
 *
 * WHAT IT SHOWS
 * The catalogue card carries a spec table (design no, karat, price code,
 * quantity, weight) over a cover-cropped photo of the piece on white. On HOVER
 * the image window grows toward full-bleed and zooms onto the enamel channel,
 * the milgrain edge and the stone settings; the spec panel drops away and the
 * product name fades in.
 *
 * WHY IT MATTERED (this is the point of including it)
 * The catalogue is ~70,000 designs and a bulk buyer scrolls a wall of them.
 * At thumbnail size a bangle is a gold ellipse — near-identical to the next
 * hundred gold ellipses. The zoomed state is what makes a specific SKU
 * IDENTIFIABLE on that wall: you recognise the piece by its surface, not by
 * re-reading a design number you were never going to memorise.
 *
 * IMPLEMENTATION NOTES
 *  - ONE photograph, cover-cropped exactly as Figma frames it (see IMG below).
 *    The rest state is NOT a rotation — it's a horizontal-band crop of a
 *    portrait, diagonally-shot photo. Hover is a scale-in of that same framing.
 *  - HOVER-DRIVEN (mouse enter/leave + focus/blur). NOT an auto-loop — the
 *    reader triggers it, and a hint below the card tells them it's hoverable.
 *  - Touch / no-hover devices can't hover, so they TAP to toggle and the hint
 *    reads "Tap"; keyboard users get the same via Enter/Space.
 *  - NO fake cursor is drawn — a drawn pointer reads as a screen recording.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Transition timing lifted from the Figma prototype (Frame 1134 · Mouse enter ·
 *  Change to): 1s on the ease below. */
const DUR = 1000;
const EASE = "cubic-bezier(0.3, 0, 0.55, 0.99)";

/**
 * The photograph's placement, taken VERBATIM from the Figma node
 * (get_design_context on DSC2199): the portrait, diagonally-shot bangle is
 * cover-cropped — stretched wider than tall — so a HORIZONTAL band of the piece
 * fills the window. There is NO element rotation in the rest state; the
 * "horizontal bangle" is entirely this crop. (An earlier build rotated the whole
 * image instead, which is why the start frame was wrong.)
 *
 * Rest = the exact Figma percentages. Macro = the same crop pushed larger and
 * re-centred onto the enamel + stones (a scale-in of the identical framing, so
 * the zoom can't distort what already reads correctly).
 */
const IMG = {
  window: {
    // Rest = the small upper crop window. Macro (Frame 1134 in Figma) grows to
    // full-bleed — big enough that the ROTATED photo still covers the card with
    // no white corners.
    rest: { left: "11.375%", top: "-1.616%", width: "77.25%", height: "70.106%" },
    macro: { left: "-42%", top: "-42%", width: "184%", height: "184%" },
  },
  photo: {
    // Rest = the exact Figma cover-crop (reads as a horizontal band). Macro
    // ZOOMS ~3.6× AND ROTATES to the diagonal the Figma prototype shows
    // (DSC2199 rotate -15 → 45; Figma's +45 is CSS −45..−50, band running
    // lower-left → upper-right onto the enamel + stones).
    // SAME crop in both states — the macro difference is a pure transform (scale
    // + rotate) around the enamel, so it zooms the identical framing instead of
    // re-cropping (which tweens cleanly and can't distort what already reads
    // right). Window growth adds the rest of the zoom.
    rest: { height: "195.49%", width: "192.87%", left: "-46.44%", top: "-47.75%", transformOrigin: "52% 42%", transform: "rotate(0deg) scale(1)" },
    macro: { height: "195.49%", width: "192.87%", left: "-46.44%", top: "-47.75%", transformOrigin: "52% 42%", transform: "rotate(-58deg) scale(2.1)" },
  },
} as const;

const SPECS: [string, string][] = [
  ["Design no", "JK123456"],
  ["Karat", "22K"],
  ["Price Code", "EZ"],
  ["Quantity", "4"],
  ["Weight", "54gms"],
];

export function OroProductCard({ caption }: { caption?: string }) {
  const [macro, setMacro] = useState(false);
  const [coarse, setCoarse] = useState(false);

  // Touch / no-hover devices can't hover — they TAP to toggle, and the hint
  // copy switches to "Tap".
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const enter = () => setMacro(true);
  const leave = () => setMacro(false);

  return (
    <figure className="w-full">
      <div className="flex flex-col items-center">
        <div
          data-state={macro ? "macro" : "catalogue"}
          onMouseEnter={coarse ? undefined : enter}
          onMouseLeave={coarse ? undefined : leave}
          onFocus={coarse ? undefined : enter}
          onBlur={coarse ? undefined : leave}
          onClick={coarse ? () => setMacro((m) => !m) : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMacro((m) => !m);
            }
          }}
          aria-label="Product card — hover or activate to zoom into the piece's surface detail"
          className={cn(
            "group relative aspect-[357/315] w-[min(100%,357px)] cursor-pointer overflow-hidden rounded-[24px] bg-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          )}
        >
          {/* GREEN TAKEOVER — Figma's "Frame" layer (opacity 0 to 1): the deep
              enamel green fades IN behind the growing photo as the white catalogue
              chrome fades OUT, so the card's colour flips from white to green as
              the piece takes over. Sits at the very back; the photo rides above. */}
          <div
            className={cn(
              "absolute inset-0 bg-[#0e3a2f] transition-opacity",
              macro ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: `${DUR}ms`, transitionTimingFunction: EASE }}
            aria-hidden
          />

          {/* THE PHOTOGRAPH — one image, cover-cropped exactly as Figma frames
              it (see IMG above). Catalogue: the whole piece as a horizontal
              band, sitting in the upper card. Macro (Mouse enter · Change to):
              the crop window grows toward full-bleed and the same framing pushes
              in onto the enamel + stones — a zoom, not a re-crop. */}
          <div
            className="absolute overflow-hidden rounded-[14px]"
            style={{
              ...(macro ? IMG.window.macro : IMG.window.rest),
              transition: `left ${DUR}ms ${EASE}, top ${DUR}ms ${EASE}, width ${DUR}ms ${EASE}, height ${DUR}ms ${EASE}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/case-study/oro/card-bangle.webp"
              alt="A 22K gold bangle with green enamel inlay and set stones — shown as a catalogue thumbnail, then zoomed onto its surface detail."
              className="absolute max-w-none"
              style={{
                ...(macro ? IMG.photo.macro : IMG.photo.rest),
                transition: `all ${DUR}ms ${EASE}`,
              }}
              // decorative-with-caption: the figure caption carries the meaning
              draggable={false}
            />
          </div>

          {/* PRODUCT NAME — hidden in catalogue, fades in on the macro state
              (Figma "Product Name", opacity 0 → 1). Dark ink so it reads on the
              bright gold/enamel close-up; a whisper of top scrim guarantees it. */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 h-[38%] bg-gradient-to-b from-black/25 to-transparent transition-opacity",
              macro ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: `${DUR}ms`, transitionTimingFunction: EASE }}
            aria-hidden
          />
          <div
            className={cn(
              "absolute left-[6%] top-[6%] z-10 max-w-[70%] text-[clamp(0.95rem,0.8rem+0.6vw,1.15rem)] font-semibold leading-tight tracking-[-0.01em] text-white transition-[opacity,transform]",
              macro ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
            )}
            style={{ transitionDuration: `${DUR}ms`, transitionTimingFunction: EASE }}
            aria-hidden={!macro}
          >
            22K Enamel Bangle
          </div>

          {/* wishlist affordance — catalogue state only; yields to the product
              name on macro (they share the top-left corner). */}
          <div
            className={cn(
              "absolute left-[6%] top-[5%] z-10 transition-opacity",
              macro ? "opacity-0" : "opacity-100",
            )}
            style={{ transitionDuration: `${DUR}ms`, transitionTimingFunction: EASE }}
            aria-hidden
          >
            <svg width="17" height="15" viewBox="0 0 17 15" fill="none">
              <path
                d="M8.5 14S1 9.9 1 5.2A4.2 4.2 0 0 1 8.5 2.6 4.2 4.2 0 0 1 16 5.2C16 9.9 8.5 14 8.5 14Z"
                stroke="#111"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* SPEC TABLE — the catalogue state's whole reason for existing.
              Fades out in macro so the surface detail is unobstructed. */}
          <div
            className={cn(
              "absolute inset-x-[4%] bottom-[6%] z-10 rounded-[12px] border border-[#e4e4e4] bg-white/95 px-[6%] py-[5%] transition-[opacity,transform]",
              macro
                ? "pointer-events-none translate-y-full opacity-0"
                : "translate-y-0 opacity-100",
            )}
            style={{ transitionDuration: `${DUR}ms`, transitionTimingFunction: EASE }}
            aria-hidden={macro}
          >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-[6px] text-[clamp(0.62rem,0.5rem+0.5vw,0.8rem)] leading-[1.18]">
              {SPECS.map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <dt className="text-[#6b6b6b]">{k}</dt>
                  <dd className="font-light text-black">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* add-to-cart — present in BOTH states (it is in both Figma variants:
              the buyer can add straight from the macro view without going back) */}
          <div className="absolute bottom-[8%] right-[4%] flex h-9 w-9 items-center justify-center rounded-[6px] bg-[rgba(149,241,213,0.56)]">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="#0d3b32"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* supportive hint — tells the reader the card responds to hover/tap */}
        <p className="mt-4 text-center text-[length:var(--lir-label)] italic text-faint">
          {coarse ? "Tap to zoom into the detail" : "Hover to zoom into the detail"}
        </p>
      </div>

      {caption ? (
        <figcaption className="mx-auto mt-4 max-w-[var(--lir-measure)] text-center text-[length:var(--lir-caption)] leading-[1.5] text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
