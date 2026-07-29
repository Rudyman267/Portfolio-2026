import { IDockMarker, IDockMarkerOptions } from '../entities';

export interface IDockMarkerManager {
  createDockMarker(options: IDockMarkerOptions): IDockMarker;
  getDockMarker(id: string): IDockMarker | undefined;
  removeDockMarker(id: string): void;
}
