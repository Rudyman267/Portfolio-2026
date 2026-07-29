import { v4 } from 'uuid';
import {
  IFleet2DMission,
  IFleet2DMissionOptions,
  IPosition,
  MissionType,
} from '@map/public/contracts';
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

export class Fleet2dLinearMission implements IFleet2DMission {
  public readonly id: string;
  private _missionPolyline!: IFBPolyline;
  private _missionMarker?: IFBMarker[] = [];
  private _compositeManager: ICompositeManager;
  constructor(
    _compositeManager: ICompositeManager,
    options: IFleet2DMissionOptions
  ) {
    this._compositeManager = _compositeManager;

    this.id = `fleet-2d-linear-mission-${v4()}`;

    if (!options || !options.positions || options.positions.length === 0) {
      console.error('Invalid options for Fleet2dLinearMission');
      return;
    }

    this._missionPolyline = this.createMissionPolyline(options);

    this._missionMarker = this.createMissionMarkers(options);
  }

  setVisibility(visible: boolean): void {
    this._missionPolyline?.setVisibility(visible);
    this._missionMarker?.forEach((marker: IFBMarker) => {
      marker?.setVisibility(visible);
    });
  }

  setSelected(selected: boolean): void {
    const nextColor = selected ? MapColor.GREEN_TINT : MapColor.GREY;

    this._missionPolyline.setStyle({
      color: nextColor,
    });

    this._missionMarker?.forEach((marker: IFBMarker, index: number) => {
      const updatedImage = MissionSvgUtils.getTextedMissionMarker(
        (index + 1).toString(),
        nextColor
      );
      marker.updateImage(updatedImage);
    });
  }

  panTo(): void {
    if (!this._missionPolyline) {
      console.error('MissionPolyline not available');
      return;
    }
    this._missionPolyline.panTo();
  }

  remove(): void {
    this._missionPolyline.remove();
    this._missionMarker?.forEach((marker: IFBMarker) => {
      marker.remove();
    });
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

  private createMissionMarkers(options: IFleet2DMissionOptions): IFBMarker[] {
    const markers: IFBMarker[] = [];
    for (let i = 0; i < options.positions.length; i++) {
      const markerOptions: IFBMarkerOptions = {
        position: options.positions[i],
        showHeightReference: true,
        style: {
          ...structuredClone(DEFAULT_FLEET_2D_MISSION_MARKER_STYLE),
          image: MissionSvgUtils.getTextedMissionMarker(
            (i + 1).toString(),
            MapColor.GREEN_TINT
          ),
        },
      };

      markers.push(this._compositeManager.createFBMarker(markerOptions));
    }

    return markers;
  }
}
