import {
  BillboardGraphics,
  BoundingSphere,
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Cartographic,
  ConstantPositionProperty,
  ConstantProperty,
  DistanceDisplayCondition,
  Ellipsoid,
  Entity,
  HeadingPitchRange,
  HeightReference,
  JulianDate,
  Math as CesiumMath,
  NearFarScalar,
  SceneMode,
  VerticalOrigin,
  Viewer,
} from 'cesium';
import { v4 } from 'uuid';

import { IEventType, IMapEventData, IPosition } from '@map/public/contracts';

import {
  DEFAULT_BASE_MARKER_STYLE,
  DragAltitudeMode,
  ENTITY_ZOOM_LEVEL,
  IBaseMarker,
  IEvent,
  IEventsManager,
  IMarkerConfig,
  MapEventEmitter,
  MarkerStyle,
  VerticalOriginEnum,
} from '@map/private/contracts';

import {
  CesiumEventType,
  CesiumKeyboardEventData,
  ICesiumMapService,
} from '@map/private/map-providers/cesium/types';
import { isKeyboardPressEvent } from '@hardware-controls/keyboard';
import {
  cssColorToColor,
  getHeightReference,
  handleMovementWithHeightReference,
  PickedEntity,
  positionToCartesian,
  calculateKeyboardMovement,
} from '@map/private/map-providers/cesium/utils';
import { ViewType } from '@map/public/core';

/**
 * CesiumBaseMarker implements the IBaseMarker interface for Cesium
 * Focused solely on billboard rendering without labels or other entity types
 */
export class CesiumBaseMarker implements IBaseMarker {
  // Core properties
  protected _id: string;
  protected _position: IPosition;
  protected _style: MarkerStyle;
  protected _visible = true;
  protected _draggable = false;

  protected _rotateWithCamera = false;
  private _keyboardControllable = false;

  // Cesium entities
  protected entity: Entity | null = null;

  // Services and utilities
  protected mapServices: ICesiumMapService;
  protected viewer: Viewer;
  protected eventsManager: IEventsManager;
  protected eventEmitter: MapEventEmitter;

  // Dragging and height manipulation state
  private _dragging = false;
  private _heightDragging = false;
  private _originalEntityPosition: Cartesian3 | null = null;
  private _heightChange = 0;

  // Altitude preservation state for drag operations
  private _originalDragAltitude: number | null = null;
  private _originalDragAltitudeMode: DragAltitudeMode | null = null;

  // Scene change listener reference for cleanup
  private _sceneChangeHandler: ((eventData: IMapEventData) => void) | null =
    null;

  /**
   * Creates a new CesiumBaseMarker instance
   * @param mapServices Services for accessing the map, viewer, and events
   * @param marker Configuration including position, style, and interaction settings
   */
  constructor(mapServices: ICesiumMapService, marker: IMarkerConfig) {
    this._id = `cesium-base-marker-${v4()}`;
    this._position = marker.position;
    this._style = {
      ...structuredClone(DEFAULT_BASE_MARKER_STYLE),
      ...marker.style,
    } as MarkerStyle;

    // Explicitly ensure draggable flag is set based on config
    this._draggable = marker.isDraggable === true;

    this.mapServices = mapServices;
    this.viewer = mapServices.viewer;
    this.eventsManager = mapServices.eventsManager;
    this.eventEmitter = new MapEventEmitter();

    // Create the marker entity
    this.createEntity();

    // Register scene mode change listener and adjust for current scene mode
    this.registerSceneChangeListener();
    this.adjustForSceneMode(this.viewer.scene.mode);

    // IMPORTANT: Set up drag handling AFTER entity creation
    // Set up interaction if needed
    if (this._draggable) {
      this.setDraggable(true);
    }

    // Set up keyboard control if configured
    if (marker.isKeyboardControllable) {
      this.setKeyboardControllable(true);
    }
  }

  /** Get unique identifier */
  get id(): string {
    return this._id;
  }

  /**
   * Get the event emitter instance (read-only)
   * @returns A read-only instance of the event emitter
   */
  getEventEmitter(): MapEventEmitter {
    return this.eventEmitter.getListenOnlyInstance();
  }

  // Readonly properties
  get position(): IPosition {
    return structuredClone(this._position);
  }

  get style(): MarkerStyle {
    return structuredClone(this._style);
  }

  get visible(): boolean {
    return this._visible;
  }

  get draggable(): boolean {
    return this._draggable;
  }

  get rotateWithCamera(): boolean {
    return this._rotateWithCamera;
  }

  get keyboardControllable(): boolean {
    return this._keyboardControllable;
  }

