/**
 * Simple single-entity keyboard focus manager for Cesium entities.
 *
 * Map-side keyboard handling needs a single "target" entity to receive keyboard events,
 * similar to how mouse events are targeted via picking.
 *
 * Focus is managed by CesiumEventsManager (e.g., on click).
 */
export class KeyboardFocusManager {
  private focusedEntityId: string | null = null;

  setFocus(entityId: string): void {
    this.focusedEntityId = entityId;
  }

  clearFocus(): void {
    this.focusedEntityId = null;
  }

  getFocusedEntityId(): string | null {
    return this.focusedEntityId;
  }

  hasFocus(entityId: string): boolean {
    return this.focusedEntityId === entityId;
  }
}
