import type {
  IAssetLineOptions,
  IAssetPointOptions,
  IAssetPolygonOptions,
} from '@map/public/contracts';
import {
  AssetLineData,
  AssetPointData,
  AssetPolygonData,
  AssetStyleConfig,
  IAssetInteractionEvent,
  IAssetLine,
  IAssetManager,
  IAssetPoint,
  IAssetPolygon,
  IEventType,
} from '@map/public/contracts';
import {
  ICompositeManager,
  IEvent,
  IMapServices,
  MapEventEmitter,
} from '@map/private/contracts';
import { AssetLine, AssetPoint, AssetPolygon } from '../entities';

export class AssetManager implements IAssetManager {
  private _mapServices: IMapServices;

  // Asset entity state management (feature entities, not composite entities)
  private _assetPointEntities: Map<string, IAssetPoint> = new Map();
  private _assetLineEntities: Map<string, IAssetLine> = new Map();
  private _assetPolygonEntities: Map<string, IAssetPolygon> = new Map();
  private _assetEventEmitter: MapEventEmitter = new MapEventEmitter();

  // Track event listeners for proper cleanup
  private _eventListeners: Map<
    (event: IAssetInteractionEvent) => void,
    (event: IEvent) => void
  > = new Map();

  // Reverse lookup map: entity ID -> asset ID for event handling
  private _entityIdToAssetId: Map<string, string> = new Map();

  // Single click and hover listeners (shared across all assets)
  private _globalClickListener: ((event: IEvent) => void) | null = null;
  private _globalHoverListener: ((event: IEvent) => void) | null = null;

  // Track batch update state to ensure symmetry
  private _batchUpdateActive = false;

  // Configuration-based styling
  private _styleConfig: AssetStyleConfig = {
    categories: {},
    defaults: {
      color: '#6C5CE7',
      iconUrl: 'assets/icons/map/asset.svg',
      fillOpacity: 0.3,
      outlineWidth: 2,
    },
    iconBaseUrl: 'assets/icons/map',
  };

  constructor(private _compositeManager: ICompositeManager) {
    this._mapServices = this._compositeManager.mapProviderServices.mapServices;
  }

  // CONFIGURATION
  configureAssetStyling(config: AssetStyleConfig): void {
    this._styleConfig = {
      ...this._styleConfig,
      ...config,
      categories: { ...this._styleConfig.categories, ...config.categories },
      defaults: { ...this._styleConfig.defaults, ...config.defaults },
    };
  }

  overlayImagery(id: string, url: string): boolean {
    return this._mapServices.overlayImagery(id, url);
  }

  async overlayTileset(id: string, url: string): Promise<boolean> {
    return await this._mapServices.overlayTileset(id, url);
  }

  async overlayTerrain(id: string, url: string): Promise<boolean> {
    return await this._mapServices.overlayTerrain(id, url);
  }

  removeImagery(id: string): boolean {
    return this._mapServices.removeImagery(id);
  }

  removeTileset(id: string): boolean {
    return this._mapServices.removeTileset(id);
  }

  removeTerrain(): boolean {
    return this._mapServices.removeTerrain();
  }

  async overlayPointCloud(id: string, url: string): Promise<boolean> {
    return await this._mapServices.overlayPointCloud(id, url);
  }

  removePointCloud(id: string): boolean {
    return this._mapServices.removePointCloud(id);
  }

  panToImagery(id: string) {
    this._mapServices.panToImagery(id);
  }

  panToTileset(id: string) {
    this._mapServices.panToTileset(id);
  }

  updateImageryOpacity(id: string, opacity: number) {
    this._mapServices.updateImageryOpacity(id, opacity);
  }

  updateTilesetOpacity(id: string, opacity: number) {
    this._mapServices.updateTilesetOpacity(id, opacity);
  }

  // ASSET ANNOTATION METHODS USING FEATURE ENTITIES