  /**
   * Set the position of the marker
   * @param position The new position
   */
  setPosition(position: IPosition): void {
    if (
      !position ||
      typeof position.latitude !== 'number' ||
      typeof position.longitude !== 'number'
    ) {
      return;
    }

    // Store old position for event
    const oldPosition = { ...this._position };

    // Update internal position state
    this._position = { ...position };

    try {
      if (this.entity) {
        // Convert position to Cartesian3
        const cartesian = positionToCartesian(position);

        if (!cartesian) {
          return;
        }

        // Force an immediate update to the entity position
        try {
          // Update the entity position directly
          this.entity.position = new ConstantPositionProperty(cartesian);

          // Ensure the update is properly applied
          // Entity position updated

          // Validate the update
          if (this.entity.position && this.entity.position.getValue) {
            this.entity.position.getValue(JulianDate.now());
          }
        } catch (positionError) {
          // Position error occurred
          console.warn('Error setting position:', positionError);
        }
      }
    } catch (error) {
      // Error in setting position
      console.warn('Error in setPosition:', error);
    }

    // Emit position change event
    this.eventEmitter.emit({
      type: IEventType.MOUSE_MOVE,
      id: this._id,
      data: {
        position: this._position,
        previousPosition: oldPosition,
      },
    } as IEvent);
  }

  /**
   * Update the marker style
   * @param style Partial style updates to apply
   */
  setStyle(style: Partial<MarkerStyle>): void {
    this._style = { ...this._style, ...style };
    if (!this.entity || !this.entity.billboard) return;

    const billboard = this.entity.billboard;

    // Update individual properties if provided
    if (style.color) {
      billboard.color = new ConstantProperty(cssColorToColor(style.color));
    }

    if (style.scale !== undefined) {
      billboard.scale = new ConstantProperty(style.scale);
    }

    if (style.rotation !== undefined) {
      this.setRotation(style.rotation);
    }

    if (style.rotateWithCamera !== undefined) {
      this.enableCameraRotation(style.rotateWithCamera);
    }

    if (style.pixelOffset) {
      billboard.pixelOffset = new ConstantProperty(
        new Cartesian2(style.pixelOffset.x, style.pixelOffset.y)
      );
    }

    if (style.eyeOffset) {
      billboard.eyeOffset = new ConstantProperty(
        new Cartesian3(style.eyeOffset.x, style.eyeOffset.y, style.eyeOffset.z)
      );
    }

    if (style.verticalOrigin !== undefined) {
      billboard.verticalOrigin = new ConstantProperty(
        this.convertVerticalOrigin(style.verticalOrigin)
      );
    }

    if (style.horizontalOrigin !== undefined) {
      billboard.horizontalOrigin = new ConstantProperty(style.horizontalOrigin);
    }

    if (style.disableDepthTestDistance !== undefined) {
      billboard.disableDepthTestDistance = new ConstantProperty(
        this._style.disableDepthTestDistance
          ? Number.POSITIVE_INFINITY
          : 4800000
      );
    }

    if (style.heightReference) {
      billboard.heightReference = new ConstantProperty(
        getHeightReference(style.heightReference)
      );
    }

    if (style.distanceDisplayCondition) {
      billboard.distanceDisplayCondition = new ConstantProperty(
        new DistanceDisplayCondition(
          style.distanceDisplayCondition.near,
          style.distanceDisplayCondition.far
        )
      );
    }

    if (style.scaleByDistance) {
      billboard.scaleByDistance = new ConstantProperty(
        new NearFarScalar(1.5e2, 1.0, 3.0e6, 0.1)
      );
    }
  }

  /**
   * Update the marker image
   * @param imageUrl URL or data URI of the new image
   */
  updateImage(imageUrl: string): void {
    if (this.entity && this.entity.billboard) {
      this.entity.billboard.image = new ConstantProperty(imageUrl);
    }
    this._style.image = imageUrl;
  }

  /**
   * Set the rotation angle for the marker
   * @param angle Rotation angle in degrees
   */
  setRotation(angle: number): void {
    if (!this.entity || !this.entity.billboard) return;

    const radians = (angle * Math.PI) / 180;

    if (this._rotateWithCamera) {
      // Use callback property for camera-relative rotation
      this.entity.billboard.rotation = new CallbackProperty(() => {
        const cameraHeading = this.viewer.camera.heading;
        return cameraHeading + radians;
      }, false);
    } else {
      // Use constant property for fixed rotation
      this.entity.billboard.rotation = new ConstantProperty(radians);
    }

    this._style.rotation = angle;
  }

  /**
   * Enable or disable camera-relative rotation
   * @param enable When true, marker rotates with camera
   */
  enableCameraRotation(enable: boolean): void {
    this._rotateWithCamera = enable;
    this._style.rotateWithCamera = enable;

    // Re-apply current rotation with the new setting
    this.setRotation(this._style.rotation || 0);
  }

  /**
   * Set the visibility of the marker
   * @param visible New visibility state
   */
  setVisibility(visible: boolean): void {
    // Setting marker visibility
    this._visible = visible;

    if (this.entity) {
      // Entity reference for visibility
      this.entity.show = visible;
    }
  }

  setClickable(clickable: boolean): void {
    if (clickable) {
      this.registerClickEvents();
    } else {
      this.unregisterClickEvents();
    }
  }

  setHoverable(hoverable: boolean): void {
    if (hoverable) {
      this.registerHoverEvents();
    } else {
      this.unregisterHoverEvents();
    }
  }

