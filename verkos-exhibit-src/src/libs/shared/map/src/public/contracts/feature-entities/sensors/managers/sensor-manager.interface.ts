import { ISensorMarker, ISensorMarkerOptions } from '../entities';

export interface ISensorManager {
  createSensorMarker(options: ISensorMarkerOptions): ISensorMarker;
  getSensorMarker(id: string): ISensorMarker | undefined;
  removeSensorMarker(id: string): void;
  removeAllSensorMarkers(): void;
}
