// noinspection ExceptionCaughtLocallyJS

import {
  Cartesian3,
  Cartographic,
  createWorldTerrainAsync,
  DirectionalLight,
  Event,
  HeadingPitchRoll,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  Rectangle,
  RequestScheduler,
  sampleTerrainMostDetailed,
  SceneMode,
  Viewer,
} from 'cesium';
import {
  ArcGisMapProvider,
  BaseMapProvider,
  BingMapsProvider,
  GoogleMapsProvider,
  LocalTileProvider,
  SimpleBaseMapProvider,
} from '@map/private/map-providers/cesium/map-tile-providers';
import {
  ArcGisConfig,
  BaseMapConfiguration,
  IEventType,
  IPosition,
  LocalConfig,
  MapOptions,
} from '@map/public/contracts';
import { BaseMapType, MapLayers, ViewType } from '@map/public/core';

import {
  CLASSES,
  SEARCH_SVG,
} from '@map/private/map-providers/cesium/constants';
import {
  CesiumMapOptions,
  ICesiumMapService,
} from '@map/private/map-providers/cesium/types';
import { CesiumEventsManager } from '@map/private/map-providers/cesium/events';
import type { KeyboardManager } from '@hardware-controls/keyboard';
import {
  BaseMapProviderFactory,
  ProviderRegistry,
} from './map-tile-provider-factory.service';
import { svgUtils } from '@map/private/utils';
import {
  DragAltitudeMode,
  type ICesiumProviderConfig,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
} from '@map/private/contracts';

/**
 * Cesium Map Services class
 * Manages and initializes dependent services for Cesium map implementation
 */
export class CesiumMapService implements ICesiumMapService {
  private _viewer!: Viewer;
  private _eventsManager: CesiumEventsManager | null = null;
  private static instances: Map<string, CesiumMapService> = new Map();
  private static providersRegistered = false;
  private static providerRegistry: ProviderRegistry;
  private static providerFactory: BaseMapProviderFactory;
  private defaultViewerOptions: Viewer.ConstructorOptions = {
    animation: false,
    timeline: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    shouldAnimate: false,
    sceneMode: SceneMode.SCENE3D,
    selectionIndicator: false,
    useBrowserRecommendedResolution: true,
    baseLayerPicker: false,
    requestRenderMode: false,
    showRenderLoopErrors: false,
    targetFrameRate: 20,
    geocoder: true,
  };

  private cameraEventListenerRemoveCallback!: Event.RemoveCallback;

  // Constants for zoom constraints
  private readonly MIN_ZOOM_HEIGHT = 200; // Minimum height (max zoom in) in meters
  private readonly MAX_ZOOM_HEIGHT = 20000000; // Maximum height (max zoom out) in meters
  private readonly ZOOM_FACTOR = 0.5; // How much to zoom in/out per click (0.5 = halve/double distance)

  // Store the last 3D orientation to restore when toggling back from 2D
  private _lastThreeDOrientation: {
    heading: number;
    pitch: number;
    roll: number;
  } = {
    heading: 0,
    pitch: CesiumMath.toRadians(-45), // Default tilted view
    roll: 0,
  };

  // Track the current view mode with 3D as the initial state
  private _currentView: ViewType = ViewType.ThreeD;

  // Track the current drag altitude mode with HAE as default
  private _currentDragAltitudeMode: DragAltitudeMode = DragAltitudeMode.HAE;

  // Base map provider configuration
  private _currentBaseMapType?: BaseMapType;
  private _currentBaseMapConfig?: ArcGisConfig | LocalConfig;
  private _currentBaseMapProvider?: BaseMapProvider;
  private _baseMapConfiguration?: BaseMapConfiguration;
  private _mapOptions?: CesiumMapOptions;
  private _providerConfig?: ICesiumProviderConfig;

  get viewer(): Viewer {
    return this._viewer;
  }

