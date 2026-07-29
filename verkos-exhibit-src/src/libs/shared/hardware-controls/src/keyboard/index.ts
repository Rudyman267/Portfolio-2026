/**
 * Shared Keyboard Infrastructure
 *
 * Provides a unified keyboard event system for the entire application.
 * Both the map library and the application can consume this shared infrastructure.
 *
 * @example Basic Usage
 * ```typescript
 * import { KeyboardManager, KeyboardEventType, KeyboardEventPriority } from '@flytbase/shared/hardware-controls/keyboard';
 *
 * // 1. Initialize once during app startup
 * const keyboardManager = KeyboardManager.getInstance();
 * keyboardManager.initialize();
 *
 * // 2. Subscribe to events (high priority - e.g., map library)
 * const unsubscribe = keyboardManager.eventBus.register(
 *   KeyboardEventType.KEY_DOWN,
 *   (event) => {
 *     if (entityFocused && isMovementKey(event.key)) {
 *       event.markHandled();
 *       event.preventDefault();
 *       // Handle movement...
 *     }
 *   },
 *   KeyboardEventPriority.HIGH,
 *   'MapLibrary'
 * );
 *
 * // 3. Cleanup when done
 * unsubscribe();
 * ```
 */

// Core manager
export { KeyboardManager } from './keyboard-manager';

// Event bus
export { KeyboardEventBus } from './keyboard-event-bus';

// State tracking
export { KeyboardStateTracker } from './keyboard-state-tracker';

// Types - Events
export type {
  IKeyboardEventData,
  IKeyboardEvent,
  IKeyboardPressEvent,
  KeyboardEventListener,
  KeyboardEventMap,
  KeyboardManagerConfig,
} from './types';

export {
  KeyboardEventType,
  KeyboardEventPriority,
  isKeyboardPressEvent,
  DEFAULT_KEYBOARD_CONFIG,
} from './types';