  /**
   * Set whether the marker is draggable
   * @param draggable New draggable state
   */
  setDraggable(draggable: boolean): void {
    // IMPORTANT: Even if the state is already set, always update the events
    // DO NOT return early if this._draggable === draggable

    // Set the internal flag
    this._draggable = draggable;

    // Regardless of previous state, register or unregister events
    if (draggable) {
      try {
        // Always register events when draggable is true
        this.registerDragEvents();
        this.setKeyboardFocus(true);
      } catch (error) {
        console.warn('~ CesiumBaseMarker ~ setDraggable ~ error:', error);
      }
    } else {
      this.unregisterDragEvents();
      this.setKeyboardFocus(false);
    }

    // Verify the state after update
  }

  /**
   * Set keyboard controllable state for this marker
   * @param enabled true to enable keyboard control, false to disable
   */
  setKeyboardControllable(enabled: boolean): void {
    if (!this.eventsManager) return;

    if (this._keyboardControllable === enabled) {
      return;
    }

    this._keyboardControllable = enabled;

    // Register or unregister keyboard events
    if (this._keyboardControllable) {
      this.registerKeyboardEvents();
      this.eventsManager.setKeyboardFocus?.(this._id, true);
    } else {
      this.eventsManager.setKeyboardFocus?.(this._id, false);
      this.unregisterKeyboardEvents();
    }
  }

  /**
   * Request keyboard focus for this marker
   */
  setKeyboardFocus(focused: boolean): void {
    if (!this.eventsManager || !this.keyboardControllable) return;
    this.eventsManager.setKeyboardFocus?.(this._id, focused);
  }

  /**
   * Register a listener for scene change events
   * @private
   */
  private registerSceneChangeListener(): void {
    if (this.mapServices.eventsManager) {
      this._sceneChangeHandler = (eventData: IMapEventData) => {
        this.onSceneChanged(eventData);
      };
      this.mapServices.eventsManager.onGlobalEvent(
        IEventType.SCENE_CHANGED,
        this._sceneChangeHandler
      );
    }
  }

  /**
   * Unregister scene change listener
   * @private
   */
  private unregisterSceneChangeListener(): void {
    if (this.mapServices.eventsManager && this._sceneChangeHandler) {
      this.mapServices.eventsManager.offGlobalEvent(
        IEventType.SCENE_CHANGED,
        this._sceneChangeHandler
      );
      this._sceneChangeHandler = null;
    }
  }

  /**
   * Handle scene change events
   * @param eventData Event data containing the scene mode
   * @private
   */
  private onSceneChanged(eventData: IMapEventData): void {
    if (eventData.sceneMode !== undefined) {
      this.adjustForSceneMode(eventData.sceneMode);
    }
  }

  /**
   * Adjust marker properties based on scene mode
   * In 2D mode, height reference doesn't work properly, so we use NONE
   * In 3D mode, we restore the original height reference from style
   * @param sceneMode The current scene mode (2D or 3D)
   * @private
   */
  private adjustForSceneMode(sceneMode: SceneMode): void {
    if (this.entity && this.entity.billboard) {
      const heightRef = this._style?.heightReference;

      if (sceneMode === SceneMode.SCENE2D) {
        // In 2D mode, use NONE so the marker uses absolute altitude
        // This ensures visibility since height reference doesn't work properly in 2D
        this.entity.billboard.heightReference = new ConstantProperty(
          HeightReference.NONE
        );
      } else {
        // In 3D mode, restore the original height reference
        this.entity.billboard.heightReference = new ConstantProperty(
          getHeightReference(heightRef)
        );
      }
    }
  }

  /**
   * Clean up resources and destroy the marker
   */
  destroy(): void {
    // Unregister scene change listener
    this.unregisterSceneChangeListener();

    // Unregister ALL events
    this.unregisterClickEvents();
    this.unregisterDragEvents();
    this.unregisterHoverEvents();
    this.unregisterKeyboardEvents();
    this.setKeyboardFocus(false);

    // Reset height manipulation state
    this._heightDragging = false;
    this._originalEntityPosition = null;
    this._heightChange = 0;

    // Reset altitude preservation state
    this._originalDragAltitude = null;
    this._originalDragAltitudeMode = null;
    this._keyboardControllable = false;

    // Remove entities from viewer
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
  }

  /**
   * Pan the map view to center on this marker entity
   */
  panTo(): void {
    if (!this.entity) return;

    const entityPos = this.entity?.position?.getValue(JulianDate.now());
    if (!entityPos) return;

    let entityElevation =
      this.viewer.scene.globe.getHeight(
        Cartographic.fromCartesian(entityPos)
      ) || 0;

    entityElevation =
      !entityElevation || entityElevation < 0
        ? ENTITY_ZOOM_LEVEL.MARKER
        : entityElevation + ENTITY_ZOOM_LEVEL.MARKER;

    const currentHeading = this.viewer.camera.heading;
    const currentPitch = this.viewer.camera.pitch;
    this.viewer.flyTo(this.entity, {
      offset: new HeadingPitchRange(
        currentHeading,
        currentPitch,
        entityElevation
      ),
      duration: 3,
    });
  }

