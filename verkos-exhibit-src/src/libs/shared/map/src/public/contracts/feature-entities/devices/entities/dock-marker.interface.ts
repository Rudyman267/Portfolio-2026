import { IOrientation, IPosition } from '@map/public/contracts/base';
import { HeightReferenceEnum } from '@map/public/core';

export interface IDockMarker {
  readonly id: string;
  updatePosition(position: {
    dockPosition: IPosition;
    safeLocation?: IPosition;
  }): void;
  setVisibility(visible: boolean): void;
  setSelected(selected: boolean): void;
  setStyle(image: string): void;
  panTo(): void;
  plotOfflineSelectedDock(): void;
  plotOfflineUnselectedDock(): void;
  plotOnlineSelectedDock(): void;
  plotOnlineUnselectedDock(): void;
  remove(): void;
}

export interface IDockMarkerOptions {
  dockLocationMarkerOptions: DockLocationMarkerOptions;
  safeLocationMarkerOptions?: SafeLocationMarkerOptions;
}

/**
 * Public-facing marker options for dock markers.
 * Intentionally does NOT expose internal composite marker option types.
 */
export interface DockLocationMarkerOptions {
  position: IPosition;
  labelText?: string;
  visible?: boolean;
  clickable?: boolean;
  hoverable?: boolean;

  // Provider-specific / styling knobs (kept flexible)
  style?: {
    image: string;
    scale?: number;
    heightReference?: HeightReferenceEnum;
  };
}

export interface SafeLocationMarkerOptions {
  position: IPosition;
  labelText?: string;
  orientation?: IOrientation;
  visible?: boolean;
  clickable?: boolean;
  hoverable?: boolean;

  // Provider-specific / styling knobs (kept flexible)
  style?: {
    image: string;
    scale?: number;
    heightReference?: HeightReferenceEnum;
  };
}
