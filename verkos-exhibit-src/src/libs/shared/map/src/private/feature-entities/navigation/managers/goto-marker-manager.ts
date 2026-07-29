import { ICompositeManager } from '@map/private/contracts';
import {
  IGotoMarker,
  IGotoMarkerManager,
  IGotoMarkerOptions,
} from '@map/public/contracts';
import { GotoMarker } from '../entities';

export class GotoMarkerManager implements IGotoMarkerManager {
  constructor(private _compositeManager: ICompositeManager) {}
  public gotoMarkers: Map<string, IGotoMarker> = new Map();

  createGotoMarker(options: IGotoMarkerOptions): IGotoMarker {
    const entity = new GotoMarker(this._compositeManager, options);
    if (!entity) {
      console.error('Failed to create GotoMarker entity');
      throw new Error('Failed to create GotoMarker entity');
    }
    this.gotoMarkers.set(entity.id, entity);
    return entity;
  }

  getGotoMarker(id: string): IGotoMarker | undefined {
    return this.gotoMarkers.get(id);
  }

  clearAll(): void {
    this.gotoMarkers.forEach((marker) => {
      marker.remove();
    });
    this.gotoMarkers.clear();
  }
}
