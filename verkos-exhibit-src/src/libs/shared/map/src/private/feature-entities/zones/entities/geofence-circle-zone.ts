import { v4 } from 'uuid';
import { ICircularZoneOptions, IZone } from '@map/public/contracts';
import { ICompositeManager, IFBCircle } from '@map/private/contracts';
import {
  DEFAULT_GEOFENCE_CIRCLE_STYLE,
  DEFAULT_GEOFENCE_LABEL_STYLE,
  DEFAULT_SYNCED_GEOFENCE_CIRCLE_STYLE,
} from '../constants';

export class GeofenceCircleZone implements IZone {
  private _id: string;
  private _visible: boolean;
  private _circle: IFBCircle;
  private readonly compositeManager: ICompositeManager;

  /**
   * Constructor for Zone
   * @param compositeManager The composite manager for handling map entities
   * @param options Zone creation options
   */
  constructor(
    compositeManager: ICompositeManager,
    option: ICircularZoneOptions
  ) {
    this._id = `geofence-circle-${v4()}`;
    this.compositeManager = compositeManager;
    this._visible = true;
    this._circle = this.createGeofenceCircle(option);
  }

  public get visible(): boolean {
    return this._visible;
  }

  public get id(): string {
    return this._id;
  }

  /**
   * Set the visibility of the zone on the map
   * @param visible Whether the zone should be visible
   */
  setVisibility(visible: boolean): void {
    this._visible = visible;
    this._circle.setVisibility(visible);
  }

  panTo(): void {
    this._circle.panTo();
  }

  destroy(): void {
    this._circle.remove();
  }

  // private methods
  private createGeofenceCircle(option: ICircularZoneOptions): IFBCircle {
    const geofenceCircle = this.compositeManager.createFBCircle({
      position: option.position,
      radius: option.radius,
      style: option.syncStatus
        ? structuredClone(DEFAULT_SYNCED_GEOFENCE_CIRCLE_STYLE)
        : structuredClone(DEFAULT_GEOFENCE_CIRCLE_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
      labelText: option.labelText ?? 'Untitled Geofence',
      labelStyle: structuredClone(DEFAULT_GEOFENCE_LABEL_STYLE),
    });
    return geofenceCircle;
  }
}
