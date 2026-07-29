import { IPosition } from '@map/public/contracts/base';

export interface IGotoMarker {
  readonly id: string;
  setVisibility(visible: boolean): void;
  panTo(): void;
  remove(): void;
}

export interface IGotoMarkerOptions {
  safeTakeOffAlt: IPosition;
  targetPoint: IPosition;
  dronePosition: IPosition;
  taskAltitude: IPosition;
}
