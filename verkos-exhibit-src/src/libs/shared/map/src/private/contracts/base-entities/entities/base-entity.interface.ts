import { MapEventEmitter } from '@map/private/contracts/events';

/**
 * Base interface for all map entities
 * Provides common identification properties
 */
export interface IBaseEntity {
  /**
   * Unique identifier for the entity
   */
  readonly id: string;

  /**
   * Get the event emitter instance (read-only)
   * @returns A read-only instance of the event emitter
   */
  getEventEmitter(): MapEventEmitter;
}
