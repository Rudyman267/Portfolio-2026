import type {
  IAssetLineOptions,
  IAssetPointOptions,
  IAssetPolygonOptions,
} from '../entities';
import {
  AssetLineData,
  AssetPointData,
  AssetPolygonData,
  AssetStyleConfig,
  IAssetInteractionEvent,
  IAssetLine,
  IAssetPoint,
  IAssetPolygon,
} from '../entities';

export interface IAssetManager {
  // CONFIGURATION
  /**
   * Configure asset styling for categories
   * @param config Style configuration for asset categories
   */
  configureAssetStyling(config: AssetStyleConfig): void;

  overlayImagery(id: string, url: string): boolean;
  overlayTileset(id: string, url: string): Promise<boolean>;
  overlayTerrain(id: string, url: string): Promise<boolean>;
  overlayPointCloud(id: string, url: string): Promise<boolean>;
  removeImagery(id: string): boolean;
  removeTileset(id: string): boolean;
  removeTerrain(id: string): boolean;
  removePointCloud(id: string): boolean;
  panToImagery(id: string): void;
  panToTileset(id: string): void;
  updateImageryOpacity(id: string, opacity: number): void;
  updateTilesetOpacity(id: string, opacity: number): void;

  // Geometry-specific creation methods - returns feature entities
  createPointAsset(options: IAssetPointOptions): IAssetPoint | null;
  createLineAsset(options: IAssetLineOptions): IAssetLine | null;
  createPolygonAsset(options: IAssetPolygonOptions): IAssetPolygon | null;

  // Batch creation methods for performance - returns feature entities
  createPointAssets(assets: AssetPointData[]): IAssetPoint[];
  createLineAssets(assets: AssetLineData[]): IAssetLine[];
  createPolygonAssets(assets: AssetPolygonData[]): IAssetPolygon[];

  // Asset annotation management
  removeAssetAnnotation(assetId: string): void;
  removeAssetAnnotations(assetIds: string[]): void;
  clearAll(): void;
  getAssetAnnotation(
    assetId: string
  ): IAssetPoint | IAssetLine | IAssetPolygon | undefined;

  // Visibility control
  setAssetAnnotationsVisibility(assetIds: string[], visible: boolean): void;
  hideAllAssetAnnotations(): void;
  showAllAssetAnnotations(): void;

  // Navigation
  panToAssetAnnotation(assetId: string): void;

  // Event management for interaction bubbling
  onAssetInteraction(callback: (event: IAssetInteractionEvent) => void): void;
  offAssetInteraction(callback: (event: IAssetInteractionEvent) => void): void;
}
