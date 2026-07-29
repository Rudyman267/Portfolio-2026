import { IEventType, IMapEventData, IPosition } from '@map/public/contracts';
import { SceneMode } from '@map/public/core';
import { DragAltitudeMode } from '@map/private/contracts';

/**
 * Interface for map-specific utility functions
 * Provides access to map capabilities like terrain sampling, camera control, etc.
 * Implemented by specific map map-map-tile-map-providers (e.g., Cesium)
 */
export interface IMapServices {
  /**
   * Get terrain height at a specific position
   * @param position Geographic position
   * @returns Height in meters
   */
  getTerrainHeight(position: IPosition): number;

  /**
   * Get terrain height using multiple samples for better accuracy
   * @param position Geographic position
   * @returns Promise resolving to height in meters
   */
  getTerrainHeightMostSampled(position: IPosition): Promise<number>;

  /**
   * Sample terrain heights for multiple positions
   * @param positions Array of geographic positions
   * @returns Positions with updated altitude values
   */
  getSampleTerrainHeights(positions: IPosition[]): Promise<number[]>;

  /**
   * Centers the camera on a specific geographic position
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @param altitude Altitude in meters (optional)
   */
  centerOn(latitude: number, longitude: number, altitude?: number): void;

  /**
   * Flies the camera to a specific position with animation
   * @param position Target position
   * @param options Flight options (duration, heading, pitch, etc.)
   * @returns Promise that resolves when the flight completes
   */

  flyTo(position: IPosition, options?: any): Promise<void>;

  /**
   * Gets the current camera position
   * @returns Current camera position
   */
  getCameraPosition(): IPosition;

  /**
   * Converts screen coordinates to world position
   * @param screenX X coordinate in pixels
   * @param screenY Y coordinate in pixels
   * @returns World position or null if no position found
   */
  screenToWorld(screenX: number, screenY: number): IPosition | null;

  /**
   * Converts world position to screen coordinates
   * @param position World position
   * @returns Screen coordinates or null if position is not visible
   */
  worldToScreen(position: IPosition): { x: number; y: number } | null;

  /**
   * Checks if terrain is active and being used for height calculations
   * @returns True if terrain is active
   */
  isTerrainActive(): boolean;

  /**
   * Gets the current visible map bounds
   * @returns Object with north, south, east, west bounds in degrees
   */
  getMapBounds(): { north: number; south: number; east: number; west: number };

  /**
   * Overlays an imagery layer on the map
   * @param id Unique identifier for the imagery layer
   * @param url URL of the imagery source
   */
  overlayImagery(id: string, url: string): boolean;

  /**
   * Overlays a tileset on the map
   * @param id Unique identifier for the tileset
   * @param url URL of the tileset source
   */
  overlayTileset(id: string, url: string): Promise<boolean>;

  /**
   * Overlays a point cloud on the map
   * @param id Unique identifier for the point cloud
   * @param url URL of the point cloud source
   */
  overlayPointCloud(id: string, url: string): Promise<boolean>;

  /**
   * Overlays terrain on the map
   * @param id Unique identifier for the terrain
   * @param url URL of the terrain source
   */
  overlayTerrain(id: string, url: string): Promise<boolean>;

  /**
   * Removes an imagery layer from the map
   * @param id Unique identifier for the imagery layer
   */
  removeImagery(id: string): boolean;

  /**
   * Removes a tileset from the map
   * @param id Unique identifier for the tileset
   */
  removeTileset(id: string): boolean;

  /**
   * Removes terrain from the map
   */
  removeTerrain(): boolean;

  /**
   * Removes point cloud from the map
   */
  removePointCloud(id: string): boolean;

  /**
   * Pans the camera to an imagery layer
   * @param id Unique identifier for the imagery layer
   */
  panToImagery(id: string): void;

  /**
   * Pans the camera to a tileset
   * @param id Unique identifier for the tileset
   */
  panToTileset(id: string): void;

  /**
   * Updates the opacity of an imagery layer
   * @param id Unique identifier for the imagery layer
   * @param opacity Opacity value (0.0 to 1.0)
   */
  updateImageryOpacity(id: string, opacity: number): void;

  /**
   * Updates the opacity of a tileset
   * @param id Unique identifier for the tileset
   * @param opacity Opacity value (0.0 to 1.0)
   */
  updateTilesetOpacity(id: string, opacity: number): void;

  /**
   * Register a callback for a global map event
   * @param event The event type to register for
   * @param callback The callback function to invoke when the event occurs
   */
  onGlobalMapEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void;

  /**
   * Unregister a callback for a global map event
   * @param event The event type to unregister for
   * @param callback The callback function to unregister
   */
  offGlobalMapEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void;

  /**
   * Get the current drag altitude mode
   * @returns The current drag altitude mode
   */
  getDragAltitudeMode(): DragAltitudeMode;

  /**
   * Set the drag altitude mode for marker dragging operations
   * @param mode The altitude mode to use
   */
  setDragAltitudeMode(mode: DragAltitudeMode): void;

  /**
   * Get the current scene mode (2D or 3D)
   * @returns The current scene mode, or undefined if not available
   */
  getCurrentSceneMode(): SceneMode | undefined;

  /**
   * Begin a batch update to suspend rendering for performance
   * Useful when creating many entities at once
   */
  beginBatchUpdate?(): void;

  /**
   * End a batch update to resume rendering
   * Should be called after beginBatchUpdate() and all entity operations
   */
  endBatchUpdate?(): void;

  calculateDistanceInMeters(pos1: IPosition, pos2: IPosition): number;

  calculateSurfaceDistance(position1: IPosition, position2: IPosition): number;
}
