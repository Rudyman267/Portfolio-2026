import { IPosition } from '@map/public/contracts/base';
import { AssetMetadata } from './asset-annotation.interface';

/**
 * Style options for marker billboards
 */
export interface IAssetMarkerStyle {
  image?: string;

  scale?: number;

  color?: string;
}

export interface IAssetPoint {
  readonly id: string;
  readonly assetId: string;
  readonly position: IPosition;
  readonly metadata: AssetMetadata;
  readonly visible: boolean;

  // Position Management
  updatePosition(position: IPosition): Promise<void>;

  // Style Management
  setStyle(style: Partial<IAssetMarkerStyle>): void;
  updateIcon(iconUrl: string): void;
  setScale(scale: number): void;

  // Label Management
  setLabelText(text: string): void;
  setLabelVisibility(visible: boolean): void;

  // State Management
  setVisibility(visible: boolean): void;
  setInteractive(interactive: boolean): void;

  // Navigation
  panTo(): void;

  // Lifecycle
  remove(): void;
}

export interface IAssetPointOptions {
  assetId: string;
  position: IPosition;
  metadata: AssetMetadata;

  iconUrl?: string;
  scale?: number;

  labelText?: string;
  labelVisible?: boolean;

  interactive?: boolean;
}
