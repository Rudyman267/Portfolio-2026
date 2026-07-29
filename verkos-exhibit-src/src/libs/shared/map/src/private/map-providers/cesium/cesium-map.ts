import { Viewer } from 'cesium';
import type { IFlytMapInternal } from '@map/private/contracts';
import {
  IBaseEntityManager,
  ICompositeManager,
  IEventsManager,
  IMapProviderServices,
} from '@map/private/contracts';
import {
  AnnotationManager,
  AssetManager,
  CompletedGotoManager,
  DockMarkerManager,
  DroneManager,
  FleetMissionManager,
  GotoMarkerManager,
  GridMissionManager,
  MissionPlannerManager,
  RCManager,
  SensorManager,
  ThreatModelManager,
  ZoneManager,
} from '@map/private/feature-entities';
import {
  IAnnotationManager,
  IAssetManager,
  ICompletedGotoManager,
  IDockMarkerManager,
  IDroneManager,
  IEventType,
  IGotoMarkerManager,
  IGridMissionManager,
  IMapEventData,
  IFleetMissionManager,
  IMissionPlannerManager,
  IPosition,
  ISensorManager,
  IThreatModelManager,
  IZoneManager,
  MapOptions,
  IRCManager,
} from '@map/public/contracts';
import { MapLayers, ViewType } from '@map/public/core';
import type {
  ICesiumProviderConfig,
  IMapProvider,
} from '@map/private/contracts/map-providers';
import {
  CesiumMapOptions,
  DEFAULT_CESIUM_PROVIDER_CONFIG,
} from './types/default-cesium-config';
import { CesiumMapService, CesiumProviderServices } from './services';
import { ICesiumMapService } from './types';
import { CompositeManager } from '@map/private/composite-entities';

/**
 * Cesium implementation of the FlytMap interface
 * This class serves as the cross-layer orchestrator that creates and manages components from all layers
 */
