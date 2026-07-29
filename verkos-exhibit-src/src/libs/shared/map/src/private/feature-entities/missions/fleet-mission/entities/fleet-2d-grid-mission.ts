import { v4 } from 'uuid';
import { IFleet2DMission, IFleet2DMissionOptions } from '@map/public/contracts';
import { MapColor } from '@map/public/core';
import {
  ICompositeManager,
  IFBMarker,
  IFBMarkerOptions,
  IFBPolyline,
  IFBPolylineOptions,
} from '@map/private/contracts';
import { MissionSvgUtils } from '@map/private/feature-entities/missions/shared';
import {
  DEFAULT_FLEET_2D_MISSION_DASHED_POLYLINE_STYLE,
  DEFAULT_FLEET_2D_MISSION_MARKER_STYLE,
} from '../constants';

export class Fleet2dGridMission implements IFleet2DMission {
  public readonly id: string;
  private _missionPolyline!: IFBPolyline;
  private _startMarker!: IFBMarker;
  private _endMarker!: IFBMarker;

  private _compositeManager: ICompositeManager;
  constructor(
    _compositeManager: ICompositeManager,
    options: IFleet2DMissionOptions
  ) {
    this._compositeManager = _compositeManager;

    this.id = `fleet-2d-grid-mission-${v4()}`;

    if (!options || !options.positions || options.positions.length === 0) {
      console.error('Invalid options for Fleet2dGridMission');
      return;
    }

    this._missionPolyline = this.createMissionPolyline(options);

    this._startMarker = this.createStartMarker(options);
    this._endMarker = this.createEndMarker(options);
  }

  setVisibility(visible: boolean): void {
    this._missionPolyline?.setVisibility(visible);
    this._startMarker?.setVisibility(visible);
    this._endMarker?.setVisibility(visible);
  }

  setSelected(selected: boolean): void {
    const nextColor = selected ? MapColor.GREEN_TINT : MapColor.GREY;

    this._missionPolyline.setStyle({
      color: nextColor,
    });

    this._startMarker?.updateImage(
      MissionSvgUtils.getTextedMissionMarker('S', nextColor)
    );
    this._endMarker?.updateImage(
      MissionSvgUtils.getTextedMissionMarker('E', nextColor)
    );
  }

  panTo(): void {
    if (!this._missionPolyline) {
      console.error('MissionPolyline not available');
      return;
    }
    this._missionPolyline.panTo();
  }

  remove(): void {
    this._missionPolyline?.remove();
    this._startMarker?.remove();
    this._endMarker?.remove();
  }

  // private methods :
  private createMissionPolyline(options: IFleet2DMissionOptions): IFBPolyline {
    const polylineOptions: IFBPolylineOptions = {
      positions: [
        options.dockLocation,
        options.safeTakeOffLocation,
        ...options.positions,
      ],
      style: structuredClone(DEFAULT_FLEET_2D_MISSION_DASHED_POLYLINE_STYLE),
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
      enableDistanceDisplay: true,
    };

    return this._compositeManager.createFBPolyline(polylineOptions);
  }

  private createStartMarker(options: IFleet2DMissionOptions): IFBMarker {
    const startMarkerOptions: IFBMarkerOptions = {
      position: options.positions[0],
      showHeightReference: true,
      style: {
        ...structuredClone(DEFAULT_FLEET_2D_MISSION_MARKER_STYLE),
        image: MissionSvgUtils.getTextedMissionMarker('S', MapColor.GREEN_TINT),
      },
    };

    return this._compositeManager.createFBMarker(startMarkerOptions);
  }

  private createEndMarker(options: IFleet2DMissionOptions): IFBMarker {
    const endMarkerOptions: IFBMarkerOptions = {
      position: options.positions[options.positions.length - 1],
      showHeightReference: true,
      style: {
        ...structuredClone(DEFAULT_FLEET_2D_MISSION_MARKER_STYLE),
        image: MissionSvgUtils.getTextedMissionMarker('E', MapColor.GREEN_TINT),
      },
    };

    return this._compositeManager.createFBMarker(endMarkerOptions);
  }
}
