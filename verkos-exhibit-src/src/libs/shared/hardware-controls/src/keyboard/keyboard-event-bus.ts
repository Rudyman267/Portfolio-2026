import {
  KeyboardEventType,
  IKeyboardEvent,
  KeyboardEventListener,
  KeyboardEventPriority,
  IKeyboardPressEvent,
} from './types/keyboard-events';

/**
 * Central event bus for keyboard events
 *
 * Distributes keyboard events to all registered listeners
 * with priority-based ordering. Higher priority listeners
 * run first and can mark events as handled to stop propagation.
 *
 * Features:
 * - Priority-based listener ordering
 * - Stop propagation via markHandled()
 * - Error isolation (failed listener doesn't crash others)
 * - Debug logging support
 *
 * Note: Does NOT extend EventEmitter3 to avoid import issues
 */
export class KeyboardEventBus {
  /** Listeners organized by event type, sorted by priority */
  private listeners = new Map<KeyboardEventType, KeyboardEventListener[]>();

  /**
   * Register a keyboard event listener with priority
   *
   * @param eventType - Type of keyboard event to listen for
   * @param handler - Event handler function
   * @param priority - Priority level (higher = runs first, default: 100)
   * @param context - Debug context string (e.g., 'CesiumEventsManager')
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsub = eventBus.register(
   *   KeyboardEventType.KEY_DOWN,
   *   (event) => console.log('Key pressed:', event.key),
   *   500,  // HIGH priority
   *   'MapLibrary'
   * );
   *
   * // Later: unsubscribe
   * unsub();
   * ```
   */
  register(
    eventType: KeyboardEventType,
    handler: (event: IKeyboardEvent) => void,
    priority: number = KeyboardEventPriority.NORMAL,
    context?: string
  ): () => void {
    // Create listener object
    const listener: KeyboardEventListener = {
      priority,
      handler,
      context,
    };

    // Get or create listener array for this event type
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listenerArray = this.listeners.get(eventType)!;

    // Add to array
    listenerArray.push(listener);

    // Sort by priority (highest first)
    // Example: [500, 100, 50] → map runs before app
    listenerArray.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => {
      const index = listenerArray.indexOf(listener);
      if (index > -1) {
        listenerArray.splice(index, 1);
      }
    };
  }

  /**
   * Emit a keyboard event to all registered listeners
   *
   * Listeners are called in priority order (highest first).
   * If a listener marks the event as handled, lower-priority
   * listeners are skipped.
   *
   * @param eventType - Type of keyboard event
   * @param event - Event data
   *
   * @example
   * ```typescript
   * // Event flow when user presses 'w':
   * // 1. Call mapHandler (priority KeyboardEventPriority.HIGH)
   * //    → Checks if entity focused
   * //    → Yes! Calls event.markHandled()
   * // 2. Check event.handled → TRUE
   * // 3. SKIP appHandler (priority 100)
   * // Result: Map handles, app doesn't
   * ```
   */
  emitKeyboardEvent(
    eventType: KeyboardEventType,
    event: IKeyboardEvent | IKeyboardPressEvent
  ): void {
    // Get listener array for this event type
    const listenerArray = this.listeners.get(eventType);

    // No listeners? Nothing to do
    if (!listenerArray || listenerArray.length === 0) {
      return;
    }

    // Call listeners in priority order
    for (let i = 0; i < listenerArray.length; i++) {
      const listener = listenerArray[i];

      try {
        // Call listener handler
        listener.handler(event);

        // Check if event was marked as handled
        if (event.handled) {
          // Stop propagation to lower-priority listeners
          break;
        }
      } catch (error) {
        // Log error but don't throw (don't let one broken listener crash app)
        console.error(
          `[KeyboardEventBus] Error in listener (${
            listener.context || 'unknown'
          }):`,
          error
        );
        // Continue to next listener
      }
    }
  }

  /**
   * Get all registered listeners for debugging
   *
   * @param eventType - Optional filter by event type
   * @returns Map of listeners by event type
   */
  getListeners(
    eventType?: KeyboardEventType
  ): Map<KeyboardEventType, KeyboardEventListener[]> {
    if (eventType) {
      const listeners = this.listeners.get(eventType);
      return new Map([[eventType, listeners || []]]);
    }
    return new Map(this.listeners);
  }

  /**
   * Clear all listeners for a specific event type
   *
   * @param eventType - Event type to clear
   */
  clearListeners(eventType: KeyboardEventType): void {
    this.listeners.delete(eventType);
  }

  /**
   * Clear all listeners for all event types
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}
