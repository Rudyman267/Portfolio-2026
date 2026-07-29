import type {
  ICircularZoneOptions,
  IPolygonZoneOptions,
  IZone,
} from '../entities';

export interface IZoneManager {
  createCircularGoefenceZone(zoneOptions: ICircularZoneOptions): IZone;
  createPolygonGoefenceZone(zoneOptions: IPolygonZoneOptions): IZone;
  createCircularNfzZone(zoneOptions: ICircularZoneOptions): IZone;
  createPolygonNfzZone(zoneOptions: IPolygonZoneOptions): IZone;
  getGoefenceZone(zoneId: string): IZone;
  getNfzZone(zoneId: string): IZone;
  toggleGeofenceVisibility(visible: boolean): void;
  toggleNfzVisibility(visible: boolean): void;
  getAllZones(): IZone[];
  clearAll(): void;
  removeAllZone(zoneIds: string[]): void;
}
