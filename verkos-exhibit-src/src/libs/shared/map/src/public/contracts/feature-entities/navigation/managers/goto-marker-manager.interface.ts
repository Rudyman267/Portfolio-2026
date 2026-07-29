import { IGotoMarker, IGotoMarkerOptions } from '../entities';

export interface IGotoMarkerManager {
  createGotoMarker(options: IGotoMarkerOptions): IGotoMarker;
  getGotoMarker(id: string): IGotoMarker | undefined;
  clearAll(): void;
}
