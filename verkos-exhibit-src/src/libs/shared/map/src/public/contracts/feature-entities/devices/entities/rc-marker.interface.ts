import { IPosition } from '@map/public/contracts/base';

export interface IRCMarker {
  readonly id: string;
  updatePosition(position: IPosition): void;
  remove(): void;
  setVisibility(visible: boolean): void;
  setStyle(image: string): void;
  setOnlineStatus(online: boolean): void;
  panTo(): void;
}

export interface IRCMarkerOptions {
  position: IPosition;
  connectionStatus: boolean;
  labelText?: string;
}
