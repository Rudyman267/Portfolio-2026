import { IRCManager, IRCMarker, IRCMarkerOptions } from '@map/public';
import { RCMarker } from '../entities/rc-marker';
import { ICompositeManager } from '@map/private/contracts';

/**
 * Implementation of the RC manager
 * Manages creation and retrieval of RC marker entities
 */
export class RCManager implements IRCManager {
  /**
   * Registry to store RC markers
   * @private
   */
  private _rcMarkers: Map<string, IRCMarker>;

  /**
   * Constructor for RCManager
   * @param compositeManager The composite manager for creating composite entities
   */
  constructor(private _compositeManager: ICompositeManager) {
    this._rcMarkers = new Map();
  }

  /**
   * Create a new RC marker
   * @param options Configuration options for the RC marker
   * @returns The created RC marker
   */
  createRCMarker(options: IRCMarkerOptions): IRCMarker {
    // Create the RC marker with the FB marker
    const rcMarker = new RCMarker(this._compositeManager, options);

    // Store the RC marker in the registry
    this._rcMarkers.set(rcMarker.id, rcMarker);
    return rcMarker;
  }

  /**
   * Get an RC marker by its ID
   * @param id The ID of the RC marker to retrieve
   * @returns The RC marker or undefined if not found
   */
  getRCMarker(id: string): IRCMarker | undefined {
    return this._rcMarkers.get(id);
  }

  /**
   * Remove an RC marker by its ID
   * @param id The ID of the RC marker to remove
   */
  removeRCMarker(id: string): void {
    const rcMarker = this.getRCMarker(id);
    try {
      if (rcMarker) {
        rcMarker.remove();
        this._rcMarkers.delete(id);
      }
    } catch (error) {
      console.error(`Failed to remove RC marker ${id}:`, error);
    }
  }

  /**
   * Clear all RC markers
   * Removes all RC markers from the map and registry
   */
  clearAll(): void {
    this._rcMarkers.forEach((rcMarker) => {
      rcMarker.remove();
    });
    this._rcMarkers.clear();
  }
}