  /**
   * Create a point asset annotation using AssetPoint feature entity
   */
  createPointAsset(options: IAssetPointOptions): IAssetPoint | null {
    // Validate that asset ID doesn't already exist
    if (this.getAssetAnnotation(options.assetId)) {
      console.warn(
        `Asset with ID ${options.assetId} already exists, skipping creation`
      );
      return null;
    }

    try {
      const assetPoint = new AssetPoint(this._compositeManager, options, {
        getAssetIconUrl: (category: string) => this.getAssetIconUrl(category),
        getAssetCategoryColor: (category: string) =>
          this.getAssetCategoryColor(category),
      });

      // Setup event bubbling from AssetPoint to AssetManager
      // this.setupAssetEventBubbling(assetPoint);

      // Store the feature entity
      this._assetPointEntities.set(options.assetId, assetPoint);
      return assetPoint;
    } catch (error) {
      console.error(`Failed to create point asset ${options.assetId}:`, error);
      return null;
    }
  }

  /**
   * Create a line asset annotation using AssetLine feature entity
   */
  createLineAsset(options: IAssetLineOptions): IAssetLine | null {
    // Validate that asset ID doesn't already exist
    if (this.getAssetAnnotation(options.assetId)) {
      console.warn(
        `Asset with ID ${options.assetId} already exists, skipping creation`
      );
      return null;
    }

    try {
      const assetLine = new AssetLine(this._compositeManager, options, {
        getAssetCategoryColor: (category: string) =>
          this.getAssetCategoryColor(category),
      });

      // Setup event bubbling from AssetLine to AssetManager
      // this.setupAssetEventBubbling(assetLine);

      // Store the feature entity
      this._assetLineEntities.set(options.assetId, assetLine);
      return assetLine;
    } catch (error) {
      console.error(`Failed to create line asset ${options.assetId}:`, error);
      return null;
    }
  }

