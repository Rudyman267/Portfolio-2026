/**
 * Configuration for KeyboardManager
 */
export interface KeyboardManagerConfig {
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Custom filter function to determine if an event should be ignored
   * Return true to ignore the event (e.g., when typing in input fields)
   *
   * @param event - Native KeyboardEvent
   * @returns true if event should be ignored
   */
  shouldIgnoreEvent?: (event: KeyboardEvent) => boolean;

  /**
   * Frequency in milliseconds for continuous key press events (KEY_PRESS)
   * @default 100
   */
  continuousEventFrequencyInMS?: number;
}

/**
 * Default configuration for KeyboardManager
 */
export const DEFAULT_KEYBOARD_CONFIG: Required<KeyboardManagerConfig> = {
  debug: false,

  shouldIgnoreEvent: (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return false;

    // Ignore events when typing in input fields, textareas, or contentEditable
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable === true
    );
  },

  continuousEventFrequencyInMS: 100,
};
