import { IPosition } from '@map/public/contracts/base';
import { AssetMetadata } from './asset-annotation.interface';

export interface IAssetPolygonStyle {
  fillColor?: string;
  fillOpacity?: number;
  outlineColor?: string;
  outlineWidth?: number;
  alpha?: number;
}

export interface IAssetPolygon {
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
  setStyle(style: Partial<IAssetPolygonStyle>): void;
  setFillColor(color: string): void;
  setOutlineColor(color: string): void;
  setFillOpacity(opacity: number): void;
  setOutlineWidth(width: number): void;

  // State Management
  setVisibility(visible: boolean): void;
  setInteractive(interactive: boolean): void;

  // Navigation
  panTo(): void;

  // Lifecycle
  remove(): void;
}

export interface IAssetPolygonOptions {
  assetId: string;
  positions: IPosition[];
  metadata: AssetMetadata;
  interactive?: boolean;
  fillColor?: string;
  outlineColor?: string;
  fillOpacity?: number;
  outlineWidth?: number;
  clampToGround?: boolean;
  labelText?: string;
}