  /**
   * Set the camera view to the marker's position
   * Maintains current camera orientation (heading, pitch, roll)
   * Positions the camera 500m away from the marker
   */
  setViewTo() {
    // Convert marker position to Cartesian3
    const markerPosition = positionToCartesian(this._position);

    // Create a bounding sphere around the marker
    const boundingSphere = new BoundingSphere(markerPosition, 0);

    // Position the camera 500m away from the marker
    this.viewer.camera.flyToBoundingSphere(boundingSphere, {
      offset: new HeadingPitchRange(
        this.viewer.camera.heading,
        this.viewer.camera.pitch,
        500 // 500 meters away
      ),
    });
  }

  /**
   * Reset height manipulation state - useful when switching to 2D mode
   */
  public resetHeightManipulationState(): void {
    if (this._heightDragging) {
      this._heightDragging = false;
      this._originalEntityPosition = null;
      this._heightChange = 0;
    }
  }

  /**
   * Store original altitude when drag starts for preservation
   * @private
   */
  private _storeOriginalAltitudeForDrag(): void {
    if (!this.entity) return;

    // Get current drag altitude mode
    const dragAltitudeMode = this.mapServices.currentDragAltitudeMode;

    // Get current position
    const currentPosition = this.entity.position?.getValue(JulianDate.now());
    if (!currentPosition) return;

    // Convert to cartographic for altitude extraction
    const cartographic =
      Ellipsoid.WGS84.cartesianToCartographic(currentPosition);

    if (dragAltitudeMode === DragAltitudeMode.AGL) {
      // For AGL mode, store the AGL altitude (current altitude - terrain height)
      // Use SYNCHRONOUS terrain height for drag operations (faster, less accurate)
      const terrainQueryPosition = {
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        longitude: CesiumMath.toDegrees(cartographic.longitude),
        altitude: 0,
      };

      const terrainHeight =
        this.mapServices.getTerrainHeight(terrainQueryPosition);
      this._originalDragAltitude = cartographic.height - terrainHeight;
    } else {
      // For HAE mode (default), store the HAE altitude directly
      this._originalDragAltitude = cartographic.height;
    }

    this._originalDragAltitudeMode = dragAltitudeMode;
  }

  /**
   * Restore original altitude after drag ends
   * @private
   */
  private async _restoreOriginalAltitudeAfterDrag(): Promise<void> {
    if (
      !this.entity ||
      this._originalDragAltitude === null ||
      !this._originalDragAltitudeMode
    ) {
      return;
    }

    try {
      // Get current position
      const currentPosition = this.entity.position?.getValue(JulianDate.now());
      if (!currentPosition) {
        return;
      }

      // Store the dragged position as previousPosition for the event
      const currentCartographic =
        Ellipsoid.WGS84.cartesianToCartographic(currentPosition);
      const draggedPosition = {
        latitude: CesiumMath.toDegrees(currentCartographic.latitude),
        longitude: CesiumMath.toDegrees(currentCartographic.longitude),
        altitude: currentCartographic.height,
      };

      // Convert to cartographic
      const cartographic = currentCartographic;

      let restoredHAEAltitude: number;

      if (this._originalDragAltitudeMode === DragAltitudeMode.AGL) {
        // For final restoration, use HIGH ACCURACY async terrain sampling
        try {
          const terrainQueryPosition = {
            latitude: CesiumMath.toDegrees(cartographic.latitude),
            longitude: CesiumMath.toDegrees(cartographic.longitude),
            altitude: 0,
          };

          const terrainHeight =
            await this.mapServices.getTerrainHeightMostSampled(
              terrainQueryPosition
            );
          restoredHAEAltitude = this._originalDragAltitude + terrainHeight;
        } catch (error) {
          console.error(
            'Error getting high-accuracy terrain height, falling back to sync:',
            error
          );
          // Fallback to synchronous method if async fails
          const terrainHeight = this.mapServices.getTerrainHeight({
            latitude: CesiumMath.toDegrees(cartographic.latitude),
            longitude: CesiumMath.toDegrees(cartographic.longitude),
            altitude: 0,
          });
          restoredHAEAltitude = this._originalDragAltitude + terrainHeight;
        }
      } else {
        // For HAE mode, use the original altitude directly
        restoredHAEAltitude = this._originalDragAltitude;
      }

      // Update cartographic with restored altitude
      cartographic.height = restoredHAEAltitude;

      // Convert back to cartesian and update entity
      const restoredPosition =
        Ellipsoid.WGS84.cartographicToCartesian(cartographic);

      this.entity.position = new ConstantPositionProperty(restoredPosition);

      // Update internal position state
      this._position = {
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        longitude: CesiumMath.toDegrees(cartographic.longitude),
        altitude: cartographic.height,
      };

      // CRITICAL: Emit POSITION_CHANGED event after restoration to notify external consumers
      this.eventEmitter.emit({
        type: IEventType.POSITION_CHANGED,
        id: this._id,
        data: {
          position: this._position, // Restored position with correct altitude
          previousPosition: draggedPosition, // Position before restoration (with wrong altitude)
        },
      } as IEvent);
    } catch (error) {
      console.error('Error restoring original altitude:', error);
    } finally {
      // Clear stored altitude data
      this._originalDragAltitude = null;
      this._originalDragAltitudeMode = null;
    }
  }

  // ================ PRIVATE HELPER METHODS ================

