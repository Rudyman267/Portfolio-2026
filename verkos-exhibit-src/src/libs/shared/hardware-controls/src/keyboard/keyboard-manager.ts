import { KeyboardEventBus } from './keyboard-event-bus';
import { KeyboardStateTracker } from './keyboard-state-tracker';
import {
  IKeyboardEvent,
  IKeyboardEventData,
  IKeyboardPressEvent,
  KeyboardEventType,
} from './types/keyboard-events';
import {
  KeyboardManagerConfig,
  DEFAULT_KEYBOARD_CONFIG,
} from './types/keyboard-config';

/**
 * Singleton keyboard manager that coordinates all keyboard input
 *
 * This is the central hub that:
 * - Attaches a single window-level keyboard listener
 * - Distributes events via event bus
 * - Tracks keyboard state
 * - Manages continuous key press events (60 FPS)
 * - Deduplicates KEY_DOWN events (ignores browser repeat)
 * - Provides shared infrastructure for map and app
 *
 * Architecture:
 * - Single window listener (no canvas listeners)
 * - Event wrapping: native KeyboardEvent → IKeyboardEvent
 * - Priority-based distribution via event bus
 * - Continuous loop for smooth movement (requestAnimationFrame)
 *
 * Key Features (v1.1):
 * - Deduplication: KEY_DOWN only emits on FIRST press
 * - Simplified Loop Trigger: Starts when pressedKeyCount > 0
 * - Enhanced KEY_PRESS: Includes pressedKeys array
 * - Clean Stop: Loop stops when pressedKeyCount === 0
 */
export class KeyboardManager {
  /** Singleton instance */
  private static instance: KeyboardManager | null = null;

