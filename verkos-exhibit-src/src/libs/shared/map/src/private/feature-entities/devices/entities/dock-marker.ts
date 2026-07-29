import { v4 } from 'uuid';
import {
  DockLocationMarkerOptions,
  IDockMarker,
  IDockMarkerOptions,
  IPosition,
  SafeLocationMarkerOptions,
} from '@map/public/contracts';
import { HeightReferenceEnum } from '@map/public/core';
import {
  ICompositeManager,
  IFBMarker,
  IFBPolyline,
} from '@map/private/contracts';
import {
  DEFAULT_DEVICE_MARKER_LABEL_STYLE,
  DEFAULT_DOCK_LOCATION_MARKER_STYLE,
  DEFAULT_LOCATION_CONNECTION_POLYLINE_STYLE,
  DEFAULT_SAFE_LOCATION_MARKER_STYLE,
} from '../constants';

export class DockMarker implements IDockMarker {
  private _id: string;
  private dockLocationMarker?: IFBMarker;
  private safeLocationMarker?: IFBMarker;
  private connectionLine?: IFBPolyline;
  constructor(
    private _compositeManager: ICompositeManager,
    options: IDockMarkerOptions
  ) {
    this._id = `dock-markers-${v4()}`;
    const { dockLocationMarkerOptions, safeLocationMarkerOptions } = options;

    if (
      !dockLocationMarkerOptions.position?.altitude ||
      !dockLocationMarkerOptions.position.latitude ||
      !dockLocationMarkerOptions.position.longitude
    ) {
      console.warn(
        'Invalid dock marker position',
        dockLocationMarkerOptions.position
      );
      return;
    }

    // Create dock marker with consistent height reference
    this.dockLocationMarker = this.createDockLocationMarker(
      options.dockLocationMarkerOptions
    );

    if (safeLocationMarkerOptions) {
      this.safeLocationMarker = this.createSafeLocationMarker(
        safeLocationMarkerOptions as SafeLocationMarkerOptions
      );

      this.connectionLine = this.createLocationConnectionLine(
        dockLocationMarkerOptions?.position,
        safeLocationMarkerOptions?.position,
        dockLocationMarkerOptions.style?.heightReference ||
          HeightReferenceEnum.NONE
      );
    }
  }

  get id(): string {
    return this._id;
  }

  updatePosition(position: {
    dockPosition: IPosition;
    safeLocation?: IPosition;
  }): void {
    if (this.dockLocationMarker) {
      this.dockLocationMarker.updatePosition(position.dockPosition);
      if (position.safeLocation) {
        this.safeLocationMarker?.updatePosition(position.safeLocation);
        this.connectionLine?.setPositions([
          position.dockPosition,
          position.safeLocation,
        ]);
      }
    }
  }

  setVisibility(visible: boolean): void {
    this.dockLocationMarker?.setVisibility(visible);
    this.safeLocationMarker?.setVisibility(visible);
    this.connectionLine?.setVisibility(visible);
  }

  setSelected(selected: boolean): void {
    if (selected) {
      this.plotOnlineSelectedDock();
    } else {
      this.plotOnlineUnselectedDock();
    }
  }

  plotOfflineSelectedDock(): void {
    this.dockLocationMarker?.updateImage(
      '/assets/docks/offline-selected-dock.svg'
    );
    this.safeLocationMarker?.updateImage(
      '/assets/docks/selected-safe-location.svg'
    );
  }

  plotOfflineUnselectedDock(): void {
    this.dockLocationMarker?.updateImage(
      '/assets/docks/offline-unselected-dock.svg'
    );
    this.safeLocationMarker?.updateImage(
      '/assets/docks/unselected-safe-location.svg'
    );
  }

  plotOnlineSelectedDock(): void {
    this.dockLocationMarker?.updateImage(
      '/assets/docks/online-selected-dock.svg'
    );
    this.safeLocationMarker?.updateImage(
      '/assets/docks/selected-safe-location.svg'
    );
  }

  plotOnlineUnselectedDock(): void {
    this.dockLocationMarker?.updateImage(
      '/assets/docks/online-unselected-dock.svg'
    );
    this.safeLocationMarker?.updateImage(
      '/assets/docks/unselected-safe-location.svg'
    );
  }

  setStyle(image: string): void {
    this.dockLocationMarker?.updateImage(image);
  }

  panTo(): void {
    if (this.connectionLine && this.safeLocationMarker) {
      this.connectionLine.panTo();
    } else {
      this.dockLocationMarker?.panTo();
    }
  }

  remove(): void {
    this.dockLocationMarker?.remove();
    this.safeLocationMarker?.remove();
    this.connectionLine?.remove();
  }

  //private methods
  private createDockLocationMarker(
    options: DockLocationMarkerOptions
  ): IFBMarker {
    const dockLocationMarker = this._compositeManager.createFBMarker({
      position: options.position,
      labelText: options.labelText,
      visible: options.visible ?? true,
      clickable: options.clickable ?? false,
      hoverable: options.hoverable ?? false,
      style: {
        ...structuredClone(DEFAULT_DOCK_LOCATION_MARKER_STYLE),
        ...(options.style?.image ? { image: options.style.image } : {}),
        ...(options.style?.scale ? { scale: options.style.scale } : {}),
        ...(options.style?.heightReference
          ? { heightReference: options.style.heightReference }
          : {}),
      },
      showHeightReference:
        options.style?.heightReference !== HeightReferenceEnum.CLAMP_TO_GROUND,
      labelStyle: {
        ...structuredClone(DEFAULT_DEVICE_MARKER_LABEL_STYLE),
        ...(options.style?.heightReference
          ? { heightReference: options.style.heightReference }
          : {}),
      },
    });

    return dockLocationMarker;
  }

  private createSafeLocationMarker(
    options: SafeLocationMarkerOptions
  ): IFBMarker {
    const safeLocationMarker = this._compositeManager.createFBMarker({
      position: options.position,
      labelText: options.labelText,
      visible: options.visible ?? true,
      clickable: options.clickable ?? false,
      hoverable: options.hoverable ?? false,
      style: {
        ...structuredClone(DEFAULT_SAFE_LOCATION_MARKER_STYLE),
        ...(options.style?.image ? { image: options.style.image } : {}),
        ...(options.style?.scale ? { scale: options.style.scale } : {}),
        ...(options.style?.heightReference
          ? { heightReference: options.style.heightReference }
          : {}),
      },
      showHeightReference:
        options.style?.heightReference !== HeightReferenceEnum.CLAMP_TO_GROUND,
      labelStyle: {
        ...structuredClone(DEFAULT_DEVICE_MARKER_LABEL_STYLE),
        ...(options.style?.heightReference
          ? { heightReference: options.style.heightReference }
          : {}),
      },
    });

    return safeLocationMarker;
  }

  private createLocationConnectionLine(
    dockPosition: IPosition,
    safeLocationPosition: IPosition,
    heightReference: HeightReferenceEnum
  ): IFBPolyline {
    const locationConnectionLine = this._compositeManager.createFBPolyline({
      positions: [dockPosition, safeLocationPosition],
      style: {
        ...structuredClone(DEFAULT_LOCATION_CONNECTION_POLYLINE_STYLE),
        clampToGround: heightReference === HeightReferenceEnum.CLAMP_TO_GROUND,
      },
      editable: false,
      hoverable: false,
      clickable: false,
      visible: true,
    });

    return locationConnectionLine;
  }
}
