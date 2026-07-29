import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Cesium3DTileStyle,
  CesiumTerrainProvider,
  EllipsoidGeodesic,
  EllipsoidTerrainProvider,
  ImageryLayer,
  Math as CesiumMath,
  sampleTerrainMostDetailed,
  SceneMode,
  TileMapServiceImageryProvider,
  Viewer,
} from 'cesium';
import {
  DragAltitudeMode,
  IEventsManager,
  IMapServices,
} from '@map/private/contracts';
import { IEventType, IMapEventData, IPosition } from '@map/public/contracts';
import { ICesiumMapService } from '@map/private/map-providers/cesium/types';
import { positionToCartesian } from '@map/private/map-providers/cesium/utils';

/**
 * Cesium implementation of the IMapServices interface
 * Provides map-specific utility functions using Cesium
 */
export class CesiumMapServicesImplementation implements IMapServices {
  private _viewer!: Viewer;
  private _eventsManager!: IEventsManager;
  private _imageryLayerCollection: Map<string, ImageryLayer> = new Map();
  private _tilesetCollection: Map<string, Cesium3DTileset> = new Map();
  private _terrainCollection: Map<string, CesiumTerrainProvider> = new Map();
  private _pointCloudCollection: Map<string, Cesium3DTileset> = new Map();

  // Track the current drag altitude mode with HAE as default
  private _currentDragAltitudeMode: DragAltitudeMode = DragAltitudeMode.HAE;

  constructor(private mapService: ICesiumMapService) {
    this._viewer = mapService.viewer;
    this._eventsManager = mapService.eventsManager;
  }

  public getTerrainHeight(position: IPosition): number {
    try {
      const height =
        this._viewer.scene.globe.getHeight(
          Cartographic.fromDegrees(position.longitude, position.latitude)
        ) || 0;

      return height;
    } catch (error) {
      console.error('Error getting terrain height:', error);
      return 0; // Return default height on error
    }
  }

  public async getTerrainHeightMostSampled(
    position: IPosition
  ): Promise<number> {
    try {
      const cartographicCoordinates = Cartographic.fromDegrees(
        position.longitude,
        position.latitude
      );
      const [updatedCartographic] = await sampleTerrainMostDetailed(
        this._viewer.terrainProvider,
        [cartographicCoordinates]
      );
      return updatedCartographic?.height || 0;
    } catch (error) {
      console.warn('Error getting getTerrainHeightMostSampled height:', error);
      return (
        this._viewer.scene.globe.getHeight(
          Cartographic.fromDegrees(position.longitude, position.latitude)
        ) || 0
      );
    }
  }

  /**
   * Sample terrain heights for multiple positions
   * @param positions Array of geographic positions
   * @returns Positions with updated altitude values
   */
  async getSampleTerrainHeights(positions: IPosition[]): Promise<number[]> {
    try {
      const cartographicPositions = positions.map((pos) =>
        Cartographic.fromDegrees(pos.longitude, pos.latitude, pos.altitude || 0)
      );

      const updatedCartographics = await sampleTerrainMostDetailed(
        this._viewer.terrainProvider,
        cartographicPositions
      );

      return updatedCartographics.map((cartographic) => cartographic.height);
    } catch (error) {
      console.error('Error sampling terrain heights:', error);
      // Return original positions if sampling fails
      return positions.map((pos) => pos.altitude ?? 0);
    }
  }

  /**
   * Centers the camera on a specific geographic position
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @param altitude Altitude in meters (optional)
   */
  centerOn(latitude: number, longitude: number, altitude = 0): void {
    // this._viewer.flyTo(latitude, longitude, altitude);
  }

  /**
   * Flies the camera to a specific position with animation
   * @param position Target position
   * @param options Flight options (duration, heading, pitch, etc.)
   * @returns Promise that resolves when the flight completes
   */
  async flyTo(position: IPosition, options: any = {}): Promise<void> {
    const cartesian = Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.altitude || 0
    );

