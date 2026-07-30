import { MovementIntent, Vector2 } from './types';
import { PHY } from './constants';

export class BallController {
  private lastPressTime: number = 0;
  private pressStartTime: number = 0;
  private isPressed: boolean = false;
  private gamepadIndex: number | null = null;
  
  // Smoothing buffers
  private lastVectors: Vector2[] = [];

  // Mouse tracking states
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMouseDown: boolean = false;
  private isMouseActive: boolean = false;

  // Disc geometry in viewport px — overwritten by setBounds(). Defaults match
  // the original's assumption so the class still works standalone.
  private centerX: number = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  private centerY: number = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
  private radius: number = 180;
  
  constructor() {
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad.id);
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener("gamepaddisconnected", () => {
      console.log("Gamepad disconnected");
      this.gamepadIndex = null;
    });

    // ── Mouse & Touch ─────────────────────────────────────────────────────
    // PORTFOLIO CHANGE (touch support). Three problems with the original on a
    // phone, all of which made the piece unplayable there:
    //   1. `isMouseActive` was only cleared by `pointerleave`, which touch
    //      never fires — so after one tap the last finger position stuck and
    //      the AI read a permanent input it could not escape.
    //   2. Hover does not exist on touch, so "follow the pointer" has no
    //      meaning. Touch must be CLICK-AND-DRAG: input only while held.
    //   3. The hit zone was a hardcoded 180px radius around the WINDOW centre,
    //      but the disc is `min(360px, 74vw)` and is not vertically centred in
    //      the page. See setBounds() — the component now feeds the real rect.
    const isTouch = (e: PointerEvent) => e.pointerType !== "mouse";

    const handlePointerMove = (e: PointerEvent) => {
      // On touch, only track while the finger is down (drag).
      if (isTouch(e) && !this.isMouseDown) return;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isMouseActive = true;
    };
    const handlePointerDown = (e: PointerEvent) => {
      // touch/pen report button 0 too, but be explicit about primary only
      if (e.button !== 0 && !isTouch(e)) return;
      this.isMouseDown = true;
      // A tap should register immediately, not wait for the first move.
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isMouseActive = true;
    };
    const handlePointerUp = (e: PointerEvent) => {
      this.isMouseDown = false;
      // Releasing a finger ends the interaction outright — otherwise the last
      // position keeps driving the sim (there is no hover to fall back to).
      if (isTouch(e)) this.isMouseActive = false;
    };
    const handlePointerLeave = () => {
      this.isMouseActive = false;
      this.isMouseDown = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
  }

  /**
   * The disc's real position + radius in viewport pixels.
   *
   * The original assumed a 360px disc centred in the window. In the portfolio
   * the disc is responsive (`min(360px, 74vw)`) and sits above the caption and
   * volume bar, so both the centre and the radius differ — most visibly on a
   * phone, where the hit zone would otherwise sit off the disc entirely.
   * OtherHandGame feeds this from a ResizeObserver.
   */
  public setBounds(cx: number, cy: number, radius: number) {
    this.centerX = cx;
    this.centerY = cy;
    this.radius = radius;
  }

  public poll(): MovementIntent {
    let rawX = 0;
    let rawY = 0;
    let btnPressed = false;
    let doublePress = false;

    // 1. Poll Gamepad
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        // Standard mapping: Left stick
        rawX = gp.axes[0];
        rawY = gp.axes[1];
        // Button 0 (A/Cross) or 1 (B/Circle)
        btnPressed = gp.buttons[0].pressed || gp.buttons[1].pressed;
      }
    } else {
        // Fallback for debugging without controller (Arrow Keys)
        // In a real deployment, we might disable this to enforce hardware requirements
        if ((window as any).keys) {
            const k = (window as any).keys;
            if (k.ArrowUp) rawY = -1;
            if (k.ArrowDown) rawY = 1;
            if (k.ArrowLeft) rawX = -1;
            if (k.ArrowRight) rawX = 1;
            if (k.Space) btnPressed = true;
        }
    }

    // 2. Poll Mouse/Pointer (only while active and inside the disc).
    //    Geometry comes from setBounds() — the disc is responsive and is not
    //    at the window centre, so the old hardcoded 180px/window-centre hit
    //    zone missed it entirely on a phone.
    if (this.isMouseActive) {
      const dx = this.mouseX - this.centerX;
      const dy = this.mouseY - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.radius) {
        // Map distance to a [-1, 1] range vector
        rawX = dx / this.radius;
        rawY = dy / this.radius;
        btnPressed = btnPressed || this.isMouseDown;
      }
    }

    // 3. Deadzone Processing
    if (Math.abs(rawX) < PHY.DEADZONE) rawX = 0;
    if (Math.abs(rawY) < PHY.DEADZONE) rawY = 0;

    // 3. Press Logic
    if (btnPressed && !this.isPressed) {
      // Just pressed down
      const now = Date.now();
      if (now - this.lastPressTime < PHY.DOUBLE_PRESS_WINDOW) {
        doublePress = true;
      }
      this.pressStartTime = now;
      this.isPressed = true;
    } else if (!btnPressed && this.isPressed) {
      // Released
      this.lastPressTime = Date.now();
      this.isPressed = false;
    }

    const pressDuration = this.isPressed ? Date.now() - this.pressStartTime : 0;

    // 4. Vector Calculations
    const magnitude = Math.sqrt(rawX * rawX + rawY * rawY);
    const normalizedForce = Math.min(magnitude, 1.0);
    
    // Confidence calculation (inverse of jitter)
    this.lastVectors.push({ x: rawX, y: rawY });
    if (this.lastVectors.length > 10) this.lastVectors.shift();
    
    // Simple confidence metric: how consistent is the direction?
    // (Omitted complex variance math for brevity, using magnitude as proxy for intent strength)
    const confidence = normalizedForce > 0.5 ? 1 : 0.5;

    return {
      vector: { x: rawX, y: rawY },
      force: normalizedForce,
      isPressing: this.isPressed,
      pressDuration,
      isDoublePress: doublePress,
      confidence
    };
  }
  
  // Haptic feedback trigger
  public vibrate(duration: number, weak: number, strong: number) {
    if (this.gamepadIndex !== null) {
        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (gp && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weak,
                strongMagnitude: strong,
            }).catch(() => {}); // Ignore errors if not supported
        }
    }
  }
}