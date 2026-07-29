import { ICompositeManager } from '@map/private/contracts';
import {
  ICircularZoneOptions,
  IPolygonZoneOptions,
  IZone,
  IZoneManager,
} from '@map/public/contracts';
import {
  NfzPolygonZone,
  NfzCircleZone,
  GeofencePolygonZone,
  GeofenceCircleZone,
} from '../entities';

export class ZoneManager implements IZoneManager {
  constructor(private _compositeManager: ICompositeManager) {}
  private goefenceZones: Map<string, IZone> = new Map();
  private nfzZones: Map<string, IZone> = new Map();

  createCircularGoefenceZone(zoneOptions: ICircularZoneOptions): IZone {
    const zone = new GeofenceCircleZone(this._compositeManager, zoneOptions);
    this.goefenceZones.set(zone.id, zone);
    return zone;
  }

  createPolygonGoefenceZone(zoneOptions: IPolygonZoneOptions): IZone {
    const zone = new GeofencePolygonZone(this._compositeManager, zoneOptions);
    this.goefenceZones.set(zone.id, zone);
    return zone;
  }

  createCircularNfzZone(zoneOptions: ICircularZoneOptions): IZone {
    const zone = new NfzCircleZone(this._compositeManager, zoneOptions);
    this.nfzZones.set(zone.id, zone);
    return zone;
  }

  createPolygonNfzZone(zoneOptions: IPolygonZoneOptions): IZone {
    const zone = new NfzPolygonZone(this._compositeManager, zoneOptions);
    this.nfzZones.set(zone.id, zone);
    return zone;
  }

  getAllZones(): IZone[] {
    return Array.from(this.goefenceZones.values()).concat(
      Array.from(this.nfzZones.values())
    );
  }

  getGoefenceZone(zoneId: string): IZone {
    const zone = this.goefenceZones.get(zoneId);
    if (!zone) {
      throw new Error(`Zone with id ${zoneId} not found`);
    }
    return zone;
  }

  getNfzZone(zoneId: string): IZone {
    const zone = this.nfzZones.get(zoneId);
    if (!zone) {
      throw new Error(`Zone with id ${zoneId} not found`);
    }
    return zone;
  }

  toggleGeofenceVisibility(visible: boolean): void {
    this.goefenceZones.forEach((zone) => {
      zone.setVisibility(visible);
    });
  }

  toggleNfzVisibility(visible: boolean): void {
    this.nfzZones.forEach((zone) => {
      zone.setVisibility(visible);
    });
  }

  removeAllZone(zoneIds: string[]): void {
    zoneIds.forEach((id) => {
      if (this.goefenceZones.has(id)) {
        this.goefenceZones.get(id)?.destroy();
        this.goefenceZones.delete(id);
      }
      if (this.nfzZones.has(id)) {
        this.nfzZones.get(id)?.destroy();
        this.nfzZones.delete(id);
      }
    });
  }

  clearAll(): void {
    this.goefenceZones.forEach((zone) => {
      zone.destroy();
    });
    this.goefenceZones.clear();
    this.nfzZones.forEach((zone) => {
      zone.destroy();
    });
    this.nfzZones.clear();
  }
}
