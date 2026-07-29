import { Viewer } from 'cesium';
import {
  DragAltitudeMode,
  type ICesiumProviderConfig,
  IEventsManager,
} from '@map/private/contracts';
import { IPosition, MapOptions } from '@map/public/contracts';
import { MapLayers, ViewType } from '@map/public/core';
import { CesiumMapOptions } from './default-cesium-config';

/**
 * Interface for Cesium-specific map service
 * This provides access to Cesium viewer instance and related functionality
 */
export interface ICesiumMapService {
  /**
   * Events manager for handling map events
   */
  readonly eventsManager: IEventsManager;

  /**
   * Cesium viewer instance
   */
  readonly viewer: Viewer;

  /**
   * Get the current view mode (readonly)
   */
  readonly currentView: ViewType;

  /**
   * Get the current drag altitude mode (readonly)
   */
  readonly currentDragAltitudeMode: DragAltitudeMode;

  /**
   * Create and initialize the Cesium map instance
   * @param containerId ID of the HTML element to contain the map
   */
  createMapInstance(
    containerId: string,
    mapOptions?: CesiumMapOptions,
    providerConfig?: ICesiumProviderConfig
  ): Promise<void>;
  /**
   * Initialize the events manager
   * @returns The initialized events manager
   */
  initializeEventsManager(): IEventsManager;

  /**
   * Initialize map dependencies
   */
  initializeDependencies(): void;

  /**
   * Center the map on a specific location
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @param height Height in meters
   */
  centerOn(latitude: number, longitude: number, height: number): void;

  /**
   * Dispose of the map instance and clean up resources
   */
  dispose(): void;

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
  updateMapLayer(Layer: MapLayers): Promise<void>;

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
   * Pan to a specific location
   * @param position Geographic position
   */
  panTo(location: { position?: IPosition; bounds?: IPosition[] }): void;

  /**
   * Reset the map to north
   */
  resetToNorth(): void;

  /**
   * Set the drag altitude mode for marker dragging operations
   * @param mode The altitude mode to use
   * @internal This method is called by CesiumMapServicesImplementation
   */
  setDragAltitudeMode(mode: DragAltitudeMode): void;

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
}