  /**
   * Create the marker billboard entity
   */
  private createEntity(): void {
    // Marker style configuration

    // Convert position to Cartesian3
    const cartesianPosition = positionToCartesian(this._position);

    // Prepare billboard graphics
    const billboardGraphics = this.createBillboardGraphics();

    // Create the entity
    this.entity = new Entity({
      id: this._id,
      position: new ConstantPositionProperty(cartesianPosition),
      billboard: billboardGraphics,
      show: this._visible,
    });

    // Add to viewer
    this.viewer.entities.add(this.entity);
  }

  /**
   * Create billboard graphics with current style
   * @returns Configured BillboardGraphics instance
   */
  private createBillboardGraphics(): BillboardGraphics {
    // Create rotation property based on style settings
    const rotationProperty = this.createRotationProperty();

    // Get height reference enum value
    const heightRef = getHeightReference(this._style.heightReference);

    // Create billboard graphics with style properties
    return new BillboardGraphics({
      image: new ConstantProperty(this._style.image!),
      scale: new ConstantProperty(this._style.scale!),
      color: this._style.color
        ? new ConstantProperty(cssColorToColor(this._style.color))
        : undefined,
      rotation: rotationProperty,

      // Use style or default for heightReference
      heightReference: new ConstantProperty(heightRef),

      // Use style or default for verticalOrigin - convert enum to Cesium value
      verticalOrigin: new ConstantProperty(
        this.convertVerticalOrigin(this._style.verticalOrigin!)
      ),

      horizontalOrigin: new ConstantProperty(this._style.horizontalOrigin!),

      pixelOffset: this._style.pixelOffset
        ? new ConstantProperty(
            new Cartesian2(this._style.pixelOffset.x, this._style.pixelOffset.y)
          )
        : undefined,

      eyeOffset: this._style.eyeOffset
        ? new ConstantProperty(
            new Cartesian3(
              this._style.eyeOffset.x,
              this._style.eyeOffset.y,
              this._style.eyeOffset.z
            )
          )
        : undefined,

      // Use style or default for distanceDisplayCondition
      distanceDisplayCondition: this._style.distanceDisplayCondition
        ? new ConstantProperty(
            new DistanceDisplayCondition(
              this._style.distanceDisplayCondition.near,
              this._style.distanceDisplayCondition.far
            )
          )
        : undefined,

      // Use style or default for scaleByDistance
      scaleByDistance: this._style.scaleByDistance
        ? new ConstantProperty(new NearFarScalar(1.5e2, 1.0, 3.0e6, 0.1))
        : undefined,

      disableDepthTestDistance: this._style.disableDepthTestDistance
        ? Number.POSITIVE_INFINITY
        : 4800000,
    });
  }

  /**
   * Create rotation property based on marker settings
   * @returns Appropriate Property for rotation
   */
  private createRotationProperty(): CallbackProperty | ConstantProperty {
    const angle = (this._style.rotation! * Math.PI) / 180;

    if (this._rotateWithCamera) {
      // Create callback property that updates with camera heading
      return new CallbackProperty(() => {
        const cameraHeading = this.viewer.camera.heading;
        return cameraHeading + angle;
      }, false);
    } else {
      // Create constant property for fixed rotation
      return new ConstantProperty(angle);
    }
  }

  /**
   * Convert our VerticalOriginEnum to Cesium's VerticalOrigin
   * @param origin The VerticalOriginEnum value
   * @returns Cesium VerticalOrigin value
   */
  private convertVerticalOrigin(origin?: VerticalOriginEnum): number {
    if (origin === undefined) return VerticalOrigin.CENTER;

    switch (origin) {
      case VerticalOriginEnum.TOP:
        return VerticalOrigin.TOP;
      case VerticalOriginEnum.BOTTOM:
        return VerticalOrigin.BOTTOM;
      case VerticalOriginEnum.CENTER:
      default:
        return VerticalOrigin.CENTER;
    }
  }

  /**
   * Register event handlers for click and hover (always available)
   */
  private registerClickEvents(): void {
    if (!this.entity) {
      console.error(
        '[CesiumBaseMarker] Cannot register click events - entity is null'
      );
      return;
    }

    try {
      // Register entity for click events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.MOUSE_CLICK,
        this._id
      );

      // Subscribe to click events
      const emitter = this.eventsManager.getEventEmitter();
      emitter.addListener(
        `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
        this.handleClick
      );
    } catch (error) {
      console.error(
        '[CesiumBaseMarker] Error registering click events:',
        error
      );
    }
  }

  /**
   * Unregister event handlers for click and hover
   */
  private unregisterClickEvents(): void {
    if (!this.entity) return;

    // Unregister click events
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_CLICK,
      this._id
    );

    // Remove click event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_CLICK}:${this._id}`,
        this.handleClick
      );
  }

  /**
   * Register event handlers for hover (always available)
   */
  private registerHoverEvents(): void {
    if (!this.entity) return;

    // Register hover events
    this.eventsManager.registerEntityForEvent(
      CesiumEventType.MOUSE_HOVER,
      this._id
    );

    // Subscribe to hover events
    const emitter = this.eventsManager.getEventEmitter();
    emitter.addListener(
      `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
      this.handleHover
    );
  }

  /**
   * Unregister event handlers for hover (always available)
   */
  private unregisterHoverEvents(): void {
    if (!this.entity) return;

    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_HOVER,
      this._id
    );

    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_HOVER}:${this._id}`,
        this.handleHover
      );
  }

