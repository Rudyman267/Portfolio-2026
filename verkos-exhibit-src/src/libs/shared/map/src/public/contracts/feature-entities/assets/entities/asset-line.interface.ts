import { IPosition } from '@map/public/contracts/base';
import { AssetMetadata } from './asset-annotation.interface';

export interface IAssetPolylineStyle {
  color?: string;
  width?: number;
  outlineColor?: string;
  outlineWidth?: number;
  clampToGround?: boolean;
  dashPattern?: number;
  dashLength?: number;
}

export interface IAssetLine {
  readonly id: string;
  readonly assetId: string;
  readonly positions: IPosition[];
  readonly metadata: AssetMetadata;
  readonly visible: boolean;

  // Position Management
  setPositions(positions: IPosition[]): void;
  addPosition(position: IPosition): void;
  updatePosition(index: number, position: IPosition): void;

  // Style Management
  setStyle(style: IAssetPolylineStyle): void;
  setColor(color: string): void;
  setWidth(width: number): void;
  setClampToGround(clamp: boolean): void;

  // State Management
  setVisibility(visible: boolean): void;
  setInteractive(interactive: boolean): void;

  // Navigation
  panTo(): void;
  // Lifecycle
  remove(): void;
}

export interface IAssetLineOptions {
  assetId: string;
  positions: IPosition[];
  metadata: AssetMetadata;

  color?: string;
  width?: number;
  clampToGround?: boolean;

  interactive?: boolean;

  labelText?: string;
}
