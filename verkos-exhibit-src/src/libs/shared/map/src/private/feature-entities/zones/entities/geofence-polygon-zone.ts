import { v4 } from 'uuid';
import { IPolygonZoneOptions, IZone, MapZoneType } from '@map/public/contracts';
import { ICompositeManager, IFBPolygon } from '@map/private/contracts';
import {
  DEFAULT_GEOFENCE_LABEL_STYLE,
  DEFAULT_GEOFENCE_POLYGON_STYLE,
  DEFAULT_SYNCED_GEOFENCE_POLYGON_STYLE,
} from '../constants';

export class GeofencePolygonZone implements IZone {
  private _id: string;
  private _visible!: boolean;
  private _polygon: IFBPolygon;
  private readonly _compositeManager: ICompositeManager;
  constructor(
    compositeManager: ICompositeManager,
    option: IPolygonZoneOptions
  ) {
    this._id = `geofence-polygon-${v4()}`;
    this._compositeManager = compositeManager;
    this._visible = true;

    this._polygon = this.createGeofencePolygon(option);
  }

  public get visible(): boolean {
    return this._visible;
  }

  public get id(): string {
    return this._id;
  }

  panTo(): void {
    this._polygon.panTo();
  }

  setVisibility(visible: boolean): void {
    this._visible = visible;
    this._polygon.setVisibility(visible);
  }

  destroy(): void {
    this._polygon.remove();
  }

  // private methods
  private createGeofencePolygon(option: IPolygonZoneOptions): IFBPolygon {
    const geofencePolygon = this._compositeManager.createFBPolygon({
      positions: option.positions,
      labelText: option.labelText ?? 'Untitled Geofence',
      labelStyle: structuredClone(DEFAULT_GEOFENCE_LABEL_STYLE),
      style: option.syncStatus
        ? structuredClone(DEFAULT_SYNCED_GEOFENCE_POLYGON_STYLE)
        : structuredClone(DEFAULT_GEOFENCE_POLYGON_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
    });
    return geofencePolygon;
  }
}
