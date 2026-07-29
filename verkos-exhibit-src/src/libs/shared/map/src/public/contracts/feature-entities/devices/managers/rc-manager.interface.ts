import { IRCMarker, IRCMarkerOptions } from '@map/public';

/**
 * Interface for the RC manager
 * This manager handles creation and retrieval of RC marker entities
 * Following the manager pattern, it only provides create, get, and clear methods
 */
export interface IRCManager {
  /**
   * Create a new RC marker
   * @param options Configuration options for the RC marker
   * @returns The created RC marker
   */
  createRCMarker(options: IRCMarkerOptions): IRCMarker;

  /**
   * Get an RC marker by its ID
   * @param id The ID of the RC marker to retrieve
   * @returns The RC marker or undefined if not found
   */
  getRCMarker(id: string): IRCMarker | undefined;

  /**
   * Remove an RC marker by its ID
   * @param id The ID of the RC marker to remove
   */
  removeRCMarker(id: string): void;

  /**
   * Clear all RC markers
   * Removes all RC markers from the map and registry
   */
  clearAll(): void;
}
