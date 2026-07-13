"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { GameThumb } from "@/components/about/GameThumb";

/**
 * AboutIntro — the "HEY! THAT'S MY NAME" opening of the Me page.
 *
 * Storyboard (user-supplied, 5 frames, mapped to one pinned scrub):
 *   1. Black void, a small portrait frame alone at center.
 *   2. Two Tanker phrases slide in from opposite edges — "HEY! THAT'S" from
 *      the left, "MY NAME" from the right — while the frame grows.
 *   3. They converge white, flanking the photo: one sentence across the screen.
 *   4. They keep merging toward one axis and dissolve into it (no return).
 *   5. "RIDDHIMAN DEB" pops letter-by-letter centered on the photo.
 *   6. The name scene recedes; "22 YEARS OF EXPERIENCE DREAMING ABOUT TECH"
 *      wipes in line-by-line from the left while the ending video slides in
 *      from the right — the two meet as one composition.
 *   7. That fades; "NOW I / BUILD / PRODUCT EXPERIENCES" fade in scattered,
 *      with a small live particle frame (The Other Hand game thumbnail)
 *      docked beside BUILD.
 *   8. On scroll the words slide across and out while the frame grows to a
 *      centered 16:9 card → "PLAY?" pops on it. The card is a link to the
 *      project (future /play page); hover = white border + text glow.
 *   9. Keep scrolling: the particles dim, PLAY? clears, and "NVM CHECK IT
 *      OUT LATER ITS COOL" lands center. Then the pin releases.
 *
 * The photo inside the frame crossfades through four shots (school bus → train
 * → mask → mic) as the scroll advances — a life in four frames. Each phrase
 * travels in two linear segments (ease none) with function-based endpoints:
 * fully offscreen at t=0, exactly flanking the full-size frame at the
 * convergence (held briefly), then onward into the center where they fade out
 * before the physical overlap ever shows. Color/opacity are keyed separately
 * on top of the travel.
 *
 * Reduced motion: no pin — the settled final state (photo + name) renders.
 */

const PHOTOS = [
  "/about/me-4.jpeg", // school bus — the earliest
  "/about/me-2.jpeg", // train window
  "/about/me-3.jpeg", // the mask
  "/about/me-1.jpeg", // mic, mid-laugh — the storyboard's frame
];

const NAME_WORDS = ["RIDDHIMAN", "DEB"];

const YEARS_LINES = ["22 Years of", "Experience", "Dreaming", "About Tech"];

// Scene-3 word cloud — positions in % of the viewport (storyboard frame A),
// dir = exit direction (-1 = letters vanish into the word's left mask edge,
// +1 = into its right edge).
const SCENE3_WORDS = [
  { text: "Now I", left: "63.75%", top: "43.1%", dir: -1 },
  { text: "Build", left: "38.4%", top: "54.2%", dir: 1 },
  { text: "Product Experiences", left: "68.2%", top: "68.6%", dir: -1 },
];

const NVM_LINES = ["NVM check it out", "later its cool"];

// Scene 4 — the thesis. The interaction acts out the copy: a literal boundary
// draws between the two headline halves, flickers, and collapses — then the
// paragraph assembles.
const PARA_LINES = [
  "For years, designers",
  "owned the interface",
  "while engineers owned",
  "the product. AI is",
  "collapsing that",
  "boundary.",
];

// Scene 5 — the process. Icons orbit the center once, then lay themselves out
// in a row IN THIS ORDER (frame 1 → 7). `circle` = position on the storyboard
// circle (clockwise from top), used for the orbit's start angles.
const PROCESS = [
  { label: "Research", src: "/about/process-1.svg", circle: 2, fast: false },
  { label: "Define", src: "/about/process-2.svg", circle: 3, fast: false },
  { label: "Constraints", src: "/about/process-3.svg", circle: 4, fast: false },
  { label: "Design", src: "/about/process-4.svg", circle: 5, fast: false },
  { label: "Build", src: "/about/process-5.svg", circle: 1, fast: false },
  { label: "Feedback", src: "/about/process-6.svg", circle: 0, fast: false },
  { label: "Reiterate", src: "/about/process-7.svg", circle: 6, fast: true },
];

// Scene 6 — the closing quotes.
const QUOTE1_LINES = [
  "Ideas deserve more",
  "than prototypes. They",
  "deserve to exist.",
];
const QUOTE2_LINES = [
  "I don't just want to design",
  "the future of products. I",
  "want to help build it.",
];

/** Shared display-type styles — Tanker, like the case-study headings. */
const tanker: React.CSSProperties = {
  fontFamily: "var(--font-display-tanker)",
};

