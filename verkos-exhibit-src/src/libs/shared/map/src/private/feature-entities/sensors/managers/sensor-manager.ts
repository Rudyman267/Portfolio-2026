import {
  ISensorManager,
  ISensorMarker,
  ISensorMarkerOptions,
} from '@map/public/contracts';
import { SensorMarker } from '../entities';
import { ICompositeManager } from '@map/private/contracts';

export class SensorManager implements ISensorManager {
  private _compositeManager: ICompositeManager;
  private _sensorMarkers: Map<string, SensorMarker> = new Map();

  constructor(compositeManager: ICompositeManager) {
    this._compositeManager = compositeManager;
  }

  createSensorMarker(options: ISensorMarkerOptions): ISensorMarker {
    const sensorMarker = new SensorMarker(this._compositeManager, options);
    this._sensorMarkers.set(sensorMarker.id, sensorMarker);
    return sensorMarker;
  }

  getSensorMarker(id: string): ISensorMarker | undefined {
    return this._sensorMarkers.get(id);
  }

  removeSensorMarker(id: string): void {
    if (this._sensorMarkers.has(id)) {
      const sensorMarker = this._sensorMarkers.get(id);
      sensorMarker?.remove();
      this._sensorMarkers.delete(id);
    }
  }

  removeAllSensorMarkers(): void {
    this._sensorMarkers.forEach((sensorMarker) => {
      sensorMarker.remove();
    });
    this._sensorMarkers.clear();
  }
}