  /**
   * Create a polygon asset annotation using AssetPolygon feature entity
   */
  createPolygonAsset(options: IAssetPolygonOptions): IAssetPolygon | null {
    // Validate that asset ID doesn't already exist
    if (this.getAssetAnnotation(options.assetId)) {
      console.warn(
        `Asset with ID ${options.assetId} already exists, skipping creation`
      );
      return null;
    }

    try {
      const assetPolygon = new AssetPolygon(this._compositeManager, options, {
        getAssetCategoryColor: (category: string) =>
          this.getAssetCategoryColor(category),
      });

      // Setup event bubbling from AssetPolygon to AssetManager
      // this.setupAssetEventBubbling(assetPolygon);

      // Store the feature entity
      this._assetPolygonEntities.set(options.assetId, assetPolygon);
      return assetPolygon;
    } catch (error) {
      console.error(
        `Failed to create polygon asset ${options.assetId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Batch create point assets for performance
   */
  createPointAssets(assets: AssetPointData[]): IAssetPoint[] {
    const assetPoints: IAssetPoint[] = [];

    // Validate for duplicate IDs within the batch and against existing assets
    const { validAssets, duplicateIds } = this.validateBatchAssetIds(
      assets.map((a) => a.id)
    );
    if (duplicateIds.length > 0) {
      console.warn(
        `Skipping assets with duplicate IDs: ${duplicateIds.join(', ')}`
      );
    }

    // Filter to only process assets with valid IDs
    const assetsToProcess = assets.filter((asset) =>
      validAssets.includes(asset.id)
    );

    // Begin batch update to suspend rendering
    this.safeBatchBegin();

    try {
      assetsToProcess.forEach((asset) => {
        const assetPoint = this.createPointAsset({
          assetId: asset.id,
          position: asset.position,
          metadata: {
            name: asset.name,
            category: asset.category,
            ...asset.metadata,
          },
          labelText: asset.name,
          labelVisible: true,
          interactive: true,
        });
        if (assetPoint) {
          assetPoints.push(assetPoint);
        }
      });
    } finally {
      // Always end batch update, even if creation fails
      this.safeBatchEnd();
    }

    return assetPoints;
  }

  /**
   * Batch create line assets for performance
   */
  createLineAssets(assets: AssetLineData[]): IAssetLine[] {
    const assetLines: IAssetLine[] = [];

    // Validate for duplicate IDs within the batch and against existing assets
    const { validAssets, duplicateIds } = this.validateBatchAssetIds(
      assets.map((a) => a.id)
    );
    if (duplicateIds.length > 0) {
      console.warn(
        `Skipping assets with duplicate IDs: ${duplicateIds.join(', ')}`
      );
    }

    // Filter to only process assets with valid IDs
    const assetsToProcess = assets.filter((asset) =>
      validAssets.includes(asset.id)
    );

    // Begin batch update to suspend rendering
    this.safeBatchBegin();

    try {
      assetsToProcess.forEach((asset) => {
        const assetLine = this.createLineAsset({
          assetId: asset.id,
          positions: asset.positions,
          metadata: {
            name: asset.name,
            category: asset.category,
            ...asset.metadata,
          },
          labelText: asset.name,
          interactive: true,
        });
        if (assetLine) {
          assetLines.push(assetLine);
        }
      });
    } finally {
      // Always end batch update, even if creation fails
      this.safeBatchEnd();
    }

    return assetLines;
  }

  /**
   * Batch create polygon assets for performance
   */
  createPolygonAssets(assets: AssetPolygonData[]): IAssetPolygon[] {
    const assetPolygons: IAssetPolygon[] = [];

    // Validate for duplicate IDs within the batch and against existing assets
    const { validAssets, duplicateIds } = this.validateBatchAssetIds(
      assets.map((a) => a.id)
    );
    if (duplicateIds.length > 0) {
      console.warn(
        `Skipping assets with duplicate IDs: ${duplicateIds.join(', ')}`
      );
    }

    // Filter to only process assets with valid IDs
    const assetsToProcess = assets.filter((asset) =>
      validAssets.includes(asset.id)
    );

    // Begin batch update to suspend rendering
    this.safeBatchBegin();

    try {
      assetsToProcess.forEach((asset) => {
        const assetPolygon = this.createPolygonAsset({
          assetId: asset.id,
          positions: asset.positions,
          metadata: {
            name: asset.name,
            category: asset.category,
            ...asset.metadata,
          },
          labelText: asset.name,
          interactive: true,
        });
        if (assetPolygon) {
          assetPolygons.push(assetPolygon);
        }
      });
    } finally {
      // Always end batch update, even if creation fails
      this.safeBatchEnd();
    }

    return assetPolygons;
  }

  /**
   * Remove a single asset annotation
   */
  removeAssetAnnotation(assetId: string): void {
    // Check and remove from point entities
    if (this._assetPointEntities.has(assetId)) {
      const assetPoint = this._assetPointEntities.get(assetId);
      try {
        if (assetPoint) {
          // Remove event bubbling listeners before removing the asset
          this.removeAssetEventBubbling(assetPoint);
          assetPoint.remove();
          // Only delete from map if removal succeeded
          this._assetPointEntities.delete(assetId);
        }
      } catch (error) {
        console.warn(`Failed to remove point asset ${assetId}:`, error);
        // Don't delete from map if removal failed to maintain consistency
        throw error;
      }
      return;
    }

    // Check and remove from line entities
    if (this._assetLineEntities.has(assetId)) {
      const assetLine = this._assetLineEntities.get(assetId);
      try {
        if (assetLine) {
          // Remove event bubbling listeners before removing the asset
          this.removeAssetEventBubbling(assetLine);
          assetLine.remove();
          // Only delete from map if removal succeeded
          this._assetLineEntities.delete(assetId);
        }
      } catch (error) {
        console.warn(`Failed to remove line asset ${assetId}:`, error);
        // Don't delete from map if removal failed to maintain consistency
        throw error;
      }
      return;
    }

    // Check and remove from polygon entities
    if (this._assetPolygonEntities.has(assetId)) {
      const assetPolygon = this._assetPolygonEntities.get(assetId);
      try {
        if (assetPolygon) {
          // Remove event bubbling listeners before removing the asset
          this.removeAssetEventBubbling(assetPolygon);
          assetPolygon.remove();
          // Only delete from map if removal succeeded
          this._assetPolygonEntities.delete(assetId);
        }
      } catch (error) {
        console.warn(`Failed to remove polygon asset ${assetId}:`, error);
        // Don't delete from map if removal failed to maintain consistency
        throw error;
      }
      return;
    }
  }

  /**
   * Remove multiple asset annotations
   */
  removeAssetAnnotations(assetIds: string[]): void {
    assetIds.forEach((assetId) => this.removeAssetAnnotation(assetId));
  }

  /**
   * Remove all asset annotations
   */
  clearAll(): void {
    // Remove all point entities
    this._assetPointEntities.forEach((assetPoint, assetId) => {
      try {
        // Remove event bubbling listeners before removing the asset
        this.removeAssetEventBubbling(assetPoint);
        assetPoint.remove();
      } catch (error) {
        console.warn(`Failed to remove point asset ${assetId}:`, error);
      }
    });
    this._assetPointEntities.clear();

    // Remove all line entities
    this._assetLineEntities.forEach((assetLine, assetId) => {
      try {
        // Remove event bubbling listeners before removing the asset
        this.removeAssetEventBubbling(assetLine);
        assetLine.remove();
      } catch (error) {
        console.warn(`Failed to remove line asset ${assetId}:`, error);
      }
    });
    this._assetLineEntities.clear();

    // Remove all polygon entities
    this._assetPolygonEntities.forEach((assetPolygon, assetId) => {
      try {
        // Remove event bubbling listeners before removing the asset
        this.removeAssetEventBubbling(assetPolygon);
        assetPolygon.remove();
      } catch (error) {
        console.warn(`Failed to remove polygon asset ${assetId}:`, error);
      }
    });
    this._assetPolygonEntities.clear();

    // Clean up AssetManager's own event emitters
    this._assetEventEmitter.removeAllListeners();
    this._eventListeners.clear();
  }

  /**
   * Get an asset annotation by ID (returns the feature entity)
   */
  getAssetAnnotation(
    assetId: string
  ): IAssetPoint | IAssetLine | IAssetPolygon | undefined {
    return (
      this._assetPointEntities.get(assetId) ||
      this._assetLineEntities.get(assetId) ||
      this._assetPolygonEntities.get(assetId)
    );
  }

  /**
   * Set visibility for multiple asset annotations
   */
  setAssetAnnotationsVisibility(assetIds: string[], visible: boolean): void {
    assetIds.forEach((assetId) => {
      const annotation = this.getAssetAnnotation(assetId);
      if (annotation) {
        try {
          annotation.setVisibility(visible);
        } catch (error) {
          console.warn(`Failed to set visibility for asset ${assetId}:`, error);
        }
      }
    });
  }

  /**
   * Hide all asset annotations
   */
  hideAllAssetAnnotations(): void {
    this._assetPointEntities.forEach((assetPoint, assetId) => {
      try {
        assetPoint.setVisibility(false);
      } catch (error) {
        console.warn(`Failed to hide point asset ${assetId}:`, error);
      }
    });
    this._assetLineEntities.forEach((assetLine, assetId) => {
      try {
        assetLine.setVisibility(false);
      } catch (error) {
        console.warn(`Failed to hide line asset ${assetId}:`, error);
      }
    });
    this._assetPolygonEntities.forEach((assetPolygon, assetId) => {
      try {
        assetPolygon.setVisibility(false);
      } catch (error) {
        console.warn(`Failed to hide polygon asset ${assetId}:`, error);
      }
    });
  }

  /**
   * Show all asset annotations
   */
  showAllAssetAnnotations(): void {
    this._assetPointEntities.forEach((assetPoint, assetId) => {
      try {
        assetPoint.setVisibility(true);
      } catch (error) {
        console.warn(`Failed to show point asset ${assetId}:`, error);
      }
    });
    this._assetLineEntities.forEach((assetLine, assetId) => {
      try {
        assetLine.setVisibility(true);
      } catch (error) {
        console.warn(`Failed to show line asset ${assetId}:`, error);
      }
    });
    this._assetPolygonEntities.forEach((assetPolygon, assetId) => {
      try {
        assetPolygon.setVisibility(true);
      } catch (error) {
        console.warn(`Failed to show polygon asset ${assetId}:`, error);
      }
    });
  }

  /**
   * Pan to an asset annotation
   */
  panToAssetAnnotation(assetId: string): void {
    const annotation = this.getAssetAnnotation(assetId);
    if (annotation) {
      try {
        annotation.panTo();
      } catch (error) {
        console.warn(`Failed to pan to asset ${assetId}:`, error);
      }
    }
  }

  /**
   * Subscribe to asset interaction events
   */
  onAssetInteraction(callback: (event: IAssetInteractionEvent) => void): void {
    const wrappedCallback = (event: IEvent) => {
      try {
        if (
          event.data &&
          typeof event.data === 'object' &&
          'type' in event.data
        ) {
          callback(event.data as IAssetInteractionEvent);
        } else {
          console.warn('[AssetManager] Event data format invalid:', event);
        }
      } catch (error) {
        console.warn(
          '[AssetManager] Error in asset interaction callback:',
          error
        );
      }
    };

    // Store the mapping for proper cleanup
    this._eventListeners.set(callback, wrappedCallback);

    this._assetEventEmitter.addListener(
      IEventType.ASSET_INTERACTION,
      wrappedCallback
    );
  }

  /**
   * Unsubscribe from asset interaction events
   */
  offAssetInteraction(callback: (event: IAssetInteractionEvent) => void): void {
    const wrappedCallback = this._eventListeners.get(callback);
    if (wrappedCallback) {
      this._assetEventEmitter.removeListener(
        IEventType.ASSET_INTERACTION,
        wrappedCallback
      );
      this._eventListeners.delete(callback);
    }
  }

  // PRIVATE HELPER METHODS

  /**
   * Setup event bubbling for asset interactions from feature entities
   */
  // private setupAssetEventBubbling(
  //   assetEntity: IAssetPoint | IAssetLine | IAssetPolygon
  // ): void {
  //   const eventEmitter = assetEntity.getEventEmitter();
  //
  //   // Store the mapping from entity ID to asset ID for event lookup
  //   this._entityIdToAssetId.set(assetEntity.id, assetEntity.assetId);
  //
  //   // Setup global listeners only once (shared across all assets)
  //   if (!this._globalClickListener) {
  //     this._globalClickListener = (event: IEvent) => {
  //       const assetId = this._entityIdToAssetId.get(event.id);
  //       if (!assetId) {
  //         console.warn(`No asset ID found for entity ID: ${event.id}`);
  //         return;
  //       }
  //
  //       const assetEntity = this.getAssetAnnotation(assetId);
  //       if (!assetEntity) {
  //         console.warn(`No asset entity found for asset ID: ${assetId}`);
  //         return;
  //       }
  //
  //       const bubbledEvent: IAssetInteractionEvent = {
  //         type: AssetInteractionEventType.CLICK,
  //         assetId: assetId,
  //         position: this.getAssetEntityPosition(
  //           assetEntity,
  //           this.getAssetGeometryType(assetEntity)
  //         ),
  //         metadata: assetEntity.metadata,
  //       };
  //
  //       this._assetEventEmitter.emit({
  //         type: IEventType.ASSET_INTERACTION,
  //         id: assetId,
  //         data: bubbledEvent,
  //       });
  //     };
  //     eventEmitter.addListener(IEventType.CLICK, this._globalClickListener);
  //   }
  //
  //   if (!this._globalHoverListener) {
  //     this._globalHoverListener = (event: IEvent) => {
  //       const assetId = this._entityIdToAssetId.get(event.id);
  //       if (!assetId) {
  //         console.warn(`No asset ID found for entity ID: ${event.id}`);
  //         return;
  //       }
  //
  //       const assetEntity = this.getAssetAnnotation(assetId);
  //       if (!assetEntity) {
  //         console.warn(`No asset entity found for asset ID: ${assetId}`);
  //         return;
  //       }
  //
  //       const bubbledEvent: IAssetInteractionEvent = {
  //         type: AssetInteractionEventType.HOVER,
  //         assetId: assetId,
  //         position: this.getAssetEntityPosition(
  //           assetEntity,
  //           this.getAssetGeometryType(assetEntity)
  //         ),
  //         metadata: assetEntity.metadata,
  //       };
  //
  //       this._assetEventEmitter.emit({
  //         type: IEventType.ASSET_INTERACTION,
  //         id: assetId,
  //         data: bubbledEvent,
  //       });
  //     };
  //     eventEmitter.addListener(
  //       IEventType.MOUSE_HOVER,
  //       this._globalHoverListener
  //     );
  //   }
  // }

  /**
   * Get geometry type from asset entity
   */
  private getAssetGeometryType(
    assetEntity: IAssetPoint | IAssetLine | IAssetPolygon
  ): 'point' | 'line' | 'polygon' {
    if (this._assetPointEntities.has(assetEntity.assetId)) {
      return 'point';
    } else if (this._assetLineEntities.has(assetEntity.assetId)) {
      return 'line';
    } else if (this._assetPolygonEntities.has(assetEntity.assetId)) {
      return 'polygon';
    }
    // Default fallback
    return 'position' in assetEntity
      ? 'point'
      : 'positions' in assetEntity
      ? 'line'
      : 'polygon';
  }

  /**
   * Get position from asset entity for event bubbling
   */
  private getAssetEntityPosition(
    assetEntity: IAssetPoint | IAssetLine | IAssetPolygon,
    geometryType: string
  ): any {
    // For point assets, get the position directly
    if (geometryType === 'point' && 'position' in assetEntity) {
      return (assetEntity as IAssetPoint).position;
    }

    // For lines and polygons, return the first position
    if (
      (geometryType === 'line' || geometryType === 'polygon') &&
      'positions' in assetEntity
    ) {
      const positions = (assetEntity as IAssetLine | IAssetPolygon).positions;
      return positions.length > 0
        ? positions[0]
        : { latitude: 0, longitude: 0, altitude: 0 };
    }

    return { latitude: 0, longitude: 0, altitude: 0 };
  }

  /**
   * Get asset category color for styling (configuration-based)
   */
  private getAssetCategoryColor(category: string): string {
    const categoryStyle = this._styleConfig.categories[category];
    return categoryStyle?.color || this._styleConfig.defaults.color;
  }

  /**
   * Get asset icon URL based on category (configuration-based)
   */
  private getAssetIconUrl(category: string): string {
    const categoryStyle = this._styleConfig.categories[category];
    if (categoryStyle?.iconUrl) {
      return categoryStyle.iconUrl;
    }

    // Fallback to base URL + category name
    const baseUrl = this._styleConfig.iconBaseUrl || 'assets/icons/map';
    return `${baseUrl}/${category}.svg`;
  }

  /**
   * Remove event bubbling listeners for an asset
   */
  private removeAssetEventBubbling(
    assetEntity: IAssetPoint | IAssetLine | IAssetPolygon
  ): void {
    try {
      // const eventEmitter = assetEntity.getEventEmitter();
      //
      // if (
      //   eventEmitter &&
      //   this._globalClickListener &&
      //   this._globalHoverListener
      // ) {
      //   // Remove the global listeners from this entity's event emitter
      //   eventEmitter.removeListener(
      //     IEventType.CLICK,
      //     this._globalClickListener
      //   );
      //   eventEmitter.removeListener(
      //     IEventType.MOUSE_HOVER,
      //     this._globalHoverListener
      //   );
      // }

      // Clean up the entity ID mapping
      this._entityIdToAssetId.delete(assetEntity.id);
    } catch (error) {
      console.warn('Failed to remove event bubbling listeners:', error);
    }
  }

  /**
   * Safely begin batch update with state tracking
   */
  private safeBatchBegin(): void {
    if (this._batchUpdateActive) {
      console.warn('Batch update already active, skipping nested begin');
      return;
    }

    try {
      if (this._mapServices.beginBatchUpdate) {
        this._mapServices.beginBatchUpdate();
        this._batchUpdateActive = true;
      }
    } catch (error) {
      console.warn(
        'Failed to begin batch update, continuing without optimization:',
        error
      );
      this._batchUpdateActive = false;
    }
  }

  /**
   * Safely end batch update with state tracking
   */
  private safeBatchEnd(): void {
    if (!this._batchUpdateActive) {
      return; // No active batch to end
    }

    try {
      if (this._mapServices.endBatchUpdate) {
        this._mapServices.endBatchUpdate();
      }
    } catch (error) {
      console.warn(
        'Failed to end batch update, rendering may continue normally:',
        error
      );
    } finally {
      // Always reset state, even if endBatchUpdate fails
      this._batchUpdateActive = false;
    }
  }

  /**
   * Validate batch asset IDs for duplicates
   */
  private validateBatchAssetIds(assetIds: string[]): {
    validAssets: string[];
    duplicateIds: string[];
  } {
    const seen = new Set<string>();
    const validAssets: string[] = [];
    const duplicateIds: string[] = [];

    for (const assetId of assetIds) {
      // Check for duplicates within the batch
      if (seen.has(assetId)) {
        if (!duplicateIds.includes(assetId)) {
          duplicateIds.push(assetId);
        }
        continue;
      }

      // Check for existing assets
      if (this.getAssetAnnotation(assetId)) {
        duplicateIds.push(assetId);
        continue;
      }

      seen.add(assetId);
      validAssets.push(assetId);
    }

    return { validAssets, duplicateIds };
  }
}
