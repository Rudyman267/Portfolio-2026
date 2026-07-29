/**
 * Tracks the state of pressed keys for continuous movement detection
 *
 * This is a pure state tracker with no framework dependencies,
 * making it reusable across any keyboard-driven application.
 *
 * Features:
 * - Track which keys are currently pressed
 * - Query key state at any time
 * - Track how long keys have been pressed
 * - Clear all keys (useful on window blur)
 */
export class KeyboardStateTracker {
  /** Set of currently pressed keys (normalized to lowercase) */
  private pressedKeys = new Set<string>();

  /** Map of key to timestamp when it was pressed */
  private keyTimestamps = new Map<string, number>();

  /**
   * Mark a key as pressed
   *
   * @param key - Key to mark as pressed (will be normalized to lowercase)
   */
  keyDown(key: string): void {
    const normalizedKey = key.toLowerCase();

    // Only set timestamp on first press (not on repeat)
    if (!this.pressedKeys.has(normalizedKey)) {
      this.pressedKeys.add(normalizedKey);
      this.keyTimestamps.set(normalizedKey, Date.now());
    }
  }

  /**
   * Update the timestamp of an already-pressed key
   *
   * This is used when we receive a keydown event for a key that's already
   * pressed (e.g., browser repeat or modifier combo). We update the timestamp
   * to prevent the key from being incorrectly marked as "stale".
   *
   * @param key - Key to refresh timestamp for (will be normalized to lowercase)
   */
  refreshKeyTimestamp(key: string): void {
    const normalizedKey = key.toLowerCase();

    // Only update if key is actually pressed
    if (this.pressedKeys.has(normalizedKey)) {
      this.keyTimestamps.set(normalizedKey, Date.now());
    }
  }

  /**
   * Mark a key as released
   *
   * @param key - Key to mark as released (will be normalized to lowercase)
   */
  keyUp(key: string): void {
    const normalizedKey = key.toLowerCase();
    this.pressedKeys.delete(normalizedKey);
    this.keyTimestamps.delete(normalizedKey);
  }

  /**
   * Check if a specific key is currently pressed
   *
   * @param key - Key to check (will be normalized to lowercase)
   * @returns true if key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  /**
   * Get all currently pressed keys
   *
   * @returns Array of currently pressed keys (lowercase)
   */
  getPressedKeys(): string[] {
    return Array.from(this.pressedKeys);
  }

  /**
   * Get how long a key has been pressed
   *
   * @param key - Key to check (will be normalized to lowercase)
   * @returns Duration in milliseconds, or 0 if key is not pressed
   */
  getKeyPressDuration(key: string): number {
    const normalizedKey = key.toLowerCase();
    const timestamp = this.keyTimestamps.get(normalizedKey);
    if (!timestamp) return 0;
    return Date.now() - timestamp;
  }

  /**
   * Clear all pressed keys
   *
   * Useful when window loses focus to prevent "stuck keys"
   * (user holds key, switches windows, releases key elsewhere)
   */
  clear(): void {
    this.pressedKeys.clear();
    this.keyTimestamps.clear();
  }

  /**
   * Get the number of currently pressed keys
   *
   * @returns Number of pressed keys
   */
  getPressedKeyCount(): number {
    return this.pressedKeys.size;
  }
}