  public async createMapInstance(
    containerId: string,
    mapOptions: CesiumMapOptions,
    providerConfig: ICesiumProviderConfig
  ) {
    this._mapOptions = mapOptions;
    this._providerConfig = providerConfig;
    // Initialize provider registry and managers on first initialization
    if (!CesiumMapService.providersRegistered) {
      CesiumMapService.providerRegistry = new ProviderRegistry();
      CesiumMapService.providerFactory = new BaseMapProviderFactory(
        CesiumMapService.providerRegistry
      );

      // Register all base map map-map-tile-map-providers
      CesiumMapService.providerFactory.registerProvider(
        BaseMapType.BING,
        () => new BingMapsProvider()
      );
      CesiumMapService.providerFactory.registerProvider(
        BaseMapType.ARCGIS,
        () => new ArcGisMapProvider()
      );
      CesiumMapService.providerFactory.registerProvider(
        BaseMapType.GOOGLE,
        () => new GoogleMapsProvider()
      );
      CesiumMapService.providerFactory.registerProvider(
        BaseMapType.LOCAL,
        () => new LocalTileProvider()
      );

      CesiumMapService.providersRegistered = true;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with id "${containerId}" not found`);
      return;
    }

    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    Ion.defaultAccessToken =
      providerConfig?.providerOptions?.ionAccessToken || '';

    try {
      RequestScheduler.throttleRequests = true;
      RequestScheduler.requestsByServer = {
        'api.cesium.com:443': 5,
        'assets.cesium.com:443': 5,
      };
      const terrainProvider = await createWorldTerrainAsync();
      this._viewer = new Viewer(containerId, {
        ...this.defaultViewerOptions,
        terrainProvider,
      });

      this.viewer.scene.globe.depthTestAgainstTerrain = true;
      this.viewer.scene.globe.tileCacheSize = 1000;
      this.viewer.scene.screenSpaceCameraController.minimumZoomDistance =
        MAP_MIN_ZOOM;
      this.viewer.scene.screenSpaceCameraController.maximumZoomDistance =
        MAP_MAX_ZOOM;

      this.viewer.shadows = false;
      this.viewer.scene.highDynamicRange = false;
      this.viewer.scene.globe.enableLighting = false;
      this.viewer.scene.globe.enableLighting = false;
      this.viewer.scene.screenSpaceCameraController.enableLook = false;
      this.viewer.camera.percentageChanged = 0.1;
      const container = document.getElementById(containerId);
      this.trackCameraOrientation();
      if (container) {
        await this.replaceCesiumSearchButtonSvg(container);
      }
      await this.removeDefaultSkyObjects();

      // Apply base map configuration if provided
      if (mapOptions?.baseMapConfig) {
        await this.applyDatabaseBaseMapConfiguration(mapOptions.baseMapConfig);
      }

      // Initialize events manager and cursor handlers
      this._eventsManager = this.initializeEventsManager();
      this.handleCursor();
      if (mapOptions && mapOptions.viewMode !== undefined) {
        this.toggleView(mapOptions.viewMode);
      }
    } catch (viewerError) {
      console.warn(viewerError);
      throw viewerError;
    }
    if (!this._viewer) {
      throw new Error('Failed to create Cesium viewer');
    }
  }

  /**
   * Initialize all dependent services
   */
  public initializeDependencies(): void {
    this.initializeEventsManager();
  }

  /**
   * Center the camera on a specific location
   * @param latitude Latitude in degrees
   * @param longitude Longitude in degrees
   * @param altitude
   */
  public centerOn(latitude: number, longitude: number, altitude: number): void {
    if (!this._viewer) {
      console.error('Cannot center map: viewer not initialized');
      return;
    }

    const position = Cartesian3.fromDegrees(longitude, latitude, altitude);

    // Set camera orientation if provided
    const orientation = new HeadingPitchRoll(
      CesiumMath.toRadians(0),
      CesiumMath.toRadians(-45),
      CesiumMath.toRadians(0)
    );

    // Fly to the position with shorter duration
    this.viewer.camera.flyTo({
      destination: position,
      orientation: orientation,
      duration: 1.5,
    });
  }

  /**
   * Get the events manager instance as a readonly property
   */
  public get eventsManager(): CesiumEventsManager {
    if (!this._eventsManager) {
      this.initializeEventsManager();
    }
    if (!this._eventsManager) {
      throw new Error('Failed to initialize events manager');
    }
    return this._eventsManager;
  }

  /**
   * Initialize the events manager
   * @returns CesiumEventsManager instance
   */
  public initializeEventsManager(): CesiumEventsManager {
    if (!this._eventsManager) {
      this._eventsManager = new CesiumEventsManager(
        this._viewer,
        this._providerConfig?.providerOptions?.keyboardManager || null,
        this._providerConfig?.providerOptions?.keyboardControlsAvailable ===
          true
      );
    }
    return this._eventsManager;
  }

  /**
   * Dispose of all services
   */
  public dispose(): void {
    this._eventsManager = null;
    if (this._viewer && this._viewer.container && this._viewer.container.id) {
      CesiumMapService.instances.delete(this._viewer.container.id);
    }
  }

  public getTerrainHeight(position: IPosition): number {
    // Getting terrain height for position
    return (
      this._viewer.scene.globe.getHeight(
        Cartographic.fromDegrees(position.longitude, position.latitude)
      ) || 0
    );
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
        this.viewer.scene.globe.getHeight(
          Cartographic.fromDegrees(position.longitude, position.latitude)
        ) || 0
      );
    }
  }

  /**
   * Get the current view mode (readonly)
   * @returns The current view mode (ThreeD or TwoD)
   */
  public get currentView(): ViewType {
    return this._currentView;
  }

  /**
   * Get the current drag altitude mode (readonly)
   * @returns The current drag altitude mode
   */
  public get currentDragAltitudeMode(): DragAltitudeMode {
    return this._currentDragAltitudeMode;
  }

  /**
   * Set the drag altitude mode for marker dragging operations
   * @param mode The altitude mode to use
   * @internal This method is called by CesiumMapServicesImplementation
   */
  public setDragAltitudeMode(mode: DragAltitudeMode): void {
    this._currentDragAltitudeMode = mode;
  }

  /**
   * Toggle between 2D and 3D view modes while maintaining position and orientation
   * @param view The view mode to switch to (ThreeD or TwoD)
   */
  public toggleView(view: ViewType): void {
    const scene = this._viewer.scene;
    const camera = this._viewer.camera;

    // Store current view parameters
    const cameraPosition = camera.positionCartographic;
    const longitude = CesiumMath.toDegrees(cameraPosition.longitude);
    const latitude = CesiumMath.toDegrees(cameraPosition.latitude);
    const height = cameraPosition.height;

    // Track if we're transitioning from 2D to 3D
    const isTransitioningFrom2Dto3D =
      scene.mode !== SceneMode.SCENE3D && view === ViewType.ThreeD;

    // Store the current 3D orientation before switching to 2D
    if (scene.mode === SceneMode.SCENE3D && view === ViewType.TwoD) {
      this._lastThreeDOrientation = {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      };
    }

    // Set the scene mode directly instead of morphing
    if (view === ViewType.ThreeD) {
      scene.mode = SceneMode.SCENE3D;
    } else {
      scene.mode = SceneMode.SCENE2D;
    }

    // Force the scene to update
    scene.requestRender();

    // Restore the view to focus on the same area with proper orientation
    if (view === ViewType.ThreeD) {
      // For 3D mode, determine orientation based on previous state
      let orientation;

      if (isTransitioningFrom2Dto3D || !this._lastThreeDOrientation) {
        // Coming from 2D to 3D or first time in 3D - use 45-degree tilt
        orientation = {
          heading: 0,
          pitch: CesiumMath.toRadians(-60), // 45-degree tilt (negative for looking down)
          roll: 0,
        };
      } else {
        // Otherwise use last saved orientation
        orientation = this._lastThreeDOrientation;
      }

      camera.flyTo({
        destination: Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: orientation,
        duration: 0.7, // Slightly longer for smoother transition
        complete: () => {
          // Ensure render is requested after animation completes
          scene.requestRender();
          // Update the current view state after successful transition
          this._currentView = view;
        },
      });
      this._eventsManager?.onSceneChange(scene.mode);
    } else {
      this._eventsManager?.onSceneChange(scene.mode);
      camera.setView({
        destination: Cartesian3.fromDegrees(longitude, latitude, height),
      });

      this._currentView = view;
    }
  }

  async updateMapLayer(Layer: MapLayers): Promise<void> {
    try {
      let imageryProvider;
      let layerBrightness = 1.1;

      if (this._currentBaseMapProvider) {
        if (this._currentBaseMapProvider instanceof SimpleBaseMapProvider) {
          if (this._currentBaseMapProvider.isLayerSupported(Layer)) {
            imageryProvider =
              await this._currentBaseMapProvider.createImageryProvider(Layer);
            this._currentBaseMapProvider.setLayer(Layer);
            layerBrightness = this.getLayerBrightness(Layer);
          }
        } else {
          {
            {
              if (this._currentBaseMapConfig) {
                imageryProvider =
                  await this._currentBaseMapProvider.createImageryProvider(
                    this._currentBaseMapConfig
                  );
              }
              layerBrightness = 1.1;
            }
          }
        }
      }

      const newLayer = new ImageryLayer(imageryProvider, {
        brightness: layerBrightness,
      });

      if (this.viewer.imageryLayers.length > 1) {
        this.viewer.imageryLayers.remove(
          this.viewer.imageryLayers.get(1),
          true
        );
      }

      this.viewer.imageryLayers.add(newLayer, 1);
    } catch (error) {
      console.error('Failed to update map layer:', error);
    }
  }

  /**
   * Zoom in by a fixed factor with minimum zoom constraint
   * @returns boolean indicating if Zoom was successful or constrained
   */
  public zoomIn(): boolean {
    if (!this._viewer) return false;

    const camera = this._viewer.camera;
    const scene = this._viewer.scene;
    const currentHeight = camera.positionCartographic.height;

    // Check if already at min zoom
    if (currentHeight <= this.MIN_ZOOM_HEIGHT) {
      return false;
    }

    // Handle zooming differently based on scene mode
    if (scene.mode === SceneMode.SCENE2D) {
      // In 2D mode, use the native zoomIn function which is optimized for 2D
      camera.zoomIn(currentHeight * (1 - this.ZOOM_FACTOR));
      return true;
    } else {
      // In 3D mode, use our custom height-based zooming
      // Calculate new height with zoom factor (min 200m)
      const newHeight = Math.max(
        currentHeight * this.ZOOM_FACTOR,
        this.MIN_ZOOM_HEIGHT
      );

      // If we're already very close to min zoom, just set to min
      if (Math.abs(newHeight - this.MIN_ZOOM_HEIGHT) < 10) {
        this.zoomToHeight(this.MIN_ZOOM_HEIGHT);
        return true;
      }

      this.zoomToHeight(newHeight);
      return true;
    }
  }

  /**
   * Zoom out by a fixed factor with maximum zoom constraint
   * @returns boolean indicating if Zoom was successful or constrained
   */
  public zoomOut(): boolean {
    if (!this._viewer) return false;

    const camera = this._viewer.camera;
    const scene = this._viewer.scene;
    const currentHeight = camera.positionCartographic.height;

    // Check if already at max zoom
    if (currentHeight >= this.MAX_ZOOM_HEIGHT) {
      return false;
    }

    // Handle zooming differently based on scene mode
    if (scene.mode === SceneMode.SCENE2D) {
      // In 2D mode, use the native zoomOut function which is optimized for 2D
      camera.zoomOut(currentHeight * (1 / this.ZOOM_FACTOR - 1));
      return true;
    } else {
      // In 3D mode, use our custom height-based zooming
      // Calculate new height with zoom factor (max 20M meters)
      const newHeight = Math.min(
        currentHeight / this.ZOOM_FACTOR,
        this.MAX_ZOOM_HEIGHT
      );

      // If we're already very close to max zoom, just set to max
      if (Math.abs(newHeight - this.MAX_ZOOM_HEIGHT) < 1000) {
        this.zoomToHeight(this.MAX_ZOOM_HEIGHT);
        return true;
      }

      this.zoomToHeight(newHeight);
      return true;
    }
  }

  /**
   * Helper method to zoom towards what the user is looking at (the view center)
   */
  private zoomToHeight(height: number): void {
    const camera = this._viewer.camera;
    const scene = this._viewer.scene;

    // Get current camera position and orientation
    const currentPosition = camera.position.clone();
    const currentHeading = camera.heading;
    const currentPitch = camera.pitch;
    const currentRoll = camera.roll;

    // Calculate the center point that the camera is looking at
    // First get the ray from the camera position in the look direction
    const ray = camera.getPickRay(
      new Cartesian3(
        scene.canvas.clientWidth / 2,
        scene.canvas.clientHeight / 2,
        0
      )
    );

    // Find where this ray intersects the globe
    let center;
    if (ray) {
      center = scene.globe.pick(ray, scene);
    }
    // If we couldn't find the center point (e.g., looking at space), use a different approach
    if (!center) {
      // Calculate a point along the camera's direction vector
      const direction = camera.direction;
      const distance = camera.positionCartographic.height;
      center = new Cartesian3();
      Cartesian3.multiplyByScalar(direction, distance, center);
      Cartesian3.add(camera.position, center, center);
    }

    // Convert the current position and target to cartographic
    const currentPositionCartographic =
      Cartographic.fromCartesian(currentPosition);
    const currentHeight = currentPositionCartographic.height;

    // Calculate the distance ratio for the move
    const ratio = height / currentHeight;

    // Calculate the new camera position
    // The formula moves the camera closer to or further from the center point
    // while maintaining the view direction
    const vectorToCenter = Cartesian3.subtract(
      center,
      currentPosition,
      new Cartesian3()
    );
    const distanceToCenter = Cartesian3.magnitude(vectorToCenter);

    const newDistance = distanceToCenter * ratio;
    const newVectorToCenter = Cartesian3.multiplyByScalar(
      Cartesian3.normalize(vectorToCenter, new Cartesian3()),
      newDistance,
      new Cartesian3()
    );

    const newPosition = Cartesian3.subtract(
      center,
      newVectorToCenter,
      new Cartesian3()
    );

    // Use flyTo for smoother transition while preserving orientation
    camera.flyTo({
      destination: newPosition,
      orientation: {
        heading: currentHeading,
        pitch: currentPitch,
        roll: currentRoll,
      },
      duration: 0.4, // Quick transition
      complete: () => {
        // Ensure render is requested after animation completes
        scene.requestRender();
      },
    });
  }

  /**
   * Pan the camera smoothly to a specific location or bounds
   * @param location Object containing either a single position or an array of positions to define bounds
   */
  panTo(location: { position?: IPosition; bounds?: IPosition[] }): void {
    if (!this._viewer) {
      console.error('Cannot pan map: viewer not initialized');
      return;
    }

    // Temporarily disable camera inputs during animation
    this._viewer.scene.screenSpaceCameraController.enableInputs = false;

    const camera = this._viewer.camera;
    const scene = this._viewer.scene;

    // Case 1: Pan to a single position
    if (location.position) {
      const { latitude, longitude, altitude } = location.position;
      const height = altitude ? altitude + 2500 : 3000;

      // Create destination point
      const destination = Cartesian3.fromDegrees(longitude, latitude, height);

      // Fly to the position with smooth animation
      camera.flyTo({
        destination,
        orientation: {
          heading: 0, // North-facing heading
          pitch: -Math.PI / 2, // Perpendicular to surface (-90 degrees in radians)
          roll: 0, // No roll
        },
        duration: 1.5,
        easingFunction: (time) => {
          // Custom easing function for smoother start/end
          return time < 0.5
            ? 2 * time * time // Ease in
            : -1 + (4 - 2 * time) * time; // Ease out
        },
        complete: () => {
          // Re-enable camera inputs when animation completes
          this._viewer.scene.screenSpaceCameraController.enableInputs = true;
          scene.requestRender();
        },
      });
    }
    // Case 2: Pan to bounds (multiple positions defining an area)
    else if (location.bounds && location.bounds.length > 0) {
      // Create orientation object maintaining current heading and pitch
      const orientation = {
        heading: 0, // North-facing heading
        pitch: -Math.PI / 2, // Perpendicular to surface (-90 degrees in radians)
        roll: 0, // No roll
      };

      // Use the flyToRectangle helper method
      this.flyToCoordinatesRectangle(
        location.bounds,
        orientation,
        1.5, // Duration in seconds
        () => {
          // Re-enable camera inputs when animation completes
          this._viewer.scene.screenSpaceCameraController.enableInputs = true;
          scene.requestRender();
        }
      );
    } else {
      // If neither position nor bounds provided, re-enable inputs
      this._viewer.scene.screenSpaceCameraController.enableInputs = true;
    }
  }

  /**
   * Reset the camera to face North
   * This maintains the current location, height, and tilt (pitch) but sets heading to 0 (North)
   */
  resetToNorth(): void {
    if (!this._viewer) return;

    const camera = this._viewer.camera;
    const scene = this._viewer.scene;

    // Get current camera position
    const currentPosition = camera.positionCartographic;
    const longitude = CesiumMath.toDegrees(currentPosition.longitude);
    const latitude = CesiumMath.toDegrees(currentPosition.latitude);
    const height = currentPosition.height;

    // Preserve the current pitch to maintain the current view angle
    const currentPitch = camera.pitch;

    // Create a new orientation with heading = 0 (North) but keep current pitch
    const northOrientation = {
      heading: 0,
      pitch: currentPitch,
      roll: 0,
    };

    // Update last known 3D orientation if in 3D mode
    if (scene.mode === SceneMode.SCENE3D) {
      this._lastThreeDOrientation = {
        ...this._lastThreeDOrientation,
        heading: 0, // Only update the heading, preserve the existing pitch
      };
    }

    // Fly to the same position but with North orientation
    camera.flyTo({
      destination: Cartesian3.fromDegrees(longitude, latitude, height),
      orientation: northOrientation,
      duration: 1, // Quick, smooth transition
      easingFunction: (time) => {
        // Smooth easing function for orientation changes
        return time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;
      },
      complete: () => {
        scene.requestRender();
      },
    });
  }

  /**
   * Get current camera heading in degrees (0 = North, clockwise)
   * @returns Current heading in degrees (0-360)
   */
  getCurrentHeading(): number {
    if (!this._viewer?.camera) return 0;

    const heading = CesiumMath.toDegrees(this._viewer.camera.heading);
    // Normalize to 0-360 degrees
    return ((heading % 360) + 360) % 360;
  }

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
  } {
    if (!this._viewer?.camera) {
      return {
        heading: 0,
        pitch: 0,
        roll: 0,
        headingDegrees: 0,
        pitchDegrees: 0,
        rollDegrees: 0,
      };
    }

    const camera = this._viewer.camera;
    const heading = camera.heading;
    const pitch = camera.pitch;
    const roll = camera.roll;

    const headingDegrees = CesiumMath.toDegrees(heading);
    const pitchDegrees = CesiumMath.toDegrees(pitch);
    const rollDegrees = CesiumMath.toDegrees(roll);

    return {
      heading,
      pitch,
      roll,
      headingDegrees: ((headingDegrees % 360) + 360) % 360,
      pitchDegrees,
      rollDegrees,
    };
  }

  /**
   * Helper method to calculate distance between two geographic points (Haversine formula)
   * @param point1 First geographic point
   * @param point2 Second geographic point
   * @returns Distance in meters
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = (point1.latitude * Math.PI) / 180;
    const lat2 = (point2.latitude * Math.PI) / 180;
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    // Haversine formula
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Flies to a rectangle containing all coordinates with the specified orientation
   * @param coordinates Array of objects with longitude, latitude properties
   * @param orientation The camera orientation to maintain (heading, pitch)
   * @param duration Flight duration in seconds (default: 3)
   * @param completeCallback Optional callback function to execute when flight completes
   */
  private flyToCoordinatesRectangle(
    coordinates: IPosition[],
    orientation: { heading: number; pitch: number; roll?: number },
    duration = 3,
    completeCallback?: () => void
  ): void {
    if (!this._viewer) {
      console.error('Cannot fly to rectangle: viewer not initialized');
      return;
    }

    if (!coordinates || coordinates.length === 0) {
      console.warn('Empty coordinates array provided');
      return;
    }

    // If there's only one coordinate, fly directly to it
    if (coordinates.length === 1) {
      const coord = coordinates[0];
      const height = coord.altitude || 1500; // Default height

      this._viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          coord.longitude,
          coord.latitude,
          height
        ),
        orientation: {
          heading: orientation.heading || this._viewer.camera.heading,
          pitch: orientation.pitch || this._viewer.camera.pitch,
          roll: orientation.roll || 0.0,
        },
        duration: duration,
        complete: completeCallback,
      });
      return;
    }

    // 1. Find the bounds of all coordinates
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;

    coordinates.forEach((coord) => {
      west = Math.min(west, coord.longitude);
      south = Math.min(south, coord.latitude);
      east = Math.max(east, coord.longitude);
      north = Math.max(north, coord.latitude);
    });

    // Calculate the diagonal distance between the furthest points
    const diagonalDistance = this.calculateDistance(
      { latitude: south, longitude: west },
      { latitude: north, longitude: east }
    );
    // Calculate padding as exactly 20% of the diagonal distance
    // This ensures consistent proportional padding regardless of distance
    const PADDING_RATIO = 0.2; // 20% of diagonal distance
    const MIN_PADDING = 0.001; // Minimum padding value

    // Calculate padding based on the diagonal distance
    // Convert meters to approximate degrees (111.32 km per degree at equator)
    const calculatedPadding = (diagonalDistance * PADDING_RATIO) / 111320;

    // Ensure padding is at least the minimum value
    const padding = Math.max(calculatedPadding, MIN_PADDING);

    // Apply the calculated padding
    west -= padding;
    south -= padding;
    east += padding;
    north += padding;

    // 2. Create a Cesium rectangle
    const rectangle = Rectangle.fromDegrees(west, south, east, north);

    // 3. Fly to the rectangle with the specified orientation
    this._viewer.camera.flyTo({
      destination: rectangle,
      orientation: {
        heading: orientation.heading || this._viewer.camera.heading,
        pitch: orientation.pitch || this._viewer.camera.pitch,
        roll: orientation.roll || 0.0,
      },
      duration: duration,
      complete: completeCallback,
    });
  }

  private async removeDefaultSkyObjects() {
    const scene = this.viewer.scene;
    const globe = scene.globe;
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
    }

    if (scene.skyBox) {
      scene.skyBox.show = false;
    }

    if (scene.fog) {
      scene.fog.enabled = false;
    }

    globe.enableLighting = true;
    scene.globe.dynamicAtmosphereLighting = false;
    scene.globe.dynamicAtmosphereLightingFromSun = false;

    if (scene.sun) {
      scene.sun.show = false;
    }

    if (scene.moon) {
      scene.moon.show = false;
    }
  }

  private changeLightSourceOnCameraPos() {
    const positionCartographic =
      this.viewer.camera.positionCartographic.clone();
    const newPosition = Cartesian3.fromRadians(
      positionCartographic.longitude,
      positionCartographic.latitude,
      positionCartographic.height
    );
    const newDirection = Cartesian3.normalize(newPosition, new Cartesian3());
    this.viewer.scene.light = new DirectionalLight({
      direction: Cartesian3.negate(newDirection, new Cartesian3()),
      intensity: 0.8,
    });
  }

  private trackCameraOrientation() {
    if (!this.cameraEventListenerRemoveCallback) {
      this.cameraEventListenerRemoveCallback =
        this.viewer.camera.changed.addEventListener(
          this.changeLightSourceOnCameraPos.bind(this)
        );
    }
  }

  async replaceCesiumSearchButtonSvg(nativeElement: HTMLElement) {
    const searchButton = nativeElement.querySelector(
      CLASSES.SEARCH_BUTTON_CLASS
    );
    if (searchButton) {
      const existingSvg = searchButton.querySelector('svg');
      if (existingSvg) {
        searchButton.removeChild(existingSvg);
      }

      const svgPath = svgUtils.createSvgUrl(SEARCH_SVG);

      try {
        const response = await fetch(svgPath);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const svgText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.documentElement;

        searchButton.appendChild(svgElement);
      } catch (error) {
        console.error('Failed to fetch or parse SVG:', error);
      }
    }
  }

  private handleCursor(): void {
    if (!this._viewer || !this._viewer.container) {
      console.error(
        "Can't set up cursor handlers: viewer or container not initialized"
      );
      return;
    }

    // Try different selector approaches to find the correct element
    const cesiumContainerElement = this._viewer.container as HTMLElement;

    if (cesiumContainerElement) {
      cesiumContainerElement.style.cursor = 'grab';

      if (!this._eventsManager) {
        console.error("Can't register events: events manager not initialized");
        return;
      }
      this._eventsManager.onGlobalEvent(IEventType.LEFT_DOWN, () => {
        cesiumContainerElement.style.cursor = 'grabbing';
      });

      this._eventsManager.onGlobalEvent(IEventType.LEFT_UP, () => {
        cesiumContainerElement.style.cursor = 'grab';
      });

      this._eventsManager.onGlobalEvent(IEventType.MOUSE_HOVER, (event) => {
        cesiumContainerElement.style.cursor = event.entityId
          ? 'pointer'
          : 'grab';
      });
    }
  }

  private async applyDatabaseBaseMapConfiguration(
    config: BaseMapConfiguration
  ): Promise<void> {
    try {
      this._baseMapConfiguration = config;
      this._currentBaseMapType = config.base_map_type;
      this._currentBaseMapConfig = config.base_map_config;

      // Use Bing as fallback if base_map_type is not provided
      const baseMapType = config.base_map_type || BaseMapType.BING;

      this._currentBaseMapProvider =
        CesiumMapService.providerFactory.getProviderWithConfig(
          baseMapType,
          config.base_map_config
        );

      let imageryProvider;
      if (this._currentBaseMapProvider instanceof SimpleBaseMapProvider) {
        imageryProvider =
          await this._currentBaseMapProvider.createImageryProvider(
            MapLayers.AERIAL
          );
      } else if (config.base_map_config) {
        imageryProvider =
          await this._currentBaseMapProvider?.createImageryProvider(
            config.base_map_config
          );
      } else {
        throw new Error('Invalid provider configuration state');
      }

      const layersToRemove =
        this.viewer.imageryLayers.length > 0
          ? [this.viewer.imageryLayers.get(0)]
          : [];

      layersToRemove.forEach((layer) => {
        this.viewer.imageryLayers.remove(layer);
      });

      const newLayer = new ImageryLayer(imageryProvider, {
        brightness: this.getLayerBrightness(MapLayers.AERIAL),
      });

      this.viewer.imageryLayers.add(newLayer, 0);
    } catch (error) {
      console.error('Failed to apply base map configuration:', error);
    }
  }

  private getLayerBrightness(layer: MapLayers): number {
    switch (layer) {
      case MapLayers.ROAD:
        return 0.8;
      default:
        return 1.1;
    }
  }
}