export function AboutIntro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const frame = section.querySelector<HTMLElement>("[data-frame]");
      const phraseA = section.querySelector<HTMLElement>("[data-phrase-a]");
      const phraseB = section.querySelector<HTMLElement>("[data-phrase-b]");
      const nameLayer = section.querySelector<HTMLElement>("[data-name]");
      const letters = section.querySelectorAll<HTMLElement>("[data-name-letter]");
      const photos = section.querySelectorAll<HTMLElement>("[data-photo]");
      const scene2 = section.querySelector<HTMLElement>("[data-scene2]");
      const lines22 = section.querySelectorAll<HTMLElement>("[data-line22]");
      const video22 = section.querySelector<HTMLElement>("[data-video22]");
      const videoEl = section.querySelector<HTMLVideoElement>("video");
      const words3Layer = section.querySelector<HTMLElement>("[data-scene3-words]");
      const words3 = section.querySelectorAll<HTMLElement>("[data-word3]");
      const frame3Layer = section.querySelector<HTMLElement>("[data-scene3-frame]");
      const frame3 = section.querySelector<HTMLElement>("[data-frame3]");
      const playLabel = section.querySelector<HTMLElement>("[data-play]");
      const nvmLayer = section.querySelector<HTMLElement>("[data-nvm]");
      const nvmLines = section.querySelectorAll<HTMLElement>("[data-nvm-line]");
      const scene4 = section.querySelector<HTMLElement>("[data-scene4]");
      const d4Line1 = section.querySelector<HTMLElement>("[data-d4-line1]");
      const d4Line2 = section.querySelector<HTMLElement>("[data-d4-line2]");
      const d4Inner1 = section.querySelector<HTMLElement>("[data-d4-inner1]");
      const d4Inner2 = section.querySelector<HTMLElement>("[data-d4-inner2]");
      const d4Rule = section.querySelector<HTMLElement>("[data-d4-rule]");
      const paraLayer = section.querySelector<HTMLElement>("[data-scene4-para]");
      const paraLines = section.querySelectorAll<HTMLElement>("[data-para-line]");
      const scene5 = section.querySelector<HTMLElement>("[data-scene5]");
      const icons5 = section.querySelectorAll<HTMLElement>("[data-icon5]");
      const ideaDot = section.querySelector<HTMLElement>("[data-idea-dot]");
      const quote1Layer = section.querySelector<HTMLElement>("[data-quote1]");
      const q1Block = section.querySelector<HTMLElement>("[data-q1-block]");
      const q1Lines = section.querySelectorAll<HTMLElement>("[data-q1-line]");
      const quote2Layer = section.querySelector<HTMLElement>("[data-quote2]");
      const q2Block = section.querySelector<HTMLElement>("[data-q2-block]");
      if (!frame || !phraseA || !phraseB || !nameLayer || !scene2 || !video22)
        return;
      if (!words3Layer || !frame3Layer || !frame3 || !nvmLayer) return;
      if (!scene4 || !d4Line1 || !d4Line2 || !d4Rule || !paraLayer) return;
      if (!scene5 || !ideaDot || !quote1Layer || !q1Block || !quote2Layer)
        return;
      if (!q2Block) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ── travel geometry (function-based → recalcs on refresh/resize) ────
        // Start: phrase center offscreen past its edge. Midpoint: phrase flanks
        // the full-scale frame (slight overlap, like the storyboard). End:
        // mirror of start around the midpoint so the linear tween crosses the
        // flank position exactly halfway through its duration.
        const overlap = () => Math.min(28, window.innerWidth * 0.015);
        const startX = (el: HTMLElement, dir: 1 | -1) => () =>
          dir * ((window.innerWidth + el.offsetWidth) / 2 + 40);
        const flankX = (el: HTMLElement, dir: 1 | -1) => {
          // keep the phrase fully on screen on narrow viewports
          const ideal = frame.offsetWidth / 2 + el.offsetWidth / 2 - overlap();
          const max = window.innerWidth / 2 - el.offsetWidth / 2 - 12;
          return dir * Math.min(ideal, Math.max(max, el.offsetWidth * 0.2));
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            // total timeline shrank ~36.6→~31.9 units when scene 1's entrance
            // moved to the load intro; pin length drops proportionally so the
            // px-per-unit scroll speed (and every scene's feel) stays identical.
            end: "+=1050%",
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // ── AUTONOMOUS INTRO (plays on load, NOT scroll-mapped) ──────────────
        // The old scene-1 entrance (frame grow 0→4.25 + phrases sliding in to
        // flank the photo) used to live on the scrubbed timeline, so a visitor
        // who hadn't scrolled just saw a tiny photo shuffling. That entrance now
        // plays on its own the moment the page loads, resolving to the readable
        // "HEY! THAT'S [photo] MY NAME" convergence. The scrubbed timeline below
        // STARTS from that converged state (frame full, phrases flanking, white)
        // and only owns the merge/fade onward — so scrolling continues the story
        // and scrolling back to the top rests on the converged frame, never the
        // tiny-photo opening.
        //
        // Seat the OPENING state (frame small, phrases parked offscreen and
        // hidden) so nothing of frame 2 flashes before the intro runs. The
        // intro grows/slides them to the converged state; the scrubbed timeline
        // below then STARTS from that convergence — its downstream .to()s read
        // the live x/scale the intro leaves behind.
        gsap.set(frame, { scale: 0.36 });
        gsap.set(phraseA, { autoAlpha: 0, color: "#4a4a4a", x: startX(phraseA, -1) });
        gsap.set(phraseB, { autoAlpha: 0, color: "#4a4a4a", x: startX(phraseB, 1) });

        const intro = gsap.timeline({ paused: true });
        // frame grows from the small opening state to full
        intro.to(
          frame,
          { scale: 1, duration: 1.5, ease: "power1.inOut" },
          0,
        );
        // phrases fade in and slide from offscreen to flank the photo…
        // fromTo (not to): the scrubbed timeline sitting at progress 0 forces x
        // to flankX during ScrollTrigger's initial refresh, so a plain .to would
        // start from flankX and never travel. Forcing the offscreen `from` when
        // the intro plays restores the full slide.
        intro.to([phraseA, phraseB], { autoAlpha: 1, duration: 0.4 }, 0);
        intro.fromTo(
          phraseA,
          { x: startX(phraseA, -1) },
          { x: () => flankX(phraseA, -1), duration: 1.5, ease: "power2.out" },
          0,
        );
        intro.fromTo(
          phraseB,
          { x: startX(phraseB, 1) },
          { x: () => flankX(phraseB, 1), duration: 1.5, ease: "power2.out" },
          0,
        );
        // …turning grey → white as they arrive, landing on the readable sentence
        intro.to(
          [phraseA, phraseB],
          { color: "#ffffff", duration: 0.9, ease: "none" },
          0.7,
        );

        // Kick the intro once the loader has cleared (or immediately on a
        // client-side nav where the loader never mounted). Guard so it fires
        // exactly once even if both paths race.
        let introStarted = false;
        const startIntro = () => {
          if (introStarted) return;
          introStarted = true;
          intro.play(0);
        };
        if (document.body.classList.contains("is-loading")) {
          window.addEventListener("loader:done", startIntro, { once: true });
        } else {
          startIntro();
        }

        // whisper of vertical drift on the frame the whole way (scroll-mapped)
        tl.to(frame, { scale: 0.72, duration: 1.3, ease: "power1.inOut" }, 0.6);
        tl.fromTo(
          frame,
          { y: () => window.innerHeight * 0.04 },
          { y: () => window.innerHeight * -0.02, duration: 5.3 },
          0,
        );

        // ── photo shuffle: AUTOPLAY, not scroll-mapped — the shots cycle on
        //    their own every 900ms with a quick crossfade, photo-booth style.
        //    Only the frame's scale/drift stays tied to the scrub. ───────────
        let photoIdx = 0;
        const shuffle = window.setInterval(() => {
          const next = (photoIdx + 1) % photos.length;
          gsap.to(photos[next], { autoAlpha: 1, duration: 0.25, overwrite: true });
          gsap.to(photos[photoIdx], { autoAlpha: 0, duration: 0.25, overwrite: true });
          photoIdx = next;
        }, 900);

        // ── the two phrases: the autonomous intro (above) lands them flanking
        // the photo, white — the readable "HEY! THAT'S [photo] MY NAME" beat.
        // Scroll then drifts them on toward one axis and dissolves them into it
        // STARTING IMMEDIATELY at t=0 — the entrance is owned by the load intro,
        // so the scrubbed timeline has no dead scroll before the text reacts.
        // (They never come back on the far sides; scrolling to the top rests on
        // the convergence rather than replaying the tiny-photo opening.)
        //
        // These live at position 0 so their START must be the convergence the
        // load intro lands on — otherwise the scrubbed ScrollTrigger's own
        // refresh caches the setup (offscreen) x and the phrase SNAPS back there
        // the instant you scroll. Two guards together fix it cleanly:
        //   • explicit `from: flankX` — the tween's start is the convergence,
        //     not whatever live value happens to be cached;
        //   • immediateRender:false — DON'T paint that start at setup (which
        //     would flash the phrases in before the loader clears). Init is
        //     deferred to first scroll, by which point the load intro has landed
        //     them exactly on flankX — so scroll continues seamlessly from it.
        tl.fromTo(
          phraseA,
          { x: () => flankX(phraseA, -1) },
          { x: startX(phraseA, 1), duration: 3.8, immediateRender: false },
          0,
        );
        tl.fromTo(
          phraseB,
          { x: () => flankX(phraseB, 1) },
          { x: startX(phraseB, -1), duration: 3.8, immediateRender: false },
          0,
        );
        // gone mid-merge — fully faded just before the physical cross (~t0.7)
        // so the overlap never shows
        tl.fromTo(
          [phraseA, phraseB],
          { autoAlpha: 1 },
          { autoAlpha: 0, duration: 0.8, immediateRender: false },
          0.1,
        );

        // ── the name: pops right after the phrases dissolve — quick masked
        //    per-letter rise over the settled photo ───────────────────────────
        tl.set(nameLayer, { autoAlpha: 1 }, 1.25);
        tl.fromTo(
          letters,
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: 0.7,
            stagger: 0.035,
            ease: "power3.out",
          },
          1.3,
        );

        // ── scene 2: the name scene recedes, then "22 YEARS OF EXPERIENCE
        //    DREAMING ABOUT TECH" wipes in line-by-line from the left while
        //    the ending video slides in from the right — mirrored moves that
        //    meet as one composition and hold to the unpin ────────────────────
        tl.to([frame, nameLayer], { autoAlpha: 0, duration: 0.8 }, 2.9);
        tl.to(frame, { scale: 0.6, duration: 0.8, ease: "power1.in" }, 2.9);
        tl.set(scene2, { autoAlpha: 1 }, 3.6);
        tl.fromTo(
          lines22,
          { xPercent: -112 },
          { xPercent: 0, duration: 0.9, stagger: 0.16, ease: "power3.out" },
          3.7,
        );
        tl.fromTo(
          video22,
          { x: () => window.innerWidth * 0.65 },
          { x: 0, duration: 1.35, ease: "power3.out" },
          3.7,
        );
        // start the loop as the scene arrives (muted → allowed without gesture)
        tl.call(() => videoEl?.play().catch(() => {}), [], 3.7);
        // settled hold with a whisper of lift, then the composition clears
        tl.to(scene2, { y: () => window.innerHeight * -0.015, duration: 1.2 }, 5.1);
        tl.to(scene2, { autoAlpha: 0, duration: 0.8 }, 5.7);

        // ── scene 3: NOW I / BUILD / PRODUCT EXPERIENCES fade in scattered,
        //    with the game-thumbnail frame docked small beside BUILD ─────────
        // words + frame center themselves off their % anchors
        gsap.set(words3, { xPercent: -50, yPercent: -50 });
        // scene-4 headline halves start STACKED at center; the rule is a
        // center-anchored hairline (GSAP owns its transform — an inline CSS
        // translate would be clobbered by the first scaleY write)
        gsap.set([d4Line1, d4Line2], { xPercent: -50, yPercent: -50 });
        gsap.set(d4Line1, { y: () => -d4Line1.offsetHeight * 0.62 });
        gsap.set(d4Line2, { y: () => d4Line2.offsetHeight * 0.62 });
        gsap.set(d4Rule, { xPercent: -50, yPercent: -50, scaleY: 0 });
        tl.set([words3Layer, frame3Layer], { autoAlpha: 1 }, 6.2);
        // all together, pure fade, no stagger, no rise — scroll-mapped
        tl.fromTo(
          [...words3, frame3],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.6 },
          6.3,
        );

        // ── the migration: HORIZONTAL ONLY, ease none — pure scroll mapping.
        //    The words never leave their storyboard rows; the card (bumped a
        //    touch to 42vw so its box crosses those rows) occludes whatever
        //    passes behind it. No docking pause: when a word reaches its dock
        //    position it keeps moving at the SAME px-per-scroll rate, but now
        //    inside its word-sized mask — the letters slide on into blackness
        //    at the boundary. One continuous travel that simply disappears. ──
        // final card box in viewport coords (mirrors the clamp() in the class)
        const frameBox = () => {
          const iw = window.innerWidth;
          const fW = Math.min(Math.max(220, 0.21 * iw), 380);
          return { fW, fL: iw / 2 - fW / 2, fR: iw / 2 + fW / 2 };
        };
        // dock-position centers, X only
        const meetX: Array<(el: HTMLElement) => number> = [
          // NOW I: tail tucked just past the card's left edge
          (el) => frameBox().fL + 0.06 * frameBox().fW - el.offsetWidth / 2,
          // BUILD: crossed behind the card, B a hair behind the right border
          // (-3 not -1: transform/rect rounding eats ~2px)
          (el) => frameBox().fR - 3 + el.offsetWidth / 2,
          // PRODUCT EXPERIENCES: mid-word under the card
          () => window.innerWidth / 2 - 0.16 * frameBox().fW,
        ];
        words3.forEach((word, i) => {
          const ax = parseFloat(SCENE3_WORDS[i].left) / 100;
          tl.to(
            word,
            {
              x: () => meetX[i](word) - ax * window.innerWidth,
              duration: 1.2,
              ease: "none",
            },
            7.7,
          );
          // the exit: no pause at the dock — the word keeps drifting in its
          // direction at the same scroll-mapped rate while it softly blurs
          // and fades out. Clean dissolve, no masks.
          tl.to(
            word,
            {
              x: () =>
                meetX[i](word) - ax * window.innerWidth +
                SCENE3_WORDS[i].dir * 140,
              autoAlpha: 0,
              filter: "blur(6px)",
              duration: 0.9,
              ease: "none",
            },
            8.9,
          );
        });
        tl.fromTo(
          frame3,
          {
            // docked beside BUILD (storyboard frame A), ~0.3× of the card
            x: () => window.innerWidth * -0.018,
            y: () => window.innerHeight * 0.047,
            scale: 0.3,
          },
          {
            x: 0,
            // settle BELOW center so the top edge cuts NOW I's row while the
            // bottom edge keeps its perfect PRODUCT EXPERIENCES cut
            y: () => window.innerHeight * 0.0535,
            scale: 1,
            duration: 1.2,
            ease: "none",
            // render the docked state immediately so the card is small when
            // it first fades in at 6.3, before this tween's own window
            immediateRender: true,
          },
          7.7,
        );

        // PLAY? pops on the settled card (the long PE tail finishes ~10.7)
        tl.fromTo(
          playLabel,
          { autoAlpha: 0, scale: 0.92 },
          { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" },
          10.9,
        );

        // ── hold the PLAY? card (hover/click affordance window) ── 11.4–12.1

        // ── the punchline: the card (particles, border, PLAY?) clears out
        //    COMPLETELY, leaving pure black for NVM ───────────────────────────
        tl.to(frame3, { autoAlpha: 0, duration: 0.8 }, 12.1);
        tl.set(nvmLayer, { autoAlpha: 1 }, 12.5);
        tl.fromTo(
          nvmLines,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power2.out" },
          12.6,
        );
        // NVM holds with a whisper of lift, then clears for the thesis
        tl.to(nvmLayer, { y: () => window.innerHeight * -0.012, duration: 0.8 }, 13.5);
        tl.to(nvmLayer, { autoAlpha: 0, duration: 0.7 }, 13.9);

        // ── scene 4: THE COLLAPSING BOUNDARY — the interaction acts out the
        //    copy. "DESIGN IS / CHANGING" pops stacked; scroll pulls the two
        //    halves apart into ONE ROW while a hairline draws itself between
        //    them (designers | engineers); the line flickers, SNAPS shut, and
        //    the halves collapse into it — then the paragraph assembles
        //    line-by-line through masks, mapped to scroll. ────────────────────
        tl.set(scene4, { autoAlpha: 1 }, 14.5);
        // pop: masked per-line rise, same voice as the name reveal
        tl.fromTo(
          [d4Inner1, d4Inner2],
          { yPercent: 115 },
          { yPercent: 0, duration: 0.55, stagger: 0.12, ease: "power3.out" },
          14.6,
        );

        // ── hold the stacked headline ── 15.2–15.8

        // pull apart: stacked → one row flanking the (drawing) hairline
        const RULE_GAP = 90; // px between the halves at full separation
        tl.to(
          d4Line1,
          {
            x: () => -(RULE_GAP / 2 + d4Line1.offsetWidth / 2),
            y: 0,
            duration: 0.8,
            ease: "none",
          },
          15.8,
        );
        tl.to(
          d4Line2,
          {
            x: () => RULE_GAP / 2 + d4Line2.offsetWidth / 2,
            y: 0,
            duration: 0.8,
            ease: "none",
          },
          15.8,
        );
        tl.fromTo(
          d4Rule,
          { scaleY: 0, autoAlpha: 1 },
          { scaleY: 1, duration: 0.8, ease: "none" },
          15.8,
        );

        // ── hold the divided composition ── 16.6–16.8

        // the boundary gives out: flicker …
        tl.to(d4Rule, { opacity: 0.25, duration: 0.08 }, 16.8);
        tl.to(d4Rule, { opacity: 1, duration: 0.08 }, 16.88);
        tl.to(d4Rule, { opacity: 0.15, duration: 0.08 }, 16.96);
        tl.to(d4Rule, { opacity: 1, duration: 0.08 }, 17.04);
        // … then SNAP — and the halves get pulled into the collapse
        tl.to(d4Rule, { scaleY: 0, duration: 0.3, ease: "power3.in" }, 17.2);
        tl.to(
          d4Line1,
          { x: "+=34", autoAlpha: 0, duration: 0.5, ease: "power2.in" },
          17.2,
        );
        tl.to(
          d4Line2,
          { x: "-=34", autoAlpha: 0, duration: 0.5, ease: "power2.in" },
          17.2,
        );

        // the paragraph assembles — one masked line-wipe per scroll increment
        tl.set(paraLayer, { autoAlpha: 1 }, 17.9);
        paraLines.forEach((line, i) => {
          tl.fromTo(
            line,
            { xPercent: -103 },
            { xPercent: 0, duration: 0.55, ease: "none" },
            18.0 + i * 0.5,
          );
        });
        // thesis holds with a whisper of lift, then clears for the process
        tl.to(paraLayer, { y: () => window.innerHeight * -0.012, duration: 0.8 }, 20.9);
        tl.to(paraLayer, { autoAlpha: 0, duration: 0.7 }, 21.3);

        // ── scene 5: THE PROCESS — seven icons fade in on a circle, orbit the
        //    center exactly ONCE (scroll-mapped), then lay themselves out in a
        //    row in order: Research → Define → Constraints → Design → Build →
        //    Feedback → Reiterate (…fast). Positions are computed per frame
        //    from proxies so the circle is a true ellipse, responsive. ────────
        const RX = () => Math.min(window.innerWidth * 0.24, 420);
        const RY = () => Math.min(window.innerHeight * 0.27, 300);
        const SPACING = () =>
          Math.min(Math.max(100, window.innerWidth * 0.12), 210);
        const angleOf = (i: number, t: number) =>
          ((-90 + PROCESS[i].circle * (360 / 7) + t * 360) * Math.PI) / 180;
        const circlePos = (i: number, t: number) => ({
          x: Math.cos(angleOf(i, t)) * RX(),
          y: Math.sin(angleOf(i, t)) * RY(),
        });
        const rowPos = (i: number) => ({ x: (i - 3) * SPACING(), y: 0 });

        gsap.set(icons5, { xPercent: -50, yPercent: -50 });
        const orbit = { t: 0 };
        const placeOrbit = () =>
          icons5.forEach((el, i) => {
            const p = circlePos(i, orbit.t);
            gsap.set(el, { x: p.x, y: p.y });
          });
        // The UNROLL — a spinning rope laying itself onto the line. The coil
        // keeps rotating while its head travels rightward along the row;
        // icon 1 peels off and lays down first, each next icon follows in
        // order, 7 last. Meanwhile the WHOLE arrangement drifts left by half
        // the row so the finished line lands dead-center (the rope "moves
        // left to adjust the composition"). At p=0 this equals the orbit's
        // end state, at p=1 the exact centered row — seamless on both ends.
        const morph = { p: 0 };
        const placeMorph = () => {
          const p = morph.p;
          const S = SPACING();
          const shift = -3 * S * p; // the leftward composition adjust
          icons5.forEach((el, i) => {
            const pi = 0.1 + (i / 6) * 0.78; // this icon's lay-down moment
            const k = Math.min(1, Math.max(0, (p - (pi - 0.14)) / 0.14));
            const shrink = 1 - 0.7 * p; // less rope left in the coil
            const a = angleOf(i, 1 + p * 0.55); // coil spins on as it unrolls
            const headX = 6 * S * p; // the coil head walking the line
            const coilX = headX + Math.cos(a) * RX() * shrink;
            const coilY = Math.sin(a) * RY() * shrink;
            const landX = i * S;
            gsap.set(el, {
              x: coilX + (landX - coilX) * k + shift,
              y: coilY * (1 - k),
            });
          });
        };
        placeOrbit(); // seat everyone on the circle before the fade-in

        tl.set(scene5, { autoAlpha: 1 }, 21.8);
        tl.fromTo(
          icons5,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5 },
          21.9,
        );
        // one full rotation…
        tl.to(orbit, { t: 1, duration: 2.0, ease: "none", onUpdate: placeOrbit }, 22.3);
        // …then the rope unrolls onto the line, 1 first, 7 last
        tl.to(morph, { p: 1, duration: 1.6, ease: "none", onUpdate: placeMorph }, 24.3);
        // ── hold the lined-up process ── 25.5–26.5

        // ── scene 6: the finale. The process COLLAPSES into a single glowing
        //    dot — everything condensing into one idea — which pops into the
        //    first quote; then you scroll THROUGH it (it scales past the
        //    camera, blurring) and the last word resolves from the depth. ─────
        tl.to(icons5, { x: 0, y: 0, scale: 0.3, duration: 1.0, ease: "power1.in" }, 26.5);
        tl.to(icons5, { autoAlpha: 0, duration: 0.3 }, 27.3);
        tl.fromTo(
          ideaDot,
          { scale: 0, autoAlpha: 1 },
          { scale: 1, duration: 1.0, ease: "power2.in", immediateRender: true },
          26.7,
        );
        // the idea pops…
        tl.to(ideaDot, { scale: 1.8, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 27.6);
        // …into existence
        tl.set(quote1Layer, { autoAlpha: 1 }, 27.6);
        tl.fromTo(
          q1Lines,
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: 0.6,
            stagger: 0.09,
            ease: "power3.out",
            immediateRender: true,
          },
          27.7,
        );

        // ── hold quote 1 ── 28.6–29.3

        // push-through: quote 1 sails past the camera, quote 2 resolves behind
        tl.to(
          q1Block,
          { scale: 2.3, autoAlpha: 0, filter: "blur(10px)", duration: 1.2, ease: "power1.in" },
          29.3,
        );
        tl.set(quote2Layer, { autoAlpha: 1 }, 29.5);
        tl.fromTo(
          q2Block,
          { scale: 0.82, autoAlpha: 0, filter: "blur(8px)" },
          {
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 1.3,
            ease: "power1.out",
            immediateRender: true,
          },
          29.6,
        );
        // the final word settles — hold with a whisper of lift to the unpin
        tl.to(quote2Layer, { y: () => window.innerHeight * -0.012, duration: 0.8 }, 31.1);

        // Tanker loads async and changes phrase widths — re-measure the
        // function-based travel once fonts settle.
        document.fonts?.ready.then(() => ScrollTrigger.refresh());

        // matchMedia cleanup — stop the autoplay shuffle, tear down the
        // load-intro and drop its listener (in case it never fired)
        return () => {
          window.clearInterval(shuffle);
          window.removeEventListener("loader:done", startIntro);
          intro.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // settled final state, no pin, nothing moves
        gsap.set(frame, { scale: 0.8 });
        gsap.set([phraseA, phraseB], { autoAlpha: 0 });
        gsap.set(photos[photos.length - 1], { autoAlpha: 1 });
        gsap.set(nameLayer, { autoAlpha: 1 });
        gsap.set(letters, { yPercent: 0 });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="me"
      data-header-dark
      // no bg override: the section inherits .hero-dark's #06080c — the SAME
      // canvas as the footer/home hero, so the section→footer seam is
      // invisible by construction (a custom darker hex left a visible band).
      className="hero-dark relative flex h-svh items-center justify-center overflow-hidden"
    >
      {/* the real heading for readers + SEO; everything animated is decorative */}
      <h1 className="sr-only">Hey! That&rsquo;s my name — Riddhiman Deb</h1>
      <p className="sr-only">22 years of experience dreaming about tech.</p>
      <p className="sr-only">
        Design is changing. For years, designers owned the interface while
        engineers owned the product. AI is collapsing that boundary.
      </p>
      <p className="sr-only">
        My process: research, define, constraints, design, build, feedback,
        reiterate fast. Ideas deserve more than prototypes — they deserve to
        exist. I don&rsquo;t just want to design the future of products. I want
        to help build it.
      </p>

      {/* the portrait frame — scales/drifts; photos crossfade inside */}
      <div
        aria-hidden="true"
        data-frame
        className="relative aspect-[2/3] h-[38svh] overflow-hidden md:h-[46svh]"
      >
        {PHOTOS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            data-photo
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={i > 0 ? { opacity: 0, visibility: "hidden" } : undefined}
          />
        ))}
      </div>

      {/* traveling phrases — each on its own full-bleed centering layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        <div
          data-phrase-a
          className="whitespace-nowrap uppercase leading-none tracking-[0.01em] text-[clamp(2.6rem,5.8vw,7.5rem)]"
          style={{ ...tanker, color: "#4a4a4a", opacity: 0, visibility: "hidden" }}
        >
          Hey! That&rsquo;s
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        <div
          data-phrase-b
          className="whitespace-nowrap uppercase leading-none tracking-[0.01em] text-[clamp(2.6rem,5.8vw,7.5rem)]"
          style={{ ...tanker, color: "#4a4a4a", opacity: 0, visibility: "hidden" }}
        >
          My Name
        </div>
      </div>

      {/* the name — masked per-letter rise, centered over the photo */}
      <div
        aria-hidden="true"
        data-name
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div
          className="flex gap-[0.35em] uppercase leading-none tracking-[0.01em] text-white text-[clamp(2.1rem,4.8vw,6.25rem)]"
          style={tanker}
        >
          {NAME_WORDS.map((word) => (
            <span key={word} className="flex">
              {word.split("").map((letter, i) => (
                <span key={i} className="inline-block overflow-hidden">
                  <span data-name-letter className="inline-block">
                    {letter}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* scene 2 — "22 years" wipes in from the left, the ending video slides
          in from the right; they meet as one centered composition */}
      <div
        aria-hidden="true"
        data-scene2
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-[clamp(1.5rem,4vw,3.5rem)]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div
          className="uppercase leading-[1.04] tracking-[0.01em] text-white text-[clamp(1.7rem,4.6vw,5.5rem)]"
          style={tanker}
        >
          {YEARS_LINES.map((line) => (
            <div key={line} className="overflow-hidden">
              <div data-line22>{line}</div>
            </div>
          ))}
        </div>
        <div
          data-video22
          className="relative aspect-[368/464] w-[clamp(150px,19vw,300px)] overflow-hidden"
        >
          <video
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/about/ending.webm" type="video/webm" />
            <source src="/about/ending.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* scene 3a — the scattered word cloud (storyboard frame A anchors).
          Sits BELOW the frame card (z-[9] vs z-10) so the words duck behind
          it as they cross — the card's opaque bg does the covering. */}
      <div
        aria-hidden="true"
        data-scene3-words
        className="pointer-events-none absolute inset-0 z-[9]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        {SCENE3_WORDS.map((w) => (
          <div
            key={w.text}
            data-word3
            className="absolute whitespace-nowrap uppercase leading-none tracking-[0.01em] text-white text-[clamp(1.8rem,4.4vw,5.2rem)]"
            style={{ ...tanker, left: w.left, top: w.top, opacity: 0, visibility: "hidden" }}
          >
            {w.text}
          </div>
        ))}
      </div>

      {/* scene 3b — the game-thumbnail card: grows from its dock beside BUILD
          to a centered 16:9 link. Live particles = The Other Hand's default
          state. Links to the project page on /play (built later). */}
      <div
        data-scene3-frame
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <Link
          href={"/play" as Route}
          data-frame3
          aria-label="Play The Other Hand — an AI experiment"
          // NOT 16:9 — height is set so the card's TOP edge slices through
          // NOW I's row (0.431ih) the way its bottom edge slices PRODUCT
          // EXPERIENCES' row. The growth tween offsets it +5.35svh below
          // center to hold both cuts.
          className="group pointer-events-auto relative block h-[22svh] w-[clamp(220px,21vw,380px)] cursor-pointer bg-bg"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <GameThumb className="absolute inset-0 h-full w-full" />
          {/* hover affordance: hairline lights up white */}
          <div
            data-frame3-border
            className="pointer-events-none absolute inset-0 border border-white/25 transition-colors duration-300 group-hover:border-white/90"
          />
          <span
            data-play
            className="pointer-events-none absolute inset-0 flex items-center justify-center uppercase leading-none tracking-[0.01em] text-white/85 transition-[color,text-shadow] duration-300 group-hover:text-white group-hover:[text-shadow:0_0_28px_rgba(255,255,255,0.5)] text-[clamp(1.5rem,3.2vw,3.6rem)]"
            style={{ ...tanker, opacity: 0, visibility: "hidden" }}
          >
            Play?
          </span>
        </Link>
      </div>

      {/* scene 3c — the punchline */}
      <div
        aria-hidden="true"
        data-nvm
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center uppercase leading-[1.1] tracking-[0.01em] text-white text-[clamp(1.7rem,3.5vw,4rem)]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        {NVM_LINES.map((line) => (
          <div key={line} data-nvm-line style={tanker}>
            {line}
          </div>
        ))}
      </div>

      {/* scene 4a — DESIGN IS / CHANGING + the boundary hairline. The halves
          start stacked at center (GSAP), pull apart into one row, and the
          rule draws/collapses between them. */}
      <div
        aria-hidden="true"
        data-scene4
        className="pointer-events-none absolute inset-0 z-10"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div
          data-d4-line1
          className="absolute left-1/2 top-1/2 overflow-hidden whitespace-nowrap uppercase leading-none tracking-[0.01em] text-white text-[clamp(2.2rem,5vw,6rem)]"
          style={tanker}
        >
          <span data-d4-inner1 className="inline-block">
            Design is
          </span>
        </div>
        <div
          data-d4-line2
          className="absolute left-1/2 top-1/2 overflow-hidden whitespace-nowrap uppercase leading-none tracking-[0.01em] text-white text-[clamp(2.2rem,5vw,6rem)]"
          style={tanker}
        >
          <span data-d4-inner2 className="inline-block">
            Changing
          </span>
        </div>
        <div
          data-d4-rule
          className="absolute left-1/2 top-1/2 w-px bg-white"
          style={{ height: "clamp(80px,10vw,150px)" }}
        />
      </div>

      {/* scene 4b — the thesis paragraph, masked line wipes */}
      <div
        aria-hidden="true"
        data-scene4-para
        className="pointer-events-none absolute inset-0 z-10 flex items-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div
          className="pl-[10vw] uppercase leading-[1.08] text-white text-[clamp(1.7rem,3.6vw,4.6rem)]"
          style={tanker}
        >
          {PARA_LINES.map((line) => (
            <div key={line} className="overflow-hidden">
              <div data-para-line>{line}</div>
            </div>
          ))}
        </div>
      </div>

      {/* scene 5 — the process: icons orbit once, then line up in order */}
      <div
        aria-hidden="true"
        data-scene5
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        {PROCESS.map((p) => (
          // the SVGs are complete lockups — icon + label baked in (frame 7
          // already reads "Reiterate fast") — so no HTML labels here
          <div
            key={p.label}
            data-icon5
            className="absolute left-1/2 top-1/2"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt=""
              draggable={false}
              className="h-[clamp(56px,8.5vh,92px)] w-auto"
            />
          </div>
        ))}
        {/* the idea — everything the process condenses into */}
        <div
          data-idea-dot
          className="absolute h-4 w-4 rounded-full bg-white"
          style={{
            opacity: 0,
            visibility: "hidden",
            boxShadow: "0 0 28px 8px rgba(255,255,255,0.55)",
          }}
        />
      </div>

      {/* scene 6 — the closing quotes */}
      <div
        aria-hidden="true"
        data-quote1
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div
          data-q1-block
          className="text-center uppercase leading-[1.06] tracking-[0.01em] text-white text-[clamp(2rem,4.3vw,5.4rem)]"
          style={tanker}
        >
          {QUOTE1_LINES.map((line) => (
            <div key={line} className="overflow-hidden">
              <div data-q1-line>{line}</div>
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        data-quote2
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div
          data-q2-block
          className="text-center uppercase leading-[1.06] tracking-[0.01em] text-white text-[clamp(1.9rem,4vw,5rem)]"
          style={tanker}
        >
          {QUOTE2_LINES.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
