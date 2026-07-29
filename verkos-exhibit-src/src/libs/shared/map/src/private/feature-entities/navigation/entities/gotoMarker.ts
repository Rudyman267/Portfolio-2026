import { v4 } from 'uuid';
import { IGotoMarker, IGotoMarkerOptions } from '@map/public/contracts';
import {
  ICompositeManager,
  IFBMarker,
  IFBMarkerOptions,
  IFBPolyline,
  IFBPolylineOptions,
} from '@map/private/contracts';
import {
  DEFAULT_GOTO_DASHED_POLYLINE_STYLE,
  DEFAULT_GOTO_MARKER_STYLE,
} from '../constants';

export class GotoMarker implements IGotoMarker {
  private _gotoMarker!: IFBMarker;
  private _gotoPolyline!: IFBPolyline;
  public readonly _id: string;
  private _compositeManager: ICompositeManager;

  constructor(
    compositeManager: ICompositeManager,
    options: IGotoMarkerOptions
  ) {
    this._id = `goto-marker-${v4()}`;
    this._compositeManager = compositeManager;

    if (
      !options.dronePosition ||
      !options.safeTakeOffAlt ||
      !options.taskAltitude ||
      !options.targetPoint
    ) {
      console.error('Invalid goto marker options');
      return;
    }

    this._gotoPolyline = this.createGotoPolyline(options);

    this._gotoMarker = this.createGotoMarker(options);
  }

  get id(): string {
    return this._id;
  }

  setVisibility(visible: boolean): void {
    this._gotoMarker.setVisibility(visible);
    this._gotoPolyline.setVisibility(visible);
  }

  panTo(): void {
    this._gotoMarker.panTo();
  }

  remove(): void {
    this._gotoMarker.remove();
    this._gotoPolyline.remove();
  }

  // Private Methods
  private createGotoMarker(options: IGotoMarkerOptions): IFBMarker {
    const markerOptions: IFBMarkerOptions = {
      position: options.targetPoint,
      showHeightReference: true,
      style: structuredClone(DEFAULT_GOTO_MARKER_STYLE),
      visible: true,
      editable: false,
      hoverable: false,
      clickable: false,
    };

    return this._compositeManager.createFBMarker(markerOptions);
  }

  private createGotoPolyline(options: IGotoMarkerOptions): IFBPolyline {
    const polylineOptions: IFBPolylineOptions = {
      positions: [
        options.dronePosition,
        options.safeTakeOffAlt,
        options.taskAltitude,
        options.targetPoint,
      ],
      style: structuredClone(DEFAULT_GOTO_DASHED_POLYLINE_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
    };
    return this._compositeManager.createFBPolyline(polylineOptions);
  }
}
