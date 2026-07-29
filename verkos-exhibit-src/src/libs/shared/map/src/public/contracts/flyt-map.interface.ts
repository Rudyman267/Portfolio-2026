import { IPosition } from '@map/public/contracts/base';
import {
  IAnnotationManager,
  IAssetManager,
  ICompletedGotoManager,
  IDockMarkerManager,
  IDroneManager,
  IRCManager,
  IGotoMarkerManager,
  IGridMissionManager,
  IFleetMissionManager,
  IMissionPlannerManager,
  ISensorManager,
  IThreatModelManager,
  IZoneManager,
} from '@map/public/contracts/feature-entities';
import { MapLayers, ViewType } from '@map/public/core';
import { IEventType, IMapEventData } from '@map/public/contracts/events';

/**
 * Interface for map implementations like Cesium, Leaflet, etc.
 */
export interface IFlytMap {
  /**
   * Get initialization status
   */
  readonly isInitialized: boolean;

  /**
   * Initialize the map viewer
   */
  initialize(): Promise<void>;

  /**
   * Get drone model manager
   */
  getDroneManager(): IDroneManager;

  /**
   * Get RC marker manager
   */
  getRCManager(): IRCManager;

  /**
   * Get dock marker manager
   */
  getDockMarkerManager(): IDockMarkerManager;

  /**
   * Get mission manager
   */
  getFleetMissionManager(): IFleetMissionManager;

  /**
   * Get mission planner manager for creating and managing linear missions
   * @returns The mission planner manager instance
   */
  getMissionPlannerManager(): IMissionPlannerManager;

  /**
   * Get zone manager
   */
  getZoneManager(): IZoneManager;

  /**
   * Get threat model manager
   */
  getThreatManager(): IThreatModelManager;

  /**
   * Get goto marker manager
   */
  getGotoMarkerManager(): IGotoMarkerManager;

  /**
   * Get completed goto manager
   */
  getCompletedGotoManager(): ICompletedGotoManager;

  /**
   * Get annotation manager
   */
  getAnnotationManager(): IAnnotationManager;

  /**
   * Get grid mission manager
   */
  getGridMissionManager(): IGridMissionManager;

  /**
   * Get asset manager
   */
  getAssetManager(): IAssetManager;

  getSensorManager(): ISensorManager;

  /**
   * Center the map on a specific location
   */
  centerOn(latitude: number, longitude: number, height: number): void;

  /**
   * Register a callback for global map events
   * @param event The event type to register for
   * @param callback The callback function to execute when the event occurs
   */
  onGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void;

  /**
   * Unregister a callback for global map events
   * @param event The event type to unregister from
   * @param callback The callback function to remove
   */
  offGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void;

  /**
   * Dispose of all services
   */
  dispose(): void;

  /**
   * Toggle between 2D and 3D views
   * @param view View type (2D or 3D)
   */
  toggleView(view: ViewType): void;

  /**
   * Updates the map imagery layer based on the specified MapLayers enum.
   * This function removes the current imagery layer and adds a new one
   * with the specified style. It also adjusts the brightness of the new layer.
   *
   * @param {MapLayers} Layer - The desired map layer to display.
   */
  updateMapLayer(layer: MapLayers): boolean;

  /**
   * Zoom in by a fixed factor with minimum zoom constraint
   * @returns boolean indicating if zoom was successful or constrained
   */
  zoomIn(): boolean;

  /**
   * Zoom out by a fixed factor with maximum zoom constraint
   * @returns boolean indicating if zoom was successful or constrained
   */
  zoomOut(): boolean;

  /**
   * Pan the camera smoothly to a specific location or bounds
   * @param location Object containing either a single position or an array of positions to define bounds
   */
  panTo(location: { position?: IPosition; bounds?: IPosition[] }): void;

  /**
   * Reset the camera to face North while maintaining the current position
   * This reorients the camera to have a heading of 0 (North) while preserving location and height
   */
  resetToNorth(): void;

  /**
   * Get the AGL height for a specific position
   * @param position The position to get the AGL height for
   * @returns The AGL height in meters
   */
  getAGLHeight(position: IPosition): Promise<number>;

  onRenderError(listener: (error: Error) => void): void;

  offRenderError(listener: (error: Error) => void): void;

  /**
   * Calculate the HAE (Height Above Ellipsoid) for a specific position and AGL height
   * @param position The position (latitude, longitude) to calculate HAE for
   * @param aglHeight The AGL (Above Ground Level) height in meters
   * @returns The calculated HAE height in meters
   */
  getHAEHeight(position: IPosition, aglHeight: number): Promise<number>;

  /**
   * Get current camera heading in degrees (0 = North, clockwise)
   * @returns Current heading in degrees (0-360)
   */
  getCurrentHeading(): number;

  /**
   * Get current camera orientation details
   * @returns Object containing heading, pitch, roll in both radians and degrees
   */
  getCurrentOrientation(): {
    heading: number;
    pitch: number;
    roll: number;
    headingDegrees: number;
    pitchDegrees: number;
    rollDegrees: number;
  };

  /**
   * Calculate bearing angle between two positions
   * @param from Starting position
   * @param to Ending position
   * @returns Bearing angle in degrees (-180 to 180, where 0° = North)
   */
  calculateBearingBetweenPositions(from: IPosition, to: IPosition): number;
}