  /**
   * Get the singleton instance
   * Creates instance on first call
   *
   * @param config - Optional configuration (only used on first call)
   * @returns KeyboardManager singleton
   */
  static getInstance(config?: KeyboardManagerConfig): KeyboardManager {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager(config);
    }
    return KeyboardManager.instance;
  }

  /**
   * Reset the singleton (mainly for testing)
   * Disposes current instance and clears reference
   */
  static resetInstance(): void {
    if (KeyboardManager.instance) {
      KeyboardManager.instance.dispose();
      KeyboardManager.instance = null;
    }
  }

  // PUBLIC INSTANCES (Consumers access these)
  /** Event bus for priority-based event distribution */
  public readonly eventBus: KeyboardEventBus;

  /** State tracker for querying which keys are currently pressed */
  public readonly stateTracker: KeyboardStateTracker;

  // PRIVATE STATE
  /** Configuration (merged with defaults) */
  private config: Required<KeyboardManagerConfig>;

  /** Whether window listener is attached */
  private isListenerAttached = false;

  /** Bound listener functions (for cleanup) */
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private keyupListener: ((e: KeyboardEvent) => void) | null = null;
  private blurListener: (() => void) | null = null;

  /** Continuous event loop state */
  private continuousIntervalId: number | null = null;
  private readonly intervalDuration: number; // ms per interval (1000 / FPS)

  /**
   * Private constructor (singleton pattern)
   * Creates event bus and state tracker
   *
   * @param config - Optional configuration
   */
  private constructor(config: KeyboardManagerConfig = {}) {
    // Merge with defaults
    this.config = { ...DEFAULT_KEYBOARD_CONFIG, ...config };

    this.intervalDuration = this.config.continuousEventFrequencyInMS;

    // Create public instances
    this.eventBus = new KeyboardEventBus();
    this.stateTracker = new KeyboardStateTracker();

    this.log('KeyboardManager instance created');
  }

  // PUBLIC API - LIFECYCLE
  /**
   * Initialize keyboard event listeners
   *
   * Attaches window-level listeners for keydown, keyup, and blur.
   * This should be called once during app initialization.
   * Multiple calls are safe (idempotent).
   */
  initialize(): void {
    // Guard: already initialized
    if (this.isListenerAttached) {
      this.log('Already initialized, skipping');
      return;
    }

    // Guard: SSR check
    if (typeof window === 'undefined') {
      console.warn('[KeyboardManager] Window not available');
      return;
    }

    this.log('Initializing window listeners...');

    // Create bound listener functions (bind 'this' context)
    this.keydownListener = (event: KeyboardEvent) => this.handleKeyDown(event);
    this.keyupListener = (event: KeyboardEvent) => this.handleKeyUp(event);
    this.blurListener = () => this.handleBlur();

    // Attach to window
    window.addEventListener('keydown', this.keydownListener);
    window.addEventListener('keyup', this.keyupListener);
    window.addEventListener('blur', this.blurListener);

    // Mark as attached
    this.isListenerAttached = true;

    this.log('Window listeners attached');
  }

  /**
   * Dispose of all resources and remove listeners
   */
  dispose(): void {
    if (!this.isListenerAttached) {
      return;
    }

    this.log('Disposing...');

    // Remove window event listeners
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }

    if (this.keyupListener) {
      window.removeEventListener('keyup', this.keyupListener);
      this.keyupListener = null;
    }

    if (this.blurListener) {
      window.removeEventListener('blur', this.blurListener);
      this.blurListener = null;
    }

    // Stop continuous loop and clear state
    this.stopContinuousEventLoop();
    this.stateTracker.clear();

    // Clear all event bus listeners
    this.eventBus.clearAllListeners();

    // Mark as not attached
    this.isListenerAttached = false;

    this.log('Disposed');
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<KeyboardManagerConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<KeyboardManagerConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('Configuration updated');
  }

  // PRIVATE - HELPERS
  /**
   * Check if a keyboard event has any modifier keys pressed
   *
   * @param event - Native KeyboardEvent
   * @returns true if Cmd/Ctrl/Alt/Shift is pressed
   */
  private hasModifierKeys(event: KeyboardEvent): boolean {
    return event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
  }

  /**
   * Clean up orphaned keys that were released without firing keyup
   *
   * This fixes the issue where modifier+key combinations (e.g., Cmd+Backspace)
   * don't fire keyup for the non-modifier key when it's released while the
   * modifier is still held.
   *
   * Strategy: Use the current event's modifier states as source of truth
   * to detect which modifier keys should actually be pressed.
   *
   * @param nativeEvent - Current keyboard event with accurate modifier states
   */
  private cleanupOrphanedKeys(nativeEvent: KeyboardEvent): void {
    const pressedKeys = this.stateTracker.getPressedKeys();

    if (pressedKeys.length === 0) {
      return; // Nothing to clean up
    }

    // Map of modifier key names to their event flags
    const modifierStates = {
      meta: nativeEvent.metaKey,
      control: nativeEvent.ctrlKey,
      alt: nativeEvent.altKey,
      shift: nativeEvent.shiftKey,
    };

    // Check each pressed key
    for (const key of pressedKeys) {
      if (key in modifierStates) {
        const shouldBePressed =
          modifierStates[key as keyof typeof modifierStates];

        if (!shouldBePressed) {
          this.log(`🧹 Cleaning up orphaned modifier: ${key}`);
          this.stateTracker.keyUp(key);
        }
      }
    }
  }

  /**
   * Clean up stale keys that have been pressed for too long
   *
   * This is a safety mechanism to remove keys that are stuck in the pressed state
   * because their keyup event was never fired (e.g., due to browser quirks with
   * modifier combinations like Cmd+Backspace).
   *
   * Uses different thresholds:
   * - Non-modifier keys: 1 second (likely orphaned if held this long)
   * - Modifier keys: 20 seconds (might be intentionally held)
   */
  private cleanupStaleKeys(): void {
    const modifierKeys = ['meta', 'control', 'alt', 'shift'];
    const nonModifierThreshold = 2 * 1000; // 2 seconds
    const modifierThreshold = 10 * 1000; // 10 seconds

    const pressedKeys = this.stateTracker.getPressedKeys();

    for (const key of pressedKeys) {
      const pressDuration = this.stateTracker.getKeyPressDuration(key);
      const isModifier = modifierKeys.includes(key);
      const threshold = isModifier ? modifierThreshold : nonModifierThreshold;

      if (pressDuration > threshold) {
        this.log(
          `🧹 Cleaning up stale ${isModifier ? 'modifier' : 'key'} ` +
            `(pressed for ${Math.round(pressDuration / 1000)}s): ${key}`
        );
        this.stateTracker.keyUp(key);
      }
    }
  }

  // PRIVATE - EVENT HANDLERS
  /**
   * Handle native keydown event from window
   *
   * Flow:
   * 1. Check if event should be ignored (typing in input, etc.)
   * 2. Clean up orphaned keys (keys that were released without keyup event)
   * 3. Check if key is ALREADY pressed:
   *    a. If pressed WITHOUT modifiers → SKIP (browser repeat)
   *    b. If pressed WITH modifiers → ALLOW (enables Cmd+Backspace repeated presses)
   * 4. If NEW press or modifier combo: emit KEY_DOWN, start loop
   *
   * @param nativeEvent - Native browser KeyboardEvent
   */
  private handleKeyDown(nativeEvent: KeyboardEvent): void {
    // Check if event should be ignored (typing in input fields, etc.)
    if (this.shouldIgnoreEvent(nativeEvent)) {
      this.log(`Ignoring keydown: ${nativeEvent.key} (typing in input)`);
      return;
    }

    // This handles the case where modifier+key combinations don't fire keyup
    // Example: Cmd+Backspace, release Backspace (no keyup!), release Cmd
    this.cleanupOrphanedKeys(nativeEvent);

    const key = nativeEvent.key.toLowerCase();
    const hasModifiers = this.hasModifierKeys(nativeEvent);
    const isAlreadyPressed = this.stateTracker.isKeyPressed(key);

    // Check if key is already pressed
    if (isAlreadyPressed) {
      // Refresh timestamp to prevent stale key cleanup
      this.stateTracker.refreshKeyTimestamp(key);

      // Allow key events with modifiers to bypass deduplication
      // This enables repeated Cmd+Backspace, Ctrl+C, etc. to work correctly
      if (!hasModifiers) {
        // No modifiers: This is a browser repeat event, skip it
        this.log(`Skipping keydown (already pressed, no modifiers): ${key}`);
        nativeEvent.preventDefault();
        return;
      } else {
        this.log(`Re-emitting KEY_DOWN (has modifiers): ${key}`);
      }
    } else {
      this.log(`KEY_DOWN (new): ${key}`);
    }

    // Track key state (adds to pressedKeys Set if not already there)
    this.stateTracker.keyDown(key);

    // Create wrapped event with coordination methods
    const keyboardEvent = this.createKeyboardEvent(nativeEvent);

    // Emit KEY_DOWN to event bus
    this.eventBus.emitKeyboardEvent(KeyboardEventType.KEY_DOWN, keyboardEvent);

    // Start continuous loop if ANY keys pressed
    if (this.stateTracker.getPressedKeyCount() > 0) {
      this.startContinuousEventLoop();
    }

    // Log if event was handled
    if (keyboardEvent.handled) {
      this.log(`Event handled: ${key}`);
    } else {
      this.log(`Event not handled: ${key}`);
    }
  }

  /**
   * Handle native keyup event from window
   *
   * 1. Check if event should be ignored
   * 2. Remove key from pressedKeys
   * 3. Emit KEY_UP event
   * 4. Check if pressedKeys is now EMPTY
   * 5. If empty: STOP continuous loop immediately
   *
   * @param nativeEvent - Native browser KeyboardEvent
   */
  private handleKeyUp(nativeEvent: KeyboardEvent): void {
    // Check if event should be ignored
    if (this.shouldIgnoreEvent(nativeEvent)) {
      return;
    }

    const key = nativeEvent.key.toLowerCase();

    this.log(`KEY_UP: ${key}`);

    // Track key state (removes from pressedKeys Set)
    this.stateTracker.keyUp(key);

    // Create wrapped event
    const keyboardEvent = this.createKeyboardEvent(nativeEvent);

    // Emit KEY_UP to event bus
    this.eventBus.emitKeyboardEvent(KeyboardEventType.KEY_UP, keyboardEvent);

    // Check if all keys have been released
    if (this.stateTracker.getPressedKeyCount() === 0) {
      // No keys pressed! Stop the continuous loop.
      this.stopContinuousEventLoop();
      this.log('All keys released - stopped continuous loop');
    }

    // Log if event was handled
    if (keyboardEvent.handled) {
      this.log(`Event handled: ${key}`);
    }
  }

  /**
   * Handle window blur (focus loss)
   *
   * When user switches tabs/windows, clear all key state
   * to prevent "stuck keys"
   */
  private handleBlur(): void {
    this.log('Window blur - clearing key state');

    // Clear all pressed keys
    this.stateTracker.clear();

    // Stop continuous event loop
    this.stopContinuousEventLoop();
  }

  /**
   * Create a keyboard event wrapper with coordination methods
   *
   * @param nativeEvent - Native browser KeyboardEvent
   * @returns Wrapped IKeyboardEvent
   */
  private createKeyboardEvent(nativeEvent: KeyboardEvent): IKeyboardEvent {
    // Extract key data from native event
    const eventData: IKeyboardEventData = {
      key: nativeEvent.key,
      code: nativeEvent.code,
      ctrlKey: nativeEvent.ctrlKey,
      shiftKey: nativeEvent.shiftKey,
      altKey: nativeEvent.altKey,
      metaKey: nativeEvent.metaKey,
      repeat: nativeEvent.repeat,
      timestamp: Date.now(),
    };

    // Track handled state in closure
    let handled = false;

    // Create wrapped event with coordination methods
    const keyboardEvent: IKeyboardEvent = {
      ...eventData,

      // Handled flag (exposed for checking)
      handled: false,

      // Mark as handled (stops propagation to lower-priority handlers)
      markHandled: () => {
        if (!handled) {
          handled = true;
          keyboardEvent.handled = true;
          this.log(`Event marked as handled: ${nativeEvent.key}`);
        }
      },

      // Prevent browser default behavior
      preventDefault: () => {
        nativeEvent.preventDefault();
        this.log(`preventDefault called: ${nativeEvent.key}`);
      },

      // Stop event from bubbling up DOM tree
      stopPropagation: () => {
        nativeEvent.stopPropagation();
        this.log(`stopPropagation called: ${nativeEvent.key}`);
      },
    };

    return keyboardEvent;
  }

  /**
   * Check if event should be ignored
   *
   * @param event - Native KeyboardEvent
   * @returns true if event should be ignored
   */
  private shouldIgnoreEvent(event: KeyboardEvent): boolean {
    // Use custom filter if provided
    if (this.config.shouldIgnoreEvent) {
      return this.config.shouldIgnoreEvent(event);
    }

    return false;
  }

  /**
   * Start continuous event loop for held keys
   *
   * Uses setInterval to emit KEY_PRESS events at consistent intervals.
   * Provides predictable timing compared to requestAnimationFrame.
   *
   * Key Features:
   * - Loop runs when pressedKeyCount > 0 (any keys, not just movement)
   * - KEY_PRESS event includes pressedKeys array
   * - Includes deltaTime for frame-independent movement
   * - Consistent timing via setInterval (not tied to browser refresh rate)
   */
  private startContinuousEventLoop(): void {
    if (this.continuousIntervalId !== null) {
      return;
    }

    this.log('Starting continuous event loop (setInterval)');

    let lastEventTime = Date.now();

    // Define interval callback
    const emitContinuousEvent = () => {
      const now = Date.now();
      const deltaTime = (now - lastEventTime) / 1000; // Convert to seconds
      lastEventTime = now;

      const pressedKeyCount = this.stateTracker.getPressedKeyCount();

      // Check if we should stop the loop
      if (pressedKeyCount === 0) {
        this.stopContinuousEventLoop();
        return;
      }

      // Clean up stale/orphaned keys before getting the list
      // Non-modifier keys: 2 seconds (user likely released without keyup)
      // Modifier keys: 10 seconds (might be intentionally held)
      this.cleanupStaleKeys();

      // Get all currently pressed keys as array (after cleanup)
      const pressedKeys = this.stateTracker.getPressedKeys();

      this.log(
        `🔄 KEY_PRESS: [${pressedKeys.join(', ')}] (${pressedKeyCount} keys)`
      );

      // Create KEY_PRESS event with pressedKeys array
      const keyboardEvent: IKeyboardPressEvent = {
        key: pressedKeys.join('+'), // Combined string for display: "w+d"
        code: '',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        repeat: true, // This is a continuous event
        timestamp: now,
        handled: false,
        markHandled: () => {
          keyboardEvent.handled = true;
        },
        preventDefault: () => {
          /* No native event to prevent */
        },
        stopPropagation: () => {
          /* No native event to stop */
        },
        pressedKeys,
        deltaTime,
      };

      // Emit KEY_PRESS event to event bus
      this.eventBus.emitKeyboardEvent(
        KeyboardEventType.KEY_PRESS,
        keyboardEvent
      );
    };

    // Start interval with consistent timing
    this.continuousIntervalId = window.setInterval(
      emitContinuousEvent,
      this.intervalDuration
    ) as unknown as number;
  }

  /**
   * Stop continuous event loop
   */
  private stopContinuousEventLoop(): void {
    if (this.continuousIntervalId !== null) {
      window.clearInterval(this.continuousIntervalId);
      this.continuousIntervalId = null;
      this.log('Stopped continuous event loop');
    }
  }

  /**
   * Debug logging (only if debug enabled)
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[KeyboardManager] ${message}`);
    }
  }
}