    return new Promise<void>((resolve) => {
      this._viewer.camera.flyTo({
        destination: cartesian,
        duration: options.duration || 2.0,
        complete: () => resolve(),
        cancel: () => resolve(),
        ...options,
      });
    });
  }

  /**
   * Gets the current camera position
   * @returns Current camera position
   */
  getCameraPosition(): IPosition {
    const camera = this._viewer.camera;
    const position = camera.positionCartographic;

    return {
      latitude: CesiumMath.toDegrees(position.latitude),
      longitude: CesiumMath.toDegrees(position.longitude),
      altitude: position.height,
    };
  }

  /**
   * Converts screen coordinates to world position
   * @param screenX X coordinate in pixels
   * @param screenY Y coordinate in pixels
   * @returns World position or null if no position found
   */
  screenToWorld(screenX: number, screenY: number): IPosition | null {
    try {
      const viewer = this._viewer;
      const windowPosition = new Cartesian2(screenX, screenY);
      const pickRay = viewer.camera.getPickRay(windowPosition);

      if (!pickRay) {
        return null;
      }

      const cartesianPosition = viewer.scene.globe.pick(pickRay, viewer.scene);

      if (!cartesianPosition) {
        return null;
      }

      const cartographic = Cartographic.fromCartesian(cartesianPosition);
      return {
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        longitude: CesiumMath.toDegrees(cartographic.longitude),
        altitude: cartographic.height,
      };
    } catch (error) {
      console.error('Error converting screen to world coordinates:', error);
      return null;
    }
  }

  /**
   * Converts world position to screen coordinates
   * @param position World position
   * @returns Screen coordinates or null if position is not visible
   */
  worldToScreen(position: IPosition): { x: number; y: number } | null {
    try {
      const viewer = this._viewer;
      const cartesian = Cartesian3.fromDegrees(
        position.longitude,
        position.latitude,
        position.altitude || 0
      );

      const screenCoordinates = Cartesian2.fromCartesian3(cartesian);

      if (!screenCoordinates) {
        return null;
      }

      return {
        x: screenCoordinates.x,
        y: screenCoordinates.y,
      };
    } catch (error) {
      console.error('Error converting world to screen coordinates:', error);
      return null;
    }
  }

  /**
   * Checks if terrain is active and being used for height calculations
   * @returns True if terrain is active
   */
  isTerrainActive(): boolean {
    const terrainProvider = this._viewer.terrainProvider;
    return (
      !!terrainProvider &&
      Object.prototype.hasOwnProperty.call(terrainProvider, 'availability')
    );
  }

  /**
   * Gets the current visible map bounds
   * @returns Object with north, south, east, west bounds in degrees
   */
  getMapBounds(): { north: number; south: number; east: number; west: number } {
    const viewer = this._viewer;
    const camera = viewer.camera;

    // Get the corners of the visible area
    const ellipsoid = viewer.scene.globe.ellipsoid;
    const corners = [
      camera.pickEllipsoid(new Cartesian2(0, 0), ellipsoid),
      camera.pickEllipsoid(new Cartesian2(viewer.canvas.width, 0), ellipsoid),
      camera.pickEllipsoid(new Cartesian2(0, viewer.canvas.height), ellipsoid),
      camera.pickEllipsoid(
        new Cartesian2(viewer.canvas.width, viewer.canvas.height),
        ellipsoid
      ),
    ].filter(Boolean) as Cartesian3[];

    if (corners.length === 0) {
      // Default to a global view if we can't determine bounds
      return {
        north: 90,
        south: -90,
        east: 180,
        west: -180,
      };
    }

    // Convert to lat/lon and find min/max
    const positions = corners.map((corner) => {
      const cartographic = Cartographic.fromCartesian(corner);
      return {
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        longitude: CesiumMath.toDegrees(cartographic.longitude),
      };
    });

    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;

    positions.forEach((pos) => {
      north = Math.max(north, pos.latitude);
      south = Math.min(south, pos.latitude);
      east = Math.max(east, pos.longitude);
      west = Math.min(west, pos.longitude);
    });

    return { north, south, east, west };
  }

  overlayImagery(id: string, url: string): boolean {
    setTimeout(() => {
      try {
        const imageryLayer = ImageryLayer.fromProviderAsync(
          TileMapServiceImageryProvider.fromUrl(url),
          {
            show: true,
          }
        );
        this._viewer.imageryLayers.add(imageryLayer);
        this._imageryLayerCollection.set(id, imageryLayer);
        return true;
      } catch (error) {
        console.error('Error overlaying imagery:', error);
        return false;
      }
    }, 3000);
    return true;
  }

  async overlayTileset(id: string, url: string): Promise<boolean> {
    setTimeout(async () => {
      try {
        const tileset = await Cesium3DTileset.fromUrl(url);
        this._viewer.scene.primitives.add(tileset);
        this._tilesetCollection.set(id, tileset);
        return true;
      } catch (error) {
        console.error('Error overlaying tileset:', error);
        return false;
      }
    }, 3000);
    return true;
  }

  async overlayPointCloud(id: string, url: string): Promise<boolean> {
    setTimeout(async () => {
      try {
        const pointCloud = await Cesium3DTileset.fromUrl(url);
        pointCloud.pointCloudShading.attenuation = true; // Dynamic point sizing
        pointCloud.pointCloudShading.maximumAttenuation = 6.0; // Max point size in pixels
        pointCloud.pointCloudShading.eyeDomeLighting = true; // Depth-enhancing shading
        pointCloud.pointCloudShading.eyeDomeLightingStrength = 1.5; // Stronger shading
        pointCloud.pointCloudShading.eyeDomeLightingRadius = 1.5; // Wider shading area
        this._viewer.scene.primitives.add(pointCloud);
        this._tilesetCollection.set(id, pointCloud);
        return true;
      } catch (error) {
        console.error('Error overlaying point cloud:', error);
        return false;
      }
    }, 3000);
    return true;
  }

  async setTerrainFromUrl(url: string): Promise<boolean> {
    setTimeout(async () => {
      try {
        const terrainProvider = await CesiumTerrainProvider.fromUrl(url);
        this._viewer.scene.terrainProvider = terrainProvider;
        this._terrainCollection.set(url, terrainProvider);
        return true;
      } catch (error) {
        console.error('Error setting terrain from URL:', error);
        return false;
      }
    }, 3000);
    return true;
  }

  async overlayTerrain(id: string, url: string): Promise<boolean> {
    setTimeout(async () => {
      try {
        const terrainProvider = await CesiumTerrainProvider.fromUrl(url);
        this._viewer.scene.terrainProvider = terrainProvider;
        this._terrainCollection.set(id, terrainProvider);
        return true;
      } catch (error) {
        console.error('Error overlaying terrain:', error);
        return false;
      }
    }, 3000);
    return true;
  }

  async setTerrainFromAssetId(assetId: number): Promise<boolean> {
    try {
      const terrainProvider = await CesiumTerrainProvider.fromIonAssetId(
        assetId
      );
      this._viewer.scene.terrainProvider = terrainProvider;
      this._terrainCollection.set(
        String(assetId) + 'terrain_asset_id',
        terrainProvider
      );
      return true;
    } catch (error) {
      console.error('Error setting terrain from asset ID:', error);
      return false;
    }
  }

  removeImagery(id: string): boolean {
    try {
      const imageryLayer = this._imageryLayerCollection.get(id);
      if (!imageryLayer) {
        return false;
      }
      this._viewer.imageryLayers.remove(imageryLayer);
      this._imageryLayerCollection.delete(id);
      return true;
    } catch (error) {
      console.error('Error removing imagery:', error);
      return false;
    }
  }

  removeTileset(id: string): boolean {
    try {
      const tileset = this._tilesetCollection.get(id);
      if (!tileset) {
        return false;
      }
      this._viewer.scene.primitives.remove(tileset);
      this._tilesetCollection.delete(id);
      return true;
    } catch (error) {
      console.error('Error removing tileset:', error);
      return false;
    }
  }

  removeTerrain(): boolean {
    try {
      const ellipsoidTerrainProvider = new EllipsoidTerrainProvider();
      this._viewer.scene.terrainProvider = ellipsoidTerrainProvider;
      return true;
    } catch (error) {
      console.error('Error removing terrain:', error);
      return false;
    }
  }

  removePointCloud(id: string): boolean {
    try {
      const pointCloud = this._pointCloudCollection.get(id);
      if (!pointCloud) {
        return false;
      }
      this._viewer.scene.primitives.remove(pointCloud);
      this._pointCloudCollection.delete(id);
      return true;
    } catch (error) {
      console.error('Error removing point cloud:', error);
      return false;
    }
  }

  panToImagery(id: string) {
    const imageryLayer = this._imageryLayerCollection.get(id);
    if (!imageryLayer) {
      return;
    }
    this._viewer.flyTo(imageryLayer);
  }

  panToTileset(id: string) {
    const tileset = this._tilesetCollection.get(id);
    if (!tileset) {
      return;
    }
    this._viewer.flyTo(tileset);
  }

  updateImageryOpacity(id: string, opacity: number) {
    const imageryLayer = this._imageryLayerCollection.get(id);
    if (!imageryLayer) {
      return;
    }
    imageryLayer.alpha = opacity;
  }

  updateTilesetOpacity(id: string, opacity: number) {
    const tileset = this._tilesetCollection.get(id);
    if (!tileset) {
      return;
    }
    tileset.style = new Cesium3DTileStyle({
      color: `color("WHITE", ${opacity})`,
    });
  }

  setImageryVisibility(id: string, visible: boolean) {
    const imageryLayer = this._imageryLayerCollection.get(id);
    if (!imageryLayer) {
      return;
    }
    imageryLayer.show = visible;
  }

  onGlobalMapEvent(
    eventType: IEventType,
    callback: (event: IMapEventData) => void
  ) {
    this._eventsManager.onGlobalEvent(eventType, callback);
  }

  offGlobalMapEvent(
    eventType: IEventType,
    callback: (event: IMapEventData) => void
  ) {
    this._eventsManager.offGlobalEvent(eventType, callback);
  }

  /**
   * Get the current drag altitude mode
   * @returns The current drag altitude mode
   */
  getDragAltitudeMode(): DragAltitudeMode {
    return this._currentDragAltitudeMode;
  }

  /**
   * Set the drag altitude mode for marker dragging operations
   * @param mode The altitude mode to use
   */
  setDragAltitudeMode(mode: DragAltitudeMode): void {
    this._currentDragAltitudeMode = mode;

    // Also update the map service to keep both in sync
    if (this.mapService) {
      this.mapService.setDragAltitudeMode(mode);
    }
  }

  /**
   * Get the current scene mode (2D or 3D)
   * @returns The current scene mode, or undefined if not available
   */
  getCurrentSceneMode(): SceneMode | undefined {
    try {
      if (this._viewer && this._viewer.scene) {
        return this._viewer.scene.mode;
      }
    } catch (error) {
      console.warn('Could not get current scene mode:', error);
    }
    return undefined;
  }

  /**
   * Calculate distance between two geographic positions in meters
   * Uses Cesium's native Cartesian3.distance for accurate calculation
   * @param pos1 First position
   * @param pos2 Second position
   * @returns Distance in meters
   */
  calculateDistanceInMeters(pos1: IPosition, pos2: IPosition): number {
    // Convert both positions to Cartesian3
    const cartesian1 = positionToCartesian(pos1);
    const cartesian2 = positionToCartesian(pos2);

    // Use Cesium's built-in distance calculation
    return Cartesian3.distance(cartesian1, cartesian2);
  }

  /**
   * Calculate the surface distance between two geographic positions
   * This uses Cesium's geodesic calculations for accurate distance
   *
   * @param position1 The first position
   * @param position2 The second position
   * @returns The distance in meters
   */
  calculateSurfaceDistance(position1: IPosition, position2: IPosition): number {
    const cartographic1 = Cartographic.fromDegrees(
      position1.longitude,
      position1.latitude
    );

    const cartographic2 = Cartographic.fromDegrees(
      position2.longitude,
      position2.latitude
    );

    const geodesic = new EllipsoidGeodesic(cartographic1, cartographic2);
    return geodesic.surfaceDistance;
  }
}
