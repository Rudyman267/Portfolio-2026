"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * On-screen analogue stick — MOBILE ONLY.
 *
 * WHY IT EXISTS: the piece was built for a gamepad stick, and on a phone the
 * only input was "drag your finger inside the disc". That has two problems the
 * stick doesn't: the finger COVERS the thing you are supposed to be watching,
 * and the disc sits high on the screen where the thumb cannot comfortably reach.
 * A stick parked in the bottom third — where the thumb already rests — leaves
 * the disc unobstructed and gives the same direction+force a gamepad does.
 *
 * It reports a UNIT-CIRCLE vector, not a screen position, which is why
 * BallController feeds it straight into the same rawX/rawY a gamepad axis fills
 * (see `setJoystick`). Holding it off-centre also counts as the press, since a
 * phone has no separate button.
 *
 * Interaction detail worth keeping: the stick RE-CENTRES ON THE TOUCH POINT.
 * Pressing anywhere inside the pad moves the base under your thumb rather than
 * snapping the thumb to a fixed centre — that is what makes it feel like a stick
 * instead of a d-pad, and it means the control works wherever the thumb lands.
 */

type Props = {
  /** unit-circle vector + whether a thumb is currently on the stick */
  onChange: (x: number, y: number, active: boolean) => void;
  /** fired once on engage, for a confirmation tick */
  onEngage?: () => void;
};

/** Visual radius of the travel ring, in px. */
const RING = 56;
/** How far the knob can leave the centre, in px. */
const THROW = RING - 14;

export function Joystick({ onChange, onEngage }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);
  // Latest onChange without re-arming the listeners on every render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const release = useCallback(() => {
    pointerIdRef.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    onChangeRef.current(0, 0, false);
  }, []);

  const move = useCallback((clientX: number, clientY: number, ox: number, oy: number) => {
    let dx = clientX - ox;
    let dy = clientY - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > THROW) {
      // clamp to the ring so the knob never leaves its track
      dx = (dx / dist) * THROW;
      dy = (dy / dist) * THROW;
    }
    setKnob({ x: dx, y: dy });
    // normalise to the unit circle — this is the gamepad-equivalent output
    onChangeRef.current(dx / THROW, dy / THROW, true);
  }, []);

  /**
   * Listeners live on `window`, not the pad, so a thumb that slides OFF the pad
   * mid-gesture keeps steering instead of dropping input the moment it crosses
   * the element's edge — which is exactly when you are pushing hardest.
   */
  useEffect(() => {
    if (!origin) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      e.preventDefault();
      move(e.clientX, e.clientY, origin.x, origin.y);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      release();
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [origin, move, release]);

  const engaged = origin !== null;

  return (
    <div
      ref={padRef}
      // `touch-action: none` is load-bearing — without it the browser claims the
      // drag for page scrolling and the stick receives nothing.
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        if (pointerIdRef.current !== null) return;
        pointerIdRef.current = e.pointerId;
        // Re-centre on the touch point (see the note at the top).
        const o = { x: e.clientX, y: e.clientY };
        setOrigin(o);
        setKnob({ x: 0, y: 0 });
        onChangeRef.current(0, 0, true);
        onEngage?.();
      }}
      // The pad is a generous invisible catch area; the visible ring is smaller.
      className="relative flex h-[132px] w-[132px] shrink-0 select-none items-center justify-center"
      aria-label="Movement stick"
      role="application"
    >
      {/* travel ring */}
      <span
        aria-hidden
        className={`absolute rounded-full border transition-colors duration-200 ${
          engaged ? "border-white/30" : "border-white/15"
        }`}
        style={{ width: RING * 2, height: RING * 2 }}
      />
      {/* faint crosshair so the rest position reads as a control, not a smudge */}
      <span
        aria-hidden
        className="absolute rounded-full bg-white/10"
        style={{ width: 3, height: 3 }}
      />
      {/* the knob */}
      <span
        aria-hidden
        className={`absolute rounded-full backdrop-blur-sm transition-colors duration-200 ${
          engaged ? "bg-white/80" : "bg-white/35"
        }`}
        style={{
          width: 42,
          height: 42,
          // no CSS transition on transform: this must track the thumb 1:1, and
          // any easing here reads as input lag
          transform: `translate(${knob.x}px, ${knob.y}px)`,
        }}
      />
    </div>
  );
}
