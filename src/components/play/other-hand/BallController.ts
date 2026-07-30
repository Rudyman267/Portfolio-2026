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
  
  constructor() {
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad.id);
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener("gamepaddisconnected", () => {
      console.log("Gamepad disconnected");
      this.gamepadIndex = null;
    });

    // Mouse & Touch support
    const handlePointerMove = (e: PointerEvent) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isMouseActive = true;
    };
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) { // Primary click
        this.isMouseDown = true;
      }
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    };
    const handlePointerLeave = () => {
      this.isMouseActive = false;
      this.isMouseDown = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointerleave", handlePointerLeave);
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

    // 2. Poll Mouse/Pointer (Only if active and inside the circular frame)
    if (this.isMouseActive) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dx = this.mouseX - centerX;
      const dy = this.mouseY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // The circular frame's radius is 180px (360px diameter)
      if (distance <= 180) {
        // Map distance to a [-1, 1] range vector
        rawX = dx / 180;
        rawY = dy / 180;
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