export class CesiumMap
  implements
    IFlytMapInternal,
    IMapProvider<IFlytMapInternal, ICesiumProviderConfig>
{
  /**
   * Container element ID where the map will be rendered
   */
  private _containerId: string;

  /**
   * Additional initialization options
   */
  private _options?: CesiumMapOptions;

  /**
   * Provider configuration metadata
   */
  private readonly _providerConfig: ICesiumProviderConfig;

  /**
   * Flag indicating whether the map has been initialized
   */
  private _isInitialized = false;

  /**
   * The Cesium Viewer instance
   */
  private _viewer: Viewer | null = null;

  /**
   * The Cesium events manager
   */
  private _eventsManager: IEventsManager | null = null;

  /**
   * The Cesium map services implementation
   */
  private _mapService: ICesiumMapService | null = null;

  /**
   * The provider services that combine entity managers and map services
   */
  private _providerServices: IMapProviderServices | null = null;

  /**
   * The composite manager instance
   */
  private _compositeManager: CompositeManager | null = null;

  /**
   * The drone manager instance
   */
  private _droneManager: DroneManager | null = null;

  /**
   * The RC manager instance
   */
  private _rcManager: RCManager | null = null;

  /**
   * The dock marker manager instance
   */
  private _dockMarkerManager: DockMarkerManager | null = null;

  /**
   * The mission manager instance
   */
  private _fleetMissionManager: FleetMissionManager | null = null;

  /**
   * The goto marker manager instance
   */
  private _gotoMarkerManager: GotoMarkerManager | null = null;

  /**
   * The completed goto manager instance
   */
  private _completedGotoManager: CompletedGotoManager | null = null;

  /**
   * The zone manager instance
   */
  private _zoneManager: ZoneManager | null = null;

  /**
   * The threat model manager instance
   */
  private _threatManager: ThreatModelManager | null = null;

  /**
   * The annotation manager instance
   */
  private _annotationManager: AnnotationManager | null = null;

  /**
   * The asset manager instance
   */
  private _assetManager: IAssetManager | null = null;

  /**
   * The mission planner manager instance
   */
  private _missionPlannerManager: MissionPlannerManager | null = null;

  /**
   * The grid mission manager instance
   */
  private _gridMissionManager: GridMissionManager | null = null;

  /**
   * The sensor manager instance
   */
  private _sensorManager: SensorManager | null = null;

  /**
   * Creates a new CesiumMap instance
   * @param containerId HTML element ID where the map will be rendered
   * @param options Additional initialization options
   */
  constructor(
    containerId: string,
    options?: CesiumMapOptions,
    providerConfig?: ICesiumProviderConfig
  ) {
    // Initialize map with container ID
    this._containerId = containerId;
    this._options = options;
    this._providerConfig = providerConfig ?? DEFAULT_CESIUM_PROVIDER_CONFIG;
  }

  /**
   * Gets whether the map has been initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Underlying map instance (the CesiumMap itself)
   */
  get mapInstance(): IFlytMapInternal {
    return this;
  }

  /**
   * Provider configuration exposed to the registry
   */
  get config(): ICesiumProviderConfig {
    return this._providerConfig;
  }

  /**
   * Initializes the map and all its components
   * This method orchestrates the creation and setup of all components
   * @returns Promise that resolves when initialization is complete
   * @throws Error if initialization fails
   */
  async initialize(): Promise<void> {
    this._mapService = new CesiumMapService();
    await this._mapService.createMapInstance(
      this._containerId,
      this._options,
      this._providerConfig
    );
    this._providerServices = new CesiumProviderServices(this._mapService);
    this._mapService.initializeDependencies();
    this._eventsManager = this._mapService.eventsManager;
    this._compositeManager = new CompositeManager(this._providerServices);
    this._droneManager = new DroneManager(this._compositeManager);
    this._rcManager = new RCManager(this._compositeManager);
    this._dockMarkerManager = new DockMarkerManager(this._compositeManager);
    this._fleetMissionManager = new FleetMissionManager(this._compositeManager);
    this._gotoMarkerManager = new GotoMarkerManager(this._compositeManager);
    this._completedGotoManager = new CompletedGotoManager(
      this._compositeManager
    );
    this._zoneManager = new ZoneManager(this._compositeManager);
    this._threatManager = new ThreatModelManager(this._compositeManager);
    this._annotationManager = new AnnotationManager(this._compositeManager);
    this._assetManager = new AssetManager(this._compositeManager);
    this._missionPlannerManager = new MissionPlannerManager(
      this._compositeManager
    );
    this._sensorManager = new SensorManager(this._compositeManager);
    this._gridMissionManager = new GridMissionManager(this._compositeManager);
    this._isInitialized = true;
  }

  /**
   * Gets the drone model manager for creating and managing drone models
   * @returns The drone model manager instance
   * @throws Error if map is not initialized
   */
  getDroneManager(): IDroneManager {
    this._ensureInitialized();
    if (!this._droneManager) {
      throw new Error('DroneManager is not initialized');
    }
    return this._droneManager;
  }

  /**
   * Gets the RC manager for creating and managing RC markers
   * @returns The RC manager instance
   * @throws Error if map is not initialized
   */
  getRCManager(): IRCManager {
    this._ensureInitialized();
    if (!this._rcManager) {
      throw new Error('RCManager is not initialized');
    }
    return this._rcManager;
  }

  /**
   * Gets the dock marker manager for creating and managing dock markers
   * @returns The dock marker manager instance
   * @throws Error if map is not initialized
   */
  getDockMarkerManager(): IDockMarkerManager {
    this._ensureInitialized();
    if (!this._dockMarkerManager) {
      throw new Error('DockMarkerManager is not initialized');
    }
    return this._dockMarkerManager;
  }

  /**
   * Gets the mission manager for creating and managing mission polylines
   * @returns The mission manager instance
   * @throws Error if map is not initialized
   */
  getFleetMissionManager(): IFleetMissionManager {
    this._ensureInitialized();
    if (!this._fleetMissionManager) {
      throw new Error('Fleet MissionManager is not initialized');
    }
    return this._fleetMissionManager;
  }

  /**
   * Gets the goto marker manager for creating and managing goto markers
   * @returns The goto marker manager instance
   * @throws Error if map is not initialized
   */
  getGotoMarkerManager(): IGotoMarkerManager {
    this._ensureInitialized();
    if (!this._gotoMarkerManager) {
      throw new Error('GotoMarkerManager is not initialized');
    }
    return this._gotoMarkerManager;
  }

  /**
   * Gets the completed goto manager for creating and managing completed gotos
   * @returns The completed goto manager instance
   * @throws Error if map is not initialized
   */
  getCompletedGotoManager(): ICompletedGotoManager {
    this._ensureInitialized();
    if (!this._completedGotoManager) {
      throw new Error('CompletedGotoManager is not initialized');
    }
    return this._completedGotoManager;
  }

  /**
   * Gets the zone manager for creating and managing zones
   * @returns The zone manager instance
   * @throws Error if map is not initialized
   */
  getZoneManager(): IZoneManager {
    this._ensureInitialized();
    if (!this._zoneManager) {
      throw new Error('ZoneManager is not initialized');
    }
    return this._zoneManager;
  }

  /**
   * Gets the threat model manager for creating and managing threat models
   * @returns The threat model manager instance
   * @throws Error if map is not initialized
   */
  getThreatManager(): IThreatModelManager {
    this._ensureInitialized();
    if (!this._threatManager) {
      throw new Error('ThreatManager is not initialized');
    }
    return this._threatManager;
  }

  /**
   * Gets the annotation manager for creating and managing annotations
   * @returns The annotation manager instance
   * @throws Error if map is not initialized
   */
  getAnnotationManager(): IAnnotationManager {
    this._ensureInitialized();
    if (!this._annotationManager) {
      throw new Error('AnnotationManager is not initialized');
    }
    return this._annotationManager;
  }

  /**
   * Gets the grid mission manager for creating and managing grid missions
   * @returns The grid mission manager instance
   * @throws Error if map is not initialized
   */
  getGridMissionManager(): IGridMissionManager {
    this._ensureInitialized();
    if (!this._gridMissionManager) {
      throw new Error('GridMissionManager is not initialized');
    }
    return this._gridMissionManager;
  }

  getAssetManager(): IAssetManager {
    this._ensureInitialized();
    if (!this._assetManager) {
      throw new Error('AssetManager is not initialized');
    }
    return this._assetManager;
  }

  /**
   * ONLY AND ONLY FOR TESTING AND DEVELOPMENT PURPOSES
   * @returns Mission planner manager
   */
  getMissionPlannerManager(): IMissionPlannerManager {
    this._ensureInitialized();
    if (!this._missionPlannerManager) {
      throw new Error('MissionPlannerManager is not initialized');
    }
    return this._missionPlannerManager;
  }

  getSensorManager(): ISensorManager {
    this._ensureInitialized();
    if (!this._sensorManager) {
      throw new Error('SensorManager is not initialized');
    }
    return this._sensorManager;
  }

  /**
   * Centers the map view on a specific location
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @param height Optional height/altitude in meters
   * @throws Error if map is not initialized
   */
  centerOn(latitude: number, longitude: number, height: number): void {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    this._mapService.centerOn(latitude, longitude, height);
  }

  onGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    this._mapService.eventsManager?.onGlobalEvent(event, callback);
  }

  offGlobalEvent(
    event: IEventType,
    callback: (event: IMapEventData) => void
  ): void {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    this._mapService.eventsManager?.offGlobalEvent(event, callback);
  }

  /**
   * Disposes of all resources managed by this map instance
   * Resources are cleaned up in the reverse order of initialization
   */
  dispose(): void {
    // Safe to call even if not initialized or already disposed

    // Dispose of feature managers
    if (this._annotationManager) {
      this._annotationManager = null;
    }

    if (this._threatManager) {
      this._threatManager = null;
    }

    if (this._zoneManager) {
      this._zoneManager.clearAll();
      this._zoneManager = null;
    }

    if (this._gotoMarkerManager) {
      this._gotoMarkerManager.clearAll();
      this._gotoMarkerManager = null;
    }

    if (this._completedGotoManager) {
      this._completedGotoManager.clearAll();
      this._completedGotoManager = null;
    }

    if (this._fleetMissionManager) {
      this._fleetMissionManager.clearAll();
      this._fleetMissionManager = null;
    }

    if (this._droneManager) {
      this._droneManager.clearAll();
      this._droneManager = null;
    }

    if (this._assetManager) {
      this._assetManager.clearAll();
      this._assetManager = null;
    }

    // 2. Composite manager
    this._compositeManager = null;

    // 3. Events manager
    if (this._eventsManager) {
      this._eventsManager.dispose();
      this._eventsManager = null;
    }

    // 4. Provider services (no explicit cleanup needed, just nullify)
    this._providerServices = null;
    // 6. Reset state
    this._isInitialized = false;

    this._viewer?.destroy();
    this._viewer = null;
  }

  /**
   * Ensures the map is initialized before performing operations
   * @private
   * @throws Error if map is not initialized
   */
  private _ensureInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('Map is not initialized. Call initialize() first.');
    }
  }

  /**
   * ONLY AND ONLY FOR TESTING AND DEVELOPMENT PURPOSES
   * @returns Base entity manager
   */
  getBaseManager(): IBaseEntityManager | null | undefined {
    this._ensureInitialized();
    return this._compositeManager?.getBaseManager();
  }

  /**
   * ONLY AND ONLY FOR TESTING AND DEVELOPMENT PURPOSES
   * @returns Composite entity manager
   */
  getCompositeManager(): ICompositeManager | null {
    this._ensureInitialized();
    return this._compositeManager;
  }

  /**
   * Get the current view mode (readonly)
   * @returns The current view mode (ThreeD or TwoD)
   */
  get currentView(): ViewType {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    return this._mapService.currentView;
  }

  /**
   * Toggle between 2D and 3D view modes
   * @param view The view mode to switch to (ThreeD or TwoD)
   */
  toggleView(view: ViewType): void {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    this._mapService.toggleView(view);
  }

  updateMapLayer(layer: MapLayers): boolean {
    this._ensureInitialized();
    try {
      if (!this._mapService) {
        throw new Error('MapService is not initialized');
      }
      this._mapService.updateMapLayer(layer);
      return true;
    } catch (error) {
      console.error('Error updating map layer:', error);
      return false;
    }
  }

  /**
   * Zoom in by a fixed factor with minimum zoom constraint
   * @returns boolean indicating if zoom was successful or constrained
   */
  zoomIn(): boolean {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    return this._mapService.zoomIn();
  }

  /**
   * Zoom out by a fixed factor with maximum zoom constraint
   * @returns boolean indicating if zoom was successful or constrained
   */
  zoomOut(): boolean {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    return this._mapService.zoomOut();
  }

  panTo(location: { position?: IPosition; bounds?: IPosition[] }): void {
    this._ensureInitialized();
    if (this._mapService) {
      this._mapService.panTo(location);
    }
  }

  /**
   * Reset the camera to face North while maintaining the current position
   * This reorients the camera to have a heading of 0 (North) while preserving location and height
   */
  resetToNorth(): void {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    this._mapService.resetToNorth();
  }

  async getAGLHeight(position: IPosition): Promise<number> {
    this._ensureInitialized();
    const terrainHeight = await this._mapService?.getTerrainHeightMostSampled(
      position
    );
    return position?.altitude ? position.altitude - (terrainHeight ?? 0) : 0;
  }

  onRenderError(listener: (error: Error) => void): void {
    this._ensureInitialized();
    this._eventsManager?.onRenderError(listener);
  }

  offRenderError(listener: (error: Error) => void): void {
    this._ensureInitialized();
    this._eventsManager?.offRenderError(listener);
  }

  async getHAEHeight(position: IPosition, aglHeight: number): Promise<number> {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    const terrainHeight = await this._mapService.getTerrainHeightMostSampled(
      position
    );
    return (terrainHeight ?? 0) + aglHeight;
  }

  /**
   * Get current map heading/orientation in degrees
   * @returns Current heading in degrees (0-360, where 0 = North)
   */
  getCurrentHeading(): number {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    return this._mapService.getCurrentHeading();
  }

  /**
   * Get detailed camera orientation information
   * @returns Object containing heading, pitch, roll in both radians and degrees
   */
  getCurrentOrientation(): {
    heading: number;
    pitch: number;
    roll: number;
    headingDegrees: number;
    pitchDegrees: number;
    rollDegrees: number;
  } {
    this._ensureInitialized();
    if (!this._mapService) {
      throw new Error('MapService is not initialized');
    }
    return this._mapService.getCurrentOrientation();
  }

  /**
   * Calculate bearing angle between two positions (ignoring altitude)
   * @param from Starting position
   * @param to Ending position
   * @returns Bearing angle in degrees (-180 to 180, where 0° = North)
   */
  calculateBearingBetweenPositions(from: IPosition, to: IPosition): number {
    this._ensureInitialized();

    // Use existing OrientationComputationService calculation
    const deltaLat = to.latitude - from.latitude;
    const deltaLng = to.longitude - from.longitude;

    // Calculate heading using atan2 (returns radians)
    const headingRadians = Math.atan2(deltaLng, deltaLat);

    // Convert to degrees
    const headingDegrees = headingRadians * (180 / Math.PI);

    // Normalize to -180 to 180 degree range
    return ((((headingDegrees + 180) % 360) + 360) % 360) - 180;
  }
}