  /**
   * Register event handlers for dragging
   */
  private registerDragEvents(): void {
    if (!this.entity) {
      console.error('Cannot register drag events - entity is null');
      return;
    }

    // Registering drag events for marker

    try {
      // First unregister any existing drag handlers to avoid duplicates
      this.unregisterDragEvents();

      // Register entity for DRAG events only
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.LEFT_DOWN,
        this._id
      );
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.MOUSE_DRAG,
        this._id
      );
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.LEFT_UP,
        this._id
      );

      // ALT key height manipulation events
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.ALT_PLUS_LEFT_DOWN,
        this._id
      );
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.ALT_PLUS_MOUSE_DRAG,
        this._id
      );
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.ALT_PLUS_LEFT_UP,
        this._id
      );

      // Subscribe to drag events
      const emitter = this.eventsManager.getEventEmitter();

      emitter.addListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.handleMouseDown
      );
      emitter.addListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this.handleMouseMove
      );
      emitter.addListener(
        `${CesiumEventType.LEFT_UP}:${this._id}`,
        this.handleMouseUp
      );

      // ALT key event handlers
      emitter.addListener(
        `${CesiumEventType.ALT_PLUS_LEFT_DOWN}:${this._id}`,
        this.handleAltMouseDown
      );
      emitter.addListener(
        `${CesiumEventType.ALT_PLUS_MOUSE_DRAG}:${this._id}`,
        this.handleAltMouseMove
      );
      emitter.addListener(
        `${CesiumEventType.ALT_PLUS_LEFT_UP}:${this._id}`,
        this.handleAltMouseUp
      );

      // Event handlers registered for entity
    } catch (error) {
      console.error('Error registering drag events:', error);
    }
  }

  /**
   * Register keyboard event handlers
   * Entity will receive KEY_PRESS events while focused
   */
  private registerKeyboardEvents(): void {
    if (!this.entity) {
      console.warn(
        '[CesiumBaseMarker] Cannot register keyboard events - entity is null'
      );
      return;
    }

    try {
      // Register for KEY_PRESS (continuous movement)
      this.eventsManager.registerEntityForEvent(
        CesiumEventType.KEY_PRESS,
        this._id
      );

      // Subscribe to KEY_PRESS events
      const emitter = this.eventsManager.getEventEmitter();
      emitter.addListener(
        `${CesiumEventType.KEY_PRESS}:${this._id}`,
        this.handleKeyPress
      );
    } catch (error) {
      console.warn(
        '[CesiumBaseMarker] Error registering keyboard events:',
        error
      );
    }
  }

  /**
   * Unregister keyboard event handlers
   */
  private unregisterKeyboardEvents(): void {
    if (!this.entity) return;

    // Unregister from events manager
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.KEY_PRESS,
      this._id
    );

    // Remove event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.KEY_PRESS}:${this._id}`,
        this.handleKeyPress
      );
  }

  /**
   * Unregister event handlers for dragging
   */
  private unregisterDragEvents(): void {
    if (!this.entity) return;

    // Unregister entity from regular drag events
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.LEFT_DOWN,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.MOUSE_DRAG,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.LEFT_UP,
      this._id
    );

    // Unregister entity from ALT key events
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.ALT_PLUS_LEFT_DOWN,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.ALT_PLUS_MOUSE_DRAG,
      this._id
    );
    this.eventsManager.unregisterEntityFromEvent(
      CesiumEventType.ALT_PLUS_LEFT_UP,
      this._id
    );

    // Remove regular drag event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.LEFT_DOWN}:${this._id}`,
        this.handleMouseDown
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.MOUSE_DRAG}:${this._id}`,
        this.handleMouseMove
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.LEFT_UP}:${this._id}`,
        this.handleMouseUp
      );

    // Remove ALT key event listeners
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.ALT_PLUS_LEFT_DOWN}:${this._id}`,
        this.handleAltMouseDown
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.ALT_PLUS_MOUSE_DRAG}:${this._id}`,
        this.handleAltMouseMove
      );
    this.eventsManager
      .getEventEmitter()
      .removeListener(
        `${CesiumEventType.ALT_PLUS_LEFT_UP}:${this._id}`,
        this.handleAltMouseUp
      );
  }

  /**
   * Handle mouse down event for dragging
   */
  private handleMouseDown = (): void => {
    if (!this._draggable) {
      return;
    }

    // Verify we have a valid entity before starting the drag operation
    if (!this.entity) {
      return;
    }

    // Set dragging flag
    this._dragging = true;

    // Store original altitude for preservation (now synchronous - no await needed)
    try {
      this._storeOriginalAltitudeForDrag();
    } catch (error) {
      console.error('Error storing original altitude for drag:', error);
    }

    this.eventEmitter.emit({
      type: IEventType.LEFT_DOWN,
      id: this._id,
      data: {
        position: this._position,
      },
    } as IEvent);
    // No need to emit any event on drag start
  };

  /**
   * Handle mouse move event for dragging
   */
  private handleMouseMove = (eventData: {
    position?: IPosition;
    screenPosition?: Cartesian2;
    endPosition?: { x: number; y: number };
    cartesian?: Cartesian3;
  }): void => {
    if (!this._draggable || !this._dragging) return;

    // Check for valid position data
    if (
      !eventData ||
      (!eventData.position &&
        !eventData.screenPosition &&
        !eventData.endPosition)
    ) {
      return;
    }

    const oldPosition = { ...this._position };

    try {
      if (this.entity && this.viewer) {
        // Get screen position from event data
        const screenPosition =
          eventData.screenPosition ||
          (eventData.endPosition
            ? new Cartesian2(eventData.endPosition.x, eventData.endPosition.y)
            : undefined);

        if (screenPosition) {
          // Create a properly formatted PickedEntity object
          const pickedEntity: PickedEntity = {
            id: {
              position: {
                getValue: (date: JulianDate) => {
                  const position = this.entity?.position?.getValue(date);
                  return position || new Cartesian3();
                },
              },
            },
            primitive: {
              heightReference: getHeightReference(this._style.heightReference!),
            },
          };

          const cartesian = handleMovementWithHeightReference(
            this.viewer,
            screenPosition,
            pickedEntity,
            this.viewer.scene.mode
          );

          if (cartesian) {
            // Update the entity position with the calculated cartesian
            this.entity.position = new ConstantPositionProperty(cartesian);

            // Update internal position state
            const cartographic =
              Ellipsoid.WGS84.cartesianToCartographic(cartesian);
            this._position = {
              latitude: CesiumMath.toDegrees(cartographic.latitude),
              longitude: CesiumMath.toDegrees(cartographic.longitude),
              altitude: cartographic.height,
            };

            // Emit position change event
            this.eventEmitter.emit({
              type: IEventType.POSITION_CHANGED,
              id: this._id,
              data: {
                position: this._position,
                previousPosition: oldPosition,
              },
            } as IEvent);
          }
        } else if (eventData.cartesian) {
          // Fallback to the raw cartesian if no screen position
          this.entity.position = new ConstantPositionProperty(
            eventData.cartesian
          );

          // Update position from cartesian
          const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
            eventData.cartesian
          );
          this._position = {
            latitude: CesiumMath.toDegrees(cartographic.latitude),
            longitude: CesiumMath.toDegrees(cartographic.longitude),
            altitude: cartographic.height,
          };

          // Emit position change
          this.eventEmitter.emit({
            type: IEventType.POSITION_CHANGED,
            id: this._id,
            data: {
              position: this._position,
              previousPosition: oldPosition,
            },
          } as IEvent);
        } else if (eventData.position) {
          // Last fallback - use provided position data
          const position = eventData.position;

          // Convert to cartesian
          const cartesian = Cartesian3.fromDegrees(
            position.longitude,
            position.latitude,
            position.altitude || 0
          );

          this.entity.position = new ConstantPositionProperty(cartesian);
          this._position = { ...position };

          // Emit position change
          this.eventEmitter.emit({
            type: IEventType.POSITION_CHANGED,
            id: this._id,
            data: {
              position: this._position,
              previousPosition: oldPosition,
            },
          } as IEvent);
        }
      }
    } catch (error) {
      console.error('Error updating marker position:', error);
    }
  };

  /**
   * Handle mouse up event for dragging
   */
  private handleMouseUp = (eventData: { position: IPosition }): void => {
    // Handle regular dragging
    if (this._draggable && this._dragging) {
      const position = eventData.position;
      this._position = position;

      // Restore original altitude if preservation is enabled (async, but don't wait for it)
      this._restoreOriginalAltitudeAfterDrag().catch((error) => {
        console.error('Error restoring original altitude after drag:', error);
      });

      // End the dragging operation
      this._dragging = false;

      // Emit LEFT_UP event for regular drag completion
      this.eventEmitter.emit({
        type: IEventType.LEFT_UP,
        id: this._id,
        data: {
          position: this._position,
        },
      } as IEvent);
    }
    // Also emit LEFT_UP after Alt height manipulation
    else if (this._draggable && this._heightDragging) {
      // Emit LEFT_UP event for Alt drag completion (fallback)
      this.eventEmitter.emit({
        type: IEventType.LEFT_UP,
        id: this._id,
        data: {
          position: this._position,
        },
      } as IEvent);
    }
  };

  /**
   * Handle click event for the marker
   */
  private handleClick = (eventData: { position: IPosition }): void => {
    // Emit click event regardless of drag state
    this.eventEmitter.emit({
      type: IEventType.CLICK,
      id: this._id,
      data: {
        position: this._position,
      },
    } as IEvent);
  };

  /**
   * Handle hover event for the marker
   */
  private handleHover = (eventData: { position: IPosition }): void => {
    this.eventEmitter.emit({
      type: IEventType.MOUSE_HOVER,
      id: this._id,
      data: {
        position: this._position,
      },
    } as IEvent);
  };

  /**
   * Handle ALT+mouse down event for height manipulation
   */
  private handleAltMouseDown = (): void => {
    if (!this._draggable) return;

    // Only allow height manipulation in 3D mode
    if (this.mapServices.currentView !== ViewType.ThreeD) {
      return;
    }

    // Verify we have a valid entity before starting height manipulation
    if (!this.entity) return;

    // Set height manipulation flags
    this._heightDragging = true;

    // Store original position for reference
    if (this.entity.position) {
      const position = this.entity.position.getValue(
        this.viewer.clock.currentTime
      );
      this._originalEntityPosition = position || null;
      this._heightChange = 0;
    }

    // Emit event to indicate start of height manipulation
    this.eventEmitter.emit({
      type: IEventType.ALT_PLUS_LEFT_DOWN,
      id: this._id,
      data: {
        position: { ...this._position },
      },
    } as IEvent);
  };

  /**
   * Handle ALT+mouse move event for height manipulation
   */
  private handleAltMouseMove = (eventData: {
    movement?: { startPosition?: Cartesian2; endPosition?: Cartesian2 };
  }): void => {
    if (
      !this._draggable ||
      !this._heightDragging ||
      !this._originalEntityPosition
    )
      return;

    // Only allow height manipulation in 3D mode
    if (this.mapServices.currentView !== ViewType.ThreeD) {
      return;
    }

    // We need the movement event with startPosition and endPosition
    const movement = eventData.movement;
    if (!movement || !movement.endPosition) return;

    try {
      // Calculate camera distance for scaling
      const cameraPosition = this.viewer.camera.position;
      const distance = Cartesian3.distance(
        cameraPosition,
        this._originalEntityPosition
      );

      // Calculate height adjustment based on mouse movement delta
      const deltaY =
        (movement.endPosition?.y || 0) - (movement.startPosition?.y || 0);
      const scalingFactor = 0.00099 * distance; // Using exact factor from reference
      const heightAdjustment = -1 * deltaY * scalingFactor;

      // Accumulate height change
      this._heightChange += heightAdjustment;

      // Apply height change to original position
      const cartographicPos = Cartographic.fromCartesian(
        this._originalEntityPosition
      );
      cartographicPos.height += this._heightChange;

      // Create new position with updated height
      const finalCart = Cartesian3.fromRadians(
        cartographicPos.longitude,
        cartographicPos.latitude,
        cartographicPos.height
      );

      // Update entity position
      if (finalCart && this.entity) {
        this.entity.position = new ConstantPositionProperty(finalCart);

        // Update internal position state
        this._position = {
          latitude: CesiumMath.toDegrees(cartographicPos.latitude),
          longitude: CesiumMath.toDegrees(cartographicPos.longitude),
          altitude: cartographicPos.height,
        };

        // Emit position change event with height change info
        this.eventEmitter.emit({
          type: IEventType.POSITION_CHANGED,
          id: this._id,
          data: {
            position: this._position,
            heightChange: this._heightChange,
          },
        } as IEvent);
      }
    } catch (error) {
      console.error('Error during height manipulation:', error);
    }
  };

  /**
   * Handle ALT+mouse up event for completing height manipulation
   */
  private handleAltMouseUp = (): void => {
    if (!this._draggable || !this._heightDragging) return;

    this._heightDragging = false;
    this._originalEntityPosition = null;
    this._heightChange = 0;

    // Only allow height manipulation in 3D mode
    if (this.mapServices.currentView !== ViewType.ThreeD) {
      return;
    }

    // Emit final position after height manipulation
    this.eventEmitter.emit({
      type: IEventType.ALT_PLUS_LEFT_UP,
      id: this._id,
      data: {
        position: { ...this._position },
        heightChange: this._heightChange,
      },
    } as IEvent);
  };

  /**
   * Handle keyboard press (continuous movement while keys are held)
   * Receives KEY_PRESS events at configured frequency (default: 60 FPS)
   */
  private handleKeyPress = (eventData: CesiumKeyboardEventData): void => {
    const keyboardEvent = eventData.keyboardEvent;

    // Type guard to ensure we have a press event with pressedKeys
    if (!isKeyboardPressEvent(keyboardEvent)) {
      return;
    }

    const pressedKeys = keyboardEvent.pressedKeys;
    const deltaTime = keyboardEvent.deltaTime;

    // Calculate movement delta using shared utility
    const movement = calculateKeyboardMovement(pressedKeys, deltaTime);

    // Skip if no movement
    if (
      movement.lat === 0 &&
      movement.lng === 0 &&
      movement.alt === 0 &&
      movement.rotation === 0
    ) {
      return;
    }

    // Apply movement to current position
    const newPosition: IPosition = {
      latitude: this._position.latitude + movement.lat,
      longitude: this._position.longitude + movement.lng,
      altitude: (this._position.altitude || 0) + movement.alt,
    };

    const cartesian = positionToCartesian(newPosition);

    if (this.entity) {
      this.entity.position = new ConstantPositionProperty(cartesian);
    }

    const oldPosition = { ...this._position };
    this._position = { ...newPosition };

    this.eventEmitter.emit({
      type: IEventType.POSITION_CHANGED,
      id: this._id,
      data: {
        position: newPosition,
        previousPosition: oldPosition,
      },
    } as IEvent);

    // Mark event as handled (prevents app from processing these keys)
    keyboardEvent.markHandled();
    keyboardEvent.preventDefault();
  };
}
