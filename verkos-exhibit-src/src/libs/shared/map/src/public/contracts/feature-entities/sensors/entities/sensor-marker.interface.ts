import { IPosition } from '@map/public/contracts/base';

export interface ISensorMarker {
  readonly id: string;

  setVisibility(visible: boolean): void;
  remove(): void;
  panTo(): void;
  updatePosition(position: IPosition): void;
  setStatus(status: boolean): void;
}

export interface ISensorMarkerOptions {
  position: IPosition;
  labelText?: string;
  status?: boolean;
}
