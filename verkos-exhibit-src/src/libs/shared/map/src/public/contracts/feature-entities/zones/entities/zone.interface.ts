import { IPosition } from '@map/public/contracts/base';

export interface IZone {
  readonly id: string;
  readonly visible: boolean;
  setVisibility(visible: boolean): void;
  destroy(): void;
  panTo(): void;
}

export enum MapZoneType {
  GEOFENCE,
  NFZ,
}

export interface IPolygonZoneOptions {
  positions: IPosition[];
  syncStatus: boolean;
  labelText?: string;
}

export interface ICircularZoneOptions {
  position: IPosition;
  radius: number;
  labelText?: string;
  syncStatus: boolean;
}
