import { ICompositeManager } from '@map/private/contracts';
import {
  IDockMarker,
  IDockMarkerManager,
  IDockMarkerOptions,
} from '@map/public/contracts';
import { DockMarker } from '../entities';

export class DockMarkerManager implements IDockMarkerManager {
  public _dockMarkers: Map<string, IDockMarker> = new Map<
    string,
    IDockMarker
  >();
  constructor(private _compositeManager: ICompositeManager) {}

  createDockMarker(options: IDockMarkerOptions): IDockMarker {
    // Creating a new dock marker with provided options
    const entity = new DockMarker(this._compositeManager, options);
    if (!entity) {
      console.error('Failed to create DockMarker entity');
    }
    this._dockMarkers.set(entity.id, entity);
    return entity;
  }

  getDockMarker(id: string): IDockMarker | undefined {
    const marker = this._dockMarkers.get(id);
    if (!marker) {
      console.error('DockMarker not found');
    }
    return marker;
  }

  removeDockMarker(id: string): void {
    const marker = this.getDockMarker(id);
    try {
      if (marker) {
        marker.remove();
        this._dockMarkers.delete(id);
      }
    } catch (error) {
      console.error(`Failed to remove dock marker ${id}:`, error);
    }
  }
}
