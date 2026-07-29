/**
 * Raw keyboard event data extracted from native KeyboardEvent
 */
export interface IKeyboardEventData {
  /** The key value (e.g., 'w', 'Enter', 'Escape') */
  key: string;
  /** The physical key code (e.g., 'KeyW', 'Enter', 'Escape') */
  code: string;
  /** Whether Ctrl key was pressed */
  ctrlKey: boolean;
  /** Whether Shift key was pressed */
  shiftKey: boolean;
  /** Whether Alt/Option key was pressed */
  altKey: boolean;
  /** Whether Command (Mac) / Windows key was pressed */
  metaKey: boolean;
  /** Whether this is a key repeat event (browser's native repeat) */
  repeat: boolean;
  /** Timestamp when event occurred */
  timestamp: number;
}

/**
 * Keyboard event with handling coordination methods
 *
 * This wrapper adds coordination methods to enable priority-based
 * event handling across multiple listeners.
 */
export interface IKeyboardEvent extends IKeyboardEventData {
  /** Whether this event has been marked as handled */
  handled: boolean;

  /**
   * Mark this event as handled
   * Stops propagation to lower-priority listeners
   */
  markHandled: () => void;

  /**
   * Prevent browser's default behavior for this key
   * (e.g., prevent page scroll on arrow keys)
   */
  preventDefault: () => void;

  /**
   * Stop event from bubbling up DOM tree
   */
  stopPropagation: () => void;
}

/**
 * Extended keyboard event for KEY_PRESS (continuous) events
 *
 * KEY_PRESS events are emitted at 60 FPS while keys are held down.
 * They include additional data for smooth, frame-independent movement.
 */
export interface IKeyboardPressEvent extends IKeyboardEvent {
  /** Array of all currently pressed keys (e.g., ['w', 'd', 'shift']) */
  pressedKeys: string[];

  /** Time since last KEY_PRESS event in seconds*/
  deltaTime: number;
}

/**
 * Keyboard event types
 */
export enum KeyboardEventType {
  /** Discrete key press (emitted ONCE per key, no browser repeats) */
  KEY_DOWN = 'KEY_DOWN',

  /** Discrete key release */
  KEY_UP = 'KEY_UP',

  /** Continuous event (60 FPS while keys held, includes pressedKeys array) */
  KEY_PRESS = 'KEY_PRESS',
}

/**
 * Priority levels for keyboard event handlers
 * Higher priority = runs first
 */
export enum KeyboardEventPriority {
  /** Critical system handlers */
  HIGHEST = 1000,

  /** Map entity controls (when entity has focus) */
  HIGH = 500,

  /** Application-level shortcuts */
  NORMAL = 100,

  /** Global shortcuts */
  LOW = 50,

  /** Fallback handlers */
  LOWEST = 0,
}

/**
 * Keyboard event listener with priority
 */
export type KeyboardEventListener = {
  /** Priority level (higher runs first) */
  priority: number;

  /** Event handler function */
  handler: (event: IKeyboardEvent) => void;

  /** Debug context string (e.g., 'CesiumEventsManager', 'MissionPlanner') */
  context?: string;
};

/**
 * Event map for typed event emitter
 */
export type KeyboardEventMap = {
  [KeyboardEventType.KEY_DOWN]: (event: IKeyboardEvent) => void;
  [KeyboardEventType.KEY_UP]: (event: IKeyboardEvent) => void;
  [KeyboardEventType.KEY_PRESS]: (event: IKeyboardEvent) => void;
};

/**
 * Type guard to check if event is a KEY_PRESS event
 *
 * @param event - Keyboard event to check
 * @returns true if event is a KEY_PRESS event with pressedKeys and deltaTime
 */
export function isKeyboardPressEvent(
  event: IKeyboardEvent
): event is IKeyboardPressEvent {
  return 'pressedKeys' in event && 'deltaTime' in event;
}
